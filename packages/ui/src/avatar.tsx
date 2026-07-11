import { cn } from "./cn";
import { AiIcon, HumanIcon } from "./icons";

/**
 * Actor avatar — a tinted glyph chip that distinguishes a human from an AI agent
 * at a glance (teal = human/workspace, purple = AI/decision), replacing 🧑/🤖.
 */
export function AgentAvatar({
  type,
  size = "md",
  className,
}: {
  type: "human" | "ai";
  size?: "sm" | "md";
  className?: string;
}) {
  const dim = size === "sm" ? "h-6 w-6" : "h-8 w-8";
  const icon = size === "sm" ? 14 : 17;
  return (
    <span
      className={cn(
        "inline-flex flex-none items-center justify-center rounded-full ring-1 ring-inset",
        dim,
        type === "ai" ? "bg-a-soft text-a ring-a-line" : "bg-b-soft text-b-deep ring-b-line",
        className,
      )}
      aria-hidden
    >
      {type === "ai" ? <AiIcon size={icon} /> : <HumanIcon size={icon} />}
    </span>
  );
}
