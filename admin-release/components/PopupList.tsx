"use client";

import { useState } from "react";
import { Pencil, EyeOff, Eye, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { Button } from "./ui/Button";
import { StatusBadge } from "./StatusBadge";
import { formatTableDate } from "@/lib/formatDate";
import type { Audience, ReleasePopup } from "@/lib/types";

const AUDIENCE_LABEL: Record<Audience, string> = {
  all: "All users",
  free: "Free",
  paid: "Paid",
  specific: "Specific",
};

export interface PopupListProps {
  rows: ReleasePopup[];
  total: number;
  offset: number;
  limit: number;
  onPageChange: (offset: number) => void;
  onEdit: (row: ReleasePopup) => void;
  onDisable: (row: ReleasePopup) => void;
  onEnable: (row: ReleasePopup) => void;
  onClearFilters: () => void;
  filtersDirty: boolean;
}

export function PopupList({
  rows,
  total,
  offset,
  limit,
  onPageChange,
  onEdit,
  onDisable,
  onEnable,
  onClearFilters,
  filtersDirty,
}: PopupListProps) {
  if (rows.length === 0) {
    return (
      <EmptyState filtersDirty={filtersDirty} onClearFilters={onClearFilters} />
    );
  }

  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + limit, total);
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2/50">
              <Th>Title</Th>
              <Th>Audience</Th>
              <Th>Status</Th>
              <Th>Start</Th>
              <Th>End</Th>
              <Th className="text-right">Priority</Th>
              <Th className="text-right pr-4">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Row
                key={row.id}
                row={row}
                onEdit={() => onEdit(row)}
                onDisable={() => onDisable(row)}
                onEnable={() => onEnable(row)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border bg-surface-2/40 px-4 py-2.5 text-xs text-fg-muted">
        <span className="tabular-nums">
          {pageStart}–{pageEnd} of {total}
        </span>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            disabled={!canPrev}
            onClick={() => onPageChange(Math.max(0, offset - limit))}
            leadingIcon={<ChevronLeft size={14} />}
          >
            Prev
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={!canNext}
            onClick={() => onPageChange(offset + limit)}
            trailingIcon={<ChevronRight size={14} />}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-fg-muted ${className}`}
    >
      {children}
    </th>
  );
}

function Row({
  row,
  onEdit,
  onDisable,
  onEnable,
}: {
  row: ReleasePopup;
  onEdit: () => void;
  onDisable: () => void;
  onEnable: () => void;
}) {
  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-surface-hover/40 transition-colors group">
      <td className="px-3 py-3 max-w-[340px]">
        <div className="font-medium text-fg truncate" title={row.title}>
          {row.title}
        </div>
        <div className="text-xs text-fg-subtle truncate" title={row.body}>
          {row.body.replace(/[*_`#>\-]/g, " ").replace(/\s+/g, " ").trim()}
        </div>
      </td>
      <td className="px-3 py-3 align-middle">
        <span className="inline-flex items-center gap-1.5 text-xs">
          <span className="text-fg">{AUDIENCE_LABEL[row.audience]}</span>
          {row.audience === "specific" && row.plan_tiers.length > 0 ? (
            <span className="text-fg-subtle">· {row.plan_tiers.join(", ")}</span>
          ) : null}
        </span>
      </td>
      <td className="px-3 py-3 align-middle">
        <StatusBadge status={row.status} />
      </td>
      <td className="px-3 py-3 align-middle text-xs text-fg-muted whitespace-nowrap">
        {formatTableDate(row.start_at)}
      </td>
      <td className="px-3 py-3 align-middle text-xs text-fg-muted whitespace-nowrap">
        {formatTableDate(row.end_at)}
      </td>
      <td className="px-3 py-3 align-middle text-right text-fg tabular-nums">
        {row.priority}
      </td>
      <td className="px-3 py-3 align-middle pr-4">
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
            leadingIcon={<Pencil size={13} />}
          >
            Edit
          </Button>
          {row.is_active ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDisable}
              leadingIcon={<EyeOff size={13} />}
            >
              Disable
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={onEnable}
              leadingIcon={<Eye size={13} />}
            >
              Enable
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

function EmptyState({
  filtersDirty,
  onClearFilters,
}: {
  filtersDirty: boolean;
  onClearFilters: () => void;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface/40 py-14 px-6 flex flex-col items-center text-center">
      <Inbox size={28} className="text-fg-subtle mb-3" />
      <h3 className="text-sm font-medium text-fg">
        {filtersDirty ? "No popups match these filters" : "No popups yet"}
      </h3>
      <p className="mt-1 text-xs text-fg-muted max-w-sm">
        {filtersDirty
          ? "Try clearing the filters or widening the audience."
          : "Create your first popup to start announcing changes inside the product."}
      </p>
      {filtersDirty ? (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onClearFilters}>
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
