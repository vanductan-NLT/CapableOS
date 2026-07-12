// Orchestra local design-system kit (domain B; consolidate into packages/ui
// later — needs both managers' approval). Barrel keeps `@/components/ui` stable.

export { Icon, type IconName, type IconProps } from "./icon";
export { Badge, EstimatedTag, CapabilityChip } from "./badge";
export { Card, StatTile } from "./card";
export { EmptyState, ErrorState, Skeleton } from "./feedback";
export { Button, type ButtonProps } from "./button";
export { Avatar } from "./avatar";
export { Meter } from "./meter";
export {
  VERDICT_PRESENTATION,
  agentTypeMeta,
  confidenceLabel,
  isCloseCall,
  type Tone,
  type VerdictPresentation,
} from "./verdict";
