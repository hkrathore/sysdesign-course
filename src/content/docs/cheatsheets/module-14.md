---
title: "Module 14 — Architecture & Org Strategy Cheat Sheet"
description: "The load-bearing decision and canonical Director answer for all 11 architecture-strategy problems, one page."
sidebar:
  order: 14
---

### These are not design problems: they're judgment problems. Resist by default, quantify the tax, sequence reversibly, name the stopping condition.

> The design-problem track asked "build the system." This track asks "should you, and how do you change it without breaking the business while 100 people ship into it." There is no QPS to compute, the **load is the org and the legacy**, the **latency is lead time and blast radius**, and the answer is judged on *how it fails and how it's sequenced*, not on a box diagram. Every problem has ONE load-bearing decision. The junior reflex (rewrite, active-active everywhere, build it ourselves, migrate everything, big-bang reorg) is the failure mode the question exists to catch.

**The universal Director move (true for all 11):** **resist the dramatic action by default** → demand the **quantified case** (deploy velocity, revenue-at-risk, TCO, attrition cost) → choose **reversible increments** under live traffic → **name the stopping condition** (what you will *never* do, and why stopping there is success). Mechanics are delegated with a stated prior; the sequence, the gates, and the budget are what you keep.

---

## The 11 cruxes (memorize the right column)

| # | Problem | The crux decision | Canonical answer |
|---|---|---|---|
| 14.1 | **Monolith → Microservices** | Decompose or don't? | **Resist by default.** It's an *org-velocity* problem, not scale. Clear a quantified case (deploys/week, blast radius vs $migration), try **modular monolith first**, then **strangler-fig** route-by-route, and **name the stable core that stays a monolith forever.** |
| 14.2 | **Inherited Legacy System** | Rewrite or modernize-in-place? | **Audit → stabilize → strangle → leave-alone**, never rewrite-by-default. First 90 days *measure* before touching; strangle the hot 15%, retire the dead third, **formally leave the cold rest**. Every quarter ships visible value. |
| 14.3 | **Zero-Downtime Data Migration** | How to prove two live systems match before you trust one? | **Expand → migrate → contract**, rollback arrow at every rung, irreversible step last. **CDC + backfill** (not dual-write); verify with **checksums + dark reads against a numeric mismatch budget**; reads ramp first, **writes flip last** behind one flag; reverse-CDC keeps rollback alive. |
| 14.4 | **Multi-Region & DR** | Active-active everywhere, or tier it? | **DR is an allocation problem, not a pattern.** Tier by **revenue-at-risk**, checkout active-active, catalog warm-standby, analytics backup-restore. RTO/RPO are **business sign-offs** engineering prices. Pay 2× **only where the money flows.** |
| 14.5 | **Cut Infra Cost 30-50%** | What order do you cut in? | **A sequenced program, not a tip list.** Guardrails (SLO burn, DR drill) from hour zero; ladder **in order**: delete idle → rightsize → **then** commit → re-architect. Report **unit cost, not the bill**. **Refuse one cut** (idle DR / N+1) and name it in CFO language. |
| 14.6 | **Build vs Buy** | Does this differentiate? | **A capital-allocation memo, not a tech eval.** **Build only what differentiates**; else buy/adopt. 3-yr **TCO both ways** + opportunity cost (the headline juniors omit). Crossover ≈ **2× the loaded team cost in vendor spend**. **Buy reversibly**, seam, export, written exit triggers. |
| 14.7 | **Internal Developer Platform** | Mandate or earn adoption? | **Internal devs are customers who can refuse.** **Golden path over mandate** (mandates → shadow infra); **escape hatch in the manifest** (`tier: hatch`). Buy the chassis, build the paths. Migrate by **diffusion** (pilots → new-services mandate → deadline *after* ~70% adoption); never block a release. Measure **adoption + TTFD**. |
| 14.8 | **Org + Architecture Co-Design (Conway)** | Where do the team boundaries go? | **Org chart is an architectural input.** **Inverse Conway**, pick the target seams, shape teams onto them. Draw **one artifact** (services inside team boundaries); **one owner per boundary**; **data ownership is the sharpest fracture plane**. **Price attrition** (<5% NFR); reorg in **waves keyed to migration milestones**. |
| 14.9 | **Competing Proposals & Direction** | How to break a two-architect deadlock without taste? | **It's a process problem, not a taste problem.** One **shared requirement sheet with numbers** dissolves half the fight; **criteria signed before scoring**; **one-way vs two-way door** sets the process weight; **ADR records the dissent** + tripwires; disagree-and-commit. Often **buy the loser's one winning row** cheaply inside the winner. |
| 14.10 | **Defend Your Own Design (Netflix)** | How to survive hostile cross-examination on a real system? | **RESHADED as a prep tool**, weighted to Evaluation + Design evolution. **"What I got wrong" is a credibility asset** (1-2 bounded, quantified mistakes). Every decision carries a **rejected alternative + trade-off**; know your **cost data**; **delegate with a prior and a tripwire**. |
| 14.11 | **Fleet OTA Rollout (Moon)** | How to roll to 500K machines so one bad wave can't brick the fleet? | **Constraints → invariants → staged plan.** **Canary/wave ladder with blast-radius math** (wave ceiling = fleet tolerance; first wave 0.1%). **Two separate mechanisms**: device-side **watchdog** (autonomous revert, no Earth) + Earth-side **abort gate** (stops next wave). **Silence = INCONCLUSIVE, not PASS.** Gate soak = one full contact cycle. |

