---
title: "Master RESHADED Cheat Sheet"
description: "The one-page crown jewel: the 8 RESHADED steps, the canonical numbers, and the Director phrases for deciding and delegating."
sidebar:
  order: 99
---

### One page. The whole framework. Print this.

**Altitude dial (runs through every step):** *"Does the decision turn on this detail?"* → **Yes:** go deep 1-2 levels. **No:** state a default and delegate. Two fatal directions: *too high* (no mechanism, can't name a downside of own choice) · *too deep* (tuning a detail, no decision).

---

## The RESHADED spine: Do · Say · Signal

The **Say** column is the point: a quotable line per step that reads at Director altitude.

| # | Step | **Do** | **Say** (out loud) | Signal it sends |
|---|---|---|---|---|
| 1 | **R**: Requirements | Functional (verbs, cut to **3-5**) vs non-functional (adjectives, **quantify all**). Get the **read:write ratio**. | *"Internal or public? read:write? availability bar?, assuming public, 100:1, four-nines, core scope is create / redirect / analytics; aliases + expiry are stretch."* | Scope before build |
| 2 | **E**: Estimation | QPS, storage, bandwidth, servers. Order of magnitude, ≤3 min, round hard. | *"Does this fit on 10 servers or 10,000? 100:1 → reads dominate, so it lives or dies on the read/cache path; text storage is trivial, media is the cost."* | Reason in numbers |
| 3 | **S**: Storage | Pick the **store** to match the access pattern (≠ the schema). | *"Read-heavy → cache + read replicas. Write-heavy → log/queue front door + LSM (Cassandra). Blobs → S3 + CDN, egress is the bill."* | Match data to store |
| 4 | **H**: High-level design | Component/box diagram + the **happy path**. Diminishing returns past a point, more boxes ≠ more signal. | *"Here are the components and the request flow; the one decision that matters is X, so let me spend the time there."* | Think in components |
| 5 | **A**: API design | Endpoints / signatures: the contract between components. | *"`POST /urls → {short}`, `GET /{short} → 302`. Redirect is the hot, cacheable path; write is rare."* | Define interfaces |
| 6 | **D**: Data model | Schema, keys, **indexes**, and the **partition key** (this is where S becomes concrete). | *"Partition by userId to co-locate a user's data; secondary index on createdAt for the timeline. Watch the hot-key risk on celebrities."* | Know where data lives |
| 7 | **E**: Evaluation | Re-check against the NFRs; find **what breaks first**. | *"At our peak QPS the single cache tier is the bottleneck vs the p99 budget, that's what breaks first, so I shard it."* | Stress your own design |
| 8 | **D**: Design evolution | Justify the trade-offs; scale under a **new constraint** (10×, new region, new feature). | *"At 10× the write path saturates first; I'd pull lever Y. I considered X and rejected it because cost/operability, I'd revisit if the constraint changed."* | Think past v1 |

**The two non-negotiables:** (1) Always **quantify**, "it scales" is banned. (2) Every decision **names its trade-off and the alternative rejected, and why.**

---

## Canonical numbers: memorize cold

### Latency ladder (internalize **ratios**, not digits)
| Operation | Latency | vs RAM |
|---|---|---|
| L1 cache reference | 0.5 ns |, |
| Branch mispredict | 5 ns |, |
| L2 cache reference | 7 ns |, |
| Mutex lock/unlock | 25 ns |, |
| **Main memory (RAM) reference** | **100 ns** | **1× (baseline)** |
| Compress 1 KB (Snappy) | ~2-3 µs | ~25× |
| Send 1 KB / 1 Gbps network | ~10 µs | ~100× |
| SSD random read (4 KB) | ~150 µs | ~1,500× |
| Read 1 MB seq from memory | ~250 µs | ~2,500× |
| **Same-datacenter round trip** | **~500 µs** | **~5,000×** |
| Read 1 MB seq from SSD | ~1 ms | ~10,000× |
| HDD disk seek | ~10 ms | ~100,000× |
| Read 1 MB seq from HDD | ~20 ms | ~200,000× |
| **Cross-continent round trip** | **~150 ms** | **~1,500,000×** |

**Human scale (1 ns = 1 s):** RAM **minutes** (~1.7 min) · same-DC RT **days** (~6 days) · cross-continent **years** (~4.75 yr). The map of distances inside the computer.

**The four reflexes:** cache aggressively, minimize hops (memory ~5,000× faster than a same-DC RT) · **never** a synchronous cross-region call on the hot path (~150 ms blows most p99 budgets alone) · sequentialize random I/O (why LSM-trees exist) · sequential ≫ random everywhere.

**Tail amplifies:** 100 parallel leaves, each **1%** slow → 1 − 0.99¹⁰⁰ ≈ **63%** of requests hit a tail event → **hedge, bound fan-out, p99-aware LB, request budgets.**

### Powers of ten (estimation shortcuts)
- Seconds in a day = 86,400 ≈ **10⁵** (round to 100k, clean, slightly conservative denominator).
- Bytes: **KB 10³ · MB 10⁶ · GB 10⁹ · TB 10¹² · PB 10¹⁵.**
- Commodity server ≈ **~1k simple req/s** (state it, varies 10× by workload).

**The five estimates:**
- **avg QPS** = DAU × req/user/day ÷ 86,400
- **peak QPS** = avg × **2-10×** (spiky/event-driven higher)
- **read/write split** via ratio R → write-fraction = **1 / (R+1)**
- **storage/yr** = writes/day × payload × 365 × replication *(writes, not reads; ×3 replication common)*
- **bandwidth** = QPS × payload *(media systems: egress is the binding cost)*
- **servers** = peak QPS ÷ per-server capacity

> The number exists only to justify **one architectural sentence.** Off by 2× is fine; off by 100× is the mistake.

### Availability nines → downtime budget
| Availability | Downtime / year | Downtime / month |
|---|---|---|
| 99.9% (three nines) | ~8.76 h | ~43 min |
| 99.99% (four nines) | ~52.6 min | ~4.3 min |
| 99.999% (five nines) | ~5.26 min | ~26 sec |

**Durability** lives in nines too: **S3 = 11 nines** (99.999999999%). **Latency** is always a **percentile (p99/p999)**, never a mean.

### Read:write ratio → the lever it pulls
| Skew | Means | Architecture |
|---|---|---|
| **Read-heavy** (e.g. 100:1) | reads dominate | cache + read replicas; optimize the read path |
| **Write-heavy** (e.g. 50:1 writes) | ingest dominates | log/queue (Kafka) front door + LSM (Cassandra); batch; time-partition |
| **Balanced** | neither dominates | size both paths; no free optimization |

**Consistency is per-feature:** follower count → eventual · bank balance / inventory commit / auth / uniqueness → strong · "see my own edit" → causal / read-your-writes.

---

## Director phrases

**Decide and defend** *(never present a choice you can't critique):*
- *"I considered X; I rejected it because [cost / operability / latency], though if [constraint] changed I'd revisit."*
- *"At 10× the [component] breaks first, the lever is [Y]."*
- *"The trade-off is [staleness / extra path]; I accept it here because the requirement is [read-heavy / tolerant], and I'd reject it for [money / inventory]."*

**Delegate depth credibly** *(beats grinding the detail yourself):*
- *"That tuning won't change the architecture, I'd have the storage team benchmark X vs Y; my prior is Y because the workload is read-heavy."*
- *"The key point is [collision-free IDs]; the exact scheme is a detail I'd delegate. Back to the system."*

**Handle pushback** *(it's usually a probe, not a correction):* **steelman → then update OR defend OR split.**
- *Update:* "You're right, that's a real gap, I'll switch to…"
- *Defend:* "I'll hold the line, given the read-heavy requirement, the staleness is acceptable and the simplicity is worth it."
- *Split (often best):* "Cache the **browse** path; never the **commit** path, the concern applies to one but not the other."

**Live recovery** *(recovery > flawlessness):* freeze → *"Let me step back to RESHADED…"* · blank number → method + bound, never fake precision · own error → state the **consequence**, correct, move on.
