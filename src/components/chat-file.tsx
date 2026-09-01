"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export interface ChatFile {
  name: string;
  type: string;
  size: number;
  url: string;
}

export function humanSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** Cross-origin (R2) fayllarни haqiqiy yuklab olish. */
export async function downloadFile(url: string, name: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = name || "fayl";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 4000);
  } catch {
    window.open(url, "_blank", "noopener");
  }
}

function Lightbox({ file, onClose }: { file: ChatFile; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div className="absolute right-3 top-3 flex gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            downloadFile(file.url, file.name);
          }}
          className="flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 text-sm text-white hover:bg-white/20"
        >
          ↓ Yuklab olish
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg text-white hover:bg-white/20"
          aria-label="Yopish"
        >
          ✕
        </button>
      </div>
      <div onClick={(e) => e.stopPropagation()} className="max-h-full max-w-full">
        {file.type.startsWith("video/") ? (
          <video
            src={file.url}
            controls
            playsInline
            preload="metadata"
            className="max-h-[86vh] max-w-[92vw] rounded-lg bg-black"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.url}
            alt={file.name}
            className="max-h-[86vh] max-w-[92vw] rounded-lg object-contain"
          />
        )}
      </div>
    </div>,
    document.body,
  );
}

export function ChatFileView({ file, mine }: { file: ChatFile; mine: boolean }) {
  const [open, setOpen] = useState(false);
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  const isAudio = file.type.startsWith("audio/");

  if (isImage) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block max-w-full overflow-hidden rounded-lg"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={file.url}
            alt={file.name}
            className="max-h-60 max-w-full rounded-lg object-cover"
          />
        </button>
        {open && <Lightbox file={file} onClose={() => setOpen(false)} />}
      </>
    );
  }

  if (isVideo) {
    return (
      <div className="w-[min(280px,72vw)] max-w-full space-y-1">
        <video
          src={file.url}
          controls
          playsInline
          preload="metadata"
          className="max-h-64 w-full rounded-lg bg-black"
        />
        <div className="flex items-center justify-between text-[10px] opacity-70">
          <span className="min-w-0 truncate">{file.name}</span>
          <button
            type="button"
            onClick={() => downloadFile(file.url, file.name)}
            className="shrink-0 hover:underline"
          >
            ↓ yuklab olish
          </button>
        </div>
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className="w-[min(240px,60vw)] max-w-full">
        <div className="mb-1 flex items-center justify-between gap-2 text-xs opacity-80">
          <span className="min-w-0 truncate">{file.name}</span>
          <button
            type="button"
            onClick={() => downloadFile(file.url, file.name)}
            className="shrink-0 hover:underline"
          >
            ↓
          </button>
        </div>
        <audio src={file.url} controls preload="metadata" className="block w-full" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => downloadFile(file.url, file.name)}
      className={`flex max-w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${
        mine ? "bg-white/15" : "bg-white/10"
      }`}
    >
      <span className="text-lg">📎</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{file.name}</span>
        <span className="block text-xs opacity-70">
          {humanSize(file.size)} · yuklab olish
        </span>
      </span>
    </button>
  );
}
