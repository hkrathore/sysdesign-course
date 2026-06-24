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
| Story-coverage matrix (leadership story × category, gap highlighting + mandatory slots) | 10.3 | ✅ built (`StoryCoverageMatrix.jsx`) |
| Probe simulator (3-levels-deep follow-up drill per leadership question) | 10.2 | ✅ built (`ProbeSimulator.jsx`) |

Visual style for widgets: **theme-aware — must match the selected Starlight light/dark theme** (use the global `--w-*` CSS variables in `src/styles/global.css` for structural surfaces — bg/panel/border/text/muted/slot — and keep accent colors emerald/amber/sky/rose, which read on both themes; do **not** hardcode `slate-900`/dark backgrounds). Monospace, log/relative bars where useful, formula shown under each output, presets where helpful. **Cards in a row must be equal height** (`items-stretch` on the row + `h-full` on each card). **The widget's root `<div>` MUST include the `not-content` class** (e.g. `className="not-content w-full max-w-3xl mx-auto font-mono …"`) — Starlight's prose opt-out; without it Starlight's `* + *` prose margin leaks onto the widget's grid/flex items (every non-first item gets a 1rem top margin), dropping the 2nd item in a row ~16px and breaking pill/card alignment. Match the existing widgets.

## 9. Course status & remaining work

> **June 2026 reorder & de-numbering pass (current — this is the live structure):** the course was regrouped into **6 Parts / 16 modules** in learning order, and **all plain-text inter-lesson cross-references were removed** (a deterministic script stripped `Module N` / `Lesson N.M` / `(N.M)` / possessives / forward-nav tails / mermaid-label refs; inline subject-position refs were rephrased to topic names). Lessons are now self-contained, so renumbering is cheap and link-safe. Build green: 158 pages, node@22.
>
> **Old → new module map:** 1–3 unchanged · **old 4 (TinyURL) merged into new Module 4 as lesson 4.1** · old 5 (design problems) → new 4 (lessons 4.2–4.16) · old 9 (business-domain) → 5 · old 7 (LLD) → 6 · old 13 (data foundations) → 7 · old 14 (data problems) → 8 · old 11 (GenAI foundations) → 9 · old 12 (GenAI problems) → 10 · old 8 (architecture/strategy) → 14 · old 10 (leadership) → 15 · old 6 (capstone) → 16. Cheat sheets renumbered to match; old module-4 cheat became `reshaded-method.md`.
>
> **Parts:** I · Method & Fundamentals (1–3) · II · Design Problems (4–5) · III · Specialized Design Tracks (6 LLD, 7–8 Data, 9–10 GenAI) · IV · Engineering Excellence & Operations (11 Security/Privacy & Trust, 12 Testing & Quality, 13 Production Troubleshooting) · V · Strategy & Leadership (14 Architecture, 15 Leadership) · VI · Capstone (16).
>
> **Part IV — Engineering Excellence & Operations (modules 11–13) is now complete** (June 2026 authoring pass): 18 Director-altitude lessons, 6 per module, authored by 8-concurrent Opus background subagents from per-lesson specs against the §5 contract, then verified (structure, em-dash density, no inter-lesson cross-refs, build). The **X.1 lessons are framing lessons** following the 7.1/9.1 "for system designers" pattern (11.1 Security & Trust, 12.1 Quality Engineering, 13.1 The Diagnostic Method), which **overwrote** the earlier placeholder openers; X.2–X.6 are the topic lessons (11.2 AuthN/AuthZ, 11.3 Secrets/KMS, 11.4 Privacy/Deletion, 11.5 Compliance, 11.6 Abuse/Fraud/DDoS · 12.2 Contract/Integration, 12.3 Environments/Data, 12.4 Flaky Tests, 12.5 Shift-Left/Test-in-Prod, 12.6 Quality Gates/DORA · 13.2 Observability, 13.3 SLOs/Error Budgets, 13.4 Incident Command, 13.5 Postmortems, 13.6 Degradation/On-Call). Diagrams + prose only (no widgets). The deferred **ML Systems** pair (recsys/ranking/feature-stores) remains optional. Course home (`index.md`) refreshed to match (~740k words, all six Parts complete, Part IV Fast-Path entry added). Cheat sheets for Modules 11–13 are not yet written (optional follow-up).
>
> The entries below describe modules by their **original** numbers (historical); apply the map above.

