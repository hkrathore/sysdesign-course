import React, { useState, useMemo } from "react";
import { Activity, Database, Server, Gauge, ArrowUpDown, HardDrive, Zap } from "lucide-react";

// --- formatting helpers ---------------------------------------------------
const fmtNum = (n) => {
  if (!isFinite(n)) return "—";
  if (n >= 1e9) return (n / 1e9).toFixed(n >= 1e10 ? 0 : 1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + "K";
  return n.toFixed(n < 10 ? 1 : 0);
};
const fmtBytes = (b) => {
  if (!isFinite(b)) return "—";
  const u = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];
  let i = 0;
  while (b >= 1000 && i < u.length - 1) { b /= 1000; i++; }
  return b.toFixed(b < 10 && i > 0 ? 1 : 0) + " " + u[i];
};

const SEC_PER_DAY = 86400;

const PRESETS = {
  "Twitter-like feed": { dau: 200_000_000, rpud: 50, payloadKB: 0.3, rw: 100, peak: 3, repl: 3, cap: 5000, years: 1 },
  "Photo service": { dau: 50_000_000, rpud: 8, payloadKB: 1500, rw: 5, peak: 4, repl: 3, cap: 2000, years: 1 },
  "Chat app": { dau: 500_000_000, rpud: 60, payloadKB: 0.2, rw: 1, peak: 3, repl: 3, cap: 8000, years: 1 },
};

const FIELDS = [
  { key: "dau", label: "Daily Active Users", min: 1e5, max: 2e9, step: 1e5, fmt: fmtNum },
  { key: "rpud", label: "Requests / user / day", min: 1, max: 500, step: 1, fmt: (v) => v },
  { key: "payloadKB", label: "Avg payload (KB)", min: 0.1, max: 5000, step: 0.1, fmt: (v) => v },
  { key: "rw", label: "Read : Write ratio (reads per write)", min: 0, max: 1000, step: 1, fmt: (v) => `${v}:1` },
  { key: "peak", label: "Peak-to-average factor", min: 1, max: 12, step: 0.5, fmt: (v) => `${v}×` },
  { key: "repl", label: "Replication factor", min: 1, max: 6, step: 1, fmt: (v) => `${v}×` },
  { key: "cap", label: "Per-server capacity (req/s)", min: 200, max: 50000, step: 100, fmt: fmtNum },
  { key: "years", label: "Retention (years)", min: 1, max: 10, step: 1, fmt: (v) => `${v} yr` },
];

