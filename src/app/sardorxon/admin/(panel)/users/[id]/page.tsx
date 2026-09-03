import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { formatSom } from "@/lib/wallet";
import { AdminPostButton } from "@/components/admin/admin-post-button";
import { BanForm } from "@/components/admin/ban-form";
import { SupportMessageForm } from "@/components/admin/support-message-form";
import { shortDateTime, shortDate } from "@/lib/date";

const TYPE_LABEL: Record<string, string> = {
  TOPUP: "To'ldirish",
  SPEND: "To'lov",
  TRANSFER_IN: "Kirim",
  TRANSFER_OUT: "Chiqim",
  PAYOUT: "Yechish",
  REFUND: "Qaytarish",
  HOLD: "Bloklandi",
  RELEASE: "Ish haqi",
  COMMISSION: "Komissiya",
};

export default async function AdminUserDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    include: {
      walletTxns: { orderBy: { createdAt: "desc" }, take: 15 },
      _count: {
        select: {
          ordersCreated: true,
          ordersTaken: true,
          offers: true,
          complaintsMade: true,
          complaintsAgainst: true,
        },
      },
    },
  });
  if (!user || user.isSupport) notFound();

  const convs = await db.conversation.findMany({
    where: { OR: [{ userAId: id }, { userBId: id }] },
    orderBy: { lastMessageAt: "desc" },
    take: 30,
    include: {
      userA: { select: { id: true, login: true, name: true, isSupport: true } },
      userB: { select: { id: true, login: true, name: true, isSupport: true } },
      _count: { select: { messages: true } },
    },
  });

  const banned = user.bannedUntil && user.bannedUntil.getTime() > Date.now();

  const info: [string, string][] = [
    ["ID", user.id],
    ["Ism", `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "—"],
    ["Login", user.login ?? "—"],
    ["Email", user.email ?? "—"],
    ["Rol", user.role ?? "—"],
    ["Hisob kodi", user.walletCode ?? "—"],
    ["Balans", formatSom(user.balance)],
    ["Ro'yxatdan", shortDateTime(user.createdAt)],
    [
      "Buyurtma/Taklif",
      `${user._count.ordersCreated} / ${user._count.ordersTaken} / ${user._count.offers}`,
    ],
    [
      "Shikoyatlar (yozgan / ustidan)",
      `${user._count.complaintsMade} / ${user._count.complaintsAgainst}`,
    ],
  ];

  return (
    <div className="flex flex-col gap-6">
      <Link href="/sardorxon/admin/users" className="text-sm text-zinc-500 hover:text-white">
        ← Foydalanuvchilar
      </Link>

      <div className="flex items-center gap-4">
        <div className="h-14 w-14 overflow-hidden rounded-full border border-white/10 bg-white/5">
          {(user.avatarUrl ?? user.image) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl ?? user.image ?? ""}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">
            {user.name ?? user.login}
          </h1>
          <p className="text-sm text-zinc-500">
            @{user.login}
            {banned && (
              <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-xs text-amber-300">
                {shortDate(user.bannedUntil!)} gacha cheklangan
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-3 font-semibold text-white">Hisob ma'lumotlari</h2>
          <dl className="divide-y divide-white/5 text-sm">
            {info.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2">
                <dt className="text-zinc-500">{k}</dt>
                <dd className="text-right font-mono text-zinc-200">{v}</dd>
              </div>
            ))}
          </dl>
          {user.about && (
            <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-400">
              {user.about}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-3 font-semibold text-white">Cheklov (ban)</h2>
          {banned ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-amber-300">
                {shortDateTime(user.bannedUntil!)} gacha cheklangan.
                {user.banReason ? ` Sabab: ${user.banReason}` : ""}
              </p>
              <AdminPostButton
                url={`/api/admin/users/${user.id}/unban`}
                label="Cheklovni olib tashlash"
                className="btn-primary w-fit"
              />
              <div className="border-t border-white/10 pt-3">
                <p className="mb-2 text-xs text-zinc-500">Muddatni yangilash:</p>
                <BanForm userId={user.id} />
              </div>
            </div>
          ) : (
            <BanForm userId={user.id} />
          )}
        </section>

        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-3 font-semibold text-white">
            tayyorr.uz support xabari
          </h2>
          <SupportMessageForm userId={user.id} />
        </section>

        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-3 font-semibold text-white">Suhbatlar</h2>
          {convs.length === 0 ? (
            <p className="text-sm text-zinc-500">Suhbat yo'q.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {convs.map((c) => {
                const other = c.userAId === id ? c.userB : c.userA;
                return (
                  <li key={c.id}>
                    <Link
                      href={`/sardorxon/admin/chats/${c.id}`}
                      className="flex justify-between rounded-lg px-2 py-1.5 hover:bg-white/5"
                    >
                      <span className="text-zinc-200">
                        {other.isSupport
                          ? "tayyorr.uz support"
                          : `@${other.login ?? other.name ?? "—"}`}
                        {c.hiddenFromUsersAt && (
                          <span className="ml-2 text-xs text-amber-400">
                            yashirilgan
                          </span>
                        )}
                      </span>
                      <span className="text-zinc-500">
                        {c._count.messages} xabar
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section>
        <h2 className="mb-3 font-semibold text-white">Oxirgi hisob amallari</h2>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-white/[0.03] text-left text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-2">Sana</th>
                <th className="px-4 py-2">Tur</th>
                <th className="px-4 py-2">Summa</th>
                <th className="px-4 py-2">Holat</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {user.walletTxns.map((t) => (
                <tr key={t.id} className="border-t border-white/5">
                  <td className="whitespace-nowrap px-4 py-2 text-zinc-400">
                    {shortDateTime(t.createdAt)}
                  </td>
                  <td className="px-4 py-2">{TYPE_LABEL[t.type] ?? t.type}</td>
                  <td
                    className={`px-4 py-2 ${
                      t.reversedAt ? "text-red-400 line-through" : "text-white"
                    }`}
                  >
                    {t.reversedAt ? "−" : ""}
                    {formatSom(t.amount)}
                  </td>
                  <td className="px-4 py-2">
                    {t.reversedAt ? (
                      <span className="text-red-400">bekor</span>
                    ) : (
                      <span className="text-zinc-400">{t.status}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/sardorxon/admin/payments/${t.id}`}
                        className="text-xs text-zinc-400 hover:text-white"
                      >
                        chek
                      </Link>
                      {!t.reversedAt && t.status === "SUCCESS" && (
                        <AdminPostButton
                          url={`/api/admin/payments/${t.id}/reverse`}
                          label="bekor qilish"
                          className="text-xs text-amber-400 hover:text-amber-300"
                          confirmText="Amal bekor qilinsinmi?"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-red-500/25 bg-red-500/5 p-5">
        <h2 className="mb-1 font-semibold text-red-300">Xavfli zona</h2>
        <p className="mb-3 text-sm text-zinc-400">
          Hisob va barcha bog'liq ma'lumotlar (buyurtmalar, xabarlar, suhbatlar,
          takliflar, hisob amallari) butunlay o'chiriladi. Tayyorlovchi bo'lgan
          faol shartnomalardagi mablag' buyurtmachiga qaytariladi.
        </p>
        <AdminPostButton
          url={`/api/admin/users/${user.id}`}
          method="DELETE"
          label="Hisobni butunlay o'chirish"
          className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/30"
          confirmText="Foydalanuvchi va uning BARCHA ma'lumotlari o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi. Davom etilsinmi?"
          redirectTo="/sardorxon/admin/users"
        />
      </section>
    </div>
  );
}
