"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Field } from "./ui/Field";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Toggle } from "./ui/Toggle";
import { Button } from "./ui/Button";
import { PopupPreview } from "./PopupPreview";
import {
  AUDIENCE_OPTIONS,
  PLAN_TIERS,
  type Audience,
  type ImagePosition,
  type PlanTier,
  type ReleasePopup,
  type ReleasePopupCreate,
} from "@/lib/types";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/formatDate";
import { validatePopup, type FieldErrors } from "@/lib/validation";
import { AlertCircle, PanelTop, PanelLeft, PanelRight, X } from "lucide-react";
import { ImageUploadInput, deleteImage } from "./ImageUploadInput";

interface FormState {
  title: string;
  body: string;
  image_url: string;         // http(s)://, blob:, or ''
  _stagedFile: File | null;  // file chosen but not yet uploaded; cleared on save/cancel/swap
  _initialImageUrl: string;  // image_url as loaded from DB — used to detect managed-image swaps
  image_position: ImagePosition;
  cta_label: string;
  cta_url: string;
  audience: Audience;
  plan_tiers: PlanTier[];
  start_at_local: string;
  end_at_local: string;
  is_active: boolean;
  priority: string;
}

function emptyForm(): FormState {
  const now = new Date();
  const later = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    title: "",
    body: "",
    image_url: "",
    _stagedFile: null,
    _initialImageUrl: "",
    image_position: "left",
    cta_label: "",
    cta_url: "",
    audience: "all",
    plan_tiers: [],
    start_at_local: toDatetimeLocalValue(now.toISOString()),
    end_at_local: toDatetimeLocalValue(later.toISOString()),
    is_active: true,
    priority: "0",
  };
}

function fromPopup(p: ReleasePopup): FormState {
  return {
    title: p.title,
    body: p.body,
    image_url: p.image_url ?? "",
    _stagedFile: null,
    _initialImageUrl: p.image_url ?? "",
    image_position: p.image_position ?? "left",
    cta_label: p.cta_label ?? "",
    cta_url: p.cta_url ?? "",
    audience: p.audience,
    plan_tiers: p.plan_tiers as PlanTier[],
    start_at_local: toDatetimeLocalValue(p.start_at),
    end_at_local: toDatetimeLocalValue(p.end_at),
    is_active: p.is_active,
    priority: String(p.priority),
  };
}

function toCreatePayload(form: FormState): ReleasePopupCreate {
  // blob: URLs are ephemeral — treat as null for validation and backend payload.
  // The real S3 URL is substituted in handleSubmit after upload.
  const imageUrl = form.image_url.startsWith("blob:")
    ? null
    : form.image_url.trim() || null;
  return {
    title: form.title.trim(),
    body: form.body,
    image_url: imageUrl,
    image_position: form.image_position,
    cta_label: form.cta_label.trim() ? form.cta_label.trim() : null,
    cta_url: form.cta_url.trim() ? form.cta_url.trim() : null,
    audience: form.audience,
    plan_tiers: form.audience === "specific" ? form.plan_tiers : [],
    start_at: form.start_at_local
      ? fromDatetimeLocalValue(form.start_at_local)
      : "",
    end_at: form.end_at_local ? fromDatetimeLocalValue(form.end_at_local) : "",
    is_active: form.is_active,
    priority: Number.parseInt(form.priority, 10) || 0,
  };
}

const AUDIENCE_LABELS: Record<Audience, string> = {
  all: "All",
  free: "Free",
  paid: "Paid",
  specific: "Specific tiers",
};

const TIER_LABELS: Record<PlanTier, string> = {
  starter: "Starter",
  pro: "Pro",
  pro_creative: "Pro Creative",
  max: "Max",
};

const DRAFT_KEY = "popup-new-draft";

const POSITION_OPTIONS: { value: ImagePosition; label: string; Icon: typeof PanelTop }[] = [
  { value: "top", label: "Top", Icon: PanelTop },
  { value: "left", label: "Left", Icon: PanelLeft },
  { value: "right", label: "Right", Icon: PanelRight },
];

export interface PopupFormProps {
  initial: ReleasePopup | null;
  submitLabel: string;
  onSubmit: (payload: ReleasePopupCreate) => Promise<void> | void;
  onCancel: () => void;
}

