# Module 0 — Syllabus & How to Use This Course
### Modern System Design Interview, taught the RESHADED way

> **Calibrated for you:** Director / Senior Director of Engineering · FAANG + high-scale startups · 2-week runway. The aim is **not** IC-level implementation depth — it's the **architectural judgment and trade-off fluency at the right altitude** that earns credibility with the senior engineers and architects who run this round (see §2a).

---

## 1. What this course is

A self-paced, module-by-module course that drills one repeatable method — **RESHADED** — onto a library of reusable **building blocks**, then runs that method end-to-end on 16 real design problems. The goal is not to memorize architectures. It's to make RESHADED *muscle memory* so that under interview pressure you produce a defensible design, quantify every claim, and name the trade-off you rejected.

**Two rules govern every lesson:**
1. **Always quantify.** "It scales" is banned. We show the math.
2. **Every decision states its trade-off and the alternative rejected, and why.**

---

## 2. The spine: RESHADED

Run this exact 8-step roadmap on *every* problem. You'll see it named in every Module 5 walkthrough until it's automatic.

| Step | Letter | What you do | The interview signal |
|---|---|---|---|
| 1 | **R** — Requirements | Functional vs. non-functional; scope; read:write ratio; scale | You scope before you build |
| 2 | **E** — Estimation | QPS, storage, bandwidth, memory, server count (back-of-envelope) | You reason in numbers |
| 3 | **S** — Storage | What must persist; store-type selection | You match data to store |
| 4 | **H** — High-level design | Component/box diagram; happy path first | You think in components |
| 5 | **A** — API design | The contract: endpoints / signatures | You define interfaces |
| 6 | **D** — Data model | Schema, relationships, partition/shard keys, indexes | You know where data lives |
| 7 | **E** — Evaluation | Re-check vs. non-functional reqs; find bottlenecks; fix them | You stress your own design |
| 8 | **D** — Design evolution | Justify trade-offs; how it scales/changes under new constraints | You think past v1 |

---

## 2a. What the Director-level system-design round actually tests

This round is usually run by Principal/Staff engineers or Architects — your future peers or reports. They are **not** scoring whether you can hand-derive the optimal shard key like a staff IC. They're scoring whether a leader can:

- **Define an architecture** crisply and at the right altitude
- **Name the 2–3 viable approaches** and articulate **pros/cons** of each
- **Make a decision and defend it** against requirements, cost, and risk
- **Know the limit of their own depth** — go deep where the decision turns on it, delegate the rest *credibly* ("I'd have the storage team benchmark X vs. Y; my prior is Y because…")

The real variable is **altitude** — high enough to lead, deep enough that senior engineers respect you. Both failure directions cost you the offer:

| Too high (hand-waving) | Too deep (in the weeds) |
|---|---|
| "It'll scale horizontally." No mechanism. | 20 min tuning a B-tree fanout, no decision reached. |
| Can't name one downside of own choice. | Optimizes detail no Director should own. |
| → reads as *not technical enough to lead* | → reads as *not operating at level* |

Because of this, the course foregrounds the **trade-offs table** and RESHADED's two back-end steps — **Evaluation** and **Design evolution** — in every lesson. The from-scratch mechanics are supporting context; the trade-off argument is the main event.

---

## 3. How each lesson is structured (pedagogy contract)

Every lesson delivers all of these, in this order:

1. Learning objectives (3–5)
2. **Intuition first** — plain-English analogy before any jargon
3. Deep explanation — real mechanics, concrete numbers, named technologies
4. A **diagram artifact** (architecture / flow)
5. An **interactive artifact** when the concept is dynamic
6. Worked example tied to a real system
7. Trade-offs table (A vs. B vs. C, with when-to-use)
8. "What interviewers probe here" — strong-signal vs. red-flag answers
9. Common mistakes / misconceptions
10. 3–5 practice questions with model answers
11. Key takeaways (5) + a 2–3 line spaced-repetition recap

---

## 4. The interactive widgets you'll get

Built as self-contained React artifacts, no network calls, at the module where each lands:

