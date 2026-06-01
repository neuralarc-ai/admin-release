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

  // Mirror real ReleasePopup: top+image → portrait card (max-w-md), side → wide (max-w-3xl)
  const widthClass = hasImage && imagePosition === "top" ? "max-w-md" : "max-w-3xl";

  const textBlock = (
    <div className={`p-8 flex flex-col gap-4 overflow-y-auto min-w-0 ${!hasImage ? "min-h-[280px]" : ""}`}>
      <h3
        className={`text-2xl font-semibold tracking-tight ${
          title ? "text-fg" : "text-fg-subtle italic"
        }`}
      >
        {title || "Untitled popup"}
      </h3>
      <div className="text-sm text-fg-muted leading-relaxed">
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

  // aspect-video matches the real ReleasePopup's top image pane exactly
  const imageBlockTop = (
    <div className="relative w-full aspect-video bg-surface-2 shrink-0 overflow-hidden">
      <FillImage url={imageUrl} />
    </div>
  );

  // Side image pane stretches to the grid row height (set by md:min-h below)
  const imageBlockSide = (
    <div className="relative hidden md:block bg-surface-2">
      <FillImage url={imageUrl} />
    </div>
  );

  let layout: React.ReactNode;
  if (!hasImage) {
    layout = textBlock;
  } else if (imagePosition === "top") {
    // Portrait card: image stacked above content, same as real modal
    layout = (
      <div className="flex flex-col max-h-[85vh] overflow-y-auto">
        {imageBlockTop}
        {textBlock}
      </div>
    );
  } else if (imagePosition === "right") {
    layout = (
      <div className="grid md:grid-cols-2 md:min-h-112 md:max-h-[80vh]">
        {textBlock}
        {imageBlockSide}
      </div>
    );
  } else {
    layout = (
      <div className="grid md:grid-cols-2 md:min-h-112 md:max-h-[80vh]">
        {imageBlockSide}
        {textBlock}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-bg/40 p-6 sm:p-10 flex items-start justify-center border border-border/60">
      <div
        role="presentation"
        className={`relative w-full ${widthClass} overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl`}
      >
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          className="absolute right-3 top-3 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors"
        >
          <X size={14} />
        </button>

        {layout}
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
