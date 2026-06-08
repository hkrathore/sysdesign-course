import React, { useState, useMemo } from "react";
import { Network, ShieldCheck, Zap, Database, AlertTriangle, GitBranch, Server } from "lucide-react";

// --- PACELC quadrant knowledge base --------------------------------------
// P-side  : behavior during a network Partition  -> "A" (availability) or "C" (consistency)
// E-side  : behavior Else (no partition, steady state) -> "L" (latency) or "C" (consistency)
// Key is `${P}/${E}` e.g. "PA/EL".
const QUADRANTS = {
  "PC/EC": {
    accent: "#38bdf8",
    title: "PC / EC — consistency first, always",
    blurb:
      "Refuses to diverge. On partition it sacrifices availability; in steady state it pays latency for a synchronous/quorum path. The default for systems where a wrong read is worse than no read.",
    dbs: [
      { name: "Single-node RDBMS (Postgres / MySQL)", why: "One authority — no replicas to disagree; the partition just looks like downtime." },
      { name: "HBase / BigTable", why: "Single region-server owns each region; reads/writes route to that one master." },
      { name: "MongoDB (default majority writes)", why: "Primary + majority write concern; a partitioned primary steps down rather than split-brain." },
      { name: "Google Spanner", why: "TrueTime + Paxos commit; refuses to serve outside a consistent quorum, eats latency to stay linearizable." },
    ],
  },
  "PA/EL": {
    accent: "#2dd4a7",
    title: "PA / EL — available and fast, eventually consistent",
    blurb:
      "Stays up under partition and stays fast normally — both by allowing replicas to diverge and reconcile later. The default for high-scale, write-heavy, latency-sensitive workloads.",
    dbs: [
      { name: "Cassandra (R=W=1)", why: "Tunable quorum dialed to availability; sloppy quorum + hinted handoff absorb the partition." },
      { name: "DynamoDB (default eventual reads)", why: "Multi-AZ replicas, last-writer-wins; eventual reads skip the cross-replica wait." },
      { name: "Riak", why: "Dynamo-style vector clocks; takes writes on any reachable replica, resolves conflicts on read." },
    ],
  },
  "PA/EC": {
    accent: "#a78bfa",
    title: "PA / EC — available under partition, consistent when healthy",
    blurb:
      "A tuned middle: tolerate divergence only while the network is broken, but pay for strong reads once it heals. Usually a per-operation knob, not a fixed database personality.",
    dbs: [
      { name: "MongoDB (majority read + write concern)", why: "Reads from majority give linearizable-ish results when healthy; failover keeps it available during a split." },
      { name: "Cosmos DB (bounded-staleness / strong tiers)", why: "Per-request consistency level; relax to availability under partition, tighten in steady state." },
      { name: "Cassandra (LOCAL_QUORUM both ways)", why: "Quorum reads+writes overlap (W+R>N) for strong reads locally, still serves if a remote DC is cut off." },
    ],
  },
  "PC/EL": {
    accent: "#e8a13a",
    title: "PC / EL — consistent under partition, fast when healthy",
    blurb:
      "The rare corner: never serve stale data during a split (reject instead), but skip the synchronous path in steady state. Hard to build — most systems that want partition-consistency also want it always.",
    dbs: [
      { name: "PNUTS / Yahoo Sleepy", why: "Per-record master; local async reads when healthy, but routes through the master to stay consistent under partition." },
      { name: "Custom CP store + async read replicas", why: "Leader rejects on quorum loss (PC), yet serves fast local reads off followers when the network is intact (EL)." },
    ],
  },
};

// CAP partition outcome copy (the runtime decision once a partition is live)
const CAP_OUTCOMES = {
  C: {
    label: "Consistency (CP)",
    accent: "#38bdf8",
    icon: "shield",
    headline: "Reject the write / return an error on the minority side",
    points: [
      "The partition that can't reach a quorum stops accepting writes (and often strong reads).",
      "Clients see timeouts or explicit errors — never a stale-but-wrong answer.",
      "Recovery is trivial: nothing diverged, so there is no merge.",
    ],
    formula: "quorum_reachable == false  ⇒  refuse(write)   // sacrifice A to keep one truth",
  },
  A: {
    label: "Availability (AP)",
    accent: "#2dd4a7",
    icon: "zap",
    headline: "Serve the request — possibly stale — on both sides",
    points: [
      "Every reachable replica keeps answering reads and accepting writes independently.",
      "Both sides may diverge; reconciliation (LWW, vector clocks, CRDTs) happens after heal.",
      "No client-visible downtime — at the cost of temporary disagreement.",
    ],
    formula: "partition_active  ⇒  serve(local_replica)   // sacrifice C to keep answering",
  },
};

