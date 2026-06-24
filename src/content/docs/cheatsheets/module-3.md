---
title: "Module 3 — Building Blocks Cheat Sheet"
description: "The 16 building blocks, when to use, the key trade-off, the one number to remember."
sidebar:
  order: 3
---

### 16 blocks. Each = use when → key trade-off → the number. Skimmable in 5 minutes.

---

## Recurring laws (every block leans on these)

- **`mod N` is the enemy:** 10→11 nodes remaps ~90% of keys; consistent hashing moves ~1/N.
- **At-least-once + idempotency on a business key = effectively-once.** Exactly-once delivery over a network is impossible.
- **Hot-key ceiling:** one key = one shard; you can't shard out a single key, split it or approximate locally.
- **Redis is AP, async-replicated → never the source of truth.** A failover loses acked writes.
- **Indexes and derived copies speed reads, tax writes + space;** derived stores are rebuildable, never the record.
- **A cache is a copy allowed to be wrong**, state what you refuse to cache (balances, authz).

---

## DNS
Use for global name→IP plus traffic steering (round-robin, geo, latency, weighted canary). Trade-off: **TTL = failover speed vs query cost**, 30-60 s ≈ ~1-min failover; pre-lower before migrations. DNS failover is **best-effort, never a hard RTO**, pair with anycast / global L7 LB. Geo/latency steering keys off the **resolver IP unless ECS**. Anycast = BGP-nearest, not geo-nearest; DNSSEC = integrity, not encryption. **Single authoritative provider = Dyn-2016 SPOF.**

## Load Balancer
Spread traffic, hide backends. **L4** (4-tuple, µs, line rate, NLB/IPVS) vs **L7** (path/host/cookie routing, TLS termination, retries; 100 µs-few ms, ALB/Envoy); often L4→L7 in series. **Algo matches the failure you defend:** uneven durations → least-conn; capacity skew → weighted; affinity → consistent hash (ring, never `mod N`). Health = active probes (down-but-idle) + passive outlier ejection (capped). Prefer stateless backends over sticky. HA ladder: active-passive VIP (1-3 s) → active-active ECMP/anycast → DNS/GSLB cross-region. **The LB is your most concentrated SPOF.**

## Databases
Derive the **workload signature first**, R:W ratio, query shape, scale, per-op consistency, never start at "Cassandra vs Mongo." Relational = the default to beat; document = one evolving aggregate; wide-column = write-heavy massive scale (design tables for the read); KV = pure `key→value`; graph = N-hop traversal; time-series = recent-range metrics; NewSQL = scale **and** ACID, paid in coordination latency. **Levers:** replication = read-scale/HA (nothing for writes); partitioning = write scale (name the key + the query made expensive); indexing = read latency paid in write amp. **Managed by default** (~2-4× raw cost buys back engineers).

## Key-Value Store
Pure `key→value` at scale. **Consistent-hash partition + RF=3 across 3 AZs + per-op quorum N/W/R.** W=R=1 ≈ **1-5 ms**; W=R=2 ≈ **5-15 ms** cross-AZ; **W+R>N = strong** (DynamoDB strong read = 2× RCU). Conflicts: **LWW** (cheap, silent loss, needs NTP) / **version vectors** (no loss, app merges) / CRDTs (auto-merge, limited shapes). Healers: read-repair (hot) · hinted handoff (transient) · **Merkle anti-entropy** (cold, skip it and tombstones resurrect). Gossip membership in O(log N) rounds. **Quorum ≠ atomic RMW** → conditional write / LWT for counters.

## CDN
Cacheable reads near users: edge hit ≈ 10-50 ms vs 150 ms+ origin, **and** origin offload. **Origin load = R×(1−h):** 90% hit → 10×, 99% → 100×, that last 9 is why shields exist. Pull = default (accept one cold miss); push for large predictable catalogs (Netflix Open Connect). Hit-ratio killers: cookies on static assets, `Vary: User-Agent`, unstripped `utm_` params. **Version what you can rename** (assets → 1-yr `immutable`); purge only what you can't (HTML). Origin shield collapses N-PoP misses into one fetch. **Never cache per-user data.**

