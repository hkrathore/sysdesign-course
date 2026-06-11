import React, { useState, useMemo } from "react";
import { Plus, Minus, RotateCcw, Hash, Scale, Move } from "lucide-react";

// --- deterministic 32-bit hash, no crypto, fully self-contained -------------
// FNV-1a accumulate + a MurmurHash3 finalizer. The finalizer's avalanche is what
// makes near-identical inputs ("A#0","A#1", "key:0","key:1") scatter across the
// ring; plain FNV-1a clusters them and produces dead arcs / zero-load nodes.
const RING = 0x100000000; // 2^32
function mix32(h) {
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}
function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return mix32(h >>> 0); // unsigned 32-bit == position on the 0..2^32 ring
}

// Stable, distinct colors for physical nodes (dark-tech palette).
const NODE_COLORS = [
  "#2dd4a7", "#38bdf8", "#e8a13a", "#f87171",
  "#a78bfa", "#f472b6", "#facc15", "#34d399",
];

// A fixed pool of keys placed on the ring. Deterministic, so remaps are
// reproducible. 200 keys is enough sample for the moved fraction to land near
// K/N and for the vnode slider to visibly smooth load; drawn as a density band.
const KEYS = Array.from({ length: 200 }, (_, i) => `key:${i}`);

const NODE_NAMES = ["A", "B", "C", "D", "E", "F", "G", "H"];

const PRESETS = {
  "3 nodes · 1 vnode": { count: 3, vnodes: 1 },
  "4 nodes · 8 vnodes": { count: 4, vnodes: 8 },
  "6 nodes · 64 vnodes": { count: 6, vnodes: 64 },
};

// position (0..2^32) -> angle in degrees, 0 at top (12 o'clock), clockwise.
const posToAngle = (pos) => (pos / RING) * 360 - 90;
const polar = (cx, cy, r, deg) => {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
};

// Build all virtual tokens for the current physical nodes, sorted by ring pos.
function buildTokens(nodes, vnodes) {
  const toks = [];
  nodes.forEach((name) => {
    for (let v = 0; v < vnodes; v++) {
      toks.push({ owner: name, pos: hash32(`${name}#${v}`) });
    }
  });
  toks.sort((a, b) => a.pos - b.pos);
  return toks;
}

// For a key position, owner = first token clockwise (wrap to first token).
function ownerOf(keyPos, tokens) {
  if (tokens.length === 0) return null;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].pos >= keyPos) return tokens[i].owner;
  }
  return tokens[0].owner; // wrapped past the top
}

