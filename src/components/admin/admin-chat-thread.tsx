"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ChatFileView, humanSize, type ChatFile } from "@/components/chat-file";
import { Linkify } from "@/components/linkify";
import { prepareAdminChatFile, type PreparedChatFile } from "@/lib/upload-client";
import { RocketIcon } from "@/components/icons";
import { AutoTextarea } from "@/components/admin/auto-textarea";
import { PeopleModal, type Person } from "@/components/admin/people-modal";
import { useDismiss } from "@/components/use-dismiss";

interface ReplyPreview {
  id: string;
  authorId: string;
  text: string;
  deleted: boolean;
}

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
  replyTo?: ReplyPreview | null;
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
  const [attachment, setAttachment] = useState<PreparedChatFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadName, setUploadName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ msg: Msg; left: number; top: number } | null>(
    null,
  );
  const menuRef = useRef<HTMLDivElement>(null);
  useDismiss(!!menu, () => setMenu(null), [menuRef]);
  const [replyingTo, setReplyingTo] = useState<ReplyPreview | null>(null);
  const [editing, setEditing] = useState<{ id: string } | null>(null);
  const [people, setPeople] = useState<
    { title: string; loading: boolean; list: Person[] } | null
  >(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(initialMessages.length);
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

  // faqat yangi xabar qo'shilganda pastga tushamiz
  useEffect(() => {
    const grew = messages.length > prevLenRef.current;
    prevLenRef.current = messages.length;
    if (grew) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  function openMenu(m: Msg, btn: HTMLElement) {
    const r = btn.getBoundingClientRect();
    const W = 200;
    const H = 240;
    const M = 8;
    let left = r.right - W;
    if (left < M) left = M;
    let top = r.bottom + 6;
    if (top + H > window.innerHeight - M) top = r.top - H - 6;
    if (top < M) top = M;
    setMenu({ msg: m, left, top });
  }

  async function reply(payload: {
    body?: string;
    replyToId?: string;
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

    if (editing) {
      if (!body) return;
      const id = editing.id;
      setEditing(null);
      setText("");
      try {
        const res = await fetch(`/api/admin/messages/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Saqlanmadi");
        merge([data.message]);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Xatolik");
      }
      return;
    }

    if ((!body && !attachment) || uploading) return;
    const file = attachment;
    const replyToId = replyingTo?.id;
    setText("");
    setAttachment(null);
    setReplyingTo(null);
    setErr(null);
    try {
      await reply({
        body: body || undefined,
        replyToId,
        file: file
          ? { key: file.key, name: file.name, type: file.type, size: file.size }
          : undefined,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Xatolik");
    }
  }

  function startEdit(m: Msg) {
    setMenu(null);
    setReplyingTo(null);
    setEditing({ id: m.id });
    setText(m.body);
  }

  function startReply(m: Msg) {
    setMenu(null);
    setEditing(null);
    setReplyingTo({
      id: m.id,
      authorId: m.senderId,
      text: m.deleted
        ? "o'chirilgan xabar"
        : m.body || (m.file ? `📎 ${m.file.name}` : "xabar"),
      deleted: !!m.deleted,
    });
  }

  async function react(m: Msg, value: "LIKE" | "DISLIKE") {
    setMenu(null);
    const cur = m.reactions ?? { like: 0, dislike: 0, mine: null };
    const next = cur.mine === value ? null : value;
    setMessages((prev) =>
      prev.map((x) => {
        if (x.id !== m.id) return x;
        const r = { ...cur };
        if (cur.mine === "LIKE") r.like--;
        if (cur.mine === "DISLIKE") r.dislike--;
        if (next === "LIKE") r.like++;
        if (next === "DISLIKE") r.dislike++;
        r.mine = next;
        return { ...x, reactions: r };
      }),
    );
    try {
      const res = await fetch(
        `/api/admin/chats/${conversationId}/messages/${m.id}/react`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: next }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) =>
          prev.map((x) =>
            x.id === m.id
              ? {
                  ...x,
                  reactions: {
                    like: data.like,
                    dislike: data.dislike,
                    mine: data.mine,
                  },
                }
              : x,
          ),
        );
      }
    } catch {
      /* ignore */
    }
  }

  async function delMsg(m: Msg) {
    setMenu(null);
    if (!window.confirm("Bu xabar butunlay o'chirilsinmi?")) return;
    try {
      const res = await fetch(`/api/admin/messages/${m.id}`, { method: "DELETE" });
      if (res.ok) setMessages((prev) => prev.filter((x) => x.id !== m.id));
    } catch {
      setErr("O'chirib bo'lmadi");
    }
  }

  async function flagMsg(m: Msg) {
    setMenu(null);
    const note = window.prompt("Ko'rib chiqish uchun izoh (shikoyatlar ro'yxatiga tushadi):");
    if (note == null) return;
    const body = note.trim();
    if (!body) return;
    try {
      const res = await fetch(
        `/api/admin/chats/${conversationId}/messages/${m.id}/flag`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        },
      );
      if (res.ok) setErr("Belgilandi — shikoyatlar bo'limida ko'rinadi.");
    } catch {
      /* ignore */
    }
  }

  function showReactors(m: Msg, kind: "LIKE" | "DISLIKE") {
    setMenu(null);
    const title = kind === "LIKE" ? "Yoqtirganlar" : "Yoqtirmaganlar";
    setPeople({ title, loading: true, list: [] });
    fetch(`/api/admin/chats/${conversationId}/messages/${m.id}/reactors`)
      .then((r) => r.json())
      .then((d) =>
        setPeople({
          title,
          loading: false,
          list: (kind === "LIKE" ? d.likes : d.dislikes) ?? [],
        }),
      )
      .catch(() => setPeople({ title, loading: false, list: [] }));
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
        {messages.map((m) => {
          const showMenu = !m.pending && !m.deleted;
          const r = m.reactions;
          const hasReactions = r && (r.like > 0 || r.dislike > 0);
          const MenuBtn = showMenu ? (
            <button
              type="button"
              onClick={(e) => openMenu(m, e.currentTarget)}
              aria-label="Xabar menyusi"
              className="flex h-7 w-7 shrink-0 items-center justify-center self-end rounded-lg border border-white/15 bg-white/10 text-zinc-300 opacity-100 transition hover:bg-white/20 hover:text-white [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
            >
              ⋮
            </button>
          ) : null;

          return (
            <div
              key={m.id}
              className={`blur-in group flex ${
                m.mine ? "justify-end" : "justify-start"
              }`}
            >
              <div className="flex max-w-[82%] items-end gap-1.5">
                {m.mine && MenuBtn}
                <div
                  className={`space-y-1.5 rounded-2xl px-3.5 py-2 text-sm ${
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
                  {m.replyTo && (
                    <div
                      className={`rounded-md border-l-2 py-1 pl-2 pr-1 text-xs ${
                        m.mine
                          ? "border-white/60 bg-white/15"
                          : "border-indigo-400/70 bg-indigo-500/10"
                      }`}
                    >
                      <div className="truncate opacity-75">{m.replyTo.text}</div>
                    </div>
                  )}
                  {m.file && <ChatFileView file={m.file} mine={m.mine} />}
                  {m.body && (
                    <div className="whitespace-pre-wrap break-words">
                      <Linkify text={m.body} mine={m.mine} />
                    </div>
                  )}
                  {hasReactions && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {r!.like > 0 && (
                        <button
                          type="button"
                          onClick={() => showReactors(m, "LIKE")}
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            m.mine ? "bg-white/15" : "bg-white/10"
                          } hover:bg-white/25`}
                        >
                          👍 {r!.like}
                        </button>
                      )}
                      {r!.dislike > 0 && (
                        <button
                          type="button"
                          onClick={() => showReactors(m, "DISLIKE")}
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            m.mine ? "bg-white/15" : "bg-white/10"
                          } hover:bg-white/25`}
                        >
                          👎 {r!.dislike}
                        </button>
                      )}
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
                {!m.mine && MenuBtn}
              </div>
            </div>
          );
        })}
      </div>

      {err && <p className="px-4 pb-1 text-xs text-amber-300">{err}</p>}

      <div className="border-t border-white/10 p-3">
        {replyingTo && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border-l-2 border-indigo-400 bg-white/5 px-3 py-2 text-xs text-zinc-300">
            <span className="min-w-0 truncate">↩︎ {replyingTo.text}</span>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="shrink-0 text-zinc-500 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}
        {editing && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border-l-2 border-amber-400 bg-white/5 px-3 py-2 text-xs text-zinc-300">
            <span>✎ Tahrirlanmoqda</span>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setText("");
              }}
              className="shrink-0 text-zinc-500 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

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
            disabled={uploading || !!editing}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? "…" : "📎"}
          </button>
          <AutoTextarea
            className="input min-h-[42px]"
            maxRows={5}
            placeholder={
              editing
                ? "xabarni tahrirlang…"
                : "tayyorr.uz support nomidan javob..."
            }
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

      {menu &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[70]" onClick={() => setMenu(null)} />
            <div
              ref={menuRef}
              className="fixed z-[71] w-[200px] overflow-hidden rounded-xl border border-white/10 bg-[#14141b] text-sm shadow-2xl shadow-black/50"
              style={{ left: menu.left, top: menu.top }}
            >
              <div className="flex gap-1 border-b border-white/10 p-1.5">
                {(["LIKE", "DISLIKE"] as const).map((v) => {
                  const on = menu.msg.reactions?.mine === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => react(menu.msg, v)}
                      className={`flex-1 rounded-lg py-1.5 text-lg transition ${
                        on ? "bg-indigo-500/30" : "hover:bg-white/10"
                      }`}
                    >
                      {v === "LIKE" ? "👍" : "👎"}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => startReply(menu.msg)}
                className="block w-full px-3 py-2.5 text-left text-zinc-200 hover:bg-white/5"
              >
                ↩︎ Javob berish
              </button>
              {menu.msg.mine && (
                <button
                  type="button"
                  onClick={() => startEdit(menu.msg)}
                  className="block w-full px-3 py-2.5 text-left text-zinc-200 hover:bg-white/5"
                >
                  ✎ Tahrirlash
                </button>
              )}
              {!menu.msg.mine && (
                <button
                  type="button"
                  onClick={() => flagMsg(menu.msg)}
                  className="block w-full px-3 py-2.5 text-left text-amber-300 hover:bg-white/5"
                >
                  ⚠︎ Shikoyat / belgilash
                </button>
              )}
              <button
                type="button"
                onClick={() => delMsg(menu.msg)}
                className="block w-full px-3 py-2.5 text-left text-red-400 hover:bg-white/5"
              >
                🗑 O'chirish
              </button>
            </div>
          </>,
          document.body,
        )}

      {people && (
        <PeopleModal
          title={people.title}
          people={people.list}
          loading={people.loading}
          onClose={() => setPeople(null)}
        />
      )}
    </div>
  );
}
