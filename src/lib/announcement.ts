import { db } from "@/lib/db";

export interface ActiveAnnouncement {
  id: string;
  title: string;
  body: string;
  buttonText: string | null;
  buttonUrl: string | null;
}

/** Foydalanuvchiga ko'rinadigan faol e'lonlar (rol bo'yicha filtrlangan). */
export async function getActiveAnnouncements(
  role: string | null | undefined,
): Promise<ActiveAnnouncement[]> {
  const rows = await db.announcement.findMany({
    where: {
      active: true,
      OR: [{ role: null }, ...(role ? [{ role }] : [])],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      body: true,
      buttonText: true,
      buttonUrl: true,
    },
  });
  return rows.filter((r) => r.title.trim());
}
