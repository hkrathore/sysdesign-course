---
title: "Module 12 - Multi-Tenancy & SaaS Cheat Sheet"
description: "Serving many customers on shared infrastructure — the isolation-vs-efficiency spectrum, decision → trade-off → the number — plus the recurring laws and the Director through-line. Skimmable in 5 minutes."
sidebar:
  order: 12
---

### 4 blocks. Each = the decision → the trade-off → the number. Skimmable in 5 minutes.

> The reflex to build: tenancy is a **first-class design axis**, not a `tenant_id` column bolted on late. Place the system on the **silo → bridge → pool** spectrum by weighing **isolation** (no cross-tenant leak, blast radius, noisy-neighbor, compliance, per-tenant restore) against **efficiency** (cost, ops, density), and remember **cross-tenant data leakage is worse than downtime.**

---

## Recurring laws (every block leans on these)

- **Isolation vs efficiency is the master trade.** Every tenancy decision, at every layer, is a point on the silo→pool axis — name what you gave up (isolation or density).
- **Cross-tenant leakage is the existential bug.** One tenant seeing another's data ends the deal (and often the company) — enforce tenant scope in depth, at multiple layers.
- **Tenant load is a power law.** The top 1% of tenants drive **40–60%** of volume and a whale can be **100–1,000× the median** → capacity and fairness are set by the giants, not the average.
- **Tenancy threads through every layer.** Data, compute, network, identity, rate-limiting, observability, and billing are all tenant-aware — the tenant context propagates on every hop.
- **The tenancy model is a business decision.** Per-tenant COGS, gross margin, and which tier gates which enterprise deal — not merely a technical choice.

---

## Multi-Tenancy for System Designers *(framing)*
Many independent customers on one shared system, each seeing only their own data/config. The **isolation spectrum** is the whole track's spine: **silo** (dedicated stack per tenant — strongest isolation, worst economics, caps at ~**hundreds** of tenants) → **bridge** (share some layers, isolate others) → **pool** (shared everything + a `tenant_id` discriminator — best density/margin, scales to **tens of thousands**, but tenants contend for finite resources). Most SaaS is **pooled with a few siloed whales.** The recurring trade: **isolation** (security, blast radius, noisy-neighbor, compliance/residency, customization, per-tenant restore) vs **efficiency** (cost, ops, density). **Director move:** own the density-vs-isolation call with **unit economics** and treat isolation/residency as sellable enterprise features. *Rejected:* a bolt-on `tenant_id` with no isolation posture or margin math.

## Tenant Isolation Models
**Data**, the crux: **database-per-tenant** (silo — strongest isolation, trivial per-tenant backup/restore/residency, lowest density, and **migration fan-out** across thousands of DBs) · **schema-per-tenant** (bridge — medium isolation/density, catalog bloat past ~**hundreds**) · **shared-schema + `tenant_id` + Row-Level Security** (pool — highest density/lowest cost, weakest isolation, home of the cardinal bug). **The cardinal failure:** a query missing `WHERE tenant_id` leaks across tenants → **defense in depth** (application scoping **+** Postgres **RLS** backstop + a tenant-context middleware). **Compute/network**: shared pool vs per-tenant namespace/VPC for premium tiers. **Tier it**: pool the long tail, silo the whales/regulated; migrate **pool→silo** without downtime as a tenant graduates. *Rejected:* a shared DB with app-layer filtering only; one isolation model for every tenant.

## Per-Tenant Limits, Metering & Billing
**Fairness + monetization.** Noisy-neighbor control: **per-tenant token-bucket** rate limits and quotas set **by plan** (a Redis `ratelimit:{tenant_id}` key, refilled at the plan's rate, **429 + `Retry-After`** when empty), fair scheduling so no tenant monopolizes workers, and quarantine for a runaway tenant. **Metering**: capture per-tenant usage events → aggregate → rate → bill, at **billing-grade accuracy** (idempotent, no double-count or drop — a metering bug is a revenue/compliance incident). **Models**: seat / usage / tiered / hybrid; enforcement soft-warn vs hard-block at plan limits. **QoS tiers** (gold/silver/bronze) → different limits + priority (priority queues, reserved capacity). **Director move:** this is where **unit economics** live. *Rejected:* flat infinite usage (destroys margin); hard caps that throttle a growing customer; rate-limiting deep in the app instead of at the edge.

## Tenant Lifecycle & the Control Plane
Split the **control plane** (tenant registry, provisioning, config, routing, lifecycle) from the **data plane(s)** (serve tenant traffic, often **per-region**) — for blast radius and independent scaling. Tenant context is resolved from **subdomain / header / token claim** and propagated on every hop. **Lifecycle**: provisioning (**self-serve in seconds / pooled** vs **enterprise white-glove in days / siloed**), configuration & customization (feature flags per plan, white-label, **custom domains + TLS**, SSO — keep it **data-driven, not code-forked**), **tenant-aware deploys + canary-by-tenant**, **data residency** (an EU tenant pinned to an **EU data plane**, one global control plane over per-region data planes), tier migration, and **offboarding + GDPR deletion** (fan-out across every store *and backups*, ~**30-day** SLA). **Director move:** the control plane is the leverage to run thousands of tenants; residency/onboarding **gate enterprise deals.** *Rejected:* no control/data split; a deletion that forgets backups and derived stores.

---

*Design problem — 12.5 (multi-tenant SaaS platform):* runs the full RESHADED spine weighted to **Evaluation** (cross-tenant leak prevention, noisy-neighbor under a hot whale, a giant enterprise tenant vs the long tail, an onboarding spike, per-tenant restore) and **Design evolution** (a dedicated-silo enterprise tier, per-region data planes for residency, usage-based billing, tier migration).

## Director through-line (all 4)
Place the system on the **silo→pool** spectrum from the **isolation-vs-efficiency** requirement and the **unit economics**, not reflex · defend against **cross-tenant leakage in depth** (app + RLS), never a single `WHERE` clause · every choice names the **rejected alternative and its cost** (density, ops, margin, blast radius) and **quantifies** the dropped side (tenants/host, cost/tenant, the power-law whale share, per-tenant restore RTO) · **own tenancy as a business decision** (per-tenant COGS, which tier gates which deal) and delegate the enforcement details with a prior ("I'd have the platform team pen-test the RLS boundary; my prior is row-level plus a query-layer guard") · always carry the compliance, residency, and cost-density dimension.

> **Spaced-repetition recap:** Tenancy is a **first-class axis** on the **silo → bridge → pool** spectrum — trade **isolation** (no leak, blast radius, noisy-neighbor, compliance, per-tenant restore) against **efficiency** (cost, ops, density), and **pool the tail, silo the whales.** **Cross-tenant leakage is the existential bug** → isolate data by **DB-per-tenant / schema / shared+RLS** and enforce in depth (app + **RLS**). Tenant load is a **power law** (top 1% = 40–60%) → **per-tenant token-bucket limits by plan** + fair scheduling, plus **billing-grade metering** feeding seat/usage/tiered billing and **QoS tiers.** Split the **control plane** from per-region **data planes**; run the tenant **lifecycle** (self-serve vs white-glove provisioning, data-driven config, canary-by-tenant, **residency**, GDPR deletion across backups). Own tenancy as **unit economics** and a deal-gate; delegate enforcement with a prior.
