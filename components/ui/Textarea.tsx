import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

const base =
  "w-full px-4 py-3 rounded-md bg-fg/5 text-base text-fg placeholder:text-fg-muted/50 border-[1.5px] focus:outline-none transition-all duration-200 disabled:opacity-50 resize-y font-sans leading-6";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid = false, className = "", ...rest },
  ref,
) {
  const border = invalid
    ? "border-danger/60 focus:border-danger"
    : "border-transparent focus:border-fg/30";
  return <textarea ref={ref} className={`${base} ${border} ${className}`} {...rest} />;
});
