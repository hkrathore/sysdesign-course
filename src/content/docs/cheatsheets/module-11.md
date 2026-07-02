---
title: "Module 11 - Client & Mobile Cheat Sheet"
description: "The client as a first-class, frequently-partitioned design surface — decision → trade-off → the number — plus the recurring laws and the Director through-line. Skimmable in 5 minutes."
sidebar:
  order: 11
---

### 6 blocks. Each = the decision → the trade-off → the number. Skimmable in 5 minutes.

> The reflex to build: the client is **not a thin window on the server** — it's a first-class node that is **frequently partitioned** from the origin. Decide **how much intelligence lives on the device** first (offline capability and perceived latency vs update-latency and consistency), and remember the client ships under an **API-compatibility-forever** discipline the server never has.

---

## Recurring laws (every block leans on these)

- **The client is a partitioned node.** Treat disconnection as the normal case, not the error case — CAP reasoning applies at the edge.
- **You cannot hotfix a client.** App-store review is days and old versions linger for months → the client-server contract stays backward-compatible forever, plus a kill-switch / forced-update path.
- **Perceived latency beats wall-clock latency.** Optimistic UI, cache-first render, and prefetch are the levers; each trades a rollback or staleness risk.
- **Device resources are finite line items.** Battery, cellular data, and memory are budgets you design and enforce, not afterthoughts — radio wake is the expensive part.
- **Push is best-effort.** Platform push is unordered, size-limited, and lossy → it's a *wake-up hint*, and the client fetches the truth from the server.

---

## Client-Side Architecture for System Designers *(framing)*
The decision: **thin client** (server-authoritative, renders only — simple, hotfixable, always-consistent, but useless offline and a round trip per action) vs **thick client** (logic/state/cache on device — offline-capable, instant perceived latency, but harder to update, conflict-prone, larger attack surface). Five constraints the server never has: **intermittent / high-variance network** (mobile RTT **50–300 ms**), **device CPU/memory/battery/data** budgets, **app-store release latency** (ship in days, old versions linger months), **heterogeneous OS versions** live at once, **cold start** (~**1–2 s** budget). **Director move:** client placement is a product-latency and retention call; own it, and hold the API-compatibility-forever line. *Rejected:* the client as a render layer with no offline or release-latency story.

