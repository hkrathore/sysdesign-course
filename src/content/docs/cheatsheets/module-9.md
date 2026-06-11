---
title: "Module 9 — Business-Domain Problems Cheat Sheet"
description: "The load-bearing decision and canonical one-line answer for all 14 business-domain problems — money, marketplaces, streaming, and the single-component deep dive — on one page."
sidebar:
  order: 9
---

### Every business-domain problem turns on ONE decision. Name it, defend it, price it.

> For each problem: **the crux** (the single decision the round turns on) + **the canonical answer** in one line. Module 9 is where the read-heavy, cache-everything reflexes from Modules 1–5 *invert*: here the binding constraint is usually **correctness under partial failure, contention, or cardinality** — not QPS. Classify which one first, and the architecture pre-decides itself.

**Skim vs deep-read.** Deep-read **9.1** (payments — the idempotency + ledger + reconciliation triad recurs in 9.2/9.5/9.7) and **9.14** (KV deep dive — the component-round credibility gate, assembles the Module 2 spine). Treat **9.2–9.13** as **crux-only** until you can defend each row out loud, then open the full lesson only where your defense cracks. The crux table and the numbers table are the non-negotiable 5-minute pre-loop warm-up.

---

## The 14 cruxes (memorize the right column)

| # | Problem | The load-bearing decision | Canonical Director answer |
|---|---|---|---|
| 9.1 | **Payment Processing** | Exactly-once money on at-least-once infra? | **Idempotency key written to DB *before* the PSP call (derive a PSP-level key from yours) + immutable double-entry ledger (debits=credits, append-only) + nightly reconciliation as a first-class process.** QPS (1–5K TPS) is a footnote; correctness is everything. |
| 9.2 | **Digital Wallet / P2P** | Atomic debit+credit across two shards? | **Size TPS first, then pick the cheapest mechanism it justifies:** saga (default at ~500 TPS), 2PC (<2K TPS), event-sourced ledger (>5K TPS or mandatory audit). Double-spend = CAS `WHERE balance>=amt AND version=:v`. Money in integers. |
| 9.3 | **Hotel Reservation** | Fungible rooms — count, not seat-lock? | **Count-decrement (not CAS-per-seat like Ticketmaster)** behind a two-tier split: eventual Cassandra availability index (1,000:1 search:book) / strong Postgres booking sharded by `property_id`. **Overbooking is a business knob** (`overbook_buffer`), not a bug. |
| 9.4 | **Online Auction (eBay)** | Serialize bids on a single rising max? | **CAS-on-max** — advance `current_price` only if strictly greater, one atomic UPDATE, loser gets 409. <1 bid/s/auction → row-level CAS is enough, **no distributed lock**. Fan-out to thousands of watchers is async (Kafka→WS), never on the bid path. |
| 9.5 | **Food Delivery** | Coordinate three actors under a prep delay? | **An order state machine as the correctness core** (single-writer, CAS transitions); services drawn on **actor boundaries** (= team topology). **Delayed dispatch** at `ready_at − travel_time`. Strong: order state + payment. Eventual: menus, ETAs. |
| 9.6 | **Stock Exchange / Matching** | Strict price-time priority at scale? | **The "do NOT distribute" problem: single-threaded deterministic engine per symbol, journal-backed**, scaled by **partitioning symbols** — never distributing one book. Sequencer assigns a total order; engine is 1–10 µs, I/O dominates. Prices in integer ticks. |
| 9.7 | **Ad Click Aggregator** | Exactly-once counting when every click is money? | **Ask "billing or analytics?" — it flips the design.** Two paths off one Kafka firehose: fast approximate stream (dashboards, at-least-once) + slow exact batch (billing source of truth, dedup on `eventId`). **Never bill from the stream.** Keep raw for recompute. |
| 9.8 | **Top-K / Trending / Leaderboard** | Is exact rank for everyone even required? | **One problem — ranked heavy hitters over a window — under 3 knobs: precision/cost/freshness.** Bounded card → exact Redis sorted set; huge card → **Count-Min Sketch + size-K heap**; payouts → batch exact recompute. Board is AP, never the money source of truth. |
| 9.9 | **Facebook Live Comments** | One-to-millions fan-out with no inbox? | **Inverse of WhatsApp: ephemeral, no durable inbox** — sample the firehose to ~20/s; the **memory-bound connection fleet is the dominant cost → SSE over WebSocket** (halves it). 5M-viewer hot stream uses a tiered dispatch tree. **Degradation is a designed ladder.** |
| 9.10 | **Google Docs (Collab Edit)** | Converge concurrent edits, zero lost keystrokes? | **Name 3 strategies (locking/OT/CRDT), pick CRDT for offline, delegate the convergence proof with a stated prior (Yjs)** — delegation *is* the answer. Op-log = truth, snapshot = cache. Scale axis is connection fan-out (~6M WS); concurrent editors/doc are *tens*. |
| 9.11 | **LeetCode / Online Judge** | Run untrusted code safely under burst? | **Pick isolation by blast radius:** microVM/Firecracker (own kernel, ~125 ms) for adversarial code, gVisor where density wins. Size for the **contest spike** (~5,500 concurrent via Little's Law) with a **pre-warmed pool**, not reactive autoscale. Fresh sandbox per run. |
| 9.12 | **Metrics & Monitoring** | Write rate, or cardinality? | **Cardinality is the cost function** — active series = hosts × series/host (10K×1K = **10M**); one unbounded label (`user_id`) → billions (extinction). Separate write firehose (AP) from read/alert. Retention tiers cut storage 30–360×. Close on build-vs-buy crossover. |
| 9.13 | **Design Kafka** | Where do durability/ordering/delivery knobs sit? | **Partitioned, replicated, append-only log; ordering is per-partition ONLY** (the key sets partition + ordering scope). Durability = `acks=all` + ISR + `min.insync.replicas`. At-least-once + downstream idempotency. Delegate segments/page-cache/zero-copy; keep the contracts. |
| 9.14 | **Distributed Cache / KV** | Eventual + read-repair, or strong quorum? | **Per-request tunable** (Dynamo insight): eventual+read-repair for look-aside cache, strong quorum (W+R>N) for source-of-truth KV — same cluster. Consistent hashing + vnodes (never `mod N`). **Name the 3 failure modes: hot keys, thundering herd, resharding.** Cost = RAM × RF. |

---

## What binds the system — classify it FIRST (it pre-decides everything)

| Binding constraint | Problems | Architectural consequence |
|---|---|---|
| **Correctness / exactly-once** (idempotency + ledger + reconciliation) | Payments (9.1), Wallet (9.2), Ad clicks-billing (9.7) | QPS is trivial; design flows from "where can money be lost / double-counted." Idempotency key + immutable ledger + reconciliation. |
| **Contention on a single row** (atomic conditional write, not a lock) | Hotel (9.3 count), Auction (9.4 CAS-on-max), Wallet (9.2 balance) | One winner per contended unit via CAS; loser fails fast. Check the per-unit write rate before reaching for a distributed lock — usually you don't need one. |
| **Serialization / determinism** (do NOT distribute) | Stock exchange (9.6), Google Docs convergence (9.10) | A total order is the requirement, not a bottleneck to engineer away. Scale on a *different* axis (symbols, documents), keep one writer per unit. |
| **Connection state at extreme fan-out** (the fleet is the cost) | Live comments (9.9), Docs presence (9.10) | Storage/QPS is trivial; the memory-bound socket fleet dominates cost → transport choice (SSE vs WS) is a budget decision. Degradation is a spec. |
| **Cardinality / streaming volume** | Metrics (9.12), Ad clicks (9.7), Top-K (9.8), Kafka (9.13) | The cost function is *number of series* or *exactly-once over a firehose*, not the write rate. Speed-vs-truth split; retention tiers; approximate where exact isn't paid for. |
| **Untrusted execution + burst** | Online judge (9.11) | Skew is trusted control plane vs untrusted execution plane. Isolation by blast radius; pre-warm for scheduled spikes. Generalizes to CI/FaaS/agent sandboxes. |

---

## Recurring patterns (the same moves, reused across the module)

| Pattern | Where it shows up | The move |
|---|---|---|
| **Idempotency key = exactly-once-*effect*** | Payments `(merchant, key)`, Wallet, Food-delivery payment split, Ad-click `eventId`, Renewal scheduler `SHA256(sub+period)` | At-least-once transport + dedup on a stable key. True exactly-once across failures/third-parties is impossible. Write the key to durable store *before* the external call. |
| **Atomic conditional write (CAS), not a lock** | Auction (`> current_price`), Hotel (count decrement), Wallet (`balance>=amt AND version`), Order state machine | DB serializes the contended row; one winner, loser fails fast — no lock convoy. Check per-row write rate first; a distributed lock is usually unjustified. |
| **Immutable append-only ledger** | Payments double-entry, Wallet event-sourced, Auction bid log, Food-delivery order events | Money/state never moves backwards — corrections are new entries. Debits=credits is a hard invariant; drift is detectable at reconciliation, never silent. |
| **Two-tier: eventual search/display ⟂ strong write core** | Hotel (Cassandra/Postgres), Auction (browse/bid), Food (menu/order), Top-K (display/payout), Cache (cache/KV) | The 1,000:1 search:book skew means the read tier and the consistency-critical write core scale independently. Stale display is fine; a stale commit is a bug. |
| **Speed-vs-truth split (approximate now, exact later)** | Ad clicks (stream vs batch), Top-K (CMS vs batch recompute), Metrics (live vs downsampled) | Serve a fast approximate path for humans; keep raw for an authoritative recompute. Never bill/pay from the approximate number. |
| **Reconciliation as a first-class process** | Payments, Wallet, Ad-click billing | The explicit admission that distributed systems drift. Nightly job, alert on every discrepancy, finance-team SLA — built day one, not a cron-script afterthought. |
| **Partition by the unit, keep one writer per unit** | Exchange (per symbol), Matching (sequencer), Order SM (single-writer), Cache (consistent-hash owner) | Serialize *within* a unit, parallelize *across* units. Never distribute a single ordered thing (one book, one ledger row, one document op-log). |
| **Keep the policy, delegate the mechanism (with a prior)** | Cache (eviction/membership), Docs (convergence proof → Yjs), Kafka (storage engine), Metrics (TSDB internals), Judge (cgroup flags) | Own the consistency posture / placement rule / failure-mode mitigations; hand off the IC-deep internals with a stated prior + a benchmark to settle it. *This is the altitude.* |

---

## Numbers to know (per problem)

| Problem | Headline figures |
|---|---|
| Payments | ~1.2K TPS avg, ~5.8K peak (Black Friday 5×) — **trivial for one Postgres node** · 100M txns/day · ~18 TB hot (511 TB/7yr tiered) · idempotency store ~25 GB Redis · recon job ~17 min |
| Wallet | ~500 peak transfers/s (~116 avg) · mechanism bands: **saga ~500, 2PC <2K, event-source >5K TPS** · 2PC coordinator becomes the bottleneck ~2K · ~8 shards · money as **integers** |
| Hotel | **1,000:1 search:book** · ~100K reads/s vs ~120 writes/s · <50 writes/s per property · shard by `property_id` · contrast Ticketmaster's 33K/s single-event spike |
| Auction | **10M concurrent auctions** · <1–1.2K bids/s aggregate, **<1 bid/s per auction** (no lock needed) · 10M reads/s on display · ~1 TB · close scheduling via Redis sorted set (no O(10M) scan) |
| Food Delivery | **5–10× lunch/dinner peak** · ~460 writes/s (peak ~3.7K) · ~2M reads/s · 11-state order machine · stateless autoscales, order DB pre-provisions |
| Stock Exchange | **engine 1–10 µs**, I/O dominates (~20–100 µs journal+standby) · ~50K events/s/symbol · scale by **symbol partition** · prices in **integer ticks** · recover by journal replay (seconds) |
| Ad Clicks | ~1M events/s (peak) · **raw retention ~50 TB/mo = the recompute enabler** · two paths, one firehose · dedup on `eventId` · Lambda now → Kappa once exactly-once-on-replay proven |
| Top-K | exact Redis sorted set **~1 GB/10M entries** vs exact-everything **~50 GB/window** (thrown away) → **CMS + size-K heap = MBs** (one-sided error) · shard by entity, merge top-K |
| Live Comments | raw fan-out **8.5B/s (impossible) → sample to ~20/s** · 5M-viewer hot stream · **~150–250-server memory-bound fleet = the cost** · **SSE halves the fleet vs WS** · ~1.7K writes/s |
| Google Docs | **~6M WebSocket connections** is the scale axis, not edit compute · concurrent editors/doc = **tens** · presence ~10× the edit firehose (~30M/s) · ~200 ms sync target · op-log truth + snapshot cache |
| Online Judge | **contest spike ~5,500 concurrent** (Little's Law) · microVM cold start **~125 ms** · ~12 submits/s steady · pre-warmed pool (contests are scheduled) · per-execution compute ≈ free, **idle capacity is the budget** |
| Metrics | **active series = 10K hosts × 1K series = 10M** (the cost function) · ~1M samples/s firehose · retention tiers (10 s→1 m→1 h) cut storage **30–360×** · build-vs-buy flips ~$4–5M/yr (~2× team cost) |
| Kafka | ~1 GB/s sequential → **~10 brokers** · ~2 PB at 7-day retention · **ordering per-partition only** · RF=3, `min.insync.replicas`=2 · sub-second ISR leader election, no acknowledged loss |
| Cache / KV | ~1 TB working set ×3 RF = **~4 TB RAM, ~20 nodes** · cost **~$20–30K/mo** (RAM × RF is the dial) · p99 <1 ms intra-AZ · one hot key at 2M reads/s is the problem, not 2M total |

---

## What interviewers probe (the strongest probes → strong-signal answer)

| Probe | Strong signal |
|---|---|
| **"How do you prevent a double charge / double spend / double count?"** (9.1, 9.2, 9.7) | **Idempotency key on a stable tuple, written to durable storage *before* the external call**, with a DB unique constraint as the backstop and a derived PSP-level key. Name the crash-between-call-and-commit window as the hard case. *Red flag:* "we check if it exists first" (a check-then-act race) or claiming true exactly-once across third parties. |
| **"This looks like Ticketmaster — is it?"** (9.3 hotel, 9.4 auction) | **No — name the structural difference.** Hotel = *fungible* inventory → count-decrement + overbooking as a business knob. Auction = rolling *CAS-on-max* at <1 bid/s/auction → no distributed lock. Both are contention under an invariant, but the *shape* differs from 33:1-on-one-seat. *Red flag:* reaching for a distributed lock without checking the per-unit write rate, or seat-locking fungible rooms. |
| **"Why would you NOT distribute this / why a single writer?"** (9.6 exchange, 9.10 docs) | **Strict ordering (price-time priority / op convergence) is the requirement, not a bottleneck.** Single-threaded deterministic engine per symbol; scale by partitioning the *unit* (symbols, documents). Determinism buys replay-based recovery. *Red flag:* proposing eventual consistency or horizontal fan-out of one order book / one document's authoritative state. |
| **"Is this for billing or for analytics?"** (9.7 ad clicks; same instinct in 9.8, 9.12) | **The opening move: the answer flips the architecture.** Billing → exact batch over deduped raw, exactly-once, the source of truth. Analytics → fast approximate stream, at-least-once, self-correcting. Two paths off one firehose; **never bill from the stream.** *Red flag:* one Kafka-to-DB pipeline that tries to be both. |
| **"What's the dominant cost — and what do you delegate?"** (9.9 fleet, 9.12 cardinality, 9.14 RAM×RF) | **Name the cost function precisely:** the connection fleet (→ SSE over WS), cardinality (every label is a line item), or RAM × replication factor. Then state where your depth stops — convergence proof (Yjs), eviction internals, TSDB compression, cgroup flags — with a **stated prior + a benchmark to settle it.** *Red flag:* hand-tuning the LRU clock / cgroups for 15 minutes, or "it scales horizontally" with no dollar figure. |

---

## Universal red flags (any problem in this module)

- 🚩 **Treating money/state movement like data movement** — no idempotency key, no immutable ledger, reconciliation as an afterthought. The ordering (key → external call → commit) is load-bearing.
- 🚩 **Reaching for a distributed lock** before checking the per-unit write rate (auction is <1 bid/s/auction — row-level CAS is enough).
- 🚩 **Distributing a single ordered thing** — one order book, one ledger row, one document's op-log. Partition the *unit* instead; keep one writer per unit.
- 🚩 **Designing for write rate when the cost is cardinality** (metrics) or **claiming exactly-once across third parties / on stream replay** before it's proven.
- 🚩 **Billing/paying from an approximate number** (ad-click stream, leaderboard) — the board is AP, never the money source of truth.
- 🚩 **WebSocket + Kafka-per-viewer by reflex** for one-to-millions fan-out, never costing the memory-bound connection fleet; **no graceful-degradation ladder.**
- 🚩 **Seat-locking fungible inventory** (hotel rooms aren't seats) or treating **overbooking as a bug** rather than a calibrated business knob.
- 🚩 **Rat-holing in IC internals** (OT transform derivations, CMS row/col tuning, cgroup flags) instead of deciding and **delegating with a stated prior** — the #1 altitude failure in this module.

---

> **Spaced-repetition recap:** 14 problems, 14 cruxes. **Money triad** (Payments 9.1, Wallet 9.2, Ad-billing 9.7) = idempotency key (written before the external call) + immutable ledger (debits=credits, append-only) + reconciliation as architecture; integers for money. **Contention via CAS not locks** = Hotel (count-decrement + overbooking knob), Auction (CAS-on-max, no lock). **Do-NOT-distribute** = Exchange (single-threaded engine per symbol) + Docs (CRDT, delegate the proof). **Speed-vs-truth split** = Ad clicks (ask billing-or-analytics, two paths one firehose) + Top-K (CMS vs exact recompute). **The fleet/cardinality is the cost** = Live comments (SSE over WS, degradation ladder) + Metrics (cardinality = cost function, retention tiers). **Component-round gates** = Kafka (ordering per-partition only, delegate the storage engine) + Cache/KV (per-request tunable consistency, name hot-key/herd/resharding, cost = RAM × RF). Always: classify the binding constraint first (correctness / contention / serialization / fan-out / cardinality), CAS over locks, name the trade + rejected alternative, price the cost line, and **keep the policy while delegating the mechanism with a stated prior.**
