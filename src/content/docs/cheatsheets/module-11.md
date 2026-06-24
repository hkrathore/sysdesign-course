---
title: "Module 11 - Security, Privacy & Trust Cheat Sheet"
description: "The 6 security/privacy/trust building blocks — decision → trade-off → the number — plus the recurring laws and the Director through-line. Skimmable in 5 minutes."
sidebar:
  order: 11
---

### 6 blocks. Each = the decision → the trade-off → the number. Skimmable in 5 minutes.

> The reflex to build: security is **not a control you bolt on at the end** — it's a posture you design in. Classify the **trust boundaries and the blast radius first.** The question is never "which tool," it's "what does the platform make impossible by construction, and what does each control cost in latency, friction, or velocity."

---

## Recurring laws (every block leans on these)

- **Security is a system property, not a checklist.** A paved-road, secure-by-default platform beats per-team vigilance. **Every control buys risk reduction at a cost** in latency, friction, false positives, or velocity — name it out loud.
- **Assume breach; design for blast radius.** One compromised component must not own the system → defense-in-depth, least privilege, fine-grained keys and identities.
- **Identity is the new perimeter.** Zero-trust: authenticate *and* authorize every hop; no implicit trust from network location.
- **AuthN ≠ AuthZ.** Who-you-are vs what-you-may-do are different problems, solved in different places.
- **Encryption is table stakes; key management is the engineering.** AES/TLS are free; the work is KMS, envelope encryption, rotation, and a key hierarchy.
- **Privacy and compliance are architecture, not paperwork.** Deletion fans out across every store; compliance is a platform property (audit-by-default, segmentation, scope reduction).
- **Minimize.** Collect less = less to protect, delete, and breach. Reduce scope (tokenize) = smaller audit.

---

