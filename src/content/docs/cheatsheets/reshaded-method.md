---
title: "RESHADED Method Cheat Sheet"
description: "Drive any problem through the 8 RESHADED steps, the question each answers and the signal it sends, illustrated by TinyURL."
sidebar:
  order: 0
---

### One page. The method, not the problem. Print this.

**RESHADED = R·E·S·H·A·D·E·D**, *Requirements, Estimation, Storage, High-level, API, Data model, Evaluation, Design evolution.* It is a **sequence, not a checklist**, run it in order until automatic. Note the **duplicate letters**: two **E**'s (Estimation #2, **Evaluation** #7) and two **D**'s (Data model #6, **Design evolution** #8). **Signal concentrates in the back-end E (#7) and D (#8), the *boxes* are table stakes.**

---

## The spine: one row per step

| # | Step | Question to answer (any problem) | Signal sent | TinyURL, the call you make |
|---|---|---|---|---|
| 1 | **R** Requirements | What are we building, for whom? Functional vs non-functional; what's *out* of scope? | **scope before build** | Core = **shorten + redirect**. Park alias/expiry/analytics as stretch. State **100:1 read-skew**, p99 < 100 ms, 99.99% reads. |
| 2 | **E** Estimation | How big, in numbers? QPS (R & W), storage, bandwidth, cache set, servers? | **reason in numbers** | **~40 w/s, ~4k r/s**; **~9 TB**; **~50 GB** hot set. Numbers say *cache-first, don't touch the write path*. |
| 3 | **S** Storage | What persists, and which store matches the access pattern? | **match data to store** | Access = **single-key point lookup** → **KV / wide-column (DynamoDB / Cassandra)**. Redis fronts it. |
| 4 | **H** High-level design | What are the components and the happy path (write & read)? | **think in components** | LB → stateless app → **Redis (read-through)** → KV. Code-gen *off* write path; analytics *off* read path. |
| 5 | **A** API design | What are the endpoints, signatures, and **status codes**? | **define interfaces** | `POST /api/v1/urls` → 201. **`GET /{code}` → 301/302** (bare root, the path *is* the code). |
| 6 | **D** Data model | Schema, keys, and, critically, the **shard key** (where rows live)? | **know where data lives** | `code → long_url`; **partition key = hashed `code`** → every lookup hits one partition. Expiry via TTL attribute. |
| 7 | **E** Evaluation | What breaks first? Re-check NFRs; hunt hot keys, SPOFs, tail, abuse, **fix + name the trade-off**. | **stress your own design** | Hot key (cache replicate) · **KGS SPOF** (pre-alloc ranges) · cold-cache herd (single-flight) · **301-vs-302** · open-redirect abuse. |
| 8 | **D** Design evolution | How does it hold at 10×? Hardest trade-off? Where do you **delegate**? | **think past v1** | Push reads to **edge/CDN**; **partition code namespace by region** for global uniqueness. Delegate Dynamo-vs-Cassandra benchmark w/ a prior. |

**Altitude rule per step:** *"Does the decision turn on this detail?"* → Yes: go 1-2 levels deep. No: state a default, **delegate with a stated prior**. Spending the round on boxes (H/A) and skimming Evaluation/Evolution = operating below level.

---

## TinyURL: numbers to know (the estimation chain)

> Intuition: a **write-once, read-a-million dictionary**, one writer puts a word in, a crowd looks it up.

| Quantity | Math | Result |
|---|---|---|
| **Write QPS** | 100M/mo ÷ 2.6M s | **~40 w/s** (~80-100 peak), *trivial; don't over-engineer writes* |
| **Read QPS** | 40 × **100:1** | **~4k r/s** (~8-10k peak), *the architectural point* |
| **Storage** | 6B mappings (100M×12×5yr) × ~500 B × **3× repl** | 3 TB → **~9 TB**, *shard lightly, nothing exotic* |
| **Bandwidth** | 4k r/s × ~500 B | ~2 MB/s, **negligible** (vs video, where egress is *the* constraint) |
| **Cache set** | ~100M hot × ~512 B (80/20 skew) | **~50 GB**, *fits in RAM cheaply → caching is the lever* |
| **Code space** | **base62**, **7 chars** = 62⁷ | **~3.5 trillion** → **~590× headroom** / ~3,000 yr (6 = 56B tighter; 8 = needless) |
| **App nodes** | ~10k peak ÷ ~2k/node, ×2 for HA | **~10-12** stateless nodes |

**The numbers *decide*:** writes trivial · reads 100× & latency-bound (cache) · ~9 TB (light shard) · hot set in RAM (cache = highest leverage). Taste decided nothing.

---

## Pivotal trade-offs (name the rejected alternative + why)

| Decision | A | B | C | Use when… |
|---|---|---|---|---|
| **Short-code generation** | **Counter + base62 via KGS**, unique *by construction*, **no read-before-write**; ranges kill SPOF | **Hash(URL) + truncate + collision-check** | **Random base62 + collision-check** | **A** when writes must stay cheap (our case) · **B** when you *want* identical-URL dedup & can pay a read-per-write · **C** rarely, collision cost without B's upside |
| **Primary store** | **KV / wide-column** (DynamoDB, Cassandra) | **Relational** (Postgres + read replicas) | **Document / graph** | **A** at billions-scale point lookups (our case) · **B** at thousands-scale or needing txns/SQL (the *boring* right choice for internal tools) · **C** ~never, no relationships/nesting |
| **Redirect status code** | **301 Moved Permanently**, browser-caches, cheap/fast, **blinds analytics + freezes target** | **302 Found**, always hits server, full read load, **keeps analytics + revocation** |, | **301** when cost/scale dominates & links are fire-and-forget · **302** when analytics or repoint/revoke is a requirement (Bitly-style). *Picking one silently is the red flag.* |
| **Dedup same URL?** | **No** (default), distinct codes, write path clean | **Opt-in**, secondary `url→code` index, consulted only on request |, | Default **No**: read-before-write on every create is the cost the design exists to avoid; code space is the cheap side. |
| **Shard key** | **Hashed `code`**, even load, single-partition lookups | **`created_at` (time-range)**, cheap range-drop of old links |, | **Hashed `code`** always here; time-key creates a **hot shard** (new writes *and* hot reads on one bucket). Expire via **TTL attribute**. |

---

## Director moves (run these every step)

- **Tie every call to a requirement**, the R and E steps are the anchor ("100:1 skew ⇒ cache-first").
- **Always quantify**, show the math; "it scales" is banned.
- **Name the cost / operational / abuse dimension**, Directors own budget and on-call. (~9 TB + ~50 GB cache + ~10 nodes = *cheap*.)
- **Stress your own design**, volunteer the hot key, the SPOF, the tail, the abuse surface, *and the trade-off each fix makes.*
- **Delegate the deep-dive with a stated prior**, "storage team benchmarks **DynamoDB vs Cassandra**; my prior is managed Dynamo to cut on-call." Own the spine, hand off the tuning.

---

## What interviewers probe (Director altitude)

- ✅ **Counter-KGS over hashing**, unique by construction, **no read-before-write**; ranges remove SPOF/throughput ceiling. 🚩 "MD5 it" with no collision-check read or birthday awareness.
- ✅ **301-vs-302** named as **analytics/revocation vs cost/latency**, tied to a requirement. 🚩 picks one blind to the analytics/freeze cost.
- ✅ **Finds the SPOF** (KGS) and the **hot key**, fixes each *naming the trade-off*. 🚩 "stateless so it scales," finds no SPOF.
- ✅ **Cost + delegation** instinct (cheap; benchmark delegated with a prior). 🚩 no cost sense, insists on tuning the store personally.
- ✅ **Global / 10×:** reads to the **edge**, **partition code namespace by region** for uniqueness w/o coordination. 🚩 "add more servers."

## Common mistakes
Over-engineering the **~40 w/s** write path · hashing the URL and **forgetting the collision-check read** · treating **301-vs-302** as a default not a trade · **sharding by `created_at`** (hot shard) · ignoring **open-redirect abuse** (rate-limit creates + URL-scan) · putting **analytics on the redirect critical path** (belongs on an async queue) · reaching for relational **by reflex** (zero value from joins, pay in scaling pain).

> **Recap:** RESHADED in order, signal lives in **E#7 (Evaluation)** and **D#8 (Evolution)**, not the boxes. TinyURL = read-once-write-a-million dictionary, **100:1**; numbers drive it (**~40 w/s, ~4k r/s, ~9 TB, ~50 GB cache, 62⁷ codes / 7 chars**). Crux = **counter+base62 via KGS** (unique by construction, no collision check; ranges kill SPOF) over hash-and-check. **Cache** absorbs skew (mappings immutable); shard by **hashed `code`**. Stress: hot key, KGS SPOF, **301 (cheap, blind) vs 302 (costly, trackable)**, open-redirect abuse. Director: tie to requirements, name cost, delegate the benchmarks.
