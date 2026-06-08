---
title: "Module 3 — Building Blocks Cheat Sheet"
description: "The 16 building blocks — when to use, the key trade-off, the one number to remember."
sidebar:
  order: 3
---

### One page per fistful of blocks. Director altitude. Each block = when-to-use · the trade-off · the number.

---

## The 16 blocks at a glance

| # | Block | Use when… | Key trade-off | The number / rule |
|---|---|---|---|---|
| 3.1 | **DNS** | global name→IP + traffic steering | failover speed **vs** query cost (TTL) | low TTL = fast failover, more $; **single provider = Dyn-2016 SPOF** |
| 3.2 | **Load balancer** | spread traffic, hide backends | L4 (cheap, 4-tuple) **vs** L7 (content routing, costs CPU) | match algo to failure; **LB is your most concentrated SPOF** |
| 3.3 | **Databases** | persist anything | generality **vs** workload-shaped win; managed **vs** self-host | derive the **signature** (R:W, query shape, scale, consistency) *first* |
| 3.4 | **Key-value store** | pure `key→value` at scale | recency **vs** latency/availability (`N/W/R`) | **RF=3 / 3 AZs**; `W+R>N` for recency; quorum ≠ atomic RMW |
| 3.5 | **CDN** | cacheable reads near users | hit ratio **vs** staleness/invalidation cost | **origin load = R×(1−h)**; 99% hit → origin sees 1% |
| 3.6 | **Sequencer (IDs)** | unique IDs at M/s | coordination cost **vs** sortability | **Snowflake 64-bit**: 41 ts + 10 machine + 12 seq ≈ 4M/s/node |
| 3.7 | **Distributed cache** | read-heavy hot path | hit rate **vs** memory/staleness | 90% hit = **10× origin shed**; **never `mod N`**, consistent-hash |
| 3.8 | **Message queue** | decouple + load-level (1→1) | latency now **vs** deferred work | **at-least-once + idempotency = effectively-once** |
| 3.9 | **Pub-sub** | one event → many readers (1→N) | decoupling **vs** fan-out cost | one publish → **N× read/egress** (the cost no one approves) |
| 3.10 | **Rate limiter** | shed/cap/fair traffic | accuracy **vs** memory; protection **vs** availability | limit = **2 numbers** (rate + burst); **fail-open general, fail-closed auth** |
| 3.11 | **Blob/object store** | immutable bytes (images/video) | durability **vs** storage cost | **3× repl (200%, tol 2)** vs **EC RS(10,4) (40%, tol 4)** |
| 3.12 | **Distributed search** | "match text, ranked" | cheap writes **vs** cheap reads (doc vs term partition) | **p99 = slowest shard** (scatter-gather tail) |
| 3.13 | **Distributed logging** | "why did *this* fail?" | queryability **vs** cost (ELK vs Loki) | size it: 10k hosts ≈ **43 TB/day**; drop DEBUG, keep 100% ERROR |
| 3.14 | **Distributed monitoring** | "is it healthy?" | detail **vs** cost (3 pillars) | **cardinality** is the bill; alert on **SLO burn-rate**, not CPU |
| 3.15 | **Task scheduler** | run jobs later / on cron | miss-fire **vs** double-fire | **exactly-once-effect = idempotency on `(job_id, fire_time)`** |
| 3.16 | **Sharded counters** | beat hot-key write contention | write ÷ N **vs** read × N | **N ≥ peak ÷ per-key ceiling**; exact-but-eventual |

---

## Recurring laws (every block leans on these)

- **`mod N` is the enemy.** 10→11 nodes remaps **~90%** of keys; consistent hashing moves **~1/N**. Used by KV (3.4), cache (3.7), scheduler partitioning (3.15).
- **At-least-once + idempotency on a business key = effectively-once.** Exactly-once *delivery* over a network is impossible. Queue (3.8), pub-sub (3.9), scheduler (3.15).
- **Hot-key ceiling:** one key = one slot = one shard. *Cannot* shard your way out → split the key (sharded counters 3.16) or local-approximate. Rate limiter global cap (3.10), counters (3.16).
- **Redis is AP, async-replicated → never the source of truth.** A failover loses acked writes. Cache (3.7), rate limiter (3.10), scheduler index (3.15).
- **Indexes/inverted-indexes/secondary copies speed reads, tax writes + space** (the 2.3 law). DB indexing (3.3), search (3.12).
- **Derived stores are rebuildable, eventually-consistent, not transactional records.** Search (3.12), cache (3.7), display counters (3.16).
- **A cache is a copy that's allowed to be wrong** — state what you refuse to cache (balances, authz). 3.5, 3.7.

