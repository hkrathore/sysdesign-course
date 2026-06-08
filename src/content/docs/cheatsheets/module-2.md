---
title: "Module 2 — Core Concepts & Trade-offs Cheat Sheet"
description: "Core-concepts & trade-offs cheat sheet."
sidebar:
  order: 2
---

### One page. Every choice names its trade-off and the alternative rejected.

---

## Front door & request path (2.1)

| Box | Acts on behalf of | Buys you |
|---|---|---|
| **Forward proxy** | the **client** | egress control, filtering, anonymity, client cache |
| **Reverse proxy** | the **servers** | LB, **TLS termination**, caching, routing, WAF, hides backend |
| **L4 LB** | — | fast, IP/port, connection-level, no payload inspection |
| **L7 LB** | — | smart (URL/header/cookie), sticky, canary; costlier (parses payload) |
| **API gateway** | — | authn/z, rate limit, routing, aggregation at the edge |
| **CDN** | — | reverse-proxy cache at the edge, near users |

**Request lifecycle:** DNS → TCP (~1 RTT) → TLS (~1 RTT @1.3, 0-RTT resume) → HTTP. Each cross-region RTT ≈ **150 ms** → terminate handshakes near the user.
**DNS = cached, eventually-consistent control plane.** Low TTL = fast failover, more lookups; high TTL = slow drain. DNS failover is **best-effort, not instant** — pair with anycast / global L7 LB for tight RTOs.

---

## Store selection — SQL vs NoSQL (2.2)

**4 axes that matter** (not "old vs new"): data model · schema (on-write vs on-read) · consistency/transactions (ACID vs BASE) · scale (up+replicas vs out).

| Family | Shape | Sweet spot | Tech |
|---|---|---|---|
| **Key-Value** | opaque value by key | cache, sessions, pure lookups, huge reads | Redis, DynamoDB, Riak |
| **Document** | nested JSON | evolving/semi-structured, catalogs | MongoDB, Couchbase |
| **Wide-column** | partitioned wide rows | write-heavy, time-series, massive scale | Cassandra, HBase, Bigtable |
| **Graph** | nodes + edges | relationship traversal | Neo4j, Neptune |

**"Just use Postgres"** is the senior default (replicas, partitioning, `JSONB`) until a **measured** limit forces out-scaling. NewSQL (**Spanner, CockroachDB**) + sharded SQL (**Vitess**) dissolve "scale vs ACID." Real systems are **polyglot** — match each data kind to its store. "Schemaless" still has a schema; it just lives in your app code.

---

## Indexing — B-tree vs LSM (2.3)

Index turns O(n) scan → O(log n) lookup. Cost: **speeds reads, slows writes, uses space** (read- vs write- vs space-amplification — the whole subject).

| Engine | Write amp | Read amp | Space | Use when… |
|---|---|---|---|---|
| **B-tree** (in-place, WAL, page splits) | higher | low (1 location) | low | read-heavy, transactional, range + ad-hoc (Postgres, InnoDB) |
| **LSM size-tiered** | low | higher | higher (transient) | very write-heavy, throughput > read latency |
| **LSM leveled** | medium | medium | lower | write-heavy but reads/space matter |

**LSM write path:** WAL + memtable → flush to immutable **SSTable** (sequential write). **Read path:** memtable → SSTables newest→oldest (**Bloom filters** skip files). **Compaction** = background merge — a real **operational tax** (CPU/IO, latency spikes, transient bloat). Used by Cassandra, RocksDB, HBase, Bigtable. Secondary indexes tax every write; distributed ones are limited → **denormalize into a query-shaped table**.

---

## Replication (2.4) — *same data, many copies*

Why: availability · read scale · latency · durability. **Replication ≠ partitioning** (copies vs splits) — do both.

| Topology | Write availability | Conflicts | Consistency | Use when… |
|---|---|---|---|---|
| **Leader-follower** | needs leader (failover gap) | none (1 writer) | strong@leader; followers **lag** | single-region, transactional, read scaling |
| **Multi-leader** | high (any region) | **yes — resolve** | weak, converges | multi-region low-latency writes |
| **Leaderless (quorum)** | high (no failover) | yes — read repair / vectors | **tunable** (N/W/R) | AP, high availability, tunable consistency |

