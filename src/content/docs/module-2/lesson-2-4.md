---
title: "2.4 — Replication (leader-follower, multi-leader, leaderless)"
description: "Replication (leader-follower, multi-leader, leaderless)"
sidebar:
  order: 4
---

### Learning objectives
- State the four reasons we replicate, and distinguish replication from partitioning.
- Contrast the three topologies and their consistency / availability / complexity trade-offs.
- Reason about synchronous vs asynchronous replication and the user-facing effects of replication lag.
- Engineer around failover hazards (split-brain, lost writes) and set up the CAP discussion (2.7) and quorums (2.8).

### Intuition first
Replication is keeping **multiple synchronized copies** of your data. **Leader-follower:** one authoritative scribe (the leader) writes the master copy and dictates every change to assistants (followers) who hold read-only copies. **Multi-leader:** several scribes in different offices can all accept edits and then reconcile, with the obvious hazard that two of them edit the same line (a conflict). **Leaderless:** nobody's in charge; you write the same change to several copies and, when reading, consult several and take a majority view of the truth (the Dynamo style).

### Deep explanation
**Why replicate (and a clean distinction):** (1) **availability**, survive node/region loss; (2) **read scaling**, spread reads across copies; (3) **latency**, keep copies near users; (4) **durability**. *Replication = the same data in many places; partitioning (Lesson 2.5) = different data split across places.* Most real systems do both.

