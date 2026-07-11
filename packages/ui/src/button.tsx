import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-[background,box-shadow,opacity,transform] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

const VARIANT: Record<Variant, string> = {
  // AA-safe teal fill (raw --b fails white contrast) + colored elevation on the one primary action.
  primary: "bg-b-strong text-white shadow-glow-b hover:bg-b-deep hover:shadow-glow-b-hover",
  secondary: "border border-line bg-card text-ink hover:bg-line/50",
  ghost: "text-ink2 hover:bg-line/60 hover:text-ink",
  danger: "border border-bad/30 bg-bad-soft text-bad hover:bg-bad/15",
};

const SIZE: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
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
        size === "sm" ? "h-7 w-7" : "h-9 w-9",
        "px-0 py-0",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
