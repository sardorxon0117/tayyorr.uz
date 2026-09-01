import Link from "next/link";

import { db } from "@/lib/db";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Yangi",
  REVIEWING: "Ko'rilmoqda",
  RESOLVED: "Hal qilindi",
  DISMISSED: "Rad etildi",
};

export default async function AdminComplaints() {
  const complaints = await db.complaint.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      reporter: { select: { id: true, login: true, name: true } },
      suspect: { select: { id: true, login: true, name: true } },
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-white">Shikoyatlar</h1>

      {complaints.length === 0 && (
        <p className="text-sm text-zinc-500">Shikoyatlar yo'q.</p>
      )}

      <ul className="flex flex-col gap-2">
        {complaints.map((c) => (
          <li key={c.id}>
            <Link
              href={`/sardorxon/admin/complaints/${c.id}`}
              className="block rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-white">
                  @{c.reporter.login ?? c.reporter.name ?? "—"}
                  {c.suspect && (
                    <>
                      {" "}
                      <span className="text-zinc-500">→</span> @
                      {c.suspect.login ?? c.suspect.name}
                    </>
                  )}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                    c.status === "OPEN"
                      ? "bg-indigo-500/20 text-indigo-300"
                      : c.status === "REVIEWING"
                        ? "bg-amber-500/15 text-amber-300"
                        : "bg-white/10 text-zinc-400"
                  }`}
                >
                  {STATUS_LABEL[c.status]}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{c.body}</p>
              <p className="mt-1 text-xs text-zinc-600">
                {c.createdAt.toLocaleString("uz")}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
