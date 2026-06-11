---
title: "6.1 — Capstone: Drive Your Own Design"
description: A fresh, meaty problem, a real-time collaborative document editor, that you design end-to-end yourself, then critique against a RESHADED-keyed strong-signal/red-flag rubric. The exercise is the lesson; the critique loop is the skill.
sidebar:
  order: 1
---

> This is the **capstone**, and it inverts every lesson before it. Modules 4 and 5 watched *me* run RESHADED on sixteen problems, you read a finished design and absorbed the moves. That builds recognition, not production. The interview tests production: under pressure, *you* must scope, quantify, decide, and stress a design that doesn't exist yet, with no answer key on the wall. So this lesson hands you a **fresh problem and an empty whiteboard**, and then, and this is the part that actually moves the needle, a **critique framework** to turn on your own work, keyed step-by-step to RESHADED. The spine here is not a solution. It is the **drive-then-critique loop**: you produce a first-pass design, then interrogate it with the exact questions a Staff/Principal interviewer would ask, marking each answer **strong-signal** or **red-flag**. Run the loop, find your own gaps, close them. That self-critique reflex, *"where would a good interviewer push, and would my answer survive it?"*, is the single most transferable thing this course can give a Director. Drive it yourself. Paste your design into an AI and have it ask you the §C questions verbatim. The point is the loop, not my approval.

### Learning objectives
- **Drive** a complete RESHADED design end-to-end on a problem you have not seen worked, a real-time collaborative document editor, producing the named artifact at each of the eight steps yourself.
- **Quantify** the load that actually defines this system: that **presence/cursor traffic dwarfs edit traffic**, that concurrent editors per doc is *tens, not thousands*, and that the durable write rate is far smaller than the connection count, and let those numbers pick your architecture.
- **Critique** your own design with a RESHADED-keyed rubric, scoring each answer **strong-signal vs red-flag**, and recognize the capstone's signature altitude trap: convergence correctness (OT/CRDT) is IC-deep, so the Director move is to *name the pivotal call and delegate the proof*, not hand-roll a CRDT at the whiteboard.
- **Run the loop**: first-pass answer → self-ask the probe → spot the red flag → revise, and feel why that loop, not the diagram, is what earns the offer.

### Intuition first: why this one is genuinely harder than anything in Module 5
Every problem in Module 5 let you escape the hardest version of concurrency. TinyURL's mappings are immutable, so a stale cached read is harmless. Instagram and Twitter tolerate a feed that's a few seconds behind. WhatsApp orders messages *per conversation* but never has to merge two people typing into the **same word**. Even Dropbox (5.8), the closest cousin, ducks it: when two devices edit the same file, Dropbox keeps **both** as a "conflicted copy" and lets a human sort it out, that is a legitimate answer precisely because file sync can punt. A collaborative editor **cannot punt.** When Alice and Bob both type into the same sentence at the same instant, there is no "conflicted copy of paragraph 3", there is one document, on both screens, and it must **converge to a single state both users see, with no keystroke silently lost and no screen showing a different sentence than the other.** That is the crux, and it is a different *class* of problem: not "tolerate staleness" but "guarantee that independent, concurrent, intention-carrying edits merge deterministically into one shared truth." Hold that picture, *one document, many cursors, zero lost keystrokes, both screens identical*, because it is the requirement that makes or breaks the whole design, and it is the one you will be tempted to wave away.

---

## §A: The capstone problem (your brief)

You are designing a **real-time collaborative document editor**, think Google Docs, Notion, or Figma's text layer, where multiple authenticated users edit the same rich-text document simultaneously and see each other's changes within a fraction of a second.

This section frames the problem. It deliberately does **not** solve it. The clarifying questions, the requirement cuts, the numbers, the store choice, the convergence strategy, all of that is **yours to produce** in §B. Treat the brief the way you'd treat an interviewer's opening sentence: the start of a negotiation about scope, not a spec to implement.

