---
title: "Modern System Design Interview"
description: "Course syllabus, Director-altitude system-design and engineering-leadership interview prep."
---

### Modern System Design Interview, taught the RESHADED way

> **Calibrated for you:** Director / Senior Director of Engineering · FAANG + high-scale startups · 2-week runway. The aim is **not** IC-level implementation depth, it's the **architectural judgment and trade-off fluency at the right altitude** that earns credibility with the senior engineers and architects who run this round (see §3).

---

## 1. What this course is

A self-paced course that drills one repeatable method, **RESHADED**, onto a library of reusable **building blocks**, then runs it end-to-end across **~60 design problems**: the canonical set (URL shortener, Instagram, Uber, …), the non-canonical questions real Director loops actually ask (LLD curveballs, architecture-and-org strategy, business-domain systems), a **Gen AI & Agentic AI track** (the LLM, RAG, and agent systems every company now expects its leaders to design and govern), a **data-platform track** (the analytical/OLAP systems, lakehouses, and data pipelines an engineering-and-data leader is expected to design and run), an **engineering-excellence track** (the security, quality, and production-operations rounds a Director owns, designing the posture, not running the checklist), and a dedicated **leadership track** for the behavioral half of the loop. The goal is not to memorize architectures or rehearse answers. It's to make the method *muscle memory* so that in **both halves of the loop**, the design round and the leadership round, you produce a defensible, quantified, trade-off-aware answer under pressure.

**Two rules govern every lesson:**
1. **Always quantify.** "It scales" is banned. We show the math.
2. **Every decision states its trade-off and the alternative rejected, and why.**

The course is organized into **six Parts** (16 modules):

| Part | Modules | What it gives you |
|---|---|---|
| **I · Method & Fundamentals** | 1–3 | Interview mechanics, the trade-off vocabulary, the reusable building blocks |
| **II · Design Problems** | 4–5 | The full RESHADED walkthroughs: canonical + business-domain HLDs |
| **III · Specialized Design Tracks** | 6–10 | LLD/OOD, the data-platform track, the Gen AI & Agentic track |
| **IV · Engineering Excellence & Operations** | 11–13 | Security & trust, testing & quality, production troubleshooting |
| **V · Strategy & Leadership** | 14–15 | Architecture-and-org strategy, and the behavioral half of the loop |
| **VI · Capstone** | 16 | A fresh problem you drive, plus the red-flags/strong-signals rubric |

> **All six Parts are complete** — 16 modules end to end, including Part IV (Engineering Excellence & Operations: security & trust, testing & quality, production troubleshooting), authored at the same Director altitude, with the same quantify-and-name-the-trade-off discipline, as the rest of the course.

---

## 2. The spine: RESHADED

Run this exact 8-step roadmap on *every* problem. You'll see it named in every walkthrough (the design problems in Modules 4, 5, 8, and 10, adapted per problem) until it's automatic.

| Step | Letter | What you do | The interview signal |
|---|---|---|---|
| 1 | **R**: Requirements | Functional vs. non-functional; scope; read:write ratio; scale | You scope before you build |
| 2 | **E**: Estimation | QPS, storage, bandwidth, memory, server count (back-of-envelope) | You reason in numbers |
| 3 | **S**: Storage | What must persist; store-type selection | You match data to store |
| 4 | **H**: High-level design | Component/box diagram; happy path first | You think in components |
| 5 | **A**: API design | The contract: endpoints / signatures | You define interfaces |
| 6 | **D**: Data model | Schema, relationships, partition/shard keys, indexes | You know where data lives |
| 7 | **E**: Evaluation | Re-check vs. non-functional reqs; find bottlenecks; fix them | You stress your own design |
| 8 | **D**: Design evolution | Justify trade-offs; how it scales/changes under new constraints | You think past v1 |

---

## 3. What the Director-level system-design round actually tests

This round is usually run by Principal/Staff engineers or Architects, your future peers or reports. They are **not** scoring whether you can hand-derive the optimal shard key like a staff IC. They're scoring whether a leader can:

