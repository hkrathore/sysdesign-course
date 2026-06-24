---
title: "Module 13 - Production Troubleshooting & Incident Response Cheat Sheet"
description: "The 6 troubleshooting/incident building blocks — decision → trade-off → the number — plus the recurring laws and the Director through-line. Skimmable in 5 minutes."
sidebar:
  order: 13
---

### 6 blocks. Each = the decision → the trade-off → the number. Skimmable in 5 minutes.

> Two probes live here. The **diagnostic round** tests structured reasoning under uncertainty (not greenfield design). The **operational-leadership** probe tests the **detect / respond / learn** system you built. Reason calmly out loud *and* show the system that survives the next outage without you in the room.

---

## Recurring laws (every block leans on these)

- **Localize before you fix; mitigate before you root-cause.** Stop the bleeding (rollback = known-good in minutes), then diagnose with the clock off.
- **Ask "what changed?"** ~**70–80%** of incidents are change-induced (deploy / config / traffic / dependency).
- **Bisect the request path** like a binary search; a **trace** does it for you.
- **Alert on user-facing symptoms (SLO burn), not causes** — cause-alerts are fatigue.
- **The error budget is the arbiter** of reliability-vs-velocity: spend it, **freeze** when it's gone.
- **One decision-maker beats a crowd** (ICS: IC / comms / ops / scribe).
- **Blameless:** human error is a symptom of system design → contributing factors over a single root cause; action items that **close**.
- **Systems bend, not break** (circuit-break, shed, degrade, fall back); on-call load is a system you manage.

---

## The Diagnostic Method *(framing)*
Structured reasoning under uncertainty. The loop: **observe** (which %ile / region / since-when, blast radius) → **what changed?** (deploy / config / traffic / dependency; us-or-downstream) → **bisect** the request path (edge → LB → service → cache → DB → dependency; a trace localizes) → **confirm** → **mitigate first** (rollback = known-good in minutes) → **root-cause** at leisure. **Mitigate-first vs root-cause-first:** stop the bleeding, trading diagnostic certainty for MTTR. Numbers: ~**70–80%** of incidents are change-induced; MTTR = detect + diagnose + mitigate; a wrong fix can **double** it. **Director move:** ask what changed, bisect to localize, mitigate before deep RCA, narrate the reasoning. *Rejected:* jump to a fix, no hypothesis, randomly tune knobs, never ask "what changed"; root-causing while the site burns.

