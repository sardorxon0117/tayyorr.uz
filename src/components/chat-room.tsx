"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { ReportButton } from "@/components/report-button";
import { ChatFileView, type ChatFile } from "@/components/chat-file";
import { uploadFile } from "@/lib/upload-client";

interface Msg {
  id: string;
  senderId: string;
  body: string;
  system?: boolean;
  createdAt: number;
  mine: boolean;
  pending?: boolean;
  file?: ChatFile | null;
}

interface Props {
  conversationId: string;
  meId: string;
  orderId: string | null;
  other: {
    id: string;
    name: string;
    login: string | null;
    image: string | null;
    isSupport: boolean;
  };
  initialMessages: Msg[];
}

function fmtTime(ms: number) {
  return new Date(ms).toLocaleTimeString("uz", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const MAX_FILE = 25 * 1024 * 1024;

export function ChatRoom({
  conversationId,
  meId,
  orderId,
  other,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState("");
  const [live, setLive] = useState(false);
  const [peerRead, setPeerRead] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMsRef = useRef<number>(
    initialMessages.length ? initialMessages[initialMessages.length - 1].createdAt : 0,
  );

  const merge = useCallback((incoming: Msg[]) => {
    if (!incoming.length) return;
    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const m of incoming) {
        map.set(m.id, m);
        if (m.createdAt > lastMsRef.current) lastMsRef.current = m.createdAt;
      }
      return [...map.values()].sort((a, b) => a.createdAt - b.createdAt);
    });
  }, []);

  const markRead = useCallback(() => {
    fetch(`/api/chat/${conversationId}/read`, { method: "POST" }).catch(() => {});
  }, [conversationId]);

  // --- SSE (real vaqt) ---
  useEffect(() => {
    const es = new EventSource(`/api/chat/${conversationId}/stream`);
    es.onopen = () => setLive(true);
    es.onerror = () => setLive(false);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "message") {
          const m = data.message;
          merge([
            {
              id: m.id,
              senderId: m.senderId,
              body: m.body,
              system: m.system,
              createdAt: new Date(m.createdAt).getTime(),
              mine: m.senderId === meId,
              file: m.file ?? null,
            },
          ]);
          if (m.senderId !== meId && !document.hidden) markRead();
        } else if (data.type === "read" && data.by !== meId) {
          setPeerRead(true);
        }
      } catch {
        /* ignore */
      }
    };
    return () => es.close();
  }, [conversationId, meId, merge, markRead]);

  // --- polling fallback ---
  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/chat/${conversationId}?after=${lastMsRef.current}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.messages?.length) {
          merge(data.messages);
          if (
            data.messages.some((m: Msg) => m.senderId !== meId) &&
            !document.hidden
          ) {
            markRead();
          }
        }
      } catch {
        /* ignore */
      }
    }, 4000);
    return () => clearInterval(iv);
  }, [conversationId, meId, merge, markRead]);

  useEffect(() => {
    markRead();
  }, [markRead]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function postMessage(payload: {
    body?: string;
    file?: { key: string; name: string; type: string; size: number };
  }) {
    const res = await fetch(`/api/chat/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Yuborilmadi");
    merge([{ ...data.message }]);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    setPeerRead(false);
    setErr(null);
    const tmpId = `tmp-${Date.now()}`;
    merge([
      { id: tmpId, senderId: meId, body, createdAt: Date.now(), mine: true, pending: true },
    ]);
    try {
      await postMessage({ body });
      setMessages((prev) => prev.filter((m) => m.id !== tmpId));
    } catch (e) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tmpId
            ? { ...m, pending: false, body: `${m.body} (yuborilmadi)` }
            : m,
        ),
      );
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
      const up = await uploadFile(file, "CHAT", { conversationId });
      await postMessage({
        file: {
          key: up.key,
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
        },
      });
      setPeerRead(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Fayl yuborilmadi");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const lastMineId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].mine && !messages[i].pending) return messages[i].id;
    }
    return null;
  }, [messages]);

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
        <Link
          href="/messages"
          className="rounded-lg px-2 py-1 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
        >
          ←
        </Link>
        <div className="h-9 w-9 overflow-hidden rounded-full border border-white/10 bg-white/5">
          {other.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={other.image} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-white">{other.name}</div>
          <div className="text-xs text-zinc-500">
            {live ? "onlayn ulanish" : "ulanmoqda..."}
            {orderId && (
              <>
                {" · "}
                <Link
                  href={`/orders/${orderId}`}
                  className="text-indigo-400 hover:underline"
                >
                  buyurtma
                </Link>
              </>
            )}
          </div>
        </div>
        {!other.isSupport && other.id && (
          <ReportButton
            suspectId={other.id}
            orderId={orderId ?? undefined}
            label="Shikoyat"
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300 transition hover:bg-white/10"
          />
        )}
      </div>

      {/* messages */}
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto py-4">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-zinc-500">
            Suhbatni boshlang — birinchi xabarni yozing.
          </p>
        )}
        {messages.map((m) =>
          m.system ? (
            <div key={m.id} className="flex justify-center">
              <div className="max-w-[85%] rounded-lg bg-white/5 px-3 py-1.5 text-center text-xs text-zinc-400">
                {m.body}
              </div>
            </div>
          ) : (
            <div
              key={m.id}
              className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] space-y-1.5 rounded-2xl px-3.5 py-2 text-sm ${
                  m.mine
                    ? "bg-indigo-600 text-white"
                    : "border border-white/10 bg-white/5 text-zinc-100"
                } ${m.pending ? "opacity-60" : ""}`}
              >
                {m.file && <ChatFileView file={m.file} mine={m.mine} />}
                {m.body && (
                  <div className="whitespace-pre-wrap break-words">{m.body}</div>
                )}
                <div
                  className={`text-right text-[10px] ${
                    m.mine ? "text-indigo-200" : "text-zinc-500"
                  }`}
                >
                  {fmtTime(m.createdAt)}
                  {m.mine && m.id === lastMineId && peerRead ? " · o'qildi" : ""}
                </div>
              </div>
            </div>
          ),
        )}
      </div>

      {err && <p className="pb-1 text-xs text-red-400">{err}</p>}

      {/* composer */}
      <form
        onSubmit={send}
        className="flex items-end gap-2 border-t border-white/10 pt-3"
      >
        <input
          ref={fileInputRef}
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
          onClick={() => fileInputRef.current?.click()}
          title="Fayl biriktirish"
        >
          {uploading ? "..." : "📎"}
        </button>
        <textarea
          className="input max-h-32 min-h-[42px] resize-none"
          placeholder="Xabar yozing..."
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
