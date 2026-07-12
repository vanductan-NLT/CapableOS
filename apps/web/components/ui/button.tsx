import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "./icon";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-[image:var(--grad-cta)] text-white shadow-[var(--elev-1)] hover:brightness-105 disabled:opacity-50",
  secondary: "border border-line bg-card text-ink shadow-[var(--elev-1)] hover:bg-blue-soft disabled:opacity-50",
  ghost: "text-ink2 hover:bg-blue-soft disabled:opacity-40",
  danger: "border border-bad/40 text-bad hover:bg-bad/10 disabled:opacity-50",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-2.5 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: IconName;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  disabled,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center rounded-full font-semibold transition-[filter,background,color,box-shadow] [touch-action:manipulation] cursor-pointer disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {loading ? <Icon name="loader" size={size === "sm" ? 14 : 16} /> : icon ? <Icon name={icon} size={size === "sm" ? 14 : 16} /> : null}
      {children}
    </button>
  );
}
