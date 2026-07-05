import React, { useState, useMemo } from "react";
import {
  Boxes,
  Hash,
  Search,
  Ban,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Wand2,
} from "lucide-react";

// --- palette (verbatim from the sibling widgets) --------------------------
const C = {
  emerald: "#2dd4a7", // set bit / guaranteed-absent
  amber: "#e8a13a", // false positive
  sky: "#38bdf8", // probed / true positive
  rose: "#f87171", // danger (unused verdict, kept for parity)
};

// Words we insert into the true set.
const INSERT_POOL = ["cat", "dog", "fish", "bird", "frog", "wolf", "bear", "hawk"];
// Words that are NEVER inserted, so any "probably present" on one of these is,
// by construction, a genuine false positive (great for the demo).
const QUERY_ONLY_POOL = ["lion", "seal", "mole", "newt", "crab", "toad", "lynx", "dove"];

const M_OPTIONS = [16, 32, 64];

// FNV-1a (32-bit) with a seed + avalanche; deterministic, no Math.random.
function fnv1a(str, seed) {
  let h = (2166136261 ^ seed) >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995) >>> 0;
  h ^= h >>> 15;
  return h >>> 0;
}

// k positions via double hashing (Kirsch-Mitzenmacher), exactly like real filters.
function positions(word, k, m) {
  const key = String(word).trim().toLowerCase();
  const h1 = fnv1a(key, 0x9e3779b1);
  const h2 = (fnv1a(key, 0x85ebca77) | 1) >>> 0; // odd
  const out = [];
  for (let i = 0; i < k; i++) out.push((h1 + Math.imul(i, h2)) % m);
  return out;
}
const uniq = (a) => [...new Set(a)];