---

## 3.1 DNS — global cached control plane
- **Recursive** (stub→resolver, "do all the work") vs **iterative** (resolver→root→TLD→authoritative, referrals). Client makes **1** request; resolver makes **~3** hops; warm = **0**.
- **TTL = failover/rollback speed vs query cost vs resolver slop.** 30–60 s = ~1-min failover; pre-lower before a migration. Never design a hard RTO on DNS alone (best-effort floor).
- **Steering:** round-robin (blind), geolocation (residency), latency (perf), weighted (canary). Geo/latency key off **resolver IP unless ECS** (Google sends it, Cloudflare doesn't).
- **Anycast = BGP-nearest, not geo-nearest.** Ideal for stateless UDP; risky for long-lived TCP. **DNSSEC = integrity, not encryption.**
- 🚩 client walks root→TLD · "DNS fails over instantly" · single authoritative provider (Dyn).

## 3.2 Load Balancers — host at the door
- **L4:** routes on 4-tuple, µs/line-rate (NLB, IPVS, Maglev). **L7:** parses path/host/cookie, TLS term, retries; **100 µs–few ms/req** (ALB, NGINX, Envoy). Often **L4→L7 in series**.
- **Algo = the failure you defend:** uneven duration/flaky → least-conn / least-response-time; fixed capacity skew → weighted; affinity → consistent-hash (**ring, not `mod N`**).
- **Health:** active probe (down-but-idle) **+** passive outlier ejection (up-but-erroring), with `max_ejection_percent` cap.
- **Prefer stateless** (session in Redis/JWT) over sticky — stickiness = lossy failover + uneven load.
- **HA by altitude:** active-passive (VIP/keepalived, 1–3 s) → active-active (ECMP/anycast) → DNS/GSLB (cross-region, TTL-coarse).

## 3.3 Databases — pick the vehicle for the trip
- **Signature first:** read:write ratio · query shape · scale (bytes+throughput) · per-op consistency. *Never* start at "Cassandra vs Mongo."

| Family | Use when… | Reject when… |
|---|---|---|
| **Relational** (PG, MySQL) | integrity + multi-row txn + ad-hoc — *default to beat* | proven write ceiling / real KV-doc-graph-TS shape |
| **Document** (Mongo) | one evolving aggregate, few joins | highly relational (you keep reaching for `$lookup`) |
| **Wide-column** (Cassandra, Bigtable) | write-heavy at massive scale, design tables for the read | ad-hoc queries / strong multi-row txn |
| **Key-value** (Dynamo, Redis) | pure `key→value` (sessions, cache, profiles) | query by anything but the key |
| **Graph** (Neo4j, Neptune) | the *query is the relationship*, N-hop | shallow 1–2-hop (a join handles it) |
| **Time-series** (Influx, Timescale, Prom) | timestamped metrics, recent-range reads | — (Timescale=PG ext; Prom=pull, Influx=push) |
| **NewSQL** (Spanner, Cockroach) | need scale **and** ACID | — (pay coordination latency) |

- **ACID vs BASE is per-data-flow, not per-DB.** Ledger=ACID, feed/counter=BASE. NewSQL dissolves "scale or ACID."
- **Levers ≠ store choice:** replication → read-scale/HA (does *nothing* for writes); **partitioning → write-scale** (name the key + the query you made expensive); indexing → read-latency (paid in write amp + space).
- **Managed by default** (buy back engineer-time, ~2–4× raw); self-host only when scale/control flips the math.

## 3.4 Key-Value Store — hall of left-luggage desks
- = consistent-hash partition (2.6) + **RF=3 across 3 AZs** (2.4) + per-op **quorum `N/W/R`** (2.8) + versioning + anti-entropy + gossip. Leaderless, any node coordinates.
- **`W+R>N`** = read sees latest write (present, not chosen). **`W>N/2`** = concurrent writes collide (detectable, not prevented). `W=R=2 / N=3` = strong; `W=R=1` = fast/eventual.
- **Cost:** `W=R=1` ≈ **1–5 ms**; `W=R=2` ≈ **5–15 ms** (cross-AZ); DynamoDB strong read = **2× RCU**.
- **Conflict resolution:** LWW (Cassandra per-cell — cheap, **silently drops** a write, needs NTP) · version vectors (Dynamo/Riak — no loss, app merges siblings) · CRDTs (auto-merge, limited shapes).
- **3 healers:** read-repair (hot keys) · hinted handoff (transient down) · **Merkle anti-entropy** (cold — compare root hashes, stream diffs; a scheduled CPU/IO tax — skip it and tombstones resurrect).
- **Gossip** = membership in **O(log N)** rounds, no master; phi-accrual = adaptive suspicion. Quorum ≠ atomic RMW → add a conditional write / LWT for counters/decrements.

## 3.5 CDN — corner stores near users
- Buys **two** things from one mechanism (an edge hit): **user latency** (~10–50 ms vs ~150 ms+ origin) **and origin offload**.
- **Origin = R×(1−h).** 90%→10×, 95%→20×, 99%→100×. **90%→99% is a further 10×** — why shielding/tiering exist.
- **Pull** (lazy, default — long-tail, accept one cold miss) vs **push** (pre-position; **Netflix Open Connect** — large, predictable, cold-miss-fatal).
- **Hit-ratio killers:** cookies on static assets, `Vary: User-Agent`, unstripped `utm_`/session query params.
- **Version what you can rename (assets → 1-yr `immutable`, free invalidation); purge only what you can't (HTML).** `stale-while-revalidate` hides revalidation; `stale-if-error` survives origin down.
- **Origin shield / tiered cache** collapse N-PoP misses + a herd into **one** origin fetch. **Never cache per-user data** (leak = security incident). CDN egress *replaces* origin egress → often a cost *saver*.

## 3.6 Sequencer — the deli-ticket problem
- 4 conflicting needs: **uniqueness · k-sorted · throughput · no-SPOF.** Sortability matters for **B-tree locality** (append to right edge, minimal write amp — 2.3).

| Scheme | Coordination | Sortable | Note |
|---|---|---|---|
| **UUIDv4** | none | **no** | great for opaque tokens; foot-gun as hot clustered PK |
| **UUIDv7** | none | k-sorted | restores order, still 128-bit |
| **DB auto-increment** | per-ID | yes | **SPOF + ~thousands/s ceiling**; ~100× miss vs 1M/s |
| **Ticket/range (Flickr)** | per-batch (~1/1000) | broadly | odd/even MySQL kills the SPOF, drops strict order |
| **Snowflake** | per-startup | k-sorted | **64-bit: 1+41+10+12**; ~4M/s/node, ~69 yr, 1,024 nodes |

- Snowflake coordination **moved to startup** (machine-ID assignment). **Wall clock is load-bearing:** backward clock → **halt + alert** (availability hit, never a duplicate). NTP *slew, not step*.
- **k-sorted ≠ causal** across nodes — clock skew reorders. Never build "smaller ID = happened first" across nodes; true happens-before needs Lamport/vector clocks (usually overkill).

## 3.7 Distributed Caching — heat lamp over the kitchen
- Pays off on **hit rate** (misses size the origin). 50k QPS @ 90% = origin sees **5k** (10× shed); blended p50 ≈ 1.9 ms vs 10 ms.
- **Write strategies:** cache-aside (default; invalidate on write) · write-through (fresh+warm, write latency) · write-back (fastest, **loses dirty data on crash** — never authoritative).
- **Eviction = access pattern:** LRU (temporal, scan-vulnerable) · LFU (stable Zipfian, stale-popularity → use aging) · TTL (bounds staleness). Redis = **sampled**, Memcached = **per-slab** — neither is perfect global ordering.
- **Shard with consistent hashing** (Redis Cluster = 16,384 server slots; Memcached = client ketama). `mod N` flushes ~90% on resize.
- **Replication keeps cache warm** at 2× memory — but Redis is **async/AP, never source of truth**. Size the no-replica choice by the miss surge a lost shard dumps on origin.
- **Hot key:** consistent hashing does **NOT** help one key → replicate-across-nodes / L1 / key-split. **Stampede:** coalesce (single-flight) + **TTL jitter** + early refresh.

## 3.8 Message Queue — kitchen ticket rail (1 msg → 1 consumer)
- Two jobs: **decoupling** (producer never blocks) + **load-leveling** (buffer lets a fixed fleet drain a spike). e.g. 480k backlog ÷ 2k/s ≈ 4 min vs a 4× idle peak fleet.
- **at-most-once** (loss OK) · **at-least-once** (default, **duplicates guaranteed**) · **exactly-once delivery is impossible** → effectively-once via **idempotent consumer on a business key**.
- **Redelivery machinery:** receive → invisible (**visibility timeout, SQS default 30 s**) → ack/delete → **retry budget (3–5)** → **DLQ** (page on depth>0). Timeout ≈ **p99 processing × 2–6×**; heartbeat long jobs.
- **Ordering = per partition/group, never global** → ordering per key, parallelism across keys. **Active consumers ≤ partition count** (the real ceiling).
- **Kafka** (replayable log, many groups) · **SQS** (zero-ops; FIFO **~300/s** unless high-throughput) · **RabbitMQ** (routing, push + prefetch). Pull = free backpressure (autoscale on lag).

## 3.9 Pub-Sub — magazine subscription (1 msg → every subscriber)
- **A partitioned log is a queue with 1 consumer group, pub-sub with many** — the difference is the number of independent offsets. Delivery + ordering **unchanged from 3.8**.
- **New axes:** push vs pull · retention/replay · **fan-out amplification**.
- **Retention/replay (the deepest split):** Kafka/Pulsar = re-readable log (Kafka 7d default; Pulsar tiered ≈ unbounded) · Pub/Sub = 7d default / **31d max** (seek) · **SNS = none** (push fan-out router; durable = **SNS→SQS**; replayable AWS = Kinesis/MSK).
- **Push** (SNS→Lambda, low latency, broker owns retries+DLQ) vs **pull** (Kafka, free backpressure, per-consumer offset isolates slow consumers).
- **Amplification:** 1 publish → **N× read/compute/egress** (cross-AZ ~$0.01/GB each way; cross-region 2–9× worse), grows with subscribers invisibly to the producer. Mitigate: **server-side filtering** (SNS/Pub/Sub) or **topic granularity** (Kafka has none).

## 3.10 Rate Limiter — bouncer with a clicker
- 4 jobs: protect capacity · fairness (noisy neighbor) · cost control · abuse. **A limit is 2 numbers: sustained rate + burst.**

| Algorithm | Burst | Accuracy | Memory | Use when… |
|---|---|---|---|---|
| **Fixed window** | ~**2× at boundary** | low | O(1) | cheap; a momentary 2× survivable |
| **Sliding log** | exact | exact | **O(limit)/key** | low-volume high-value (password resets) |
| **Sliding counter** | smooth | near-exact | O(1) | **high-volume APIs** (Cloudflare, ~0.003% err) |
| **Token bucket** | up to B then R | good | O(1) | **rate+burst APIs** (Stripe, AWS API GW) — default |
| **Leaky bucket** | smooths to R | constant out | O(1) | downstream needs paced input (no burst) |

- **Distributed:** shared **Redis**, ~0.5–1 ms/req tax. **`INCR` is atomic** (the **separate `EXPIRE`** is the race → orphaned key, *not* over-count). Token bucket **must be one Lua script** (GET-then-SET over-admits). Redis AP → failover briefly over-admits (fine, best-effort).
- **Enforce:** edge (volumetric) → **gateway (per-key policy, primary)** → service (special bottlenecks). **Fail-open general, fail-closed auth/payment** — the *split* is the signal.
- **Per-key** (auth/billing) not **per-IP** (NAT bunches users, attackers rotate). Global limit → **hot-key ceiling** → sharded counters / local approximation. Return **429 + `Retry-After`**.

## 3.11 Blob/Object Store — valet parking garage
- **Two systems:** small strongly-consistent **metadata plane** (name→location) + vast dumb append-only **data plane** (immutable bytes). Scale on different axes; **never put bytes in the DB**.
- **Durability math (eleven nines):** **3× replication = 200% overhead, tolerates 2** (hot/small, cheap reads+repair) vs **erasure coding RS(10,4) = 40% overhead, tolerates 4** (cold/large; reconstruction = read k=10 + RS math). LRC(12,2,2) ≈ 33%, cheap single-fragment repair (Azure).
- **Strong read-after-write since Dec 2020 — cheap *because* immutable whole-object writes** (one atomic metadata flip; no read-modify-write).
- **Multipart upload:** **5 MiB–5 GiB parts, ≤10,000 → 5 TiB** max object; parallel, resumable, independent retry. Single PUT caps at **5 GiB**. Lifecycle-abort orphaned incomplete uploads.
- **Tiering = TCO with a latency price:** Standard $0.023 → Deep Archive $0.00099/GB-mo (**~23×**), but pays in retrieval latency (up to **12 h**), retrieval fees, **90/180-day minimums**. Per-prefix rate (3,500 PUT / 5,500 GET) is the scaling unit; durability = **continuous scrub+repair**.

## 3.12 Distributed Search — back-of-book index, inverted
- **Inverted index** (term → sorted postings list) makes search **O(matches), not O(corpus)**; index ≈ 20–50% of text after compression; taxes writes (the 2.3 law).
- **Sharding fork:** **document-partitioned** (cheap writes, **scatter-gather reads** — Elasticsearch/Solr default) vs **term-partitioned** (narrow reads, **per-doc write fan-out + hot-term hotspots** — niche).
- **A Lucene shard IS an LSM-tree:** segments ≈ SSTables, translog ≈ WAL, **refresh ≈ flush (default 1 s → "near-real-time")**, tombstone deletes, **merges ≈ compaction** (CPU/IO tax). Refresh interval = **freshness vs ingest** knob (disable during bulk loads).
- **Relevance: BM25** (default since Lucene 6 / ES 5.0) = TF-IDF + TF saturation + length normalization. Beyond it (boosting/LTR/vector) only if relevance is a product differentiator.
- **Scatter-gather tail:** **query p99 = slowest shard.** 50 shards each 99%<100 ms → only 0.99⁵⁰ ≈ **60%** of queries beat 100 ms. Mitigate: **fewer** shards, replicas + adaptive selection, hedged requests, **routing to prune fan-out**, caches. Derived/rebuildable, **not** source of truth.

## 3.13 Distributed Logging — flight recorders for a fleet ("why did *this* fail?")
- **Two-tier + Kafka buffer:** light agent per host (Fluent Bit/Filebeat) → **Kafka** (load-level + replay, the 3.8 argument) → heavy aggregator (Fluentd/Logstash) → index. **Never app→index direct** (couples app health to indexer, no replay).
- **Size first:** 10k hosts × 100 ev/s × 500 B ≈ **43 TB/day raw**, ~2× in ES → **~$260k/mo** unmanaged. Volume is the whole game.
- **Sampling (biggest lever) — logs aren't traces:** **drop DEBUG, sample INFO ~10%, keep 100% WARN/ERROR** → ~**5× cut**. Blind uniform sampling drops 90% of errors (wrong). Tiered retention: hot 7d → S3/Glacier (~4–25× cheaper).
- **ELK** (full-text inverted index, fast arbitrary search, ~2× storage, heavy ops) vs **Loki** (labels only, chunks in S3, ~10× cheaper, **fast only if label-anchored**). **Cardinality trap:** high-card IDs (`user_id`, `trace_id`) go in the **line**, not labels.
- Cross-service debug = propagated **trace ID** (W3C Trace Context / OpenTelemetry). **Logs ≠ metrics** (audit logs have legal retention floors: SOX ~7yr, PCI ≥1yr).

## 3.14 Distributed Monitoring — hospital for your services ("is it healthy?")
- **3 pillars on one axis:** **metrics** detect (cheap, aggregate) → **traces** localize (causality across services) → **logs** root-cause (detailed, expensive). Use in that order.
- **Cardinality is the dominant cost** = product of label values. Unbounded label (`user_id`, raw URL, `request_id`) OOMs the TSDB **and** detonates per-series SaaS bills (~1–4 KB RAM/series). Keep labels bounded.
- **Pull (Prometheus) by default** — **free liveness** (`up==0`), server-side discovery. **Push-gateway** is the exception (short-lived/NAT'd), with a stale-metric caveat. **Histograms** for p99 (you can't average percentiles). OTel = instrumentation, not a backend.
- **Alert on SLO burn-rate / symptoms, not causes.** Error budget = 1−SLO (99.9%/30d = **43.2 min**). Multi-window/multi-burn: **14.4×/1h pages**, **6×/6h pages**, **1×/3d tickets**. Manage **pages/shift + % actionable** (alert fatigue is a reliability risk).
- **Build vs buy = cardinality-cost vs headcount.** 🚩 paging on CPU>80% / every error · averaging percentiles · push by default.

## 3.15 Task Scheduler — air-traffic control tower
- **Split scheduler from executor** via a durable queue: scheduler only moves `scheduled → enqueued`; queue + stateless workers own execution (retries, DLQ — 3.8). Naive `cron` couples timer accuracy to job duration.
- **Timers in a durable replicated store** (source of truth); ZSET / timing-wheel = in-memory **acceleration index rebuilt on restart**, never Redis-only (3.7 loss window). Hot query: `fire_time ≤ now FOR UPDATE SKIP LOCKED`.
- **Leader election (etcd/ZK lease) prevents *concurrent* double-fire — nothing more.** **Failover gap** ≈ lease TTL (e.g. 10 s) of no-fire; **zombie leader** double-fires unless **fenced with epochs** (conditional write). Firing is a choice: **at-least-once (catch up)** vs **at-most-once (skip)**.
- **Exactly-once-effect = at-least-once everywhere + idempotency on `(job_id, scheduled_fire_time)`.** The fire-time *must* be in the key (retry dedupes; next recurrence is distinct).
- **Scale = partition timer space** by `job_id` (consistent hashing; cost = rebalancing on churn). **Thundering herd** at round cron (3M ÷ 50k ≈ 60 s spike) → **smear with jitter**. **Missed fire is silent** → dead-man's switch / missed-fire monitor.

## 3.16 Sharded Counters — open more tills
- A counter is a **single write-serialization point** — can't scale with hardware/replicas, **only by splitting the key**. Per-key ceilings: **PG row ~1k/s**, **Redis key ~100k/s**, **DynamoDB partition 1,000 WCU/s**.
- **Pattern:** N sub-counters, increment one at random (**write ÷ N**), **sum N on read (read × N)**. **N ≥ peak ÷ per-key ceiling.** 1M/s → ~10 shards on Redis, **~1,000** on Postgres/DynamoDB (AWS's official write-sharding recipe). Adaptive: start N=1, promote hot keys.
- Hide O(N) read with a **rollup → cached total**; the **rollup interval *is* the eventual-consistency window** (why YouTube counts "stick").
- **Two different inexacts:** sharded counter = **exact but eventually consistent** (temporal lag). **HyperLogLog** = permanently approximate, **distinct counts**, **~12 KB / 0.81% err** any cardinality (memory, not contention). **Count-Min Sketch** = **frequencies/top-K, overestimates only**.
- **Don't shard a rate-limit counter** (read on every request → O(N) fan-out on the hot path). Split the cheap **display** count from the exactly-reconciled **billing** count (event log).

---

## Director through-line (all 16)
Pick from the **requirement** · name the **rejected alternative and its cost** · **quantify the side you drop** (latency, $, failures tolerated) · **delegate the IC-depth benchmark** ("I'd have the storage team measure p99 at QUORUM vs ONE; my prior is X") · always carry the **operational + dollar** cost, not just the technical fit.