**Sync** = durable/consistent but latency-bound + a dead sync-follower stalls writes; **async** = fast but **stale reads** + lost-write risk; **semi-sync** compromises.
**Lag anomalies → fix:** read-your-writes (route own reads to leader/current replica) · monotonic reads (pin session to one replica) · consistent prefix.
**Failover hazards:** detection tuning (tight=false failovers, loose=long outage) · **split-brain** (fence with epochs/leases/quorum) · lost unreplicated writes.
**Conflict resolution, weak→strong:** last-write-wins (silently drops data) → version vectors → CRDTs → app-merge. Never bare LWW without a caveat.

---

## Partitioning / sharding (2.5) — *different data, split across nodes*

Partition when **data volume** or **write throughput** outgrows one node (replicas multiply reads only; every replica absorbs every write). **Horizontal** (by rows) is the scale lever; vertical = split columns. Partition first, then replicate each shard ~3×.

| | **Range** | **Hash (`mod N` / consistent)** | **Directory / lookup** |
|---|---|---|---|
| Load distribution | uneven; skews | **even** (good hash) | as even as you place |
| Range scans | **cheap, local** (sorted) | expensive (scatter-gather) | depends on placement |
| Routing | compute range | compute hash | **extra hop** to directory |
| Hot-spot risk | **high** (time/seq keys) | low for keys; **single hot key still hot** | low (move the key) |
| Rebalance | split/merge a range | `mod N`: ~all move; consistent: ~1/N | edit table for moved keys |
| Failure surface | per-shard | per-shard | **directory is a SPOF** (replicate) |
| Use when… | range/recency queries (time-series, leaderboards) | uniform point-lookups, even spread | surgical placement, heterogeneous shards (Vitess, GFS/HDFS masters) |

**Hot-shard-of-the-day** = range-partition by timestamp → all writes hit the newest shard. **Hashing spreads keys, not a single hot key** (Zipfian: Bieber tweet, Black-Friday SKU). Mitigate: salt/decompose (`celebrityId#0..#9`) → scatter-gather on read · dedicated shard · cache the hot key (Redis) · fan-out-on-read for celebrities.
**Partition key = high cardinality + uniform access + aligned to the dominant query.** Composite (`user_id`+`timestamp`) reconciles spread vs recency. Pick it from the **R step**; name the query you made expensive.
**Discord pattern:** `PRIMARY KEY ((channel_id, bucket), message_id)` — composite partition key for spread + bounded partitions, clustering key for local time-ordered scans.

---

## Consistent hashing (2.6)

**`hash(key) mod N` is a rebalancing trap** — N is baked into the formula. Adding 1 node to N should move ~`1/(N+1)`; `mod N` moves ~`(N−1)/N`:

| Change | `hash mod N` moves | Ideal |
|---|---|---|
| 4 → 5 | **80%** | 20% |
| 10 → 11 | **90.9%** | 9.1% |
| 100 → 101 | **99.0%** | 1.0% |

(A *bigger* cluster doesn't reshuffle less — 4→5 also moves ~80%, so you can't grow your way out.) For a cache = miss storm + thundering herd; for a DB = ship the whole dataset.

**The ring:** map keys *and* nodes into one **fixed** hash space (independent of N); walk **clockwise** to the first node. Add/remove → only ~**K/N** keys move, to/from **one** successor. Replicas = next RF−1 distinct nodes clockwise (across AZs).

**A plain ring is lumpy** (peak/mean ≈ **1.73×** @10 nodes) and **cascades** (dead node dumps all load on one neighbor). **Virtual nodes** fix it:

| Vnodes/node | Peak / mean |
|---|---|
| 1 (plain) | 1.73× |
| 10 | 1.29× |
| 100 | 1.13× |
| 256 | 1.09× |

Vnodes also **scatter failure load** and **encode capacity** (beefy box = 2× vnodes = 2× keys). Cost: more gossip/metadata, streaming, repair, fragmented ranges — **Cassandra cut default 256 → 16.** Tuning trade, not "max it out."
**Consistent hashing balances keyspace, not traffic** — a hot key still melts one node (replicate it / coalesce / bounded-load CH). Alternative: **rendezvous (HRW)** — same minimal movement, easier weighting, but **O(N)** per lookup vs ring's O(log N) → use for small N.