---

## The shared spine: every strategy problem runs an *adapted* RESHADED

| Step | In a product design | In a strategy problem |
|---|---|---|
| **R: Requirements** | features, scope | the **pain inventory, quantified**, "it's slow" is not a requirement |
| **E: Estimation** | QPS, storage | **velocity / cost / TCO / attrition math**, the call falls out of the numbers |
| **S: Storage** | pick the DB | **data ownership**, the breakup, the fracture plane (the hardest, most-skipped step) |
| **H: High-level** | box diagram | the **migration phase machine** / the **org-and-services-as-one-drawing** |
| **A: API** | endpoints | **seam contracts / team APIs**, versioned, owned, the anti-recoupling rule |
| **D: Data model** | schema | the **ownership map**, who owns which service, table, and pager |
| **E: Evaluation** | re-check vs NFRs | stress the **migration/org against its failure modes**, predict where it leaks |
| **D: Design evolution** | 10× traffic | the **sequence, the stopping condition, the kill criteria**, *this carries the lesson* |

> In a product design, H (the diagram) is the deliverable. In a strategy problem, **the last two D-steps are**, a strategy answer with a static end-state and no path to it has said nothing.

---

## Recurring patterns (the same 6 moves, reused)

| Pattern | Where it shows up | The move |
|---|---|---|
| **Resist by default; demand the quantified case** | Monolith, Legacy, DR, Build-vs-Buy, IDP mandate, Big-bang reorg | The dramatic action must clear a number that beats its permanent cost. "Best practice / Netflix does it" is the red flag; the modular monolith / leave-alone / buy is the cheap default. |
| **Strangler-fig: incremental, reversible, never big-bang** | Monolith, Legacy, Migration, Reorg, Platform migration, OTA waves | Grow the new thing *around* the live one, route/seam/wave at a time; a rollback arrow at every rung; the irreversible step last. Big-bang fails by irreversibility + a moving target. |
| **Data ownership is the real boundary** | Monolith DB breakup, Migration sync, Org fracture planes | A shared writable table is a hidden coupling that re-merges the system regardless of the diagram, the **distributed monolith**. Split data (CDC + outbox, reads-first) and the rest follows. One writer per store. |
| **Tier / allocate, spend where the money is** | DR by revenue-at-risk, Cost ladder by spend, Cognitive-load budget, Differentiation test | Don't apply one posture uniformly. ~90% of loss flows through ~15% of services; ~60% of the bill is compute+DB. Pay 2× / build / active-active **only on the slice that earns it.** |
| **Name the stopping condition (success ≠ "done everything")** | Monolith stable core, Legacy leave-alone list, DR Tier-2-stays-backup, Build-not-everything, Reorg redraw-twice | Success is the **metric under the bar**, not the dramatic action completed. Service count, "everything's a microservice," "everything active-active" are *costs*, not KPIs. The deliberately-untouched part is a deliverable. |
| **Sequence against milestones with a checkpoint at every gate; pre-write the abort** | Migration go/no-go, Cost program 72h/30d/6mo, Reorg waves, Platform diffusion, OTA gate soak, Deadlock timebox | Each step is a dated go/no-go with a metric and a named decider; abort thresholds written *before* the work, so 2 a.m. sunk-cost pressure can't override them. |

---

## Numbers to know (per problem)