export default function EstimationCalculator() {
  const [s, setS] = useState(PRESETS["Twitter-like feed"]);
  const [active, setActive] = useState("Twitter-like feed");

  const set = (k, v) => { setS((p) => ({ ...p, [k]: v })); setActive(null); };
  const applyPreset = (name) => { setS(PRESETS[name]); setActive(name); };

  const r = useMemo(() => {
    const totalPerDay = s.dau * s.rpud;
    const avgQPS = totalPerDay / SEC_PER_DAY;
    const peakQPS = avgQPS * s.peak;
    const writeFrac = 1 / (s.rw + 1);
    const readFrac = 1 - writeFrac;
    const writeQPS = avgQPS * writeFrac;
    const readQPS = avgQPS * readFrac;
    const payloadBytes = s.payloadKB * 1000;
    const writesPerDay = totalPerDay * writeFrac;
    const storPerDay = writesPerDay * payloadBytes;
    const storPerYearRepl = storPerDay * 365 * s.years * s.repl;
    const egress = readQPS * s.peak * payloadBytes; // peak read bandwidth
    const ingress = writeQPS * s.peak * payloadBytes;
    const servers = Math.ceil(peakQPS / s.cap);
    return { totalPerDay, avgQPS, peakQPS, readQPS, writeQPS, storPerYearRepl, egress, ingress, servers };
  }, [s]);

  const cardStyle = "rounded-lg border border-[var(--w-border-soft)] bg-[var(--w-panel)] p-4";
  const accent = "#2dd4a7";

  return (
    <div className="not-content w-full max-w-3xl mx-auto font-mono text-[var(--w-text)]" style={{ background: "transparent" }}>
      <div className="rounded-xl border border-[var(--w-border)] bg-[var(--w-bg)] p-5 shadow-2xl">
        <div className="flex items-center gap-2 mb-1">
          <Gauge size={20} style={{ color: accent }} />
          <h2 className="text-lg font-bold tracking-tight text-[var(--w-heading)]">Back-of-the-Envelope Estimation</h2>
        </div>
        <p className="text-xs text-[var(--w-muted)] mb-4">Goal: order of magnitude, not accounting. Change one input, predict the output, then check.</p>

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

        {/* inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 items-stretch gap-x-6 gap-y-4 mb-6">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--w-muted)]">{f.label}</span>
                <span className="text-[var(--w-text)] font-semibold">{f.fmt(s[f.key])}</span>
              </div>
              <input
                type="range"
                min={f.min} max={f.max} step={f.step} value={s[f.key]}
                onChange={(e) => set(f.key, parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>
          ))}
        </div>

        {/* outputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 items-stretch gap-3">
          <Out icon={<Activity size={16} />} label="Average QPS" value={fmtNum(r.avgQPS) + "/s"}
               formula="DAU × req/user ÷ 86,400" accent={accent} />
          <Out icon={<Zap size={16} />} label="Peak QPS" value={fmtNum(r.peakQPS) + "/s"}
               formula={`avg × ${s.peak} peak factor`} accent="#e8a13a" highlight />
          <Out icon={<ArrowUpDown size={16} />} label="Read QPS (avg)" value={fmtNum(r.readQPS) + "/s"}
               formula={`avg × ${s.rw}/(${s.rw}+1)`} accent={accent} />
          <Out icon={<ArrowUpDown size={16} />} label="Write QPS (avg)" value={fmtNum(r.writeQPS) + "/s"}
               formula={`avg × 1/(${s.rw}+1)`} accent={accent} />
          <Out icon={<Database size={16} />} label={`Storage / ${s.years}yr (replicated)`} value={fmtBytes(r.storPerYearRepl)}
               formula={`writes/day × payload × 365 × ${s.repl}`} accent={accent} />
          <Out icon={<HardDrive size={16} />} label="Peak egress bandwidth" value={fmtBytes(r.egress) + "/s"}
               formula="peak read QPS × payload" accent={accent} />
          <Out icon={<HardDrive size={16} />} label="Peak ingress bandwidth" value={fmtBytes(r.ingress) + "/s"}
               formula="peak write QPS × payload" accent={accent} />
          <Out icon={<Server size={16} />} label="Servers (peak)" value={fmtNum(r.servers)}
               formula={`peak QPS ÷ ${fmtNum(s.cap)}/s`} accent="#e8a13a" highlight />
        </div>

        <p className="text-[11px] text-[var(--w-faint)] mt-5 leading-relaxed">
          The interview point is the <span className="text-[var(--w-text)]">conclusion</span> the numbers justify — e.g. "reads dominate ~{s.rw}×, so the architecture lives on the cache/read path," or "media egress, not QPS, is the binding cost." Round aggressively; ≤3 minutes.
        </p>
      </div>
    </div>
  );
}

function Out({ icon, label, value, formula, accent, highlight }) {
  return (
    <div
      className={`h-full flex flex-col rounded-lg border p-3 ${highlight ? "border-amber-500/50 bg-amber-500/5" : "border-[var(--w-border-soft)] bg-[var(--w-panel)]"}`}
    >
      <div className="flex items-center gap-1.5 mb-1" style={{ color: accent }}>
        {icon}
        <span className="text-[11px] uppercase tracking-wide text-[var(--w-muted)]">{label}</span>
      </div>
      <div className="text-xl font-bold text-[var(--w-heading)] leading-tight">{value}</div>
      <div className="text-[10px] text-[var(--w-faint)] mt-0.5">{formula}</div>
    </div>
  );
}
