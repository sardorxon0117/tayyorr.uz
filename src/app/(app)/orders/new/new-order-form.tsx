"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TYPES = [
  ["PRESENTATION", "Prezentatsiya"],
  ["COURSE_WORK", "Kurs ishi"],
  ["REFERAT", "Referat"],
  ["ESSAY", "Esse"],
  ["DIPLOMA", "Diplom ishi"],
  ["OTHER", "Boshqa"],
] as const;

export function NewOrderForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    type: "PRESENTATION",
    description: "",
    deadline: "",
    budget: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          description: form.description,
          deadline: form.deadline
            ? new Date(form.deadline).toISOString()
            : undefined,
          budget: form.budget ? Number(form.budget) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xatolik");
      // replace — "orqaga" bosilganda /orders/new ga qaytmasin
      router.replace(`/orders/${data.order.id}`);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-5 text-2xl font-semibold tracking-tight text-white">
        Yangi buyurtma
      </h1>
      <form onSubmit={submit} className="card flex flex-col gap-3">
        <div>
          <label className="label">Sarlavha</label>
          <input
            className="input"
            required
            minLength={5}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Turi</label>
          <select
            className="input"
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
          >
            {TYPES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Tavsif</label>
          <textarea
            className="input"
            rows={5}
            required
            minLength={10}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Mavzu, talablar, hajm, formatlash..."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Muddat</label>
            <input
              className="input"
              type="date"
              value={form.deadline}
              onChange={(e) => set("deadline", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Byudjet (so'm)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={form.budget}
              onChange={(e) => set("budget", e.target.value)}
            />
          </div>
        </div>

        {err && <p className="text-sm text-red-400">{err}</p>}

        <button className="btn-primary" disabled={busy}>
          {busy ? "..." : "Buyurtmani e'lon qilish"}
        </button>
      </form>
    </div>
  );
}