**Done:** All modules built — Module 0 (syllabus + Director's Fast Path), Modules 1–3 (all lessons), Module 4 (TinyURL walkthrough), Module 5 (15 RESHADED walkthroughs, 5.1–5.15), Module 6 (capstone + rubric), all cheat sheets (Modules 1–10) + Master RESHADED.

**June 2026 Director-altitude pass (complete):** all lessons trimmed from Staff-IC depth to Director altitude (~251k → ~205k visible words); IC depth preserved in "Go deeper" collapsibles (see §7); cheat sheets 2–3 rewritten as decision references; "Director's Fast Path" navigation added to the course home.

**June 2026 expansion pass (complete):** added the *non-canonical* problem set the canonical Module 5 leaves out, plus the leadership half of the loop, all at Director altitude under the §7 conventions:
- **Module 7 — LLD & OOD curveballs** (7.1–7.10): parking lot, elevator, vending machine, LRU cache, rate-limiter LLD, meeting scheduler, Splitwise, movie-ticket seat-locking, chess, Amazon Locker. RESHADED adapted for low-level design (E collapses to capacity sizing; A = class interfaces; D = entity model).
- **Module 8 — Architecture & org strategy** (8.1–8.11): monolith→microservices, legacy modernization, zero-downtime migration, multi-region DR, cost-cut 30–50%, build-vs-buy, internal developer platform, org+architecture (Conway), competing proposals, defend-your-design, fleet OTA. Spine adapted (E = risk/cost/team math; back-end steps carry the answer).
- **Module 9 — Business-domain HLDs** (9.1–9.14): payments, wallet, hotel booking, auction, food delivery, stock exchange, ad-click aggregator, top-K/leaderboard, live comments, Google Docs, online judge, metrics platform, design-Kafka, distributed-cache deep-dive (9.14 is `.mdx`, embeds ConsistentHashingRing + QuorumCalculator).
- **Module 10 — Leadership track** (10.1–10.14): 2026 recalibration, the four answer frameworks (STAR-L / clarify-options-decide / position-mechanism-number-limit / SCQA), story portfolio, then nine category lessons (philosophy, hiring, hard people calls, managing managers, operating system, execution, influence, efficiency-era, AI-era) + company calibration + a demonstrate-don't-describe capstone. Every category lesson carries an explicit **2015-vs-2026 calibration** (the track's promise). Two widgets: `StoryCoverageMatrix.jsx` (10.3), `ProbeSimulator.jsx` (10.2). Layoff legal content is jurisdiction-neutral with US/India/UAE Go-deeper sidebars.

**June 2026 Gen AI & Agentic pass (complete):** added the GenAI/agentic track every Director loop now expects, at Director altitude under the §7 conventions (diagrams + prose only — no new widgets):
- **Module 11 — Gen AI & Agentic foundations** (11.1–11.16): LLMs-for-designers (token/cost/latency model), embeddings & vector search, RAG, inference & serving (concept layer → 5.15), prompt-vs-RAG-vs-fine-tune decision, guardrails/safety, eval & LLMOps, cost & latency; then the agentic half (agent loop, tool use & MCP, memory & context, multi-agent orchestration, durable runtime & HITL, agent safety/governance/eval); capped by two leadership lessons (11.15 AI strategy & build-vs-buy, 11.16 governance/risk/cost) carrying the 2015/2023-vs-2026 calibration like Module 10.
- **Module 12 — Gen AI & Agentic problems** (12.1–12.8): enterprise RAG/doc-Q&A, ChatGPT-style assistant (product layer above 5.15), LLM gateway/router, content moderation at scale, tool-using support agent, multi-agent autonomous coder, text-to-image service, real-time meeting assistant — full RESHADED spine, mirroring 9.1.
- Cheat sheets for Modules 11 & 12 added (decision-reference format). Course home (Module 0) updated: ~530k words across 12 modules, new "Gen AI & Agentic track" Fast-Path section.

**June 2026 Data Platforms pass (complete):** added the *Data Platforms* track for the engineering-and-data Director profile, at Director altitude under the §7 conventions (diagrams + prose only — no new widgets):
- **Module 13 — Data Platform Foundations** (13.1–13.13): data-platforms-for-designers (OLTP↔OLAP, the freshness/scan-cost/volume/trust lens), OLTP-vs-OLAP & columnar storage, warehouse/lake/lakehouse & open table formats (Iceberg/Delta/Hudi), distributed processing engines (Spark & Flink), real-time OLAP/serving engines, ingestion & CDC, orchestration & transformation (Airflow/dbt), analytical data modeling (dimensional + medallion), data quality/testing/contracts, governance/catalog/lineage/data-mesh, platform economics & FinOps; capped by two leadership lessons (13.12 data strategy & build-vs-buy, 13.13 leading a data-platform org) carrying the 2015→2026 calibration like Modules 10/11.
- **Module 14 — Data Platform Problems** (14.1–14.6): data warehouse/lakehouse, real-time OLAP serving, CDC ingestion & streaming ETL, product/behavioral analytics platform, data-lake governance/data-mesh, data quality & observability platform — full RESHADED spine, mirroring Module 9.
- Built explicitly **on Lesson 2.9** (batch/stream, Lambda/Kappa), which the track references rather than re-teaching (the one real overlap with the existing course). Cheat sheets for Modules 13 & 14 added. Course home (Module 0) updated: ~655k words across 14 modules, new "Data Platforms track" Fast-Path section.

Provenance note: 8.10, 8.11, 9.1–9.6 were authored on Sonnet (validated template, spot-checked); everything else in 7–10 on Opus. Modules 11–12 were authored by Opus background subagents from a detailed per-lesson spec, then spot-checked (deep reads of 11.1/11.3/11.12/12.1; structure + fact + cross-ref checks across the rest). Modules 13–14 were authored the same way: anchors 13.1 + 14.1 hand-written by Opus to set the voice bar, the remaining 17 lessons + 2 cheat sheets by Opus background subagents from detailed per-lesson specs, then em-dash density normalized to the house comma-style via a deterministic word-count-preserving transform, and spot-checked (deep read of 13.4; structure + cross-ref checks across the rest). Site is **179 pages, builds clean** (local build needs Node ≥22.12 — repo uses node@22).

**Remaining (optional):** personalized leadership story-bank working session (extract the user's real stories against the 10.3 matrix); a few Module 8 lessons (8.8, 8.9) run ~6k words, slightly over budget — trim if revisited.

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
