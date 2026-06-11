import React, { useState, useMemo } from "react";
import { Grid3X3, Plus, Trash2, CheckSquare, Square, ClipboardList, AlertTriangle } from "lucide-react";

// --- palette (verbatim from the sibling widgets) --------------------------
const C = {
  emerald: "#2dd4a7", // covered well (2+)
  amber: "#e8a13a",   // thin coverage (1)
  sky: "#38bdf8",     // accents
  rose: "#f87171",    // gap (0)
};

// 9 leadership categories, short labels + a hover hint.
const CATEGORIES = [
  { key: "philosophy", label: "Philosophy", hint: "Leadership philosophy & values under pressure" },
  { key: "hiring", label: "Hiring", hint: "Raising the bar, closing seniors, building pipelines" },
  { key: "people", label: "People Calls", hint: "Hard people decisions, perf, exits, promotions" },
  { key: "mom", label: "Mgr-of-Mgrs", hint: "Leading through managers; growing leaders" },
  { key: "opsys", label: "Operating Sys", hint: "Planning, reviews, metrics, on-call, cadence" },
  { key: "execution", label: "Execution", hint: "Delivery under constraint; turnarounds; incidents" },
  { key: "influence", label: "Influence", hint: "Cross-org wins without authority; exec alignment" },
  { key: "efficiency", label: "Efficiency Era", hint: "Doing more with less, cost, layoffs, focus" },
  { key: "ai", label: "AI Era", hint: "AI adoption, productivity bets, org implications" },
];

const N_CATS = CATEGORIES.length;

// Realistic placeholders so an empty matrix still teaches what a story looks like.
const PLACEHOLDERS = [
  "Re-org that unblocked 3 stuck teams",
  "Hired 5 seniors during a hiring freeze",
  "Managed out a brilliant-but-toxic staff eng",
  "Disagreed with VP on replatform, was right",
  "Disagreed, lost, committed, with a tripwire",
  "Ran the Sev-1 that took checkout down 4h",
  "Owned a 15% layoff in my org",
  "Killed my own pet project to fund the winner",
  "Grew an EM into a Director",
  "Cross-org migration I drove without authority",
  "Cut infra spend 30% without losing velocity",
  "Shipped AI-assisted workflow; 2x review throughput",
];

// The 8 mandatory portfolio slots.
const MANDATORY_SLOTS = [
  "A disagreement you WON, chart went up after",
  "A disagreement you LOST + committed, with a tripwire you set",
  "A termination you personally ran",
  "A layoff or hard constraint you owned end-to-end",
  "A consequential decision you got WRONG",
  "An incident you commanded",
  "A manager you grew + a manager transition that failed",
  "A cross-org influence win (no authority)",
];

let nextId = 100;
const makeRow = (name = "") => ({ id: nextId++, name, cov: Array(N_CATS).fill(false) });

