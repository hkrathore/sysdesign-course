---
title: "Module 12 — Testing & Quality Engineering Cheat Sheet"
description: "The 6 testing/quality building blocks — decision → trade-off → the number — plus the recurring laws and the Director through-line. Skimmable in 5 minutes."
sidebar:
  order: 12
---

### 6 blocks. Each = the decision → the trade-off → the number. Skimmable in 5 minutes.

> The reflex to unlearn: the probe is **never "write a test."** It's "run quality at scale across N teams." Quality is an **operating system** — platform + process + incentives — that makes safe shipping the *default*. Answering at IC altitude ("we'd add more tests," "QA tests it") loses the round.

---

## Recurring laws (every block leans on these)

- **Quality is an operating system**, not a phase: platform + process + incentives. The paved road makes the **safe path the easy path** (CI gates, flags, fast rollback).
- **Invest by ROI, not dogma.** The pyramid reshapes for distributed systems — bugs live at the **seams**, so fund contract/integration and keep E2E thin.
- **Every gate buys safety at a velocity cost** — name it. A gate that taxes without catching is waste.
- **Flake is economics:** P(suite green) = (1−p)^N. A "negligible" per-test rate is catastrophic per suite → quarantine, bound retries, own it.
- **You can't replicate prod** — some confidence is prod-only → flags + canary + **SLO-gated rollback**.
- **Measure with DORA**, but **coverage-as-target is Goodhart** (gamed). Metrics are signal, not a stick.
- **Platform, not bottleneck:** a platform team *enables* quality; a QA gate *is* a bottleneck.

---

## Quality Engineering for System Designers *(framing)*
The **test pyramid** (unit → integration → E2E) trades **speed / cost / confidence**; for microservices it reshapes into a **trophy/honeycomb** (fat contract + integration, thin E2E) because bugs live **between** services, not inside units. Invest by **ROI**, and count the **total cost of a test** (write + run + maintain + **flake**), not write-once. Numbers: ~**70/20/10** classic ratio; the **10× escaped-defect cost** per stage downstream. **Quality-as-platform:** CI gates + feature flags + fast rollback make the safe path the easy path. **Director move:** quality = platform + process + incentives; name each gate's velocity cost. *Rejected:* "we'd add more tests" / "the QA team tests it" (IC altitude, a bottleneck); over-investing in slow, flaky E2E.

## Contract & Integration Testing
Bugs live at the **seams** → **consumer-driven contracts** (Pact): the consumer declares the req/resp it depends on, the provider **verifies in CI**, which decouples deploys. The tension is **flake vs fidelity** — real deps (testcontainers) are high-fidelity but high flake/cost/slowness; **mocks** are fast and stable but **drift** from reality (false confidence). Handle **API compatibility direction** (backward/forward) and deploy **order** (provider ships the compatible change first); `can-i-deploy` checks who's live in prod. Numbers: a contract test runs in **seconds** vs E2E's **many minutes**; teams deploy independently. **Director move:** contracts in CI, real deps only where fidelity matters. *Rejected:* full E2E for integration confidence (slow, flaky, couples every deploy to one env); mocks that drift from the real provider.

## Test Environments & Data
Realistic envs and data are the **hidden cost** of testing. **Shared staging** = contention + drift + "who broke staging"; **ephemeral per-PR** envs (provisioned from IaC, torn down after) isolate teams. **Test data:** cloning prod is a **PII/compliance landmine** → **mask/anonymize**, **synthesize**, or subset. Buy **prod-fidelity by risk**, not everywhere; service-virtualize deps you can't run. Numbers: env spin-up time/cost; staging-contention wait; the compliance cost of real PII sitting in a test box. **Director move:** ephemeral envs + masked/synthetic data, fidelity bought by risk. *Rejected:* "we have a staging env" (shared, drifts, contended); cloning prod with real PII; no teardown (cost + sprawl).

