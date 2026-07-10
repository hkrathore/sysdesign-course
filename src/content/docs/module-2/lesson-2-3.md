---
title: "2.3 - Indexing (B-tree vs. LSM-tree, the write/read trade)"
description: "Indexing (B-tree vs. LSM-tree, the write/read trade)"
sidebar:
  order: 3
---

> Every index is a bet on which side of the ledger pays: faster reads always cost slower writes and more space. The decision here is between two engines: a **B-tree** edits sorted pages in place (cheap, predictable reads; random-I/O writes) while an **LSM-tree** appends sequentially and cleans up later (cheap writes; reads may check several files, and compaction bills you in background CPU, I/O, and latency spikes). Pick from the read:write ratio: an orders table wants B-tree, a ~700k writes/s metrics flood wants LSM.

### Learning objectives
- Explain why indexes exist and the fundamental read / write / space trade-off they impose.
- Contrast **B-tree** (read-optimized, in-place) with **LSM-tree** (write-optimized, append + compact).
- Match a storage engine to a workload, and connect it back to the database families.
- Reason about secondary indexes and their cost, especially in distributed stores.

### Intuition first
An index is the **index at the back of a textbook.** Without it you scan every page (O(n)); with it you jump straight to the right page (O(log n)). But it isn't free, every addition must also update the index. **A B-tree is a meticulously maintained, always-sorted index that you edit in place**, superb for lookups, pricier per edit. **An LSM-tree is jotting new entries on sticky notes (instant append) and periodically reorganizing them into the master index in big batches** (compaction), superb for writes, but a lookup may check several stacks of notes.

### Deep explanation
**Why index at all, and the unavoidable trade-off:** an index turns an O(n) scan into an O(log n) lookup. The cost: indexes **speed reads but slow writes** and **consume space.** This three-way tension, read vs. write vs. space amplification, is the entire subject.

**The two engines, mechanics in one line: B-tree = in-place updates + WAL (write-ahead log); LSM = append + background compaction.**

**B-tree (and B+tree):** a balanced, sorted tree updated in place. Reads are O(log n), predictable, and excellent for **range queries**; writes pay **random I/O** and write amplification. Used by Postgres, MySQL/InnoDB, most relational engines, read-optimized and operationally mature.

**LSM-tree (Log-Structured Merge):** writes are cheap **sequential appends** (recall: sequential ≫ random), batched in memory and flushed as immutable, sorted **SSTables** (a stack of sticky notes filed in one go). Reads may have to check several files (**read amplification**), mitigated by **Bloom filters**; background **compaction** merges files and discards dead keys (the batched reorg into the master index). Compaction strategy (size-tiered vs leveled) is a write-vs-read/space knob, name the trade, then hand the tuning to the storage team. Used by Cassandra, RocksDB, LevelDB, HBase, Bigtable, ScyllaDB, write-optimized.

![Side-by-side anatomy of the two engines: a B-tree of sorted pages edited in place with a WAL, linked leaves serving range scans; and an LSM tree where writes append to a WAL plus in-memory memtable, flush as immutable SSTables carrying Bloom filters, and background compaction merges files while reads check newest to oldest](../../../assets/images/module-2/btree-vs-lsm.png)

*The anatomy behind the trade: B-trees edit sorted pages in place (cheap reads, random-I/O writes); LSM appends and defers ordering to compaction (cheap sequential writes, amplified reads).*

<details>
<summary>Go deeper, write/read path mechanics and compaction strategies (IC depth, optional)</summary>

- **B-tree write path:** fixed-size pages (typically 4-16 KB) edited in place; inserting into a full page triggers a **page split** (write amplification), and every change is journaled to a **write-ahead log (WAL)** first for crash durability. Leaf pages are linked in sorted order, that's what makes range scans cheap.
- **LSM write path:** append to the WAL + insert into an in-memory sorted **memtable**; when it fills, flush the whole thing to disk as one immutable SSTable in a single sequential write.
- **LSM read path:** check the memtable, then SSTables newest→oldest; a per-SSTable Bloom filter lets a read skip files that provably don't contain the key.
- **Compaction strategies:** **size-tiered** merges similarly-sized SSTables, least write amplification, but more overlapping files per read and transient ~2× space during merges (write-optimized). **Leveled** maintains non-overlapping, size-bounded levels, fewer files per read and tighter space, at the cost of more rewrite work per ingested byte (read/space-optimized). RocksDB defaults to leveled; Cassandra defaults to size-tiered with leveled as the opt-in for read-heavy tables.

</details>

**The core trade, stated cleanly:** B-tree pays in **write amplification + random I/O** to keep reads cheap; LSM pays in **read amplification + space amplification + background compaction** to make writes a cheap sequential append. So write-heavy workloads (logs, metrics, messaging, feeds) favor LSM; read-heavy transactional workloads favor B-tree.

**Secondary indexes, the hidden tax:** every secondary index **slows every write and costs space.** In distributed stores they're constrained, DynamoDB's **global secondary index** is effectively another replicated table; in Cassandra you usually **denormalize into a second query-shaped table** instead.