**The product, in one paragraph.** A user opens a document in a browser and starts typing. Anyone else with access who has the document open sees those keystrokes appear in near-real-time, character by character, with the other person's **cursor and selection** visible and labelled. Multiple people edit the same paragraph at once and the document stays coherent, no lost edits, no diverged copies, no "your version / their version." A user can go **offline** (laptop lid closes, train enters a tunnel), keep editing locally, and on reconnect their changes **merge** cleanly with everything that happened while they were gone. The full document is **persistent**, **versioned** (you can see history and restore), and loads quickly even when it's large and has a long edit history.

**Functional surface to consider (you decide what's core vs stretch, that cut is part of the exercise):**
- Open / create / load a document; render its current state fast.
- Apply local edits and **propagate** them to all other active editors with sub-second latency.
- **Converge** concurrent edits from multiple users into one consistent document state.
- **Presence**: show who is in the document, where their cursor is, what they have selected.
- **Offline edit + reconnect merge.**
- **Persistence + version history** (snapshots, restore, "see changes since…").
- *(Likely stretch, name and park them):* comments/suggestions mode, access control / sharing model, rich media embeds, full-text search across a user's docs, export.

**Non-functional pressure (this is where the design is won or lost):**
- **Edit-propagation latency**, local echo must feel instant; remote edits should appear in **well under ~200 ms** for editors in the same region. A laggy collaborative editor is a broken product.
- **Convergence correctness**, *the* hard requirement. All replicas of a document **must** reach the same final state given the same set of edits, regardless of arrival order or network delay. No lost keystrokes; no two screens showing different text. This is a **correctness invariant**, not a nice-to-have.
- **Concurrency profile**, a document has **many viewers but few simultaneous editors**; you should *cap* concurrent editors per doc (Google Docs historically capped around the low hundreds) and design for the common case of **single-digit-to-tens** of active editors.
- **Availability & durability**, never lose a committed edit; the document must survive node/region loss; aim high (≥ 99.9% on the editing path) but be honest that the *editing session* (the live socket) is more fragile than the *stored document*.
- **Offline tolerance**, edits made while disconnected must survive and merge on reconnect, possibly **minutes or hours** later.
- **Scale**, assume a large consumer product: on the order of **100M+ documents**, **tens of millions of DAU**, millions of documents open concurrently, with the editor count *per document* small but the *connection* count huge.

**Constraints and assumptions to pin down yourself (don't proceed until you've stated them):** rich text or plain text for v1? hard cap on concurrent editors per doc? acceptable staleness for *presence* (cursors) vs for *content* (they are not the same)? is the document a single shared object or can it be sharded into sub-trees? what's the latency budget split between *local echo* (should be ~0, optimistic) and *remote apply*? These are the questions whose answers *make* the design, which is exactly why the brief leaves them open.

---

## §B: Self-driving guide: what to produce at each RESHADED step

This is your scaffold, not your solution. For each of the eight steps it tells you **what the step is for**, the **artifact to produce**, and the **specific numbers or decisions** that must appear in your answer. Produce all eight before you read §C. Resist the urge to look for "the right answer", the exercise is the act of deriving and defending one. Keep it at **Director altitude**: components and trade-offs, not algorithm pseudocode.

**R: Requirements.** *Produce:* a crisp split of **functional vs non-functional**, an explicit **scope cut** (what's v1, what's parked), and, the load-bearing move here, a clear statement of the **two distinct traffic classes** you've noticed: high-volume, loss-tolerant **presence/cursor** updates vs lower-volume, loss-**intolerant** **content edits**. State your **concurrent-editors-per-doc cap** and the **read(view):write(edit)** shape. *The number that must appear:* an order-of-magnitude DAU and document count, and the assertion that editors-per-doc is *tens*, viewers-per-doc can be *thousands*.

**E: Estimation.** *Produce:* back-of-envelope math that proves you understand where the load actually is. *Compute, with stated assumptions:* (1) **edit ops/sec per active document**, a fast typist is ~6-8 keystrokes/s; with batching/coalescing the *committed* op rate is lower; (2) **presence messages/sec per document**, cursor-move + selection events, which fire *far more often* than content edits and, multiplied by N editors fanned out to N editors, scale as **~N²** per doc; (3) **concurrent open documents** and total **live socket connections** (this is your big number, millions of mostly-idle WebSockets); (4) **op-log storage per document per year** and total, plus **snapshot** size/cadence; (5) a rough **edit-fan-out server count**. *The insight the math must surface:* presence traffic ≫ edit traffic, and idle-connection count ≫ active-edit rate, two different scaling problems, sized separately.

**S: Storage.** *Produce:* a decision on what persists and in which store, justified by access pattern. *Must address:* the **op-log** (the ordered sequence of edits, append-heavy, replay-by-doc), periodic **snapshots** (so you don't replay millions of ops on load), and **document metadata** (owner, ACL, title, cursor of last snapshot). Name real stores and **reject at least one alternative on the access pattern** (e.g., why not store only the latest blob and lose history; why not a relational row per character). *Decision to make explicit:* op-log + snapshot vs last-state-only, and where each lives.

**H: High-level design.** *Produce:* a component/box diagram and the **two happy paths** (an edit round-trip; a presence round-trip), plus, unavoidable here, your stance on the **pivotal call**: how edits **converge**. Name the contenders (**central-server ordering / OT** vs **CRDT** vs naive last-write-wins) and pick one *with* a reason tied to a requirement. *Must show:* where the live edit session lives (a stateful **collaboration/session server** that owns a document's active editors), how a document is **routed** to exactly one such server (so there's a single ordering authority), and how presence is fanned out on a **separate, cheaper path** than content.

**A: API design.** *Produce:* the contract. *Must include:* the **WebSocket message protocol** (this is mostly a streaming/bidirectional problem, not request/response), message types for `edit op`, `ack`, `presence/cursor`, `join/leave`, `sync-since(version)`; plus a small REST surface for `create/load document`, `fetch snapshot+ops since v`, `list versions/restore`. *Decisions to voice:* how an op is **acknowledged and versioned** (server-assigned sequence number?), and how a reconnecting client says "give me everything since version V."

**D: Data model.** *Produce:* the schema and, critically, the **shard key**. *Must specify:* the op-log table keyed and **partitioned by `document_id`** (so all ops for one doc are co-located and ordered), the snapshot record, the metadata record, and how **version/sequence numbers** are assigned per document. *The load-bearing decision:* `document_id` as the partition key, and why a single document's traffic landing on one partition/one session server is a feature (single ordering authority) and also your hot-spot risk (a viral doc). State how you'd handle the hot document.

**E: Evaluation.** *Produce:* you turn on your own design and hunt bottlenecks, **naming the trade-off of each fix.** *Must stress, at minimum:* (1) **convergence under concurrency and reordering**, does your chosen scheme actually guarantee identical final state? (2) the **stateful session server as a single point of failure** for an active doc, what happens when it dies mid-session; (3) the **hot document** (a company all-hands doc with hundreds in it) against your editor cap; (4) **offline-for-hours then reconnect**, does the merge still converge, and how big is the catch-up; (5) **presence storms** (N² fan-out) overwhelming the content path. *For each:* the fix **and** what it costs.

**D: Design evolution.** *Produce:* how it holds at 10×, the hardest trade-offs named, and **where you'd delegate.** *Must include:* the explicit **OT-vs-CRDT** trade as the central hard call (latency/server-authority and a mature ecosystem vs offline-friendliness/decentralization and per-character metadata bloat), a stance on **using a proven library** (Yjs/Automerge/ShareDB) vs building, geographic scaling of a *stateful* edit session, and a credible **delegation** of the convergence-correctness proof with a *stated prior*. *The Director sentence to land:* what you own (the architecture and the pivotal call) vs what you hand to a specialist (the merge-algorithm correctness), and why.

> **Before you read §C:** write all eight artifacts down. Even rough. The critique only works on a real first-pass design, and the gap between what you produced and what §C probes for is precisely the thing you came here to find.

---

## §C: The critique framework (the spine of this lesson)

This is the core of the capstone. For **each** RESHADED step, here are the questions to self-ask, or paste your design into an AI and have it ask you these *verbatim*, with the markers that separate a **strong signal** (Director altitude) from a **red flag**. Score yourself honestly at each step. Every strong-signal marker below carries either a **number** or a **named trade-off**; if your answer has neither, it is itself a red flag.

A note on this problem's signature trap, because it governs half the markers below. The convergence machinery (OT transforms, CRDT tombstones) is **IC-deep**, and the rubric is two-sided on purpose: you can fail by going **too high** ("just use CRDTs, they merge", no awareness of metadata cost or the OT alternative) *or* **too deep** (whiteboarding tombstone garbage collection and transformation functions while the interviewer waits for an architecture). The Director answer lives between: *name the pivotal call, tie it to a requirement, state a prior, and delegate the proof.*

### R: Requirements

| Self-ask | Strong signal | Red flag |
|---|---|---|
| Did I separate the two traffic classes? | Explicitly names **presence/cursor (high-volume, loss-tolerant)** vs **content edits (lower-volume, loss-intolerant)** and says they get different paths and different consistency. | One undifferentiated "real-time updates" stream; treats a dropped cursor-move as seriously as a dropped keystroke. |
| Did I cap concurrency and state the read shape? | Caps concurrent **editors/doc at tens-low-hundreds**, notes **viewers ≫ editors**, and uses the cap to bound fan-out cost. | "Unlimited simultaneous editors"; no cap, so fan-out and convergence cost are unbounded and unestimable. |
| Did I cut scope deliberately? | v1 = open/edit/propagate/converge/persist + presence; **comments, ACL model, media, search explicitly parked** with a reason. | Tries to design comments, suggestions, sharing, and search in v1; drowns before the crux. |
| Did I name convergence as *the* hard NFR? | Calls out **deterministic convergence / no lost keystrokes** as a correctness invariant up front. | Lists "low latency, high availability" generically; never names convergence as the defining requirement. |

### E: Estimation

| Self-ask | Strong signal | Red flag |
|---|---|---|
| Where is the load actually? | Shows **presence msgs/s ≫ edit ops/s** (cursor events fire constantly; N editors × N = ~N² fan-out per doc) and **idle-socket count ≫ commit rate**, sizes them separately. | One blended QPS number; never notices presence dwarfs edits or that the big number is *idle connections*, not writes. |
| Did I quantify the edit rate sanely? | Typist ≈ 6-8 keys/s, **coalesced/batched** so committed ops/s is lower; multiplies by realistic concurrent editors, not viewers. | Assumes thousands of edits/s per doc (confuses viewers with editors); or no number at all, "it's real-time." |
| Did I size the durable footprint? | Estimates **op-log bytes/doc/yr + snapshot size/cadence**, and notes ops are tiny but unbounded → **snapshots bound replay**. | Forgets the op-log grows forever; plans to replay millions of ops on every document open. |
| Did the numbers pick the architecture? | Concludes: cheap fat-fan-out **presence path** + smaller **durable edit path** + **snapshotting**, each justified by a figure. | Numbers computed but ignored; architecture chosen by taste, not by the math. |

### S: Storage

| Self-ask | Strong signal | Red flag |
|---|---|---|
| What's the source of truth, state or log? | **Op-log (append-only, ordered per doc) + periodic snapshots** is the source of truth; current state is derived; reject "store only the latest blob" because it kills history/undo/merge. | Stores only the latest document blob; no op history → no version history, no clean offline merge, no audit. |
| Did I match store to access pattern? | Op-log → append-friendly, replay-by-`document_id` (LSM/log-structured or an append store); metadata → KV/relational; **snapshots in blob store**. Names real systems, rejects "a relational row per character" on cost. | A row per character/keystroke in Postgres; or a single document store with no separation of log vs snapshot vs metadata. |
| Did I bound load-time cost? | Load = **latest snapshot + ops since snapshot**, with snapshot cadence chosen so the tail of ops to replay is small (e.g., snapshot every N ops / minutes). | Reconstructs from the full op-log every open; load time grows unbounded with document age. |

### H: High-level design

| Self-ask | Strong signal | Red flag |
|---|---|---|
| How do concurrent edits converge? (the pivotal call) | Names **OT vs CRDT vs naive LWW**, picks one **tied to a requirement** (e.g., central-server **OT** for server-authoritative low-latency in-session ordering; **CRDT** if offline-first/decentralized dominates), and states convergence is **eventual**, a doc needs convergence, **not linearizability**. | "Last write wins on the paragraph" (silently loses keystrokes); *or* "just use CRDTs, they merge" with no awareness of the OT alternative or the cost; *or* whiteboards an OT transform function (too deep). |
| Does each doc have a coherence point, and is its role correct for the chosen scheme? | **OT branch:** a doc routes to **one stateful session server** that assigns a **canonical order** to in-session ops, the ordering *is* the convergence mechanism. **CRDT branch:** the server is **not** an ordering authority (CRDTs merge regardless of order); it's a **relay for fan-out, persistence, and presence**, with at most a **display tie-break**. Either way, a doc has one coherence point. | Claims a "central ordering authority" while choosing CRDTs (contradicts the model, order-independence is *why* CRDTs converge); *or* no coherence point at all, so clients diverge or duplicate. |
| Is presence on a separate, cheaper path? | Presence/cursors fan out via a **separate pub/sub channel**, ephemeral, **never persisted**, lossy-OK, explicitly cheaper than the content path. | Presence runs through the same durable, acked path as edits → pays correctness cost for data that doesn't need it. |
| Is local echo optimistic? | Local keystrokes render **immediately** (optimistic), then reconcile with server order, so typing feels instant regardless of RTT. | Every keystroke round-trips to the server before rendering → typing feels laggy; product is broken. |

### A: API design

| Self-ask | Strong signal | Red flag |
|---|---|---|
| Right transport for the problem? | **WebSocket (bidirectional, persistent)** for the edit/presence stream; small REST surface for load/snapshot/version. Justifies why request/response is wrong for live edits. | Designs it as polling or per-keystroke REST POSTs; no persistent connection. |
| Are ops versioned and acked? | Each op gets a **server-assigned sequence/version**; client tracks "last acked version"; protocol supports **`sync-since(V)`** for reconnect. | Fire-and-forget ops with no version/ack; reconnecting client can't tell what it missed. |
| Is reconnect a first-class message? | Explicit **`join` → server returns snapshot + ops since the client's version**; clean catch-up path. | Reconnect re-downloads the whole doc, or has no defined catch-up → lost or duplicated ops. |

### D: Data model

| Self-ask | Strong signal | Red flag |
|---|---|---|
| What's the shard key? | **`document_id`** partitions the op-log and routes the session, all of a doc's ops are co-located and ordered; one doc = one ordering authority. | Shards by user, or by time → a single document's edits scatter across partitions and can't be ordered cheaply. |
| Is the single-doc concentration acknowledged as both feature and risk? | Notes co-locating a doc on one partition/server **enables ordering** but creates a **hot-doc** risk; has a mitigation for the viral doc. | Treats `document_id` partitioning as free; never notices the all-hands doc is a hot partition + hot session server. |
| How are version numbers assigned? | Monotonic **per-document sequence** assigned by the doc's session server / a per-doc counter, cheap because it's per-doc, not global. | Global monotonic sequence across all docs (needless coordination bottleneck), or no defined versioning. |

### E: Evaluation

| Self-ask | Strong signal | Red flag |
|---|---|---|
| Does convergence actually hold under reordering? | Argues *why* the chosen scheme converges (OT: server transforms ops against concurrent ones; CRDT: commutative merge) and **admits the limit** (e.g., OT's transform-correctness is hard → delegate/verify; CRDT carries per-element metadata that must be GC'd). | Asserts "it'll be consistent" with no mechanism; *or* dives into proving the transform at the whiteboard (wrong altitude). |
| What happens when the session server dies mid-edit? | The op-log is **durable before ack** (or quorum-replicated), so a new session server **reloads snapshot + ops and resumes**; in-flight unacked ops replay from clients; bounded reconnection blip named. | "It's stateful so we lose the session" with no recovery; or assumes the live in-memory state was the only copy → data loss. |
| Hot document / editor cap? | Enforces the **editor cap**, degrades extra users to **view-only/read replica**, and notes presence fan-out is the first thing to break (N²). | No cap; assumes one session server handles hundreds of editors + N² presence with no degradation plan. |
| Offline-for-hours reconnect? | Client buffers ops locally; on reconnect, **merge converges** (the whole reason CRDT/OT was chosen) and catch-up is bounded by snapshot + delta; names the worst case (huge divergence). | Assumes short disconnects only; long-offline merge either silently drops edits or isn't addressed. |
| Did every fix name its cost? | Each mitigation states the trade (e.g., "durable-before-ack adds write latency to the edit path, acceptable because we never lose a keystroke"). | Fixes listed with no trade-off; reads as a feature list, not engineering judgment. |

### D: Design evolution

| Self-ask | Strong signal | Red flag |
|---|---|---|
| Is OT-vs-CRDT named as the central hard trade? | States it crisply: **OT** = server-authoritative, lower per-op metadata, mature for text, but transform logic is intricate and needs the central order; **CRDT** = offline-/P2P-friendly, commutative merge, but **per-character metadata/tombstone bloat** and GC cost. Picks per requirement. | Picks one as "obviously better" with no trade; or can't articulate why both exist. |
| Build vs buy? | Leans on **Yjs / Automerge / ShareDB** with a **stated prior** ("CRDT via Yjs for offline-first; I'd benchmark doc-size overhead") rather than hand-rolling convergence, and owns *that's a delegation, not a cop-out.* | Insists on hand-building the CRDT/OT engine from scratch at a Director level (wrong altitude, ignores mature ecosystem). |
| Geographic scale of a *stateful* session? | Acknowledges the live session is **stateful and single-authority**, so you pin a doc's session to **one region** (the editors are usually co-located) and replicate the **durable log** cross-region for survivability, names the latency-vs-survivability trade. | "Put it behind a global load balancer", ignores that a single ordering authority can't be naively multi-region. |
| Where do I delegate, with a prior? | Owns the **architecture + the OT/CRDT call**; **delegates the merge-correctness proof / library hardening** to a specialist with a stated prior, the explicit Director move. | Either personally tunes the transform function, or hand-waves the hardest correctness problem with no owner. |

---

## §D: One worked critique excerpt (the loop in action)

One pass through the loop, on the pivotal step (**H: High-level design**, the convergence call), to show the *shape* of the self-critique. Run this same first-pass → probe → red-flag → revise cycle at every step above.

**Your first-pass answer (H step):**
> *"For convergence I'll use CRDTs, each client holds a CRDT replica of the document, edits are applied locally and broadcast to the others, and because CRDT operations are commutative they all merge to the same state automatically. No central coordination needed, which is great for offline too."*

**Self-ask (from the §C / H rubric, verbatim):** *"How do concurrent edits converge, and what does your chosen scheme cost? Name the alternative you rejected and why."*

**The red flag, spotted:** This is the **"just use CRDTs, they merge" too-high** failure the rubric warns about. It's not *wrong*, CRDTs do converge, but as stated it shows no awareness of (a) the **alternative** (OT, which is what Google Docs actually used, and why a central server changes the calculus), (b) the **cost** (CRDTs carry per-character metadata, unique IDs and tombstones for deleted characters, that inflates document size and demands garbage collection), or (c) the **trade** that picks one over the other. An interviewer hears "I read that CRDTs are magic," not "I made an engineering decision." It would also quietly drop the **single-ordering-authority** benefit a central session server gives you for in-region, online editing, the common case.

**The revised answer (Director altitude):**
> *"The pivotal call is how concurrent edits converge, and there are two real contenders. **OT (operational transform)** routes every op through a **central session server** that transforms it against concurrent ops and assigns a canonical order, lower per-op metadata, battle-tested for text (Google Docs's lineage), and it gives me a single ordering authority for free, which suits the common case: a handful of editors, online, in one region. Its cost is that the transform logic is intricate and historically bug-prone, a correctness risk I'd **delegate to a specialist and verify against a proven implementation**, not hand-roll. **CRDTs** converge by commutative merge with no central authority, which is strictly better for **offline-first and P2P**, but they pay **per-character metadata and tombstones** that bloat the document and need GC. My prior: since my requirements demand robust **offline merge**, I'd lean **CRDT via a mature library like Yjs or Automerge**, and I'd benchmark the metadata overhead on large documents before committing, but I'd still front it with a **session/relay server** per document. To be precise about that server's job: it is **not** an ordering authority, a CRDT converges *regardless* of the order ops arrive in, which is the whole point, it's there for **fan-out, durability (persisting the op-log / snapshots), and presence**, with at most a display tie-break. That's exactly why the server is optional for *correctness* and required for *operability*. The guarantee I'm buying is **eventual convergence**, not linearizability, a document doesn't need linearizability, and paying for it would wreck latency. The one thing I will **not** do at this altitude is whiteboard the transform function or the tombstone-GC policy; that's the deep-dive I'd own the *decision* on and delegate the *implementation* of."*

Notice what the revision added: the **rejected alternative** (OT) with its reason, the **cost** of the chosen path (metadata bloat), a **stated prior** with a benchmark gate, the correct **guarantee** (eventual convergence, not linearizability), and an explicit **delegation** of the IC-deep part. Same step, same problem, the difference between the two answers is the entire offer. That delta is what the loop exists to surface.

---

## Key takeaways
- **The capstone is the loop, not the answer.** Drive RESHADED end-to-end yourself, then turn the §C rubric on your own design, *"where would a Staff interviewer push, and would my answer survive it?"* That self-critique reflex is the most transferable thing here.
- **This problem's crux is convergence**, and it's a harder *class* than anything in Module 5: every prior problem tolerated staleness or a conflicted-copy; a collaborative editor must merge concurrent intention-carrying edits into **one state both screens show, zero lost keystrokes.** Name it as the defining requirement or you've already failed the R step.
- **Let the numbers separate two systems**: presence/cursor traffic (high-volume, ~N² fan-out, loss-tolerant, *never persisted*) vs content edits (lower-volume, durable, acked, versioned), plus a huge **idle-connection** count that dwarfs the commit rate. Size them apart; route them apart.
- **The signature altitude trap is two-sided.** Too high = "just use CRDTs, they merge" (no cost, no alternative). Too deep = whiteboarding the OT transform or tombstone GC. The Director answer: **op-log + snapshot**, a **single per-doc ordering authority**, OT-vs-CRDT named as the pivotal trade, **eventual convergence** (not linearizability) as the guarantee, and the merge-correctness proof **delegated with a stated prior** (lean on Yjs/Automerge/ShareDB).
- **Every strong-signal marker carries a number or a named trade-off**, and so must yours. An answer with neither is a red flag in your own framework. That is the bar you're now able to hold yourself to without an answer key.

> **Spaced-repetition recap:** Capstone = **you drive, you critique.** Problem: real-time collaborative editor, the one crux Module 5 never forced is **deterministic convergence of concurrent edits** (one doc, many cursors, zero lost keystrokes, both screens identical). Numbers split **presence (≫ volume, ~N², lossy, ephemeral)** from **edits (durable, acked, versioned)**, with **idle sockets ≫ commits**. Storage = **op-log + snapshots**, shard by **`document_id`** (one ordering authority, hot-doc risk). Pivotal call = **OT vs CRDT**, pick per requirement (offline → CRDT/Yjs; server-authoritative low-latency → OT), guarantee is **eventual convergence, not linearizability**, and you **delegate the merge proof with a prior**. Trap is two-sided: not "CRDTs just merge" (too high), not whiteboarding the transform (too deep). Run the §C rubric on your own design until the gaps close.

---

*End of Module 6, Lesson 6.1. This capstone closes the course: Modules 1-3 built the vocabulary and the building blocks, Module 4 taught the RESHADED method, Module 5 ran it on sixteen problems, and Module 6 hands the method back to you, to drive, and to critique. The rubric pattern here (strong-signal vs red-flag, keyed to RESHADED) is the same lens to apply to any problem you meet in the room.*
