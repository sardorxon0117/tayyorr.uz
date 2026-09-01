"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { ReportButton } from "@/components/report-button";
import { ChatFileView, humanSize, type ChatFile } from "@/components/chat-file";
import { NavMenu } from "@/components/nav-menu";
import { APP_NAV } from "@/lib/nav";
import { prepareChatFile, type PreparedChatFile } from "@/lib/upload-client";

interface Msg {
  id: string;
  senderId: string;
  body: string;
  system?: boolean;
  createdAt: number;
  updatedAt: number;
  mine: boolean;
  edited?: boolean;
  deleted?: boolean;
  pending?: boolean;
  file?: ChatFile | null;
}

interface Props {
  conversationId: string;
  meId: string;
  myImage: string | null;
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
  return new Date(ms).toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" });
}

const MAX_FILE = 100 * 1024 * 1024;

export function ChatRoom({
  conversationId,
  meId,
  myImage,
  orderId,
  other,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState<Msg[]>(
    initialMessages.filter((m) => !m.deleted),
  );
  const [text, setText] = useState("");
  const [live, setLive] = useState(false);
  const [peerRead, setPeerRead] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // biriktirilgan fayl (hali yuborilmagan)
  const [attachment, setAttachment] = useState<PreparedChatFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadName, setUploadName] = useState("");

  const [editing, setEditing] = useState<{ id: string } | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sinceRef = useRef<number>(
    initialMessages.reduce((m, x) => Math.max(m, x.updatedAt || x.createdAt), 0),
  );

  const merge = useCallback((incoming: Msg[]) => {
    if (!incoming.length) return;
    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const m of incoming) {
        const t = m.updatedAt || m.createdAt;
        if (t > sinceRef.current) sinceRef.current = t;
        if (m.deleted) map.delete(m.id); // foydalanuvchida yo'qoladi
        else map.set(m.id, { ...map.get(m.id), ...m });
      }
      return [...map.values()].sort((a, b) => a.createdAt - b.createdAt);
    });
  }, []);

  const applyDelete = useCallback((id: string, updatedAt: number) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (updatedAt > sinceRef.current) sinceRef.current = updatedAt;
  }, []);

  const markRead = useCallback(() => {
    fetch(`/api/chat/${conversationId}/read`, { method: "POST" }).catch(() => {});
  }, [conversationId]);

  // SSE
  useEffect(() => {
    const es = new EventSource(`/api/chat/${conversationId}/stream`);
    es.onopen = () => setLive(true);
    es.onerror = () => setLive(false);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "message" || data.type === "edit") {
          const m = data.message;
          merge([
            {
              id: m.id,
              senderId: m.senderId,
              body: m.body,
              system: m.system,
              createdAt: new Date(m.createdAt).getTime(),
              updatedAt: new Date(m.updatedAt).getTime(),
              mine: m.senderId === meId,
              edited: m.edited,
              deleted: m.deleted,
              file: m.file ?? null,
            },
          ]);
          if (data.type === "message" && m.senderId !== meId && !document.hidden) {
            markRead();
          }
        } else if (data.type === "delete") {
          applyDelete(data.messageId, new Date(data.updatedAt).getTime());
        } else if (data.type === "read" && data.by !== meId) {
          setPeerRead(true);
        }
      } catch {
        /* ignore */
      }
    };
    return () => es.close();
  }, [conversationId, meId, merge, applyDelete, markRead]);

  // polling fallback (yangi + tahrirlangan + o'chirilgan)
  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/chat/${conversationId}?since=${sinceRef.current}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.messages?.length) {
          merge(data.messages);
          if (
            data.messages.some((m: Msg) => m.senderId !== meId && !m.deleted) &&
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

  async function onPickFile(file: File) {
    setErr(null);
    setMenuFor(null);
    if (file.size > MAX_FILE) {
      setErr("Fayl 100MB dan katta");
      return;
    }
    setUploading(true);
    setUploadPct(0);
    setUploadName(file.name);
    setAttachment(null);
    try {
      const prepared = await prepareChatFile(file, conversationId, setUploadPct);
      setAttachment(prepared);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Fayl yuklanmadi");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function startEdit(m: Msg) {
    setEditing({ id: m.id });
    setText(m.body);
    setMenuFor(null);
    setAttachment(null);
  }

  function cancelEdit() {
    setEditing(null);
    setText("");
  }

  async function del(m: Msg) {
    setMenuFor(null);
    if (!window.confirm("Xabar ikkala tomondan ham o'chirilsinmi?")) return;
    applyDelete(m.id, Date.now());
    try {
      const res = await fetch(`/api/chat/${conversationId}/messages/${m.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
    } catch {
      setErr("O'chirib bo'lmadi");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();

    if (editing) {
      if (!body) return;
      const editId = editing.id;
      setEditing(null);
      setText("");
      try {
        const res = await fetch(
          `/api/chat/${conversationId}/messages/${editId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body }),
          },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        merge([data.message]);
      } catch (e2) {
        setErr(e2 instanceof Error ? e2.message : "Tahrirlab bo'lmadi");
      }
      return;
    }

    if (!body && !attachment) return;
    if (uploading) return;

    const sentFile = attachment;
    setText("");
    setAttachment(null);
    setPeerRead(false);

    const tmpId = `tmp-${Date.now()}`;
    merge([
      {
        id: tmpId,
        senderId: meId,
        body,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        mine: true,
        pending: true,
        file: sentFile
          ? { name: sentFile.name, type: sentFile.type, size: sentFile.size, url: "" }
          : null,
      },
    ]);

    try {
      const res = await fetch(`/api/chat/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body || undefined,
          file: sentFile
            ? {
                key: sentFile.key,
                name: sentFile.name,
                type: sentFile.type,
                size: sentFile.size,
              }
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Yuborilmadi");
      setMessages((prev) => prev.filter((m) => m.id !== tmpId));
      merge([data.message]);
    } catch (e2) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tmpId
            ? { ...m, pending: false, body: `${m.body} (yuborilmadi)` }
            : m,
        ),
      );
      setErr(e2 instanceof Error ? e2.message : "Xatolik");
    }
  }

  const lastMineId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.mine && !m.pending && !m.deleted) return m.id;
    }
    return null;
  }, [messages]);

  const canSend =
    !uploading && (editing ? !!text.trim() : !!text.trim() || !!attachment);

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col"
      onClick={() => menuFor && setMenuFor(null)}
    >
      {/* ---- birlashgan header (sayt + suhbat) ---- */}
      <header className="shrink-0 border-b border-white/10 bg-[#0b0b12]/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-3 py-2.5 sm:px-4">
          <Link
            href="/messages"
            className="-ml-1 rounded-lg px-1.5 py-1 text-lg text-zinc-400 transition hover:bg-white/5 hover:text-white"
            aria-label="Orqaga"
          >
            ‹
          </Link>
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5">
            {other.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={other.image} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-white">{other.name}</div>
            <div className="truncate text-xs text-zinc-500">
              {live ? "onlayn" : "ulanmoqda…"}
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
              className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300 transition hover:bg-white/10"
            />
          )}
          <Link
            href="/profile"
            className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/5 transition hover:border-white/30"
            aria-label="Profil"
          >
            {myImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={myImage} alt="" className="h-full w-full object-cover" />
            )}
          </Link>
          <NavMenu links={APP_NAV} />
        </div>
      </header>

      {/* ---- xabarlar + suzuvchi composer ---- */}
      <div className="relative min-h-0 flex-1">
        <div ref={scrollRef} className="h-full overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-2 px-3 pb-36 pt-4 sm:px-4">
            {messages.length === 0 && (
              <p className="mt-10 text-center text-sm text-zinc-500">
                Suhbatni boshlang.
              </p>
            )}
            {messages.map((m) => {
              if (m.system) {
                return (
                  <div key={m.id} className="flex justify-center">
                    <div className="max-w-[85%] rounded-lg bg-white/5 px-3 py-1.5 text-center text-xs text-zinc-400">
                      {m.body}
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={m.id}
                  className={`group flex ${m.mine ? "justify-end" : "justify-start"}`}
                >
                  <div className="relative flex max-w-[82%] items-end gap-1">
                    {m.mine && !m.pending && !m.deleted && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuFor(menuFor === m.id ? null : m.id);
                          }}
                          className="mb-1 rounded px-1 text-zinc-500 opacity-0 transition hover:text-white group-hover:opacity-100"
                          aria-label="Menyu"
                        >
                          ⋮
                        </button>
                        {menuFor === m.id && (
                          <div className="menu-panel absolute bottom-6 right-0 z-30 w-32 overflow-hidden rounded-xl border border-white/10 bg-[#14141b]/95 text-sm shadow-xl backdrop-blur-xl">
                            <button
                              type="button"
                              onClick={() => startEdit(m)}
                              className="block w-full px-3 py-2 text-left text-zinc-200 hover:bg-white/5"
                            >
                              Tahrirlash
                            </button>
                            <button
                              type="button"
                              onClick={() => del(m)}
                              className="block w-full px-3 py-2 text-left text-red-400 hover:bg-white/5"
                            >
                              O'chirish
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      className={`space-y-1.5 rounded-2xl px-3.5 py-2 text-sm ${
                        m.mine
                          ? "bg-indigo-600 text-white"
                          : "border border-white/10 bg-white/5 text-zinc-100"
                      } ${m.pending ? "opacity-60" : ""}`}
                    >
                      {m.file && m.file.url && (
                        <ChatFileView file={m.file} mine={m.mine} />
                      )}
                      {m.file && !m.file.url && (
                        <div className="text-xs opacity-70">
                          📎 {m.file.name} · yuborilmoqda…
                        </div>
                      )}
                      {m.body && (
                        <div className="whitespace-pre-wrap break-words">{m.body}</div>
                      )}
                      <div
                        className={`text-right text-[10px] ${
                          m.mine ? "text-indigo-200" : "text-zinc-500"
                        }`}
                      >
                        {m.edited && "tahrirlangan · "}
                        {fmtTime(m.createdAt)}
                        {m.mine && m.id === lastMineId && peerRead ? " · o'qildi" : ""}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* suzuvchi, chegarali, blurli composer — pastda bo'shliq bilan */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 px-3 sm:px-4"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl border border-white/15 bg-[#0b0b12]/80 p-2.5 shadow-2xl shadow-black/40 backdrop-blur-2xl">
            {err && <p className="mb-2 px-1 text-xs text-red-400">{err}</p>}

            {editing && (
              <div className="mb-2 flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5 text-xs text-zinc-300">
                <span>Xabarni tahrirlash</span>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-zinc-500 hover:text-white"
                >
                  bekor ✕
                </button>
              </div>
            )}

            {(uploading || attachment) && !editing && (
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

            <form onSubmit={submit} className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onPickFile(f);
                }}
              />
              {!editing && (
                <button
                  type="button"
                  className="btn-ghost shrink-0"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  title="Fayl biriktirish"
                >
                  {uploading ? "…" : "📎"}
                </button>
              )}
              <textarea
                className="input max-h-32 min-h-[42px] resize-none bg-white/[0.03]"
                placeholder={editing ? "Yangi matn…" : "Xabar yozing…"}
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit(e);
                  }
                }}
              />
              <button className="btn-primary shrink-0" disabled={!canSend}>
                {editing ? "Saqlash" : "Yuborish"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
