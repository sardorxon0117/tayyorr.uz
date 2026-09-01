"use client";

import { useEffect, useRef, useState } from "react";

import { humanSize } from "@/components/chat-file";
import { RocketIcon } from "@/components/icons";
import { prepareBroadcastFile, type PreparedChatFile } from "@/lib/upload-client";

interface Item {
  id: string;
  body: string;
  fileName?: string | null;
  sentCount: number;
  createdAt: string;
}

const MAX_FILE = 25 * 1024 * 1024;

function fmt(iso: string) {
  return new Date(iso).toLocaleString("uz", { dateStyle: "short", timeStyle: "short" });
}

export function BroadcastConsole({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState<Item[]>(initial);
  const [text, setText] = useState("");
  const [role, setRole] = useState("");
  const [balanceMin, setBalanceMin] = useState("");
  const [balanceMax, setBalanceMax] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<PreparedChatFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadName, setUploadName] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items]);

  function filters() {
    return {
      role: role || undefined,
      balanceMin: balanceMin || undefined,
      balanceMax: balanceMax || undefined,
      registeredFrom: from || undefined,
      registeredTo: to || undefined,
    };
  }

  // filtr o'zgarganda hisob eskiradi
  useEffect(() => {
    setCount(null);
  }, [role, balanceMin, balanceMax, from, to]);

  async function preview() {
    setErr(null);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: "x", preview: true, ...filters() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCount(data.count);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Xatolik");
    }
  }

  async function onPickFile(file: File) {
    setErr(null);
    if (file.size > MAX_FILE) {
      setErr("Fayl 25MB dan katta");
      return;
    }
    setUploading(true);
    setUploadPct(0);
    setUploadName(file.name);
    setAttachment(null);
    try {
      setAttachment(await prepareBroadcastFile(file, setUploadPct));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Fayl yuklanmadi");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if ((!body && !attachment) || uploading) return;
    if (
      !window.confirm(
        count != null
          ? `${count} ta foydalanuvchiga yuborilsinmi?`
          : "Filtrga mos hammaga yuborilsinmi?",
      )
    )
      return;
    const file = attachment;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          file: file
            ? { key: file.key, name: file.name, type: file.type, size: file.size }
            : undefined,
          ...filters(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((p) => [...p, data.broadcast]);
      setText("");
      setAttachment(null);
      setCount(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]"
      style={{ height: "calc(100vh - 12rem)" }}
    >
      {/* ---- filtr (yuqorida) ---- */}
      <div className="shrink-0 border-b border-white/10 bg-white/[0.03] p-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <select
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">Barcha rollar</option>
            <option value="ORDERER">Buyurtma beruvchilar</option>
            <option value="PREPARER">Tayyorlovchilar</option>
          </select>
          <input
            className="input"
            type="number"
            min={0}
            placeholder="Balans dan"
            value={balanceMin}
            onChange={(e) => setBalanceMin(e.target.value)}
          />
          <input
            className="input"
            type="number"
            min={0}
            placeholder="Balans gacha"
            value={balanceMax}
            onChange={(e) => setBalanceMax(e.target.value)}
          />
          <label className="flex flex-col text-[11px] text-zinc-500">
            Ro'yxatdan — dan
            <input
              className="input"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="flex flex-col text-[11px] text-zinc-500">
            Ro'yxatdan — gacha
            <input
              className="input"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={preview}
            className="btn-ghost self-end"
          >
            {count != null ? `${count} ta mos` : "Nechta?"}
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-zinc-600">
          Bo'sh maydonlar hisobga olinmaydi (hammasi).
        </p>
      </div>

      {/* ---- yuborilganlar (chat) ---- */}
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
        {items.length === 0 && (
          <p className="mt-6 text-center text-sm text-zinc-500">
            Hali ommaviy xabar yuborilmagan.
          </p>
        )}
        {items.map((it) => (
          <div key={it.id} className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl bg-indigo-600 px-3.5 py-2 text-sm text-white">
              {it.fileName && (
                <div className="mb-1 rounded-lg bg-white/15 px-2 py-1 text-xs">
                  📎 {it.fileName}
                </div>
              )}
              {it.body && (
                <div className="whitespace-pre-wrap break-words">{it.body}</div>
              )}
              <div className="mt-1 text-right text-[10px] text-indigo-200">
                {it.sentCount} ta · {fmt(it.createdAt)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ---- xabar kiritish (pastda) ---- */}
      <div className="shrink-0 border-t border-white/10 p-3">
        {err && <p className="mb-1 text-xs text-red-400">{err}</p>}

        {(uploading || attachment) && (
          <div className="mb-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-zinc-300">
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate">
                📎 {attachment?.name ?? uploadName}
                {attachment && ` · ${humanSize(attachment.size)}`}
              </span>
              <button
                type="button"
                onClick={() => {
                  setAttachment(null);
                  setUploading(false);
                  setUploadName("");
                }}
                className="shrink-0 text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>
            {uploading && (
              <div className="mt-1.5">
                <div className="h-1.5 overflow-hidden rounded bg-white/10">
                  <div
                    className="h-full rounded bg-indigo-500 transition-all"
                    style={{ width: `${uploadPct}%` }}
                  />
                </div>
                <div className="mt-1 text-[10px] text-zinc-500">
                  {uploadPct}% yuklandi
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={send} className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPickFile(f);
            }}
          />
          <button
            type="button"
            className="btn-ghost flex h-[42px] w-[42px] shrink-0 items-center justify-center !p-0 text-lg leading-none"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? "…" : "📎"}
          </button>
          <textarea
            className="input max-h-32 min-h-[42px] resize-none"
            rows={1}
            placeholder="tayyorr.uz support nomidan xabar…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(e);
              }
            }}
          />
          <button
            className="btn-primary flex h-[42px] w-[42px] shrink-0 items-center justify-center !p-0"
            disabled={busy || uploading || (!text.trim() && !attachment)}
          >
            <RocketIcon />
          </button>
        </form>
      </div>
    </div>
  );
}
