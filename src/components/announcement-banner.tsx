"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import type { ActiveAnnouncement } from "@/lib/announcement";

const ROTATE_MS = 6500;

/** Bitta e'lon kartasi. Indikator karta ichida, pastda turadi. */
export function AnnouncementBanner({
  a,
  indicator,
}: {
  a: Omit<ActiveAnnouncement, "id">;
  indicator?: React.ReactNode;
}) {
  const external = !!a.buttonUrl && /^https?:\/\//i.test(a.buttonUrl);
  return (
    <div className="overflow-hidden rounded-2xl border border-indigo-400/25 bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-base font-semibold text-white">{a.title}</div>
          {a.body && (
            <p className="mt-1 max-w-2xl text-sm text-zinc-300">{a.body}</p>
          )}
        </div>
        {a.buttonText && a.buttonUrl && (
          <Link
            href={a.buttonUrl}
            {...(external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className="btn-white shrink-0"
          >
            {a.buttonText}
          </Link>
        )}
      </div>
      {indicator && <div className="mt-3">{indicator}</div>}
    </div>
  );
}

/** Bir nechta e'lon — kompyuterda navbatlashib turadi. */
export function AnnouncementCarousel({
  items,
}: {
  items: ActiveAnnouncement[];
}) {
  const [i, setI] = useState(0);
  const [tick, setTick] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const many = items.length > 1;

  useEffect(() => {
    if (!many) return;
    if (i > items.length - 1) setI(0);
    timer.current = setTimeout(() => {
      setI((p) => (p + 1) % items.length);
      setTick((t) => t + 1);
    }, ROTATE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [i, many, items.length]);

  if (items.length === 0) return null;
  const cur = items[Math.min(i, items.length - 1)];

  function go(n: number) {
    setI(n);
    setTick((t) => t + 1);
  }

  const indicator = many ? (
    <div className="flex items-center gap-1">
      {items.map((it, n) => (
        <button
          key={it.id}
          type="button"
          aria-label={`E'lon ${n + 1}`}
          onClick={() => go(n)}
          className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-white/15"
        >
          {n < i && (
            <span className="absolute inset-0 rounded-full bg-white/50" />
          )}
          {n === i && (
            <span
              key={tick}
              className="animate-ann-progress absolute inset-y-0 left-0 rounded-full bg-white"
            />
          )}
        </button>
      ))}
    </div>
  ) : undefined;

  return (
    <div className="hidden lg:block">
      <AnnouncementBanner a={cur} indicator={indicator} />
    </div>
  );
}