- **Define an architecture** crisply and at the right altitude
- **Name the 2-3 viable approaches** and articulate **pros/cons** of each
- **Make a decision and defend it** against requirements, cost, and risk
- **Know the limit of their own depth**, go deep where the decision turns on it, delegate the rest *credibly* ("I'd have the storage team benchmark X vs. Y; my prior is Y because…")

The real variable is **altitude**, high enough to lead, deep enough that senior engineers respect you. Both failure directions cost you the offer:

| Too high (hand-waving) | Too deep (in the weeds) |
|---|---|
| "It'll scale horizontally." No mechanism. | 20 min tuning a B-tree fanout, no decision reached. |
| Can't name one downside of own choice. | Optimizes detail no Director should own. |
| → reads as *not technical enough to lead* | → reads as *not operating at level* |

Because of this, the course foregrounds the **trade-offs table** and RESHADED's two back-end steps, **Evaluation** and **Design evolution**, in every lesson. The from-scratch mechanics are supporting context; the trade-off argument is the main event.

---

## 4. The other half of the loop: leadership (Module 15)

At Director/Senior Director level, interviewers test **how you move people, make hard calls with incomplete information, and influence without authority**, far more than whether you can shard a counter. That round is roughly **40% of the decision**, and it is a full track: **Module 15, Leadership**, fifteen lessons built the same way as the design track (quantify everything; every position names its limit and the alternative). S·T·A·R·L (Situation → Tension → Action → Result → **Learning**) is the behavioral analog of RESHADED, and Lesson 15.2 generalizes it into the **four answer shapes**, STAR-L for past events, a clarify-principles-options-decide structure for hypotheticals, Position-Mechanism-Number-Limit for philosophy questions, SCQA for exec comms.

The track's defining promise is **currency**: every category lesson carries an explicit *2015-vs-2026* calibration, because the answers that won offers a decade ago (servant-leadership labels, "hire great people and get out of the way," coach-a-low-performer-forever) now read as out of level in a post-founder-mode, post-ZIRP, AI-era, hybrid world.

**Recommendation:** spend serious time building a **quantified, probe-resistant story portfolio** (Lesson 15.3) covering the mandatory slots interviewers check, an up-chart disagreement you won *and* one you lost and committed to, a termination you ran, a layoff or hard constraint you owned, a decision you got wrong, an incident you commanded. Drill it against the **probe simulator** (15.2) until each story survives three levels of follow-up. When you're ready, we can run a live working session to extract and pressure-test your real stories against the matrix.

---

## 5. How each lesson is structured (pedagogy contract)

Every lesson delivers all of these, in this order:

1. Learning objectives (3-5)
2. **Intuition first**, plain-English analogy before any jargon
3. Deep explanation, real mechanics, concrete numbers, named technologies
4. A **diagram artifact** (architecture / flow)
5. An **interactive artifact** when the concept is dynamic
6. Worked example tied to a real system
7. Trade-offs table (A vs. B vs. C, with when-to-use)
8. "What interviewers probe here", strong-signal vs. red-flag answers
9. Common mistakes / misconceptions
10. 3-5 practice questions with model answers
11. Key takeaways (5) + a 2-3 line spaced-repetition recap

The specialized tracks adapt this to their format, the LLD lessons add interface sketches, the strategy lessons lead with sequencing and risk, the Gen AI and data-platform lessons keep the contract while leaning on the building blocks their problems rest on, the leadership lessons add a *2015-vs-2026 calibration* and annotated model answers, but the constants hold throughout: intuition first, every decision quantified with its rejected alternative, a trade-offs view, "what interviewers probe," and a spaced-repetition recap.

---

## 6. The interactive widgets you'll get

Built as self-contained React artifacts, no network calls, at the module where each lands:

