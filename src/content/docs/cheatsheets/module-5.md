---
title: "Module 5 — Design Problems Cheat Sheet"
description: "The crux decision and canonical answer for all 15 RESHADED design problems — one page."
sidebar:
  order: 5
---

### Every problem has ONE load-bearing decision. Name it, defend it, price it.

> For each problem: **the crux** (the single decision the round turns on) + **the canonical answer**. Everything else is plumbing. Spot the read:write skew first — it pre-decides the architecture.

**Skim vs deep-read (2-week runway).** Deep-read **5.1–5.4** (Pastebin, rate limiter, Instagram, Twitter/feed), **5.6** (Typeahead), **5.7** (Uber/proximity), and **5.13–5.15** (Ticketmaster, job scheduler, LLM serving) — those clusters carry most Director loops. Treat **5.8–5.12** (Dropbox, YouTube, Maps, crawler, notifications — the storage/streaming deep-dives, rarer at this level) as **crux-only**: memorize the row below, rehearse defending it out loud, and open the full lesson only where the defense doesn't hold. Whatever you skip, the crux table and numbers table are non-negotiable — they're the 5-minute pre-loop warm-up.

---

## The 15 cruxes (memorize the right column)

| # | Problem | The crux decision | Canonical answer |
|---|---|---|---|
| 5.1 | **Pastebin** | Where do the bytes live? | **Split metadata (KV, strongly-consistent, TTL) from blob (object store, immutable)** — never put bytes in the DB. CDN + Redis for the hot read tail. |
| 5.2 | **Rate Limiter** | How to scale a counter you can't cache or replicate? | Counter path is **~100% writes** → **shard the keyspace** (Redis, in-mem, AP). Single global limit = unshardable hot key → **local leasing** (batch budget, reconcile). |
| 5.3 | **Instagram** | How to build the home feed? | **Fan-out hybrid** — push to follower feeds for the long tail, **pull celebrities at read time + merge**. Media (object store + CDN) split from metadata (Cassandra). |
| 5.4 | **Twitter / Feed** | Push, pull, or hybrid timeline? | **Hybrid** — push (fan-out-on-write) the 99.9%, **pull celebrities** & merge by time-sortable `tweet_id`. Read-heavy 5:1, but push inverts backend to write-heavy. Skip inactive. |
| 5.5 | **WhatsApp** | How to route to an offline phone reliably? | **Session registry (device→gateway, Redis)** + **per-recipient durable inbox (Cassandra)**, delete-on-delivery. **Fan-out on write**; ack-then-route via Kafka. E2E forbids server-side search/fan-out. |
| 5.6 | **Typeahead** | How to rank from billions of queries between keystrokes? | **Don't.** Precompute **top-k offline into an in-RAM trie**; serve the Zipfian head from the **edge/CDN**. Trade freshness for <100ms latency. |
| 5.7 | **Uber / Proximity** | Which geospatial index survives a dense city? | **Adaptive index — quadtree / S2 / H3** (Uber uses **H3**, hexagons = equidistant neighbors), NOT a uniform grid (hot-spots). **Write-dominated** (~25:1). Shard **by region**. |
| 5.8 | **Dropbox / Drive** | Keep N devices byte-identical, cheaply, under concurrent edits? | **Sync = delta (4 MB content-addressed chunks) + SHA-256 dedup + per-namespace cursor/journal + conflicted-copy** (never merge opaque blobs — that's Docs). Shard by `namespace_id`. |
| 5.9 | **YouTube / Netflix** | How does video get to the screen? | **Not streamed from a server.** Pre-encode each source into a **ladder of static segments (resolution × codec)** via **chunked-parallel transcode**, serve via **ABR (HLS/DASH) off a CDN**. Egress (~125 Tbps) dominates. |
| 5.10 | **Google Maps** | Precompute or compute-at-query? (×2) | **Tiles:** pre-render hot set + on-demand tail, **vector tiles** → CDN. **Routing:** **contraction hierarchies** precompute shortcuts, but plain CH can't do live traffic → **customization split (CRP/CCH)** — rare topology preprocess + cheap metric re-weight. |
| 5.11 | **Web Crawler** | Crawl 12k pages/s without DDoSing any host? | **Partition the URL frontier by host** → politeness (≤1 req/s/host) is a *local* invariant, zero coordination. Throughput = **host-breadth (12k hosts), not depth**. **RAM Bloom filter** for 720k seen-checks/s. |
| 5.12 | **Notification System** | Reliable delivery through flaky third-party gateways? | **Queue-decoupled (Kafka), per-channel worker pools** with **circuit breakers + backoff + DLQ**. **At-least-once + idempotent dedup, never exactly-once.** Priority topics. **SMS dominates cost (~$82M/yr).** |
| 5.13 | **Ticketmaster** | 2M fans, 60k seats, one instant — no oversell? | **Atomic seat transition `AVAILABLE→HELD(ttl)→SOLD` via conditional write/CAS** (optimistic, not `SELECT FOR UPDATE`). **Virtual waiting room caps admission rate** so the `event_id`-sharded inventory core survives. |
| 5.14 | **Job Scheduler** | Guarantee a job runs exactly once? | **Exactly-once firing doesn't exist.** **At-least-once (catch-up) + idempotency on `(job_id, fire_time)`** = exactly-once-*effect*. Durable timer store + due-poll; shard by `hash(job_id)`. **Smear the midnight herd** with jitter. |
| 5.15 | **ChatGPT / LLM** | What bounds GPU throughput? | **KV-cache (in HBM) caps the batch** → **quantize (fp8) + PagedAttention + GQA** to enlarge it. **Continuous (in-flight) batching** is the #1 utilization lever (2–4×). Stream over **SSE**. Bottleneck = **HBM, not disk**. |

---

## Read:write skew — classify it FIRST (it pre-decides everything)

| Skew | Problems | Architectural consequence |
|---|---|---|
| **Read-heavy** (cache + CDN + precompute) | Pastebin (100:1), Instagram (100:1), Twitter (5:1), Typeahead (~500:1), Maps | CDN absorbs bytes, cache the hot set, precompute, read replicas. |
| **Write-dominated** (shard the write keyspace; replicas = HA not throughput) | Rate Limiter (~100% writes), Uber (~25:1), Crawler (pure ingest), Notifications (fan-out), Scheduler (due-poll + fan-out) | Bottleneck is write-concentration / hot key — shard, lease, partition by the scope-unit. |
| **Write-fan-out** (1 event → many writes) | WhatsApp (≤1,024/group), Notifications (1 event → millions), Twitter-push (1 tweet → ~200 inserts) | Deliver/insert is the load — not the send rate. Size the fan-out multiplier. |
| **Neither — different axis** | Ticketmaster (**contention**, not ratio), LLM (**prefill vs decode**, HBM), Dropbox (**two planes** + device fan-out) | The "ratio" question is a trap; name the real binding resource. |

---

## Recurring patterns (the same 8 moves, reused)

| Pattern | Where it shows up | The move |
|---|---|---|
| **Metadata / blob split** | Pastebin, Instagram, Twitter, YouTube, Dropbox, WhatsApp(media) | Small consistent records in a KV/DB; bulk immutable bytes in object store + CDN. Never bytes in the DB. |
| **Fan-out hybrid (push tail, pull head)** | Instagram, Twitter | Push (write) for normal accounts, pull (read) for celebrities; merge at read. One celebrity post = ~100M inserts otherwise. |
| **Precompute → serve from edge** | Typeahead (trie), Maps (tiles + CH), YouTube (ladder) | Do the expensive work offline; the request is a cheap lookup. "Compute is µs, network is the budget." |
| **Idempotency key = exactly-once-*effect*** | WhatsApp `(sender, client_msg_id)`, Notifications, Scheduler `(job_id, fire_time)`, Ticketmaster, LLM | At-least-once transport/firing + dedup on a stable key. True exactly-once is impossible across failures/3rd-parties. |
| **Atomic conditional write (CAS)** | Ticketmaster (`WHERE status='AVAILABLE'`), Pastebin burn, Rate Limiter (Lua) | One winner under contention; loser fails fast (no lock convoy). Prefer optimistic over pessimistic locks. |
| **Hot-key relief: shard the counter / lease** | Rate Limiter (leasing), Instagram/YouTube likes (sharded counters 3.16), Ticketmaster GA | Split one logical counter into N sub-keys (sum on read), or lease budget locally. Accept approximate count. |
| **Partition by the query's scope-unit** | Crawler (host), Uber/Maps (region), Dropbox (namespace), Ticketmaster (event_id), Scheduler (`hash(job_id)`) | Shard so the hot operation hits ONE shard. Never by time (hot bucket) or by the wrong id (scatter-gather). |
| **Queue decouples bursty-in from slow-out** | Notifications, WhatsApp, YouTube transcode, LLM admission, Scheduler→executor | Buffer, don't match peak. Durable queue (Kafka) gives replay + backpressure; ack-then-process. |

---

## Numbers to know (per problem)

| Problem | Headline figures |
|---|---|
| Pastebin | ~12K reads/s vs ~120 writes/s · ~100 GB/day blob vs ~5 GB/day metadata (~20×) · ~10 GB cache fronts ~150 TB · 7-char base62 = 3.5T namespace |
| Rate Limiter | ~1M decisions/s peak · ~10M active keys → ~1–2 GB Redis (TTL-bounded, not cumulative) · ~10 shards + 10 HA replicas · <1–2 ms added |
| Instagram | ~100M photos/day · 100:1 read:write · ~55 PB/yr media vs ~36 TB/yr metadata (~1,500×) · ~2 PB/day egress, 95% CDN → ~100 TB/day origin · celebrity = ~100M inserts/post |
| Twitter | 200M DAU · 5:1 read:write · push ~925K inserts/s vs pull ~4.6M fetches/s · cache IDs not tweets (~6.4 KB/user, ~1.3 TB) · celebrity = 100M-write bomb |
| WhatsApp | ~200M concurrent sockets · ~2.5M msgs/s peak → **~6M deliveries/s + ~12M receipts/s** (fan-out & receipts dominate) · ~5 TB/day transient vs ~7 PB/yr if persisted · group cap 1,024 |
| Typeahead | ~350K QPS avg (~700K peak) · ~90% edge hit → ~70K origin · ~100 GB trie (fits RAM) · read-dominated ~500:1 · k=5, <100 ms p99 |
| Uber | ~0.5M location writes/s (`online ÷ 4 s ping`) vs ~20K nearby reads/s (~25:1) · live index ~100 MB (RAM, no durability) · shard by region |
| Dropbox | ~120K ordered metadata commits/s behind ~200M idle connections · ~3 EB effective (5 EB raw, ~35% dedup) · ~5T files/blocks · 4 MB chunks · block index itself ~hundreds of TB |
| YouTube | ~500 hrs/min uploaded · 1B watch-hrs/day · ~1,400:1 watch:upload · **~125 Tbps egress** (~310 peak) · ~1.35 EB/day, 95% CDN → ~70 PB/day origin · ~2 EB/yr media vs ~6 TB/yr metadata · AV1 saves ~30% (~37 Tbps) · ~1.5M cores transcode (gated) |
| Maps | ~0.5M tile reads/s · ~99% CDN hit → ~100× origin reduction · all tiles = ~15 PB/style (so go vector + render tail) · graph ~tens of GB RAM · traffic refresh 1–2 min · routes ~7K/s |
| Crawler | ~30B pages/30 days = **~12k pages/s → 12k concurrent hosts** · ~720k seen-checks/s · ~10 Gbps · ~3 PB/crawl · **~120 GB Bloom** (vs ~960 GB exact set) · ~100 KB/page |
| Notifications | ~1B/day → ~12K/s avg, blasts ~83K/s · mix: in-app 50% / push 35% / email 12% / SMS 3% · **SMS ≈ $82M/yr** (3% volume, biggest cost) vs email ~$4.4M/yr, push free |
| Ticketmaster | 2M fans : 60K seats = **33:1** · ~33K/s spike on ONE event vs admit ~2K/s (the lever) · steady ~115 bookings/s · inventory ~1.5 TB (small — it's a contention problem) |
| Scheduler | ~100M live timers · ~1.2K fires/s avg **hides a ~30M-fire midnight spike** · live set ~10 GB but ~7 TB/yr history (must tier) · fleet ~240 cores avg → ~2,000 peak |
| LLM | ~1.7M output tokens/s avg (~10M peak) · 70B fp16 = 140 GB → **2-GPU node** · ~2,000 tok/s/node → ~1,000–4,500 nodes · KV ~320 KB/tok (GQA) → ~1.3 GB/4K-seq · **~$0.85/1M tokens** floor · weights load in minutes |

---

## What interviewers probe (the one strong-signal answer each)

| Problem | The probe → strong signal |
|---|---|
| Pastebin | "Store text in the DB?" → **No** — row-size/buffer-pool/$-per-GB; bytes are immutable → object store. |
| Rate Limiter | "Read- or write-heavy?" → **Write-heavy, ~100%**; replicas = HA not throughput; bottleneck is the hot key. |
| Instagram/Twitter | "How build the feed?" → fan-out math (celebrity = 100M inserts) → **hybrid with a follower threshold**. |
| WhatsApp | "Route to a phone on any of 250 gateways?" → **session registry (device→gateway)**; offline → durable inbox, drain-and-tombstone. |
| Typeahead | "Where do the 100 ms go?" → **network RTT, compute is µs** → precompute + edge. Shard by **hash(prefix)** not range. |
| Uber | "Why does a uniform grid fall over?" → equal-area cells, unequal density → **variable resolution (quadtree/S2/H3)**. Don't persist pings. |
| Dropbox | "Know what changed without re-downloading?" → **per-namespace cursor + journal**. Dedup'd delete → **refcount or GC**. |
| YouTube | "How does video reach the screen?" → **pre-encoded static ladder on a CDN + ABR**, not server streaming. Egress = the cost. |
| Maps | "Why not just Dijkstra / what breaks CH?" → Dijkstra = seconds; **plain CH bakes static weights → live traffic needs the customization split**. |
| Crawler | "Crawl 12k/s without DDoS?" → ≤1 req/s/host ⇒ **12k concurrent hosts**; **partition frontier by host**. Bloom FP **drops a page**, never double-crawls. |
| Notifications | "Exactly-once or at-least-once?" → **At-least-once + dedup** (exactly-once impossible across 3rd parties). Name **SMS cost**. |
| Ticketmaster | "What stops a double-sell?" → **atomic conditional write** (DB serializes the row). The **queue meters load, doesn't arbitrate seats**. |
| Scheduler | "Exactly-once?" → leader election only stops *concurrent* double-fire; need **idempotency on `(job_id, fire_time)`** + epoch fencing. |
| LLM | "What's the bottleneck?" → **GPU HBM** (KV-cache caps batch); **continuous batching** is the win; skew = **prefill vs decode**. |

---

## Universal red flags (any problem)

- 🚩 "Store the bytes/photo/video in a database column" → wrecks the buffer pool; bytes → object store + CDN.
- 🚩 "It scales horizontally" with no shard key, no hot-key story, no math.
- 🚩 Designing a **write-dominated** system (rate limiter, Uber, crawler) as read-heavy — reaching for read replicas / response caching for a counter (a stale count is a *wrong* answer).
- 🚩 **Only push, or only pull** for a feed — the celebrity tail forces a hybrid.
- 🚩 Claiming **exactly-once** firing/delivery across failures or third parties (impossible) — the answer is at-least-once + idempotency.
- 🚩 **Check-then-act** instead of an atomic conditional write under contention (oversell, double-burn, double-charge).
- 🚩 **Uniform geo-grid** in a dense city; **partition-by-time** for a scheduler (hot bucket); **partition-by-wrong-id** (scatter-gather).
- 🚩 The **queue prevents oversell** (it only meters the rate); **leader election gives exactly-once** (it only stops concurrent double-fire).
- 🚩 No quantification (no QPS, storage, egress, $) — and not naming the **cost line item** (CDN egress, GPU-hours, SMS spend).

---

> **Spaced-repetition recap:** 15 problems, 15 cruxes. **Splits:** Pastebin / Instagram / Twitter / YouTube / Dropbox / WhatsApp = metadata-vs-blob. **Fan-out hybrid** (push tail, pull celebrity) = Instagram, Twitter. **Precompute→edge** = Typeahead (trie), Maps (tiles + CH/CRP), YouTube (ABR ladder). **Geospatial** = Uber (quadtree/S2/H3, write-dominated). **Sync** = Dropbox (chunk + dedup + cursor/journal + conflicted-copy). **Reliability via idempotency** = Notifications, Scheduler `(job_id,fire_time)`, WhatsApp. **Atomic CAS + rate-cap** = Ticketmaster (seat hold; waiting room bounds the write rate). **Counter scaling** = Rate Limiter (leasing for the hot key). **GPU/HBM** = LLM (continuous batching + KV-cache). **Crawler** = host-partitioned frontier + RAM Bloom. Always: classify the skew first, name the trade + rejected alternative, price the cost line, delegate the deep-dive.
