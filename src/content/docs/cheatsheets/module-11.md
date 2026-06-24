---
title: "Module 11 — Gen AI & Agentic Foundations Cheat Sheet"
description: "The 16 GenAI/agentic building blocks — decision → trade-off → the number — plus the cross-cutting laws and the Director through-line. Skimmable in 5 minutes."
sidebar:
  order: 11
---

### 16 blocks. Each = use when → key decision/trade-off → the number. Skimmable in 5 minutes.

> The reflex to unlearn from the system-design track: with GenAI the **model is the cheap, swappable part.** The asset — and the bottleneck — is everything around it: retrieval, eval, memory, tools, guardrails, and the cost model. Classify *that* first.

---

## Recurring laws (every block leans on these)

- **The LLM is stateless, stochastic, and token-metered.** It remembers nothing between calls; all "memory" is re-sent context. Same prompt ≠ same output. **Output tokens dominate cost; cost scales with usage, not provisioned capacity.**
- **Retrieval, not the model, is the RAG bottleneck.** "Good model, bad retrieval → confident, well-cited, wrong." Fix chunking/hybrid/rerank before swapping models.
- **Fine-tuning teaches behavior, not facts.** RAG for facts, fine-tune for format/tone/skill; they compose.
- **Prompt injection is unsolved.** There's no data/instruction separation in a context window → **contain (least privilege, treat model output as untrusted), don't pretend to prevent.**
- **Eval is the regression suite.** Ship nothing without it; LLM-as-judge needs human calibration; a silent vendor model update must re-pass the gate.
- **Agents trade reliability for autonomy.** Reliability ≈ p(step)^N → **prefer the most constrained thing that works** (workflow > agent). Multi-agent multiplies tokens ~10–15× and failure surface.
- **The context window is the agent's RAM** — finite, paid, wiped between sessions. Memory design = what to keep in-context vs retrieve vs summarize vs forget.
- **Gate actions by reversibility × blast radius.** Tools are where value *and* danger live; idempotent tool calls + HITL on irreversible ones.
- **The moat is data + eval + product, never the model** (it commoditizes every few months). For serving, **GPU HBM is the binding resource.**

---

## LLMs for System Designers
Treat the model as a **stateless, stochastic, token-metered next-token predictor** you compose, not train. **Tokens** ≈ 4 chars / 0.75 words (≈750 words = 1K tokens); **context window** 128K–1M, input+output share it. **Latency = TTFT (prefill, ∝ prompt length) + output_tokens × TPOT (decode, ∝ model size)** — TTFT ~100s ms–s, TPOT ~10–50 ms/tok; streaming hides decode. **Cost lever = output tokens** (you control length). Plan around hallucination, knowledge cutoff (→RAG), non-determinism, context overflow.

## Embeddings & Vector Search
Meaning → geometry; **ANN trades a little recall for orders-of-magnitude speed** (exact kNN is O(N)). Index = the **recall ↔ latency ↔ memory** triangle: flat (exact, small N) · IVF (cluster+probe) · **HNSW (default; great recall/latency, heavy memory)** · +**PQ** (compress, small recall loss). **Hybrid (dense + BM25 + RRF)** recovers exact tokens (codes/SKUs/names). **pgvector/OpenSearch to ~1–10M; dedicated (Pinecone/Milvus/Qdrant) beyond.** Number: 10M×768-dim×4B ≈ **30 GB raw**, HNSW ~1.5–2×, recall 95–99%, p99 single-digit–tens ms. **Pre-filter ACLs**, don't post-filter.

## Retrieval-Augmented Generation (RAG)
Ground a frozen, private-blind model in **fresh, citable** facts. **Two pipelines:** ingest (connect→parse→**chunk**→embed→index — *this is your freshness*) and query (embed→**retrieve**→**rerank**→assemble→**generate+cite**). **Retrieval is the bottleneck.** Chunk **256–1024 tok / 10–20% overlap** (structure-aware default); retrieve wide (**top-k 20–50**) → cross-encoder **rerank to 3–8**; instruct "answer only from context, else refuse." **ACL filter at retrieval, never on output.** Eval = retrieval recall **and** faithfulness, separately. Signature failure: **confident, well-cited, wrong.**

## LLM Inference & Serving
**GPU HBM is the binding resource.** Weights: 70B fp16 = **140 GB** (multi-GPU or quantize). **KV cache** grows with sequence length, competes with weights for HBM → **bounds batch size → bounds throughput.** **Continuous/in-flight batching (vLLM/TGI) = 2–20× vs static**; PagedAttention cuts fragmentation. **Quantize int8/int4 = 2–4× memory cut**, quality trade. TTFT ↔ throughput tension. **GPU autoscaling is slow** (model-load cold start) → provision the floor, queue/shed spikes. *Full RESHADED walkthrough = the LLM-serving design problem.*

