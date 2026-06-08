import React, { useState } from "react";

const DATA = [
  { name: "L1 cache reference", ns: 0.5, tier: "cpu" },
  { name: "Branch mispredict", ns: 5, tier: "cpu" },
  { name: "L2 cache reference", ns: 7, tier: "cpu" },
  { name: "Mutex lock / unlock", ns: 25, tier: "cpu" },
  { name: "Main memory (RAM) reference", ns: 100, tier: "mem" },
  { name: "Compress 1 KB (Snappy)", ns: 2500, tier: "cpu" },
  { name: "Send 1 KB over 1 Gbps network", ns: 10000, tier: "net" },
  { name: "SSD random read (4 KB)", ns: 150000, tier: "storage" },
  { name: "Read 1 MB sequentially from memory", ns: 250000, tier: "mem" },
  { name: "Same-datacenter round trip", ns: 500000, tier: "net" },
  { name: "Read 1 MB sequentially from SSD", ns: 1000000, tier: "storage" },
  { name: "HDD disk seek", ns: 10000000, tier: "storage" },
  { name: "Read 1 MB sequentially from HDD", ns: 20000000, tier: "storage" },
  { name: "Cross-continent round trip", ns: 150000000, tier: "net" },
];

const TIERS = {
  cpu: { color: "#2dd4a7", label: "CPU / cache" },
  mem: { color: "#38bdf8", label: "Memory" },
  storage: { color: "#e8a13a", label: "Storage" },
  net: { color: "#f87171", label: "Network" },
};

const fmtTime = (ns) => {
  if (ns < 1000) return `${ns} ns`;
  if (ns < 1e6) return `${(ns / 1000).toFixed(ns / 1000 < 10 ? 1 : 0)} µs`;
  if (ns < 1e9) return `${(ns / 1e6).toFixed(ns / 1e6 < 10 ? 1 : 0)} ms`;
  return `${(ns / 1e9).toFixed(1)} s`;
};

// 1 ns = 1 second => human seconds equals the raw ns count
const fmtHuman = (ns) => {
  const sec = ns;
  if (sec < 60) return `${sec < 10 ? sec.toFixed(1) : Math.round(sec)} sec`;
  if (sec < 3600) return `${(sec / 60).toFixed(1)} min`;
  if (sec < 86400) return `${(sec / 3600).toFixed(1)} hours`;
  if (sec < 2.6e6) return `${(sec / 86400).toFixed(1)} days`;
  if (sec < 3.15e7) return `${(sec / 2.63e6).toFixed(1)} months`;
  return `${(sec / 3.15e7).toFixed(1)} years`;
};

const MIN = 0.5, MAX = 150000000;
const logW = (ns) =>
  ((Math.log10(ns) - Math.log10(MIN)) / (Math.log10(MAX) - Math.log10(MIN))) * 100;

export default function LatencyVisualizer() {
  const [human, setHuman] = useState(false);

  return (
    <div className="w-full max-w-3xl mx-auto font-mono text-slate-200" style={{ background: "transparent" }}>
      <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
          <h2 className="text-lg font-bold tracking-tight text-white">Latency Numbers — a Map of Distances</h2>
          <button
            onClick={() => setHuman((h) => !h)}
            className={`px-3 py-1.5 rounded-md text-xs border transition ${
              human
                ? "border-emerald-400 bg-emerald-400/15 text-emerald-300"
                : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500"
            }`}
          >
            {human ? "● Human scale (1 ns = 1 s)" : "○ Show human scale"}
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Bars are <span className="text-slate-200">log-scale</span> — each is ~10× the previous. Internalize the ratios, not the digits.
        </p>

        {/* legend */}
        <div className="flex flex-wrap gap-3 mb-4 text-[11px]">
          {Object.values(TIERS).map((t) => (
            <span key={t.label} className="flex items-center gap-1.5 text-slate-400">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: t.color }} />
              {t.label}
            </span>
          ))}
        </div>

        <div className="space-y-2">
          {DATA.map((d) => {
            const c = TIERS[d.tier].color;
            return (
              <div key={d.name} className="flex items-center gap-3">
                <div className="w-48 shrink-0 text-[11px] text-slate-300 text-right leading-tight">{d.name}</div>
                <div className="flex-1 h-6 rounded bg-slate-800/60 overflow-hidden relative">
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{ width: `${Math.max(logW(d.ns), 2)}%`, background: c, opacity: 0.85 }}
                  />
                </div>
                <div className="w-24 shrink-0 text-[11px] font-semibold text-right" style={{ color: c }}>
                  {human ? fmtHuman(d.ns) : fmtTime(d.ns)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
          <Reflex c="#38bdf8" t="Cache aggressively" s="RAM is ~5,000× faster than a same-DC round trip." />
          <Reflex c="#f87171" t="No cross-region on hot path" s="~150 ms blows almost any user p99 budget alone." />
          <Reflex c="#e8a13a" t="Sequentialize I/O" s="Random disk is catastrophic — the reason LSM-trees exist." />
        </div>

        <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
          Toggle human scale: RAM becomes <span className="text-sky-300">~1.7 min</span>, a same-DC round trip
          <span className="text-rose-300"> ~5.8 days</span>, and a cross-continent round trip
          <span className="text-rose-300"> ~4.8 years</span>. That gap is why the hot path stays near memory.
        </p>
      </div>
    </div>
  );
}

function Reflex({ c, t, s }) {
  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-2.5">
      <div className="font-semibold mb-0.5" style={{ color: c }}>{t}</div>
      <div className="text-slate-400 leading-snug">{s}</div>
    </div>
  );
}
