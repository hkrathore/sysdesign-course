import React, { useState, useEffect, useMemo } from "react";
import {
  Database,
  Layers,
  Play,
  Pause,
  StepForward,
  RotateCcw,
  Zap,
  AlertTriangle,
  ArrowRight,
  Server,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Caching write strategies, a single-writer simulator.
//   READ path is identical for all three strategies.
//   WRITE path is where they diverge (consistency / durability trade).
// Each key holds a monotonically increasing *version*, so cache/DB skew is a
// visible integer (cache v5 / db v3 == 2 versions of staleness).
// ---------------------------------------------------------------------------

const KEYS = ["A", "B", "C"]; // tiny hot keyspace

const STRATS = {
  aside: {
    name: "Cache-aside",
    sub: "lazy load",
    color: "#38bdf8", // sky
    // per-op latency model (ms): app must touch DB synchronously on every write
    writeMs: 10,
    read: "App checks cache. Hit → return. Miss → read DB, populate cache, return.",
    write: "App writes DB, then INVALIDATES (deletes) the cache key. Next read re-loads it.",
    consistency: "DB is source of truth. Cache can only be stale via a race, not by design.",
    durability: "Safe, every write hits the DB synchronously before ack.",
    verdict:
      "Most common default. Cost is an extra miss + lazy-load after every write to a key. No data-loss risk; cache and DB never drift in a single-writer flow.",
  },
  through: {
    name: "Write-through",
    sub: "sync both",
    color: "#2dd4a7", // emerald
    writeMs: 11,
    read: "App checks cache. Hit → return. Miss → read DB, populate cache, return.",
    write: "App writes cache AND DB on the critical path, both before ack.",
    consistency: "Cache always matches DB, reads-after-writes always HIT and are fresh.",
    durability: "Safe, DB written synchronously on every write.",
    verdict:
      "Best read freshness: a written key stays warm and correct, so cache-aside's post-write miss disappears. Cost is the highest write latency (cache + DB on the hot path) and cache churn for write-heavy, rarely-read keys.",
  },
  back: {
    name: "Write-back",
    sub: "write-behind",
    color: "#e8a13a", // amber
    writeMs: 1,
    read: "App checks cache. Hit → return. Miss → read DB, populate cache, return.",
    write: "App writes cache only, marks key DIRTY, acks. DB flushed later (async).",
    consistency: "Cache is ahead of DB until flush, DB serves stale versions to anyone reading it directly.",
    durability: "AT RISK, a crash before flush loses every dirty version.",
    verdict:
      "Best write latency (cache-speed acks) and absorbs write bursts. The trade is brutal: until the async flush, the DB is stale, and a crash loses all un-flushed writes. Only acceptable where the data is reconstructable or some loss is tolerable.",
  },
};

// Workloads: each is a deterministic op stream over the hot keyspace.
// op = { t: "r"|"w", k }.  Built once per preset so step + auto-run replay identically.
function buildStream(kind, n = 28) {
  const out = [];
  let seed = 7;
  const rnd = () => {
    // tiny LCG so streams are deterministic & reproducible across reset
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const key = () => KEYS[Math.floor(rnd() * KEYS.length)];
  for (let i = 0; i < n; i++) {
    if (kind === "readHeavy") {
      // ~90% reads, all three strategies converge here
      out.push({ t: rnd() < 0.1 ? "w" : "r", k: key() });
    } else if (kind === "writeHeavy") {
      // ~55% writes on a hot key, cache-aside pays a miss after each write
      out.push({ t: rnd() < 0.55 ? "w" : "r", k: key() });
    } else {
      // readAfterWrite: deliberate w,r,r cycles on one key at a time, the discriminator.
      // cache-aside invalidates on the write, so its first read MISSES then recovers;
      // write-through / write-back keep the key warm and stay at 100%.
      const cycle = Math.floor(i / 3);
      const k = KEYS[cycle % KEYS.length];
      const phase = i % 3;
      out.push({ t: phase === 0 ? "w" : "r", k });
    }
  }
  return out;
}

const PRESETS = {
  "Read-after-write (hot key)": "readAfterWrite",
  "Write-heavy": "writeHeavy",
  "Read-heavy": "readHeavy",
};

// latency model shown to the user
const CACHE_MS = 1;
const DB_MS = 10;

function freshState(strat, streamKind) {
  return {
    strat,
    streamKind,
    stream: buildStream(streamKind),
    cursor: 0,
    cache: {}, // key -> version (number) ; absent = not cached
    db: { A: 1, B: 1, C: 1 }, // key -> version persisted
    pending: { A: 1, B: 1, C: 1 }, // "true" latest version the app intends (cache or db)
    dirty: {}, // key -> true if cache holds an un-flushed write (write-back only)
    hits: 0,
    misses: 0,
    dbReads: 0,
    dbWrites: 0,
    lost: 0, // versions lost to crash
    flushes: 0,
    lastOp: null, // { t, k, result } for the log line
    latMs: 0, // latency of the last write op (for the bar)
  };
}

// PURE reducer: process the op at the cursor and return the next state.
// step() and auto-run share this exact path so they cannot diverge.
function advance(s) {
  if (s.cursor >= s.stream.length) return s; // stream exhausted
  const op = s.stream[s.cursor];
  const k = op.k;
  const n = { ...s, cache: { ...s.cache }, db: { ...s.db }, dirty: { ...s.dirty } };
  let result = "";
  let latMs = s.latMs;

  if (op.t === "r") {
    if (n.cache[k] !== undefined) {
      n.hits += 1;
      result = `HIT  ${k} → v${n.cache[k]} (cache)`;
    } else {
      n.misses += 1;
      n.dbReads += 1;
      n.cache[k] = n.db[k]; // lazy load
      result = `MISS ${k} → v${n.db[k]} (db→cache)`;
    }
  } else {
    // write, bump the app's intended version for this key
    const v = n.db[k] !== undefined ? Math.max(n.db[k], n.cache[k] ?? 0) + 1 : 1;
    if (s.strat === "aside") {
      n.db[k] = v;
      n.dbWrites += 1;
      delete n.cache[k]; // INVALIDATE
      latMs = DB_MS; // app waited on the DB
      result = `WRITE ${k}=v${v} → db, cache INVALIDATED`;
    } else if (s.strat === "through") {
      n.db[k] = v;
      n.cache[k] = v;
      n.dbWrites += 1;
      latMs = CACHE_MS + DB_MS; // both on critical path
      result = `WRITE ${k}=v${v} → cache + db (sync)`;
    } else {
      // write-back
      n.cache[k] = v;
      n.dirty[k] = true; // not yet in DB
      latMs = CACHE_MS; // acked at cache speed
      result = `WRITE ${k}=v${v} → cache (DIRTY, db=v${n.db[k]})`;
    }
  }

  n.lastOp = { ...op, result };
  n.latMs = latMs;
  n.cursor = s.cursor + 1;
  return n;
}

// Flush all dirty keys to the DB (write-back background writer firing).
function flush(s) {
  if (s.strat !== "back") return s;
  const dirtyKeys = Object.keys(s.dirty).filter((k) => s.dirty[k]);
  if (dirtyKeys.length === 0) return s;
  const n = { ...s, db: { ...s.db }, dirty: { ...s.dirty } };
  dirtyKeys.forEach((k) => {
    n.db[k] = n.cache[k];
    n.dirty[k] = false;
    n.dbWrites += 1;
  });
  n.flushes += 1;
  n.lastOp = { t: "f", k: "*", result: `FLUSH ${dirtyKeys.join(",")} → db` };
  return n;
}

// Crash: cache evaporates. Dirty (un-flushed) versions are LOST forever.
function crash(s) {
  const dirtyKeys = Object.keys(s.dirty).filter((k) => s.dirty[k]);
  let lostNow = 0;
  dirtyKeys.forEach((k) => {
    lostNow += (s.cache[k] ?? 0) - (s.db[k] ?? 0);
  });
  return {
    ...s,
    cache: {},
    dirty: {},
    lost: s.lost + Math.max(0, lostNow),
    lastOp: {
      t: "x",
      k: "*",
      result:
        lostNow > 0
          ? `CRASH, cache lost, ${lostNow} dirty version(s) GONE`
          : "CRASH, cache lost, 0 un-flushed writes (no loss)",
    },
  };
}

export default function CachingStrategiesSimulator() {
  const [stratKey, setStratKey] = useState("aside");
  const [presetName, setPresetName] = useState("Read-after-write (hot key)");
  const [state, setState] = useState(() =>
    freshState("aside", PRESETS["Read-after-write (hot key)"])
  );
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(600);

  const strat = STRATS[stratKey];
  const done = state.cursor >= state.stream.length;

  // Auto-run loop, functional setState dodges the stale-closure bug.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setState((prev) => {
        if (prev.cursor >= prev.stream.length) return prev;
        return advance(prev);
      });
    }, speed);
    return () => clearInterval(id);
  }, [running, speed]);

  // stop auto-run when the stream finishes
  useEffect(() => {
    if (done && running) setRunning(false);
  }, [done, running]);

  const reset = (sk = stratKey, pn = presetName) => {
    setRunning(false);
    setState(freshState(sk, PRESETS[pn]));
  };
  const selectStrat = (sk) => {
    setStratKey(sk);
    reset(sk, presetName);
  };
  const selectPreset = (pn) => {
    setPresetName(pn);
    reset(stratKey, pn);
  };

  const total = state.hits + state.misses;
  const hitRate = total === 0 ? 0 : (state.hits / total) * 100;
  const missRate = total === 0 ? 0 : (state.misses / total) * 100;
  const dirtyCount = Object.keys(state.dirty).filter((k) => state.dirty[k]).length;

  // staleness: how many versions the DB lags the cache, summed over keys
  const dbLag = useMemo(
    () =>
      KEYS.reduce((acc, k) => {
        const c = state.cache[k];
        const d = state.db[k];
        if (c === undefined || d === undefined) return acc;
        return acc + Math.max(0, c - d);
      }, 0),
    [state.cache, state.db]
  );

  const accent = strat.color;
  const maxLat = CACHE_MS + DB_MS; // 11ms, bar scale ceiling

  return (
    <div
      className="not-content w-full max-w-3xl mx-auto font-mono"
      style={{ background: "transparent", color: "var(--w-text)" }}
    >
      <div
        className="rounded-xl border p-5 shadow-2xl"
        style={{ background: "var(--w-bg)", borderColor: "var(--w-border)" }}
      >
        {/* header */}
        <div className="flex items-center gap-2 mb-1">
          <Layers size={20} style={{ color: accent }} />
          <h2 className="text-lg font-bold tracking-tight" style={{ color: "var(--w-heading)" }}>
            Caching Write Strategies
          </h2>
        </div>
        <p className="text-xs mb-4" style={{ color: "var(--w-muted)" }}>
          Single writer. Reads are identical across strategies, the{" "}
          <span style={{ color: "var(--w-text)" }}>write path</span> is the trade. Each key holds a{" "}
          <span style={{ color: "var(--w-text)" }}>version</span>; cache/DB skew is the staleness.
        </p>

        {/* strategy picker */}
        <div className="flex flex-wrap items-stretch gap-2 mb-3">
          {Object.entries(STRATS).map(([k, v]) => {
            const sel = k === stratKey;
            return (
              <button
                key={k}
                onClick={() => selectStrat(k)}
                className="h-full px-3 py-1.5 rounded-md text-xs border transition"
                style={
                  sel
                    ? { borderColor: v.color, background: `${v.color}26`, color: v.color }
                    : {
                        borderColor: "var(--w-border)",
                        background: "var(--w-panel)",
                        color: "var(--w-text)",
                      }
                }
              >
                {v.name} <span className="opacity-60">· {v.sub}</span>
              </button>
            );
          })}
        </div>

        {/* workload presets */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--w-faint)" }}>
            Workload
          </span>
          {Object.keys(PRESETS).map((name) => (
            <button
              key={name}
              onClick={() => selectPreset(name)}
              className={`px-2.5 py-1 rounded-md text-[11px] border transition ${
                presetName === name
                  ? "border-emerald-400 bg-emerald-400/15 text-emerald-300"
                  : "hover:border-[var(--w-border)]"
              }`}
              style={
                presetName === name
                  ? undefined
                  : {
                      borderColor: "var(--w-border)",
                      background: "var(--w-panel)",
                      color: "var(--w-text)",
                    }
              }
            >
              {name}
            </button>
          ))}
        </div>

        {/* transport controls */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <button
            onClick={() => setRunning((r) => !r)}
            disabled={done}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border transition disabled:opacity-40 disabled:cursor-not-allowed ${
              running
                ? "border-rose-400 bg-rose-400/15 text-rose-300"
                : "border-emerald-400 bg-emerald-400/15 text-emerald-300"
            }`}
          >
            {running ? <Pause size={13} /> : <Play size={13} />}
            {running ? "Pause" : "Auto-run"}
          </button>
          <button
            onClick={() => setState((prev) => advance(prev))}
            disabled={done || running}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border hover:border-[var(--w-border)] transition disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              borderColor: "var(--w-border)",
              background: "var(--w-panel)",
              color: "var(--w-text)",
            }}
          >
            <StepForward size={13} /> Step
          </button>
          {stratKey === "back" && (
            <button
              onClick={() => setState((prev) => flush(prev))}
              disabled={dirtyCount === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border border-amber-500/60 bg-amber-500/10 text-amber-300 hover:border-amber-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Server size={13} /> Flush ({dirtyCount})
            </button>
          )}
          <button
            onClick={() => setState((prev) => crash(prev))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border border-rose-500/60 bg-rose-500/10 text-rose-300 hover:border-rose-400 transition"
            title="Wipe the cache. Write-back loses un-flushed (dirty) versions."
          >
            <AlertTriangle size={13} /> Crash
          </button>
          <button
            onClick={() => reset()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border hover:border-[var(--w-border)] transition"
            style={{
              borderColor: "var(--w-border)",
              background: "var(--w-panel)",
              color: "var(--w-text)",
            }}
          >
            <RotateCcw size={13} /> Reset
          </button>
          <label
            className="flex items-center gap-1.5 text-[11px] ml-auto"
            style={{ color: "var(--w-muted)" }}
          >
            speed
            <input
              type="range"
              min={120}
              max={1100}
              step={20}
              value={1220 - speed}
              onChange={(e) => setSpeed(1220 - parseFloat(e.target.value))}
              className="w-20 accent-emerald-400 cursor-pointer"
              aria-label="auto-run speed"
            />
          </label>
        </div>

        {/* progress through the op stream */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] mb-1" style={{ color: "var(--w-faint)" }}>
            <span>
              op {Math.min(state.cursor, state.stream.length)} / {state.stream.length}
            </span>
            <span>{done ? "stream complete" : "running"}</span>
          </div>
          <div
            className="h-1.5 rounded overflow-hidden"
            style={{ background: "var(--w-slot)" }}
          >
            <div
              className="h-full rounded transition-all duration-300"
              style={{ width: `${(state.cursor / state.stream.length) * 100}%`, background: accent }}
            />
          </div>
        </div>

        {/* read / write path for the selected strategy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 items-stretch gap-3 mb-4">
          <PathCard kind="READ" color="var(--w-muted)" text={strat.read} />
          <PathCard kind="WRITE" color={accent} text={strat.write} />
        </div>

        {/* live op log */}
        <div
          className="rounded-lg border p-3 mb-4 min-h-[44px]"
          style={{ background: "var(--w-panel)", borderColor: "var(--w-border-soft)" }}
        >
          <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "var(--w-faint)" }}>
            last op
          </div>
          {state.lastOp ? (
            <div
              className="text-[13px] font-semibold flex items-center gap-2 flex-wrap"
              style={{
                color:
                  state.lastOp.t === "x"
                    ? "#fb7185"
                    : state.lastOp.t === "f"
                    ? "#e8a13a"
                    : state.lastOp.result.startsWith("HIT")
                    ? "#2dd4a7"
                    : state.lastOp.result.startsWith("MISS")
                    ? "#fb7185"
                    : "var(--w-text)",
              }}
            >
              {state.lastOp.result}
            </div>
          ) : (
            <div className="text-[13px]" style={{ color: "var(--w-faint)" }}>
              Step or auto-run to begin…
            </div>
          )}
        </div>

        {/* key state table, versions in cache vs db, dirtiness */}
        <div className="grid grid-cols-3 items-stretch gap-2 mb-5">
          {KEYS.map((k) => {
            const c = state.cache[k];
            const d = state.db[k];
            const isDirty = !!state.dirty[k];
            const skew = c !== undefined && d !== undefined ? c - d : 0;
            return (
              <div
                key={k}
                className={`h-full rounded-lg border p-2.5 text-center ${
                  isDirty ? "border-amber-500/50 bg-amber-500/5" : ""
                }`}
                style={
                  isDirty
                    ? undefined
                    : { background: "var(--w-panel)", borderColor: "var(--w-border-soft)" }
                }
              >
                <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "var(--w-faint)" }}>
                  key {k}
                </div>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span title="cache" className="flex items-center gap-1">
                    <Layers size={12} style={{ color: accent }} />
                    <span style={{ color: c === undefined ? "var(--w-faint)" : accent }}>
                      {c === undefined ? ", " : `v${c}`}
                    </span>
                  </span>
                  <span style={{ color: "var(--w-faint)" }}>/</span>
                  <span title="db" className="flex items-center gap-1">
                    <Database size={12} style={{ color: "var(--w-muted)" }} />
                    <span style={{ color: "var(--w-text)" }}>v{d}</span>
                  </span>
                </div>
                <div className="text-[10px] mt-1 h-3">
                  {isDirty ? (
                    <span className="text-amber-400">dirty +{skew}</span>
                  ) : skew > 0 ? (
                    <span className="text-amber-400/70">db lags {skew}</span>
                  ) : (
                    <span style={{ color: "var(--w-faint)" }}>in sync</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 items-stretch gap-2 mb-2">
          <Stat label="Hit rate" value={`${hitRate.toFixed(0)}%`} accent="#2dd4a7" big />
          <Stat label="Miss rate" value={`${missRate.toFixed(0)}%`} accent="#fb7185" big />
          <Stat label="DB reads" value={state.dbReads} accent="var(--w-muted)" />
          <Stat label="DB writes" value={state.dbWrites} accent="var(--w-muted)" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 items-stretch gap-2 mb-1">
          <Stat label="Hits" value={state.hits} accent="#2dd4a7" />
          <Stat label="Misses" value={state.misses} accent="#fb7185" />
          <Stat
            label="DB staleness"
            value={`${dbLag} ver`}
            accent={dbLag > 0 ? "#e8a13a" : "var(--w-muted)"}
            sub="cache ahead of db"
          />
          <Stat
            label="Data lost"
            value={`${state.lost} ver`}
            accent={state.lost > 0 ? "#fb7185" : "var(--w-muted)"}
            sub="crash before flush"
            danger={state.lost > 0}
          />
        </div>

        {/* governing formula */}
        <div className="text-[11px] mt-2 mb-4" style={{ color: "var(--w-faint)" }}>
          <span style={{ color: "var(--w-muted)" }}>hit rate</span> = hits / (hits + misses) &nbsp;·&nbsp;{" "}
          <span style={{ color: "var(--w-muted)" }}>staleness</span> = Σ max(0, v
          <sub>cache</sub> − v<sub>db</sub>) &nbsp;·&nbsp;{" "}
          <span style={{ color: "var(--w-muted)" }}>loss on crash</span> = Σ dirty versions
        </div>

        {/* write-latency comparison bars */}
        <div
          className="rounded-lg border p-4 mb-4"
          style={{ background: "var(--w-panel)", borderColor: "var(--w-border-soft)" }}
        >
          <div className="flex items-center gap-1.5 mb-1" style={{ color: accent }}>
            <Zap size={14} />
            <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--w-muted)" }}>
              Write latency on the critical path
            </span>
          </div>
          <div className="text-[10px] mb-3" style={{ color: "var(--w-faint)" }}>
            assume cache write = {CACHE_MS} ms, DB write = {DB_MS} ms (what the client waits for before ack)
          </div>
          <div className="space-y-2">
            {Object.entries(STRATS).map(([k, v]) => {
              const sel = k === stratKey;
              return (
                <div key={k} className="flex items-center gap-3">
                  <div
                    className="w-28 shrink-0 text-[11px] text-right"
                    style={{ color: sel ? v.color : "var(--w-muted)" }}
                  >
                    {v.name}
                  </div>
                  <div
                    className="flex-1 h-5 rounded overflow-hidden relative"
                    style={{ background: "var(--w-slot)" }}
                  >
                    <div
                      className="h-full rounded transition-all duration-500"
                      style={{
                        width: `${Math.max((v.writeMs / maxLat) * 100, 6)}%`,
                        background: v.color,
                        opacity: sel ? 0.95 : 0.4,
                      }}
                    />
                  </div>
                  <div
                    className="w-16 shrink-0 text-[11px] font-semibold text-right"
                    style={{ color: sel ? v.color : "var(--w-muted)" }}
                  >
                    ~{v.writeMs} ms
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* consistency / durability trade for the selected strategy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 items-stretch gap-3 mb-4">
          <TradeCard label="Consistency" text={strat.consistency} accent={accent} />
          <TradeCard
            label="Durability"
            text={strat.durability}
            accent={stratKey === "back" ? "#fb7185" : "#2dd4a7"}
          />
        </div>

        {/* verdict */}
        <div className="rounded-lg border p-4" style={{ borderColor: `${accent}55`, background: `${accent}0d` }}>
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowRight size={14} style={{ color: accent }} />
            <span className="text-[11px] uppercase tracking-wide" style={{ color: accent }}>
              Verdict, {strat.name}
            </span>
          </div>
          <p className="text-[12px] leading-relaxed" style={{ color: "var(--w-text)" }}>{strat.verdict}</p>
        </div>

        <p className="text-[11px] mt-4 leading-relaxed" style={{ color: "var(--w-faint)" }}>
          Interview move: tie the choice to the requirement. Read-heavy + tolerant of a brief post-write miss →{" "}
          <span className="text-sky-300">cache-aside</span>. Read-after-write must be fresh and warm →{" "}
          <span className="text-emerald-300">write-through</span>. Write-burst absorption with a durable, reconstructable
          source and acceptable loss window → <span className="text-amber-300">write-back</span>. Run the{" "}
          <span style={{ color: "var(--w-text)" }}>Write-heavy</span> preset, then hit{" "}
          <span className="text-rose-300">Crash</span> mid-stream to watch only write-back lose data.
        </p>
      </div>
    </div>
  );
}

function PathCard({ kind, color, text }) {
  return (
    <div
      className="h-full flex flex-col rounded-lg border p-3"
      style={{ background: "var(--w-panel)", borderColor: "var(--w-border-soft)" }}
    >
      <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color }}>
        {kind} path
      </div>
      <div className="text-[11px] leading-snug" style={{ color: "var(--w-text)" }}>{text}</div>
    </div>
  );
}

function Stat({ label, value, accent, sub, big, danger }) {
  return (
    <div
      className={`h-full flex flex-col rounded-lg border p-2.5 ${
        danger ? "border-rose-500/50 bg-rose-500/5" : ""
      }`}
      style={
        danger ? undefined : { background: "var(--w-panel)", borderColor: "var(--w-border-soft)" }
      }
    >
      <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--w-faint)" }}>{label}</div>
      <div className={`font-bold leading-tight ${big ? "text-2xl" : "text-lg"}`} style={{ color: accent }}>
        {value}
      </div>
      {sub && <div className="text-[9px] mt-0.5" style={{ color: "var(--w-faint)" }}>{sub}</div>}
    </div>
  );
}

function TradeCard({ label, text, accent }) {
  return (
    <div
      className="h-full flex flex-col rounded-lg border p-3"
      style={{ background: "var(--w-panel)", borderColor: "var(--w-border-soft)" }}
    >
      <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: accent }}>
        {label}
      </div>
      <div className="text-[11px] leading-snug" style={{ color: "var(--w-text)" }}>{text}</div>
    </div>
  );
}
