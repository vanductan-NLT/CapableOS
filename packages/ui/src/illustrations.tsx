import type { SVGProps } from "react";

// Inline-SVG illustrations — the product's core idea ("human + AI routing"), drawn.
// Decorative by default (aria-hidden). Colours via CSS vars so they adapt to dark mode.
// Animation via CSS classes (globals.css) → auto-stilled under prefers-reduced-motion.
// Palette: teal var(--b)=human/workspace, purple var(--a)=AI, gold var(--gold)=hybrid/shared.

type Props = SVGProps<SVGSVGElement>;

/* ── ⑤ node glyphs, reused everywhere ──────────────────── */
function HumanNode({ x, y, r = 18 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="var(--b-soft)" stroke="var(--b-line)" />
      <circle cx={x} cy={y - r * 0.28} r={r * 0.28} fill="var(--b)" />
      <path
        d={`M${x - r * 0.5} ${y + r * 0.5} Q${x} ${y + r * 0.02} ${x + r * 0.5} ${y + r * 0.5}`}
        fill="none"
        stroke="var(--b)"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </g>
  );
}
function AgentNode({ x, y, r = 18 }: { x: number; y: number; r?: number }) {
  const pts = [
    [x, y - r],
    [x + r * 0.87, y - r * 0.5],
    [x + r * 0.87, y + r * 0.5],
    [x, y + r],
    [x - r * 0.87, y + r * 0.5],
    [x - r * 0.87, y - r * 0.5],
  ]
    .map((p) => p.map((n) => n.toFixed(1)).join(","))
    .join(" ");
  return (
    <g>
      <polygon points={pts} fill="var(--a-soft)" stroke="var(--a)" strokeWidth={1.5} />
      <circle cx={x} cy={y} r={r * 0.22} fill="var(--a)" />
    </g>
  );
}
function HybridNode({ x, y, r = 15 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <path d={`M${x} ${y - r} A${r} ${r} 0 0 0 ${x} ${y + r} Z`} fill="var(--b)" opacity={0.85} />
      <path d={`M${x} ${y - r} A${r} ${r} 0 0 1 ${x} ${y + r} Z`} fill="var(--a)" opacity={0.85} />
      <circle cx={x} cy={y} r={r} fill="none" stroke="var(--gold)" strokeWidth={1.6} />
    </g>
  );
}

