---
title: "Module 7 — LLD & OOD Curveballs Cheat Sheet"
description: "The load-bearing decision and canonical Director answer for all 10 LLD/OOD curveballs, restraint, invariants, and the one race, on one page."
sidebar:
  order: 7
---

### Every LLD problem is undersized on purpose. The empty space is the test.

> The design-problem track punished designing **too small for the load**. The LLD track inverts it: the danger is designing **too big for the requirement**. For each problem: **the load-bearing decision** (the one thing the round turns on) + **the canonical one-line answer**. The pattern catalog is not the point, *restraint, the invariant, and the one real race* are. Spot which RESHADED letters collapse (E → capacity/state-space math, A → class interfaces, H → state machine) before you draw a box.

---

## The 10 cruxes (memorize the right column)

| # | Problem | The load-bearing decision | Canonical answer |
|---|---|---|---|
| 7.1 | **Parking Lot** | How much do you build? | **Restraint.** 3 entities (Lot/Spot/Ticket) + a Vehicle value object; one Strategy (pricing, the *stated* varying axis), nothing else. Volunteer the last-spot race: **atomic free-list `poll()`**, `HELD`+timeout, DB partial-index backstop. |
| 7.2 | **Elevator** | FIFO, nearest-first, or SCAN? | **Ask "simulation or real hardware?" first.** Per-car UP/DOWN/IDLE FSM + two sorted queues; **SCAN/LOOK**, defended on the *starvation bound* (SSTF starves the far floor), not average wait. The real problem is **bank allocation** (8 cars). |
| 7.3 | **Vending Machine** | How do you make illegal states impossible? | **State pattern**, class per state, handlers return next state, illegal events rejected once in the base class. **Conservation of money** by ordering: check change feasibility *before* the motor; **journal before the motor**; reconcile on boot in the customer's favor. |
| 7.4 | **LRU Cache** | Algorithm recall, or interface design? | **Design the `Cache` contract first**; eviction is a **Strategy-pluggable policy** (LRU/LFU/TTL), swappable without callers noticing. HashMap+DLL is *one sentence*. Lock granularity by **measurement**, a coarse lock is fine until a number says otherwise. |
| 7.5 | **Rate Limiter (LLD)** | Which algorithm, and where does the lock go? | **Strategy seam** (token bucket / sliding-log / fixed window), chosen per requirement. **Token bucket default**; sliding-log only for low-limit, high-stakes rules (memory math). **Per-client lock, never global** (convoy). Name the climb to the distributed rate-limiter at scale. |
| 7.6 | **Meeting Scheduler** | What serializes a check-then-book? | **`TimeRange` value object owns the half-open `[)` overlap rule.** **Pessimistic per-room lock**, *opposite* of Ticketmaster's CAS, because contention is 1,000× lower. **Recurrence = a rule you evaluate, not rows you store** (520 rows/series materialized). |
| 7.7 | **Splitwise** | How do balances never drift? | **State the invariant first: balances sum to zero, always.** **Immutable double-entry ledger** + balances as *derived views* → violation is impossible by construction. **Integer cents** + a deterministic remainder rule. Min-cash-flow = name it, defer it. |
| 7.8 | **Movie Ticket Booking** | Which lock strategy for seat claims? | **One DB is the arbiter** (kill the `ConcurrentHashMap` answer). Seat FSM `AVAILABLE→HELD(ttl)→BOOKED`; **optimistic `UPDATE … WHERE status='AVAILABLE'`**, design for opening night (10-50 contenders/seat), not the matinee. No lock held across payment. |
| 7.9 | **Chess** | Inheritance vs composition, and what do you cut? | **Negotiate scope out loud (the scored deliverable).** Split **piece geometry** (`Piece` polymorphism, ~150 lines, in scope) from **game-state legality** (`RulesEngine`, 400+ lines, stubbed). Litmus: *decidable from the piece's move shape alone?* → geometry. |
| 7.10 | **Amazon Locker** | What is the real scarce resource? | **Reserve a *promise* early, bind the *slot* late.** Hard-reserving at checkout costs ~60% of throughput (Little's law). 3 entities (slot/package/code). **Expiry does NOT free capacity, reclaim is a physical carrier event** (the trap no memorized problem has). |

---

## Recurring patterns (the same 6 moves, reused)

| Pattern | Where it shows up | The move |
|---|---|---|
| **One Strategy per *stated* varying axis, and not one more** | Parking (pricing), Rate Limiter (algorithm), Cache (eviction), Splitwise (split type), Elevator (dispatch) | Every abstraction names the requirement that bought it. Pricing varies → `PricingStrategy`; assignment doesn't → no strategy. **Same pattern, opposite verdict; the requirement decides, not the catalog.** |
| **Explicit state machine; illegal transitions unrepresentable** | Vending (6 states), Elevator (UP/DOWN/IDLE), Parking (spot lifecycle), Booking (seat lifecycle), Locker (slot lifecycle) | A `HELD`/`Refunding`/`OutOfService` state, not an `if`. Draw the **failure transitions unprompted**, they are the interview. Keep the (state×event) matrix as an exhaustiveness **test**. |
| **Name the invariant first, make it structural** | Splitwise (sum-to-zero), Vending (conservation of money), Booking/Parking (no double-issue) | Build so violating it is *impossible by construction* (immutable ledger, atomic claim), not guarded by audit. Enforce it twice, in memory for speed, in the store for truth (defense in depth). |
| **The one race, volunteered before they ask** | Parking (two gates, last spot), Booking (two users, one seat), Scheduler (check-then-book), Vending (cancel vs dispense) | Atomic claim, free-list `poll()`, conditional `UPDATE … WHERE status=…`, or a per-room lock. **Pick the primitive by contention shape, then quantify it** (even a coarse lock survives at gate-scale, say so). |
| **Pick the concurrency primitive by *contention shape*, not reflex** | Booking → optimistic CAS (storms); Scheduler → pessimistic lock (6 writes/s); Cache/Rate Limiter → coarse vs striped by ops/s | Design locks for the worst shape you must *survive*, not the average. **The exact same race gets opposite answers** when contention differs by 1,000× (Ticketmaster vs the meeting scheduler). |
| **Journal before the irreversible physical action; reconcile on boot** | Vending (motor), Parking (restart from open tickets), Booking (idempotent confirm), Locker (door open) | Write-ahead the intent, *then* act; on restart, replay the tail and resolve in-doubt in the **customer's favor**, idempotent via a txn/idempotency key. The exactly-once story, shrunk to one box. |

---

## Numbers to know (per problem)

| Problem | Headline figures |
|---|---|
| Parking Lot | 1,000 spots · ~0.13 cars/s arrival (4 OOM below a throughput problem) · ~0.3 MB live state (fits L2) · ~0.2 GB/yr tickets · coarse-lock contention ~0.0001%, **nothing scales, so build nothing that scales**. |
| Elevator | 30 floors · 8 cars · up-peak ≈ 12% of 3,000 in 5 min → **1.2 arrivals/s** · one car ≈ 22 people/5 min (~6% of peak) → bank of `360/22 ≈ 8` is load-bearing · controller ≈ tens of events/s, **~10,000× headroom → one thread, no locks**. |
| Vending | **6 states × 8 events = 48 cells, ~15 legal** (33 = the bug surface) · 4 booleans = 16 states for 6 (illegal configs type-check) · jam ~0.1-0.5% of vends → **1,500-7,500 money-taken incidents/day** at fleet scale · ~3 s dispense window → power loss is a *when*. |
| LRU Cache | 5K RPS × 10 ops = **~150K cache ops/s** peak · 1M entries × ~650 B ≈ **650 MB** (payload + ~15-20% node overhead) · ~200 ns/locked op → one global lock ≈ **2-5M ops/s → 15-30× headroom** (striping is solving a non-problem). |
| Rate Limiter | 5K req/s, `allow()` ≤50 µs = 2.5% latency, ¼ core · global lock at 50K req/s = **50% utilization → convoy** · token bucket ~50 B/client → 1M = **50 MB**; sliding-log at 1K req/min = 8 KB → 1M = **8 GB (dead as default)**. |
| Meeting Scheduler | 2K rooms × 12/day ÷ 86,400 = **0.3 bookings/s** (~6/s peak) · ~1.8 GB/yr · **recurrence: "weekly forever" 10 yrs = 520 rows/series; 100K series = ~50M phantom rows** vs a ~100 B rule, the whole rules-not-rows argument. |
| Splitwise | 10M MAU × 5/mo ≈ **20 writes/s** (~100/s peak) · ~35 GB/yr · **₹2,000/3 as float = 2000.01 (invariant dead); as cents = 200000/3 = 66666 r2 → [66667, 66667, 66666]**, 2 paise assigned by a stated rule. |
| Movie Booking | **Contenders-per-seat at claim instant: ~1 matinee, ~10-50 opening night** (the decision number) · ~4 bookings/s avg, ~100/s peak (trivial) · TTL 10 min ≫ 2-30 s payment → expiry-vs-payment race rare by construction. |
| Chess | 64 squares · ≤32 pieces · ~35 legal moves/position · **geometry ≈ 150 lines/~20 min; legality 400+ lines/hours** (castling = 5 preconditions, en passant needs prev move), 3:1 work for the layer with the *least* design signal. The scarce resource is **45 minutes**. |
| Amazon Locker | 30K slots/metro · ~1.5-day dwell · **Little's law: λ = 30K/1.5 ≈ 20K packages/day** = total capacity · **hard-reserve at checkout (+2-day transit) → 30K/3.5 ≈ 8.5K/day = −60% throughput** · ~0.25 alloc/s (toy QPS). |

---

## What interviewers probe (the strongest 4: and the strong-signal answer)

| The probe | Strong signal (Director) | Red flag |
|---|---|---|
| **"Walk me through your classes."** (Parking, Chess, Locker, Booking) | 3 entities, each justified by a requirement; **cut list stated out loud** ("reservations are a different problem; out of v1"). For Chess: announce the geometry/legality split and the time budget *before* coding. | 10 classes in 5 minutes; `AbstractVehicleFactory` before a single clarifying question; starts coding the Knight and drowns. |
| **"Two [cars/users] race for the last [spot/seat], what happens?"** (Parking, Booking, Scheduler, Vending) | Already volunteered it. Names the atomic claim (free-list `poll()` / `UPDATE…WHERE status=…` / per-room lock), the `HELD`/TTL window, lazy reclaim, **and quantifies** why the chosen primitive fits the contention shape (even a coarse lock survives at gate-scale). | "I'd add `synchronized` everywhere"; surprise that concurrency exists in an OOD question; a `ConcurrentHashMap` of locked seats that dies at the second app instance. |
| **"Why this pattern and not a `switch` / why one Strategy and not five?"** (Vending, Parking, Rate Limiter) | By **maintenance arithmetic, not taste**: new state = one class vs ~8 edited handlers; 48-cell test pins it. "Pricing varies by stated requirement; assignment doesn't, same pattern, opposite verdict." | Pattern-naming with no cost argument ("Strategy is best practice"), the LLD twin of "it scales." Abstractions on every axis "for flexibility." |
| **"Power dies / payment fails / process restarts mid-operation."** (Vending, Booking, Parking, Locker) | **Journal before the irreversible action**, reconcile on boot in the customer's favor, **idempotent via txn/idempotency key**; no lock held across payment; restart rebuilds derived state from the durable record. Connects to the exactly-once design problems unprompted. | "The transaction is atomic" with no notion of *where* durability lives; in-memory-only state that loses open sessions on restart; retry-the-motor (double-vend). |

---

## Universal red flags (any LLD problem)

- 🚩 **Class explosion before scope lock**, valet, EV charging, loyalty nobody asked for. Scope-cutting is the *first* scored behavior.
- 🚩 **Pattern-first design**, Singleton/Factory/Observer named before requirements are. Every abstraction must name the requirement that bought it.
- 🚩 **Inheritance with no behavioral variation**, `Car`/`Truck`/`Motorcycle` subclasses that differ only by data are an enum wearing a costume.
- 🚩 **A state diagram with only the happy path**, no `Refunding`, no `OutOfService`, no `HELD`. The failure transitions *are* the interview.
- 🚩 **Floating-point money**, an instant design-review flag. Integer cents + a deterministic remainder rule, always.
- 🚩 **Check-then-act under contention** instead of an atomic claim, double-sell, double-issue, double-book.
- 🚩 **In-memory state holding a business invariant**, dies at the second app instance or a restart. The durable store is the arbiter.
- 🚩 **Reaching for distributed machinery** (Redis, sharding, queues) in a 0.3 MB / 6-writes-per-second problem, building-block reflexes mis-fired.
- 🚩 **No quantification**, not classifying which RESHADED letters collapsed, not pricing change-cost (the budget a Director actually protects).

---

> **Spaced-repetition recap:** 10 LLD curveballs, scored on **restraint, the invariant, and the one race**, not the pattern catalog. **Restraint:** Parking (3 entities, one Strategy), Chess (negotiate scope, split geometry from legality), Locker (3 entities, reserve a promise / bind the slot late). **Explicit FSM, illegal states unrepresentable:** Vending (State pattern, conservation of money by ordering), Elevator (SCAN on the starvation bound; the real problem is the bank), Booking (`AVAILABLE→HELD→BOOKED`). **Invariant-first:** Splitwise (immutable ledger sums to zero, integer cents). **Interface over algorithm:** LRU Cache (contract first, eviction pluggable, lock by measurement), Rate Limiter (Strategy seam, token-bucket default, per-client lock, climb to the distributed rate-limiter at scale). **Pick the lock by contention shape:** Booking → optimistic CAS (storms), Scheduler → pessimistic lock (6 writes/s), *same race, opposite answer, 1,000× apart*. Always: classify the skew (E→state-space/capacity math), name the trade + rejected alternative, journal before the irreversible action, delegate firmware with a stated prior.
