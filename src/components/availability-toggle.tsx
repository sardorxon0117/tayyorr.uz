"use client";

import { useState } from "react";

export function AvailabilityToggle({ initial }: { initial: boolean }) {
  const [available, setAvailable] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    // optimistik yangilanish
    const next = !available;
    setAvailable(next);
    try {
      const res = await fetch("/api/me/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setAvailable(data.isAvailable);
    } catch {
      setAvailable(!next); // qaytaramiz
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`btn border ${
        available
          ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
          : "border-amber-400/30 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
      }`}
    >
      <span
        className={`mr-2 inline-block h-2 w-2 rounded-full ${
          available ? "bg-emerald-400" : "bg-amber-400"
        }`}
      />
      {available ? "Bo'sh (buyurtma qabul qilaman)" : "Band"}
    </button>
  );
}
