import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-[background,box-shadow,opacity,transform,filter] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

const VARIANT: Record<Variant, string> = {
  // BLUE brand — the ONE primary action per screen carries the blue gradient + glow.
  primary: "bg-grad-cta text-white shadow-glow-brand hover:brightness-105 hover:shadow-glow-brand-hover",
  secondary: "border border-brand-line bg-card text-brand-deep hover:bg-brand-soft",
  ghost: "text-brand-deep hover:bg-brand-soft",
  danger: "border border-bad/30 bg-bad-soft text-bad hover:bg-bad/15",
};

const SIZE: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", leftIcon, rightIcon, className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cn(BASE, VARIANT[variant], SIZE[size], className)} {...rest}>
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
});

/** Square icon-only button (toolbars, ± steppers). Always pass an aria-label. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(function IconButton({ variant = "secondary", size = "md", className, children, type = "button", ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        BASE,
        VARIANT[variant],
        size === "sm" ? "h-11 w-11" : "h-11 w-11",
        "px-0 py-0",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
