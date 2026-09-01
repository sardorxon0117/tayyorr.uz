"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ChatFileView, type ChatFile } from "@/components/chat-file";
import { Linkify } from "@/components/linkify";

interface Msg {
  id: string;
  senderId: string;
  body: string;
  system: boolean;
  createdAt: number;
  edited: boolean;
  deleted: boolean;
  mine: boolean; // = perspektiva foydalanuvchisi (o'ng tomon)
  replyTo: { id: string; authorId: string; text: string; deleted: boolean } | null;
  file: ChatFile | null;
}

interface Party {
  id: string;
  label: string;
}

function fmt(ms: number) {
  return new Date(ms).toLocaleString("uz", { dateStyle: "short", timeStyle: "short" });
}

/** Admin uchun ikki foydalanuvchi yozishmasini oddiy chat ko'rinishida (faqat o'qish). */
export function AdminConversationView({
  left,
  right,
  messages,
  revisions,
}: {
  left: Party;
  right: Party;
  messages: Msg[];
  revisions: Record<string, string[]>;
}) {
  const router = useRouter();
  const nameOf = (senderId: string) =>
    senderId === left.id ? left.label : senderId === right.id ? right.label : "—";

  const [openRev, setOpenRev] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function delMsg(msgId: string) {
    if (!window.confirm("Bu xabar butunlay o'chiriladi. Davom etilsinmi?")) return;
    setDeleting(msgId);
    try {
      const res = await fetch(`/api/admin/messages/${msgId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto rounded-xl border border-white/10 bg-[#0b0b12]/40 p-4">
      {messages.length === 0 && (
        <p className="text-sm text-zinc-500">Xabarlar yo'q.</p>
      )}
      {messages.map((m) => {
        if (m.system) {
          return (
            <div key={m.id} className="flex justify-center">
              <div className="max-w-[80%] rounded-lg bg-white/5 px-3 py-1.5 text-center text-xs text-zinc-400">
                {m.body}
              </div>
            </div>
          );
        }
        const rev = revisions[m.id];
        return (
          <div
            key={m.id}
            className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
          >
            <div className="max-w-[78%]">
              <div className="mb-0.5 flex items-center gap-2 px-1 text-[10px] text-zinc-500">
                <span>{nameOf(m.senderId)}</span>
                <button
                  type="button"
                  disabled={deleting === m.id}
                  onClick={() => delMsg(m.id)}
                  className="text-red-400/70 hover:text-red-400"
                >
                  {deleting === m.id ? "..." : "o'chirish"}
                </button>
              </div>
              <div
                className={`space-y-1.5 rounded-2xl px-3.5 py-2 text-sm ${
                  m.deleted
                    ? "border border-red-400/30 bg-red-500/5 text-zinc-400"
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
                {m.replyTo && (
                  <div className="rounded-md border-l-2 border-white/30 bg-black/10 py-1 pl-2 text-xs opacity-80">
                    <div className="font-medium">{nameOf(m.replyTo.authorId)}</div>
                    <div className="truncate">{m.replyTo.text}</div>
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
                  {fmt(m.createdAt)}
                </div>
              </div>

              {rev && rev.length > 0 && (
                <div className="mt-1 px-1 text-[10px] text-zinc-500">
                  <button
                    type="button"
                    onClick={() => setOpenRev(openRev === m.id ? null : m.id)}
                    className="hover:text-zinc-300"
                  >
                    {openRev === m.id ? "▾" : "▸"} tahrirlar tarixi ({rev.length})
                  </button>
                  {openRev === m.id && (
                    <div className="mt-1 space-y-0.5 border-l border-white/10 pl-2">
                      {rev.map((r, i) => (
                        <div key={i} className="whitespace-pre-wrap">
                          <span className="text-zinc-600">v{i + 1}:</span> {r}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