## Sequencer (IDs)
Unique IDs at millions/s. Trade-off: **coordination cost vs sortability** (sortable = B-tree append locality). DB auto-increment = SPOF + ~thousands/s ceiling. UUIDv4 = zero coordination, unsorted, hot-clustered-PK foot-gun (UUIDv7 fixes order). **Snowflake 64-bit = 41 ts + 10 machine + 12 seq ≈ 4M/s/node**, k-sorted, coordination moved to startup. Backward clock → **halt + alert, never a duplicate** (NTP slew, not step). **k-sorted ≠ causal** across nodes, never infer "smaller ID happened first."

## Distributed Cache
Read-heavy hot path. **Hit rate sizes the origin: 90% hit = 10× shed** (50k QPS → origin sees 5k). Shard by consistent hashing (Redis Cluster = 16,384 slots); `mod N` flushes ~90% on resize. Eviction matches access pattern: LRU (temporal, scan-vulnerable) / LFU (stable Zipfian, needs aging) / TTL (bounds staleness). Write strategies: cache-aside default; write-back never authoritative. Redis = **async/AP, never source of truth**; size the no-replica choice by the miss surge a lost shard dumps on origin. **Hot key:** consistent hashing doesn't help one key → replicate it / L1 / split. **Stampede:** single-flight + TTL jitter.

## Message Queue (1→1)
Decouple + load-level: a buffer lets a fixed fleet drain a spike (480k backlog ÷ 2k/s ≈ 4 min vs a 4× idle peak fleet). **At-least-once is the default; duplicates are guaranteed; exactly-once delivery is impossible** → idempotent consumer on a business key. Machinery: visibility timeout ≈ **p99 processing × 2-6** (SQS default 30 s) · retry budget 3-5 → **DLQ, page on depth > 0**. **Ordering per partition only; active consumers ≤ partition count.** Kafka = replayable log; SQS = zero-ops (FIFO ~300/s); pull = free backpressure (autoscale on lag).

## Pub-Sub (1→N)
One event, many independent readers, **a partitioned log is a queue with many consumer groups** (independent offsets); delivery/ordering rules unchanged from the message queue. Deepest split = **retention/replay**: Kafka 7-day default, re-readable; **SNS = none** (durable = SNS→SQS). Push (low latency, broker owns retries) vs pull (free backpressure, slow consumer isolated). The cost no one approves: **1 publish → N× read/compute/egress** (cross-AZ ~$0.01/GB each way), growing invisibly with subscribers, mitigate with server-side filtering or topic granularity.

## Rate Limiter
Shed/cap/fair traffic. **A limit is 2 numbers: sustained rate + burst.** Token bucket = default (Stripe, AWS API GW); fixed window leaks ~2× at boundaries; sliding counter for high-volume APIs. Distributed = shared Redis, **~0.5-1 ms/req tax**; bucket read-modify-write must be **one Lua script**. **Fail-open for general traffic, fail-closed for auth/payment, the split is the signal.** Limit per-key, not per-IP (NAT bunches users; attackers rotate). A global limit = hot key → sharded counters / local leasing. Return **429 + `Retry-After`**.

## Blob / Object Store
Immutable bytes (images, video, backups), **never put bytes in the DB.** Two planes: small strongly-consistent **metadata** + vast append-only **data**. Durability: **3× replication = 200% overhead, tolerates 2** (hot/small) vs **erasure coding RS(10,4) = 40% overhead, tolerates 4** (cold/large; repair reads 10 fragments). Multipart: 5 MiB-5 GiB parts, ≤10,000 → **5 TiB max object**; single PUT caps at 5 GiB. Tiering = **~23× cheaper** ($0.023 → $0.00099/GB-mo) paid in retrieval latency (up to 12 h) + 90/180-day minimums. S3 read-after-write is strong *because* writes are immutable whole-object flips.

