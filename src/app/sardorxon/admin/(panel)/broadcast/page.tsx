import { db } from "@/lib/db";
import { BroadcastConsole } from "@/components/admin/broadcast-console";

export default async function AdminBroadcast() {
  const rows = await db.broadcast.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const initial = rows
    .reverse()
    .map((b) => ({
      id: b.id,
      body: b.body,
      sentCount: b.sentCount,
      createdAt: b.createdAt.toISOString(),
    }));

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="text-xl font-semibold text-white">Ommaviy xabar</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Filtrni tanlang, pastda oddiy xabardek yozib yuboring — «tayyorr.uz
          support» nomidan boradi (real vaqt + push).
        </p>
      </div>
      <BroadcastConsole initial={initial} />
    </div>
  );
}