## Security & Trust for System Designers *(framing)*
Threat-model first: enumerate **STRIDE** (Spoofing, Tampering, Repudiation, Info-disclosure, DoS, Elevation) across **trust boundaries** (where data crosses a privilege level). **Zero-trust** (verify identity every hop) replaces castle-and-moat; **defense-in-depth + assume-breach** bound blast radius. The decision is *where* the control sits (edge / service / data) and *what it costs.* Numbers: a breach averages **~$4–5M**; **MFA cuts account-takeover >99%**; a control adds ms of latency or signup friction. **Director move:** own the posture (paved-road defaults, what's impossible by construction, where the audit boundary sits), delegate from-scratch crypto with a prior. *Rejected:* bolt-on "add a WAF + TLS" with no model — can't name a downside of its own control.

## AuthN / AuthZ at Scale
**Authn (who) ≠ authz (what).** Authn: **OAuth2 / OIDC** (auth-code + PKCE), SSO via SAML/OIDC. Token model is load-bearing: **session** (stateful, instantly revocable) vs **JWT** (stateless, self-contained, *can't revoke before expiry*) → short-lived access **5–15 min** + refresh. Authz: **RBAC** (coarse roles) → **ABAC** (attribute/context) → **ReBAC** (Zanzibar, "can U do A on R"); centralize as **policy-as-code (OPA)**, not scattered in services. **Multi-tenant isolation by construction** (row-level vs schema vs DB-per-tenant; a cross-tenant leak ends the interview). Service-to-service: **mTLS / SPIFFE workload identity**, short-lived certs over shared keys. *Rejected:* long-lived JWT with no revocation; authz copy-pasted per service; tenant isolation by an app-layer `WHERE` clause only.

## Secrets, Keys & Encryption (KMS)
At rest **AES-256** (GB/s with AES-NI, ~noise), in transit **TLS 1.3 / mTLS** — table stakes. Pick the encryption *layer* by what an inside attacker still sees: full-disk (physical theft only) < TDE (files/backups) < **field-level** (end-to-end, but no index/range/join). **Envelope encryption:** a **DEK** encrypts data locally; a **KEK** in **KMS/HSM** wraps the DEK → rotate the KEK without re-encrypting data, keep KMS off the hot path (**~$0.03/10k calls**, single-digit-ms, cache DEKs). Secrets live in a **manager** (Vault / cloud), **never in code/env/git** (history is forever); prefer **dynamic, short-lived creds** (~1-hr TTL). **Tokenization** shrinks **PCI scope** (encrypted PAN is *still* in scope — you hold the key). A **key hierarchy** bounds blast radius (a per-tenant DEK leak = a one-tenant incident). *Rejected:* one key for everything; "encrypted at rest" while the app still sees plaintext.

## Privacy Engineering & Data Deletion
**Right-to-be-forgotten is a distributed-systems fan-out, not a `DELETE`.** Propagate the delete across primary, **replicas, cache, search index, warehouse, derived tables, queues, logs, and 3rd-party processors.** For immutable backups / append-only stores, **crypto-shred** (per-user key → destroy the key). **Data minimization** is the cheapest control. Pseudonymization ≠ anonymization (re-identification risk). Numbers: GDPR DSAR SLA **~30 days**; backups make hard-delete impossible → crypto-shred. **Audit-prove** completion. **Director move:** enumerate every store (incl. backups/derived/logs), treat privacy as an architectural constraint with an SLA. *Rejected:* `DELETE FROM users` (forgets replicas / warehouse / search / backups / logs); treating "anonymized" data as truly anonymous.

## Compliance as Architecture
Make compliance a **platform property** (paved road), not a per-team tax. Each regime *forces* design: **SOC 2** (audit-log everything, access reviews), **PCI-DSS** (segment the cardholder env, **tokenize to shrink scope**), **HIPAA** (PHI, BAAs, encryption, access controls). **Audit logging** is first-class: immutable, tamper-evident, who-did-what-when. The tension: **retention floors** (SOX ~7 yr) vs **deletion obligations** (RTBF) → scoped retention + legal hold. **Controls-as-code / continuous evidence** (Vanta/Drata) over an annual scramble. Numbers: audit-log tiers (1 yr hot / 7 yr cold); scope reduction pulls *dozens* of services out of the assessed boundary. **Director move:** name what each regime forces, reduce scope aggressively, make it audit-by-default. *Rejected:* compliance as paperwork "later"; the whole system left in scope.

## Abuse, Fraud & DDoS
Availability + integrity under **adversarial** load; defense is **layered** (edge → app → account), each control costing legitimate-user friction / false positives (= revenue). **Rate-limit** (token bucket vs sliding window) keyed per user/IP/key, **at the edge**, not deep in the app. **DDoS:** L3/4 volumetric → **anycast + scrubbing + CDN** (Cloudflare / Shield); L7 → **WAF + challenge.** **Bots:** CAPTCHA / fingerprint / behavioral (conversion cost). **ATO:** credential-stuffing → **MFA (>99% cut)**, breached-password checks, anomaly/velocity. **Fraud:** rules + ML scoring, tuned for **low false positives** (blocking real buyers costs revenue). Numbers: multi-**Tbps** volumetric attacks; CAPTCHA ~few-% conversion drop. *Rejected:* single-layer "add a rate limiter"; rate-limiting in the app not the edge; ignoring the blocked-revenue cost; DDoS treated as "auto-scale up."

---

## Director through-line (all 6)
Classify the **real risk** (trust boundary / token revocation / key blast radius / deletion fan-out / audit scope / adversarial load), not "which tool." · Pick from the **requirement**, name the **rejected alternative and its cost** (latency, friction, false-positive revenue, velocity), and **quantify** the dropped side (TTLs, nines, $, blast radius, false-positive rate). · **Own the posture** — paved-road defaults, what the platform makes impossible by construction, where the audit boundary sits — and **delegate the crypto** with a prior ("I'd have the security team pen-test the tenant-isolation boundary; my prior is row-level plus a query-layer guard, not app-layer filtering"). · Always carry the **cost, compliance, and on-call** dimension.

> **Spaced-repetition recap:** Security is a **posture you design in**, not a checklist bolted on — classify **trust boundaries and blast radius** first, **assume breach**, and name what each control costs. **Identity is the perimeter** (zero-trust; authn ≠ authz; sessions are revocable, **JWTs aren't** → short-lived + refresh; RBAC→ABAC→ReBAC via **OPA**; tenant isolation by construction). **Encryption is table stakes; keys are the work** — **envelope encryption** (a DEK wrapped by a KMS **KEK**), rotation, hierarchy to bound blast radius; secrets in a manager, **never in git**; **tokenize to shrink PCI scope.** **Privacy = a deletion fan-out** across every store (crypto-shred the immutable ones; minimize; ~30-day DSAR). **Compliance = a platform property** (audit-by-default, segmentation, scope reduction). **Abuse = layered defense** (edge rate-limit + scrubbing + WAF + MFA + fraud scoring) tuned for low false positives. Own the posture; delegate the crypto with a prior; always price the control.
