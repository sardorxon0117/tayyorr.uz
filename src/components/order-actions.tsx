"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { ReportButton } from "@/components/report-button";
import { ReviewForm } from "@/components/review-form";
import { Stars } from "@/components/stars";

interface OfferView {
  id: string;
  price: number;
  message: string | null;
  status: string;
  preparerId: string;
  starsSpent: number;
  preparer: {
    name: string;
    login: string | null;
    about: string | null;
    rating: number | null;
    ratingCount: number;
  };
}

interface QueueRow {
  position: number;
  mine: boolean;
  starsSpent: number;
  visible: string;
  hiddenLen: number;
}

interface Props {
  orderId: string;
  status: string;
  isOrderer: boolean;
  isPreparer: boolean;
  isAssigned: boolean;
  ordererId: string;
  reviewed: boolean;
  myReview: { stars: number; comment: string | null } | null;
  myOffer: {
    id: string;
    price: number;
    message: string | null;
    status: string;
    starsSpent: number;
  } | null;
  offers: OfferView[];
  queue: QueueRow[];
  meId: string;
  contracts: {
    id: string;
    preparerId: string;
    preparerName: string;
    amount: number;
    note: string | null;
    status: string;
  }[];
}

const STAR_PRICE = 2_000;
const MIN_OFFER_STARS = 2;