| Problem | Headline figures |
|---|---|
| Monolith | 100 eng / 12 teams · **0.17 deploys/wk/team → ~5** (~30×) · blast radius **100% → ~8%** · ~$5M/yr coordination tax (growing to ~$10M at 160 eng) vs **~$8M migration + ~$2M/yr permanent** → payback 2-3 yrs · end state **8-12 services around a monolith core**, ~50-60% of code never extracted |
| Legacy | first **90 days = measure** before touching · strangle hot **~15%**, retire dead **~⅓**, leave cold rest · rewrite **>$15M + freeze, >50% fail odds** · ~20% tax for 8 quarters returns **~11 engineers of KTLO** + license line · every quarter ships value |
| Migration | dual-run ≈ **2.2× infra** (~$110K/mo, ~$13K/wk premium) · checksums + dark reads on **~1%** of traffic · mismatch budget **< 0.01% sustained** · row-by-row over 10 TB ≈ 2.5 days/pass (too slow → partition checksums) · rollback in **minutes** via reverse-CDC |
| DR | **~90% revenue-at-risk through ~15% of services** · blanket active-active ≈ **+$30M/yr** (~1.75×) vs **tiered ~+$12.5M** (the $18M delta buys conflicts, not resilience) · ledger 3-region quorum (+50 ms/write, RPO 0) · Tier 1 RTO 30 min, Tier 2 RTO 24 h |
| Cost | $10M bill ≈ **40% compute / 20% DB / 15% storage / 8% transfer / 7% obs** · ladder: delete ~8% → rightsize ~12% → commit ~12% → re-architect ~8-15% · **~32% in 30 days**, **~40-47% in 6 months** · refused cut (idle DR) ≈ **$400K** · regrows in 4-6 quarters without governance |
| Build vs Buy | Datadog math ≈ **$7.8M built vs $7M bought over 3 yrs** (a wash → decided by opportunity cost) · crossover: build wins when governed spend durably clears **~2× loaded team cost** (~$4-5M/yr) · build cost is mostly the **ongoing tail**, not v1 |
| IDP | **$5M/yr toil returned vs $2M/yr team cost** at 400 engineers (linear in honest adoption) · TTFD **days → < 1 hr** · buy chassis **~$300K/yr vs ~$2.5M** in-house · deadline announced *after* **~70% adoption** · holdout carrying cost ~$600K/yr |
| Org/Conway | 40 eng fully meshed = **780 pairwise channels** → 6 teams (4 stream ~28, 1 platform ~6, ~2 enabling) · cognitive load = **2-3 domains / 5-8 services per team** · reorg dip **~$0.5M** · **senior exit $300-500K each** · attrition NFR **< 5%** · platform team forms at **~25-30 eng** |
| Deadlock | 600K orders/day ≈ **7/s avg, ~35/s daily peak, ~140/s Black Friday** (A sized 140/s, B sized 1,400/s) · 140/s to Postgres = a non-event · B ≈ **5× build cost, +$200-300K/yr run** · blocked workstream **~$40K/wk** · one-way door timebox **~2 weeks** |
| Netflix defend | pre-answer the **~10 hostile questions** in writing · **1-2 bounded mistakes** (quantified), 3 "differently" items max · know infra **$/month** + investment in **person-months** · 10× answer names the component + the load at which it saturates |
| Moon OTA | **500K machines** · tolerance **≤1% = 5,000/wave ceiling**; **first wave 500 (0.1%)** · 500 MB ÷ 10 Mbps = **~7 min download** · contact **~40 min/day** → gate soak **≥24 h** · promote at **≥80% HEALTHY beacons**; abort at **>5% error** · full rollout **~100 days** (widen waves, never shrink soaks) |

---

## What interviewers probe (the strongest signal per problem)

