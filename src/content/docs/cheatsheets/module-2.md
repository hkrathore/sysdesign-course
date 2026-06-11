---
title: "Module 2 — Core Concepts & Trade-offs Cheat Sheet"
description: "Core-concepts & trade-offs cheat sheet."
sidebar:
  order: 2
---

### Decision → trade-off → the number. Skimmable in 5 minutes.

---

## 2.1 Front door & request path

- **Forward proxy** acts for the **client** (egress control, filtering); **reverse proxy** acts for the **servers** (LB, TLS termination, caching, WAF, hides backend).
- **L4 LB** = fast, connection-level, no payload inspection. **L7** = content routing, sticky, canary; costs CPU. Often L4→L7 in series.
- **Lifecycle:** DNS → TCP (~1 RTT) → TLS (~1 RTT) → HTTP. Cross-region RTT ≈ **150 ms** → terminate handshakes near the user.
- **DNS = cached, eventually consistent.** Low TTL = fast failover + more queries; high TTL = slow drain. DNS failover is best-effort, never a hard RTO, pair with anycast / global L7 LB.

## 2.2 SQL vs NoSQL

- Decide on **4 axes**: data model · schema on-write vs on-read · ACID vs BASE · scale up vs out. Never "old vs new."
- KV → cache/sessions/pure lookups (Redis, DynamoDB) · Document → evolving aggregates (MongoDB) · Wide-column → write-heavy/time-series at scale (Cassandra) · Graph → relationship traversal (Neo4j).
- **Default: Postgres** (replicas, partitioning, `JSONB`) until a **measured** limit forces out-scaling. NewSQL (Spanner, CockroachDB) dissolves "scale vs ACID." Real systems are polyglot. "Schemaless" just moves the schema into app code.

## 2.3 Indexing: B-tree vs LSM

- An index turns O(n) → O(log n). Cost: **speeds reads, taxes writes, uses space**, that trade is the whole subject.
- **B-tree** read-heavy, transactional, ranges (Postgres, InnoDB); **LSM** write-heavy throughput (Cassandra, RocksDB), read-amp plus compaction's operational tax is the cost.
- Distributed secondary indexes tax every write and stay limited → **denormalize into a query-shaped table**.

## 2.4 Replication: same data, many copies

- Buys availability, read scale, latency, durability. **Does nothing for write throughput**, that's partitioning (2.5). Do both.
- **Leader-follower:** strong at leader, followers lag, single-region default. **Multi-leader:** multi-region writes, must resolve conflicts. **Leaderless:** tunable N/W/R, highest availability.
- **Sync** = durable but latency-bound and a dead follower stalls writes; **async** = fast but stale reads + lost-write window; semi-sync compromises.
- Lag fixes: read-your-writes (route own reads to leader) · monotonic reads (pin session to one replica).
- Failover hazards: **split-brain** (fence with epochs/leases/quorum) · lost unreplicated writes · detection tuning (tight = false failovers, loose = long outage).
- Conflicts, weak→strong: **LWW (silently drops data)** → version vectors → CRDTs → app-merge. Never bare LWW without the caveat.

## 2.5 Partitioning / sharding

- Partition when data volume or **write throughput** outgrows one node. Partition first, then replicate each shard ~3×.
- **Range:** cheap local range scans; hot-spots on time/sequential keys ("hot shard of the day"). **Hash:** even key spread; range scans become scatter-gather. **Directory:** surgical placement; extra hop + directory SPOF.
- **Hashing spreads keys, not one hot key** (celebrity, Black-Friday SKU). Mitigate: salt/split the key (`id#0..#9`), dedicated shard, cache it, fan-out-on-read.
- **Partition key = high cardinality + uniform access + aligned to the dominant query.** Composite keys (`user_id + timestamp`) reconcile spread vs recency. Pick it in the R step; **name the query you made expensive**.

## 2.6 Consistent hashing

- **`hash mod N` is the trap:** 4→5 nodes moves ~80% of keys; 10→11 ~91%; 100→101 ~99%. Ideal is ~1/N. For a cache = miss storm; for a DB = re-ship the dataset.
- **Ring:** keys and nodes in one fixed hash space; clockwise to the next node. Add/remove moves only ~**K/N** keys, to/from one successor.
- Plain ring is lumpy (peak/mean ≈ 1.73× at 10 nodes) and a dead node dumps its load on one neighbor → **virtual nodes** (~100 vnodes → ~1.13×, failure load scattered, capacity weighting). More vnodes = gossip/streaming/repair tax, Cassandra cut the default 256 → 16.
- **Balances keyspace, not traffic**, a hot key still melts one node. Rendezvous (HRW) = same minimal movement, O(N) lookup → small N only.

## 2.7 CAP & PACELC

- **CAP, precisely:** under a partition you forfeit **C or A**, not "any two of three." A "CA" distributed system is a category error; the live menu is CP or AP.
- **PACELC:** if **P**artition → A or C; **E**lse → **L**atency or **C**onsistency. The Else is 99.9% of life: strong consistency = coordination round trips (~150 ms cross-region).
- **PA/EL:** Cassandra, DynamoDB defaults. **PC/EC:** Spanner, single-leader RDBMS. **PA/EC:** MongoDB w:majority.
- **Decide per operation, not per company:** money / inventory / charge-once → CP/EC; cart / feed / likes / presence → AP/EL. The quorum dial (2.8) slides one store between quadrants.

