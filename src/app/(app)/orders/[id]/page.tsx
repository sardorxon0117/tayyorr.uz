import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PRIVATE_BUCKET, presignGet } from "@/lib/r2";
import { getRestriction } from "@/lib/restriction";
import { presenceText } from "@/lib/presence";
import { RestrictionNotice } from "@/components/restriction-notice";
import { OrderActions } from "@/components/order-actions";
import { OrderDeleteButton } from "@/components/order-delete-button";
import { BackLink } from "@/components/back-link";
import { shortDateTime, shortDate } from "@/lib/date";

const TYPE_LABEL: Record<string, string> = {
  PRESENTATION: "Prezentatsiya",
  COURSE_WORK: "Kurs ishi",
  REFERAT: "Referat",
  ESSAY: "Esse",
  DIPLOMA: "Diplom ishi",
  OTHER: "Boshqa",
};
const STATUS_LABEL: Record<string, string> = {
  OPEN: "Ochiq",
  IN_PROGRESS: "Jarayonda",
  DELIVERED: "Topshirilgan",
  DONE: "Yakunlangan",
  CANCELLED: "Bekor qilingan",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const restriction = await getRestriction(session!.user.id);
  if (restriction) return <RestrictionNotice restriction={restriction} />;
  const me = session!.user;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      orderer: {
        select: {
          id: true,
          name: true,
          login: true,
          avatarUrl: true,
          image: true,
          lastSeenAt: true,
        },
      },
      preparer: {
        select: {
          id: true,
          name: true,
          login: true,
          avatarUrl: true,
          image: true,
          lastSeenAt: true,
        },
      },
      offers: {
        include: {
          preparer: {
            select: {
              id: true,
              name: true,
              login: true,
              ratingCount: true,
              ratingSum: true,
              about: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      files: true,
      review: true,
      contracts: {
        orderBy: { createdAt: "desc" },
        include: {
          preparer: { select: { name: true, login: true } },
        },
      },
    },
  });

  if (!order) notFound();

  const isOrderer = order.ordererId === me.id;
  const isPreparer = me.role === "PREPARER";
  const isAssigned = order.preparerId === me.id;
  const isParty = isOrderer || isAssigned;

  // OPEN bo'lmagan / o'chirilgan buyurtma faqat ishtirokchilarga ko'rinadi
  if (!isParty && (order.status !== "OPEN" || order.deletedAt)) notFound();
  const deleted = !!order.deletedAt;

  // takliflar: buyurtma egasiga hammasi, tayyorlovchiga faqat o'ziniki
  const visibleOffers = isOrderer
    ? order.offers
    : order.offers.filter((o) => o.preparerId === me.id);
  const myOffer = order.offers.find((o) => o.preparerId === me.id) ?? null;

  const files = await Promise.all(
    order.files.map(async (f) => ({
      id: f.id,
      kind: f.kind,
      mimeType: f.mimeType,
      size: f.size,
      url: isParty
        ? await presignGet({ bucket: PRIVATE_BUCKET, key: f.key })
        : null,
    })),
  );

  return (
    <div className="flex flex-col gap-6">
      <BackLink fallback="/dashboard" />

      {deleted && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm">
          <div className="font-semibold text-red-300">
            🗑 Bu buyurtma o'chirilgan
          </div>
          <div className="mt-1 text-zinc-400">
            {order.deletedByRole === "ADMIN"
              ? "Administrator tomonidan"
              : "Buyurtmachi tomonidan"}
            {order.deletedAt &&
              ` · ${shortDateTime(order.deletedAt)}`}
          </div>
          {order.deleteReason && (
            <div className="mt-1 text-zinc-300">
              Sabab: {order.deleteReason}
            </div>
          )}
          <div className="mt-1 text-xs text-zinc-500">
            U faqat sizga ko'rinadi, boshqalarga emas.
          </div>
        </div>
      )}

      {!isOrderer && (
        <PersonCard person={order.orderer} role="Buyurtmachi" />
      )}
      {order.preparer && !isAssigned && (
        <PersonCard person={order.preparer} role="Tayyorlovchi" />
      )}

      <div>
        <div className="text-xs uppercase tracking-wide text-indigo-400">
          {TYPE_LABEL[order.type]} · {STATUS_LABEL[order.status]}
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          {order.title}
        </h1>
      </div>

      <div className="card whitespace-pre-wrap text-sm text-zinc-300">
        {order.description}
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
        {order.deadline && (
          <span>Muddat: {shortDate(order.deadline)}</span>
        )}
        {order.budget && <span>Byudjet: {order.budget.toLocaleString()} so'm</span>}
      </div>

      {files.length > 0 && (
        <div>
          <h2 className="mb-2 font-semibold text-white">Fayllar</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {files.map((f) => (
              <li key={f.id}>
                {f.url ? (
                  <a
                    href={f.url}
                    className="text-indigo-400 hover:text-indigo-300 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {f.kind} · {(f.size / 1024).toFixed(0)} KB
                  </a>
                ) : (
                  <span className="text-zinc-500">
                    {f.kind} (kirish uchun ruxsat yo'q)
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!deleted && (
      <OrderActions
        orderId={order.id}
        status={order.status}
        isOrderer={isOrderer}
        isPreparer={isPreparer}
        isAssigned={isAssigned}
        ordererId={order.ordererId}
        meId={me.id}
        contracts={order.contracts.map((c) => ({
          id: c.id,
          preparerId: c.preparerId,
          preparerName: c.preparer.name ?? c.preparer.login ?? "tayyorlovchi",
          amount: c.amount,
          note: c.note,
          status: c.status,
        }))}
        reviewed={!!order.review}
        myReview={
          order.review
            ? { stars: order.review.stars, comment: order.review.comment }
            : null
        }
        myOffer={
          myOffer && {
            id: myOffer.id,
            price: myOffer.price,
            message: myOffer.message,
            status: myOffer.status,
          }
        }
        offers={visibleOffers.map((o) => ({
          id: o.id,
          price: o.price,
          message: o.message,
          status: o.status,
          preparerId: o.preparerId,
          preparer: {
            name: o.preparer.name ?? o.preparer.login ?? "—",
            login: o.preparer.login,
            about: o.preparer.about,
            rating: o.preparer.ratingCount
              ? o.preparer.ratingSum / o.preparer.ratingCount
              : null,
            ratingCount: o.preparer.ratingCount,
          },
        }))}
      />
      )}

      {isOrderer && !deleted && (
        <div className="border-t border-white/10 pt-4">
          <OrderDeleteButton orderId={order.id} />
        </div>
      )}
    </div>
  );
}

function PersonCard({
  person,
  role,
}: {
  person: {
    id: string;
    name: string | null;
    login: string | null;
    avatarUrl: string | null;
    image: string | null;
    lastSeenAt: Date | null;
  };
  role: string;
}) {
  const p = presenceText(person.lastSeenAt);
  const img = person.avatarUrl ?? person.image;
  return (
    <Link
      href={`/u/${person.id}`}
      className="card flex items-center gap-3 transition hover:border-white/15 hover:bg-white/[0.06]"
    >
      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5">
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="h-full w-full object-cover" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium text-white">
          {person.name ?? (person.login ? `@${person.login}` : role)}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-xs">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              p.online ? "bg-emerald-400" : "bg-zinc-600"
            }`}
          />
          <span className={p.online ? "text-emerald-400" : "text-zinc-500"}>
            {p.text}
          </span>
        </span>
      </span>
      <span className="ml-auto shrink-0 text-xs text-zinc-600">
        {role} · profilga ›
      </span>
    </Link>
  );
}