| Problem | The probe → strong signal |
|---|---|
| Monolith | "Would you actually do this migration?" → **Resist by default**; demand quantified pain; **modular monolith first**; show where the math flips (growing vs flat headcount). "When do you stop?" → the stable core stays a monolith forever. |
| Legacy | "The CEO wants features, not plumbing, sell it." → **sell capacity, not architecture**: "60% is keep-the-lights-on; this returns ~11 engineers + retires $500K/yr of licenses, shipping value every quarter." Not "tech debt / best practice." |
| Migration | "How do you know the two systems match?" → **layered proof**: checksums for all data + dark reads for live truth + a numeric budget; *unexplained* mismatches block. Not "compare row counts." Rollback = **reverse-CDC flip**, not a stale backup. |
| DR | "Why not active-active everywhere?" → **two costs, quantified**: ~+$18M/yr over tiered *and* a write-conflict problem imported into 80 services. "Who set RPO?" → **the business did**, with the price in front of them. |
| Cost | "Why commitments *after* rightsizing?" → a commitment is a contract on the baseline; **commit first and you pay for the waste 1-3 yrs**, the ordering is a correctness property. "What cut do you refuse?" → a specific line + $ + CFO-language defense. |
| Build vs Buy | "Your lead says they can build it cheaper." → **re-run the math with loaded cost + infra + maintenance tail + opportunity cost**; show the crossover; commit *if* the numbers clear it. Not "we always buy" (dogma) or the six-engineers-equals-the-bill framing. |
| IDP | "Why would teams adopt this?" → it **wins on their metrics** (TTFD days → <1 hr), proven by pilots whose tech leads evangelize. "A team refuses." → segment: genuinely different → `tier: hatch`; merely busy → deadline only after ~70%. Not "leadership mandates it." |
| Org/Conway | "Draw the org for this architecture." → services and teams as **one diagram**; one-owner rule; cognitive-load budget. "Human cost in numbers?" → dip ~$0.5M, **senior exit $300-500K**, <5% attrition NFR. Not "people will adapt." |
| Deadlock | "Two architects deadlocked, what do you do?" → **a process in order**: shared requirement sheet → door classification → **criteria before scoring** → timebox → ADR with dissent + tripwires. Not "I'd get them in a room," not "event-driven is modern." |
| Netflix defend | "What did you get wrong?" → **1-2 bounded mistakes**, production cost quantified, "what I'd do differently" stated. Not "nothing major" (no self-awareness) or a flood of regrets (shouldn't have shipped). |
| Moon OTA | "What stops one bad update bricking the fleet?" → wave 1 = 0.1%; **watchdog reverts the machine, abort gate stops the next wave** (name the distinction); cascade structurally blocked. **Silence = INCONCLUSIVE, not PASS.** Not "monitoring catches it." |

---

## Universal red flags (any strategy problem)

- 🚩 **Jumping to the dramatic action**, drawing microservices / rewriting / active-active-everywhere / "build it ourselves" / big-bang reorg before quantifying the case. The whole genre exists to catch this reflex.
- 🚩 **Arguing from "best practice" or "Netflix does it"** instead of a number tied to *this* org's pain. At 100 engineers the monolith has an org problem, not a scale problem.
- 🚩 **Splitting the code but sharing the database** → the **distributed monolith**: microservice costs, monolith coupling. Data ownership is the real migration.
- 🚩 **No stopping condition**, "everything becomes a microservice / active-active / migrated." The deliberately-untouched core is the success signal, not an unfinished job.
- 🚩 **Big-bang / irreversible cutover** with no rollback arrow, no canary, no dark-read verification, no abort threshold written before the work.
- 🚩 **One posture applied uniformly**, active-active for all 80 services, building all five domains, reorging all 40 people at once, instead of tiering/allocating to the slice that earns it.
- 🚩 **No quantification**, no deploys/week, no revenue-at-risk, no TCO, no attrition dollars, no $/week of a blocked workstream. And not naming the cost line you'd **refuse** (idle DR, the platform team's zero-feature spend).
- 🚩 **Claiming exactly-once anything**, or treating **attrition / people risk as HR's problem**, the people who leave during a botched reorg are the ones holding the undocumented system; their exit *is* an architecture event.
- 🚩 **Delegating without a prior**, "the platform team will figure it out" instead of "my prior is Debezium + Kafka + outbox; they own the bake-off and the SLA." Directors delegate *with* a stated prior and a tripwire.

---

> **Spaced-repetition recap:** 11 problems, one spine, **resist the dramatic action, quantify the case, sequence reversibly, name the stopping condition.** **Strangler-fig** (never big-bang): Monolith, Legacy, live Migration, Reorg waves, Platform diffusion, OTA waves. **Data ownership is the real boundary**, shared DB = distributed monolith; split via CDC + outbox, reads-first. **Tier/allocate**, DR by revenue-at-risk, cost by spend, build by differentiation, teams by cognitive-load budget. **Conway**: org chart is an architectural input; one owner per boundary; price attrition. **Process not taste**: requirement sheet → criteria before scoring → ADR with dissent. **Credibility through honesty**: pre-narrativized mistakes beat a flawless defense. **Blast-radius math**: wave ceiling = fleet tolerance; watchdog + abort gate are two mechanisms. Always: quantify, choose against the rejected alternative, name what you'll never do, sequence with a pre-written abort.
