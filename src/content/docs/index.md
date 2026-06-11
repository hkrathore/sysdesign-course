---
title: "Modern System Design Interview"
description: "Course syllabus and progress tracker, Director-altitude system-design interview prep."
---

### Modern System Design Interview, taught the RESHADED way

> **Calibrated for you:** Director / Senior Director of Engineering · FAANG + high-scale startups · 2-week runway. The aim is **not** IC-level implementation depth, it's the **architectural judgment and trade-off fluency at the right altitude** that earns credibility with the senior engineers and architects who run this round (see §2a).

---

## 1. What this course is

A self-paced, module-by-module course that drills one repeatable method, **RESHADED**, onto a library of reusable **building blocks**, then runs that method end-to-end on 16 real design problems. The goal is not to memorize architectures. It's to make RESHADED *muscle memory* so that under interview pressure you produce a defensible design, quantify every claim, and name the trade-off you rejected.

**Two rules govern every lesson:**
1. **Always quantify.** "It scales" is banned. We show the math.
2. **Every decision states its trade-off and the alternative rejected, and why.**

---

## 2. The spine: RESHADED

Run this exact 8-step roadmap on *every* problem. You'll see it named in every Module 5 walkthrough until it's automatic.

| Step | Letter | What you do | The interview signal |
|---|---|---|---|
| 1 | **R**, Requirements | Functional vs. non-functional; scope; read:write ratio; scale | You scope before you build |
| 2 | **E**, Estimation | QPS, storage, bandwidth, memory, server count (back-of-envelope) | You reason in numbers |
| 3 | **S**, Storage | What must persist; store-type selection | You match data to store |
| 4 | **H**, High-level design | Component/box diagram; happy path first | You think in components |
| 5 | **A**, API design | The contract: endpoints / signatures | You define interfaces |
| 6 | **D**, Data model | Schema, relationships, partition/shard keys, indexes | You know where data lives |
| 7 | **E**, Evaluation | Re-check vs. non-functional reqs; find bottlenecks; fix them | You stress your own design |
| 8 | **D**, Design evolution | Justify trade-offs; how it scales/changes under new constraints | You think past v1 |

---

## 2a. What the Director-level system-design round actually tests

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

## 3. How each lesson is structured (pedagogy contract)

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

---

## 4. The interactive widgets you'll get

Built as self-contained React artifacts, no network calls, at the module where each lands:

