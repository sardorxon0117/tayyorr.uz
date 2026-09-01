import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PRIVATE_BUCKET, presignGet } from "@/lib/r2";
import { getRestriction } from "@/lib/restriction";
import { RestrictionNotice } from "@/components/restriction-notice";
import { OrderActions } from "@/components/order-actions";

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
      orderer: { select: { id: true, name: true, login: true } },
      preparer: { select: { id: true, name: true, login: true } },
      offers: {
        include: {
          preparer: {
            select: {
              id: true,
              name: true,
              login: true,
              isAvailable: true,
              ratingCount: true,
              ratingSum: true,
              about: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      files: true,
    },
  });

  if (!order) notFound();

  const isOrderer = order.ordererId === me.id;
  const isPreparer = me.role === "PREPARER";
  const isAssigned = order.preparerId === me.id;
  const isParty = isOrderer || isAssigned;

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
      <div>
        <div className="text-xs uppercase tracking-wide text-indigo-400">
          {TYPE_LABEL[order.type]} · {STATUS_LABEL[order.status]}
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          {order.title}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Buyurtmachi: @{order.orderer.login ?? order.orderer.name}
          {order.preparer &&
            ` · Tayyorlovchi: @${order.preparer.login ?? order.preparer.name}`}
        </p>
      </div>

      <div className="card whitespace-pre-wrap text-sm text-zinc-300">
        {order.description}
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
        {order.deadline && (
          <span>Muddat: {order.deadline.toLocaleDateString("uz")}</span>
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

      <OrderActions
        orderId={order.id}
        status={order.status}
        isOrderer={isOrderer}
        isPreparer={isPreparer}
        isAssigned={isAssigned}
        ordererId={order.ordererId}
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
            isAvailable: o.preparer.isAvailable,
            rating: o.preparer.ratingCount
              ? o.preparer.ratingSum / o.preparer.ratingCount
              : null,
          },
        }))}
      />
    </div>
  );
}
