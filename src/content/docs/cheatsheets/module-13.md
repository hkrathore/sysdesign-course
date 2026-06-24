---
title: "Module 13 — Production Troubleshooting & Incident Response Cheat Sheet"
description: "Decision references for the diagnostic round and incident command — forthcoming."
sidebar:
  order: 13
---

> **Cheat sheet in progress.** Decision references land with the full module. See the Module 13 overview for scope.

**The load-bearing moves (preview):**
- **Diagnose:** observe → hypothesize → bisect → confirm; localize before you fix; triage "us vs a dependency" early.
- **In anger:** metrics for *where*, traces for *which hop*, logs/profiles for *why*; USE (resources) + RED (request flows).
- **Trigger on SLO burn rate**, not raw alerts; decide what pages vs what waits; freeze on budget exhaustion.
- **Command:** split IC / comms / ops; one decision-maker; set sev + comms cadence.
- **Postmortem blameless:** contributing factors over single root cause; action items that actually close.
- **Director tell:** reason calmly out loud *and* show the detect/respond/learn system + sustainable on-call you built.