## Distributed Search
"Match text, ranked." Inverted index = **O(matches) reads, taxed writes**; derived and rebuildable, never the source of truth. **Document-partitioned** (default, cheap writes, scatter-gather reads) vs term-partitioned (niche, per-doc write fan-out, hot terms). Refresh interval = freshness-vs-ingest knob (~1 s "near-real-time"; disable for bulk loads). BM25 is the default relevance; go beyond only if relevance is the product. **Scatter-gather tail: p99 = slowest shard**, 50 shards each 99% < 100 ms → only ~60% of queries beat 100 ms. Mitigate: fewer shards, hedged requests, routing to prune fan-out.

## Distributed Logging
"Why did *this* fail?" Pipeline: light agent → **Kafka buffer** (load-level + replay) → aggregator → index; never app→index direct. **Size first: 10k hosts ≈ 43 TB/day raw** (~$260k/mo unmanaged), volume is the whole game. Biggest lever = **tiered sampling: drop DEBUG, ~10% INFO, 100% WARN/ERROR ≈ 5× cut** (uniform sampling drops 90% of errors, wrong). Hot 7 days → S3/Glacier (~4-25× cheaper). ELK (full-text, ~2× storage, heavy ops) vs Loki (label-anchored, ~10× cheaper). High-cardinality IDs go in the **line, not labels**. Cross-service debugging = propagated **trace ID**; audit logs have legal retention floors.

## Distributed Monitoring
"Is it healthy?" Three pillars in order: **metrics detect → traces localize → logs root-cause.** **Cardinality is the bill** (~1-4 KB RAM/series; product of label values), never label by `user_id` or raw URL. Pull (Prometheus) by default = free liveness (`up==0`); push-gateway only for short-lived jobs. **Histograms for p99, you can't average percentiles.** Alert on **SLO burn-rate, not causes**: budget at 99.9%/30d = **43.2 min**; multi-window burn = 14.4×/1h pages, 6×/6h pages, 1×/3d tickets. Manage pages/shift + % actionable, alert fatigue is a reliability risk.

## Task Scheduler
Run jobs later / on cron. **Split scheduler from executor** via a durable queue: scheduler only moves `scheduled → enqueued`; workers own retries/DLQ. Timers live in a **durable replicated store**; Redis ZSET is a rebuildable acceleration index only. **Leader election prevents concurrent double-fire, nothing more:** failover gap ≈ lease TTL; a zombie leader double-fires unless **fenced with epochs**. Choose per job: at-least-once (catch up) vs at-most-once (skip). **Exactly-once-effect = at-least-once + idempotency on `(job_id, fire_time)`**, the fire time must be in the key. **Smear the midnight herd with jitter**; missed fires are silent → dead-man's switch.

## Sharded Counters
Beat hot-key write contention, a counter is a single serialization point you can only scale by **splitting the key**. Ceilings: PG row ~1k/s · Redis key ~100k/s · DynamoDB partition 1,000 WCU/s. Pattern: N sub-counters, increment one at random (**write ÷ N**), sum on read (**read × N**); **N ≥ peak ÷ per-key ceiling** (1M/s → ~10 Redis shards). Hide the O(N) read behind a rollup, **the rollup interval is the staleness window.** Exact-but-eventual ≠ HyperLogLog (permanently approximate distincts: ~12 KB / 0.81% error). **Don't shard a rate-limit counter**, it reads on every request. Split display counts from reconciled billing counts.

---

## Director through-line (all 16)
Pick from the **requirement** · name the **rejected alternative and its cost** · **quantify the dropped side** (latency, $, failures tolerated) · **delegate the IC-depth benchmark** ("I'd have the storage team measure p99 at QUORUM vs ONE; my prior is X") · always carry the **operational + dollar** cost, not just the technical fit.
