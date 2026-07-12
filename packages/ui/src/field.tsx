import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "./cn";

const FIELD =
  "w-full min-h-11 rounded-xl border border-line bg-field px-4 py-3 text-base text-ink placeholder:text-faint outline-none transition-[border,box-shadow] focus:border-brand focus:ring-4 focus:ring-brand/15";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} className={cn(FIELD, className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...rest },
  ref,
) {
  return <textarea ref={ref} className={cn(FIELD, "resize-y leading-relaxed", className)} {...rest} />;
});

/** Label + control + optional hint, stacked. Keeps forms consistent + accessible. */
export function Field({
  label,
  hint,
  optional,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  /** `true` → default "(tuỳ chọn)"; pass a node/string to control the label (i18n). */
  optional?: boolean | ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-2", className)}>
      <span className="flex items-center gap-2 text-base font-medium text-ink">
        {label}
        {optional ? (
          <span className="text-sm font-normal text-muted">{optional === true ? "(tuỳ chọn)" : optional}</span>
        ) : null}
      </span>
      {children}
      {hint ? <span className="text-sm text-muted">{hint}</span> : null}
    </label>
  );
}