## Observability in Anger
The point is asking **new** questions of a live system. **Metrics** = *what / how much* (cheap, aggregate); **logs** = *why* (expensive); **traces** = *where* (the slow hop); **profiling** = *what code is hot.* Localize fast with **RED** (Rate / Errors / Duration, per service) + **USE** (Utilization / Saturation / Errors, per resource). **Correlate** by trace/request ID across all pillars. Mind **cardinality** (metric explosion) and **cost** (log $/GB) → sampling (head/tail), high-cardinality wide events for unknown-unknowns. Numbers: p50-vs-p99 divergence; trace sample rates; log cost per GB. **Director move:** RED to the service → trace to the hop → log/profile to the cause; invest pre-incident, respect cost. *Rejected:* logs-only (can't find the hop); no trace-ID correlation; alerting on causes; cardinality explosion (and the bill).

## SLOs & Error Budgets
**SLI** (measured at the user: availability / latency / correctness / freshness) → **SLO** (internal target, stricter than the **SLA**). The **error budget = 1 − SLO = permission to ship**: under budget → ship; burned → fix reliability and **freeze**. **Burn-rate alerting** (multi-window, multi-burn: a fast burn **pages**, a slow burn opens a **ticket**) beats threshold-on-every-blip. Numbers: **99.9% = 43 min/mo**, **99.99% = 4.3 min/mo**; each extra nine ~**10×** cost; e.g. 2% of the monthly budget in 1 hr → page. **Director move:** user-centric SLIs, the budget as the reliability-vs-velocity arbiter, burn-rate alerts + a freeze policy. *Rejected:* chasing 100% uptime (infinite cost); alerting on every metric (fatigue); no budget (the fight becomes politics); SLA = SLO confusion.

## Incident Command
**One decision-maker beats a crowd.** The **ICS** roles: **IC** = coordinator/decider (*not* on the keyboard), **Comms** = stakeholder + status-page updates, **Ops** = the hands fixing, **Scribe** = the timeline. **Severity** (SEV1–4) with pre-agreed triggers so declaring isn't a judgment call; **declare early** (the bias against it costs MTTR). **Comms cadence** (e.g. every **30 min**, even with "no new info"); a **single source of truth** (one incident channel). The IC decides under uncertainty (others advise, disagree-and-commit); **handoffs** follow-the-sun on long incidents. **Director move:** ICS roles, a single IC coordinating, declare early, steady comms. *Rejected:* everyone debugging at once with no coordinator; the IC stuck hands-on-keyboard; not declaring (ego); silent comms (stakeholders escalate); no scribe (no timeline for the postmortem).

## Blameless Postmortems
Convert an outage into **organizational learning.** **Blameless:** human error is a **symptom of system/process design**, not the cause (just-culture, "second story") → design the guardrail, don't blame the human. **Contributing factors over a single root cause** (the 5-whys trap stops at a person). The **timeline** is facts, what-was-known-when (no hindsight bias). **Near-misses count.** **Action items** with owners + due dates that **actually close** (track them like bugs; beware the graveyard of open AIs); prefer **systemic fixes over "be more careful."** Psychological safety is the precondition; share widely. Numbers: AI close rate, repeat-incident rate, time-to-publish (days, not weeks). **Director move:** blameless, contributing factors, AIs that close, share the learning. *Rejected:* name-and-blame (→ hidden incidents); a single root cause; "be more careful" non-fixes; action items that never close.

## Graceful Degradation & On-Call Health
Build systems that **bend, not break:** **circuit breakers** (fail fast, half-open recovery — stop the **cascade**), **load shedding** (drop low-priority traffic to protect the core), **backpressure** (bounded queues, not infinite buffering), **bulkheads** (isolate failure domains), **fallbacks** (stale cache / default response). **Retries need jitter + a budget** (naive retries = a **retry storm**). The **"the number is wrong"** path = idempotent **replay/backfill** from retained raw. **On-call health** is a managed system: **page on user-facing symptoms only**, an **alert budget** (target ~**<2 actionable pages/shift**), follow-the-sun, recognition/comp. **Director move:** degrade to protect the core + a replay path; treat pager load as a metric you own. *Rejected:* no circuit breaker (cascading failure); retry storms; fail-hard instead of degrade; no replay path; paging on everything (fatigue → burnout).

---

## Director through-line (all 6)
**Reason** your way through an unfamiliar outage calmly and out loud — observe, ask **what changed**, bisect, **mitigate before root-cause** — *and* show the **system** you built so the org survives the next failure without you: observability that localizes (RED/USE + traces), **SLO-driven response** (error budget as the arbiter, burn-rate alerts), **incident command** (one IC, clear roles, declare early), **blameless learning** (contributing factors, AIs that close), and **resilience + sustainable on-call** (degrade gracefully, symptom-only alerts). Name the trade-offs (fast mitigation vs root-cause certainty; alert sensitivity vs fatigue) and **delegate with a prior** ("I'd have SRE set multi-window burn-rate alerts on our top three SLIs; my prior is it halves pages while catching the fast burns"). Always carry the **MTTR, cost, and human-sustainability** dimension.

> **Spaced-repetition recap:** Two probes — the **diagnostic round** (reason under uncertainty) and the **operational-leadership** system. Diagnose by **observe → what-changed (~70–80% are change-induced) → bisect the path (a trace localizes) → confirm → mitigate first (rollback) → root-cause later**; never fix before localizing. **Observability** = metrics (*what*) + logs (*why*) + traces (*where*) + profiling (*hot*), localized via **RED + USE**, correlated by trace ID, watched for cardinality/cost. **SLO** (stricter than SLA) + **error budget = permission to ship**; **burn-rate alerts** (fast→page, slow→ticket); 99.9% = 43 min/mo, each nine ~10×; **freeze when the budget's gone.** **Incident command:** one **IC** (coordinator, not on keys), comms/ops/scribe, declare early, 30-min cadence. **Blameless postmortems:** contributing factors over root cause, AIs that **close**. **Degrade, don't break** (circuit-break + shed + fallback + replay), and run **on-call as a managed system** (symptom-only pages, an alert budget). Mitigate first; build the system; price the human cost.
