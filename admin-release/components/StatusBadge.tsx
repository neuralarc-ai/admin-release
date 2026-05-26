import type { Status } from "@/lib/types";

const styles: Record<Status, { dot: string; text: string; bg: string; label: string }> = {
  live: {
    dot: "bg-success",
    text: "text-success",
    bg: "bg-success-bg border-success/15",
    label: "Live",
  },
  scheduled: {
    dot: "bg-warning",
    text: "text-warning",
    bg: "bg-warning-bg border-warning/15",
    label: "Scheduled",
  },
  expired: {
    dot: "bg-fg-subtle",
    text: "text-fg-muted",
    bg: "bg-surface-2 border-border",
    label: "Expired",
  },
  disabled: {
    dot: "bg-danger",
    text: "text-danger",
    bg: "bg-danger-bg border-danger/15",
    label: "Disabled",
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const s = styles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${s.bg} ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
      {s.label}
    </span>
  );
}
