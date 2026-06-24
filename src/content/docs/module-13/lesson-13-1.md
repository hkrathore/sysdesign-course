---
title: "13.1 — Production Troubleshooting & Incident Response"
description: The diagnostic round and the war room — debugging distributed systems under uncertainty, and building the detect/respond/learn system an engineering org runs on, at Director altitude.
sidebar:
  order: 1
---

> **Module status — in progress.** Third module of the **Engineering Excellence & Operations** track (Part IV). The overview and scope below are final; the remaining lessons land in the next authoring pass. Numbering is fixed.

### Why this module exists

Two distinct probes live here. The **diagnostic round** — *"latency just doubled / the service is down, walk me through how you'd investigate"* — tests structured reasoning under uncertainty, not greenfield design. And the **operational-leadership** probe — *"how do you run on-call and incidents for a large org?"* — tests whether you've built the system that detects, responds to, and *learns from* failure. A Director is expected to lead the war room and own the operating model behind it.

### Scope (what this module covers)

- **The diagnostic method** — observe → hypothesize → bisect → confirm; resisting the urge to fix before you've localized; "is it us or a dependency?" triage.
- **Observability in anger** — metrics, logs, and traces (plus continuous profiling) used *during* an incident; the USE and RED methods for finding the bottleneck fast.
- **SLOs & error budgets as the response trigger** — burn-rate alerts, what pages versus what waits, and budget-driven freeze decisions.
- **Incident command** — the IC / comms / ops role split, severity levels, the comms cadence, and why a single decision-maker beats a crowd.
- **Blameless postmortems** — timelines, contributing factors over root cause, action items that actually close, and the cultural conditions that make honesty safe.
- **Runbooks & graceful degradation** — load shedding, circuit breaking, backpressure, and the "the number is wrong" replay/backfill path.
- **On-call health** — rotation design, alert-budget hygiene, and treating pager load as a system you manage, not noise you tolerate.

### The Director lens

The interview wants two things: that you can **reason** your way through an unfamiliar outage calmly and out loud, and that you build the **system** — observability, SLO-driven response, blameless learning, sustainable on-call — so the org survives the next failure without you in the room. Name the trade-offs (fast mitigation vs root-cause certainty; alert sensitivity vs fatigue) and decide deliberately.

*The detailed lessons (the diagnostic method, observability-in-anger, SLO-driven response, incident command, postmortems, degradation patterns, on-call design) are forthcoming.*
