"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { PasswordInput } from "@/components/password-input";

export function AccountForm({
  initial,
}: {
  initial: { role: "ORDERER" | "PREPARER"; login: string };
}) {
  const router = useRouter();
  const { update } = useSession();

  const [role, setRole] = useState(initial.role);
  const [login, setLogin] = useState(initial.login);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (pw || pw2) {
      if (pw.length < 6) {
        setMsg({ ok: false, text: "Parol kamida 6 belgi" });
        return;
      }
      if (pw !== pw2) {
        setMsg({ ok: false, text: "Parollar mos emas" });
        return;
      }
    }

    const payload: Record<string, string> = {};
    if (role !== initial.role) payload.role = role;
    if (login.trim() && login.trim() !== initial.login)
      payload.login = login.trim();
    if (pw) payload.newPassword = pw;

    if (Object.keys(payload).length === 0) {
      setMsg({ ok: false, text: "O'zgartirish kiritilmadi" });
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/me/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xatolik");
      await update();
      setPw("");
      setPw2("");
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
        <div>
          <label className="label">Yangi parol</label>
          <PasswordInput
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="kamida 6 belgi"
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="label">Parolni takrorlang</label>
          <PasswordInput
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
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
