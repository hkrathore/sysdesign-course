import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Scale, Repeat, Weight, Activity, Hash, Play, Pause,
  StepForward, RotateCcw, Flame, Server as ServerIcon, AlertTriangle,
} from "lucide-react";

// --- deterministic 32-bit hash, no crypto, no Math.random -------------------
// FNV-1a accumulate + a MurmurHash3 finalizer. The avalanche in the finalizer
// scatters near-identical inputs ("c12","c13"); plain FNV-1a clusters them. The
// whole sim is a PURE function of a tick counter T, so the SSR render (T=0) and
// the client:load hydration agree, any Math.random would desync them. Every
// "random-looking" value below is hash32(i)-derived instead.
function mix32(h) {
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}
function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return mix32(h >>> 0);
}
const rand01 = (n) => hash32("r:" + n) / 0x100000000; // uniform-ish float in [0,1)

// Stable dark-tech palette shared with the other course widgets.
const SERVER_COLORS = [
  "#2dd4a7", "#38bdf8", "#e8a13a", "#f87171",
  "#a78bfa", "#f472b6", "#facc15", "#34d399",
];

// --- sim tunables (verified to produce a clear contrast; see notes below) ----
const MAX_N = 8;
const STREAM_LEN = 120;     // fixed request stream
const ADMIT_PER_TICK = 3;   // admit several requests per tick → active counts ~5-10 (stable signal)
const MAX_T = Math.ceil(STREAM_LEN / ADMIT_PER_TICK); // 40 ticks to drain the stream
const SLOW_SERVER = 1;      // under the skewed preset, server 1 is a DEGRADED backend...
const SLOW_FACTOR = 3;      // ...that holds every request 3× longer (the only thing LC can exploit)

// Per-server static weights (capacity) for weighted round-robin. Heterogeneous
// on purpose, else WRR == plain RR. Server 0 is a "big box" (3×). Sliced to N.
const SERVER_WEIGHTS = [3, 1, 2, 1, 2, 1, 1, 1];

// Client keys. The skewed preset funnels ~45% of the stream onto HOT_KEY. It is
// chosen so hash(HOT_KEY) % N never equals SLOW_SERVER for any N≤8, so the hash
// hot-spot and the slow-server effect always land on DIFFERENT bars (legible).
const CLIENT_KEYS = Array.from({ length: 16 }, (_, i) => `c${10 + i}`);
const HOT_KEY = "c12";

const ALGOS = {
  rr: {
    label: "Round-robin",
    icon: Repeat,
    rule: "server = i mod N",
    blurb: "Cycle servers in order, ignoring how busy each one is. Perfectly even request COUNTS, but blind to load: a slow or degraded server keeps getting its full share.",
  },
  wrr: {
    label: "Weighted RR",
    icon: Weight,
    rule: "server = expand([w₀×s₀, w₁×s₁, …])[i mod Σw]",
    blurb: "Round-robin over a list where server j appears wⱼ times. Sends proportionally more to bigger boxes, still blind to LIVE load and to a server that's silently struggling.",
  },
  lc: {
    label: "Least-connections",
    icon: Activity,
    rule: "server = argminⱼ active_connections[j]",
    blurb: "Route to whichever server has the fewest in-flight requests right now. The only algorithm here that adapts to uneven duration, it stops sending to a server whose requests are stacking up.",
  },
  hash: {
    label: "IP / key hash",
    icon: Hash,
    rule: "server = hash(key) mod N",
    blurb: "Same client key always maps to the same server (stickiness, sessions, cache affinity). But a skewed key distribution hot-spots one server, and changing N reshuffles every key.",
  },
};

const PRESETS = {
  "Uniform · healthy servers": { skewed: false },
  "Skewed key + 1 slow server": { skewed: true },
};

