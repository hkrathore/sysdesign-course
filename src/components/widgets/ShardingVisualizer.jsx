import React, { useState, useMemo } from "react";
import { Database, Hash, Ruler, BookOpen, Flame, Scale } from "lucide-react";

// --- deterministic 32-bit hash (FNV-1a), no crypto, no Math.random ----------
// Render-path must be deterministic: the widget SSRs then hydrates via
// client:load, so any randomness would cause a hydration mismatch.
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0; // unsigned 32-bit
}

// Fixed pool of keys. Each has a numeric `id` so range partitioning has a
// natural ordering to bucket on, and a string `key` so hashing has something
// real to chew (a good hash flattens these; charCodeAt(0) alone would not).
const KEY_COUNT = 24;
const KEYS = Array.from({ length: KEY_COUNT }, (_, i) => ({
  id: i,
  key: `user:${1000 + i * 37}`, // spread ids so range boundaries are non-trivial
}));

// The "celebrity"/hot band: a CONTIGUOUS run of keys near the top of the
// key-space. This is the honest model, range only hot-spots when the heavy
// keys are adjacent in key order (e.g. monotonic recent IDs, or one viral
// region). Sprinkling skew over random keys would NOT overload a range shard.
const HOT_BAND_START = 18; // ids 18..23 are the hot band
const HOT_WEIGHT = 14; // each hot key pulls ~14× a cold key
const COLD_WEIGHT = 1;

// Stable dark-tech palette shared with the other course widgets.
const SHARD_COLORS = [
  "#2dd4a7", "#38bdf8", "#e8a13a", "#f87171",
  "#a78bfa", "#f472b6", "#facc15", "#34d399",
];

const STRATEGIES = {
  range: {
    label: "Range",
    icon: Ruler,
    rule: "shard = bucket(key.id) by contiguous id boundaries",
    blurb: "Keys sorted by id, cut into N adjacent ranges. Great for range scans, terrible when the hot keys are adjacent.",
  },
  hash: {
    label: "Hash",
    icon: Hash,
    rule: "shard = hash(key) mod N",
    blurb: "A good hash scatters adjacent keys everywhere. Spreads a distributed hot band evenly, but kills range scans.",
  },
  directory: {
    label: "Directory",
    icon: BookOpen,
    rule: "shard = lookup_table[key]  (explicit, rebalanceable)",
    blurb: "An indirection layer assigns each key to the least-loaded shard. Most flexible, but adds a hop and a SPOF.",
  },
};

const PRESETS = {
  "Uniform load": { skewed: false },
  "Skewed (celebrity / monotonic)": { skewed: true },
};

const weightOf = (k, skewed) =>
  !skewed ? 1 : k.id >= HOT_BAND_START ? HOT_WEIGHT : COLD_WEIGHT;

// --- assignment functions: each returns shardIndex per key -------------------

// RANGE: sort by id, cut into N contiguous, equal-COUNT buckets. The hot band
// (top ids) lands together in the last bucket -> that shard heats up.
function assignRange(keys, n) {
  const sorted = [...keys].sort((a, b) => a.id - b.id);
  const per = Math.ceil(sorted.length / n);
  const map = new Map();
  const bounds = Array.from({ length: n }, () => ({ lo: Infinity, hi: -Infinity }));
  sorted.forEach((k, i) => {
    const s = Math.min(n - 1, Math.floor(i / per));
    map.set(k.id, s);
    bounds[s].lo = Math.min(bounds[s].lo, k.id);
    bounds[s].hi = Math.max(bounds[s].hi, k.id);
  });
  return { map, bounds };
}

// HASH: shard = fnv1a(key) mod N. Deterministic scatter.
function assignHash(keys, n) {
  const map = new Map();
  keys.forEach((k) => map.set(k.id, fnv1a(k.key) % n));
  return { map };
}

// DIRECTORY: greedy least-loaded assignment (a balancer the lookup table
// records). Processed heaviest-first so it actively counteracts skew and the
// table stays flat. The cost is the table itself: an extra hop + a SPOF.
function assignDirectory(keys, n, skewed) {
  const order = [...keys].sort(
    (a, b) => weightOf(b, skewed) - weightOf(a, skewed) || a.id - b.id
  );
  const load = new Array(n).fill(0);
  const map = new Map();
  order.forEach((k) => {
    let best = 0;
    for (let s = 1; s < n; s++) if (load[s] < load[best]) best = s;
    map.set(k.id, best);
    load[best] += weightOf(k, skewed);
  });
  return { map };
}

