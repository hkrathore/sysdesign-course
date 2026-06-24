---
title: "11.1 — Security, Privacy & Trust"
description: The Engineering Excellence track opener — designing for security, privacy, and compliance at Director altitude, owning the security posture as a system rather than a checklist.
sidebar:
  order: 1
---

> **Module status — in progress.** This is the opening lesson of the **Engineering Excellence & Operations** track (Part IV). The module overview and scope below are final; the remaining lessons land in the next authoring pass. The numbering is fixed, so nothing here will move again.

### Why this module exists

A Director of Engineering/Platforms usually *owns* the security and trust posture, and the loop probes it two ways: a direct "how would you design auth / make this compliant?" round, and a follow-up "how would you secure *this*?" on top of any HLD. The signal is whether you treat security as a **system with paved-road defaults, guardrails, and incentives**, not a checklist bolted on at the end, and whether you know where the decision turns on depth versus where you delegate to the security team with a stated prior.

### Scope (what this module covers)

- **AuthN / AuthZ at scale** — OAuth2/OIDC, SSO, session vs token, RBAC vs ABAC, multi-tenant isolation, service-to-service identity (mTLS, workload identity).
- **Threat modeling & zero-trust** — STRIDE, trust boundaries, blast-radius thinking, defense-in-depth, assume-breach.
- **Secrets, keys & encryption** — secrets management, KMS/HSM, envelope encryption, encryption at rest and in transit, tokenization, key rotation.
- **Privacy engineering** — PII classification and data minimization, GDPR/CCPA right-to-be-forgotten as an *architectural* constraint (deletion across replicas, backups, and derived stores), consent and purpose limitation.
- **Compliance as architecture** — SOC 2, PCI-DSS, HIPAA: what each forces into the design (audit logging, segmentation, retention floors), and how to make compliance a property of the platform rather than a per-team tax.
- **Abuse & availability** — fraud, bot, and account-takeover mitigation, rate limiting and quotas, DDoS absorption.

### The Director lens

Every control above is a **trade-off**, security buys risk reduction at a cost in latency, friction, or velocity, and a leader names that cost out loud. The from-scratch crypto is delegated; the *posture* (what defaults the paved road enforces, what the platform makes impossible by construction, where the audit boundary sits) is owned.

*The detailed lessons (auth at scale, threat modeling, secrets/KMS, privacy & deletion, compliance-as-architecture, abuse mitigation) are forthcoming.*
