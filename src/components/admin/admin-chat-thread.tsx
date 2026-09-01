"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ChatFileView, type ChatFile } from "@/components/chat-file";
import { Linkify } from "@/components/linkify";

interface Msg {
  id: string;
  senderId: string;
  body: string;
  system?: boolean;
  createdAt: number;
  updatedAt?: number;
  mine: boolean;
  edited?: boolean;
  deleted?: boolean;
  file?: ChatFile | null;
  pending?: boolean;
}

const MAX_FILE = 25 * 1024 * 1024;

function fmt(ms: number) {
  return new Date(ms).toLocaleString("uz", { dateStyle: "short", timeStyle: "short" });
}

export function AdminChatThread({
  conversationId,
  initialMessages,
}: {
  conversationId: string;
  initialMessages: Msg[];
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sinceMs = useRef(
    initialMessages.reduce(
      (mx, x) => Math.max(mx, x.updatedAt || x.createdAt),
      0,
    ),
  );

  const merge = useCallback((incoming: Msg[]) => {
    if (!incoming.length) return;
    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const m of incoming) {
        map.set(m.id, { ...map.get(m.id), ...m });
        const t = m.updatedAt || m.createdAt;
        if (t > sinceMs.current) sinceMs.current = t;
      }
      return [...map.values()].sort((a, b) => a.createdAt - b.createdAt);
    });
  }, []);

  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/admin/chats/${conversationId}/messages?since=${sinceMs.current}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.messages?.length) merge(data.messages);
      } catch {
        /* ignore */
      }
    }, 3000);
    return () => clearInterval(iv);
  }, [conversationId, merge]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function reply(payload: {
    body?: string;
    file?: { key: string; name: string; type: string; size: number };
  }) {
    const res = await fetch(`/api/admin/chats/${conversationId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Yuborilmadi");
    merge([data.message]);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    setErr(null);
    try {
      await reply({ body });
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
    try {
      const pres = await fetch("/api/admin/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          filename: file.name,
          contentType: file.type || "application/octet-stream",
        }),
      });
      const p = await pres.json();
      if (!pres.ok) throw new Error(p.error || "Yuklab bo'lmadi");
      const put = await fetch(p.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok) throw new Error("R2 ga yuklanmadi");
      await reply({
        file: {
          key: p.key,
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
        },
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Fayl yuborilmadi");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] flex-col rounded-xl border border-white/10 bg-white/[0.02]">
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="mt-6 text-center text-sm text-zinc-500">Xabarlar yo'q.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[78%] space-y-1.5 rounded-2xl px-3.5 py-2 text-sm ${
                m.deleted
                  ? "border border-red-400/30 bg-red-500/5 text-zinc-300"
                  : m.mine
                    ? "bg-indigo-600 text-white"
                    : "border border-white/10 bg-white/5 text-zinc-100"
              }`}
            >
              {m.deleted && (
                <div className="text-[10px] font-semibold uppercase text-red-400">
                  o'chirilgan
                </div>
              )}
              {m.file && <ChatFileView file={m.file} mine={m.mine} />}
              {m.body && (
                <div className="whitespace-pre-wrap break-words">
                  <Linkify text={m.body} mine={m.mine} />
                </div>
              )}
              <div
                className={`text-right text-[10px] ${
                  m.mine && !m.deleted ? "text-indigo-200" : "text-zinc-500"
                }`}
              >
                {m.edited && "tahrirlangan · "}
                {m.mine ? "support" : "foydalanuvchi"} · {fmt(m.createdAt)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {err && <p className="px-4 pb-1 text-xs text-red-400">{err}</p>}

      <form
        onSubmit={send}
        className="flex items-end gap-2 border-t border-white/10 p-3"
      >
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
          className="btn-ghost shrink-0"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? "..." : "📎"}
        </button>
        <textarea
          className="input max-h-32 min-h-[42px] resize-none"
          placeholder="tayyorr.uz support nomidan javob..."
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(e);
            }
          }}
        />
        <button className="btn-primary shrink-0" disabled={!text.trim()}>
          Yuborish
        </button>
      </form>
    </div>
  );
}
