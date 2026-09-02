import { db } from "@/lib/db";

export interface ActiveAnnouncement {
  title: string;
  body: string;
  buttonText: string | null;
  buttonUrl: string | null;
}

/** Buyurtmalar ustidagi e'lon banneri (faol bo'lsa). */
export async function getActiveAnnouncement(): Promise<ActiveAnnouncement | null> {
  const a = await db.announcement.findFirst({
    where: { active: true },
    orderBy: { updatedAt: "desc" },
    select: { title: true, body: true, buttonText: true, buttonUrl: true },
  });
  if (!a || !a.title.trim()) return null;
  return a;
}
