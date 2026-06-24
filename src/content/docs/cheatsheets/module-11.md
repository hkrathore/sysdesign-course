---
title: "Module 11 — Security, Privacy & Trust Cheat Sheet"
description: "Decision references for the security, privacy, and trust round — forthcoming."
sidebar:
  order: 11
---

> **Cheat sheet in progress.** Decision references land with the full module. See the Module 11 overview for scope.

**The load-bearing moves (preview):**
- **AuthZ:** RBAC for coarse roles, ABAC when access depends on attributes/context; isolate tenants at the data layer, not just the app.
- **Secrets:** never in code/config; KMS + envelope encryption + rotation; short-lived workload identity over long-lived keys.
- **Privacy:** treat GDPR/CCPA deletion as an architecture problem (replicas, backups, derived stores), not a DELETE.
- **Compliance:** make it a platform property (audit logging, segmentation, retention) so it isn't a per-team tax.
- **Director tell:** owns the *posture* (paved-road defaults + what's impossible by construction), delegates the crypto with a stated prior.