**Leader-follower (single-leader / primary-replica)**, the default for relational systems. All writes go to the **leader**, which streams changes to **followers**; reads can be served by either.
- **Synchronous replication:** the leader waits for a follower's ack before confirming the write → stronger durability/consistency, but higher write latency, and a slow or dead synchronous follower **stalls writes.**
- **Asynchronous:** the leader confirms immediately and replicates in the background → low latency, high write availability, but **replication lag** (followers serve **stale reads**) and risk of **losing unreplicated writes** if the leader dies. Common compromise: **semi-synchronous** (one synchronous follower, the rest async).
- **Replication-lag anomalies and their fixes:** *read-your-writes* (you post, then read a lagging follower and don't see your post → route a user's reads to the leader or a known-current replica for a window); *monotonic reads* (time appears to go backwards across reads → pin a user to one replica); *consistent prefix* (causally-ordered writes appear out of order).
- **Failover is the hard part:** detect leader death (timeout tuning, too tight = false failovers, too loose = long outages), promote the **most up-to-date** follower, and prevent **split-brain** (two nodes both believing they're leader → fence with epochs/leases/quorum). Async failover can **lose** the old leader's unreplicated writes.

**Multi-leader**, several leaders accept writes (often one per region). Pro: low write latency in every region and survival of a region partition. Con: **write conflicts** when the same datum is edited in two leaders. Resolution strategies, weakest→strongest: **last-write-wins** by timestamp (simple but silently drops data), **version vectors** (detect concurrent edits), **CRDTs** (conflict-free merge for suitable data types), or **application-level merge**. Used in multi-DC databases, calendar/contact sync, and collaborative editing.

**Leaderless (Dynamo-style)**, no leader; a client or coordinator writes to **N** replicas and waits for **W** acks, and reads from **R** replicas, taking the newest. The **quorum rule W + R > N** guarantees a read set overlaps the latest write set (developed fully in Lesson 2.8). Node failure needs no failover, you just talk to whoever's up, and convergence is maintained by **read repair** (fix stale replicas on read) and **anti-entropy / hinted handoff** (background reconciliation). Used by Cassandra, DynamoDB, Riak. Offers **tunable consistency** by choosing N/W/R.

**The Director-level framing:** topology is a requirements decision. Single-region, transactional, integrity-first → **leader-follower**. Global low-latency writes that must survive partitions → **multi-leader** or **leaderless**, accepting conflict-resolution complexity. High availability with tunable consistency → **leaderless quorum**. The signal is naming the lag/conflict/failover cost you're taking on, not just the topology.

### Diagram: the three topologies
```mermaid
flowchart LR
    subgraph LF[Leader-follower]
      WL[Write] --> L[(Leader)]
      L -->|replicate| F1[(Follower)]
      L -->|replicate| F2[(Follower)]
      RL[Read] -.-> F1
    end
    subgraph ML[Multi-leader]
      LA[(Leader US)] <-->|sync + conflict resolve| LB[(Leader EU)]
      WA[Write US] --> LA
      WB[Write EU] --> LB
    end
    subgraph LL[Leaderless quorum N=3]
      C[Client] -->|W acks| N1[(R1)]
      C --> N2[(R2)]
      C --> N3[(R3)]
      C -->|read R, newest wins| N1
    end
    style L fill:#1f6f5c,color:#fff
    style LA fill:#e8a13a,color:#000
    style LB fill:#e8a13a,color:#000
```

### Worked example: choosing topology from requirements
- **Read-heavy app (100:1) on Postgres:** **leader-follower** with several **async read replicas** to scale reads; serve most reads from followers, but route **read-your-writes** traffic (a user immediately re-reading their own change) to the leader for a short window. You accept bounded staleness on everyone else's reads as the price of cheap read scaling.
- **Globally-accepted writes that must survive a region cut** (e.g., the shopping cart that motivated Dynamo): **leaderless quorum**, AP-leaning, with conflict resolution (version vectors / merge, Amazon famously let a re-added deleted item win to avoid losing a sale). You accept conflict-handling complexity to get always-writable, partition-tolerant behavior.

### Trade-offs table: replication topology
| Topology | Write availability | Conflicts | Consistency | Complexity | Use when… |
|---|---|---|---|---|---|
| **Leader-follower** | writes need the leader (failover gap) | none (single writer) | strong at leader; lag on followers | low | Single-region, transactional, read scaling |
| **Multi-leader** | high (any region writes) | **yes**, must resolve | weak; converges | high | Multi-region low-latency writes |
| **Leaderless (quorum)** | high (no failover) | yes, read repair / vectors | **tunable** via N/W/R | medium-high | AP, high availability, tunable consistency |

### What interviewers probe here
- **"Sync or async replication, which and why?"**, *Strong:* async for write latency/availability *with* a named staleness/loss mitigation; sync (or semi-sync) where durability must be guaranteed. *Red flag:* picking one with no awareness of the trade.
- **"How do you give a user read-your-writes with read replicas?"**, *Strong:* route their own-data reads to the leader/current replica for a window, or track a write timestamp. *Red flag:* assuming followers are always current.
- **"What's split-brain and how do you prevent it?"**, *Strong:* two leaders after a bad failover; prevent with quorum/leases/fencing epochs. *Red flag:* never heard of it.
- **"Multi-leader, how do you resolve conflicts?"**, *Strong:* names LWW's data-loss risk and prefers version vectors/CRDTs/merge. *Red flag:* "last write wins" with no caveat.

### Common mistakes / misconceptions
- Assuming followers are always consistent with the leader (replication lag is real and user-visible).
- Conflating replication (copies of the same data) with partitioning (splitting different data).
- Choosing multi-leader without a conflict-resolution strategy.
- Thinking "more replicas = more consistency", consistency comes from the quorum/sync config, not the count.
- Underestimating failover: detection tuning, lost writes, and split-brain are where outages actually happen.

### Practice questions
**Q1.** Your async follower is 30 seconds behind during a traffic spike. What breaks for users, and what do you do?
> *Model:* Stale reads, users may not see their own recent writes (read-your-writes broken) and counts/feeds lag. Mitigations: route a user's own-data reads to the leader for a short window after their write; cap acceptable lag and shed read-replica traffic (or fail over) when exceeded; for monotonic reads, pin a session to one replica. Longer term, add replica capacity or reduce write amplification.

**Q2.** Why doesn't leaderless replication need a failover procedure?
> *Model:* There's no single leader to lose. With N replicas and quorum W/R, a request simply uses whichever replicas are reachable; a downed node reduces available replicas but the quorum can still be met. Convergence is restored later by read repair and hinted handoff. You trade failover complexity for quorum-tuning and conflict-resolution complexity.

**Q3.** A team proposes multi-leader across US and EU "for low latency." What do you make them answer first?
> *Model:* How will they resolve concurrent conflicting writes to the same key, and is that data conflict-tolerant? If LWW is acceptable they must accept silent data loss; otherwise they need version vectors, CRDTs, or app-merge, which only some data models support. If most data is single-region-owned (users mostly write their home region), partition ownership by region to sidestep most conflicts. Multi-leader without a conflict answer is a trap.

### Key takeaways
- We replicate for availability, read scale, latency, and durability; replication ≠ partitioning.
- Leader-follower: one writer, simple, strong at leader but followers lag; failover (split-brain, lost writes) is the hard part.
- Sync = durable/consistent but latency-bound; async = fast/available but stale + loss risk; semi-sync compromises.
- Multi-leader buys local writes at the cost of conflict resolution (avoid bare LWW).
- Leaderless quorum (W+R>N) gives high availability + tunable consistency with no failover, at the price of read-repair/conflict complexity.

> **Spaced-repetition recap:** One scribe (leader-follower: simple, lag, failover risk), many scribes (multi-leader: local writes, conflicts), or majority-vote (leaderless: W+R>N, tunable, no failover). Async is fast but stale; name the lag/conflict/failover cost you're accepting.