---

## CAP & PACELC (2.7)

**CAP (precise):** under a **partition** you must forfeit **C or A** — *not* "any two of three." Rest of the time you have both.
**C** = linearizability (≠ ACID's C = constraints). **A** = every non-failing node answers. **P** = survive dropped messages.
**"CA system" is a category error at runtime** — P is environmental (NIC/switch/fiber failures, GC pauses = effective partitions). Live menu is **CP** or **AP**.

**PACELC (Abadi):** *if Partition → (A or C); Else → (L or C).* The **Else** is the 99.9% — strong consistency = coordination = round trips (cross-region RTT ~150 ms).

| Signature | Plain reading | Examples |
|---|---|---|
| **PA/EL** | fast + available; eventual | **Cassandra, DynamoDB, Riak** (defaults) |
| **PC/EC** | correct always; pays coordination | **Spanner, VoltDB**, single-leader RDBMS |
| **PA/EC** | strong-ish normally, available under partition (rare corner) | **MongoDB** w:majority |
| **PC/EL** | strict under partition, fast/stale local reads normally | **PNUTS** (people invert this) |

**Per-operation decision:** money / inventory / charge-once → **CP/EC** (a wrong balance beats a retry); cart / feed / likes / presence / view counts → **AP/EL** (Amazon's cart *motivated* Dynamo). Same product runs both. The quorum dial (2.8) **slides a store between quadrants** — the label is a consequence of configuration.
**Reconcile "Spanner is CP" with five-nines:** CP = the choice in the *rare partition instant*; yearly availability is the aggregate over mostly-no-partition time.

---

## Consistency models & quorums (2.8)

**Spectrum (strong→weak):** linearizable (real-time recency, 1 object) → sequential (some global order, not real-time) → causal (happens-before preserved; **ceiling for AP**) → eventual (converge *if writes stop*).
**Linearizable ≠ serializable** (single-object recency vs serial order over multi-object txns — orthogonal; strict serializability = both).
**Session guarantees (cheap, per-client):** read-your-writes · monotonic reads — deliver via sticky routing / version tracking, **not** full quorum.

**Quorum rule — derive by pigeonhole:** write lands on ≥W of N, read collects ≥R; worst-case `overlap = max(0, W + R − N)`. Forced to share a replica ⇔

> **W + R > N**  → read **contains** the latest write (still need **version metadata** to pick the winner).

**Second rule:**

> **W > N/2** (majority) → two concurrent writes can't commit on disjoint sets → conflict **detected**, not silently diverged.

`W = R = ⌊N/2⌋+1` satisfies both = canonical strong config.

| Config (N=3) | W+R vs N | Consistency | Write avail | Read avail | Use when… |
|---|---|---|---|---|---|
| **W=1, R=1** | 2 < 3 | eventual | tolerates 2 down | tolerates 2 down | feeds, likes, carts, presence |
| **W=2, R=2** | 4 > 3 | **strong** (overlap + W>N/2) | tolerates 1 | tolerates 1 | money, inventory, identity |
| **W=3, R=1** | 4 > 3 | strong, read-fast | **0 down** (any blocks writes) | tolerates 2 | read-mostly + strong (flags) |
| **W=1, R=3** | 4 > 3 | strong, write-fast | tolerates 2 | **0 down** (any blocks reads) | write-heavy + rare strong audit |

**Availability:** writes tolerate N−W down, reads N−R. **Tail latency:** wait on the W-th/R-th fastest replica (local R=1 ~1–5 ms; cross-AZ majority ~5–15 ms; cross-region tens–hundreds ms).
**Sloppy quorum + hinted handoff:** accept the write on the first N **reachable** (non-home) nodes, hand off later → buys **write availability** by **breaking `W+R>N`** until the hint delivers. Right for cart/feed, wrong for a balance decrement.
**Quorum gives recency, not atomic read-modify-write.** Two decrements can each read `1`, write `0` with `W+R>N` holding → oversell. `W>N/2` only makes it *detectable* (Cassandra LWW may silently drop one). Prevent with a **conditional write / compare-and-set** (`IF stock > 0`) or **LWT/Paxos**.

---

## Bloom filters (2.9)

Bit array `m` + `k` hashes. **Insert:** set k bits. **Query:** any 0 → **definitely absent** (safe skip); all 1 → **probably present**.
**No false negatives** (so "absent" safely skips work) · **tunable false positives** (a wasted lookup, never wrong).

`p ≈ (1 − e^(−kn/m))^k` · optimal `k* = (m/n)·ln2 ≈ 0.69·(m/n)`

| Target p | bits/elem (m/n) | k |
|---|---|---|
| 10% | ~4.8 | 3–4 |
| **1%** | **~9.6** | **7** |
| 0.1% | ~14.4 | 10 |
| 0.01% | ~19.2 | 13 |

**Memorize:** ~9.6 bits/elem = ~1% FP at k=7; each 10× lower p costs ~+4.8 bits/elem; size is independent of key size. **1M keys @1% → ~1.2 MB** (vs ~40 MB exact = **~30× smaller**, fits in RAM).
**Uses:** LSM SSTable skip (2.3) · cache/CDN guard against **cache penetration** (2.10). **Caveat:** plain filter **can't delete or enumerate** → Counting Bloom (~4× space) or Cuckoo for deletes.

---

## Latency vs throughput (2.9)

**Latency** = one op (user feels it). **Throughput** = ops/sec (cost/capacity). Different axes — **batching trades latency *for* throughput** (Nagle, `linger.ms`, GPU batching).

> **Little's Law: concurrency = throughput × latency** (`L = λ·W`)

10k QPS × 200 ms = **2,000 in flight** → sizes thread/connection pools. A latency regression **silently raises concurrency** (200→400 ms doubles in-flight to 4,000) → pool exhaustion → queueing → **collapse** (feedback loop, not linear). Headroom on QPS is a red herring.
**Write SLOs on p99/p99.9, not the mean** — especially under fan-out. `P(≥1 slow) = 1 − 0.99^N`:

| Fan-out N | P(hits ≥1 slow) |
|---|---|
| 10 | ~9.6% |
| **100** | **~63%** |
| 1000 | ~99.99% |

**100-way fan-out + 1%-slow backend → ~63% of requests slow** (tail amplification). Mitigate: **hedged/backup requests**, tail-tolerant timeouts, request budgets, reduce fan-out.

---

## Batch vs stream (2.9)

| | **Batch** | **Micro-batch** | **True streaming** |
|---|---|---|---|
| Latency | minutes–hours | ~1–10 s | sub-second–ms |
| Throughput / $ | highest | high | lower (always-on) |
| State/windowing | none (bounded) | windowed | continuous, watermarks, checkpoints |
| Exactly-once | trivial (re-run) | engine-managed | hardest |
| Tech | Spark, MapReduce, Hive | Spark Structured Streaming | **Flink, Kafka Streams** |
| Use when… | hourly/daily freshness fine (billing, reports, training) | seconds of lag OK | must act in ms–s (fraud block, alerting) |

**Combine:** **Lambda** = batch + speed layers, merge at serving → correctness *and* freshness, **dual codebases** (drift, double on-call). **Kappa** = stream-only, **replay the log** to reprocess → one codebase, but **expensive replays** + retention dependence.
**Decision rule:** drive from the **freshness NFR**. "Results an hour old fine" → batch (cheaper/simpler; streaming buys freshness nobody asked + windowing/state/exactly-once tax). "Act within seconds" → stream. Not "real-time is better."

---

## API / communication styles (2.10)

| | **REST** | **gRPC** | **GraphQL** |
|---|---|---|---|
| Model | resources / nouns | procedures / verbs (typed) | typed graph, 1 endpoint, client picks fields |
| Wire | JSON (readable) | **Protobuf** binary (3–10× smaller) | JSON over a query |
| Over/under-fetch | over-fetches; N+1 round trips | tight | **eliminates both** |
| Streaming | not native | **first-class** (HTTP/2, bi-di) | subscriptions (bolt-on) |
| Caching | **free** (`GET`/`ETag`/CDN) | none at HTTP layer | **lost** (one POST) — rebuild per-field |
| Browser | universal | needs **gRPC-Web + proxy** | universal |
| Coupling | loose | tight (shared schema) | medium |
| Use when… | public, CRUD, cacheable, max reach | **internal service-to-service**, low latency, streaming | **many heterogeneous clients**, mobile bandwidth |

**What you forfeit (say it):** GraphQL → free HTTP caching + the **N+1 resolver** problem (batch with DataLoader) + **query-complexity** as an availability/cost risk (depth limits). gRPC at the edge → browser-native consumption.

**Sync vs async = a coupling decision, not speed.** Sync: simple, immediate, but **temporal coupling** + cascading failure — a 5-deep chain @99.9% each ≈ **99.5%** (availability multiplies) and latency sums. Async (Kafka/RabbitMQ/SQS): decouples in time, **absorbs bursts**, isolates failure; costs eventual consistency, a broker to run, idempotent consumers (at-least-once). "Async" doesn't shorten work — it trades immediacy for resilience.

---

## Stateful vs stateless (2.10)

**Stateless app tier scales horizontally** because every node is identical/disposable. 30k QPS ÷ 3k/node = 10 nodes:

| | **Stateful** (in-memory session) | **Stateless** (externalized) |
|---|---|---|
| Routing | **sticky sessions** (affinity) | round-robin, no affinity |
| Load | uneven (hot users pin) | even across all nodes |
| Add a node | helps **new** sessions only | **instantly takes its share** |
| Node death | **loses all its sessions** | loses **zero** state |
| Deploys | disruptive (drops sessions) | trivial |

**Fix:** externalize session to **Redis** (token → blob, sub-ms, TTL) — any node serves any request. State didn't vanish; it **moved to a tier built to be shared** (compute = cattle, not pets). Cost: ~1 ms hop per request (vs ~100 ns in-process) + Redis becomes an HA dependency. Sticky sessions = named short-term **debt** only. JWT pushes state into the client (no Redis for identity) — cost: can't revoke before expiry.

**Caching makes statelessness cheap** (one shared fast tier). Read-through @**90% hit** = ~10× less origin load, ~10 ms → ~1 ms. But it's a **second copy of the truth** → pick a write strategy:

| Strategy | Write path | Trade |
|---|---|---|
| **Cache-aside** (default) | update DB, **invalidate** key; next read reloads | durable, never lost; extra miss after write |
| **Write-through** | update cache **+** DB together | fresh read-after-write; **highest write latency** |
| **Write-back** | update cache, mark dirty, ack; flush DB async | **lowest write latency**, absorbs bursts; **crash loses dirty writes** |

Aside/through when durability matters (most data); write-back only when the source is reconstructable and a loss window is tolerable.

---

## Strong signal vs red flag (Module 2)

- ✅ "Replication and partitioning solve different problems — I'd do both" · ✅ quantifies `mod N` (80/90/99%) and reaches for consistent hashing (~K/N) · ✅ names the query a partition key made expensive · ✅ "consistent hashing balances keyspace, not traffic" (hot keys still need handling) · ✅ refuses "is it CP or AP?" as malformed — decides **per operation**, names the cost of the dropped side · ✅ derives `W+R>N` by pigeonhole *and* knows it needs versioning + the `W>N/2` rule · ✅ "quorum gives recency, not atomic read-modify-write — add a conditional write/LWT" · ✅ Bloom: "absent is always correct, FP is a wasted lookup" · ✅ Little's Law to size pools + SLO on p99 · ✅ batch/stream from the freshness NFR · ✅ gRPC east-west, REST/GraphQL at the edge, names what each forfeits · ✅ stateless tier + session in Redis, ~1 ms hop owned as the cost.
- 🚩 "add replicas" to fix a write-throughput ceiling · 🚩 "just hash it" for a celebrity key · 🚩 adding a node is cheap/instant · 🚩 "max out vnodes for evenness" (ignores streaming/repair tax) · 🚩 builds a "CA" datastore / "pick any two of three" · 🚩 labels the whole company "AP" · 🚩 recites `W+R>N` with no derivation, or thinks it makes the *system* strongly consistent · 🚩 majority quorum "makes the counter safe" · 🚩 thinks a Bloom filter has false negatives, or supports delete · 🚩 optimizes the mean, surprised by tail · 🚩 "real-time is better" with no requirement · 🚩 "gRPC everywhere" / GraphQL as free lunch · 🚩 "we're stateless" while sessions sit in process memory (then turns on sticky to "fix" it).
