"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4 text-center">
      <span className="text-[5rem] leading-none">⚠️</span>
      <h1 className="text-xl font-semibold text-white">
        Nimadir noto'g'ri ketdi
      </h1>
      <p className="max-w-xs text-sm text-zinc-500">
        Vaqtinchalik xatolik. Qaytadan urinib ko'ring.
      </p>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={reset} className="btn-primary">
          Qaytadan
        </button>
        <Link href="/dashboard" className="btn-ghost">
          Asosiy menyu
        </Link>
      </div>
    </div>
  );
}