**The operational point a Director should raise:** compaction is a **background tax**, CPU, disk I/O, **latency spikes**, temporary space bloat. "LSM is fast at writes" is incomplete; the full statement is "fast writes, paid back later by compaction you must capacity-plan and monitor."

### Diagram: write and read paths
```mermaid
flowchart TD
    subgraph BT[B-tree engine]
      W1[Write] --> WAL1[WAL] --> P[In-place page update<br/>random I/O, may split]
      R1[Read] --> TREE[O log n traversal<br/>1 location, range-friendly]
    end
    subgraph LSM[LSM-tree engine]
      W2[Write] --> WAL2[WAL] --> MT[Memtable in RAM]
      MT -->|flush, sequential| SST[Immutable SSTables]
      SST -->|background| CMP[Compaction<br/>merge + discard]
      R2[Read] --> MT
      R2 --> BF{Bloom filter<br/>per SSTable}
      BF -->|maybe present| SST
    end
    style P fill:#7a1f1f,color:#fff
    style MT fill:#1f6f5c,color:#fff
    style CMP fill:#e8a13a,color:#000
```

### Worked example: metrics ingestion vs. an orders table
- **Metrics/time-series ingest** (the estimation lesson's ~700k writes/s example): overwhelmingly write-heavy, append-shaped, reads mostly over recent ranges → **LSM (Cassandra/Bigtable).** Sequential flushes absorb the write flood; Bloom filters keep read amplification in check (fewer note stacks to check).
- **Orders table** needing multi-row transactions, joins, and ad-hoc reporting → **B-tree (Postgres).** Reads and integrity dominate at modest write rate, in-place updates and rich indexing are exactly what you want.

The decision falls straight out of the **read:write ratio** plus the query shape, which is why you establish those in RESHADED's R step.

### Trade-offs table: B-tree vs LSM
| Engine | Write amp | Read amp | Space amp | Use when… |
|---|---|---|---|---|
| **B-tree** | higher (in-place, random I/O) | low (one location) | low | Read-heavy, transactional, range + ad-hoc queries |
| **LSM** | low (sequential append) | higher (multiple SSTables; Bloom filters help) | higher (transient, until compaction) | Write-heavy at scale: logs, metrics, messaging, feeds |

### What interviewers probe here
- **"Why is Cassandra so fast at writes?"**, *Strong:* sequential append to memtable+WAL, deferred sorting/merging via compaction, no in-place random I/O. *Red flag:* "it's distributed" (that's orthogonal).
- **"What does LSM cost you on reads, and how is it mitigated?"**, *Strong:* read amplification across SSTables, mitigated by Bloom filters and leveled compaction. *Red flag:* believing LSM reads are as cheap as writes.
- **"What's the operational cost of compaction?"**, *Strong:* CPU/IO load, latency spikes, transient space bloat, must be capacity-planned. *Red flag:* unaware it exists.

### Common mistakes / misconceptions
- Treating indexes as free, every index taxes writes and storage.
- Believing LSM is universally superior; it trades read/space/compaction cost for write speed.
- Over-indexing a write-heavy table (each secondary index multiplies write cost).
- Ignoring compaction as an operational concern.
- Forgetting that distributed secondary indexes are expensive/limited, denormalize instead.

### Practice questions
**Q1.** Why does LSM win for writes, and what do you give up in exchange?

<details>
<summary>Model answer, try yours out loud first</summary>

> *Model:* LSM turns every write into a cheap sequential append instead of B-tree's random in-place I/O, sequential ≫ random is the whole win. You give up **read amplification** (several SSTables per lookup; Bloom filters and compaction bound it), transient **space amplification**, and **compaction itself**, a background CPU/I/O tax you must capacity-plan or it surfaces as latency spikes. Decide from the read:write ratio: pay compaction later only if writes dominate now.

</details>

**Q2.** Why does an LSM engine pair so naturally with the "sequential ≫ random" insight?

<details>
<summary>Model answer, try yours out loud first</summary>

> *Model:* LSM deliberately converts random user writes into large **sequential** disk writes (flush) and sequential merges (compaction), dodging the random-I/O penalty that dominates write cost on disks. The price is deferred: compaction re-does the sorting later as cheap, batched sequential work.

</details>

**Q3.** When would you accept B-tree's higher write amplification on purpose?

<details>
<summary>Model answer, try yours out loud first</summary>

> *Model:* When reads and consistency dominate: transactional systems with ad-hoc queries, range scans, and integrity needs at moderate write volume, predictable single-location reads and mature transactional support outweigh the in-place write cost. Exactly the relational-store case.

</details>

### Key takeaways
- Indexes trade faster reads for slower writes and more space, never free.
- B-tree: in-place, read-optimized, range-friendly, random write I/O → relational/transactional.
- LSM: append + compact, write-optimized, sequential I/O → write-heavy at scale (Cassandra/RocksDB).
- LSM read cost is tamed by Bloom filters + leveled compaction; compaction is an operational tax.
- Choose the engine from the read:write ratio and query shape, secondary indexes cost real money per write.

> **Spaced-repetition recap:** Textbook index. B-tree = sorted, in-place, cheap reads/pricier writes. LSM = sticky-notes + batched reorg (compaction), cheap sequential writes/pricier reads (Bloom filters help). Match engine to read:write ratio.
