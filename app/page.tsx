"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FilterBar, DEFAULT_FILTERS, type FilterState } from "@/components/FilterBar";
import { PopupList } from "@/components/PopupList";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ToastProvider, useToast } from "@/components/Toast";
import { ApiErrorBanner } from "@/components/ApiErrorBanner";
import * as store from "@/lib/popupsStore";
import { ApiError } from "@/lib/apiErrors";
import type { ListResponse, ReleasePopup } from "@/lib/types";

const PAGE_SIZE = 20;

export default function Page() {
  return (
    <ToastProvider>
      <ReleasePopupsAdmin />
    </ToastProvider>
  );
}

function ReleasePopupsAdmin() {
  const router = useRouter();
  const toast = useToast();

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [offset, setOffset] = useState(0);
  const [reloadTick, setReloadTick] = useState(0);
  const [data, setData] = useState<ListResponse>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [pendingDisable, setPendingDisable] = useState<ReleasePopup | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    store
      .list({
        is_active:
          filters.active === "any"
            ? undefined
            : filters.active === "active"
              ? true
              : false,
        active_now: filters.activeNow || undefined,
        audience: filters.audience === "any" ? undefined : filters.audience,
        limit: PAGE_SIZE,
        offset,
      })
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err : new ApiError(0, String(err), null));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters, offset, reloadTick]);

  useEffect(() => {
    setOffset(0);
  }, [filters]);

  const reload = useCallback(() => setReloadTick((n) => n + 1), []);
  const filtersDirty =
    filters.active !== DEFAULT_FILTERS.active ||
    filters.activeNow !== DEFAULT_FILTERS.activeNow ||
    filters.audience !== DEFAULT_FILTERS.audience;

  const handleEdit = useCallback(
    (row: ReleasePopup) => {
      router.push(`/edit/${row.id}`);
    },
    [router],
  );

  const handleDisable = useCallback(
    (row: ReleasePopup) => setPendingDisable(row),
    [],
  );
  const confirmDisable = useCallback(async () => {
    if (!pendingDisable) return;
    const target = pendingDisable;
    setPendingDisable(null);
    try {
      await store.softDelete(target.id);
      toast.push(
        "success",
        `Disabled "${target.title}". Switch Status to "All" or "Inactive only" to view it.`,
      );
      reload();
    } catch (err) {
      handleMutationError(err, toast.push);
    }
  }, [pendingDisable, toast, reload]);

  const handleEnable = useCallback(
    async (row: ReleasePopup) => {
      try {
        await store.update(row.id, { is_active: true });
        toast.push("success", `"${row.title}" enabled.`);
        reload();
      } catch (err) {
        handleMutationError(err, toast.push);
      }
    },
    [toast, reload],
  );

  return (
    <div className="min-h-screen bg-bg text-fg">
      <main className="mx-auto max-w-7xl px-6 pt-20 pb-16 flex flex-col gap-12">
        <h1 className="font-display text-center text-4xl sm:text-5xl font-medium tracking-tight text-fg">
          Helium AI Release Hub
        </h1>

        <FilterBar
          value={filters}
          onChange={setFilters}
          resultCount={data.total}
        />

        {error ? (
          <ApiErrorBanner error={error} onRetry={reload} />
        ) : null}

        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-medium tracking-tight text-fg">
              Manage Popups
            </h2>
            <Link href="/new">
              <Button variant="primary" size="md" leadingIcon={<Plus size={15} />}>
                Add Popup
              </Button>
            </Link>
          </div>

          {loading ? (
            <ListSkeleton />
          ) : error ? null : (
            <PopupList
              rows={data.items}
              total={data.total}
              offset={offset}
              limit={PAGE_SIZE}
              onPageChange={setOffset}
              onEdit={handleEdit}
              onDisable={handleDisable}
              onEnable={handleEnable}
              onClearFilters={() => setFilters(DEFAULT_FILTERS)}
              filtersDirty={filtersDirty}
            />
          )}
        </section>
      </main>

      <ConfirmDialog
        open={!!pendingDisable}
        title="Disable this popup?"
        description={
          pendingDisable
            ? `"${pendingDisable.title}" will stop showing to users. It's hidden from this list by default — switch Status to "All" or "Inactive only" to find it again.`
            : undefined
        }
        confirmLabel="Disable"
        cancelLabel="Cancel"
        destructive
        onConfirm={confirmDisable}
        onCancel={() => setPendingDisable(null)}
      />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="border-b border-border bg-surface-2/50 h-10" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="border-b border-border last:border-b-0 flex items-center gap-6 px-3 py-4"
        >
          <div className="h-3.5 w-56 rounded bg-surface-2 animate-pulse" />
          <div className="h-3 w-20 rounded bg-surface-2 animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-surface-2 animate-pulse" />
          <div className="ml-auto flex gap-2">
            <div className="h-7 w-16 rounded bg-surface-2 animate-pulse" />
            <div className="h-7 w-20 rounded bg-surface-2 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function handleMutationError(
  err: unknown,
  push: (kind: "success" | "error" | "info", msg: string) => void,
) {
  if (err instanceof ApiError) {
    push("error", err.detail);
  } else {
    push("error", err instanceof Error ? err.message : "Request failed.");
  }
}
