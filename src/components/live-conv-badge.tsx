"use client";

import { useUnread } from "@/components/unread-provider";

/** Suhbat uchun o'qilmagan xabarlar soni — real vaqtda (server so'rovsiz). */
export function LiveConvBadge({
  convId,
  initial,
  className = "shrink-0 rounded-full bg-indigo-500 px-2 py-0.5 text-xs font-semibold text-white",
}: {
  convId: string;
  initial: number;
  className?: string;
}) {
  const live = useUnread();
  const n = live ? live.conv(convId, initial) : initial;
  if (n <= 0) return null;
  return <span className={className}>{n > 99 ? "99+" : n}</span>;
}