export default function BloomFilterVisualizer() {
  const [M, setM] = useState(32);
  const [K, setK] = useState(3);
  const [inserted, setInserted] = useState(["cat", "dog"]);
  const [query, setQuery] = useState("dog");
  const [typed, setTyped] = useState("");
  const [note, setNote] = useState("");

  // Bit array is DERIVED from the true set, so changing k or m re-derives it.
  const bits = useMemo(() => {
    const b = new Array(M).fill(0);
    for (const w of inserted) for (const p of positions(w, K, M)) b[p] = 1;
    return b;
  }, [inserted, K, M]);

  const result = useMemo(() => {
    if (!query) return null;
    const pos = uniq(positions(query, K, M));
    const zeroPos = pos.find((p) => bits[p] === 0);
    const allSet = zeroPos === undefined;
    const truth = inserted.includes(String(query).trim().toLowerCase());
    return { word: query, pos, allSet, truth, zeroPos: zeroPos ?? null };
  }, [query, bits, inserted, K, M]);

  const stats = useMemo(() => {
    const n = inserted.length;
    const bitsSet = bits.reduce((a, v) => a + v, 0);
    const fill = M ? bitsSet / M : 0;
    const p = n ? Math.pow(1 - Math.exp((-K * n) / M), K) : 0;
    return { n, bitsSet, fill, p, bpe: n ? M / n : 0 };
  }, [inserted, bits, K, M]);

  const insert = (w) => {
    const key = String(w).trim().toLowerCase();
    if (!key) return;
    setNote("");
    setInserted((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };
  const insertNext = () => {
    const next = INSERT_POOL.find((w) => !inserted.includes(w));
    if (next) insert(next);
    else setNote("Every sample item is already in the set. Try querying a never-inserted word.");
  };
  const reset = () => {
    setInserted([]);
    setQuery(null);
    setTyped("");
    setNote("");
  };
  const changeM = (m) => {
    setM(m);
    setNote("");
  };
  const findFalsePositive = () => {
    const hit = QUERY_ONLY_POOL.find((w) => uniq(positions(w, K, M)).every((p) => bits[p] === 1));
    if (hit) {
      setQuery(hit);
      setNote("");
    } else {
      setNote('No false positive yet — insert more items (or lower m / raise k) to fill the array.');
    }
  };

  // per-cell decoration from the current probe
  const deco = useMemo(() => {
    const map = new Array(M).fill(null);
    if (!result) return map;
    for (const p of result.pos) {
      if (!result.allSet) map[p] = p === result.zeroPos ? "zero" : "probe";
      else map[p] = result.truth ? "tp" : "fp";
    }
    return map;
  }, [result, M]);

  const doQuery = () => {
    const key = typed.trim().toLowerCase();
    if (key) setQuery(key);
  };

  return (
    <div
      className="not-content w-full max-w-3xl mx-auto font-mono text-[var(--w-text)]"
      style={{ background: "transparent" }}
    >
      <div
        className="rounded-xl border p-5 shadow-2xl"
        style={{ background: "var(--w-bg)", borderColor: "var(--w-border)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Boxes size={20} style={{ color: C.emerald }} />
          <h2 className="text-lg font-bold tracking-tight text-[var(--w-heading)]">
            Bloom Filter, insert &amp; query the bits
          </h2>
        </div>
        <p className="text-xs text-[var(--w-muted)] mb-4">
          Insert sets <span className="text-emerald-300 font-semibold">k</span> bits; a query checks
          the same <span className="text-emerald-300 font-semibold">k</span> bits. Any bit{" "}
          <span className="text-emerald-300 font-semibold">0</span> ={" "}
          <span className="text-emerald-300 font-semibold">definitely absent</span> (never wrong).
          All <span className="text-emerald-300 font-semibold">1</span> ={" "}
          <span className="text-amber-300 font-semibold">probably present</span> (may be a false
          positive). Predict the verdict before you click.
        </p>

        {/* sizing controls */}
        <div className="flex flex-wrap items-stretch gap-x-6 gap-y-3 mb-5">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wide text-[var(--w-muted)] mb-1">
              m, bits
            </span>
            <div className="flex gap-1.5">
              {M_OPTIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => changeM(m)}
                  className={`px-2.5 py-1 rounded-md text-xs border transition ${
                    M === m
                      ? "border-emerald-400 bg-emerald-400/15 text-emerald-300"
                      : "border-[var(--w-border)] bg-[var(--w-panel)] text-[var(--w-text)] hover:border-[var(--w-faint)]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col min-w-[10rem]">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="uppercase tracking-wide text-[var(--w-muted)]">k, hashes</span>
              <span className="font-semibold text-emerald-300">{K}</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={K}
              onChange={(e) => setK(parseInt(e.target.value, 10))}
              aria-label="k, number of hash functions"
              className="w-full cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[9px] text-[var(--w-faint)] mt-0.5">
              <span>1</span>
              <span>5</span>
            </div>
          </div>
        </div>

        {/* bit array */}
        <div
          className="rounded-lg border p-4 mb-5"
          style={{ background: "var(--w-panel)", borderColor: "var(--w-border-soft)" }}
        >
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[var(--w-muted)]">
              <Hash size={14} style={{ color: C.emerald }} />
              bit array &nbsp;·&nbsp; {stats.bitsSet}/{M} set ({Math.round(stats.fill * 100)}% full)
            </div>
            <div className="flex flex-wrap items-stretch gap-3 text-[10px]">
              <Legend c={C.emerald} t="set (1)" />
              <Legend c={C.sky} t="probed" />
              <Legend c={C.amber} t="false positive" />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {bits.map((v, i) => {
              const d = deco[i];
              const set = v === 1;
              let border = set ? C.emerald : "var(--w-border-soft)";
              let bg = set ? C.emerald + "22" : "var(--w-slot)";
              let ring = "none";
              if (d === "zero") {
                ring = `0 0 0 2px ${C.emerald}`;
                bg = C.emerald + "10";
                border = C.emerald;
              } else if (d === "fp") {
                ring = `0 0 0 2px ${C.amber}`;
                bg = C.amber + "22";
                border = C.amber;
              } else if (d === "tp") {
                ring = `0 0 0 2px ${C.sky}`;
                bg = C.sky + "22";
                border = C.sky;
              } else if (d === "probe") {
                ring = `0 0 0 2px ${C.sky}99`;
              }
              return (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center rounded-[5px] border text-center transition-all duration-300"
                  style={{ width: 30, height: 38, background: bg, borderColor: border, boxShadow: ring }}
                  title={`bit ${i} = ${v}${d ? " · probed" : ""}`}
                >
                  <span className="text-[8px] text-[var(--w-faint)] leading-none">{i}</span>
                  <span
                    className="text-[13px] font-bold leading-none mt-0.5"
                    style={{ color: set ? C.emerald : "var(--w-faint)" }}
                  >
                    {v}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* insert zone */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[var(--w-muted)] mb-2">
            <Plus size={13} style={{ color: C.emerald }} /> insert into the filter
          </div>
          <div className="flex flex-wrap items-stretch gap-1.5">
            {INSERT_POOL.map((w) => {
              const on = inserted.includes(w);
              return (
                <button
                  key={w}
                  onClick={() => insert(w)}
                  disabled={on}
                  className={`px-2.5 py-1 rounded-md text-xs border transition ${
                    on
                      ? "border-emerald-400 bg-emerald-400/15 text-emerald-300"
                      : "border-[var(--w-border)] bg-[var(--w-panel)] text-[var(--w-text)] hover:border-[var(--w-faint)]"
                  }`}
                  title={on ? "already in the set" : "click to insert"}
                >
                  {w}
                  {on ? " ✓" : ""}
                </button>
              );
            })}
            <button
              onClick={insertNext}
              className="px-2.5 py-1 rounded-md text-xs border border-[var(--w-border)] bg-[var(--w-panel)] text-[var(--w-muted)] hover:border-[var(--w-faint)] transition"
            >
              + insert next
            </button>
            <button
              onClick={reset}
              className="px-2.5 py-1 rounded-md text-xs border border-[var(--w-border)] bg-[var(--w-panel)] text-[var(--w-muted)] hover:border-rose-400/60 hover:text-rose-300 transition inline-flex items-center gap-1"
            >
              <RotateCcw size={12} /> reset
            </button>
          </div>
        </div>

        {/* query zone */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[var(--w-muted)] mb-2">
            <Search size={13} style={{ color: C.sky }} /> query the filter
          </div>
          <div className="flex flex-wrap items-stretch gap-1.5 mb-2">
            {["dog", "cat", ...QUERY_ONLY_POOL.slice(0, 4)].map((w) => (
              <button
                key={w}
                onClick={() => setQuery(w)}
                className={`px-2.5 py-1 rounded-md text-xs border transition ${
                  query === w
                    ? "border-sky-400 bg-sky-400/15 text-sky-300"
                    : "border-[var(--w-border)] bg-[var(--w-panel)] text-[var(--w-text)] hover:border-[var(--w-faint)]"
                }`}
                title={inserted.includes(w) ? "was inserted" : "never inserted"}
              >
                {w}
              </button>
            ))}
            <button
              onClick={findFalsePositive}
              className="px-2.5 py-1 rounded-md text-xs border border-amber-400/60 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 transition inline-flex items-center gap-1"
              title="find a never-inserted word whose k bits all happen to be set"
            >
              <Wand2 size={12} /> find a false positive
            </button>
          </div>
          <div className="flex items-stretch gap-1.5">
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doQuery()}
              placeholder="type any word, then Query"
              aria-label="query word"
              className="flex-1 min-w-0 px-2.5 py-1 rounded-md text-xs border bg-[var(--w-panel)] border-[var(--w-border)] text-[var(--w-text)] placeholder:text-[var(--w-faint)] focus:outline-none focus:border-sky-400"
            />
            <button
              onClick={doQuery}
              className="px-3 py-1 rounded-md text-xs border border-sky-400 bg-sky-400/15 text-sky-300 hover:bg-sky-400/25 transition"
            >
              query
            </button>
          </div>
        </div>

        {/* verdict */}
        <Verdict result={result} K={K} />

        {note && (
          <p className="text-[11px] text-amber-300/90 mt-2 leading-relaxed">{note}</p>
        )}

        {/* stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 items-stretch gap-2 mt-4">
          <Stat label="n, inserted" value={stats.n} formula="the true set size" accent={C.emerald} />
          <Stat
            label="bits/element"
            value={stats.n ? stats.bpe.toFixed(1) : "—"}
            formula={`m / n = ${M} / ${stats.n || 0}`}
            accent={C.sky}
          />
          <Stat
            label="fill ratio"
            value={`${Math.round(stats.fill * 100)}%`}
            formula={`${stats.bitsSet} / ${M} bits set`}
            accent={C.amber}
          />
          <Stat
            label="est. FP rate p"
            value={stats.n ? `${(stats.p * 100).toFixed(1)}%` : "—"}
            formula="(1 − e^(−kn/m))^k"
            accent={stats.p > 0.1 ? C.amber : C.emerald}
          />
        </div>

        <p className="text-[11px] text-[var(--w-faint)] mt-4 leading-relaxed">
          The asymmetry is the whole point: <span className="text-emerald-300">absent is always
          right</span>, so it is safe to <span className="text-[var(--w-text)]">skip work</span> (an
          SSTable seek, a cache/origin hit) with zero correctness risk; a{" "}
          <span className="text-amber-300">false positive</span> only costs one wasted lookup. Watch{" "}
          <span className="text-[var(--w-text)]">p</span> climb as the array fills, that is you
          spending accuracy, and it is why ~9.6 bits/element (~1% FP) is the usual sweet spot.
        </p>
      </div>
    </div>
  );
}

function Verdict({ result, K }) {
  if (!result) {
    return (
      <div
        className="rounded-lg border p-4"
        style={{ borderColor: "var(--w-border-soft)", background: "var(--w-panel)" }}
      >
        <div className="text-[11px] uppercase tracking-wide text-[var(--w-muted)]">verdict</div>
        <div className="text-sm text-[var(--w-muted)] mt-1">
          Query a word to check its {K} bits.
        </div>
      </div>
    );
  }
  const { word, allSet, truth, pos } = result;
  let color, Icon, headline, sub;
  if (!allSet) {
    color = C.emerald;
    Icon = Ban;
    headline = `"${word}" — DEFINITELY NOT in the set`;
    sub = "At least one of its k bits is 0, so it was never inserted. This answer is guaranteed correct — a Bloom filter has no false negatives.";
  } else if (truth) {
    color = C.sky;
    Icon = CheckCircle2;
    headline = `"${word}" — PROBABLY present (and it truly is)`;
    sub = "All k bits are set and this word really was inserted: a true positive. Do the real lookup; it will succeed.";
  } else {
    color = C.amber;
    Icon = AlertTriangle;
    headline = `"${word}" — PROBABLY present, but it was NEVER inserted`;
    sub = "All k bits are set only because other keys set them: a FALSE POSITIVE. The real lookup will come back empty — one wasted probe, never a wrong result.";
  }
  return (
    <div
      className="rounded-lg border p-4"
      style={{ borderColor: color + "99", background: color + "12" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={18} style={{ color }} />
        <span className="text-[11px] uppercase tracking-wide text-[var(--w-muted)]">verdict</span>
      </div>
      <div className="text-base font-bold leading-tight" style={{ color }}>
        {headline}
      </div>
      <div className="text-[11px] text-[var(--w-muted)] mt-1 leading-relaxed">{sub}</div>
      <div className="text-[10px] text-[var(--w-faint)] mt-1.5">
        probed bits: [{pos.join(", ")}]
      </div>
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

function Stat({ label, value, formula, accent }) {
  return (
    <div className="h-full flex flex-col rounded-lg border border-[var(--w-border-soft)] bg-[var(--w-panel)] p-2.5">
      <span className="text-[10px] uppercase tracking-wide text-[var(--w-muted)]">{label}</span>
      <span className="text-lg font-bold leading-tight" style={{ color: accent }}>
        {value}
      </span>
      <span className="text-[9px] text-[var(--w-faint)] mt-0.5">{formula}</span>
    </div>
  );
}