- **Estimation Calculator** (DAU, req/user/day, payload → QPS, storage/yr, bandwidth, #servers), *Module 1*
- **Latency Numbers visualizer** (L1/L2/RAM/SSD/network/cross-DC bars), *Module 1*
- **Consistent Hashing ring** (add/remove nodes → live key remapping), *Module 2 & 3*
- **CAP / PACELC explorer** (pick P → C vs. A, with real DB examples), *Module 2*
- **Caching strategies simulator** (cache-aside / write-through / write-back; hits/misses/staleness), *Module 2 & 3*
- **Load-balancing comparison** (round-robin / least-conn / hashing; animated distribution), *Module 3*
- **Sharding/partitioning visualizer** (range / hash / directory; hot-spotting), *Module 2 & 3*
- **Quorum calculator** (N/W/R sliders → strong-consistency check + availability impact), *Module 2*

---

## 5. Delivery protocol

- **One module per turn.** Never the whole course at once.
- Each module ends with (a) an updated progress tracker and (b) a prompt to say **"continue"** or to go deeper.
- Oversized modules get split lesson-by-lesson, and I'll always tell you where we are.

---

## 6. Progress tracker

> Tick boxes as you finish. `[x]` = done, `[ ]` = pending.

### ☑ Module 0: Syllabus & how to use this course
- [x] **0**, Syllabus, RESHADED spine, study plan *(this document)*

### ☐ Module 1: Interview mechanics
- [ ] **1.1**, What interviewers actually score (the 5 axes)
- [ ] **1.2**, Functional vs. non-functional requirements
- [ ] **1.3**, Back-of-the-envelope estimation *(+ Estimation Calculator)*
- [ ] **1.4**, Latency numbers every engineer should know *(+ Latency visualizer)*
- [ ] **1.5**, Common failure modes & how to recover live

### ☐ Module 2: Distributed systems fundamentals & trade-offs
- [ ] **2.1**, Networking, DNS, proxies (forward vs. reverse)
- [ ] **2.2**, SQL vs. NoSQL; when each wins
- [ ] **2.3**, Indexing (B-tree vs. LSM-tree, the write/read trade)
- [ ] **2.4**, Replication (leader-follower, multi-leader, leaderless)
- [ ] **2.5**, Partitioning / sharding (range / hash / directory) *(+ Sharding visualizer)*
- [ ] **2.6**, Consistent hashing *(+ Consistent Hashing ring)*
- [ ] **2.7**, CAP & PACELC *(+ CAP/PACELC explorer)*
- [ ] **2.8**, Consistency models (strong / eventual / causal) + quorum W+R>N *(+ Quorum calculator)*
- [ ] **2.9**, Bloom filters; latency vs. throughput; batch vs. stream
- [ ] **2.10**, REST vs. RPC vs. GraphQL; stateful vs. stateless *(+ Caching simulator)*

### ☐ Module 3: Building blocks (one lesson each)
- [ ] **3.1**, DNS
- [ ] **3.2**, Load Balancers *(+ Load-balancing comparison)*
- [ ] **3.3**, Databases
- [ ] **3.4**, Key-Value Store
- [ ] **3.5**, CDN
- [ ] **3.6**, Sequencer (unique-ID / causality)
- [ ] **3.7**, Distributed Caching
- [ ] **3.8**, Distributed Messaging Queue
- [ ] **3.9**, Publish-Subscribe
- [ ] **3.10**, Rate Limiter
- [ ] **3.11**, Blob Store
- [ ] **3.12**, Distributed Search
- [ ] **3.13**, Distributed Logging
- [ ] **3.14**, Distributed Monitoring
- [ ] **3.15**, Distributed Task Scheduler
- [ ] **3.16**, Sharded Counters

### ☐ Module 4: RESHADED end-to-end
- [ ] **4**, Full RESHADED walkthrough on one warm-up problem

### ☐ Module 5: Design problems (full RESHADED each)
- [ ] **5.1**, TinyURL / URL shortener
- [ ] **5.2**, Pastebin
- [ ] **5.3**, Rate limiter
- [ ] **5.4**, Instagram
- [ ] **5.5**, Twitter + news feed
- [ ] **5.6**, WhatsApp / chat
- [ ] **5.7**, Typeahead / search autocomplete
- [ ] **5.8**, Uber / proximity service
- [ ] **5.9**, Dropbox / Google Drive
- [ ] **5.10**, YouTube / Netflix
- [ ] **5.11**, Google Maps
- [ ] **5.12**, Web crawler
- [ ] **5.13**, Notification system
- [ ] **5.14**, Ticketmaster
- [ ] **5.15**, Distributed job scheduler
- [ ] **5.16**, ChatGPT / LLM serving infrastructure

### ☐ Module 6: Capstone
- [ ] **6**, Fresh problem, you drive / I critique like an interviewer + red-flags & strong-signals rubric

### ☐ Module 7: LLD & OOD curveballs (the *unmemorizable* design questions)
- [ ] **7.1** Parking lot · **7.2** Elevator · **7.3** Vending machine · **7.4** LRU cache · **7.5** Rate limiter (LLD) · **7.6** Meeting scheduler · **7.7** Splitwise · **7.8** Movie-ticket seat-locking · **7.9** Chess · **7.10** Amazon Locker (cold-open drill)

### ☐ Module 8: Architecture & org strategy (the Director-distinctive round)
- [ ] **8.1** Monolith → microservices · **8.2** Inherited legacy · **8.3** Zero-downtime migration · **8.4** Multi-region DR · **8.5** Cut cost 30-50% · **8.6** Build vs buy · **8.7** Internal developer platform · **8.8** Org + architecture (Conway) · **8.9** Competing proposals · **8.10** Defend your own design · **8.11** Fleet upgrade on the moon

### ☐ Module 9: Business-domain problems (the non-canonical HLD set)
- [ ] **9.1** Payments · **9.2** Digital wallet · **9.3** Hotel booking · **9.4** Online auction · **9.5** Food delivery · **9.6** Stock exchange · **9.7** Ad-click aggregator · **9.8** Top-K / leaderboard · **9.9** Live comments · **9.10** Google Docs · **9.11** Online judge · **9.12** Metrics platform · **9.13** Design Kafka · **9.14** Distributed cache deep-dive

### ☐ Module 10: Leadership track (~40% of the Director loop)
- [ ] **10.1** Recalibrated for 2026 · **10.2** The four answer frameworks · **10.3** Story portfolio · **10.4** Philosophy & style · **10.5** Hiring · **10.6** Hard people calls · **10.7** Managing managers · **10.8** Operating system & metrics · **10.9** Execution under pressure · **10.10** Influence & exec comms · **10.11** Efficiency-era (layoffs/cuts) · **10.12** AI-era leadership · **10.13** Company calibration · **10.14** Demonstrate-don't-describe capstone

### Cheat sheets (delivered alongside modules)
- [ ] One Markdown cheat-sheet per module (Modules 1-10) + **Master RESHADED cheat-sheet**

---

## 7. A realistic 2-week study plan

Two weeks from beginner-stated to Director-ready is tight. The plan below prioritizes ruthlessly, and reserves time for the thing that usually decides Director loops (see §8).

| Day | Focus | Modules |
|---|---|---|
| 1 | Mechanics + estimation reps | 1 |
| 2-3 | Fundamentals (the trade-off vocabulary) | 2 |
| 4-6 | Building blocks (the Lego library) | 3 |
| 7 | RESHADED end-to-end + first easy problem | 4, 5.1-5.3 |
| 8-9 | Feed/social/chat cluster | 5.4-5.7 |
| 10-11 | Geo, storage, streaming cluster | 5.8-5.12 |
| 12 | Notification / Ticketmaster / scheduler / LLM | 5.13-5.16 |
| 13 | Capstone mock, you drive | 6 |
| 14 | Weak-spot patching + leadership-story rehearsal | review |

**If your real distributed-systems level is higher than "beginner"** (your background suggests it is): compress Modules 2-3 into days 1-3 and spend the recovered time on more Module 5 reps and leadership stories.

---

## Director's Fast Path

An honest accounting: the full course is ~250k words, 100+ hours of reading. On a 2-week runway you must **not** read it all; trying to is itself a triage failure. Here is the triage.

**Must do (full reads):**
- **Module 1**, interview mechanics and estimation reps.
- **Module 4**, the complete RESHADED walkthrough; it's the template every Module 5 problem reuses.
- **Module 6**, the capstone plus the red-flags/strong-signals rubric. Read the rubric *before* your first mock.
- **All cheat sheets**, they're the spaced-repetition layer; re-skim daily.
- **Deep-read these Module 5 problems**, the clusters that show up most in Director loops: **5.1-5.4** (Pastebin, rate limiter, Instagram, Twitter/feed), **5.6** (Typeahead), **5.7** (Uber/proximity), and **5.13-5.15** (Ticketmaster, job scheduler, LLM serving).

**Crux-only: 5.8-5.12** (Dropbox, YouTube, Maps, web crawler, notifications, the storage/streaming deep-dives, rarer in Director loops). Read each one's crux row in the Module 5 cheat sheet and rehearse defending it out loud; open the full lesson only where the defense doesn't come.

**Skim: Modules 2-3.** If your distributed-systems background is solid, at this level it should be, skim the lessons for unfamiliar terms and rely on the Module 2 and Module 3 cheat sheets as your working reference. Open a full lesson only when a cheat-sheet line isn't already obvious to you.

**The expanded problem set (Modules 7-9), pick by the loop you're walking into.** These are the questions the canonical Module 5 set leaves out: **Module 7** the LLD/OOD curveballs (parking lot, elevator, Splitwise, restraint and clean modeling, not infra depth), **Module 8** the architecture-and-org-strategy round that is *most* Director-distinctive (monolith breakup, migrations, build-vs-buy, Conway org design), **Module 9** the non-canonical business-domain HLDs (payments, auctions, Google Docs, "design Kafka"). Don't read all 35, let the company tell you: Amazon/Adobe lean LLD (Module 7), Director/Head-of-Eng loops lean strategy (Module 8), fintech/marketplace targets lean Module 9. Each module's cheat sheet carries the crux of every problem in ~5 minutes; deep-read only the 3-4 closest to your target.

**Module 10, the leadership track is not optional.** ~40% of a Director loop is leadership, and it's where most strong system designers lose the offer. Read **10.1-10.3** (the calibration, the four answer frameworks, the story portfolio) first, they're the spine, then the category lessons that match your gaps. Use the **probe simulator** (10.2) and **story-coverage matrix** (10.3) as drill tools, and build your real story bank early; a quantified, probe-resistant portfolio is the single highest-ROI prep on this whole site.

**One convention to know:** lessons park optional IC-level detail in collapsible **"Go deeper"** blocks. Skip them by default; open one only when a decision you're defending turns on that detail. They exist for depth-on-demand, not for the first pass.

---

## 8. The other half of the loop: leadership (now Module 10)

At Director/Senior Director level, interviewers test **how you move people, make hard calls with incomplete information, and influence without authority**, far more than whether you can shard a counter. That round is roughly **40% of the decision**, and it is now a full track: **Module 10, Leadership**, fourteen lessons built the same way as the design track (quantify everything; every position names its limit and the alternative). S·T·A·R·L (Situation → Tension → Action → Result → **Learning**) is the behavioral analog of RESHADED, and Lesson 10.2 generalizes it into the **four answer shapes**, STAR-L for past events, a clarify-principles-options-decide structure for hypotheticals, Position-Mechanism-Number-Limit for philosophy questions, SCQA for exec comms.

The track's defining promise is **currency**: every category lesson carries an explicit *2015-vs-2026* calibration, because the answers that won offers a decade ago (servant-leadership labels, "hire great people and get out of the way," coach-a-low-performer-forever) now read as out of level in a post-founder-mode, post-ZIRP, AI-era, hybrid world.

**Recommendation:** spend serious time building a **quantified, probe-resistant story portfolio** (Lesson 10.3) covering the mandatory slots interviewers check, an up-chart disagreement you won *and* one you lost and committed to, a termination you ran, a layoff or hard constraint you owned, a decision you got wrong, an incident you commanded. Drill it against the **probe simulator** (10.2) until each story survives three levels of follow-up. When you're ready, we can run a live working session to extract and pressure-test your real stories against the matrix.

---

*End of Module 0. Next: Module 1, Interview mechanics.*
