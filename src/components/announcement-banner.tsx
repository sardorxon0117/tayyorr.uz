import Link from "next/link";

import type { ActiveAnnouncement } from "@/lib/announcement";

/** Buyurtmalar ustida turadigan e'lon — faqat kompyuterda ko'rinadi. */
export function AnnouncementBanner({ a }: { a: ActiveAnnouncement }) {
  const external = !!a.buttonUrl && /^https?:\/\//i.test(a.buttonUrl);

  return (
    <div className="mb-4 hidden overflow-hidden rounded-2xl border border-indigo-400/25 bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/10 p-5 lg:block">
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
    </div>
  );
}
