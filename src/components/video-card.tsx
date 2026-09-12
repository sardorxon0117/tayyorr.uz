"use client";

import { useEffect, useRef, useState } from "react";

type VideoItem = { id: string; title: string; videoUrl: string };
type Rect = { top: number; left: number; width: number; height: number };

const GROW_DELAY_MS = 30;

export function VideoCard({
  video,
  spanClassName,
}: {
  video: VideoItem;
  spanClassName: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);
  const [grown, setGrown] = useState(false);
  const [ended, setEnded] = useState(false);
  const [startRect, setStartRect] = useState<Rect | null>(null);

  // Escape bosilsa yopiladi, oyna ochiq bo'lganda fon aylanmaydi
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function targetRect(): Rect {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(vw * 0.92, 900);
    const height = Math.min((width * 9) / 16, vh * 0.85);
    return { width, height, left: (vw - width) / 2, top: (vh - height) / 2 };
  }

  function play() {
    const r = cardRef.current?.getBoundingClientRect();
    if (r) {
      setStartRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }
    setEnded(false);
    setOpen(true);
    setGrown(false);
    window.setTimeout(() => setGrown(true), GROW_DELAY_MS);
  }

  function close() {
    setGrown(false);
    modalVideoRef.current?.pause();
    window.setTimeout(() => {
      setOpen(false);
      setEnded(false);
    }, 520);
  }

  function replay() {
    const el = modalVideoRef.current;
    if (el) {
      el.currentTime = 0;
      el.play().catch(() => {});
    }
    setEnded(false);
  }

  const rect = grown ? targetRect() : startRect;

  return (
    <>
      <div
        ref={cardRef}
        className={`lq-glass blur-in group relative aspect-video overflow-hidden rounded-2xl sm:aspect-auto ${spanClassName}`}
      >
        <video
          className="h-full w-full object-cover"
          src={video.videoUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent p-4 pt-12">
          <p className="text-sm font-medium text-white">{video.title}</p>
        </div>
        <button
          type="button"
          onClick={play}
          aria-label={`${video.title} — ko'rish`}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="hover-pill">
            <PlayIcon className="h-4 w-4" />
            <span className="hover-pill-label">Boshlash</span>
          </span>
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm transition-opacity duration-500"
          style={{ opacity: grown ? 1 : 0 }}
          onClick={close}
        >
          {rect && (
            <div
              className="fixed overflow-hidden rounded-2xl bg-black shadow-2xl shadow-black/60 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
              onClick={(e) => e.stopPropagation()}
            >
              <video
                ref={modalVideoRef}
                className="h-full w-full bg-black object-contain"
                src={video.videoUrl}
                autoPlay
                playsInline
                onEnded={() => setEnded(true)}
              />
              {ended && (
                <button
                  type="button"
                  onClick={replay}
                  aria-label="Qayta boshlash"
                  className="absolute inset-0 flex items-center justify-center bg-black/50"
                >
                  <span className="hover-pill">
                    <ReplayIcon className="h-4 w-4" />
                    <span className="hover-pill-label">Qayta boshlash</span>
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={close}
                aria-label="Yopish"
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function ReplayIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}