// --- the fixed request stream -------------------------------------------------
// Deterministic from the seed `i`. Each request carries a client `key` (drives
// hashing + stickiness) and a base `cost` in ticks (its service time on a HEALTHY
// server). Skewed preset funnels ~45% of traffic onto HOT_KEY so hash hot-spots.
function buildStream(skewed) {
  return Array.from({ length: STREAM_LEN }, (_, i) => {
    const a = rand01(i);
    const b = rand01(i + 7919);
    let cost, key;
    if (!skewed) {
      cost = 6 + Math.floor(a * 5); // 6..10, tight
      key = CLIENT_KEYS[Math.floor(b * CLIENT_KEYS.length)];
    } else {
      cost = 6 + Math.floor(a * 7); // 6..12 base
      key = b < 0.45 ? HOT_KEY : CLIENT_KEYS[Math.floor(b * CLIENT_KEYS.length)];
    }
    return { i, key, cost };
  });
}

// Actual holding time once a request lands on a server. Under the skewed preset
// the degraded server takes SLOW_FACTOR× longer, this is the "uneven duration"
// that correlates with PLACEMENT, the one situation least-connections can win.
const holdTime = (req, server, skewed) =>
  skewed && server === SLOW_SERVER ? req.cost * SLOW_FACTOR : req.cost;

// --- the simulation, PURE function of (algorithm, N, preset, T) -------------
// Admits ADMIT_PER_TICK requests per tick. Tracks per-server *active* connections
// (requests whose [arrival, arrival+hold) window still covers the current tick).
// RR/WRR/hash are closed-form per request; least-connections must scan live state
// at each arrival (N is tiny → linear). Returns the bar snapshot + last routed req.
function simulate(algo, N, skewed, stream, T) {
  const weights = SERVER_WEIGHTS.slice(0, N);
  const wheel = [];
  weights.forEach((w, j) => { for (let k = 0; k < w; k++) wheel.push(j); });

  const admit = Math.min(T * ADMIT_PER_TICK, STREAM_LEN);
  const assigned = new Array(admit).fill(-1);
  const hold = new Array(admit).fill(0);
  const activeNow = new Array(N).fill(0);   // live active count during the walk (for LC)
  const freeing = [];                        // {server, at} release events
  let rrPtr = 0, wheelPtr = 0;

  for (let i = 0; i < admit; i++) {
    const arrival = Math.floor(i / ADMIT_PER_TICK);
    // release connections that finished at/before this arrival tick
    for (let f = freeing.length - 1; f >= 0; f--) {
      if (freeing[f].at <= arrival) {
        activeNow[freeing[f].server] -= 1;
        freeing.splice(f, 1);
      }
    }
    const req = stream[i];
    let s;
    if (algo === "rr") s = (rrPtr++) % N;
    else if (algo === "wrr") s = wheel[(wheelPtr++) % wheel.length];
    else if (algo === "hash") s = hash32(req.key) % N;
    else { // least-connections: fewest active now, tie → lowest index
      s = 0;
      for (let j = 1; j < N; j++) if (activeNow[j] < activeNow[s]) s = j;
    }
    const h = holdTime(req, s, skewed);
    assigned[i] = s;
    hold[i] = h;
    activeNow[s] += 1;
    freeing.push({ server: s, at: arrival + h });
  }

  // snapshot AT tick T
  const servers = Array.from({ length: N }, (_, j) => ({
    j, active: 0, total: 0, hot: 0, slow: skewed && j === SLOW_SERVER,
  }));
  for (let i = 0; i < admit; i++) {
    const s = assigned[i];
    if (s < 0) continue;
    const req = stream[i];
    const arrival = Math.floor(i / ADMIT_PER_TICK);
    servers[s].total += 1;
    if (req.key === HOT_KEY) servers[s].hot += 1;
    if (arrival <= T - 1 && arrival + hold[i] > T - 1) servers[s].active += 1;
  }
  const lastIdx = admit - 1;
  const lastReq = admit > 0
    ? { ...stream[lastIdx], server: assigned[lastIdx], hold: hold[lastIdx] }
    : null;

  return { servers, lastReq, weights };
}

