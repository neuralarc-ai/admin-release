import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

const base =
  "w-full h-12 px-4 rounded-md bg-fg/5 text-base text-fg placeholder:text-fg-muted/50 border-[1.5px] focus:outline-none transition-all duration-200 disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, className = "", ...rest },
  ref,
) {
  const border = invalid
    ? "border-danger/60 focus:border-danger"
    : "border-transparent focus:border-fg/30";
  return <input ref={ref} className={`${base} ${border} ${className}`} {...rest} />;
});