- **Estimation Calculator** (DAU, req/user/day, payload → QPS, storage/yr, bandwidth, #servers), *Module 1*
- **Latency Numbers visualizer** (L1/L2/RAM/SSD/network/cross-DC bars), *Module 1*
- **Consistent Hashing ring** (add/remove nodes → live key remapping), *Module 2 & 3*
- **CAP / PACELC explorer** (pick P → C vs. A, with real DB examples), *Module 2*
- **Caching strategies simulator** (cache-aside / write-through / write-back; hits/misses/staleness), *Module 2 & 3*
- **Load-balancing comparison** (round-robin / least-conn / hashing; animated distribution), *Module 3*
- **Sharding/partitioning visualizer** (range / hash / directory; hot-spotting), *Module 2 & 3*
- **Quorum calculator** (N/W/R sliders → strong-consistency check + availability impact), *Module 2*
- **Probe simulator** (three-levels-deep follow-up drill per behavioral question), *Module 15*
- **Story-coverage matrix** (leadership stories × categories; gap highlighting + the mandatory story slots), *Module 15*

---

## 7. Director's Fast Path

An honest accounting: the full course is **~760k words across 16 modules**, far more than you can or should read end-to-end on a 2-week runway. Trying to is itself a triage failure. Here is the triage.

**Must do (full reads):**
- **Module 1**, interview mechanics and estimation reps.
- **Lesson 4.1**, the complete RESHADED walkthrough (TinyURL); it's the template every other Module 4 problem reuses.
- **Module 16**, the capstone plus the red-flags/strong-signals rubric. Read the rubric *before* your first mock.
- **All cheat sheets**, they're the spaced-repetition layer; re-skim daily.
- **Deep-read these Module 4 problems**, the clusters that show up most in Director loops: **4.2-4.5** (Pastebin, rate limiter, Instagram, Twitter/feed), **4.7** (Typeahead), **4.8** (Uber/proximity), and **4.14-4.16** (Ticketmaster, job scheduler, LLM serving).

**Crux-only: 4.9-4.13** (Dropbox, YouTube, Maps, web crawler, notifications, rarer in Director loops). Read each one's crux row in the Module 4 cheat sheet and rehearse defending it out loud; open the full lesson only where the defense doesn't come.

**Skim: Modules 2-3.** If your distributed-systems background is solid, at this level it should be, skim the lessons for unfamiliar terms and rely on the Module 2 and Module 3 cheat sheets as your working reference. Open a full lesson only when a cheat-sheet line isn't already obvious to you.

**The expanded problem set, pick by the loop you're walking into.** These are the questions the canonical Module 4 set leaves out: **Module 6** the LLD/OOD curveballs (parking lot, elevator, Splitwise, restraint and clean modeling, not infra depth), **Module 14** the architecture-and-org-strategy round that is *most* Director-distinctive (monolith breakup, migrations, build-vs-buy, Conway org design), **Module 5** the non-canonical business-domain HLDs (payments, auctions, Google Docs, "design Kafka"). Don't read all of them, let the company tell you: Amazon/Adobe lean LLD (Module 6), Director/Head-of-Eng loops lean strategy (Module 14), fintech/marketplace targets lean Module 5. Each module's cheat sheet carries the crux of every problem in ~5 minutes; deep-read only the 3-4 closest to your target.

**Module 15, the leadership track is not optional.** ~40% of a Director loop is leadership, and it's where most strong system designers lose the offer. Read **15.1-15.3** (the calibration, the four answer frameworks, the story portfolio) first, they're the spine, then the category lessons that match your gaps. Use the **probe simulator** (15.2) and **story-coverage matrix** (15.3) as drill tools, and build your real story bank early; a quantified, probe-resistant portfolio is the single highest-ROI prep on this whole site.

**The Gen AI & Agentic track (Modules 9–10) is now table stakes.** Every company is building on LLMs, and Director loops increasingly add an AI-systems design round and AI-strategy questions on top of the classic ones. **Module 9** is the building blocks: the LLM mental model and its token/cost/latency math, embeddings and vector search, RAG, inference and serving, the prompt-vs-RAG-vs-fine-tune decision, guardrails and safety, evaluation/LLMOps, and cost control, then the agentic half (the agent loop, tools and MCP, memory, multi-agent orchestration, durable runtimes, agent safety), capped by two leadership lessons (AI strategy and build-vs-buy; governance, risk, and cost). **Module 10** runs RESHADED across the eight problems these loops actually ask: enterprise RAG, a ChatGPT-style assistant, an LLM gateway/router, content moderation at scale, a tool-using support agent, an autonomous multi-agent coder, image generation, and a real-time meeting assistant. Read **9.1, 9.3, and 9.9** as the spine, then the problems closest to your target. The two non-negotiables hold here too: quantify (in tokens and dollars), and name the trade-off and the rejected alternative. The raw-serving deep dive lives in **4.16**, which Lesson 9.4 and Module 10 build on.

**The Data Platforms track (Modules 7–8) is the analytics-and-data half of the modern leadership remit.** If your scope sits at the intersection of engineering and data, Director loops now probe whether you can design and *govern* the analytical plane, not just the operational one. **Module 7** is the building blocks: the OLTP-vs-OLAP mental model and the freshness/scan-cost/volume/trust lens, columnar storage, the warehouse/lake/lakehouse and open table formats (Iceberg/Delta), the Spark and Flink engines, real-time OLAP, ingestion and CDC, orchestration and dbt, dimensional and medallion modeling, data quality and contracts, governance/catalog/lineage/mesh, and platform FinOps, capped by two leadership lessons (data strategy and build-vs-buy; leading a data-platform org) carrying the 2015-vs-2026 calibration. **Module 8** runs RESHADED across the six problems these loops ask: the warehouse/lakehouse, a real-time OLAP serving store, a CDC/streaming-ETL pipeline, a product-analytics platform, a data-lake-governance/mesh, and a data-observability platform. Read **7.1, 7.3, and 7.4** as the spine, then the problems closest to your target. The two non-negotiables hold here too: quantify (in bytes scanned, freshness, and dollars), and name the trade-off and the rejected alternative. **Lesson 2.9** (batch vs stream, Lambda/Kappa) is the prerequisite the whole track builds on.

**The Engineering Excellence track (Modules 11–13) is the operational half of the Director remit.** Two kinds of question live here, and both are now standard: a security/quality *design* round ("design auth for this," "make this PCI-compliant," "design our CI/CD and test platform") and an operational-*leadership* probe ("latency just doubled, walk me through how you'd investigate," "how do you run on-call and incidents for a large org?"). The signal is whether you own these as **systems with paved-road defaults and guardrails**, not checklists bolted on at the end, and whether you know where the decision turns on depth versus where you delegate with a stated prior. **Module 11** is security, privacy & trust: the threat-model/zero-trust lens, auth at scale, secrets/KMS and envelope encryption, privacy and right-to-be-forgotten as an *architectural* constraint, compliance-as-architecture, and abuse/fraud/DDoS. **Module 12** is testing & quality as an *operating system*: the test pyramid and where the ROI actually is, contract testing, ephemeral environments, flaky-test economics, shift-left vs test-in-prod, and quality gates/DORA. **Module 13** is production troubleshooting: the diagnostic method, observability-in-anger, SLOs and error budgets, incident command, blameless postmortems, and graceful degradation/on-call health. Read the **11.1, 12.1, and 13.1** framing lessons as the spine, then the topics your loop will probe, fintech and regulated targets lean Module 11, platform and infra roles lean Modules 12–13. The two non-negotiables hold here too: quantify (latency, blast radius, error budget, the flake math), and name the trade-off and the rejected alternative.

**Machine-learning systems (ranking, recommendation, ads) now show up in consumer-scale loops.** The moment a system decides *what to show*, the interview becomes an ML-systems problem, and the tell of a strong answer is treating it as a retrieval-to-ranking-to-re-ranking funnel rather than a sort. **4.17** designs a large-scale recommendation/ranking feed (two-tower candidate generation over an ANN index, a heavy ranking model on a tight latency budget, the online-vs-offline metric gap and feedback loops); **4.18** designs ad ranking and CTR prediction (a per-slot auction on expected value, click-probability times bid, with calibrated predictions, distributed budget pacing, and billing-grade click counting). Both rest on **3.17**, the ML-serving-and-feature-store building block, whose load-bearing idea is killing training-serving skew. The model architecture itself is the one piece you delegate, with a stated prior. Quantify in QPS, latency, and dollars, and name the trade-off and the rejected alternative, the same discipline as everywhere else.

**One convention to know:** lessons park optional IC-level detail in collapsible **"Go deeper"** blocks. Skip them by default; open one only when a decision you're defending turns on that detail. They exist for depth-on-demand, not for the first pass.

---

*End of the overview. Next: Module 1, Interview mechanics.*
