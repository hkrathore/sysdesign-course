---
title: "Module 12 — Testing & Quality Engineering Cheat Sheet"
description: "Decision references for the testing and quality round — forthcoming."
sidebar:
  order: 12
---

> **Cheat sheet in progress.** Decision references land with the full module. See the Module 12 overview for scope.

**The load-bearing moves (preview):**
- **Pyramid:** most value in fast unit + contract tests; keep e2e thin (slow, flaky, high-fidelity) and reserve for critical journeys.
- **Contracts** over shared integration envs for cross-service confidence; mock at the boundary, verify the contract.
- **Flaky tests** are a trust tax: quarantine fast, fix or delete; a 1% flake rate at scale erases signal.
- **Shift-left vs test-in-prod:** canary + feature flags + fast rollback often beat a heavier pre-prod suite.
- **Gates:** wire DORA (change-failure rate, MTTR, lead time, deploy freq) into CI; tie to incentives.
- **Director tell:** quality as an *operating system* (platform + process + incentives), not "write more tests."
