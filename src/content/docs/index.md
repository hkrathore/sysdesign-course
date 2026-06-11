---
title: "Modern System Design Interview"
description: "Course syllabus, Director-altitude system-design interview prep."
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
| 1 | **R**: Requirements | Functional vs. non-functional; scope; read:write ratio; scale | You scope before you build |
| 2 | **E**: Estimation | QPS, storage, bandwidth, memory, server count (back-of-envelope) | You reason in numbers |
| 3 | **S**: Storage | What must persist; store-type selection | You match data to store |
| 4 | **H**: High-level design | Component/box diagram; happy path first | You think in components |
| 5 | **A**: API design | The contract: endpoints / signatures | You define interfaces |
| 6 | **D**: Data model | Schema, relationships, partition/shard keys, indexes | You know where data lives |
| 7 | **E**: Evaluation | Re-check vs. non-functional reqs; find bottlenecks; fix them | You stress your own design |
| 8 | **D**: Design evolution | Justify trade-offs; how it scales/changes under new constraints | You think past v1 |

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

## 5. A realistic 2-week study plan

Two weeks from beginner-stated to Director-ready is tight. The plan below prioritizes ruthlessly, and reserves time for the thing that usually decides Director loops (see §6).

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

## 6. The other half of the loop: leadership (now Module 10)

At Director/Senior Director level, interviewers test **how you move people, make hard calls with incomplete information, and influence without authority**, far more than whether you can shard a counter. That round is roughly **40% of the decision**, and it is now a full track: **Module 10, Leadership**, fourteen lessons built the same way as the design track (quantify everything; every position names its limit and the alternative). S·T·A·R·L (Situation → Tension → Action → Result → **Learning**) is the behavioral analog of RESHADED, and Lesson 10.2 generalizes it into the **four answer shapes**, STAR-L for past events, a clarify-principles-options-decide structure for hypotheticals, Position-Mechanism-Number-Limit for philosophy questions, SCQA for exec comms.

The track's defining promise is **currency**: every category lesson carries an explicit *2015-vs-2026* calibration, because the answers that won offers a decade ago (servant-leadership labels, "hire great people and get out of the way," coach-a-low-performer-forever) now read as out of level in a post-founder-mode, post-ZIRP, AI-era, hybrid world.

**Recommendation:** spend serious time building a **quantified, probe-resistant story portfolio** (Lesson 10.3) covering the mandatory slots interviewers check, an up-chart disagreement you won *and* one you lost and committed to, a termination you ran, a layoff or hard constraint you owned, a decision you got wrong, an incident you commanded. Drill it against the **probe simulator** (10.2) until each story survives three levels of follow-up. When you're ready, we can run a live working session to extract and pressure-test your real stories against the matrix.

---

*End of Module 0. Next: Module 1, Interview mechanics.*
