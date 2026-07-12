// @orchestra/ui — shared design system [S]. Consumed by apps/web; raw TS/TSX
// transpiled by Next (see apps/web/next.config.mjs transpilePackages).
// Token values + Tailwind theme live in apps/web (globals.css + tailwind.config.ts);
// this package owns the icon set + primitives that speak that class vocabulary.

export { cn } from "./cn";
export * from "./icons";
export { Card, CardKicker } from "./card";
export { Badge, EstimatedTag, type Tone } from "./badge";
export { Button, IconButton, type ButtonProps } from "./button";
export { Input, Textarea, Field } from "./field";
export { EmptyState, ErrorState, Skeleton } from "./states";
export { StatTile } from "./stat";
export { Meter } from "./meter";
export { AgentAvatar } from "./avatar";
export { SegmentedControl, type SegmentOption } from "./segmented";
export { Reveal, Stagger, StaggerItem, Lift, CountUp } from "./motion";
export { ease, dur, spring, reveal, staggerContainer, staggerItem, cardHover } from "./motion-tokens";
export {
  RoutingPipeline,
  EmptyBoardArt,
  EmptyPoolArt,
  EmptyDashboardArt,
  EmptyRecentArt,
} from "./illustrations";
