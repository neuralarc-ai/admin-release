"use client";

import type { ReactNode } from "react";

export interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  id?: string;
}

export function Toggle({ checked, onChange, label, disabled, id }: ToggleProps) {
  return (
    <label
      className={`inline-flex items-center gap-2.5 select-none ${disabled ? "opacity-50" : "cursor-pointer"}`}
      htmlFor={id}
    >
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/30 ${
          checked
            ? "bg-fg/90 border-fg/30"
            : "bg-surface-2 border-border hover:border-border-strong"
        } disabled:cursor-not-allowed`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full transition-transform ${
            checked ? "translate-x-[18px] bg-bg" : "translate-x-0.5 bg-fg-muted"
          }`}
        />
      </button>
      {label != null ? <span className="text-sm text-fg-muted">{label}</span> : null}
    </label>
  );
}
