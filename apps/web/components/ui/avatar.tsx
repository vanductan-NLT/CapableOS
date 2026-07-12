"use client";

import { clsx } from "clsx";
import type { CSSProperties } from "react";
import { Icon } from "./icon";
import { useT } from "@/lib/i18n";
import { agentTypeMeta } from "./verdict";

/**
 * Workforce avatar. Human vs AI get distinct icons and a type-colored ring —
 * replaces the 🧑/🤖 emoji used across the old UI.
 */
export function Avatar({
  type,
  name,
  size = 36,
  selected = false,
}: {
  type: "human" | "ai";
  name?: string;
  size?: number;
  selected?: boolean;
}) {
  const t = useT();
  const meta = agentTypeMeta(type);
  const label = t(meta.label.vi, meta.label.en);
  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center rounded-full border-2",
        selected && "ring-2 ring-offset-1 ring-offset-card",
      )}
      style={
        {
          width: size,
          height: size,
          borderColor: meta.hex,
          color: meta.hex,
          background: `${meta.hex}14`,
          "--tw-ring-color": meta.hex,
        } as CSSProperties
      }
      role="img"
      aria-label={name ? `${label}: ${name}` : label}
    >
      <Icon name={meta.icon} size={Math.round(size * 0.55)} />
    </span>
  );
}
