---
title: "Module 6 — Director Rubric Cheat Sheet"
description: "Red-flags vs strong-signals scorecard — 5 axes, 8 RESHADED steps, 2 fatal altitude modes."
sidebar:
  order: 6
---

### The scorecard the room runs on you. Self-assess the night before. Print this.

The round is a **design review you've been asked to chair** — graded on judgment, not whether you can hand-derive a hash. Every strong cell carries a **Director tell**; if your answer reads identically on a staff-IC scorecard, you haven't cleared the bar. Each red cell is the **hand-wavy twin** of the strong one — watch for the twin.

---

## Director weighting (heaviest first)

**trade-offs (4) > scope (1) ≈ communication (5) > estimation (2) ≈ design (3).**

- Offer is **won/lost on axis 4**, **gated by axis 1**, **textured by axis 5**.
- Axes **4 & 5 are scored continuously at every one of the 8 steps** — not a single "trade-offs moment" at the end. Same answer, graded twice (axes lens + process lens) — that's why the two tables aren't duplicates.
- Axis 5 (communication) is **not** a RESHADED step — it runs underneath everything.
- Axis 3 has **diminishing returns**: past a clean decomposition, more boxes ≠ more signal; grinding mechanics there is an **active anti-signal** ("why is this Director hand-tuning a B-tree?").

---

## Table A — the 5 scoring axes

