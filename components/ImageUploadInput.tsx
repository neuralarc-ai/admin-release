"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";

interface Props {
  onStaged: (file: File, blobUrl: string) => void;
  disabled?: boolean;
}

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 5 * 1024 * 1024;

export async function deleteImage(url: string): Promise<void> {
  if (!url || !url.includes("/release-popups/")) return;
  await fetch(`/api/popups/upload-image?url=${encodeURIComponent(url)}`, {
    method: "DELETE",
  }).catch(() => {
    // best-effort; don't block save
  });
}

export function ImageUploadInput({ onStaged, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!ACCEPT.split(",").includes(file.type)) {
      setError("Only JPG, PNG, or WebP allowed");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File exceeds 5 MB");
      return;
    }

    setError(null);
    const blobUrl = URL.createObjectURL(file);
    onStaged(file, blobUrl);

    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-dashed border-border text-sm text-fg-muted hover:text-fg hover:border-border-strong transition-colors disabled:opacity-40"
      >
        <Upload size={14} />
        Choose image
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </div>
  );
}
