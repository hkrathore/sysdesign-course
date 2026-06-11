import React, { useState, useMemo } from "react";
import { Crosshair, ChevronsDown, SkipForward, RotateCcw, AlertTriangle } from "lucide-react";

// --- palette (verbatim from the sibling widgets) --------------------------
const C = {
  emerald: "#2dd4a7", // survived / safe
  amber: "#e8a13a",   // level 2, mechanism
  sky: "#38bdf8",     // level 1, specifics
  rose: "#f87171",    // level 3, the cost / counterfactual
};

const LEVEL_META = [
  { label: "L1, Specifics", color: C.sky, hint: "dates, numbers, names" },
  { label: "L2, Mechanism", color: C.amber, hint: "how it was measured / decided" },
  { label: "L3, The cost", color: C.rose, hint: "counterfactual, what it cost you" },
];

// ~16 entries, 9 leadership categories. Probes escalate:
// L1 demands specifics, L2 demands mechanism, L3 attacks the cost/counterfactual.
const BANK = [
  {
    category: "Managing out",
    question: "Tell me about managing out a low performer.",
    probes: [
      "What exact date did you first tell them, plainly, that their job was at risk?",
      "What did the PIP week-3 checkpoint measure, specifically, and did they hit it?",
      "You said the team was relieved, what did it cost you that you waited the extra quarter?",
    ],
  },
  {
    category: "Managing out",
    question: "Tell me about a senior engineer who was technically strong but corrosive to the team.",
    probes: [
      "Give me one verbatim line from the feedback you delivered in your first hard conversation with them.",
      "Who on the team had escalated before you acted, and how long had that complaint sat with you?",
      "They were your strongest technical voice, what regressed after they left, in numbers, and was the trade worth it?",
    ],
  },
  {
    category: "Org design",
    question: "Walk me through a reorg you led.",
    probes: [
      "How many engineers changed teams, and how many managers ended up in a different role or gone?",
      "Which team-to-team interface did you get wrong, and when did you discover it?",
      "Six months later, which metric proved the reorg worked, and what would that number have been if you'd done nothing?",
    ],
  },
  {
    category: "Org design",
    question: "How did you decide between a central platform team and embedding engineers in product teams?",
    probes: [
      "What was the actual headcount split you landed on, and why that number and not half it?",
      "What was the platform's adoption metric at month six, and which team refused to migrate?",
      "Which product team paid the tax for your platform bet, and what did you tell their PM when their roadmap slipped?",
    ],
  },
  {
    category: "Hiring",
    question: "Tell me about raising the hiring bar in your org.",
    probes: [
      "What was your offer-accept rate before and after, and your onsite-to-offer ratio?",
      "Name a candidate you rejected that a hiring manager fought you on, what exactly was the disagreement?",
      "You slowed hiring to raise the bar, which committed roadmap item slipped because seats stayed empty, and who absorbed that?",
    ],
  },
  {
    category: "Hiring",
    question: "How do you hire engineering managers?",
    probes: [
      "Of the last five EMs you hired, how many are still in role today?",
      "Which question in your EM loop actually predicts success, and what failure made you add it?",
      "Tell me about the EM hire you got wrong, what signal did you have at offer time and choose to discount?",
    ],
  },
  {
    category: "Tech strategy",
    question: "Tell me about a major architecture bet you sponsored.",
    probes: [
      "What were the two alternatives on the table, and what did each cost in engineer-months?",
      "What was the kill criterion, the measurable condition under which you'd have reversed the bet?",
      "Who disagreed most credibly at the time, and where, looking back, were they right?",
    ],
  },
  {
    category: "Tech strategy",
    question: "Walk me through a buy-vs-build decision you owned.",
    probes: [
      "What was the all-in annual cost of each option, license, integration, and the team to run it?",
      "What exit cost did you model if the vendor failed you, and what scenario triggered that model?",
      "Two years on, what does it actually cost versus your projection, and what did you miss?",
    ],
  },
  {
    category: "Influence",
    question: "Tell me about a time you disagreed with your VP on a significant decision.",
    probes: [
      "What was the exact decision, and what did you say in the room, the actual argument, not a summary?",
      "What data did you bring the second time that you didn't have the first time?",
      "You lost and committed, what did you tell your team, and did any of them later find out you'd disagreed?",
    ],
  },
  {
    category: "Influence",
    question: "Tell me about getting a peer organization to prioritize a dependency you needed.",
    probes: [
      "What was the dependency, and what date did you need it by versus when they had it planned?",
      "What did you offer them, what did your org give up to make their cost worth carrying?",
      "If you'd failed to convince them, what was your fallback, and why didn't you just start with that?",
    ],
  },
  {
    category: "Delivery",
    question: "Tell me about a project that was at risk of missing a hard external date.",
    probes: [
      "How many weeks out did you know, and what was the first scope item you cut?",
      "What leading indicator were you tracking that told you before the team admitted it?",
      "You shipped on the date, what was the quality cost in defects or rollbacks over the next 60 days?",
    ],
  },
  {
    category: "Delivery",
    question: "How do you make delivery commitments to executives?",
    probes: [
      "What confidence level do you attach, and what does '80%' mean operationally in your org?",
      "Tell me about the last commitment you missed, when did you tell stakeholders, relative to when you knew?",
      "Has anyone above you ever stopped trusting your dates? How would you know if they had?",
    ],
  },
  {
    category: "Incidents",
    question: "Walk me through your worst production incident as a leader.",
    probes: [
      "What was the customer-facing impact, in numbers, users, minutes, dollars?",
      "What was the gap between first detection and you declaring sev-1, and why that long?",
      "Which postmortem action item from that incident did you choose not to fund, defend that.",
    ],
  },
  {
    category: "Cost & budget",
    question: "Tell me about a meaningful budget or cloud-spend reduction you drove.",
    probes: [
      "What was the run-rate before and after, and over what period?",
      "Which workload was the biggest single saving, and what did the owning team have to stop doing?",
      "What broke or got slower because of the cuts, and who escalated it to you?",
    ],
  },
  {
    category: "Retention & growth",
    question: "How do you think about regrettable attrition on your teams?",
    probes: [
      "What was your regrettable attrition rate last year, against your company's average?",
      "Take the last regrettable leaver, when was the first signal, and what did you actually try?",
      "Who on your current team would you bet leaves in the next six months, and what are you doing about it this week?",
    ],
  },
  {
    category: "Retention & growth",
    question: "Tell me about growing a senior engineer into a staff engineer.",
    probes: [
      "Name the promotion, what was the scoped initiative the case was built on?",
      "What was missing from their first failed packet, and whose gap was that, theirs or yours?",
      "How many staff-plus promotions in three years, is your bar calibrated to the company's, or is your org a promotion backwater?",
    ],
  },
];

