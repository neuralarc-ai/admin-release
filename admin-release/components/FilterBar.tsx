"use client";

import { Select } from "./ui/Select";
import { Toggle } from "./ui/Toggle";
import { Button } from "./ui/Button";
import { ListFilter, UsersRound, X } from "lucide-react";
import type { Audience } from "@/lib/types";

export type ActiveFilter = "any" | "active" | "inactive";

export interface FilterState {
  active: ActiveFilter;
  activeNow: boolean;
  audience: Audience | "any";
}

export const DEFAULT_FILTERS: FilterState = {
  active: "active",
  activeNow: false,
  audience: "any",
};

export interface FilterBarProps {
  value: FilterState;
  onChange: (next: FilterState) => void;
  resultCount: number;
}

function isDefault(state: FilterState): boolean {
  return (
    state.active === DEFAULT_FILTERS.active &&
    state.activeNow === DEFAULT_FILTERS.activeNow &&
    state.audience === DEFAULT_FILTERS.audience
  );
}

export function FilterBar({ value, onChange, resultCount }: FilterBarProps) {
  const dirty = !isDefault(value);
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
      <div className="flex items-center gap-2.5">
        <ListFilter size={15} className="text-fg-muted" aria-hidden />
        <label
          htmlFor="filter-status"
          className="text-sm font-medium text-fg-muted"
        >
          Status
        </label>
        <Select
          id="filter-status"
          value={value.active}
          onChange={(e) =>
            onChange({ ...value, active: e.target.value as ActiveFilter })
          }
        >
          <option value="any">All</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </Select>
      </div>

      <div className="flex items-center gap-2.5">
        <UsersRound size={15} className="text-fg-muted" aria-hidden />
        <label
          htmlFor="filter-audience"
          className="text-sm font-medium text-fg-muted"
        >
          Audience
        </label>
        <Select
          id="filter-audience"
          value={value.audience}
          onChange={(e) =>
            onChange({
              ...value,
              audience: e.target.value as FilterState["audience"],
            })
          }
        >
          <option value="any">Any</option>
          <option value="all">All users</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
          <option value="specific">Specific tiers</option>
        </Select>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <span className="text-xs text-fg-subtle tabular-nums hidden sm:inline">
          {resultCount} {resultCount === 1 ? "popup" : "popups"}
        </span>
        {dirty ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(DEFAULT_FILTERS)}
            leadingIcon={<X size={14} />}
          >
            Clear
          </Button>
        ) : null}
        <Toggle
          id="filter-active-now"
          checked={value.activeNow}
          onChange={(next) => onChange({ ...value, activeNow: next })}
          label="Currently live"
        />
      </div>
    </div>
  );
}
