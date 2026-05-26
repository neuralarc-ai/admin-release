"use client";

import { X, ImageIcon } from "lucide-react";
import { MarkdownPreview } from "./MarkdownPreview";
import type { ImagePosition } from "@/lib/types";

export interface PopupPreviewProps {
  title: string;
  body: string;
  imageUrl: string;
  imagePosition: ImagePosition;
  ctaLabel: string;
  ctaUrl: string;
}

export function PopupPreview({
  title,
  body,
  imageUrl,
  imagePosition,
  ctaLabel,
  ctaUrl,
}: PopupPreviewProps) {
  const hasImage = !!imageUrl.trim();
  const hasCta = !!ctaLabel.trim() && !!ctaUrl.trim();

  const textBlock = (
    <div className="p-8 flex flex-col gap-4 min-h-[320px]">
      <h3
        className={`text-2xl font-semibold tracking-tight ${
          title ? "text-fg" : "text-fg-subtle italic"
        }`}
      >
        {title || "Untitled popup"}
      </h3>
      <div className="text-sm text-fg-muted">
        <MarkdownPreview source={body} />
      </div>
      {hasCta ? (
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          className="mt-auto w-full inline-flex items-center justify-center h-10 px-4 rounded-md bg-fg text-accent-fg text-sm font-medium"
        >
          {ctaLabel}
        </button>
      ) : null}
    </div>
  );

  const imageBlockSide = (
    <div className="relative hidden md:block bg-surface-2 min-h-[320px]">
      <FillImage url={imageUrl} />
    </div>
  );

  const imageBlockTop = (
    <div className="relative bg-surface-2 h-56 w-full overflow-hidden">
      <FillImage url={imageUrl} />
    </div>
  );

  return (
    <div className="rounded-xl bg-bg/40 p-6 sm:p-10 flex items-start justify-center border border-border/60">
      <div
        role="presentation"
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
      >
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          className="absolute right-3 top-3 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors"
        >
          <X size={14} />
        </button>

        {!hasImage ? (
          textBlock
        ) : imagePosition === "top" ? (
          <>
            {imageBlockTop}
            {textBlock}
          </>
        ) : imagePosition === "left" ? (
          <div className="grid md:grid-cols-2">
            {imageBlockSide}
            {textBlock}
          </div>
        ) : (
          <div className="grid md:grid-cols-2">
            {textBlock}
            {imageBlockSide}
          </div>
        )}
      </div>
    </div>
  );
}

function FillImage({ url }: { url: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = "none";
          const fallback = target.nextElementSibling as HTMLElement | null;
          if (fallback) fallback.style.display = "flex";
        }}
      />
      <div
        className="absolute inset-0 hidden items-center justify-center gap-2 bg-surface-2 text-xs text-fg-subtle"
        style={{ display: "none" }}
      >
        <ImageIcon size={14} /> Could not load image
      </div>
    </>
  );
}
