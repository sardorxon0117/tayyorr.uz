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

function Lightbox({
  file,
  onClose,
}: {
  file: ChatFile;
  onClose: () => void;
}) {
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
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg text-white hover:bg-white/20"
        aria-label="Yopish"
      >
        ✕
      </button>
      <div onClick={(e) => e.stopPropagation()} className="max-h-full max-w-full">
        {file.type.startsWith("video/") ? (
          <video
            src={file.url}
            controls
            autoPlay
            className="max-h-[88vh] max-w-[92vw] rounded-lg"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.url}
            alt={file.name}
            className="max-h-[88vh] max-w-[92vw] rounded-lg object-contain"
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

  if (isImage || isVideo) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative block max-w-full overflow-hidden rounded-lg"
        >
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={file.url}
              alt={file.name}
              className="max-h-60 max-w-full rounded-lg object-cover"
            />
          ) : (
            <>
              <video
                src={`${file.url}#t=0.1`}
                preload="metadata"
                muted
                playsInline
                className="max-h-60 max-w-full rounded-lg bg-black object-cover"
              />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-lg text-white">
                  ▶
                </span>
              </span>
            </>
          )}
        </button>
        {open && <Lightbox file={file} onClose={() => setOpen(false)} />}
      </>
    );
  }

  if (isAudio) {
    return (
      <div className="w-[min(240px,60vw)] max-w-full">
        <div className="mb-1 truncate text-xs opacity-80">{file.name}</div>
        <audio
          src={file.url}
          controls
          preload="metadata"
          className="block w-full"
        />
      </div>
    );
  }

  return (
    <a
      href={file.url}
      target="_blank"
      rel="noreferrer"
      className={`flex max-w-full items-center gap-3 rounded-lg px-3 py-2 ${
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
    </a>
  );
}