export default function ConsistentHashingRing() {
  const [nodes, setNodes] = useState(["A", "B", "C"]);
  const [vnodes, setVnodes] = useState(8);
  const [activePreset, setActivePreset] = useState(null);
  const [movedKeys, setMovedKeys] = useState(new Set());
  const [lastEvent, setLastEvent] = useState(null); // { type, node, moved, total }

  const colorOf = (name) => NODE_COLORS[NODE_NAMES.indexOf(name) % NODE_COLORS.length];

  // Current placement of physical-node colored ticks (one per vnode), keys, ownership.
  const model = useMemo(() => {
    const tokens = buildTokens(nodes, vnodes);
    const keyPlacements = KEYS.map((k) => ({ id: k, pos: hash32(k) }));
    const owners = {};
    const load = Object.fromEntries(nodes.map((n) => [n, 0]));
    keyPlacements.forEach(({ id, pos }) => {
      const o = ownerOf(pos, tokens);
      owners[id] = o;
      if (o != null) load[o] += 1;
    });
    return { tokens, keyPlacements, owners, load };
  }, [nodes, vnodes]);

  // Apply a membership change, diff ownership vs the pre-change snapshot.
  function applyChange(type, nextNodes) {
    const before = {};
    const beforeTokens = buildTokens(nodes, vnodes);
    KEYS.forEach((k) => { before[k] = ownerOf(hash32(k), beforeTokens); });

    const afterTokens = buildTokens(nextNodes, vnodes);
    const moved = new Set();
    KEYS.forEach((k) => {
      const a = ownerOf(hash32(k), afterTokens);
      if (a !== before[k]) moved.add(k);
    });

    setMovedKeys(moved);
    setLastEvent({ type, moved: moved.size, total: KEYS.length, from: nodes.length, to: nextNodes.length });
    setNodes(nextNodes);
    setActivePreset(null);
  }

  const addNode = () => {
    if (nodes.length >= NODE_NAMES.length) return;
    const next = NODE_NAMES.find((n) => !nodes.includes(n));
    applyChange("add", [...nodes, next]);
  };
  const removeNode = () => {
    if (nodes.length <= 1) return;
    applyChange("remove", nodes.slice(0, -1));
  };
  const changeVnodes = (v) => {
    setVnodes(v);
    setMovedKeys(new Set());
    setLastEvent(null);
    setActivePreset(null);
  };
  const applyPreset = (name) => {
    const p = PRESETS[name];
    setNodes(NODE_NAMES.slice(0, p.count));
    setVnodes(p.vnodes);
    setMovedKeys(new Set());
    setLastEvent(null);
    setActivePreset(name);
  };
  const reset = () => {
    setNodes(["A", "B", "C"]);
    setVnodes(8);
    setMovedKeys(new Set());
    setLastEvent(null);
    setActivePreset(null);
  };

  // --- SVG geometry ---------------------------------------------------------
  const SIZE = 300, CX = SIZE / 2, CY = SIZE / 2, R = 118, TICK = 12;

  // Per-node load stats for the bar chart + balance read-out.
  // Skew = stddev / ideal (relative load imbalance). It shrinks as vnodes rise
  // and as keys grow; reported as a quiet footnote, not the headline.
  const ideal = KEYS.length / nodes.length;
  const loads = nodes.map((n) => model.load[n]);
  const maxLoad = Math.max(1, ...loads);
  const skew = loads.length
    ? Math.sqrt(loads.reduce((a, v) => a + (v - ideal) ** 2, 0) / loads.length) / ideal
    : 0;

  const accent = "#2dd4a7";

  return (
    <div className="not-content w-full max-w-3xl mx-auto font-mono text-[var(--w-text)]" style={{ background: "transparent" }}>
      <div className="rounded-xl border border-[var(--w-border)] bg-[var(--w-bg)] p-5 shadow-2xl">
        <div className="flex items-center gap-2 mb-1">
          <Hash size={20} style={{ color: accent }} />
          <h2 className="text-lg font-bold tracking-tight text-[var(--w-heading)]">Consistent Hashing Ring</h2>
        </div>
        <p className="text-xs text-[var(--w-muted)] mb-4">
          The ring is the 32-bit hash space <span className="text-[var(--w-text)]">0 … 2³²</span> bent into a circle. A key is owned by the
          first node <span className="text-[var(--w-text)]">clockwise</span>. Add or remove a node and watch how few keys actually move.
        </p>

        {/* presets */}
        <div className="flex flex-wrap items-stretch gap-2 mb-5">
          {Object.keys(PRESETS).map((name) => (
            <button
              key={name}
              onClick={() => applyPreset(name)}
              className={`h-full px-3 py-1.5 rounded-md text-xs border transition ${
                activePreset === name
                  ? "border-emerald-400 bg-emerald-400/15 text-emerald-300"
                  : "border-[var(--w-border)] bg-[var(--w-panel)] text-[var(--w-text)] hover:border-[var(--w-muted)]"
              }`}
            >
              {name}
            </button>
          ))}
          <button
            onClick={reset}
            className="h-full px-3 py-1.5 rounded-md text-xs border border-[var(--w-border)] bg-[var(--w-panel)] text-[var(--w-muted)] hover:border-[var(--w-muted)] transition flex items-center gap-1"
          >
            <RotateCcw size={12} /> reset
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 items-stretch gap-5">
          {/* ---- the ring ---- */}
          <div className="flex flex-col items-center h-full">
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[320px]">
              {/* base ring */}
              <circle cx={CX} cy={CY} r={R} fill="none" style={{ stroke: "var(--w-panel-2)" }} strokeWidth="10" />
              {/* clockwise direction marker at the top (position 0 / 2^32) */}
              <text x={CX} y={CY - R - 6} textAnchor="middle" className="fill-[var(--w-faint)]" fontSize="9">0 / 2³²</text>
              <path
                d={`M ${CX + 16} ${CY - R} a 16 16 0 0 1 8 5`}
                fill="none" style={{ stroke: "var(--w-faint)" }} strokeWidth="1.5" markerEnd="url(#arrow)"
              />
              <defs>
                <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" style={{ fill: "var(--w-faint)" }} />
                </marker>
              </defs>

              {/* virtual-node ticks, colored by physical owner */}
              {model.tokens.map((t, i) => {
                const a = posToAngle(t.pos);
                const [x1, y1] = polar(CX, CY, R - TICK / 2, a);
                const [x2, y2] = polar(CX, CY, R + TICK / 2, a);
                return (
                  <line key={`tok-${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={colorOf(t.owner)} strokeWidth={vnodes > 24 ? 1.5 : 3} strokeLinecap="round" opacity={0.95} />
                );
              })}

              {/* node labels, only for the primary token of each physical node (vnodes==low) */}
              {vnodes <= 8 && nodes.map((n) => {
                const pos = hash32(`${n}#0`);
                const a = posToAngle(pos);
                const [lx, ly] = polar(CX, CY, R + 24, a);
                return (
                  <g key={`lbl-${n}`}>
                    <circle cx={lx} cy={ly} r="9" fill={colorOf(n)} opacity="0.18" />
                    <text x={lx} y={ly + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill={colorOf(n)}>{n}</text>
                  </g>
                );
              })}

              {/* keys as a density band just inside the ring.
                  Resting keys are tiny owner-colored dots; remapped keys glow
                  yellow with a soft halo so the handed-off arc(s) pop. Draw
                  moved keys last (on top) so they aren't buried by the band. */}
              {[...model.keyPlacements]
                .sort((a, b) => Number(movedKeys.has(a.id)) - Number(movedKeys.has(b.id)))
                .map((k) => {
                  const a = posToAngle(k.pos);
                  const [kx, ky] = polar(CX, CY, R - 26, a);
                  const moved = movedKeys.has(k.id);
                  const c = colorOf(model.owners[k.id]);
                  return (
                    <g key={k.id}>
                      {moved && <circle cx={kx} cy={ky} r="4.2" fill="#fde047" opacity="0.22" />}
                      <circle cx={kx} cy={ky} r={moved ? 2.6 : 1.6}
                        fill={moved ? "#fde047" : c}
                        stroke={moved ? "#facc15" : "none"} strokeWidth="0.4"
                        opacity={moved ? 1 : 0.8} />
                    </g>
                  );
                })}

              {/* center read-out */}
              <text x={CX} y={CY - 6} textAnchor="middle" fontSize="11" className="fill-[var(--w-muted)]">{KEYS.length} keys</text>
              <text x={CX} y={CY + 12} textAnchor="middle" fontSize="11" className="fill-[var(--w-muted)]">
                {nodes.length} {nodes.length === 1 ? "node" : "nodes"} · {vnodes} vnode{vnodes > 1 ? "s" : ""}
              </text>
            </svg>

            {/* add/remove controls */}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={removeNode}
                disabled={nodes.length <= 1}
                className="px-3 py-1.5 rounded-md text-xs border border-rose-500/50 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Minus size={13} /> remove node
              </button>
              <button
                onClick={addNode}
                disabled={nodes.length >= NODE_NAMES.length}
                className="px-3 py-1.5 rounded-md text-xs border border-emerald-400/60 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20 transition flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus size={13} /> add node
              </button>
            </div>
          </div>

          {/* ---- right column: vnodes slider + outputs ---- */}
          <div className="flex flex-col gap-4">
            {/* virtual nodes slider */}
            <div className="rounded-lg border border-[var(--w-border-soft)] bg-[var(--w-panel)] p-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--w-muted)] flex items-center gap-1"><Move size={12} /> Virtual nodes / physical node</span>
                <span className="text-[var(--w-heading)] font-semibold">{vnodes}</span>
              </div>
              <input
                type="range" min={1} max={100} step={1} value={vnodes}
                onChange={(e) => changeVnodes(parseInt(e.target.value, 10))}
                className="w-full accent-sky-400 cursor-pointer"
              />
              <div className="text-[10px] text-[var(--w-faint)] mt-1">
                More tokens per node ⇒ each node owns many small arcs ⇒ smoother load. Production rings use 100-256.
              </div>
            </div>

            {/* remap read-out */}
            <div className={`rounded-lg border p-3 ${lastEvent ? "border-amber-500/50 bg-amber-500/5" : "border-[var(--w-border-soft)] bg-[var(--w-panel)]"}`}>
              <div className="flex items-center gap-1.5 mb-1 text-amber-300">
                <RotateCcw size={14} />
                <span className="text-[11px] uppercase tracking-wide text-[var(--w-muted)]">Keys remapped on last change</span>
              </div>
              {lastEvent ? (
                <>
                  <div className="text-xl font-bold text-[var(--w-heading)] leading-tight">
                    {lastEvent.moved} / {lastEvent.total}
                    <span className="text-amber-300 text-base"> ({((lastEvent.moved / lastEvent.total) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="text-[10px] text-[var(--w-faint)] mt-0.5">
                    {lastEvent.type === "add" ? "added" : "removed"} a node · theory ≈ K/N = {KEYS.length}/{Math.max(lastEvent.from, lastEvent.to)} ≈ {(KEYS.length / Math.max(lastEvent.from, lastEvent.to)).toFixed(1)} keys ({(100 / Math.max(lastEvent.from, lastEvent.to)).toFixed(0)}%)
                  </div>
                </>
              ) : (
                <div className="text-sm text-[var(--w-faint)]">Add or remove a node to see the moved fraction. Naive `hash % N` would move ~100%.</div>
              )}
            </div>

            {/* per-node load */}
            <div className="rounded-lg border border-[var(--w-border-soft)] bg-[var(--w-panel)] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-wide text-[var(--w-muted)] flex items-center gap-1"><Scale size={12} /> Per-node load</span>
                <span className="text-[10px] text-[var(--w-faint)]">ideal {ideal.toFixed(1)} · skew {(skew * 100).toFixed(0)}%</span>
              </div>
              <div className="space-y-1.5">
                {nodes.map((n) => {
                  const v = model.load[n];
                  return (
                    <div key={n} className="flex items-center gap-2">
                      <span className="w-4 text-[11px] font-bold" style={{ color: colorOf(n) }}>{n}</span>
                      <div className="flex-1 h-4 rounded bg-[var(--w-slot)] overflow-hidden relative">
                        {/* ideal marker */}
                        <div className="absolute top-0 bottom-0 w-px" style={{ left: `${(ideal / maxLoad) * 100}%`, background: "var(--w-faint)" }} />
                        <div className="h-full rounded transition-all duration-500"
                          style={{ width: `${(v / maxLoad) * 100}%`, background: colorOf(n), opacity: 0.85 }} />
                      </div>
                      <span className="w-7 text-[11px] text-right text-[var(--w-text)]">{v}</span>
                    </div>
                  );
                })}
              </div>
              <div className="text-[10px] text-[var(--w-faint)] mt-1.5">
                Line = perfectly even share. At 1 vnode the split is lumpy; by ~64+ it tightens (residual noise also shrinks as keys grow).
              </div>
            </div>
          </div>
        </div>

        {/* governing rule */}
        <div className="mt-5 rounded-lg border border-[var(--w-border-soft)] bg-[var(--w-panel)] p-3">
          <div className="text-[11px] uppercase tracking-wide text-[var(--w-faint)] mb-1">Governing rule</div>
          <div className="text-xs text-[var(--w-text)] leading-relaxed">
            <span className="text-emerald-300">owner(key) = first token clockwise from hash(key)</span>. On a membership change only the
            keys in the arc handed off move: <span className="text-amber-300">≈ K/N keys</span> (one node's share), not all K.
            Virtual nodes split each physical node into many arcs, so removing a node spreads its keys across
            <span className="text-[var(--w-text)]"> all survivors</span> instead of dumping them on a single neighbor.
          </div>
        </div>

        <p className="text-[11px] text-[var(--w-faint)] mt-4 leading-relaxed">
          Interview point: the win isn't the ring, it's <span className="text-[var(--w-text)]">bounded disruption</span>, adding capacity
          remaps only its fair share, so cache hit-rate and rebalancing I/O stay survivable at scale (DynamoDB, Cassandra, and
          memcached clients all ride this). The cost is harder range scans and the need for vnodes to fix skew.
        </p>
      </div>
    </div>
  );
}