function Toggle({ active, onClick, accent, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-1.5 rounded-md text-xs border transition ${
        active
          ? "text-[var(--w-heading)]"
          : "border-[var(--w-border)] bg-[var(--w-panel)] text-[var(--w-text)] hover:border-[var(--w-faint)]"
      }`}
      style={active ? { borderColor: accent, background: `${accent}26`, color: accent } : undefined}
    >
      {children}
    </button>
  );
}

// Inline SVG: two nodes with a healthy link or a broken (partitioned) link
function PartitionDiagram({ partitioned, capChoice }) {
  const linkColor = partitioned ? "#f87171" : "#2dd4a7";
  const a = partitioned && capChoice === "C" ? 0.35 : 1; // dim minority side under CP
  return (
    <svg viewBox="0 0 320 90" className="w-full h-[90px]">
      {/* link */}
      {partitioned ? (
        <>
          <line x1="118" y1="45" x2="150" y2="45" stroke={linkColor} strokeWidth="3" />
          <line x1="170" y1="45" x2="202" y2="45" stroke={linkColor} strokeWidth="3" />
          <path d="M150 32 L170 58 M170 32 L150 58" stroke={linkColor} strokeWidth="2.5" />
        </>
      ) : (
        <line x1="118" y1="45" x2="202" y2="45" stroke={linkColor} strokeWidth="3" strokeDasharray="0" />
      )}
      {/* node A (region 1) */}
      <g opacity={partitioned && capChoice === "C" ? a : 1}>
        <rect x="40" y="25" width="78" height="40" rx="8" style={{ fill: "var(--w-panel-2)" }} stroke={linkColor} strokeWidth="1.5" />
        <text x="79" y="42" textAnchor="middle" fontSize="11" style={{ fill: "var(--w-text)" }} fontFamily="monospace">Region A</text>
        <text x="79" y="56" textAnchor="middle" fontSize="9" style={{ fill: "var(--w-faint)" }} fontFamily="monospace">
          {partitioned && capChoice === "C" ? "no quorum" : "serving"}
        </text>
      </g>
      {/* node B (region 2) */}
      <g>
        <rect x="202" y="25" width="78" height="40" rx="8" style={{ fill: "var(--w-panel-2)" }} stroke={linkColor} strokeWidth="1.5" />
        <text x="241" y="42" textAnchor="middle" fontSize="11" style={{ fill: "var(--w-text)" }} fontFamily="monospace">Region B</text>
        <text x="241" y="56" textAnchor="middle" fontSize="9" style={{ fill: "var(--w-faint)" }} fontFamily="monospace">
          {partitioned ? (capChoice === "A" ? "diverging" : "quorum") : "serving"}
        </text>
      </g>
    </svg>
  );
}

export default function CapPacelcExplorer() {
  const [partitioned, setPartitioned] = useState(true); // CAP: is a partition happening?
  const [capChoice, setCapChoice] = useState("C"); // "C" | "A" — the P-side decision
  const [elseChoice, setElseChoice] = useState("C"); // "L" | "C" — the E-side decision

  const accent = "#2dd4a7";

  // PACELC P-side comes straight from the CAP partition decision.
  const pSide = capChoice === "C" ? "PC" : "PA";
  const eSide = elseChoice === "C" ? "EC" : "EL";
  const pacelc = `${pSide}/${eSide}`;
  const quad = QUADRANTS[pacelc];

  const cap = CAP_OUTCOMES[capChoice];

  const presets = useMemo(
    () => [
      { name: "Postgres / Spanner", partitioned: true, cap: "C", else: "C" },   // PC/EC
      { name: "Cassandra / Dynamo", partitioned: true, cap: "A", else: "L" },   // PA/EL
      { name: "MongoDB (majority)", partitioned: true, cap: "A", else: "C" },   // PA/EC
    ],
    []
  );
  const activePreset = presets.find(
    (p) => p.partitioned === partitioned && p.cap === capChoice && p.else === elseChoice
  );

  const card = "rounded-lg border border-[var(--w-border-soft)] bg-[var(--w-panel)] p-4";

  return (
    <div className="not-content w-full max-w-3xl mx-auto font-mono text-[var(--w-text)]" style={{ background: "transparent" }}>
      <div className="rounded-xl border border-[var(--w-border)] bg-[var(--w-bg)] p-5 shadow-2xl">
        {/* header */}
        <div className="flex items-center gap-2 mb-1">
          <Network size={20} style={{ color: accent }} />
          <h2 className="text-lg font-bold tracking-tight text-[var(--w-heading)]">CAP &amp; PACELC Explorer</h2>
        </div>
        <p className="text-xs text-[var(--w-muted)] mb-4">
          CAP only forces a choice <span className="text-rose-300">when a partition occurs</span>. The rest of the time
          (the <span className="text-[var(--w-text)]">Else</span> in PACELC) you still trade latency vs consistency.
        </p>

        {/* presets */}
        <div className="flex flex-wrap gap-2 mb-5 items-stretch">
          {presets.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => {
                setPartitioned(p.partitioned);
                setCapChoice(p.cap);
                setElseChoice(p.else);
              }}
              className={`px-3 py-1.5 rounded-md text-xs border transition ${
                activePreset && activePreset.name === p.name
                  ? "border-emerald-400 bg-emerald-400/15 text-emerald-300"
                  : "border-[var(--w-border)] bg-[var(--w-panel)] text-[var(--w-text)] hover:border-[var(--w-faint)]"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* ===================== PART 1 — CAP ===================== */}
        <div className={`${card} mb-4`}>
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <GitBranch size={16} style={{ color: partitioned ? "#f87171" : "#2dd4a7" }} />
              <span className="text-[11px] uppercase tracking-wide text-[var(--w-muted)]">CAP — partition state</span>
            </div>
            <div className="flex gap-2">
              <Toggle active={!partitioned} onClick={() => setPartitioned(false)} accent="#2dd4a7">
                ○ No partition (P healthy)
              </Toggle>
              <Toggle active={partitioned} onClick={() => setPartitioned(true)} accent="#f87171">
                ⚡ Partition active
              </Toggle>
            </div>
          </div>

          <PartitionDiagram partitioned={partitioned} capChoice={capChoice} />

          {partitioned ? (
            <>
              <div className="flex items-center gap-2 mt-3 mb-2 text-[11px] text-[var(--w-muted)]">
                Network is split — you must pick one. <span className="text-[var(--w-faint)]">(CA is off the table now.)</span>
              </div>
              <div className="flex gap-2 mb-3">
                <Toggle active={capChoice === "C"} onClick={() => setCapChoice("C")} accent={CAP_OUTCOMES.C.accent}>
                  Consistency (CP)
                </Toggle>
                <Toggle active={capChoice === "A"} onClick={() => setCapChoice("A")} accent={CAP_OUTCOMES.A.accent}>
                  Availability (AP)
                </Toggle>
              </div>

              {/* CAP outcome panel */}
              <div className="rounded-lg border p-3" style={{ borderColor: `${cap.accent}55`, background: `${cap.accent}0d` }}>
                <div className="flex items-center gap-1.5 mb-1.5" style={{ color: cap.accent }}>
                  {cap.icon === "shield" ? <ShieldCheck size={16} /> : <Zap size={16} />}
                  <span className="text-sm font-bold">{cap.headline}</span>
                </div>
                <ul className="space-y-1">
                  {cap.points.map((pt, i) => (
                    <li key={i} className="text-[11px] text-[var(--w-text)] leading-snug flex gap-1.5">
                      <span style={{ color: cap.accent }}>›</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-[10px] text-[var(--w-faint)] mt-2 border-t border-[var(--w-border-soft)] pt-2">
                  rule: <span className="text-[var(--w-muted)]">{cap.formula}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-3 rounded-lg border border-[var(--w-border-soft)] bg-[var(--w-panel)] p-3 text-[11px] text-[var(--w-muted)] leading-snug">
              No partition, so <span className="text-emerald-300">C and A are both satisfiable</span> — CAP imposes no
              choice here. This is exactly the regime CAP is silent about and PACELC fills in below.
            </div>
          )}
        </div>

        {/* "CA is not a runtime choice" callout */}
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 flex gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-400" />
          <p className="text-[11px] text-amber-100/90 leading-snug">
            <span className="font-semibold text-amber-300">CA is not a runtime option.</span> Once a partition happens,
            the only live choice is <span className="text-sky-300">C</span> or <span className="text-emerald-300">A</span>.
            A "CA system" really means <span className="italic">single-node / no replication</span> — it just declines to
            tolerate partitions, so it has no third behavior to switch to. P is a fact of the network, not a setting.
          </p>
        </div>

        {/* ===================== PART 2 — PACELC Else ===================== */}
        <div className={`${card} mb-4`}>
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Zap size={16} style={{ color: accent }} />
              <span className="text-[11px] uppercase tracking-wide text-[var(--w-muted)]">PACELC — Else (no partition)</span>
            </div>
            <div className="flex gap-2">
              <Toggle active={elseChoice === "L"} onClick={() => setElseChoice("L")} accent="#2dd4a7">
                Latency (EL)
              </Toggle>
              <Toggle active={elseChoice === "C"} onClick={() => setElseChoice("C")} accent="#38bdf8">
                Consistency (EC)
              </Toggle>
            </div>
          </div>
          <p className="text-[11px] text-[var(--w-muted)] leading-snug">
            Even with the network healthy, a replicated write must either wait for replicas to agree
            (<span className="text-sky-300">EC</span>, higher latency) or ack early and propagate async
            (<span className="text-emerald-300">EL</span>, faster but stale-readable). This is the trade CAP never mentions.
          </p>
        </div>

        {/* ===================== RESULT — PACELC string + DBs ===================== */}
        <div className="rounded-lg border p-4" style={{ borderColor: `${quad.accent}55`, background: `${quad.accent}0d` }}>
          <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
            <div className="flex items-center gap-2">
              <Database size={18} style={{ color: quad.accent }} />
              <span className="text-[11px] uppercase tracking-wide text-[var(--w-muted)]">Classification</span>
            </div>
            <div className="text-2xl font-bold tracking-tight" style={{ color: quad.accent }}>
              {pacelc}
            </div>
          </div>
          <div className="text-sm font-semibold text-[var(--w-heading)] mb-1">{quad.title}</div>
          <p className="text-[11px] text-[var(--w-text)] leading-snug mb-3">{quad.blurb}</p>

          {/* governing formula */}
          <div className="text-[10px] text-[var(--w-faint)] mb-3 border-y border-[var(--w-border-soft)] py-2">
            PACELC: <span className="text-[var(--w-muted)]">if (Partition) then ({pSide === "PC" ? "Consistency" : "Availability"}) else ({eSide === "EC" ? "Consistency" : "Latency"})</span>
            <span className="text-[var(--w-faint)]"> — read as {pacelc}</span>
          </div>

          <div className="text-[10px] uppercase tracking-wide text-[var(--w-faint)] mb-2 flex items-center gap-1.5">
            <Server size={12} /> Real systems in this quadrant
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-stretch">
            {quad.dbs.map((db) => (
              <div key={db.name} className="rounded-md border border-[var(--w-border-soft)] bg-[var(--w-bg)] p-2.5 h-full flex flex-col">
                <div className="text-xs font-semibold mb-0.5" style={{ color: quad.accent }}>{db.name}</div>
                <div className="text-[10px] text-[var(--w-muted)] leading-snug">{db.why}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-[var(--w-faint)] mt-5 leading-relaxed">
          Interview point: don't say "it's CP" — say{" "}
          <span className="text-[var(--w-text)]">"{pacelc}: under partition it favors {pSide === "PC" ? "consistency" : "availability"}, and even when healthy it favors {eSide === "EC" ? "consistency over latency" : "latency over consistency"}."</span>{" "}
          The EL/EC half is what separates Cassandra from a single-node Postgres even though both can be called "available," and it's almost always a per-operation tuning knob, not a fixed property of the engine.
        </p>
      </div>
    </div>
  );
}
