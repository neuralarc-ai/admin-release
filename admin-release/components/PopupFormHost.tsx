"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { PopupForm } from "./PopupForm";
import { ToastProvider, useToast } from "./Toast";
import { ApiErrorBanner } from "./ApiErrorBanner";
import * as store from "@/lib/popupsStore";
import { ApiError } from "@/lib/apiErrors";
import type { ReleasePopup, ReleasePopupCreate } from "@/lib/types";

export interface PopupFormHostProps {
  mode: "create" | "edit";
  id?: string;
}

export function PopupFormHost(props: PopupFormHostProps) {
  return (
    <ToastProvider>
      <PopupFormHostInner {...props} />
    </ToastProvider>
  );
}

function PopupFormHostInner({ mode, id }: PopupFormHostProps) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(mode === "edit");
  const [initial, setInitial] = useState<ReleasePopup | null>(null);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [saveError, setSaveError] = useState<ApiError | null>(null);
  const [loadTick, setLoadTick] = useState(0);

  useEffect(() => {
    if (mode !== "edit" || !id) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    store
      .get(id)
      .then((row) => {
        if (cancelled) return;
        setInitial(row);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const e = err instanceof ApiError ? err : new ApiError(0, String(err), null);
        if (e.isNotFound) {
          toast.push("error", "Popup not found.");
          router.replace("/");
          return;
        }
        setLoadError(e);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, id, loadTick, router, toast]);

  async function handleSubmit(payload: ReleasePopupCreate) {
    setSaveError(null);
    try {
      if (mode === "edit" && id) {
        await store.update(id, payload);
        toast.push("success", "Popup updated.");
      } else {
        await store.create(payload);
        toast.push("success", "Popup created.");
      }
      router.push("/");
    } catch (err) {
      const e = err instanceof ApiError ? err : new ApiError(0, String(err), null);
      if (e.isNotFound && mode === "edit") {
        toast.push("error", "Popup no longer exists.");
        router.replace("/");
        return;
      }
      setSaveError(e);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }

  const title = mode === "edit" ? "Edit popup" : "New popup";
  const subtitle =
    mode === "edit"
      ? "Changes apply immediately. The Redis cache rolls forward within ~60s."
      : "Create a new announcement to surface inside the product dashboard.";

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur supports-backdrop-filter:bg-bg/70">
        <div className="mx-auto max-w-3xl px-6 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg transition-colors"
          >
            <ChevronLeft size={16} />
            All popups
          </Link>
          <span className="text-fg-subtle">/</span>
          <span className="text-sm font-medium text-fg">{title}</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10">
          <h1 className="text-xl font-semibold text-fg">{title}</h1>
          <p className="mt-1.5 text-sm text-fg-muted">{subtitle}</p>
        </div>

        {loadError ? (
          <ApiErrorBanner
            error={loadError}
            onRetry={() => setLoadTick((n) => n + 1)}
          />
        ) : null}

        {saveError ? (
          <div className="mb-6">
            <ApiErrorBanner
              error={saveError}
              onDismiss={() => setSaveError(null)}
            />
          </div>
        ) : null}

        {loading ? (
          <FormSkeleton />
        ) : !loadError && (mode === "create" || initial) ? (
          <PopupForm
            initial={initial}
            submitLabel={mode === "edit" ? "Save changes" : "Create popup"}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/")}
          />
        ) : null}
      </main>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)] gap-6 lg:gap-10"
        >
          <div>
            <div className="h-4 w-32 rounded bg-surface-2 animate-pulse" />
            <div className="mt-2 h-3 w-44 rounded bg-surface-2 animate-pulse" />
          </div>
          <div className="flex flex-col gap-4">
            <div className="h-9 rounded-md bg-surface-2 animate-pulse" />
            <div className="h-24 rounded-md bg-surface-2 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
