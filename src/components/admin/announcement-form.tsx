"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AnnouncementBanner } from "@/components/announcement-banner";

export interface AnnouncementInitial {
  title: string;
  body: string;
  buttonText: string;
  buttonUrl: string;
  active: boolean;
}

export function AnnouncementForm({ initial }: { initial: AnnouncementInitial }) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function set<K extends keyof AnnouncementInitial>(
    k: K,
    v: AnnouncementInitial[K],
  ) {
    setF((s) => ({ ...s, [k]: v }));
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/announcement", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Xatolik");
      setMsg("Saqlandi.");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 rounded-xl border border-white/10 p-4">
        <label className="text-xs text-zinc-500">
          Asosiy matn
          <input
            className="input mt-1"
            value={f.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Masalan: Yangi imkoniyat!"
          />
        </label>
        <label className="text-xs text-zinc-500">
          Tavsif
          <textarea
            className="input mt-1"
            rows={3}
            value={f.body}
            onChange={(e) => set("body", e.target.value)}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-zinc-500">
            Tugma matni
            <input
              className="input mt-1"
              value={f.buttonText}
              onChange={(e) => set("buttonText", e.target.value)}
              placeholder="Batafsil"
            />
          </label>
          <label className="text-xs text-zinc-500">
            Tugma havolasi (URL)
            <input
              className="input mt-1"
              value={f.buttonUrl}
              onChange={(e) => set("buttonUrl", e.target.value)}
              placeholder="/orders/new yoki https://..."
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={f.active}
            onChange={(e) => set("active", e.target.checked)}
          />
          Faol (foydalanuvchilarga ko'rsatilsin)
        </label>
        <div className="flex items-center gap-3">
          <button className="btn-primary" onClick={save} disabled={busy}>
            {busy ? "Saqlanmoqda…" : "Saqlash"}
          </button>
          {msg && <span className="text-sm text-zinc-400">{msg}</span>}
        </div>
        <p className="text-[11px] text-zinc-600">
          Asosiy matnni bo'sh qoldirib saqlasangiz — banner o'chiriladi.
          Banner faqat kompyuterda, buyurtmalar ustida ko'rinadi.
        </p>
      </div>

      {f.title.trim() && f.active && (
        <div>
          <div className="mb-2 text-xs uppercase text-zinc-600">Ko'rinishi</div>
          <AnnouncementBanner
            a={{
              title: f.title,
              body: f.body,
              buttonText: f.buttonText || null,
              buttonUrl: f.buttonUrl || null,
            }}
          />
        </div>
      )}
    </div>
  );
}
