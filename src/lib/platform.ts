import { db } from "@/lib/db";

/** Sayt komissiya hisobi (singleton). Komissiya shu hisobga tushadi. */
export const COMMISSION_FINAL = 0.05; // muvaffaqiyatli yakunlanганда
export const COMMISSION_CANCEL = 0.02; // buyurtmachi bekor qilganда

let cachedId: string | null = null;

export async function getPlatformUserId(): Promise<string> {
  if (cachedId) return cachedId;
  const existing = await db.user.findFirst({
    where: { isPlatform: true },
    select: { id: true },
  });
  if (existing) {
    cachedId = existing.id;
    return existing.id;
  }
  const created = await db.user.create({
    data: { isPlatform: true, name: "tayyorr.uz", login: "tayyorr_platform" },
    select: { id: true },
  });
  cachedId = created.id;
  return created.id;
}

export function commission(amount: number, rate: number) {
  return Math.round(amount * rate);
}
