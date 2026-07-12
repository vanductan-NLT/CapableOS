// Domain B's UI kit now lives in the shared design system. This file re-exports it
// so existing `@/components/ui` imports keep working. Prefer importing from
// "@orchestra/ui" directly in new code.
export {
  Card,
  CardKicker,
  Badge,
  EstimatedTag,
  Button,
  IconButton,
  Input,
  Textarea,
  Field,
  EmptyState,
  ErrorState,
  Skeleton,
  StatTile,
  Meter,
  AgentAvatar,
  SegmentedControl,
  type Tone,
} from "@orchestra/ui";