export default function StoryCoverageMatrix() {
  const [rows, setRows] = useState(() => Array.from({ length: 12 }, () => makeRow()));
  const [slots, setSlots] = useState(() => Array(MANDATORY_SLOTS.length).fill(false));

  const setName = (id, name) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, name } : r)));

  const toggleCell = (id, ci) =>
    setRows((rs) =>
      rs.map((r) =>
        r.id === id ? { ...r, cov: r.cov.map((v, i) => (i === ci ? !v : v)) } : r
      )
    );

  const addRow = () => setRows((rs) => [...rs, makeRow()]);
  const removeRow = (id) => setRows((rs) => rs.filter((r) => r.id !== id));
  const toggleSlot = (i) => setSlots((ss) => ss.map((v, j) => (j === i ? !v : v)));

  const colCounts = useMemo(
    () => CATEGORIES.map((_, ci) => rows.reduce((n, r) => n + (r.cov[ci] ? 1 : 0), 0)),
    [rows]
  );
  const gaps = colCounts.filter((n) => n === 0).length;
  const thin = colCounts.filter((n) => n === 1).length;
  const slotsDone = slots.filter(Boolean).length;

  const countColor = (n) => (n === 0 ? C.rose : n === 1 ? C.amber : C.emerald);
  const countWord = (n) => (n === 0 ? "GAP" : n === 1 ? "thin" : "ok");

  // grid template: story-name column + 9 category columns + remove column
  const gridCols = { gridTemplateColumns: `minmax(180px, 1.6fr) repeat(${N_CATS}, minmax(52px, 1fr)) 28px` };

  return (
    <div className="not-content w-full max-w-4xl mx-auto font-mono text-[var(--w-text)]" style={{ background: "transparent" }}>
      <div className="rounded-xl border p-5 shadow-2xl" style={{ background: "var(--w-bg)", borderColor: "var(--w-border)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Grid3X3 size={20} style={{ color: C.emerald }} />
          <h2 className="text-lg font-bold tracking-tight text-[var(--w-heading)]">Story Coverage Matrix, leadership portfolio</h2>
        </div>
        <p className="text-xs text-[var(--w-muted)] mb-1">
          List your stories, then click cells to mark which categories each one can credibly answer.
          A strong story covers 2-3 columns; a strong <span className="font-semibold" style={{ color: C.sky }}>portfolio</span> leaves no column at zero.
        </p>
        <p className="text-[10px] text-[var(--w-faint)] mb-4">
          Scratchpad only, entries live in page state and reset on reload. Copy your matrix out when done.
        </p>

        {/* summary strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-stretch gap-3 mb-5">
          <Stat
            label="Column gaps (0 stories)"
            value={gaps}
            accent={gaps > 0 ? C.rose : C.emerald}
            sub={gaps > 0 ? "an interviewer WILL land here" : "every category has an answer"}
          />
          <Stat
            label="Thin columns (1 story)"
            value={thin}
            accent={thin > 0 ? C.amber : C.emerald}
            sub={thin > 0 ? "one follow-up exhausts you" : "depth behind every category"}
          />
          <Stat
            label="Mandatory slots filled"
            value={`${slotsDone} / ${MANDATORY_SLOTS.length}`}
            accent={slotsDone === MANDATORY_SLOTS.length ? C.emerald : slotsDone >= 5 ? C.amber : C.rose}
            sub="the 8 stories every loop probes for"
          />
        </div>

        {/* matrix */}
        <div className="rounded-lg border p-3 mb-2 overflow-x-auto" style={{ background: "var(--w-panel)", borderColor: "var(--w-border-soft)" }}>
          <div className="min-w-[760px]">
            {/* header row */}
            <div className="grid gap-1 items-end mb-2" style={gridCols}>
              <div className="text-[10px] uppercase tracking-wide text-[var(--w-muted)] pb-1">Story</div>
              {CATEGORIES.map((c) => (
                <div key={c.key} className="text-center pb-1" title={c.hint}>
                  <div className="text-[9px] leading-tight text-[var(--w-muted)] break-words">{c.label}</div>
                </div>
              ))}
              <div />
            </div>

            {/* story rows */}
            {rows.map((r, ri) => (
              <div key={r.id} className="grid gap-1 items-center mb-1" style={gridCols}>
                <input
                  type="text"
                  value={r.name}
                  placeholder={PLACEHOLDERS[ri % PLACEHOLDERS.length]}
                  onChange={(e) => setName(r.id, e.target.value)}
                  aria-label={`Story ${ri + 1} name`}
                  className="w-full rounded-md border px-2 py-1 text-[11px] bg-transparent outline-none focus:border-sky-400"
                  style={{ borderColor: "var(--w-border-soft)", color: "var(--w-text)", background: "var(--w-bg)" }}
                />
                {CATEGORIES.map((c, ci) => (
                  <button
                    key={c.key}
                    onClick={() => toggleCell(r.id, ci)}
                    aria-label={`Toggle ${c.label} for story ${ri + 1}`}
                    aria-pressed={r.cov[ci]}
                    title={`${c.label}: ${r.cov[ci] ? "covered" : "not covered"}`}
                    className="h-7 rounded-md border flex items-center justify-center transition"
                    style={{
                      borderColor: r.cov[ci] ? C.emerald : "var(--w-border-soft)",
                      background: r.cov[ci] ? C.emerald + "22" : "var(--w-slot)",
                    }}
                  >
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full transition"
                      style={{ background: r.cov[ci] ? C.emerald : "var(--w-border-soft)" }}
                    />
                  </button>
                ))}
                <button
                  onClick={() => removeRow(r.id)}
                  aria-label={`Remove story ${ri + 1}`}
                  title="Remove row"
                  className="h-7 w-7 rounded-md border flex items-center justify-center text-[var(--w-faint)] hover:text-rose-400 hover:border-rose-400/60 transition"
                  style={{ borderColor: "var(--w-border-soft)", background: "var(--w-slot)" }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            {/* per-column coverage counts */}
            <div className="grid gap-1 items-center mt-2 pt-2 border-t" style={{ ...gridCols, borderColor: "var(--w-border-soft)" }}>
              <div className="text-[10px] uppercase tracking-wide text-[var(--w-muted)]">Coverage</div>
              {colCounts.map((n, ci) => (
                <div
                  key={CATEGORIES[ci].key}
                  className="h-9 rounded-md border flex flex-col items-center justify-center"
                  title={`${CATEGORIES[ci].label}: ${n} ${n === 1 ? "story" : "stories"}`}
                  style={{ borderColor: countColor(n) + "88", background: countColor(n) + "14" }}
                >
                  <span className="text-[12px] font-bold leading-none" style={{ color: countColor(n) }}>{n}</span>
                  <span className="text-[8px] leading-none mt-0.5" style={{ color: countColor(n) }}>{countWord(n)}</span>
                </div>
              ))}
              <div />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border transition border-[var(--w-border)] bg-[var(--w-panel)] text-[var(--w-text)] hover:border-emerald-400 hover:text-emerald-300"
          >
            <Plus size={13} /> Add story
          </button>
          <div className="flex flex-wrap items-stretch gap-3 text-[10px]">
            <Legend c={C.rose} t="0, gap" />
            <Legend c={C.amber} t="1, thin" />
            <Legend c={C.emerald} t="2+, covered" />
          </div>
        </div>

        {/* mandatory portfolio slots */}
        <div className="rounded-lg border p-4" style={{ background: "var(--w-panel)", borderColor: "var(--w-border-soft)" }}>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[var(--w-muted)]">
              <ClipboardList size={14} style={{ color: C.sky }} />
              The 8 mandatory portfolio slots
            </div>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-md border"
              style={{
                color: slotsDone === MANDATORY_SLOTS.length ? C.emerald : slotsDone >= 5 ? C.amber : C.rose,
                borderColor: (slotsDone === MANDATORY_SLOTS.length ? C.emerald : slotsDone >= 5 ? C.amber : C.rose) + "66",
              }}
            >
              {slotsDone} / {MANDATORY_SLOTS.length} ready
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 items-stretch gap-2">
            {MANDATORY_SLOTS.map((s, i) => (
              <button
                key={s}
                onClick={() => toggleSlot(i)}
                aria-pressed={slots[i]}
                className="h-full flex items-start gap-2 rounded-md border p-2.5 text-left text-[11px] leading-snug transition"
                style={{
                  borderColor: slots[i] ? C.emerald + "88" : "var(--w-border-soft)",
                  background: slots[i] ? C.emerald + "10" : "var(--w-bg)",
                  color: slots[i] ? "var(--w-heading)" : "var(--w-muted)",
                }}
              >
                {slots[i]
                  ? <CheckSquare size={14} className="shrink-0 mt-0.5" style={{ color: C.emerald }} />
                  : <Square size={14} className="shrink-0 mt-0.5" style={{ color: "var(--w-faint)" }} />}
                <span>{s}</span>
              </button>
            ))}
          </div>

          {slotsDone < MANDATORY_SLOTS.length && (
            <div className="flex items-start gap-1.5 text-[10px] text-[var(--w-muted)] mt-3 leading-relaxed">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" style={{ color: C.amber }} />
              <span>
                Unfilled slots are the questions you'll improvise under pressure. Mine your last 5 years for each one, the story exists; you haven't packaged it yet.
              </span>
            </div>
          )}
        </div>

        <p className="text-[11px] text-[var(--w-faint)] mt-4 leading-relaxed">
          The Director-altitude point: interviewers sample <span className="text-[var(--w-text)]">columns</span>, not stories.
          A portfolio of 8-12 stories that each cover 2-3 categories beats 20 single-purpose anecdotes, fewer to rehearse,
          and every follow-up lands on prepared ground.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, accent, sub }) {
  return (
    <div className="h-full flex flex-col rounded-lg border p-3" style={{ background: "var(--w-panel)", borderColor: "var(--w-border-soft)" }}>
      <span className="text-[11px] uppercase tracking-wide text-[var(--w-muted)] mb-1">{label}</span>
      <span className="text-xl font-bold leading-tight" style={{ color: accent }}>{value}</span>
      <span className="text-[10px] text-[var(--w-muted)] mt-1 leading-snug">{sub}</span>
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
