# CLAUDE.md — Project Instructions

> This file governs how Claude Code generates and maintains the **Modern System Design Interview** course site. Read it fully before generating any lesson. It is the single source of truth for voice, format, and pedagogy.

---

## 1. What this project is

A self-paced course site teaching system-design interviews via the **RESHADED** framework, calibrated for a **Director / Senior Director of Engineering** candidate targeting FAANG + high-scale startups. Each lesson is an MDX page; dynamic concepts get **embedded, runnable React widgets**; architecture is shown with **Mermaid diagrams**.

The deliverable is not a reference encyclopedia. It is interview preparation that builds **trade-off fluency and architectural judgment at the right altitude.**

## 2. The governing lens — altitude (read this twice)

The system-design round for a Director is run by Principal/Staff engineers or Architects who will be peers or reports. They are **not** scoring IC-level implementation depth. They score whether the candidate can:

- Define an architecture crisply and at the right altitude.
- Name 2–3 viable approaches and articulate pros/cons of each.
- Make a decision and defend it against requirements, cost, and risk.
- Know the limit of their own depth — go deep where the decision turns on it, delegate the rest credibly ("I'd have the storage team benchmark X vs Y; my prior is Y because…").

Two failure directions, both fatal: **too high** (hand-waving, "it scales horizontally," can't name a downside of own choice) → reads as *not technical enough to lead*; **too deep** (20 min tuning a B-tree fanout, no decision) → reads as *not operating at level*.

**Every lesson foregrounds the trade-off argument and RESHADED's back-end steps (Evaluation, Design evolution). Mechanics are supporting context, not the main event.**

## 3. The RESHADED spine — referenced by name in every Module 4/5 problem

| Step | Letter | Do | Signal |
|---|---|---|---|
| 1 | R — Requirements | functional vs non-functional, scope, read:write, scale | scope before build |
| 2 | E — Estimation | QPS, storage, bandwidth, memory, servers | reason in numbers |
| 3 | S — Storage | what persists; store selection | match data to store |
| 4 | H — High-level design | component/box diagram, happy path | think in components |
| 5 | A — API design | endpoints/signatures | define interfaces |
| 6 | D — Data model | schema, keys, indexes | know where data lives |
| 7 | E — Evaluation | re-check vs NFRs, find/fix bottlenecks | stress your own design |
| 8 | D — Design evolution | justify trade-offs, scale under new constraints | think past v1 |

## 4. Two non-negotiable rules (enforce in every lesson)

1. **Always quantify.** "It scales" is banned. Show the math (QPS, nines, latency numbers, storage). Round aggressively; state assumptions.
2. **Every decision states its trade-off and the alternative rejected, and why.** No choice is presented without a critique of it.

## 5. Pedagogy contract — EVERY lesson includes all 11, in this order

1. Learning objectives (3–5).
2. **Intuition first** — a plain-English analogy before any jargon.
3. Deep explanation — real mechanics, concrete numbers, named technologies (Cassandra/DynamoDB, Kafka, Redis, S3, Postgres, etc.).
4. A **diagram** (Mermaid) — architecture or flow.
5. An **interactive widget** when the concept is dynamic (see §8 inventory).
6. Worked example tied to a real system.
7. Trade-offs table (A vs B vs C, with a "use when" column).
8. "What interviewers probe here" — strong-signal vs red-flag answers (Director altitude).
9. Common mistakes / misconceptions.
10. 3–5 practice questions WITH model answers.
11. Key takeaways (5) + a 2–3 line spaced-repetition recap.

## 6. Director-altitude writing rules

- Frame "what interviewers probe" as *Director* signal (trade-off articulation, delegation, cost/risk), not IC trivia.
- Estimation framed as "enough math to make a defensible call," not exhaustive computation.
- Always tie a decision back to a requirement (the R and E steps).
- Name the operational/cost dimension — Directors own budgets and on-call.
- Reference RESHADED by name in Module 4 and 5 walkthroughs until it's muscle memory.

## 7. Tech stack & file conventions

**Stack:** Astro + Starlight (docs theme: auto sidebar, search, dark mode) · MDX lessons · React islands for widgets · Tailwind for widget styling · Mermaid for diagrams.

> Before scaffolding or upgrading, verify **current** setup steps for Astro/Starlight/Tailwind/Mermaid via the Context7 MCP or official docs — versions move fast; do not trust hardcoded version numbers.

**Layout:**
```
src/
  content/docs/
    index.mdx                      # course home (Module 0 syllabus + tracker)
    module-1/lesson-1-1.mdx ...    # one file per lesson
    module-2/...
    cheatsheets/module-1.mdx ...
  components/widgets/
    EstimationCalculator.jsx
    LatencyVisualizer.jsx
    ...                            # one self-contained component per widget
astro.config.mjs                   # Starlight sidebar config, mermaid + mdx integrations
```

**Lesson frontmatter (MDX):**
```mdx
---
title: "1.3 — Back-of-the-Envelope Estimation"
description: Director-altitude estimation reps.
sidebar:
  order: 3
---
import EstimationCalculator from '@components/widgets/EstimationCalculator.jsx';

... lesson body ...

<EstimationCalculator client:load />
```

**Conventions:**
- One MDX file per lesson; numbering matches the syllabus (`lesson-2-5.mdx`).
- Widgets are **self-contained** (no network calls, no browser storage — use React state), default export, Tailwind classes only, may import `lucide-react`, `recharts`, `d3`. Embed with `client:load`.
- Diagrams: Mermaid fenced blocks (rendered by the configured mermaid integration; **click-to-zoom site-wide** via `public/mermaid-zoom.js`). Keep them **readable inline** — component-focused, few boxes, short labels, no step-number clutter or dense detail (zoom is a fallback, not an excuse for an unreadable diagram).
- Update the Starlight sidebar (in `astro.config.mjs`) when adding a lesson.
- Keep each lesson’s body in prose + tables; no marketing tone; no filler; no repetition across lessons.
- **"Go deeper" convention (June 2026 Director-altitude pass):** optional IC-level depth (algorithm internals, formula derivations, full schemas, tuning tables, vendor comparisons) lives in collapsible blocks, never in the visible body:

  ```html
  <details>
  <summary>Go deeper — <topic> (IC depth, optional)</summary>

  (condensed content; blank lines around it so markdown renders)

  </details>
  ```

  Max 1–3 per lesson; widgets and Mermaid diagrams stay **outside** these blocks. The visible body must read complete without them.
- **Visible-body word budgets** (excluding Go-deeper content): Module 1/2 concept lessons ~1.2–4k; Module 3 building blocks ~3–5k; Module 5 RESHADED walkthroughs ~4–6k (a 45-min interview answer is ~3–5k words — the lesson must not be 2× the interview). Common-mistakes lists: 4–5 bullets. The Director move replaces moved depth: one crisp sentence + a delegation line with a stated prior.
- Cheat sheets are **decision references, not mini-lessons**: per concept, decision → trade-off → the number; ≤150 words per building block; skimmable in ~5 min.

## 8. Widget inventory (build as self-contained components)

| Widget | Lesson(s) | Status |
|---|---|---|
| Estimation Calculator | 1.3 | ✅ built (`EstimationCalculator.jsx`) |
| Latency Numbers visualizer | 1.4 | ✅ built (`LatencyVisualizer.jsx`) |
| Sharding/partitioning visualizer (range/hash/directory + hot-spotting) | 2.5, 3.x | ✅ built (`ShardingVisualizer.jsx`) |
| Consistent Hashing ring (add/remove nodes → live remap) | 2.6, 3.x | ✅ built (`ConsistentHashingRing.jsx`) |
| CAP / PACELC explorer (pick P → C vs A, real DB examples) | 2.7 | ✅ built (`CapPacelcExplorer.jsx`) |
| Quorum calculator (N/W/R sliders → strong-consistency + availability) | 2.8 | ✅ built (`QuorumCalculator.jsx`) |
| Caching strategies simulator (cache-aside/write-through/write-back; hits/misses/staleness) | 2.10, 3.x | ✅ built (`CachingStrategiesSimulator.jsx`) |
| Load-balancing comparison (round-robin/least-conn/hashing; animated) | 3.2 | ✅ built (`LoadBalancerComparison.jsx`) |

Visual style for widgets: **theme-aware — must match the selected Starlight light/dark theme** (use the global `--w-*` CSS variables in `src/styles/global.css` for structural surfaces — bg/panel/border/text/muted/slot — and keep accent colors emerald/amber/sky/rose, which read on both themes; do **not** hardcode `slate-900`/dark backgrounds). Monospace, log/relative bars where useful, formula shown under each output, presets where helpful. **Cards in a row must be equal height** (`items-stretch` on the row + `h-full` on each card). **The widget's root `<div>` MUST include the `not-content` class** (e.g. `className="not-content w-full max-w-3xl mx-auto font-mono …"`) — Starlight's prose opt-out; without it Starlight's `* + *` prose margin leaks onto the widget's grid/flex items (every non-first item gets a 1rem top margin), dropping the 2nd item in a row ~16px and breaking pill/card alignment. Match the existing widgets.

## 9. Course status & remaining work

**Done:** All modules built — Module 0 (syllabus + Director's Fast Path), Modules 1–3 (all lessons), Module 4 (TinyURL walkthrough), Module 5 (15 RESHADED walkthroughs, 5.1–5.15), Module 6 (capstone + rubric), all cheat sheets + Master RESHADED.

**June 2026 Director-altitude pass (complete):** all lessons trimmed from Staff-IC depth to Director altitude (~251k → ~205k visible words); IC depth preserved in "Go deeper" collapsibles (see §7); cheat sheets 2–3 rewritten as decision references; "Director's Fast Path" navigation added to the course home. Any future lesson edits must honor the §7 Go-deeper convention and word budgets.

**Remaining (optional):** widgets not yet built (see §8 inventory); 5.16 ChatGPT/LLM-serving exists as 5.15 — numbering is one lower than the original syllabus list.

## 10. How to generate the next lesson (procedure for Claude Code)

1. Read 1–2 existing lessons in the same module to lock voice and depth (the bar is set by Module 1–2 files).
2. Draft the MDX following the §5 pedagogy contract exactly, at §2 altitude, honoring the §4 rules.
3. If the lesson needs a widget (see §8), build it as a self-contained component first, then `import` + embed with `client:load`.
4. Add at least one Mermaid diagram.
5. Register the page in the Starlight sidebar (`astro.config.mjs`).
6. Run `npm run dev` (or `astro build`) and confirm the page renders, the diagram draws, and the widget hydrates with no console errors.
7. For Module 5 problems, structure the entire body as the 8 RESHADED steps, named.
8. Commit with message `module-N: lesson N.M — <title>`.

## 11. Voice & quality bar / self-check before committing

- Director altitude with senior credibility: real numbers, real technologies, real failure modes — but decisions and trade-offs in the visible body, mechanics in "Go deeper" blocks (§7).
- Did every decision name its trade-off and the rejected alternative?
- Is the math shown (no unquantified "it scales")?
- Is "what interviewers probe" pitched at Director altitude, not IC trivia?
- Is the analogy genuinely illuminating, placed before the jargon?
- No filler, no marketing tone, no repetition with earlier lessons.
- All widget content original; no copyrighted text, lyrics, or article reproduction.
