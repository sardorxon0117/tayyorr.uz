"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function AccountForm({
  initial,
}: {
  initial: { role: "ORDERER" | "PREPARER"; login: string; hasPassword: boolean };
}) {
  const router = useRouter();
  const { update } = useSession();

  const [role, setRole] = useState(initial.role);
  const [login, setLogin] = useState(initial.login);
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    const payload: Record<string, string> = {};
    if (role !== initial.role) payload.role = role;
    if (login.trim() && login.trim() !== initial.login)
      payload.login = login.trim();
    if (newPw) {
      payload.newPassword = newPw;
      if (initial.hasPassword) payload.currentPassword = curPw;
    }
    if (Object.keys(payload).length === 0) {
      setMsg({ ok: false, text: "O'zgartirish kiritilmadi" });
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/me/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xatolik");
      await update();
      setCurPw("");
      setNewPw("");
      setMsg({ ok: true, text: "Saqlandi" });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Xatolik" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="card flex flex-col gap-3">
      <h2 className="font-semibold text-white">Akkaunt</h2>

      <div>
        <label className="label">Rol</label>
        <select
          className="input"
          value={role}
          onChange={(e) => setRole(e.target.value as typeof role)}
        >
          <option value="ORDERER">Buyurtma beruvchi</option>
          <option value="PREPARER">Tayyorlovchi</option>
        </select>
        <p className="mt-1 text-[11px] text-zinc-600">
          Faol buyurtma yoki takliflar bo'lsa rolni o'zgartirib bo'lmaydi.
        </p>
      </div>

      <div>
        <label className="label">Login</label>
        <input
          className="input"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          placeholder="login"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {initial.hasPassword && (
          <div>
            <label className="label">Joriy parol</label>
            <input
              className="input"
              type="password"
              value={curPw}
              onChange={(e) => setCurPw(e.target.value)}
              autoComplete="current-password"
            />
          </div>
        )}
        <div>
          <label className="label">
            {initial.hasPassword ? "Yangi parol" : "Parol o'rnatish"}
          </label>
          <input
            className="input"
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="kamida 6 belgi"
            autoComplete="new-password"
          />
        </div>
      </div>

      {msg && (
        <p className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>
          {msg.text}
        </p>
      )}
      <button className="btn-primary" disabled={busy}>
        {busy ? "..." : "Saqlash"}
      </button>
    </form>
  );
}
