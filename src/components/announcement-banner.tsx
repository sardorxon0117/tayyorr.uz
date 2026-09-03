"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import type { AnnItem } from "@/lib/announcement";
import { useLocale } from "@/components/locale-provider";
import { BlurText } from "@/components/blur-text";

// o'qish uchun vaqt: har bir belgiga ~55ms + 2.5s asos (+1–2s zaxira), [4s..18s]
function readMs(text: string) {
  const chars = text.replace(/\s/g, "").length;
  return Math.min(18000, Math.max(4000, 2500 + chars * 55 + 1500));
}

interface Resolved {
  title: string;
  body: string;
  buttonText: string | null;
  buttonUrl: string | null;
}

/** Bitta e'lon kartasi. Indikator karta ichida, pastda turadi. */
export function AnnouncementBanner({
  a,
  indicator,
}: {
  a: Resolved;
  indicator?: React.ReactNode;
}) {
  const external = !!a.buttonUrl && /^https?:\/\//i.test(a.buttonUrl);
  return (
    <div className="flex h-[9.5rem] flex-col overflow-hidden rounded-2xl border border-indigo-400/25 bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/10 p-4">
      <div className="flex flex-1 flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <BlurText
            text={a.title}
            className="line-clamp-1 block text-base font-semibold text-white"
          />
          {a.body && (
            <BlurText
              text={a.body}
              className="mt-1 line-clamp-3 block max-w-2xl text-sm leading-snug text-zinc-300"
            />
          )}
        </div>
        {a.buttonText && a.buttonUrl && (
          <Link
            href={a.buttonUrl}
            {...(external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className="ann-btn btn-white shrink-0 justify-center overflow-hidden whitespace-nowrap"
          >
            <BlurText text={a.buttonText} />
          </Link>
        )}
      </div>
      {indicator && <div className="mt-3 shrink-0">{indicator}</div>}
    </div>
  );
}

/** Bir nechta e'lon — kompyuterda navbatlashib turadi, joriy tilda. */
export function AnnouncementCarousel({ items }: { items: AnnItem[] }) {
  const { locale } = useLocale();
  const [i, setI] = useState(0);
  const [tick, setTick] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const many = items.length > 1;
  const n = items.length;

  const idx = n ? Math.min(i, n - 1) : 0;
  const raw = n ? items[idx] : null;
  const cur: Resolved = raw
    ? {
        title: raw.title[locale] || raw.title.uz,
        body: raw.body[locale] || raw.body.uz,
        buttonText: raw.buttonText[locale] || raw.buttonText.uz || null,
        buttonUrl: raw.buttonUrl,
      }
    : { title: "", body: "", buttonText: null, buttonUrl: null };

  // joriy e'lonni o'qish uchun kerakli vaqt (barcha harflar, buttondagi ham)
  const dur = readMs(
    `${cur.title} ${cur.body} ${cur.buttonText ?? ""}`,
  );

  useEffect(() => {
    if (!many) return;
    timer.current = setTimeout(() => {
      setI((p) => (p + 1) % n);
      setTick((t) => t + 1);
    }, dur);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [i, many, n, dur]);

  function go(to: number) {
    setI((to + n) % n);
    setTick((t) => t + 1);
  }

  if (n === 0) return null;

  const indicator = many ? (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => go(idx - 1)}
        aria-label="Oldingi"
        className="ann-nav"
      >
        ‹
      </button>
      <div className="flex items-center gap-1">
        {items.map((it, k) => (
          <button
            key={it.id}
            type="button"
            aria-label={`${k + 1}`}
            onClick={() => go(k)}
            className="ann-ind relative h-0.5 w-4 overflow-hidden rounded-full"
          >
            {k < idx && (
              <span className="ann-ind-past absolute inset-0 rounded-full" />
            )}
            {k === idx && (
              <span
                key={tick}
                className="ann-ind-fill absolute inset-y-0 left-0 rounded-full"
                style={{ animation: `ann-progress ${dur}ms linear both` }}
              />
            )}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => go(idx + 1)}
        aria-label="Keyingi"
        className="ann-nav"
      >
        ›
      </button>
    </div>
  ) : undefined;

  return (
    <div className="hidden lg:block">
      <AnnouncementBanner a={cur} indicator={indicator} />
    </div>
  );
}
