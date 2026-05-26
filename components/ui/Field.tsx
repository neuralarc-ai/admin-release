import type { ReactNode } from "react";

export interface FieldProps {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  counter?: ReactNode;
  children: ReactNode;
}

export function Field({ label, htmlFor, hint, error, required, counter, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label
          htmlFor={htmlFor}
          className="text-lg font-medium text-fg tracking-tight"
        >
          {label}
          {required ? <span className="text-fg-subtle ml-1">*</span> : null}
        </label>
        {counter != null ? (
          <span className="text-[11px] text-fg-subtle tabular-nums">{counter}</span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
}