/* ── ① Command hero: the blue routing pipeline (icon-only nodes) ──────── */
export function RoutingPipeline({ className, ...props }: Props) {
  return (
    <svg
      viewBox="0 0 680 220"
      role="img"
      aria-label="Định tuyến: lời của bạn đi qua bộ điều phối rồi chia tới Người, AI hoặc Kết hợp"
      className={["h-auto w-full", className].filter(Boolean).join(" ")}
      {...props}
    >
      <defs>
        <linearGradient id="orch-router" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--brand-deep)" />
          <stop offset="1" stopColor="var(--brand)" />
        </linearGradient>
        <filter id="orch-bloom" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <filter id="orch-soft" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(37,99,235,.22)" />
        </filter>
      </defs>

      {/* soft color blooms behind the destination nodes */}
      <circle cx="540" cy="54" r="26" fill="var(--b)" filter="url(#orch-bloom)" opacity="0.26" />
      <circle cx="540" cy="110" r="30" fill="var(--a)" filter="url(#orch-bloom)" opacity="0.32" />
      <circle cx="540" cy="166" r="26" fill="var(--gold)" filter="url(#orch-bloom)" opacity="0.26" />

      {/* base wires */}
      <g fill="none" strokeLinecap="round" strokeWidth="3" opacity="0.3">
        <path stroke="var(--brand)" d="M100 110 H294" />
        <path stroke="var(--b)" d="M366 110 C 445 110, 470 54, 516 54" />
        <path stroke="var(--a)" d="M366 110 H516" />
        <path stroke="var(--gold)" d="M366 110 C 445 110, 470 166, 516 166" />
      </g>

      {/* animated flow pulses */}
      <g fill="none" strokeLinecap="round" strokeWidth="3">
        <path className="orch-flow" stroke="var(--brand)" d="M100 110 H294" />
        <path className="orch-flow" style={{ animationDelay: "0.15s" }} stroke="var(--b)" d="M366 110 C 445 110, 470 54, 516 54" />
        <path className="orch-flow" stroke="var(--a)" d="M366 110 H516" />
        <path className="orch-flow" style={{ animationDelay: "0.3s" }} stroke="var(--gold)" d="M366 110 C 445 110, 470 166, 516 166" />
      </g>

      {/* prompt bubble — "your words" */}
      <g filter="url(#orch-soft)">
        <rect x="22" y="84" width="76" height="52" rx="15" fill="var(--brand-soft)" stroke="var(--brand-line)" strokeWidth="1.5" />
        <path d="M40 136 L40 149 L55 136 Z" fill="var(--brand-soft)" stroke="var(--brand-line)" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="34" y="98" width="52" height="5" rx="2.5" fill="var(--brand)" opacity="0.7" />
        <rect x="34" y="110" width="40" height="5" rx="2.5" fill="var(--brand)" opacity="0.45" />
        <rect x="34" y="122" width="30" height="5" rx="2.5" fill="var(--brand)" opacity="0.45" />
      </g>

      {/* router hub (breathes) */}
      <g className="orch-breathe" filter="url(#orch-soft)">
        <rect x="294" y="74" width="72" height="72" rx="20" fill="url(#orch-router)" />
        <rect x="294" y="74" width="72" height="72" rx="20" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1" />
        <circle cx="320" cy="110" r="4.5" fill="#fff" />
        <g stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none">
          <path d="M324 110 H340" />
          <path d="M324 110 C 334 110, 336 96, 344 96" />
          <path d="M324 110 C 334 110, 336 124, 344 124" />
        </g>
        <circle cx="344" cy="96" r="3" fill="#fff" />
        <circle cx="344" cy="110" r="3" fill="#fff" />
        <circle cx="344" cy="124" r="3" fill="#fff" />
      </g>

      {/* chosen "ping" on AI */}
      <circle className="orch-ping" cx="540" cy="110" r="24" fill="none" stroke="var(--a)" strokeWidth="2" />
      <circle className="orch-ping" style={{ animationDelay: "1.3s" }} cx="540" cy="110" r="24" fill="none" stroke="var(--a)" strokeWidth="2" />

      {/* node: Người (teal) */}
      <g filter="url(#orch-soft)">
        <circle cx="540" cy="54" r="24" fill="var(--b-soft)" stroke="var(--b)" strokeWidth="2" />
        <circle cx="540" cy="49" r="5" fill="none" stroke="var(--b-deep)" strokeWidth="2" />
        <path d="M530 64 C 532 55, 548 55, 550 64" fill="none" stroke="var(--b-deep)" strokeWidth="2" strokeLinecap="round" />
      </g>
      {/* node: AI (purple) — chosen, larger */}
      <g filter="url(#orch-soft)">
        <circle cx="540" cy="110" r="26" fill="var(--a-soft)" stroke="var(--a)" strokeWidth="2.5" />
        <path d="M540 96 L544 106 L554 110 L544 114 L540 124 L536 114 L526 110 L536 106 Z" fill="var(--a)" />
      </g>
      {/* node: Kết hợp (gold) */}
      <g filter="url(#orch-soft)">
        <circle cx="540" cy="166" r="24" fill="var(--gold-soft)" stroke="var(--gold)" strokeWidth="2" />
        <circle cx="535" cy="166" r="6.5" fill="none" stroke="var(--gold)" strokeWidth="2" />
        <circle cx="545" cy="166" r="6.5" fill="none" stroke="var(--gold)" strokeWidth="2" />
      </g>
    </svg>
  );
}

