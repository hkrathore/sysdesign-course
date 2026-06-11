---
title: "Module 1 — Interview Mechanics Cheat Sheet"
description: "Interview-mechanics cheat sheet."
sidebar:
  order: 1
---

### One page. Director altitude. Print this.

---

## The 5 scoring axes (Director weighting)
1. **Requirements & scoping** *(heavy)* — clarify first; cut to 3–5 core features.
2. **Estimation** *(medium)* — small fleet or hyperscale? Order of magnitude only.
3. **High-level design** *(medium)* — clean components + data flow. Diminishing returns past a point.
4. **Trade-offs & decision-making** *(heaviest)* — name 2–3 options, decide, defend.
5. **Communication & leadership** *(heavy)* — structure, drive, handle pushback, delegate credibly.

**Altitude dial:** *"Does the decision turn on this detail?"* → Yes: go deep 1–2 levels. No: state a default and delegate ("I'd have the storage team benchmark X vs Y; my prior is Y because…").

**Two failure directions:** *too high* (no mechanism, can't name a downside of own choice) = not technical enough to lead · *too deep* (tuning detail, no decision) = not operating at level.

---

## Requirements
**Functional = verbs** (cut to a defensible core). **Non-functional = adjectives** (quantify all).

| NFR | Quantify as | Pre-commits |
|---|---|---|
| Availability | nines → downtime/yr | redundancy / multi-region |
| Latency | **p99**, never mean | cache, in-region replicas |
| Consistency | strong / eventual / causal *per feature* | sync vs async replication |
| Durability | nines (S3 = 11) | replication / erasure coding |
| Read:write ratio | a number (e.g. 100:1) | cache vs ingest-optimized |

**Availability budget:** 99.9% = 8.76 h/yr · 99.99% = 52.6 min/yr · 99.999% = 5.26 min/yr.
**The move:** make every NFR drive a lever, out loud, with its trade-off.

---

## Estimation (≤3 min, round hard)
- **avg QPS** = DAU × req/user/day ÷ 86,400 *(≈10⁵)*
- **peak QPS** = avg × **2–10×**
- **read/write split** via ratio: write-frac = 1/(R+1)
- **storage/yr** = writes/day × payload × 365 × replication *(writes, not reads)*
- **bandwidth** = QPS × payload *(media systems: egress is the binding cost)*
- **servers** = peak QPS ÷ per-server capacity *(~1k req/s baseline — state it)*

Bytes: KB 10³ · MB 10⁶ · GB 10⁹ · TB 10¹² · PB 10¹⁵.
The number exists only to justify **one architectural sentence.**

---

## Latency ladder (ratios > digits)
| Op | Time | vs RAM |
|---|---|---|
| RAM reference | ~100 ns | 1× |
| Send 1 KB / 1 Gbps | ~10 µs | ~100× |
| SSD random read | ~150 µs | ~1,500× |
| Same-DC round trip | ~500 µs | ~5,000× |
| HDD seek | ~10 ms | ~100,000× |
| Cross-continent RT | ~150 ms | ~1,500,000× |

**Human scale (1 ns = 1 s):** RAM ~1.7 min · same-DC RT ~6 days · cross-continent ~4.8 years.

**Reflexes:** cache aggressively · no synchronous cross-region on the hot path · sequentialize random I/O (why LSM-trees exist) · **tail amplifies**: 100 parallel calls @1% slow → 1−0.99¹⁰⁰ ≈ **63%** hit a tail → hedge / bound fan-out / request budgets.

---

## Live recovery (recovery > flawlessness)
| Stumble | Move |
|---|---|
| Freeze | Return to RESHADED out loud |
| Rabbit hole | Name the altitude correction, zoom out |
| Ramble | "Let me structure this: components + the hard decision" |
| Blank number | Give method + bound, never fake precision |
| Pushback | **Steelman → update / defend with reasons / split the problem** |
| Own error | Own it, state the *consequence*, correct, move on |

**System failure modes to volunteer:** SPOF (redundancy) · cascading (circuit breakers, bulkheads) · cache stampede (coalescing, jittered TTL) · retry storm (backoff+jitter, retry budgets) · hot shard (better key, salting) · replication lag (read-your-writes routing).

---

## Strong signal vs red flag (universal)
- ✅ Clarifies before designing · ✅ numbers with assumptions · ✅ names a downside of own choice · ✅ says "what breaks first" · ✅ recovers cleanly · ✅ delegates with a stated prior.
- 🚩 "It scales horizontally" (no mechanism) · 🚩 strong consistency everywhere · 🚩 designs to average not peak · 🚩 only the happy path · 🚩 caves or stonewalls on pushback · 🚩 in the weeds, no decision.
