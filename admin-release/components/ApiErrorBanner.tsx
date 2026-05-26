"use client";

import { AlertCircle, X, KeyRound, ServerCrash, Settings } from "lucide-react";
import type { ApiError } from "@/lib/apiErrors";

export interface ApiErrorBannerProps {
  error: ApiError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ApiErrorBanner({ error, onRetry, onDismiss }: ApiErrorBannerProps) {
  const Icon = error.isAuth
    ? KeyRound
    : error.isMissingConfig
      ? Settings
      : error.status >= 500
        ? ServerCrash
        : AlertCircle;

  const title = error.isAuth
    ? "Invalid admin API key"
    : error.isMissingConfig
      ? "Admin app is not configured"
      : error.status >= 500
        ? "Backend error"
        : `Request failed (${error.status})`;

  const hint = error.isAuth
    ? "Check ADMIN_API_KEY in .env.local — the backend rejected the request."
    : error.isMissingConfig
      ? "Copy .env.example to .env.local and set BACKEND_BASE_URL and ADMIN_API_KEY, then restart the dev server."
      : undefined;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-danger/20 bg-danger-bg px-4 py-3">
      <Icon size={18} className="mt-0.5 shrink-0 text-danger" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-danger">{title}</p>
        <p className="mt-0.5 text-xs text-fg-muted leading-5">{error.detail}</p>
        {hint ? <p className="mt-1 text-xs text-fg-subtle leading-5">{hint}</p> : null}
      </div>
      <div className="flex items-center gap-1">
        {onRetry ? (
          <button
            onClick={onRetry}
            className="h-7 px-2.5 rounded text-xs font-medium text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors cursor-pointer"
          >
            Retry
          </button>
        ) : null}
        {onDismiss ? (
          <button
            onClick={onDismiss}
            aria-label="Dismiss"
            className="h-7 w-7 inline-flex items-center justify-center rounded text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
