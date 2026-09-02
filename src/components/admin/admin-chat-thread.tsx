"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ChatFileView, humanSize, type ChatFile } from "@/components/chat-file";
import { Linkify } from "@/components/linkify";
import { prepareAdminChatFile, type PreparedChatFile } from "@/lib/upload-client";
import { RocketIcon } from "@/components/icons";
import { AutoTextarea } from "@/components/admin/auto-textarea";

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
  reactions?: { like: number; dislike: number; mine: "LIKE" | "DISLIKE" | null };
  file?: ChatFile | null;
  pending?: boolean;
}

function ReactionChips({ r }: { r?: Msg["reactions"] }) {
  if (!r || (r.like === 0 && r.dislike === 0)) return null;
  return (
    <div className="flex gap-1.5 pt-1">
      {r.like > 0 && (
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">👍 {r.like}</span>
      )}
      {r.dislike > 0 && (
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">👎 {r.dislike}</span>
      )}
    </div>
  );
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
  const [attachment, setAttachment] = useState<PreparedChatFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadName, setUploadName] = useState("");
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
    if ((!body && !attachment) || uploading) return;
    const file = attachment;
    setText("");
    setAttachment(null);
    setErr(null);
    try {
      await reply({
        body: body || undefined,
        file: file
          ? { key: file.key, name: file.name, type: file.type, size: file.size }
          : undefined,
      });
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
      const prepared = await prepareAdminChatFile(file, conversationId, setUploadPct);
      setAttachment(prepared);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Fayl yuklanmadi");
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
              <ReactionChips r={m.reactions} />
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

      <div className="border-t border-white/10 p-3">
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
          <AutoTextarea
            className="input min-h-[42px]"
            maxRows={5}
            placeholder="tayyorr.uz support nomidan javob..."
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
            disabled={uploading || (!text.trim() && !attachment)}
          >
            <RocketIcon />
          </button>
        </form>
      </div>
    </div>
  );
}
