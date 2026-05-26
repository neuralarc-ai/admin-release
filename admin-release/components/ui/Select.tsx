import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

const base =
  "h-9 px-3 pr-8 rounded-md bg-surface-2 border text-fg text-sm appearance-none transition-colors focus:outline-none focus:ring-2 focus:ring-fg/20 disabled:opacity-50 bg-no-repeat";

const chevron =
  "bg-[url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")] bg-[length:12px] bg-[position:right_10px_center]";

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid = false, className = "", children, ...rest },
  ref,
) {
  const border = invalid
    ? "border-danger/60 focus:border-danger"
    : "border-border focus:border-border-strong";
  return (
    <select ref={ref} className={`${base} ${border} ${chevron} ${className}`} {...rest}>
      {children}
    </select>
  );
});
