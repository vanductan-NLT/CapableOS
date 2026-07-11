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

const labelStyle = {
  fontFamily: "var(--font-mono, monospace)",
  fontSize: 8.5,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
};

/* ── ① Command hero: the routing pipeline ──────────────── */
export function RoutingPipeline({ className, ...props }: Props) {
  return (
    <svg
      viewBox="0 0 640 200"
      role="img"
      aria-label="Sơ đồ định tuyến người và AI"
      className={["h-auto w-full", className].filter(Boolean).join(" ")}
      {...props}
    >
      <defs>
        <linearGradient id="orch-prism" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--b)" />
          <stop offset="0.5" stopColor="var(--a)" />
          <stop offset="1" stopColor="var(--gold)" />
        </linearGradient>
        <linearGradient id="orch-beam-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--a)" />
          <stop offset="1" stopColor="var(--b)" />
        </linearGradient>
        <linearGradient id="orch-beam-g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--a)" />
          <stop offset="1" stopColor="var(--gold)" />
        </linearGradient>
      </defs>

      {/* prompt capsule */}
      <rect x="26" y="72" width="120" height="56" rx="14" fill="var(--card)" stroke="var(--b-line)" />
      <line x1="46" y1="90" x2="126" y2="90" stroke="var(--b)" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
      <line x1="46" y1="100" x2="112" y2="100" stroke="var(--muted)" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
      <line x1="46" y1="110" x2="120" y2="110" stroke="var(--muted)" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
      <text x="26" y="146" fill="var(--muted)" style={labelStyle}>Prompt</text>

      {/* prompt → prism */}
      <path d="M146 100 H 258" fill="none" stroke="var(--faint)" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />

      {/* router prism */}
      <path d="M300 70 L330 100 L300 130 L270 100 Z" fill="url(#orch-prism)" stroke="#fff" strokeOpacity="0.4" strokeWidth="1.4" />
      <text x="300" y="150" textAnchor="middle" fill="var(--muted)" style={labelStyle}>Router</text>

      {/* prism → nodes (animated flow) */}
      <path className="orch-flow" d="M330 100 Q 440 56 516 50" fill="none" stroke="url(#orch-beam-h)" strokeWidth="2.5" strokeLinecap="round" />
      <path className="orch-flow" d="M330 100 Q 440 100 516 100" fill="none" stroke="var(--a)" strokeWidth="2.5" strokeLinecap="round" />
      <path className="orch-flow" d="M330 100 Q 440 146 516 152" fill="none" stroke="url(#orch-beam-g)" strokeWidth="2.5" strokeLinecap="round" />

      {/* destinations */}
      <HumanNode x={540} y={50} />
      <text x="540" y="82" textAnchor="middle" fill="var(--b-deep)" style={labelStyle}>Human</text>
      <AgentNode x={540} y={100} />
      <text x="540" y="132" textAnchor="middle" fill="var(--a)" style={labelStyle}>AI</text>
      <HybridNode x={540} y={152} />
      <text x="540" y="180" textAnchor="middle" fill="var(--gold)" style={labelStyle}>Hybrid</text>
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
