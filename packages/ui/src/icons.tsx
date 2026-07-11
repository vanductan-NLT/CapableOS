import type { SVGProps } from "react";

/**
 * Orchestra icon set — hand-drawn SVG, stroke-based, `currentColor`.
 * One consistent grid (24×24, 1.75 stroke, round caps) the way Linear / Vercel / Stripe
 * ship their icons. No emoji, no icon font. Size via `size` (px) or width/height.
 */
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  size?: number | string;
  /** Decorative by default (aria-hidden). Pass a `title`/`aria-label` to make it meaningful. */
  title?: string;
}

function Icon({ size = 18, title, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/* ── Brand ───────────────────────────────────────────────── */
export function BrandMark({ size = 22, title, ...rest }: IconProps) {
  // Concentric "control plane" mark from the Playbook — orbit + core + axes.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" />
      <path
        d="M12 2.75v3M12 18.25v3M2.75 12h3M18.25 12h3"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── Navigation ──────────────────────────────────────────── */
export function CommandIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M6.5 4A2.5 2.5 0 1 1 9 6.5V17.5A2.5 2.5 0 1 1 6.5 20 2.5 2.5 0 0 1 9 17.5H15A2.5 2.5 0 1 1 17.5 20 2.5 2.5 0 0 1 15 17.5V6.5A2.5 2.5 0 1 1 17.5 4 2.5 2.5 0 0 1 15 6.5H9A2.5 2.5 0 0 1 6.5 4Z" />
    </Icon>
  );
}
export function BoardIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3" y="4" width="5.5" height="16" rx="1.4" />
      <rect x="9.75" y="4" width="5.5" height="11" rx="1.4" />
      <rect x="16.5" y="4" width="4.5" height="8" rx="1.4" />
    </Icon>
  );
}
export function DashboardIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 19.5h16" />
      <path d="M6.5 19.5v-6M11 19.5V6M15.5 19.5v-9M20 19.5v-4" />
    </Icon>
  );
}
export function PoolIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="8.5" cy="8" r="3.1" />
      <path d="M3.5 19c.4-2.9 2.5-4.6 5-4.6s4.6 1.7 5 4.6" />
      <path d="M15.5 5.2a3.1 3.1 0 0 1 0 6M17 14.6c2 .5 3.3 2 3.6 4.4" />
    </Icon>
  );
}

/* ── Actors ──────────────────────────────────────────────── */
export function HumanIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="7.5" r="3.4" />
      <path d="M5.5 19.5c.5-3.4 3-5.4 6.5-5.4s6 2 6.5 5.4" />
    </Icon>
  );
}
export function AiIcon(p: IconProps) {
  // Agent glyph: rounded chip with antenna + eyes — reads as "AI" without emoji.
  return (
    <Icon {...p}>
      <rect x="4.5" y="8" width="15" height="11" rx="3.2" />
      <path d="M12 4.5V8" />
      <circle cx="12" cy="3.6" r="1.1" fill="currentColor" stroke="none" />
      <path d="M9.2 13h.01M14.8 13h.01" />
      <path d="M2.5 12.5v2M21.5 12.5v2" />
    </Icon>
  );
}
export function SparkIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 3.5c.4 3.7 1.8 5.1 5.5 5.5-3.7.4-5.1 1.8-5.5 5.5-.4-3.7-1.8-5.1-5.5-5.5 3.7-.4 5.1-1.8 5.5-5.5Z" />
      <path d="M18.5 14.5c.2 1.7.8 2.3 2.5 2.5-1.7.2-2.3.8-2.5 2.5-.2-1.7-.8-2.3-2.5-2.5 1.7-.2 2.3-.8 2.5-2.5Z" />
    </Icon>
  );
}

/* ── Actions ─────────────────────────────────────────────── */
export function PlusIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}
export function MinusIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M5 12h14" />
    </Icon>
  );
}
export function CloseIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}
export function CheckIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4.5 12.5 9 17l10.5-11" />
    </Icon>
  );
}
export function ArrowRightIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </Icon>
  );
}
export function ArrowUpRightIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M7 17 17 7M8 7h9v9" />
    </Icon>
  );
}
export function ChevronRightIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M9 6l6 6-6 6" />
    </Icon>
  );
}
export function ChevronDownIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M6 9l6 6 6-6" />
    </Icon>
  );
}
export function SearchIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-3.8-3.8" />
    </Icon>
  );
}

/* ── Metrics / status ────────────────────────────────────── */
export function BoltIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M13 2.5 4.5 13.5H11l-.5 8 8.5-11H13l.5-8Z" />
    </Icon>
  );
}
export function ClockIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Icon>
  );
}
export function WalletIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17a2 2 0 0 1 2 2" />
      <rect x="4" y="7" width="16" height="12" rx="2.5" />
      <path d="M16 12.5h.01" />
    </Icon>
  );
}
export function GaugeIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 17a8 8 0 1 1 16 0" />
      <path d="M12 14.5 15.5 10" />
      <circle cx="12" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
    </Icon>
  );
}
export function ActivityIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M3 12h4l2.5-7 5 14 2.5-7H21" />
    </Icon>
  );
}
export function LayersIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 3.5 21 8l-9 4.5L3 8l9-4.5Z" />
      <path d="M3.5 12.5 12 16.8l8.5-4.3M3.5 16.5 12 20.8l8.5-4.3" />
    </Icon>
  );
}
export function ShieldCheckIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 3 5 5.5v5.2c0 4.4 3 7.6 7 9.3 4-1.7 7-4.9 7-9.3V5.5L12 3Z" />
      <path d="M9 11.5 11 13.5l4-4" />
    </Icon>
  );
}
export function TrendUpIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M3 17 10 10l4 4 7-7" />
      <path d="M15 7h6v6" />
    </Icon>
  );
}
export function TrendDownIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M3 7 10 14l4-4 7 7" />
      <path d="M15 17h6v-6" />
    </Icon>
  );
}
export function TrendFlatIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M3 12h15M14 7l5 5-5 5" />
    </Icon>
  );
}

/* ── Feedback surfaces ───────────────────────────────────── */
export function InboxIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 13.5 6.2 5.4A2 2 0 0 1 8.1 4h7.8a2 2 0 0 1 1.9 1.4L20 13.5" />
      <path d="M4 13.5h4.5l1.2 2.2h4.6l1.2-2.2H20V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4.5Z" />
    </Icon>
  );
}
export function AlertIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 4 2.8 20h18.4L12 4Z" />
      <path d="M12 10v4.5M12 17.5h.01" />
    </Icon>
  );
}
export function SunIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
    </Icon>
  );
}
export function MoonIcon(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M20 14.2A8 8 0 1 1 9.8 4 6.5 6.5 0 0 0 20 14.2Z" />
    </Icon>
  );
}
