import Link from "next/link";

import { db } from "@/lib/db";
import { formatSom } from "@/lib/wallet";

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const users = await db.user.findMany({
    where: {
      isSupport: false,
      ...(query
        ? {
            OR: [
              { login: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { walletCode: { contains: query.toUpperCase() } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-white">Foydalanuvchilar</h1>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="login, ism, email yoki hisob kodi"
          className="input max-w-sm"
        />
        <button className="btn-ghost">Qidirish</button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-white/[0.03] text-left text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-2">Foydalanuvchi</th>
              <th className="px-4 py-2">Rol</th>
              <th className="px-4 py-2">Balans</th>
              <th className="px-4 py-2">Holat</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const banned = u.bannedUntil && u.bannedUntil.getTime() > Date.now();
              return (
                <tr key={u.id} className="border-t border-white/5">
                  <td className="px-4 py-2">
                    <Link
                      href={`/sardorxon/admin/users/${u.id}`}
                      className="text-indigo-400 hover:underline"
                    >
                      {u.name ?? "—"}{" "}
                      <span className="text-zinc-500">@{u.login ?? "—"}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-zinc-400">
                    {u.role === "PREPARER"
                      ? "Tayyorlovchi"
                      : u.role === "ORDERER"
                        ? "Buyurtmachi"
                        : "—"}
                  </td>
                  <td className="px-4 py-2 text-white">{formatSom(u.balance)}</td>
                  <td className="px-4 py-2">
                    {banned ? (
                      <span className="text-amber-400">cheklangan</span>
                    ) : (
                      <span className="text-emerald-400">faol</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                  Hech narsa topilmadi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