export default function LoadBalancerComparison() {
  const [algo, setAlgo] = useState("rr");
  const [n, setN] = useState(4);
  const [skewed, setSkewed] = useState(false);
  const [t, setT] = useState(0);          // the single time-state (SSR: 0)
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  const stream = useMemo(() => buildStream(skewed), [skewed]);
  const activePreset = skewed ? "Skewed key + 1 slow server" : "Uniform · healthy servers";

  // play loop, increment T on an interval, stop at the end. Effects never run
  // on the server, so SSR stays at T=0 and hydrates clean.
  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setT((prev) => {
        if (prev >= MAX_T) { setPlaying(false); return prev; }
        return prev + 1;
      });
    }, 220);
    return () => clearInterval(timer.current);
  }, [playing]);

  const Algo = ALGOS[algo];
  const { servers, lastReq, weights } = useMemo(
    () => simulate(algo, n, skewed, stream, t),
    [algo, n, skewed, stream, t]
  );

  // Algorithm switch KEEPS t (the payoff: same requests, re-routed → exact diff).
  // N and preset changes reset t (the stream/topology changed).
  const pickAlgo = (id) => setAlgo(id);
  const pickPreset = (name) => { setSkewed(PRESETS[name].skewed); setT(0); setPlaying(false); };
  const setNodes = (v) => { setN(v); setT(0); setPlaying(false); };
  const togglePlay = () => {
    if (t >= MAX_T) { setT(0); setPlaying(true); return; }
    setPlaying((p) => !p);
  };
  const step = () => { setPlaying(false); setT((p) => Math.min(MAX_T, p + 1)); };
  const reset = () => { setPlaying(false); setT(0); };

  // headline metric: ACTIVE connections (what every algorithm actually competes
  // on). peak/avg quantifies imbalance, mirroring ShardingVisualizer's badge.
  const actives = servers.map((s) => s.active);
  const totalActive = actives.reduce((a, v) => a + v, 0);
  const maxActive = Math.max(1, ...actives);
  const avgActive = totalActive / n;
  const peakRatio = avgActive > 0 ? maxActive / avgActive : 1;
  // WRR is *intentionally* uneven (proportional to capacity), don't flag that as
  // a failure. For WRR, judge balance against each server's fair weighted share.
  const wrrExpectedPeak = (() => {
    const sum = weights.reduce((a, w) => a + w, 0);
    return (Math.max(...weights) / sum) * n; // peak/avg if perfectly weight-proportional
  })();
  const hotspot = totalActive >= n &&
    (algo === "wrr" ? peakRatio > wrrExpectedPeak + 0.7 : peakRatio > 1.34);
  const balanced = !hotspot;

  const heatColor = (active) => {
    if (totalActive < n) return SERVER_COLORS[0];
    const r = avgActive > 0 ? active / avgActive : 1;
    if (r <= 1.2) return "#2dd4a7";
    if (r <= 1.6) return "#facc15";
    if (r <= 2.4) return "#e8a13a";
    return "#f87171";
  };

  const accent = "#2dd4a7";

  return (
    <div className="not-content w-full max-w-3xl mx-auto font-mono text-[var(--w-text)]" style={{ background: "transparent" }}>
      <div className="rounded-xl border border-[var(--w-border)] p-5 shadow-2xl" style={{ background: "var(--w-bg)" }}>
        {/* header */}
        <div className="flex items-center gap-2 mb-1">
          <Scale size={20} style={{ color: accent }} />
          <h2 className="text-lg font-bold tracking-tight text-[var(--w-heading)]">Load-Balancing Algorithms</h2>
        </div>
        <p className="text-xs text-[var(--w-muted)] mb-4">
          One fixed stream of {STREAM_LEN} requests, four algorithms. Bars are <span className="text-[var(--w-text)]">live (active) connections</span>.
          Pause mid-stream and switch algorithm, the <span className="text-[var(--w-text)]">same</span> requests re-route, so the differences are exact, not anecdotal.
        </p>

        {/* algorithm toggle */}
        <div className="flex flex-wrap items-stretch gap-2 mb-3">
          {Object.entries(ALGOS).map(([id, a]) => {
            const Icon = a.icon;
            const on = algo === id;
            return (
              <button
                key={id}
                onClick={() => pickAlgo(id)}
                className={`h-full flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border transition ${
                  on
                    ? "border-emerald-400 bg-emerald-400/15 text-emerald-300"
                    : "border-[var(--w-border)] bg-[var(--w-panel)] text-[var(--w-text)] hover:border-[var(--w-faint)]"
                }`}
              >
                <Icon size={13} />
                {a.label}
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
                onClick={() => pickPreset(name)}
                className={`h-full flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border transition ${
                  on
                    ? "border-amber-400 bg-amber-400/15 text-amber-200"
                    : "border-[var(--w-border)] bg-[var(--w-panel)] text-[var(--w-text)] hover:border-[var(--w-faint)]"
                }`}
              >
                {PRESETS[name].skewed ? <Flame size={13} /> : <Scale size={13} />}
                {name}
              </button>
            );
          })}
        </div>

        {/* N slider + playback transport */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end mb-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[var(--w-muted)] flex items-center gap-1"><ServerIcon size={12} /> Backend servers (N)</span>
              <span className="text-[var(--w-heading)] font-semibold">{n}</span>
            </div>
            <input
              type="range"
              min={2}
              max={MAX_N}
              step={1}
              value={n}
              onChange={(e) => setNodes(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-400 cursor-pointer"
              aria-label="Number of backend servers"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="px-3 py-1.5 rounded-md text-xs border border-emerald-400/60 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20 transition flex items-center gap-1"
            >
              {playing ? <Pause size={13} /> : <Play size={13} />}
              {playing ? "pause" : t >= MAX_T ? "replay" : "play"}
            </button>
            <button
              onClick={step}
              disabled={t >= MAX_T}
              className="px-3 py-1.5 rounded-md text-xs border border-[var(--w-border)] bg-[var(--w-panel)] text-[var(--w-text)] hover:border-[var(--w-faint)] transition flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <StepForward size={13} /> step
            </button>
            <button
              onClick={reset}
              className="px-3 py-1.5 rounded-md text-xs border border-[var(--w-border)] bg-[var(--w-panel)] text-[var(--w-muted)] hover:border-[var(--w-faint)] transition flex items-center gap-1"
            >
              <RotateCcw size={12} /> reset
            </button>
          </div>
        </div>

        {/* incoming-request ticker */}
        <div className="rounded-lg border border-[var(--w-border-soft)] px-4 py-2.5 mb-3 flex items-center justify-between gap-3 flex-wrap" style={{ background: "var(--w-panel)" }}>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-[var(--w-faint)] uppercase tracking-wide">admitted</span>
            <span className="text-[var(--w-text)] font-semibold">{Math.min(t * ADMIT_PER_TICK, STREAM_LEN)} / {STREAM_LEN}</span>
            <span className="text-[var(--w-faint)]">·</span>
            <span className="text-[var(--w-faint)]">tick {t}/{MAX_T}</span>
          </div>
          {lastReq ? (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-1.5 py-0.5 rounded text-[var(--w-text)]" style={{ background: "var(--w-panel-2)" }}>
                key <span className={lastReq.key === HOT_KEY ? "text-amber-300 font-semibold" : "text-[var(--w-heading)]"}>{lastReq.key}</span>
                {lastReq.key === HOT_KEY && <Flame size={9} className="inline ml-0.5 -mt-0.5 text-amber-300" />}
              </span>
              <span className="text-[var(--w-faint)]">held {lastReq.hold}t</span>
              <span className="text-[var(--w-faint)]">→</span>
              <span
                className="px-2 py-0.5 rounded font-semibold"
                style={{
                  color: SERVER_COLORS[lastReq.server % SERVER_COLORS.length],
                  background: "var(--w-slot)",
                }}
              >
                server {lastReq.server}
              </span>
            </div>
          ) : (
            <div className="text-[11px] text-[var(--w-faint)]">press play or step to admit requests</div>
          )}
        </div>

        {/* server bars (active connections) */}
        <div className="rounded-lg border border-[var(--w-border-soft)] p-4 mb-3" style={{ background: "var(--w-panel)" }}>
          <div className="flex items-end justify-between gap-2 sm:gap-3 h-44">
            {servers.map((s) => {
              const c = heatColor(s.active);
              const hPct = Math.max(3, (s.active / maxActive) * 100);
              const justHit = lastReq && lastReq.server === s.j;
              return (
                <div key={s.j} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                  <div className="text-[10px] font-semibold mb-1" style={{ color: c }}>{s.active}</div>
                  <div className="w-full flex flex-col justify-end" style={{ height: "100%" }}>
                    <div
                      className="w-full rounded-t transition-all duration-200 relative"
                      style={{
                        height: `${hPct}%`,
                        background: c,
                        opacity: 0.9,
                        boxShadow: s.active / Math.max(avgActive, 0.5) > 2.4 ? `0 0 12px ${c}` : "none",
                        outline: justHit ? `2px solid ${c}` : "none",
                        outlineOffset: justHit ? "1px" : "0",
                      }}
                    >
                      {s.hot > 0 && (
                        <span className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full">
                          <Flame size={12} style={{ color: "#f87171" }} />
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] mt-1 truncate w-full text-center flex items-center justify-center gap-0.5"
                       style={{ color: s.slow ? "#f87171" : "var(--w-muted)" }}>
                    {s.slow && <AlertTriangle size={9} />}srv {s.j}
                  </div>
                  <div className="text-[9px] text-[var(--w-faint)] truncate w-full text-center">
                    {algo === "wrr" ? `w${weights[s.j]} · ` : ""}{s.total} reqs
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-3 text-[11px]">
            <span className="text-[var(--w-faint)]">
              bar = active connections (avg {avgActive.toFixed(1)}) · number under = total routed
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
          {skewed && (
            <div className="text-[10px] text-rose-300/80 mt-1.5 flex items-center gap-1">
              <AlertTriangle size={10} /> srv {SLOW_SERVER} is degraded, it holds each request {SLOW_FACTOR}× longer.
              Only least-connections notices.
            </div>
          )}
        </div>

        {/* governing rule, switches per algorithm (like ShardingVisualizer) */}
        <div className="rounded-lg border border-[var(--w-border-soft)] p-4 mb-3" style={{ background: "var(--w-panel)" }}>
          <div className="flex items-center gap-1.5 mb-1.5" style={{ color: SERVER_COLORS[0] }}>
            <Algo.icon size={14} />
            <span className="text-[11px] uppercase tracking-wide text-[var(--w-muted)]">{Algo.label}, routing rule</span>
          </div>
          <code className="block text-sm font-bold text-[var(--w-heading)] mb-2 break-words">{Algo.rule}</code>
          <p className="text-[11px] text-[var(--w-muted)] leading-snug">{Algo.blurb}</p>

          {algo === "hash" && (
            <div className="mt-2 text-[10px] text-[var(--w-faint)] leading-snug">
              "Consistent" here = <span className="text-[var(--w-text)]">sticky</span>: a key always lands on the same server. Plain
              <code className="text-[var(--w-text)]"> mod N</code> remaps <span className="text-[var(--w-text)]">every</span> key when N changes
              (move the slider), the disruption a consistent-hashing <span className="text-[var(--w-text)]">ring</span> exists to bound.
            </div>
          )}
          {algo === "wrr" && (
            <div className="mt-2 text-[10px] text-[var(--w-faint)] leading-snug">
              Weights this run: {weights.map((w, j) => (
                <span key={j} className="mr-1.5">
                  srv{j}=<span style={{ color: SERVER_COLORS[j % SERVER_COLORS.length] }} className="font-semibold">{w}</span>
                </span>
              ))}, server 0 is a bigger box, so its taller bar is <span className="text-[var(--w-text)]">intended</span>, not a hot-spot.
            </div>
          )}
        </div>

        {/* trade-off cards, the selected one highlighted */}
        <div className="grid grid-cols-1 sm:grid-cols-2 items-stretch gap-2 text-[11px] mb-4">
          <Cost c="#2dd4a7" t="Round-robin" on={algo === "rr"}
            s="Even request COUNT, zero state, trivial. Cost: blind to load, a degraded or slow server keeps getting its full share until something else trips." />
          <Cost c="#38bdf8" t="Weighted RR" on={algo === "wrr"}
            s="Respects heterogeneous capacity (big vs small boxes). Cost: weights are static config, still blind to live load and to a server silently struggling right now." />
          <Cost c="#e8a13a" t="Least-connections" on={algo === "lc"}
            s="Adapts to uneven duration, in-flight requests stop stacking on the slow node, so it self-heals around a degraded server. Cost: the LB must track live per-server connection state." />
          <Cost c="#f87171" t="IP / key hash" on={algo === "hash"}
            s="Stickiness for free: session affinity, cache locality. Cost: a skewed key (a celebrity) pins to ONE server and hot-spots it; and mod-N reshuffles all keys on resize (use a hash ring)." />
        </div>

        {/* closing interpretation, ties to the skew toggle */}
        <p className="text-[11px] text-[var(--w-faint)] leading-relaxed">
          Flip to <span className="text-amber-300">Skewed key + 1 slow server</span> and run it.
          <span className="text-emerald-300"> Round-robin</span> and <span className="text-sky-300">weighted RR</span> keep feeding the
          degraded <span className="text-rose-300">srv {SLOW_SERVER}</span>, whose in-flight requests pile into the red.
          Switch to <span className="text-amber-300">least-connections</span> on the same stream and the bars flatten, it sees the
          backup and routes around it. Switch to <span className="text-rose-300">hash</span> and the hot key
          (<span className="text-amber-300">{HOT_KEY}</span>, <Flame size={9} className="inline -mt-0.5 text-rose-300" />)
          slams its own server regardless of load. Under <span className="text-emerald-300">Uniform · healthy servers</span>, round-robin and
          least-connections become <span className="text-[var(--w-text)]">indistinguishable</span>, LC buys nothing when every server is identical and fast;
          weighted RR still tilts to the big box <span className="text-[var(--w-text)]">by design</span>; and hash stays lumpy because 16 keys don't divide
          evenly into N buckets. The Director-altitude point: there is no
          "best" algorithm, pick for your <span className="text-[var(--w-text)]">failure mode</span> (uneven duration / flaky backends → least-conn;
          session or cache affinity → hash, with a ring to survive resizing; known fixed capacity skew → weighted) and name the cost of the one you chose.
        </p>
      </div>
    </div>
  );
}

function Cost({ c, t, s, on }) {
  return (
    <div
      className={`h-full rounded-lg border p-2.5 transition ${
        on ? "border-[var(--w-faint)] bg-[var(--w-panel-2)]" : "border-[var(--w-border-soft)] bg-[var(--w-panel)]"
      }`}
    >
      <div className="font-semibold mb-0.5" style={{ color: c }}>
        {t}
        {on && <span className="text-[var(--w-faint)] font-normal"> · selected</span>}
      </div>
      <div className="text-[var(--w-muted)] leading-snug">{s}</div>
    </div>
  );
}