export function OrderActions(props: Props) {
  const router = useRouter();
  const {
    orderId,
    status,
    isOrderer,
    isPreparer,
    isAssigned,
    ordererId,
    reviewed,
    myReview,
    myOffer,
    offers,
    queue,
    meId,
    contracts,
  } = props;

  const [price, setPrice] = useState(myOffer?.price?.toString() ?? "");
  const [message, setMessage] = useState(myOffer?.message ?? "");
  const [boostStars, setBoostStars] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // shartnoma yuborish formasi (qaysi tayyorlovchiga)
  const [contractFor, setContractFor] = useState<string | null>(null);
  const [cAmount, setCAmount] = useState("");
  const [cNote, setCNote] = useState("");

  const sentContract = contracts.find((c) => c.status === "SENT") ?? null;
  const acceptedContract = contracts.find((c) => c.status === "ACCEPTED") ?? null;
  const myIncomingContract =
    isPreparer && sentContract?.preparerId === meId ? sentContract : null;

  async function sendContract(preparerId: string) {
    if (!cAmount || Number(cAmount) <= 0) {
      setErr("Summani kiriting");
      return;
    }
    await call(`/api/orders/${orderId}/contract`, "POST", {
      preparerId,
      amount: Number(cAmount),
      note: cNote || undefined,
    });
    setContractFor(null);
    setCAmount("");
    setCNote("");
  }

  async function boost() {
    const stars = Number(boostStars);
    if (!stars || stars <= 0) {
      setErr("Star sonini kiriting");
      return;
    }
    await call(`/api/orders/${orderId}/offers/boost`, "POST", { stars });
    setBoostStars("");
  }

  async function startChat(userId: string) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat ochilmadi");
      router.push(`/messages/${data.conversationId}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Xatolik");
      setBusy(false);
    }
  }

  async function call(url: string, method: string, body?: unknown) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Xatolik");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {err && <p className="text-sm text-red-400">{err}</p>}

      {isAssigned && (
        <button
          type="button"
          className="btn-ghost w-fit"
          disabled={busy}
          onClick={() => startChat(ordererId)}
        >
          💬 Buyurtmachi bilan yozishish
        </button>
      )}

      {/* Tayyorlovchiga kelgan shartnoma */}
      {myIncomingContract && (
        <div className="card border-indigo-400/30 bg-indigo-500/5">
          <h2 className="font-semibold text-white">📄 Sizga shartnoma yuborildi</h2>
          <p className="mt-1 text-sm text-zinc-300">
            Kelishilgan summa:{" "}
            <b>{myIncomingContract.amount.toLocaleString()} so'm</b>
          </p>
          {myIncomingContract.note && (
            <p className="mt-1 text-sm text-zinc-400">
              Izoh: {myIncomingContract.note}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              className="btn-primary"
              disabled={busy}
              onClick={() =>
                call(`/api/contracts/${myIncomingContract.id}`, "POST", {
                  action: "ACCEPT",
                })
              }
            >
              Qabul qilish va boshlash
            </button>
            <button
              className="btn-ghost"
              disabled={busy}
              onClick={() =>
                call(`/api/contracts/${myIncomingContract.id}`, "POST", {
                  action: "DECLINE",
                })
              }
            >
              Rad etish
            </button>
          </div>
        </div>
      )}

      {/* Buyurtmachi: yuborilgan shartnoma holati */}
      {isOrderer && sentContract && (
        <div className="card border-indigo-400/30 bg-indigo-500/5">
          <p className="text-sm text-zinc-300">
            📄 <b>{sentContract.preparerName}</b> ga shartnoma yuborildi —{" "}
            {sentContract.amount.toLocaleString()} so'm. Javob kutilmoqda.
          </p>
          <button
            className="btn-ghost mt-2"
            disabled={busy}
            onClick={() =>
              call(`/api/contracts/${sentContract.id}`, "POST", { action: "CANCEL" })
            }
          >
            Bekor qilish
          </button>
        </div>
      )}

      {/* Tayyorlovchi: taklif yuborish */}
      {isPreparer && !isAssigned && status === "OPEN" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            call(`/api/orders/${orderId}/offers`, "POST", {
              price: Number(price),
              message: message || undefined,
            });
          }}
          className="card flex flex-col gap-3"
        >
          <h2 className="font-semibold">
            {myOffer ? "Taklifni yangilash" : "Taklif yuborish"}
          </h2>
          <div>
            <label className="label">Narx (so'm)</label>
            <input
              className="input"
              type="number"
              min={1}
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Xabar</label>
            <textarea
              className="input"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          {!myOffer && (
            <p className="text-xs text-amber-300">
              ⭐ Taklif yuborish {MIN_OFFER_STARS} star (
              {(MIN_OFFER_STARS * STAR_PRICE).toLocaleString("ru-RU")} so'm)
              talab qiladi — hisobingizdan avtomatik yechiladi.
            </p>
          )}
          <button className="btn-primary" disabled={busy}>
            {myOffer ? "Yangilash" : `Yuborish (${MIN_OFFER_STARS} ⭐)`}
          </button>
          {myOffer && (
            <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
              <p className="text-xs text-zinc-500">
                Holat: {myOffer.status} · Jami sarflangan:{" "}
                <b className="text-amber-300">{myOffer.starsSpent} ⭐</b>
              </p>
              <div className="flex items-center gap-2">
                <input
                  className="input w-28"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="star"
                  value={boostStars}
                  onChange={(e) => setBoostStars(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={busy}
                  onClick={boost}
                >
                  🚀 Navbatda yuqoriga chiqish
                </button>
              </div>
              <p className="text-xs text-zinc-600">
                Har bir qo'shimcha star {STAR_PRICE.toLocaleString("ru-RU")} so'm —
                navbatda ko'proq star sarflaganlar yuqorida turadi.
              </p>
            </div>
          )}
        </form>
      )}

      {/* Navbat — boshqa tayyorlovchilarga (ismlar qisman yashirilgan) */}
      {isPreparer && !isOrderer && status === "OPEN" && queue.length > 0 && (
        <div className="card flex flex-col gap-2">
          <h2 className="font-semibold">Navbat ({queue.length})</h2>
          <p className="text-xs text-zinc-500">
            Ko'proq star sarflagan yuqorida turadi. Boshqa ishtirokchilarning
            ismi qisman yashiringan.
          </p>
          <ul className="flex flex-col gap-1.5">
            {queue.map((q) => (
              <li
                key={q.position}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                  q.mine
                    ? "border border-indigo-400/30 bg-indigo-500/10"
                    : "bg-white/[0.03]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-zinc-500">#{q.position}</span>
                  <span className="font-medium text-white">
                    {q.visible}
                    {q.hiddenLen > 0 && (
                      <span
                        aria-hidden
                        className="select-none blur-[3px]"
                      >
                        {"•".repeat(Math.min(q.hiddenLen, 10))}
                      </span>
                    )}
                  </span>
                  {q.mine && (
                    <span className="text-xs text-indigo-300">(siz)</span>
                  )}
                </span>
                <span className="text-xs text-amber-300">{q.starsSpent} ⭐</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Buyurtmachi: takliflar ro'yxati */}
      {isOrderer && (
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold">Takliflar ({offers.length})</h2>
          {offers.length === 0 && (
            <p className="text-sm text-zinc-500">Hozircha taklif yo'q.</p>
          )}
          {offers.map((o) => (
            <div key={o.id} className="card flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/u/${o.preparerId}`}
                  className="min-w-0 font-medium text-white hover:underline"
                >
                  {o.preparer.name}
                  {o.preparer.login && (
                    <span className="text-zinc-400"> @{o.preparer.login}</span>
                  )}
                </Link>
                <span className="shrink-0 text-xs text-amber-300">
                  {o.starsSpent} ⭐
                </span>
              </div>
              <Link
                href={`/u/${o.preparerId}`}
                className="flex items-center gap-2 text-sm"
              >
                <Stars value={o.preparer.rating ?? 0} />
                <span className="text-zinc-300">
                  {o.preparer.rating != null ? o.preparer.rating.toFixed(1) : "yangi"}
                </span>
                <span className="text-xs text-zinc-500">
                  ({o.preparer.ratingCount} baho)
                </span>
              </Link>
              {o.preparer.about && (
                <p className="text-xs text-zinc-500">{o.preparer.about}</p>
              )}
              <div className="text-sm">
                Narx: <b>{o.price.toLocaleString()} so'm</b>
              </div>
              {o.message && <p className="text-sm text-zinc-300">{o.message}</p>}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={busy}
                  onClick={() => startChat(o.preparerId)}
                >
                  💬 Chat
                </button>
                <ReportButton
                  suspectId={o.preparerId}
                  orderId={orderId}
                  label="Shikoyat"
                />
                {status === "OPEN" && o.status === "PENDING" && !sentContract && (
                  <>
                    <button
                      className="btn-primary"
                      disabled={busy}
                      onClick={() => {
                        setContractFor(
                          contractFor === o.preparerId ? null : o.preparerId,
                        );
                        setCAmount(String(o.price));
                        setCNote("");
                      }}
                    >
                      📄 Shartnoma tuzish
                    </button>
                    <button
                      className="btn-ghost"
                      disabled={busy}
                      onClick={() =>
                        call(`/api/offers/${o.id}`, "PATCH", { action: "REJECT" })
                      }
                    >
                      Rad etish
                    </button>
                  </>
                )}
                {o.status !== "PENDING" && (
                  <span className="self-center text-xs text-zinc-400">
                    {o.status}
                  </span>
                )}
              </div>

              {contractFor === o.preparerId && (
                <div className="mt-1 flex flex-col gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <div className="text-sm font-medium text-white">
                    Kelishilgan shartnoma
                  </div>
                  <div>
                    <label className="label">Kelishilgan summa (so'm)</label>
                    <input
                      className="input"
                      type="number"
                      min={1}
                      value={cAmount}
                      onChange={(e) => setCAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Izoh / shartlar (ixtiyoriy)</label>
                    <textarea
                      className="input"
                      rows={2}
                      value={cNote}
                      onChange={(e) => setCNote(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn-primary w-fit"
                    disabled={busy}
                    onClick={() => sendContract(o.preparerId)}
                  >
                    Shartnoma yuborish
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Baholash (ish yakunlangач buyurtmachi) */}
      {isOrderer && status === "DONE" &&
        (reviewed ? (
          <div className="card">
            <h2 className="mb-1 font-semibold text-white">Sizning bahoyingiz</h2>
            <Stars value={myReview?.stars ?? 0} size="md" />
            {myReview?.comment && (
              <p className="mt-2 text-sm text-zinc-400">«{myReview.comment}»</p>
            )}
          </div>
        ) : (
          <ReviewForm orderId={orderId} />
        ))}

      {/* Tayyorlovchiga qo'yilgan baho va sharh */}
      {isAssigned && status === "DONE" && (
        <div className="card">
          <h2 className="mb-1 font-semibold text-white">Sizga qo'yilgan baho</h2>
          {reviewed ? (
            <>
              <Stars value={myReview?.stars ?? 0} size="md" />
              {myReview?.comment ? (
                <p className="mt-2 text-sm text-zinc-400">«{myReview.comment}»</p>
              ) : (
                <p className="mt-2 text-sm text-zinc-500">Sharh qoldirilmagan.</p>
              )}
            </>
          ) : (
            <p className="text-sm text-zinc-500">
              Buyurtmachi hali baho qo'ymagan.
            </p>
          )}
        </div>
      )}

      {/* Shartnoma bo'yicha yakunlash (faqat buyurtmachi) */}
      {isOrderer && acceptedContract &&
        (status === "IN_PROGRESS" || status === "DELIVERED") && (
          <div className="card border-emerald-400/25 bg-emerald-500/5">
            <p className="text-sm text-zinc-300">
              Ish tayyor bo'lsa yakunlang — <b>
                {acceptedContract.amount.toLocaleString()} so'm
              </b>{" "}
              to'liq (komissiyasiz) tayyorlovchi hisobiga o'tadi.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="btn-primary"
                disabled={busy}
                onClick={() => call(`/api/orders/${orderId}/finalize`, "POST")}
              >
                ✅ Buyurtmani yakunlash
              </button>
              <button
                className="btn-ghost"
                disabled={busy}
                onClick={() => {
                  if (
                    window.confirm(
                      "Shartnoma bekor qilinadi. Mablag' to'liq (komissiyasiz) sizga qaytadi. Davom etilsinmi?",
                    )
                  ) {
                    call(`/api/contracts/${acceptedContract.id}`, "POST", {
                      action: "CANCEL",
                    });
                  }
                }}
              >
                ✖ Shartnomani bekor qilish
              </button>
            </div>
          </div>
        )}

      {/* Status o'zgartirish */}
      <div className="flex flex-wrap gap-2">
        {isAssigned && status === "IN_PROGRESS" && (
          <button
            className="btn-primary"
            disabled={busy}
            onClick={() =>
              call(`/api/orders/${orderId}`, "PATCH", { status: "DELIVERED" })
            }
          >
            Ishni topshirdim (buyurtmachi yakunlaydi)
          </button>
        )}
        {isOrderer && status === "OPEN" && (
          <button
            className="btn-ghost"
            disabled={busy}
            onClick={() =>
              call(`/api/orders/${orderId}`, "PATCH", { status: "CANCELLED" })
            }
          >
            Buyurtmani bekor qilish
          </button>
        )}
      </div>
    </div>
  );
}