| # | Axis (weight) | ✅ Strong signal (Director tell) | 🚩 Red flag (hand-wavy twin) |
|---|---|---|---|
| 1 | **Requirements & scoping** *(heavy)* | 3–4 sharp clarifiers, then **cut to a defensible core of 3–5 features**, rest explicitly deferred. Read:write ratio + availability bar pinned **as numbers** before designing. | Draws boxes before scoping. Builds every feature. "Make it scalable + reliable" — no SLO, no read:write. |
| 2 | **Estimation & quantification** *(medium)* | **Orders of magnitude** to make a call: "~700k writes/s → ~10 TB/day → fleet, not a box." Rounds, states assumptions, **number drives a decision** (cache it / shard it). | "It'll be a lot of traffic." No QPS/storage. Or the opposite: 5-min exact arithmetic that changes no decision. |
| 3 | **High-level design** *(medium, diminishing)* | Clean split, **single responsibilities**, legible happy-path flow. Knows when to **stop adding boxes** and move to trade-offs. | Monolith blob, or 30-box diagram with no data flow. Lingers here (comfortable), burning axis-4 clock. |
| 4 | **Trade-off depth & decision-making** *(heaviest)* | Names **2–3 viable approaches**, pros/cons each, **commits to one**, defends vs requirement + cost + risk. Pre-empts "why not X?" by volunteering the rejected option + revisit condition. | Lists options, never **decides**. Or decides but **can't name one downside of own choice**. Design presented as obviously correct. |
| 5 | **Communication & leadership** *(heavy)* | **Drives** + structures out loud. Handles "why not X?" without defensiveness. **Delegates with a stated prior** ("I'd have storage benchmark leveled vs size-tiered; prior is leveled, reads dominate"). Names cost + on-call unprompted. | Waits to be led. Defensive or silently caves on pushback. Grinds every detail (won't delegate) **or** delegates everything (no own depth). |

---

## Table B — the 8 RESHADED steps (same answer, graded as process)

| Step | RESHADED | ✅ Strong signal (Director tell) | 🚩 Red flag (hand-wavy twin) |
|---|---|---|---|
| 1 | **R — Requirements** | Functional vs non-functional split; **scope to 3–5 core**, rest parked; read:write + numeric SLO (e.g. 99.99%) that **drives later choices**. | Jumps to building. No scope cut. NFRs vague ("highly available"), no number to design against. |
| 2 | **E — Estimation** | "Enough math for a defensible call" — OoM QPS/storage/bandwidth, **rounded**, sizes the fleet + justifies cache/shard. | "It scales", no figure — **banned (Rule 1)**. Or a rabbit-hole of exact computation that changes nothing. |
| 3 | **S — Storage** | **Matches data shape to store** + why: "write-heavy append → LSM/Cassandra; transactional+joins → Postgres" — and names the cost (compaction tax, secondary-index expense). | "I'll use a database." No family chosen, or a default with **no alternative + no trade-off (Rule 2)**. |
| 4 | **H — High-level design** | Clear responsibilities, happy path drawn, **read + write paths distinguished**. Stops at the altitude where the decision lives. | Diagram with no data flow, or detail that obscures the decision. Mistakes box-count for signal. |
| 5 | **A — API design** | A few clean signatures that **expose the real contract** (idempotency keys, pagination, auth boundary) — only as deep as the design turns on. | Skipped, or 40 endpoints enumerated like a CRUD spec — depth with no decision in it. |
| 6 | **D — Data model** | Schema + **keys/indexes for the access pattern**; names the **partition key** + why; flags the write tax of each secondary index. Denormalizes deliberately + says so. | Normalized tables, no thought to access pattern or partition key. Indexes "to be safe", no awareness they tax every write. |
| 7 | **E — Evaluation** | **Stresses own design** — names the component that **saturates first, with a number**, + the specific lever (shard hot key / read replica / cache). Re-checks vs Step-1 SLOs. | Surprised anything breaks. "Add more servers", no mechanism, no named bottleneck. Never re-validates vs requirements. |
| 8 | **D — Design evolution** | Past v1: **behaviour at 10×**, which assumption breaks, migration path, **cost/operability** of the next step. A roadmap with trade-offs, not a rewrite. | "It already scales." No 10× story, no failure mode, no awareness the v1 choice has a ceiling. |

**The single most repeated Director tell (Table B):** at any detail *below* the decision's altitude → **"state a default, delegate with a stated prior, move on"** — not resolve it personally. *"I'd have the X team benchmark A vs B; my prior is B because [requirement]"* beats ten minutes of correct mechanics — it shows judgment, org-trust, and altitude awareness at once.

---

## The two fatal failure modes (both break the altitude contract)

| Mode | Sounds like | Why fatal | Reads as | One-line self-correction |
|---|---|---|---|---|
| **Too high — hand-waving** | "It scales horizontally." "We'd add caching." No mechanism, no number, no downside of own choice. | Asserts conclusions with no mechanism — but the **mechanism is the leadership content**. | *Not technical enough to lead.* | **Add a number + a mechanism.** *"At ~50k read QPS the redirect path saturates first → cache sharded by URL hash + read replica; cost is cache-stampede risk on eviction."* |
| **Too deep — rabbit-holing** | 20 min tuning B-tree fanout / hand-deriving a hash; exhaustive math that changes no decision; never reaches trade-offs. | Burns the clock **below the altitude where the decision lives**; no decision made; axis 4 never exercised. | *Not operating at level.* | **Zoom out + delegate the tuning.** *"Going deeper than this decision warrants. Point is collision-free IDs via [approach]; tuning won't change the architecture, so I'd delegate it."* |

Target = the **band between them**: deep where the decision turns on it, high enough to keep deciding + driving everywhere else. **Naming your own altitude correction out loud is itself a strong signal.**

---

## The 60-second pre-loop self-check (a "no" = a red-flag row to fix)

1. **Cut scope to 3–5 features** + parked the rest out loud? *(axis 1 / R)*
2. **Every number drove a decision** — refused "it scales" without one? *(Rule 1 / axis 2 / E)*
3. **Every choice named the rejected alternative + why** — and a downside of the one I picked? *(Rule 2 / axis 4)*
4. **Named the component that breaks first, with a number + a lever?** *(E — Evaluation)*
5. **Delegated ≥1 below-altitude detail with a stated prior**, not ground it myself? *(axis 5 / altitude dial)*

> **Recap:** The room scores **trade-off judgment + communication over mechanics**. Strong = quantify the claim + name the rejected alternative; red = the hand-wavy twin. Two fatal modes — **too high → add a number + mechanism**, **too deep → zoom out + delegate**. Aim for the band: decide everywhere, go deep only where the decision turns.