## 2.8 Consistency models & quorums

- Spectrum strong→weak: **linearizable** → sequential → **causal** (the ceiling for AP) → eventual (converges only if writes stop).
- **Linearizable ≠ serializable**, single-object recency vs multi-object transaction order; strict serializability = both.
- Session guarantees (read-your-writes, monotonic reads) are cheap, sticky routing/version tracking, not full quorum.

> **W + R > N** → a read contains the latest write (needs version metadata to pick it).
> **W > N/2** → concurrent writes can't silently diverge (detected, not prevented).
> `W = R = ⌊N/2⌋+1` satisfies both, the canonical strong config.

| Config (N=3) | Consistency | Tolerates down | Use |
|---|---|---|---|
| W=1, R=1 | eventual | 2 (both paths) | feeds, likes, carts |
| **W=2, R=2** | **strong** | 1 | money, inventory, identity |
| W=3, R=1 | strong, read-fast | 0 for writes | read-mostly flags |

- **Latency anchors:** local R=1 ≈ **1-5 ms** · cross-AZ majority ≈ **5-15 ms** · cross-region ≈ tens-hundreds of ms. Availability: writes tolerate N−W down, reads N−R.
- **Sloppy quorum + hinted handoff** buys write availability by breaking W+R>N until hints deliver, fine for carts, wrong for balances.
- **Quorum gives recency, not atomic read-modify-write:** two decrements can both read `1` and write `0`. Prevent with a **conditional write / CAS / LWT**, not a bigger quorum.

## 2.9 Bloom filters · latency vs throughput · batch vs stream

**Bloom filter:** any 0 bit → **definitely absent** (safe skip); all 1 → probably present. No false negatives; a false positive = wasted lookup, never wrong. **~9.6 bits/element ≈ 1% FP at k=7**; each 10× lower FP ≈ +4.8 bits/elem; 1M keys @1% ≈ **1.2 MB** (~30× under an exact set). Plain filters can't delete or enumerate (Counting/Cuckoo if you must).

**Latency vs throughput:** different axes, batching trades latency *for* throughput. **Little's Law: concurrency = throughput × latency.** 10k QPS × 200 ms = **2,000 in flight** → sizes pools; a 2× latency regression doubles in-flight → pool exhaustion → queueing collapse. SLO on **p99, not the mean**; fan-out amplifies tails: 100-way fan-out × 1%-slow backend → **~63% of requests slow** (1 − 0.99¹⁰⁰). Mitigate: hedged requests, request budgets, less fan-out.

**Batch vs stream:** decide from the **freshness NFR**, never "real-time is better." Hour-old fine → batch (Spark, cheapest, exactly-once trivial) · seconds → micro-batch · act in ms-s (fraud, alerting) → streaming (Flink, pays the windowing/state/exactly-once tax). Lambda = batch + speed layers (dual codebases, drift); Kappa = replay the log (one codebase, expensive replays).

## 2.10 APIs, sync vs async, state, caching

- **REST**, public, CRUD, free HTTP/CDN caching, max reach. **gRPC**, internal east-west: Protobuf 3-10× smaller, native streaming; not browser-native. **GraphQL**, many heterogeneous clients, kills over-fetch; forfeits HTTP caching, adds N+1 resolvers + query-complexity risk. Name what each forfeits.
- **Sync vs async = a coupling decision, not speed.** A 5-deep sync chain @99.9% each ≈ **99.5%** and latencies sum. Async (Kafka/SQS) absorbs bursts and isolates failure; costs eventual consistency, a broker, idempotent consumers.
- **Stateless app tier** = any node serves any request; nodes are disposable; deploys trivial. Externalize sessions to Redis (~1 ms hop vs ~100 ns in-process, own that cost). Sticky sessions = uneven load + lossy failover = named short-term debt. JWT = state in the client; can't revoke before expiry.
- **Cache write strategies:** **cache-aside** (default, update DB, invalidate key) · **write-through** (fresh read-after-write, highest write latency) · **write-back** (fastest, crash loses dirty writes, only for reconstructable data). 90% hit ≈ **10× origin shed**.

---

## Strong signal vs red flag

- ✅ "Replication and partitioning solve different problems, I'd do both" · names the query the partition key made expensive · "consistent hashing balances keyspace, not traffic" · refuses "CP or AP?" as malformed, decides **per operation** and prices the dropped side · knows W+R>N needs versioning and the W>N/2 rule · "quorum ≠ atomic RMW, add a CAS/LWT" · Little's Law to size pools, SLOs on p99 · batch/stream from the freshness NFR · gRPC east-west, REST/GraphQL at the edge, names the forfeit.
- 🚩 "add replicas" for a write ceiling · "just hash it" for a celebrity key · builds a "CA" store / "pick any two" · labels the whole company AP · recites W+R>N but thinks it makes the *system* strongly consistent or the counter safe · Bloom filter with false negatives · optimizes the mean, surprised by tail · "real-time is better" with no requirement · "we're stateless" with sessions in process memory.