/* ── ② Board empty ─────────────────────────────────────── */
export function EmptyBoardArt(props: Props) {
  return (
    <svg viewBox="0 0 300 170" aria-hidden className="h-auto w-full" {...props}>
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={30 + i * 6}
          y={32 + i * 22}
          width="96"
          height="42"
          rx="9"
          fill="var(--card)"
          stroke="var(--b)"
          strokeOpacity="0.4"
          strokeDasharray="5 5"
          transform={`rotate(${-3 + i * 2} ${78 + i * 6} ${53 + i * 22})`}
        />
      ))}
      <path d="M138 60 Q 200 60 236 56" fill="none" stroke="var(--faint)" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
      <HumanNode x={250} y={54} r={15} />
      <AgentNode x={250} y={110} r={15} />
      <path d="M138 96 Q 200 108 236 110" fill="none" stroke="var(--faint)" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
    </svg>
  );
}

/* ── ③ Pool empty: capability constellation ────────────── */
export function EmptyPoolArt(props: Props) {
  const nodes: { x: number; y: number; t: "h" | "a"; seed?: boolean }[] = [
    { x: 60, y: 60, t: "h", seed: true },
    { x: 150, y: 40, t: "a" },
    { x: 240, y: 70, t: "h" },
    { x: 90, y: 140, t: "a" },
    { x: 190, y: 150, t: "h" },
    { x: 250, y: 130, t: "a" },
  ];
  const links: [number, number][] = [
    [0, 1],
    [1, 2],
    [0, 3],
    [3, 4],
    [4, 5],
    [2, 5],
    [1, 4],
  ];
  return (
    <svg viewBox="0 0 300 200" aria-hidden className="orch-float h-auto w-full" {...props}>
      {links.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a]!.x}
          y1={nodes[a]!.y}
          x2={nodes[b]!.x}
          y2={nodes[b]!.y}
          stroke="var(--gold)"
          strokeOpacity="0.28"
          strokeWidth="1"
        />
      ))}
      {nodes.map((n, i) =>
        n.t === "h" ? (
          <g key={i} opacity={n.seed ? 1 : 0.55}>
            {n.seed ? <HumanNode x={n.x} y={n.y} r={16} /> : <circle cx={n.x} cy={n.y} r={14} fill="none" stroke="var(--b)" strokeOpacity="0.7" strokeDasharray="3 4" />}
          </g>
        ) : (
          <g key={i} opacity={0.55}>
            <AgentNode x={n.x} y={n.y} r={13} />
          </g>
        ),
      )}
    </svg>
  );
}

/* ── ④ Dashboard empty: waiting for signal ─────────────── */
export function EmptyDashboardArt(props: Props) {
  return (
    <svg viewBox="0 0 300 150" aria-hidden className="h-auto w-full" {...props}>
      {[40, 75, 110].map((y) => (
        <line key={y} x1="20" y1={y} x2="280" y2={y} stroke="var(--line)" strokeWidth="1" strokeDasharray="3 5" />
      ))}
      <path
        className="orch-flow"
        d="M20 96 H 120 l 12 -20 l 14 34 l 12 -50 l 16 36 H 280"
        fill="none"
        stroke="var(--b)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="146" cy="60" r="4" fill="var(--a)" />
      {[70, 150, 230].map((x) => (
        <circle key={x} cx={x} cy="132" r="12" fill="none" stroke="var(--faint)" strokeOpacity="0.4" strokeWidth="3" />
      ))}
    </svg>
  );
}

/* ── ⑩ Recent empty: quiet console ─────────────────────── */
export function EmptyRecentArt(props: Props) {
  return (
    <svg viewBox="0 0 200 110" aria-hidden className="h-auto w-full" {...props}>
      <rect x="30" y="24" width="140" height="62" rx="10" fill="var(--card)" stroke="var(--line)" />
      <path d="M48 46 l 12 9 l -12 9" fill="none" stroke="var(--b)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <rect className="orch-blink" x="70" y="52" width="3" height="14" rx="1.5" fill="var(--a)" />
      <line x1="86" y1="59" x2="150" y2="59" stroke="var(--muted)" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