export default function ShardingVisualizer() {
  const [strategy, setStrategy] = useState("range");
  const [n, setN] = useState(4);
  const [skewed, setSkewed] = useState(false);

  const activePreset = skewed ? "Skewed (celebrity / monotonic)" : "Uniform load";
  const applyPreset = (name) => setSkewed(PRESETS[name].skewed);

  const Strat = STRATEGIES[strategy];

  const { shards, maxLoad, avgLoad, assignMap, bounds, dirTable } = useMemo(() => {
    let res;
    if (strategy === "range") res = assignRange(KEYS, n);
    else if (strategy === "hash") res = assignHash(KEYS, n);
    else res = assignDirectory(KEYS, n, skewed);

    const shards = Array.from({ length: n }, (_, i) => ({
      i,
      load: 0,
      keys: [],
      hotKeys: 0,
    }));
    KEYS.forEach((k) => {
      const s = res.map.get(k.id);
      const w = weightOf(k, skewed);
      shards[s].load += w;
      shards[s].keys.push(k);
      if (skewed && k.id >= HOT_BAND_START) shards[s].hotKeys += 1;
    });
    const total = shards.reduce((a, s) => a + s.load, 0);
    const maxLoad = Math.max(1, ...shards.map((s) => s.load));
    const avgLoad = total / n;

    // a compact directory table view: list hot keys + a sample of cold keys
    const dirTable = KEYS.map((k) => ({
      key: k.key,
      shard: res.map.get(k.id),
      hot: skewed && k.id >= HOT_BAND_START,
    }));

    return { shards, maxLoad, avgLoad, assignMap: res.map, bounds: res.bounds, dirTable };
  }, [strategy, n, skewed]);

  // heat = load / avg : 1 = balanced (green), >>1 = overloaded (red)
  const heatColor = (load) => {
    const r = avgLoad > 0 ? load / avgLoad : 1;
    if (r <= 1.15) return "#2dd4a7"; // balanced
    if (r <= 1.6) return "#facc15"; // warming
    if (r <= 2.4) return "#e8a13a"; // hot
    return "#f87171"; // overloaded
  };

  const peakRatio = avgLoad > 0 ? maxLoad / avgLoad : 1;
  const balanced = peakRatio <= 1.2;

  return (
    <div className="not-content w-full max-w-3xl mx-auto font-mono" style={{ background: "transparent", color: "var(--w-text)" }}>
      <div className="rounded-xl border p-5 shadow-2xl" style={{ background: "var(--w-bg)", borderColor: "var(--w-border)" }}>
        {/* header */}
        <div className="flex items-center gap-2 mb-1">
          <Database size={20} style={{ color: "#2dd4a7" }} />
          <h2 className="text-lg font-bold tracking-tight" style={{ color: "var(--w-heading)" }}>Partitioning & Hot-Spotting</h2>
        </div>
        <p className="text-xs mb-4" style={{ color: "var(--w-muted)" }}>
          Same {KEY_COUNT} keys, three strategies. Flip to a skewed load and watch which scheme overloads a single shard.
        </p>

        {/* strategy toggle */}
        <div className="flex flex-wrap items-stretch gap-2 mb-3">
          {Object.entries(STRATEGIES).map(([id, s]) => {
            const Icon = s.icon;
            const on = strategy === id;
            return (
              <button
                key={id}
                onClick={() => setStrategy(id)}
                className={`h-full flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border transition ${
                  on
                    ? "border-emerald-400 bg-emerald-400/15 text-emerald-300"
                    : "border-[var(--w-border)] bg-[var(--w-panel)] text-[var(--w-text)] hover:border-[var(--w-border)]"
                }`}
              >
                <Icon size={13} />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* presets (uniform vs skewed) */}
        <div className="flex flex-wrap items-stretch gap-2 mb-4">
          {Object.keys(PRESETS).map((name) => {
            const on = activePreset === name;
            return (
              <button
                key={name}
                onClick={() => applyPreset(name)}
                className={`h-full flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border transition ${
                  on
                    ? "border-amber-400 bg-amber-400/15 text-amber-200"
                    : "border-[var(--w-border)] bg-[var(--w-panel)] text-[var(--w-text)] hover:border-[var(--w-border)]"
                }`}
              >
                {PRESETS[name].skewed ? <Flame size={13} /> : <Scale size={13} />}
                {name}
              </button>
            );
          })}
        </div>

        {/* N slider */}
        <div className="mb-5">
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: "var(--w-muted)" }}>Number of shards (N)</span>
            <span className="font-semibold" style={{ color: "var(--w-heading)" }}>{n}</span>
          </div>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={n}
            onChange={(e) => setN(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-400 cursor-pointer"
            aria-label="Number of shards"
          />
        </div>

        {/* shard bars */}
        <div className="rounded-lg border p-4 mb-3" style={{ background: "var(--w-panel)", borderColor: "var(--w-border-soft)" }}>
          <div className="flex items-end justify-between gap-2 sm:gap-3 h-44">
            {shards.map((s) => {
              const c = heatColor(s.load);
              const hPct = Math.max(4, (s.load / maxLoad) * 100);
              return (
                <div key={s.i} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                  <div className="text-[10px] font-semibold mb-1" style={{ color: c }}>
                    {s.load}
                  </div>
                  <div className="w-full flex flex-col justify-end" style={{ height: "100%" }}>
                    <div
                      className="w-full rounded-t transition-all duration-500 relative"
                      style={{
                        height: `${hPct}%`,
                        background: c,
                        opacity: 0.9,
                        boxShadow: s.load / avgLoad > 2.4 ? `0 0 12px ${c}` : "none",
                      }}
                    >
                      {s.hotKeys > 0 && (
                        <span className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full">
                          <Flame size={12} style={{ color: "#f87171" }} />
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] mt-1 truncate w-full text-center" style={{ color: "var(--w-muted)" }}>
                    shard {s.i}
                  </div>
                  <div className="text-[9px] truncate w-full text-center" style={{ color: "var(--w-faint)" }}>
                    {s.keys.length} keys
                  </div>
                </div>
              );
            })}
          </div>
          {/* avg reference line caption */}
          <div className="flex items-center justify-between mt-3 text-[11px]">
            <span style={{ color: "var(--w-faint)" }}>
              bar height &amp; color = relative load (avg = {avgLoad.toFixed(1)} units)
            </span>
            <span
              className="font-semibold px-2 py-0.5 rounded"
              style={{
                color: balanced ? "#2dd4a7" : "#f87171",
                background: balanced ? "rgba(45,212,167,0.1)" : "rgba(248,113,113,0.1)",
              }}
            >
              peak/avg = {peakRatio.toFixed(2)}× {balanced ? "balanced" : "HOT-SPOT"}
            </span>
          </div>
        </div>

        {/* governing rule + per-strategy detail */}
        <div className="rounded-lg border p-4 mb-3" style={{ background: "var(--w-panel)", borderColor: "var(--w-border-soft)" }}>
          <div className="flex items-center gap-1.5 mb-1.5" style={{ color: SHARD_COLORS[0] }}>
            <Strat.icon size={14} />
            <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--w-muted)" }}>
              {Strat.label} partitioning, mapping rule
            </span>
          </div>
          <code className="block text-sm font-bold mb-2" style={{ color: "var(--w-heading)" }}>{Strat.rule}</code>
          <p className="text-[11px] leading-snug mb-3" style={{ color: "var(--w-muted)" }}>{Strat.blurb}</p>

          {/* concrete mapping view, per strategy */}
          {strategy === "range" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 items-stretch gap-2">
              {bounds.map((b, i) =>
                b.hi >= b.lo ? (
                  <div key={i} className="h-full rounded border p-2" style={{ background: "var(--w-panel)", borderColor: "var(--w-border-soft)" }}>
                    <div className="text-[10px]" style={{ color: "var(--w-faint)" }}>shard {i}</div>
                    <div className="text-xs font-semibold" style={{ color: SHARD_COLORS[i % SHARD_COLORS.length] }}>
                      id [{b.lo}-{b.hi}]
                    </div>
                  </div>
                ) : (
                  <div key={i} className="h-full rounded border p-2" style={{ background: "var(--w-panel)", borderColor: "var(--w-border-soft)" }}>
                    <div className="text-[10px]" style={{ color: "var(--w-faint)" }}>shard {i}</div>
                    <div className="text-xs" style={{ color: "var(--w-faint)" }}>empty</div>
                  </div>
                )
              )}
            </div>
          )}

          {strategy === "hash" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
              {KEYS.slice(0, 8).map((k) => {
                const s = assignMap.get(k.id);
                const hot = skewed && k.id >= HOT_BAND_START;
                return (
                  <div key={k.id} className="flex items-center justify-between text-[11px]">
                    <span className={`flex items-center gap-1 ${hot ? "text-amber-300" : "text-[var(--w-muted)]"}`}>
                      {hot && <Flame size={10} className="shrink-0" />}{k.key}
                    </span>
                    <span style={{ color: "var(--w-faint)" }}>
                      → fnv1a % {n} ={" "}
                      <span className="font-semibold" style={{ color: SHARD_COLORS[s % SHARD_COLORS.length] }}>
                        {s}
                      </span>
                    </span>
                  </div>
                );
              })}
              <div className="text-[10px] sm:col-span-2 mt-0.5" style={{ color: "var(--w-faint)" }}>…{KEY_COUNT - 8} more keys, same rule</div>
            </div>
          )}

          {strategy === "directory" && (
            <div>
              <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "var(--w-faint)" }}>lookup table (key → shard)</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 max-h-32 overflow-auto pr-1">
                {dirTable.map((row) => (
                  <div key={row.key} className="flex items-center justify-between text-[11px]">
                    <span className={`flex items-center gap-1 ${row.hot ? "text-amber-300" : "text-[var(--w-muted)]"}`}>
                      {row.hot && <Flame size={10} className="shrink-0" />}{row.key}
                    </span>
                    <span className="font-semibold" style={{ color: SHARD_COLORS[row.shard % SHARD_COLORS.length] }}>
                      s{row.shard}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* trade-off / cost callout per strategy */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-stretch gap-2 text-[11px] mb-4">
          <Cost
            c="#38bdf8"
            t="Range"
            on={strategy === "range"}
            s="Cheap, ordered scans. Cost: adjacent hot keys (recent IDs, a viral region) all land on one shard → that shard melts."
          />
          <Cost
            c="#2dd4a7"
            t="Hash"
            on={strategy === "hash"}
            s="Flattens a distributed hot band. Cost: no range scans, and a SINGLE celebrity key still pins to one shard (fix: key-splitting / suffix sharding)."
          />
          <Cost
            c="#e8a13a"
            t="Directory"
            on={strategy === "directory"}
            s="Rebalances freely, even under skew. Cost: an extra lookup hop on every request + the table is a SPOF/bottleneck (must cache & replicate it)."
          />
        </div>

        {/* closing interpretation, ties to the skew toggle */}
        <p className="text-[11px] leading-relaxed" style={{ color: "var(--w-faint)" }}>
          Flip to <span className="text-amber-300">Skewed</span>: under <span className="text-sky-300">range</span> the
          hot band stacks onto one shard, watch the <span className="text-rose-300">peak/avg</span> badge spike well past
          balanced (a classic hot-spot). <span className="text-emerald-300">Hash</span> scatters those same keys far flatter,
          and <span className="text-amber-300">directory</span> rebalances to near-flat, paying with the lookup hop.
          The Director-altitude point: pick the partition key for your <span style={{ color: "var(--w-text)" }}>access pattern</span>, then
          name how it fails (hot-spot vs lost locality vs lookup SPOF) and the mitigation, don't just say "we'll shard it."
        </p>
      </div>
    </div>
  );
}

function Cost({ c, t, s, on }) {
  return (
    <div
      className="h-full rounded-lg border p-2.5 transition"
      style={
        on
          ? { background: "var(--w-panel)", borderColor: "var(--w-border)" }
          : { background: "var(--w-panel)", borderColor: "var(--w-border-soft)" }
      }
    >
      <div className="font-semibold mb-0.5" style={{ color: c }}>
        {t}
        {on && <span className="font-normal" style={{ color: "var(--w-faint)" }}> · selected</span>}
      </div>
      <div className="leading-snug" style={{ color: "var(--w-muted)" }}>{s}</div>
    </div>
  );
}