## Adapting the Model: Prompt vs RAG vs Fine-Tune
Spectrum cheap→dear: **prompt → context/RAG → fine-tune (LoRA) → full FT → pretrain (≈never).** Decision: **fresh/private facts → RAG; behavior/format/tone/skill → fine-tune; both → compose; latency/cost at fixed quality → distill.** **Fine-tuning ≠ facts** (the classic mistake). Real fine-tune cost is **data curation + eval harness + retraining as the base model moves**, not GPU hours. **Default prompt+RAG; earn the right to fine-tune** with eval proof + a data/ops plan.

## Guardrails, Safety & Security
The model treats **all context as instructions** — no data/command separation. Threats: **prompt injection** (direct + **indirect** via retrieved docs/tools), jailbreaks, PII/secret leakage, **insecure output handling** (output is untrusted input downstream). Defense-in-depth: input/output classifiers (**Llama Guard**, NeMo), **structured output + schema validation**, PII redaction, grounding/citation. **Injection is unsolved → contain (least privilege, output untrusted, small blast radius), not prevent.** Anchor on the **OWASP LLM Top-10**. (Agent *action* safety = the agent-safety block.)

## Evaluation & LLMOps
**Eval is your regression suite** — open-ended, nondeterministic output means you can't eyeball it. Offline: **golden sets** + **LLM-as-judge** (biases: position/verbosity/self-preference → **pairwise + rubrics + human calibration**). RAG → faithfulness + context recall; classification → P/R/F1. Online: A/B + explicit/implicit feedback. **Gate every prompt/model/RAG change in CI**; a silent vendor model update must re-pass. **Trace** prompts/retrieval/tool-calls/tokens/cost/latency (LangSmith/Langfuse/Phoenix). You own the bar and the gate.

## Cost & Latency Optimization
**Cost = (input + output tokens) × price; output dominates; scales with usage** (a viral feature blows the budget). **Latency = TTFT + output_tokens × TPOT** (+ retrieval/tool round-trips). Levers (each with its quality/latency trade): **prompt caching** (~up to 90% off cached prefix + lower TTFT) · **semantic caching** (big savings, *correctness risk* → bound by similarity threshold/scope) · **routing/cascade** (cheap model default, escalate → **5–10×** when cheap handles the majority) · distill · **batch API ~50% off** · output caps · streaming (perceived only). **Design $/request up front.**

## The Agent Loop
An agent = **the LLM chooses the control flow** (which tool, whether to continue), vs a workflow's fixed recipe. Loop: observe→think/plan→**act (tool)**→observe→repeat→**stop**. Patterns: **ReAct** (reason+act), plan-then-execute, **reflection** (self-critique). **Reliability compounds: 95%/step × 10 steps ≈ 60%** — autonomy multiplies failure. **Stop condition + step/token/time budget are mandatory.** **Prefer the most constrained thing that works** — a deterministic workflow beats a free agent on reliability, cost, and debuggability.

## Tool Use, Function Calling & MCP
Model emits a **structured tool call** (JSON schema) → **your code executes** → result returns to context → model continues (the model never runs anything). **Tool name/description/schema quality matters more than the model**; **too many tools degrades selection** (keep to a handful–dozens; group/retrieve). **MCP** (open standard: tools/resources/prompts, client–server) = the **integration bet** — write once, reuse across hosts. Risk: tools run with **real privileges** → least privilege, sandbox, **HITL for dangerous/irreversible**, **idempotent** calls; **indirect injection → tool call** is the threat. Treat tool output as untrusted.

## Agent Memory & Context Management
**Context window = RAM** (finite, paid, wiped); long-term memory = **disk you page in.** You can't just append (cost + "lost in the middle"/context rot). Types: **working** (in-context now) · **episodic** (past events) · **semantic** (facts) · **procedural** (skills/prefs). Strategies: **summarize/compact**, sliding window, **retrieve relevant memory (memory = RAG)**, hierarchical (recent verbatim + summarized middle + retrievable archive). **Write/update/forget policy is a privacy surface.** Failures: blown budget, forgotten key facts, stale/conflicting memories.