const CATEGORIES = ["All", ...BANK.reduce((acc, e) => (acc.includes(e.category) ? acc : [...acc, e.category]), [])];

export default function ProbeSimulator() {
  const [filter, setFilter] = useState("All");
  const [idx, setIdx] = useState(0);
  const [depth, setDepth] = useState(0); // 0 = no probes revealed yet, 3 = all revealed

  const filtered = useMemo(
    () => (filter === "All" ? BANK : BANK.filter((e) => e.category === filter)),
    [filter]
  );
  const entry = filtered[idx % filtered.length];

  const pickFilter = (cat) => {
    setFilter(cat);
    setIdx(0);
    setDepth(0);
  };
  const reveal = () => setDepth((d) => Math.min(3, d + 1));
  const next = () => {
    // Deterministic cycle: plain index increment through the filtered bank.
    setIdx((i) => (i + 1) % filtered.length);
    setDepth(0);
  };
  const restart = () => setDepth(0);

  return (
    <div className="not-content w-full max-w-3xl mx-auto font-mono text-[var(--w-text)]" style={{ background: "transparent" }}>
      <div className="rounded-xl border p-5 shadow-2xl" style={{ background: "var(--w-bg)", borderColor: "var(--w-border)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Crosshair size={20} style={{ color: C.rose }} />
          <h2 className="text-lg font-bold tracking-tight text-[var(--w-heading)]">Probe Simulator, survive three levels deep</h2>
        </div>
        <p className="text-xs text-[var(--w-muted)] mb-4">
          2026 Director loops dismantle rehearsed stories with follow-ups, not first questions. Answer each prompt
          out loud, <span className="font-semibold" style={{ color: C.amber }}>then</span> reveal the probe, L1 demands
          specifics, L2 demands mechanism, L3 attacks the cost. If any level would stump you, the story isn't ready.
        </p>

        {/* category filter pills */}
        <div className="flex flex-wrap items-stretch gap-2 mb-5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => pickFilter(cat)}
              className={`h-full px-3 py-1.5 rounded-md text-xs border transition ${
                filter === cat
                  ? "border-emerald-400 bg-emerald-400/15 text-emerald-300"
                  : "border-[var(--w-border)] bg-[var(--w-panel)] text-[var(--w-text)] hover:border-[var(--w-faint)]"
              }`}
            >
              {cat}
              {cat !== "All" && (
                <span className="ml-1.5 text-[10px] text-[var(--w-faint)]">
                  {BANK.filter((e) => e.category === cat).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* current question card */}
        <div className="rounded-lg border p-4 mb-4" style={{ background: "var(--w-panel)", borderColor: "var(--w-border-soft)" }}>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <span
              className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wide border"
              style={{ color: C.sky, borderColor: C.sky + "66", background: C.sky + "14" }}
            >
              {entry.category}
            </span>
            <span className="text-[10px] text-[var(--w-faint)]">
              question {(idx % filtered.length) + 1} / {filtered.length}
              {filter !== "All" ? ` in ${filter}` : ""}
            </span>
          </div>
          <div className="text-base font-bold text-[var(--w-heading)] leading-snug">“{entry.question}”</div>
          <div className="text-[11px] text-[var(--w-faint)] mt-1.5">
            Give your full answer first, the 2-minute version you'd actually say. Then start revealing probes.
          </div>
        </div>

        {/* depth indicator */}
        <div className="flex items-stretch gap-2 mb-4">
          {LEVEL_META.map((lv, i) => {
            const reached = depth >= i + 1;
            return (
              <div
                key={lv.label}
                className="flex-1 rounded-md border px-2 py-1.5 text-center transition-all duration-300"
                style={{
                  borderColor: reached ? lv.color : "var(--w-border-soft)",
                  background: reached ? lv.color + "1a" : "var(--w-slot)",
                }}
              >
                <div className="text-[11px] font-bold leading-none" style={{ color: reached ? lv.color : "var(--w-faint)" }}>
                  {lv.label}
                </div>
                <div className="text-[9px] mt-1 leading-none text-[var(--w-faint)]">{lv.hint}</div>
              </div>
            );
          })}
        </div>

        {/* revealed probes */}
        {depth > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            {entry.probes.slice(0, depth).map((p, i) => {
              const lv = LEVEL_META[i];
              return (
                <div
                  key={i}
                  className="rounded-lg border p-3"
                  style={{ borderColor: lv.color + "66", background: lv.color + "0f" }}
                >
                  <div className="text-[10px] uppercase tracking-wide mb-1 font-semibold" style={{ color: lv.color }}>
                    {lv.label}
                  </div>
                  <div className="text-sm leading-snug text-[var(--w-heading)]">“{p}”</div>
                </div>
              );
            })}
          </div>
        )}

        {/* self-scoring prompt after L3 */}
        {depth >= 3 && (
          <div
            className="rounded-lg border p-4 mb-4"
            style={{ borderColor: C.amber + "99", background: C.amber + "12" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={16} style={{ color: C.amber }} />
              <span className="text-[11px] uppercase tracking-wide text-[var(--w-muted)]">Self-score</span>
            </div>
            <div className="text-sm font-bold leading-snug" style={{ color: C.amber }}>
              Could your story survive all three?
            </div>
            <div className="text-[11px] text-[var(--w-muted)] mt-1 leading-relaxed">
              If any probe would stump you, the story needs more specifics, <span className="font-semibold text-[var(--w-text)]">numbers,
              dates, named alternatives</span>. Rehearsed narrative survives L1; only lived detail survives L3. Rework the
              story until the L3 answer is the part you'd volunteer anyway.
            </div>
          </div>
        )}

        {/* controls */}
        <div className="flex flex-wrap items-stretch gap-2">
          {depth < 3 ? (
            <button
              onClick={reveal}
              className="px-3 py-1.5 rounded-md text-xs border font-semibold transition"
              style={{ borderColor: C.rose + "99", background: C.rose + "14", color: C.rose }}
            >
              <span className="inline-flex items-center gap-1.5">
                <ChevronsDown size={14} /> Reveal next probe (L{depth + 1})
              </span>
            </button>
          ) : (
            <button
              onClick={restart}
              className="px-3 py-1.5 rounded-md text-xs border transition border-[var(--w-border)] bg-[var(--w-panel)] text-[var(--w-text)] hover:border-[var(--w-faint)]"
            >
              <span className="inline-flex items-center gap-1.5">
                <RotateCcw size={14} /> Replay this question
              </span>
            </button>
          )}
          <button
            onClick={next}
            className="px-3 py-1.5 rounded-md text-xs border font-semibold transition"
            style={{ borderColor: C.emerald + "99", background: C.emerald + "14", color: C.emerald }}
          >
            <span className="inline-flex items-center gap-1.5">
              <SkipForward size={14} /> Next question
            </span>
          </button>
        </div>

        <p className="text-[11px] text-[var(--w-faint)] mt-4 leading-relaxed">
          The Director-altitude point: interviewers aren't testing whether the story is good, they're testing whether{" "}
          <span className="text-[var(--w-text)]">you were actually the one in the decision</span>. People who were there
          can answer L3 instantly; people retelling someone else's win cannot.
        </p>
      </div>
    </div>
  );
}