## Offline-First & Local-First Data Sync
The **local store is the UI's source of truth**; the network is an enhancement. Mechanics: a local DB (**SQLite / IndexedDB / Realm / Core Data**), **change tracking** (per-record version + **tombstones** for deletes, since you can't sync a delete by absence), a **sync cursor/watermark** (pull only deltas since last sync, not the whole dataset), an **outbound mutation queue** with client-generated **op-ids** (at-least-once → dedupe so a resend doesn't double-apply), and background sync on reconnect/foreground. Partial vs full replication: sync the working set; a large account's **cold sync (GBs)** must page and prioritize. *Trade:* aggressive sync is fresh but drains battery/data; lazy sync is cheap but stale. *Rejected:* an online-only client that spinners on every action and dies without signal.

## Conflict Resolution on the Client
Concurrent offline edits mean the server can't impose one order → pick a **convergence strategy**. **LWW** (highest timestamp; O(1) but silently loses the other edit, clock-skew-sensitive — fine for independent scalar fields). **Server-authoritative / optimistic concurrency** (version check → reject + rebase; strong, but needs connectivity and thrashes under contention — for money/inventory/bookings). **OT** (transform ops so they commute; powers **Google Docs**; intent-preserving for text but hard to get right and usually needs a central server). **CRDTs** (converge without coordination; **Figma / Yjs / Automerge**; peer-to-peer + offline, but pay **metadata + tombstone growth** — compact or memory balloons). *Rejected:* LWW on a shared document (data loss); CRDTs treated as free magic.

## Mobile Push & Real-Time Delivery at Scale
Two families: **platform push** (**APNs / FCM / WebPush** — the OS holds one battery-efficient connection, best-effort) vs **your own persistent connection** (**WebSocket / MQTT** — low-latency, bidirectional, but *you* own millions of sockets). The load-bearing principle: platform push is **best-effort, unordered, size-limited** → treat it as a **wake-up hint** ("come sync"), and the client fetches the truth from the server, so drops/dupes/reorders can't corrupt state. **Token lifecycle**: tokens rotate — prune dead ones or waste spend and hurt deliverability. Persistent-connection scale: **C10M** (socket memory ~tens–hundreds of KB each), connection gateways, shard by user, **heartbeats** (~**15–300 s**, traded against battery), presence. *Rejected:* putting the important payload in the push and assuming it arrives; a persistent socket for a daily digest.

## Client Performance, Caching & Resource Budgets
**Perceived latency is the product metric:** optimistic UI, skeleton screens, **cache-first render**, prefetch the likely-next. Client **cache tiers** (memory / disk / HTTP `ETag` / image) with explicit invalidation — the "second copy of the truth" problem, restated on the device. **Cold start / TTI** budget (~**1–2 s**) via lazy load + code splitting. Resource budgets as first-class line items: **battery** (batch network, coalesce wakeups — radio wake is the cost), **data** (adaptive image quality by network), **memory** (downsample a 12 MP image shown at 400 px ≈ **30× waste**; **list virtualization** → ~20 view objects for a 10k-row list). Modern codecs (**WebP/AVIF ~25–50%** smaller than JPEG). **Director move:** perf is a retention/revenue lever — enforce budgets in CI. *Rejected:* "optimize later"; full-res images; unbounded lists.

## Web & Frontend Architecture at Scale
Pick **rendering by requirement, not fashion**: **CSR** (cheap servers, slow first paint, poor SEO) · **SSR** (fast paint + SEO, server cost + TTFB) · **SSG** (fastest + cacheable, stale) · **ISR** (static speed + periodic freshness) · **streaming SSR / RSC / edge** (ship less JS). **Core Web Vitals** are the contract: **LCP < 2.5 s, INP < 200 ms, CLS < 0.1**. **BFF** = one tailored round trip per client (another service to own). **Micro-frontends + Module Federation** = independent deploy for **N teams** — the payoff is team autonomy, the risk is the **distributed-monolith-of-the-frontend** (shared-state coupling, duplicated bundles); *not* for a single small team. **Design system** as the shared platform/golden path. *Rejected:* rendering by fashion; micro-frontends before the org justifies them.

---

*Design problem — 11.7 (offline-first mobile app):* runs the full RESHADED spine weighted to **Evaluation** (conflict cases when two devices edit offline, sync storms when many clients reconnect after an outage, large-account cold sync, battery budget) and **Design evolution** (collaborative editing via CRDT, selective/partial sync, end-to-end encryption).

## Director through-line (all 6)
Decide the **intelligence-on-the-device** placement from the product's offline and latency needs, not reflex · every choice names the **rejected alternative and its cost** (a round trip, a rollback, lost battery/data, a distributed-monolith frontend) and **quantifies** the dropped side (RTT ms, TTI budget, socket memory, Core Web Vitals, image savings) · **own the client as a product/retention surface** and the **API-compatibility-forever** discipline, and delegate the framework internals with a prior ("I'd have the mobile team benchmark SQLite vs Realm; my prior is SQLite for the sync log") · always carry the release-latency, battery, and data-cost dimension.

> **Spaced-repetition recap:** The client is a **first-class, frequently-partitioned node**, not a render layer — decide **thin vs thick** (how much intelligence on the device) against five constraints the server never has (network, device budgets, **release latency**, version spread, cold start). **Offline-first**: local store is the truth, sync **deltas by cursor** with **tombstones** and an **idempotent mutation queue**. **Conflicts**: LWW (scalars) / server-authoritative (money) / OT (Docs) / **CRDT** (collaborative + offline, watch tombstone growth). **Push is a wake-up hint** (best-effort) — fetch truth from the server; persistent sockets are the **C10M** problem. **Perf is a budget** (perceived latency, cache tiers, battery/data/memory) enforced in CI. **Web**: pick rendering (CSR/SSR/SSG/ISR/edge) by requirement, hold **Core Web Vitals**, and treat micro-frontends as an org decision with a distributed-monolith risk.