export function PopupForm({ initial, submitLabel, onSubmit, onCancel }: PopupFormProps) {
  const [form, setForm] = useState<FormState>(() =>
    initial ? fromPopup(initial) : emptyForm(),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [showAllErrors, setShowAllErrors] = useState(false);
  // true for edit (no draft needed), false for create until sessionStorage is read
  const [draftReady, setDraftReady] = useState(!!initial);

  // Keep a ref to form so the unmount cleanup can access the latest image_url
  const formRef = useRef(form);
  useEffect(() => {
    formRef.current = form;
  });

  // Revoke any staged blob URL on unmount (covers navigate-away without Cancel)
  useEffect(() => {
    return () => {
      if (formRef.current.image_url.startsWith("blob:")) {
        URL.revokeObjectURL(formRef.current.image_url);
      }
    };
  }, []);

  // Restore draft from sessionStorage after mount (create mode only)
  useEffect(() => {
    if (initial) return;
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as FormState;
        setForm({
          ...parsed,
          _stagedFile: null,
          _initialImageUrl: parsed._initialImageUrl ?? "",
          // blob: URLs don't survive page refreshes — clear them
          image_url: (parsed.image_url ?? "").startsWith("blob:")
            ? ""
            : (parsed.image_url ?? ""),
        });
      }
    } catch {}
    setDraftReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist draft to sessionStorage on every change (create mode only, after restore)
  useEffect(() => {
    if (!draftReady || initial) return;
    try {
      // File objects aren't JSON-serializable; blob: URLs don't survive navigation
      const { _stagedFile, ...draftable } = form;
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          ...draftable,
          image_url: draftable.image_url.startsWith("blob:") ? "" : draftable.image_url,
        }),
      );
    } catch {}
  }, [form, draftReady, initial]);

  const payload = useMemo(() => toCreatePayload(form), [form]);
  const liveErrors = useMemo(() => validatePopup(payload).fieldErrors, [payload]);
  const visibleErrors = showAllErrors ? liveErrors : errors;
  const errorCount = Object.keys(liveErrors).length;

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = validatePopup(payload);
    if (!result.ok) {
      setErrors(result.fieldErrors);
      setShowAllErrors(true);
      return;
    }
    setSubmitting(true);
    try {
      let finalImageUrl: string | null = form.image_url.startsWith("blob:")
        ? null
        : form.image_url.trim() || null;

      // 1. Upload the staged file now
      if (form._stagedFile) {
        const fd = new FormData();
        fd.append("file", form._stagedFile);
        const res = await fetch("/api/popups/upload-image", { method: "POST", body: fd });
        if (!res.ok) {
          const detail = await res.json().catch(() => ({}));
          throw new Error(
            (detail as { detail?: string }).detail ?? `Upload failed (${res.status})`,
          );
        }
        const { url } = (await res.json()) as { url: string };
        if (form.image_url.startsWith("blob:")) URL.revokeObjectURL(form.image_url);
        finalImageUrl = url;
      }

      // 2. Delete old managed image if swapped or removed
      const isManaged = (u: string) =>
        u.startsWith("https://") && u.includes("/release-popups/");
      if (
        form._initialImageUrl &&
        form._initialImageUrl !== finalImageUrl &&
        isManaged(form._initialImageUrl)
      ) {
        await deleteImage(form._initialImageUrl);
      }

      // 3. Submit with the real URL
      const finalPayload: ReleasePopupCreate = { ...payload, image_url: finalImageUrl };
      await onSubmit(finalPayload);

      if (!initial) {
        try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setErrors({ image_url: msg });
      setShowAllErrors(false);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    // Revoke any staged blob URL so the browser can reclaim memory
    if (form.image_url.startsWith("blob:")) {
      URL.revokeObjectURL(form.image_url);
    }
    if (!initial) {
      try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
    }
    onCancel();
  }

  function togglePlanTier(t: PlanTier) {
    setForm((f) => ({
      ...f,
      plan_tiers: f.plan_tiers.includes(t)
        ? f.plan_tiers.filter((x) => x !== t)
        : [...f.plan_tiers, t],
    }));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10">
      {showAllErrors && errorCount > 0 ? (
        <div className="flex items-start gap-2 rounded-md border border-danger/20 bg-danger-bg px-3 py-2 text-sm text-danger">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>
            {errorCount} {errorCount === 1 ? "field needs" : "fields need"} attention.
          </span>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl font-medium tracking-tight text-fg">
            Live preview
          </h2>
          <p className="text-xs text-fg-subtle">
            Exactly how the popup will appear inside the dashboard.
          </p>
        </div>
        <PopupPreview
          title={form.title}
          body={form.body}
          imageUrl={form.image_url}
          imagePosition={form.image_position}
          ctaLabel={form.cta_label}
          ctaUrl={form.cta_url}
        />
      </div>

      <div className="border-t border-border" />

      <Section title="Content" description="Title and body shown inside the popup.">
        <Field
          label="Title"
          htmlFor="f-title"
          required
          error={visibleErrors.title}
          counter={`${form.title.length}/200`}
        >
          <Input
            id="f-title"
            value={form.title}
            maxLength={200}
            placeholder="e.g. Billing System Upgrade"
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            invalid={!!visibleErrors.title}
          />
        </Field>

        <Field
          label="Body"
          htmlFor="f-body"
          required
          error={visibleErrors.body}
          hint="Supports markdown — bold, italic, lists, links, tables."
          counter={`${form.body.length}/5000`}
        >
          <Textarea
            id="f-body"
            rows={6}
            value={form.body}
            maxLength={5000}
            placeholder="Write the announcement…"
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            invalid={!!visibleErrors.body}
          />
        </Field>
      </Section>

      <Section title="Media" description="Optional image and where it sits in the popup.">
        <Field
          label="Image"
          hint="Choose a file (JPG/PNG/WebP, ≤5 MB) or paste a public URL. Upload happens on Save."
          error={visibleErrors.image_url}
        >
          <div className="flex flex-col gap-3">
            <ImageUploadInput
              disabled={submitting}
              onStaged={(file, blobUrl) => {
                // Revoke previous blob if admin re-picks without saving
                if (form.image_url.startsWith("blob:")) {
                  URL.revokeObjectURL(form.image_url);
                }
                setForm({ ...form, image_url: blobUrl, _stagedFile: file });
              }}
            />

            {/* URL paste — hidden while a blob is showing so the field isn't confusing */}
            <Input
              id="f-image"
              type="url"
              value={form.image_url.startsWith("blob:") ? "" : form.image_url}
              placeholder="https://… (or choose a file above)"
              onChange={(e) => {
                if (form.image_url.startsWith("blob:")) {
                  URL.revokeObjectURL(form.image_url);
                }
                setForm({ ...form, image_url: e.target.value, _stagedFile: null });
              }}
              invalid={!!visibleErrors.image_url}
            />

            {form.image_url ? (
              <div className="relative w-40 h-24 rounded-md overflow-hidden border border-border bg-surface-2 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.image_url}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
                {form.image_url.startsWith("blob:") ? (
                  <span className="absolute bottom-1 left-1 rounded px-1 py-0.5 text-[10px] font-medium bg-black/60 text-white leading-none">
                    staged
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    if (form.image_url.startsWith("blob:")) {
                      URL.revokeObjectURL(form.image_url);
                    }
                    setForm({ ...form, image_url: "", _stagedFile: null });
                  }}
                  className="absolute top-1 right-1 h-6 w-6 inline-flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  <X size={12} />
                </button>
              </div>
            ) : null}
          </div>
        </Field>

        <Field label="Image position" hint="Where the image sits relative to the text.">
          <div className="inline-flex rounded-md border border-border bg-surface-2 p-1 gap-1">
            {POSITION_OPTIONS.map(({ value, label, Icon }) => {
              const selected = form.image_position === value;
              return (
                <button
                  type="button"
                  key={value}
                  onClick={() => setForm({ ...form, image_position: value })}
                  disabled={!form.image_url}
                  className={`inline-flex items-center gap-2 h-8 px-3 rounded text-xs font-medium transition-colors cursor-pointer ${
                    selected
                      ? "bg-fg text-accent-fg"
                      : "text-fg-muted hover:text-fg hover:bg-surface-hover"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              );
            })}
          </div>
        </Field>
      </Section>

      <Section
        title="Call to action"
        description="Optional button. Both fields together, or both empty."
      >
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-4">
          <Field label="Label" htmlFor="f-cta-label" error={visibleErrors.cta_label}>
            <Input
              id="f-cta-label"
              value={form.cta_label}
              maxLength={50}
              placeholder="View details"
              onChange={(e) => setForm({ ...form, cta_label: e.target.value })}
              invalid={!!visibleErrors.cta_label}
            />
          </Field>
          <Field label="URL" htmlFor="f-cta-url" error={visibleErrors.cta_url}>
            <Input
              id="f-cta-url"
              type="url"
              value={form.cta_url}
              placeholder="https://app.he2.ai/…"
              onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
              invalid={!!visibleErrors.cta_url}
            />
          </Field>
        </div>
      </Section>

      <Section title="Targeting" description="Who should see this popup.">
        <Field label="Audience">
          <div className="inline-flex rounded-md border border-border bg-surface-2 p-1 gap-1">
            {AUDIENCE_OPTIONS.map((a) => {
              const selected = form.audience === a;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setForm({ ...form, audience: a })}
                  className={`h-8 px-3 rounded text-xs font-medium transition-colors cursor-pointer ${
                    selected
                      ? "bg-fg text-accent-fg"
                      : "text-fg-muted hover:text-fg hover:bg-surface-hover"
                  }`}
                >
                  {AUDIENCE_LABELS[a]}
                </button>
              );
            })}
          </div>
        </Field>

        {form.audience === "specific" ? (
          <Field
            label="Plan tiers"
            error={visibleErrors.plan_tiers}
            hint="Pick at least one. Free users are targeted via the Free audience."
          >
            <div className="flex flex-wrap gap-1.5">
              {PLAN_TIERS.map((t) => {
                const selected = form.plan_tiers.includes(t);
                return (
                  <button
                    type="button"
                    key={t}
                    onClick={() => togglePlanTier(t)}
                    className={`px-3 h-7 rounded-full border text-xs font-medium transition-colors cursor-pointer ${
                      selected
                        ? "bg-fg text-accent-fg border-fg"
                        : "border-border text-fg-muted hover:border-border-strong hover:text-fg"
                    }`}
                  >
                    {TIER_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </Field>
        ) : null}
      </Section>

      <Section
        title="Schedule"
        description="When the popup is shown, and how it ranks against other live popups."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Start at"
            htmlFor="f-start"
            required
            error={visibleErrors.start_at}
          >
            <Input
              id="f-start"
              type="datetime-local"
              value={form.start_at_local}
              onChange={(e) =>
                setForm({ ...form, start_at_local: e.target.value })
              }
              invalid={!!visibleErrors.start_at}
            />
          </Field>
          <Field
            label="End at"
            htmlFor="f-end"
            required
            error={visibleErrors.end_at}
            hint="Defaults to start + 7 days."
          >
            <Input
              id="f-end"
              type="datetime-local"
              value={form.end_at_local}
              onChange={(e) =>
                setForm({ ...form, end_at_local: e.target.value })
              }
              invalid={!!visibleErrors.end_at}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <Field label="Active" htmlFor="f-active">
            <div className="h-9 flex items-center">
              <Toggle
                id="f-active"
                checked={form.is_active}
                onChange={(next) => setForm({ ...form, is_active: next })}
                label={form.is_active ? "Visible to users" : "Hidden"}
              />
            </div>
          </Field>
          <Field
            label="Priority"
            htmlFor="f-priority"
            hint="Higher wins when multiple popups match."
            error={visibleErrors.priority}
          >
            <Input
              id="f-priority"
              type="number"
              step={1}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              invalid={!!visibleErrors.priority}
            />
          </Field>
        </div>
      </Section>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-5">
        <Button type="button" variant="ghost" onClick={handleCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)] gap-6 lg:gap-10">
      <div className="lg:pt-1">
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        {description ? (
          <p className="mt-1 text-xs text-fg-subtle leading-5">{description}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-5 min-w-0">{children}</div>
    </section>
  );
}