## Flaky Tests & Test Health
**P(suite green) = (1−p)^N** — at **p = 0.5%, N = 2000 → ~0.004%** green, so the build is red for no real reason → distrust → retry-to-green → real bugs slip through. Flake is an **economics/systems** problem: **detect** (rerun analysis), **quarantine + track** (isolate so it doesn't block, cap at ~1% of the suite), **bound retries** (alert on retry *rate* as the honest flake signal), and **own** test health as a tracked metric (green-rate, flake-rate, p95 duration). Deflake with deterministic time/IDs, wait-on-condition (not sleeps), isolated state. **Director move:** quantify the signal loss first, then quarantine / bound / own. *Rejected:* "add retries" / "rerun until green" (hides flake, destroys the signal); dismissing flake as noise; no owner.

## Shift-Left vs Test-in-Production
Catch early = cheap (**the 10× rule**), but **staging can't replicate prod** scale/data/traffic, so some confidence is **prod-only.** Test in prod safely: **feature flags / dark launch**, **canary** (1% → ring expand), blue-green, **shadow/mirror traffic**, **synthetic monitoring**, chaos — gated by **automatic SLO-driven rollback.** Observability is the **oracle**; flags + fast rollback + blast-radius limits make it responsible, not reckless. Numbers: canary % + bake time; rollback **MTTR in seconds–minutes** with flags. **Director move:** flags + canary + SLO-gated rollback + synthetics over a heavier pre-prod soak. *Rejected:* "test thoroughly in staging first" (can't replicate prod); big-bang deploys; test-in-prod with **no** flags/rollback (reckless); a canary with no automated gate (a human watching a graph).

## Quality Gates, DORA & the CI/CD Platform
Gates encode the bar (coverage, lint, **SAST**/dep-scan, contract, perf budget) — but a gate that **taxes without catching** is waste. Measure with the **DORA four** (deploy frequency, lead time, **change-failure rate**, **MTTR**) + reliability; **coverage-as-target is Goodhart** (gamed with assertion-free tests) → treat it as signal, not a stick. The **CI/CD platform** is pipeline-as-code + caching + parallelism (a slow pipeline taxes every engineer); decide **build-vs-buy** (Actions / GitLab / Buildkite vs self-host). **Org:** a platform team **enables**, it isn't a QA **gate** (the bottleneck). Numbers: DORA elite = deploy on-demand, lead time **<1 hr**, CFR **<15%**, MTTR **<1 hr**. **Director move:** ROI-chosen gates, DORA to measure (not punish), build-vs-buy with a prior. *Rejected:* a coverage-% target; a QA team as the deploy gate; building CI/CD when buying fits.

---

## Director through-line (all 6)
Classify the **real constraint** (where the ROI is / seam confidence / env fidelity / signal loss to flake / prod-only risk / what to gate), not "more tests." · Pick from the **requirement**, name the **rejected alternative and its cost** (velocity, flake, fidelity, false confidence), and **quantify** (pyramid ratios, the (1−p)^N math, DORA bands, canary %, rollback MTTR). · **Own the operating model** — paved-road gates + flags + rollback, DORA as the health signal, incentives aligned — and **delegate** with a prior ("I'd have the platform team stand up consumer-driven contracts before we touch the integration suite; my prior is it kills most seam bugs and decouples our deploys"). · Always carry the **velocity, cost, and developer-experience** dimension — a quality system that crushes velocity has failed.

> **Spaced-repetition recap:** Quality is an **operating system** (platform + process + incentives), not "write more tests" — the paved road makes safe shipping the default. **Invest by ROI:** the pyramid reshapes to a **trophy** for distributed systems (fat **contract/integration**, thin E2E) because bugs live at the **seams**; **consumer-driven contracts** in CI decouple deploys (flake-vs-fidelity governs mocks vs real deps). **Ephemeral per-PR envs + masked/synthetic data** beat shared staging and dodge the PII landmine. **Flake is economics:** P(green) = (1−p)^N → quarantine, **bound retries** (alert on retry rate), own test health; never retry-to-green. **Can't replicate prod** → flags + **canary** + **SLO-gated rollback** + synthetics; the 10× rule still favors shift-left where it's cheap. **Gates by ROI, DORA to measure** (deploy freq / lead time / CFR / MTTR), beware coverage-as-Goodhart, build-vs-buy CI/CD, and keep the platform an enabler — never a QA bottleneck.