- **Estimation Calculator** (DAU, req/user/day, payload → QPS, storage/yr, bandwidth, #servers) — *Module 1*
- **Latency Numbers visualizer** (L1/L2/RAM/SSD/network/cross-DC bars) — *Module 1*
- **Consistent Hashing ring** (add/remove nodes → live key remapping) — *Module 2 & 3*
- **CAP / PACELC explorer** (pick P → C vs. A, with real DB examples) — *Module 2*
- **Caching strategies simulator** (cache-aside / write-through / write-back; hits/misses/staleness) — *Module 2 & 3*
- **Load-balancing comparison** (round-robin / least-conn / hashing; animated distribution) — *Module 3*
- **Sharding/partitioning visualizer** (range / hash / directory; hot-spotting) — *Module 2 & 3*
- **Quorum calculator** (N/W/R sliders → strong-consistency check + availability impact) — *Module 2*

---

## 5. Delivery protocol

- **One module per turn.** Never the whole course at once.
- Each module ends with (a) an updated progress tracker and (b) a prompt to say **"continue"** or to go deeper.
- Oversized modules get split lesson-by-lesson, and I'll always tell you where we are.

---

## 6. Progress tracker

> Tick boxes as you finish. `[x]` = done, `[ ]` = pending.

### ☑ Module 0 — Syllabus & how to use this course
- [x] **0** — Syllabus, RESHADED spine, study plan *(this document)*

### ☐ Module 1 — Interview mechanics
- [ ] **1.1** — What interviewers actually score (the 5 axes)
- [ ] **1.2** — Functional vs. non-functional requirements
- [ ] **1.3** — Back-of-the-envelope estimation *(+ Estimation Calculator)*
- [ ] **1.4** — Latency numbers every engineer should know *(+ Latency visualizer)*
- [ ] **1.5** — Common failure modes & how to recover live

### ☐ Module 2 — Distributed systems fundamentals & trade-offs
- [ ] **2.1** — Networking, DNS, proxies (forward vs. reverse)
- [ ] **2.2** — SQL vs. NoSQL; when each wins
- [ ] **2.3** — Indexing (B-tree vs. LSM-tree, the write/read trade)
- [ ] **2.4** — Replication (leader-follower, multi-leader, leaderless)
- [ ] **2.5** — Partitioning / sharding (range / hash / directory) *(+ Sharding visualizer)*
- [ ] **2.6** — Consistent hashing *(+ Consistent Hashing ring)*
- [ ] **2.7** — CAP & PACELC *(+ CAP/PACELC explorer)*
- [ ] **2.8** — Consistency models (strong / eventual / causal) + quorum W+R>N *(+ Quorum calculator)*
- [ ] **2.9** — Bloom filters; latency vs. throughput; batch vs. stream
- [ ] **2.10** — REST vs. RPC vs. GraphQL; stateful vs. stateless *(+ Caching simulator)*

### ☐ Module 3 — Building blocks (one lesson each)
- [ ] **3.1** — DNS
- [ ] **3.2** — Load Balancers *(+ Load-balancing comparison)*
- [ ] **3.3** — Databases
- [ ] **3.4** — Key-Value Store
- [ ] **3.5** — CDN
- [ ] **3.6** — Sequencer (unique-ID / causality)
- [ ] **3.7** — Distributed Caching
- [ ] **3.8** — Distributed Messaging Queue
- [ ] **3.9** — Publish-Subscribe
- [ ] **3.10** — Rate Limiter
- [ ] **3.11** — Blob Store
- [ ] **3.12** — Distributed Search
- [ ] **3.13** — Distributed Logging
- [ ] **3.14** — Distributed Monitoring
- [ ] **3.15** — Distributed Task Scheduler
- [ ] **3.16** — Sharded Counters

### ☐ Module 4 — RESHADED end-to-end
- [ ] **4** — Full RESHADED walkthrough on one warm-up problem

### ☐ Module 5 — Design problems (full RESHADED each)
- [ ] **5.1** — TinyURL / URL shortener
- [ ] **5.2** — Pastebin
- [ ] **5.3** — Rate limiter
- [ ] **5.4** — Instagram
- [ ] **5.5** — Twitter + news feed
- [ ] **5.6** — WhatsApp / chat
- [ ] **5.7** — Typeahead / search autocomplete
- [ ] **5.8** — Uber / proximity service
- [ ] **5.9** — Dropbox / Google Drive
- [ ] **5.10** — YouTube / Netflix
- [ ] **5.11** — Google Maps
- [ ] **5.12** — Web crawler
- [ ] **5.13** — Notification system
- [ ] **5.14** — Ticketmaster
- [ ] **5.15** — Distributed job scheduler
- [ ] **5.16** — ChatGPT / LLM serving infrastructure

### ☐ Module 6 — Capstone
- [ ] **6** — Fresh problem, you drive / I critique like an interviewer + red-flags & strong-signals rubric

### Cheat sheets (delivered alongside modules)
- [ ] One Markdown cheat-sheet per module
- [ ] **Master RESHADED cheat-sheet**

---

## 7. A realistic 2-week study plan

Two weeks from beginner-stated to Director-ready is tight. The plan below prioritizes ruthlessly — and reserves time for the thing that usually decides Director loops (see §8).

| Day | Focus | Modules |
|---|---|---|
| 1 | Mechanics + estimation reps | 1 |
| 2–3 | Fundamentals (the trade-off vocabulary) | 2 |
| 4–6 | Building blocks (the Lego library) | 3 |
| 7 | RESHADED end-to-end + first easy problem | 4, 5.1–5.3 |
| 8–9 | Feed/social/chat cluster | 5.4–5.7 |
| 10–11 | Geo, storage, streaming cluster | 5.8–5.12 |
| 12 | Notification / Ticketmaster / scheduler / LLM | 5.13–5.16 |
| 13 | Capstone mock — you drive | 6 |
| 14 | Weak-spot patching + leadership-story rehearsal | review |

**If your real distributed-systems level is higher than "beginner"** (your background suggests it is): compress Modules 2–3 into days 1–3 and spend the recovered time on more Module 5 reps and leadership stories.

---

## 8. The thing the system-design course can't give you

Your project includes a leadership-interview deck, and it's right: at Director/Senior Director level, interviewers test **how you move people, make hard calls with incomplete information, and influence without authority** — far more than whether you can shard a counter. The deck's S·T·A·R·L formula (Situation → Tension → Action → Result → **Learning**) is the behavioral analog of RESHADED.

**Recommendation:** spend ~40% of your two weeks here (system design), and reserve serious time for four prepared leadership stories — a *people* story, a *judgment* story, an *influence* story, and a *pivot/failure* story. Say the word and I'll run a parallel leadership-story track in the same module-by-module format.

---

*End of Module 0. Next: Module 1 — Interview mechanics.*
