import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatSom } from "@/lib/wallet";
import { shortDateTime } from "@/lib/date";
import { ClickReceiptButton } from "@/components/click-receipt-button";

const TXN_LABEL: Record<string, string> = {
  TOPUP: "To'ldirish",
  SPEND: "Buyurtma to'lovi",
  TRANSFER_IN: "Kirim o'tkazma",
  TRANSFER_OUT: "Chiqim o'tkazma",
  PAYOUT: "Kartaga yechish",
  REFUND: "Qaytarish",
  HOLD: "Shartnoma uchun bloklandi",
  RELEASE: "Ish haqi (yakunlangan)",
  COMMISSION: "Sayt komissiyasi",
};

export default async function WalletReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const t = await db.walletTransaction.findUnique({ where: { id } });
  if (!t || t.userId !== session!.user.id) notFound();

  const reversed = !!t.reversedAt;

  const rows: [string, string][] = [
    ["Amal ID", t.id],
    ["Sana", shortDateTime(t.createdAt)],
    ["Tur", TXN_LABEL[t.type] ?? t.type],
    ["Summa", `${reversed ? "−" : ""}${formatSom(t.amount)}`],
    ["Usul", t.method],
    ["Holat", reversed ? "BEKOR QILINGAN" : t.status],
    ...(t.note ? ([["Izoh", t.note]] as [string, string][]) : []),
    ...(reversed
      ? ([["Bekor qilingan", shortDateTime(t.reversedAt!)]] as [string, string][])
      : []),
  ];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5">
      <Link href="/wallet" className="text-sm text-zinc-500 hover:text-white">
        ← Hamyon
      </Link>

      <div className="card">
        <h1 className="text-lg font-semibold text-white">Chek</h1>
        <dl className="mt-4 divide-y divide-white/5 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2">
              <dt className="text-zinc-500">{k}</dt>
              <dd
                className={`text-right font-mono ${
                  reversed && (k === "Summa" || k === "Holat")
                    ? "text-red-400"
                    : "text-zinc-200"
                }`}
              >
                {v}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {t.method === "CLICK" && <ClickReceiptButton apiBase={`/api/wallet/${t.id}`} />}
    </div>
  );
}