## Multi-Agent Orchestration
One generalist vs a managed team. Patterns: **orchestrator-worker** (workhorse) · hierarchical · pipeline · debate/critic · blackboard · handoff/swarm. **Cost: N agents × turns ≈ ~10–15× the tokens of one chat**, plus coordination overhead and error compounding. **Helps:** parallelizable, **independently-verifiable** subtasks (research fan-out). **Hurts:** tightly-coupled, shared-state, ordered tasks (editing one doc, a transaction) → single agent or a workflow wins. **Default single; justify multi by parallelism + verifiability**, and name the token multiplier.

## Durable Agent Runtime & Human-in-the-Loop
A production agent is a **long-running, stateful, failure-prone distributed workflow.** **Durable execution** (Temporal / Step Functions / Restate / LangGraph-persistence) **checkpoints state → resume, not restart** (restart = double side effects). **Idempotent tool calls** so a retry doesn't double-act. **HITL is a design primitive** — gate by **reversibility × blast radius** (approval, interrupt/resume, escalation). **Step/token/time budgets + a kill switch** (an autonomous loop on paid APIs is a cost incident). Full trace for replay/audit.

## Agent Safety, Governance & Evaluation
A wrong chatbot *says* something false; a wrong **agent *does* something.** **Autonomy is a dial set by reversibility × blast radius**: suggest → execute-with-approval → bounded-auto → full-auto. **Least-privilege, scoped per tool/resource**; **sandbox** code/untrusted ops (microVM/gVisor); guardrails = allow-lists, spend/rate caps, dry-run/reversibility. **Injection → action is the threat** (contain via least privilege + HITL + untrusted tool output). **Eval the trajectory, not just the final answer**; **audit every action** with attribution.

## AI Strategy & Build-vs-Buy *(leadership)*
Spectrum: **frontier API → open-weights self-host → fine-tune → build-from-scratch (the rejected default** for all but frontier labs — name and kill it). Answer is a **sequence: buy-to-learn (API behind a gateway) → build the moat (data + eval + product) → self-host/fine-tune only where earned.** **Self-host wins only past the utilization crossover** (sustained high-hundreds-of-millions–billions tokens/mo on a near-saturated fleet + a standing platform team) **or under a hard data-residency constraint.** **Reversible** (API + gateway) vs **one-way door** (train a model) — spend conviction accordingly. **The moat is never the model.**

## Leading AI Adoption: Governance, Risk & Cost *(leadership)*
Shipping the demo is 20%; **owning governance, money, data, and judgment is the 80%.** The accountabilities: **governance/responsible-AI** (EU AI Act tiers, NIST AI RMF, a review process) · **data & privacy** (what may train/ground, residency, IP, **vendor "do you train on our prompts?" terms**) · **security** (injection, exfil, **shadow AI**) · **FinOps** (usage cost can **lose money per user** → per-feature unit economics, quotas) · **org/talent** (upskill app eng + a small platform/eval team, not a research lab) · **ROI** (resist AI-washing; tie to outcomes; **the courage to not ship**) · ops for nondeterministic systems.

---

## Director through-line (all 16)
Classify the **real binding constraint** (retrieval quality / context budget / GPU economics / reliability-over-N-steps / cost-per-request / action blast radius), not "which model." · Pick from the **requirement**, name the **rejected alternative and its cost**, **quantify** the dropped side (tokens, $, latency, recall, success rate). · **Delegate IC depth with a stated prior** ("I'd have the team benchmark a cross-encoder reranker against our golden set; my prior is it fixes most wrong answers before we touch the model"). · Always carry the **cost, governance, and on-call** dimension — and remember the model commoditizes while your **data, eval, and product** compound.

> **Spaced-repetition recap:** GenAI inverts the system-design reflex — **the model is the cheap, swappable part; retrieval, eval, memory, tools, guardrails, and the cost model are the asset.** Concepts: LLM = stateless/stochastic/token-metered (output tokens = cost); **RAG bottleneck is retrieval, not the model**; HNSW + hybrid + ACL-pre-filter for vectors; GPU HBM + continuous batching bound serving; **fine-tune behavior, RAG facts**; **prompt injection is contained, not prevented**; **eval is the regression gate**; cost levers = prompt/semantic cache + routing/cascade. Agentic: agent = LLM chooses control flow, **reliability ≈ p^N → prefer workflows**; tools/MCP are value + blast radius; **context = RAM**; multi-agent = ~10–15× tokens, use only for parallel+verifiable; **durable runtime + idempotent tools + HITL by reversibility**; **autonomy is a reversibility-gated dial**. Leadership: **buy-to-learn → build the moat → self-host where earned**; **the moat is never the model**; own governance, FinOps, data privacy, and the courage to not ship.
