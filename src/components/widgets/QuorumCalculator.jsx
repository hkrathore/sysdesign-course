import React, { useState, useMemo } from "react";
import { Database, ShieldCheck, ShieldAlert, PenLine, BookOpen, Timer, Layers } from "lucide-react";

// --- palette (verbatim from the sibling widgets) --------------------------
const C = {
  emerald: "#2dd4a7", // write set
  amber: "#e8a13a",   // overlap — the consistency guarantee
  sky: "#38bdf8",     // read set
  rose: "#f87171",    // danger / not-strong
};

const N_MIN = 1, N_MAX = 7;

// Presets are FUNCTIONS of current N (W/R derived from N, not static).
const majority = (n) => Math.floor(n / 2) + 1;
const PRESETS = {
  "Read-optimized (W=N, R=1)": (n) => ({ W: n, R: 1 }),
  "Write-optimized (W=1, R=N)": (n) => ({ W: 1, R: n }),
  "Balanced strong (W=R=majority)": (n) => ({ W: majority(n), R: majority(n) }),
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export default function QuorumCalculator() {
  const [N, setN] = useState(3);
  const [W, setW] = useState(2);
  const [R, setR] = useState(2);
  const [active, setActive] = useState("Balanced strong (W=R=majority)");

  // N changes clamp BOTH W and R to <= N in the same update.
  const onN = (next) => {
    const n = clamp(next, N_MIN, N_MAX);
    setN(n);
    setW((w) => clamp(w, 1, n));
    setR((r) => clamp(r, 1, n));
    setActive(null);
  };
  const onW = (next) => { setW(clamp(next, 1, N)); setActive(null); };
  const onR = (next) => { setR(clamp(next, 1, N)); setActive(null); };
  const applyPreset = (name) => {
    const { W: w, R: r } = PRESETS[name](N);
    setW(w); setR(r); setActive(name);
  };

  const m = useMemo(() => {
    const overlap = Math.max(0, W + R - N);     // slots forced to intersect
    const strong = W + R > N;                    // read quorum meets latest write
    const adjacent = W + R === N;                // touching but disjoint (threshold)
    const writeQuorumSafe = W > N / 2;           // single-copy write rule
    return {
      overlap, strong, adjacent, writeQuorumSafe,
      writeTolerates: N - W,                      // failures write can survive
      readTolerates: N - R,
    };
  }, [N, W, R]);

  // Build N slots. Worst case: write set pushed to the left (1..W),
  // read set pushed to the right (N-R+1..N). They collide iff W+R>N.
  const slots = useMemo(() => {
    return Array.from({ length: N }, (_, i) => {
      const idx = i + 1;
      const inW = idx <= W;
      const inR = idx > N - R;
      let kind = "none";
      if (inW && inR) kind = "both";
      else if (inW) kind = "write";
      else if (inR) kind = "read";
      return { idx, kind };
    });
  }, [N, W, R]);

  const slotStyle = {
    write: { bg: C.emerald, label: "W" },
    read:  { bg: C.sky, label: "R" },
    both:  { bg: C.amber, label: "W∩R" },
    none:  { bg: "var(--w-slot)", label: "·" },
  };

  return (
    <div className="not-content w-full max-w-3xl mx-auto font-mono text-[var(--w-text)]" style={{ background: "transparent" }}>
      <div className="rounded-xl border p-5 shadow-2xl" style={{ background: "var(--w-bg)", borderColor: "var(--w-border)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Database size={20} style={{ color: C.emerald }} />
          <h2 className="text-lg font-bold tracking-tight text-[var(--w-heading)]">Quorum Calculator — N / W / R</h2>
        </div>
        <p className="text-xs text-[var(--w-muted)] mb-4">
          Tune the replica count and the write/read quorums. The single rule that buys read-your-writes is{" "}
          <span className="text-amber-300 font-semibold">W + R &gt; N</span> — predict the verdict before you move a slider.
        </p>

        {/* presets */}
        <div className="flex flex-wrap items-stretch gap-2 mb-5">
          {Object.keys(PRESETS).map((name) => (
            <button
              key={name}
              onClick={() => applyPreset(name)}
              className={`h-full px-3 py-1.5 rounded-md text-xs border transition ${
                active === name
                  ? "border-emerald-400 bg-emerald-400/15 text-emerald-300"
                  : "border-[var(--w-border)] bg-[var(--w-panel)] text-[var(--w-text)] hover:border-[var(--w-faint)]"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {/* sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-stretch gap-x-6 gap-y-4 mb-6">
          <Slider label="N — replicas" value={N} min={N_MIN} max={N_MAX} onChange={onN} accent="accent-[var(--w-text)]" valueColor="text-[var(--w-heading)]" />
          <Slider label="W — write quorum" value={W} min={1} max={N} onChange={onW} accent="accent-emerald-400" valueColor="text-emerald-300" />
          <Slider label="R — read quorum" value={R} min={1} max={N} onChange={onR} accent="accent-sky-400" valueColor="text-sky-300" />
        </div>

        {/* slot diagram */}
        <div className="rounded-lg border p-4 mb-5" style={{ background: "var(--w-panel)", borderColor: "var(--w-border-soft)" }}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[var(--w-muted)]">
              <Layers size={14} style={{ color: C.amber }} />
              Worst-case overlap — write set and read set pushed to opposite ends
            </div>
            <div className="flex flex-wrap items-stretch gap-3 text-[10px]">
              <Legend c={C.emerald} t="write set (W)" />
              <Legend c={C.sky} t="read set (R)" />
              <Legend c={C.amber} t="forced overlap" />
              <Legend c="var(--w-slot)" t="uncovered" />
            </div>
          </div>

          <div className="flex flex-wrap items-stretch gap-2">
            {slots.map((s) => {
              const st = slotStyle[s.kind];
              const filled = s.kind !== "none";
              return (
                <div
                  key={s.idx}
                  className="flex flex-col items-center justify-center rounded-md border text-center transition-all duration-300"
                  style={{
                    width: 60, height: 56,
                    background: filled ? st.bg + "22" : "var(--w-slot)",
                    borderColor: filled ? st.bg : "var(--w-border-soft)",
                  }}
                  title={`Replica ${s.idx}: ${st.label}`}
                >
                  <span className="text-[9px] text-[var(--w-faint)] leading-none mb-0.5">r{s.idx}</span>
                  <span
                    className="text-[11px] font-bold leading-none"
                    style={{ color: filled ? st.bg : "var(--w-faint)" }}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-[var(--w-faint)] mt-3 leading-relaxed">
            The sets are forced to the extremes; they still collide in{" "}
            <span className="text-amber-300 font-semibold">max(0, W + R − N) = {m.overlap}</span> replica
            {m.overlap === 1 ? "" : "s"}.{" "}
            {m.strong
              ? "Any read quorum (chosen anywhere) is therefore guaranteed to include at least one replica from the latest write quorum."
              : m.adjacent
              ? "At W + R = N the sets are adjacent but disjoint — a read quorum can entirely miss the latest write. Not strong."
              : "The sets fall short of touching — reads can easily miss the latest write. Not strong."}
          </p>
        </div>

        {/* verdict — the headline */}
        <div
          className="rounded-lg border p-4 mb-3"
          style={{
            borderColor: m.strong ? C.emerald + "99" : C.rose + "99",
            background: m.strong ? C.emerald + "12" : C.rose + "10",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            {m.strong
              ? <ShieldCheck size={18} style={{ color: C.emerald }} />
              : <ShieldAlert size={18} style={{ color: C.rose }} />}
            <span className="text-[11px] uppercase tracking-wide text-[var(--w-muted)]">Consistency verdict</span>
          </div>
          <div className="text-xl font-bold leading-tight" style={{ color: m.strong ? C.emerald : C.rose }}>
            {W} + {R} {m.strong ? ">" : m.adjacent ? "=" : "<"} {N} &nbsp;—&nbsp;
            {m.strong ? "Strong read/write overlap" : "Eventually consistent (no guaranteed overlap)"}
          </div>
          <div className="text-[11px] text-[var(--w-muted)] mt-1 leading-relaxed">
            Rule: <span className="text-amber-300 font-semibold">W + R &gt; N</span>{" "}
            {m.strong
              ? "→ every read quorum intersects the latest write quorum → reads see the latest acknowledged write."
              : "is NOT satisfied → a read may be served entirely by replicas that missed the most recent write."}
          </div>
        </div>

        {/* availability + latency cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-stretch gap-3">
          <Out
            icon={<PenLine size={16} />}
            label="Write availability"
            value={`tolerates ${m.writeTolerates} down`}
            formula={`N − W = ${N} − ${W}`}
            accent={C.emerald}
            highlight={m.writeTolerates === 0}
            sub={m.writeTolerates === 0 ? "any single failure blocks writes" : `writes succeed with ${m.writeTolerates} replica${m.writeTolerates === 1 ? "" : "s"} offline`}
          />
          <Out
            icon={<BookOpen size={16} />}
            label="Read availability"
            value={`tolerates ${m.readTolerates} down`}
            formula={`N − R = ${N} − ${R}`}
            accent={C.sky}
            highlight={m.readTolerates === 0}
            sub={m.readTolerates === 0 ? "any single failure blocks reads" : `reads succeed with ${m.readTolerates} replica${m.readTolerates === 1 ? "" : "s"} offline`}
          />
          <Out
            icon={<Timer size={16} />}
            label="Latency lean"
            value={W >= R ? "write-heavy tail" : "read-heavy tail"}
            formula={`waits on max(W=${W}, R=${R})-th replica`}
            accent={C.amber}
            sub="set by the W-th / R-th fastest replica — higher quorum waits on slower nodes → higher tail latency"
          />
        </div>

        {/* secondary rule + reflexes */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 items-stretch gap-2 text-[11px]">
          <Reflex
            c={m.writeQuorumSafe ? C.emerald : C.amber}
            t={m.writeQuorumSafe ? "Write quorum: W > N/2 ✓" : "Write quorum: W ≤ N/2 ⚠"}
            s={m.writeQuorumSafe
              ? `W=${W} > ${N}/2 → two conflicting writes can't both commit.`
              : `W=${W} ≤ ${N}/2 → concurrent writes may both succeed on disjoint sets (conflict).`}
          />
          <Reflex c={C.sky} t="Tune R for read-your-writes" s="Cheap reads (R=1) need W=N to stay strong — fine for read-mostly, brittle on writes." />
          <Reflex c={C.amber} t="Dynamo defaults" s="Cassandra/Dynamo expose N,W,R per query — most pick W=R=majority for strong, or W=R=1 for speed + eventual." />
        </div>

        <p className="text-[11px] text-[var(--w-faint)] mt-4 leading-relaxed">
          The Director-altitude point isn't the arithmetic — it's the <span className="text-[var(--w-text)]">defensible call</span>:
          "this path is read-mostly and tolerates staleness, so W=1/R=1 (eventual) maximizes availability and cuts tail latency,"
          versus "balances/payments need read-your-writes, so W=R=majority — I accept the latency hit and the lost availability when ⌊N/2⌋+1 replicas aren't reachable."
        </p>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, onChange, accent, valueColor }) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[var(--w-muted)]">{label}</span>
        <span className={`font-semibold ${valueColor}`}>{value}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={1} value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        aria-label={label}
        className={`w-full cursor-pointer ${accent}`}
      />
      <div className="flex justify-between text-[9px] text-[var(--w-faint)] mt-0.5">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

function Out({ icon, label, value, formula, accent, highlight, sub }) {
  return (
    <div
      className={`h-full flex flex-col rounded-lg border p-3 ${highlight ? "border-amber-500/50 bg-amber-500/5" : "border-[var(--w-border-soft)] bg-[var(--w-panel)]"}`}
    >
      <div className="flex items-center gap-1.5 mb-1" style={{ color: accent }}>
        {icon}
        <span className="text-[11px] uppercase tracking-wide text-[var(--w-muted)]">{label}</span>
      </div>
      <div className="text-lg font-bold text-[var(--w-heading)] leading-tight">{value}</div>
      <div className="text-[10px] text-[var(--w-faint)] mt-0.5">{formula}</div>
      {sub && <div className="text-[10px] text-[var(--w-muted)] mt-1 leading-snug">{sub}</div>}
    </div>
  );
}

function Legend({ c, t }) {
  return (
    <span className="h-full flex items-center gap-1 text-[var(--w-muted)]">
      <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
      {t}
    </span>
  );
}

function Reflex({ c, t, s }) {
  return (
    <div className="h-full flex flex-col rounded-lg border border-[var(--w-border-soft)] bg-[var(--w-panel)] p-2.5">
      <div className="font-semibold mb-0.5" style={{ color: c }}>{t}</div>
      <div className="text-[var(--w-muted)] leading-snug">{s}</div>
    </div>
  );
}
