import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ensureWalletCode, formatSom } from "@/lib/wallet";
import { getRestriction } from "@/lib/restriction";
import { RestrictionNotice } from "@/components/restriction-notice";
import { WalletTopUp } from "@/components/wallet-topup";

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
const OUTFLOW = new Set(["SPEND", "TRANSFER_OUT", "PAYOUT", "HOLD"]);

export default async function WalletPage() {
  const session = await auth();
  const userId = session!.user.id;
  const restriction = await getRestriction(userId);
  if (restriction) return <RestrictionNotice restriction={restriction} />;

  const walletCode = await ensureWalletCode(userId);
  const [user, txns] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { balance: true } }),
    db.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const balance = user?.balance ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Hamyon</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Hisobingizni to'ldiring, buyurtmalar uchun shu balansdan to'lov qilinadi.
        </p>
      </div>

      {/* balans karta */}
      <div className="relative overflow-hidden rounded-2xl glass-strong p-6">
        <div
          aria-hidden
          className="blob"
          style={{
            top: "-8rem",
            right: "-6rem",
            width: "22rem",
            height: "22rem",
            background: "radial-gradient(circle, #6366f1, transparent 70%)",
            opacity: 0.35,
          }}
        />
        <div className="relative">
          <div className="text-sm text-zinc-400">Joriy balans</div>
          <div className="mt-1 text-4xl font-semibold tracking-tight text-white">
            {formatSom(balance)}
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm">
            <span className="text-zinc-400">Hisob kodi:</span>
            <span className="font-mono font-medium text-white">{walletCode}</span>
          </div>
        </div>
      </div>

      <WalletTopUp myCode={walletCode} />

      {/* tarix */}
      <div>
        <h2 className="mb-3 font-semibold text-white">Amallar tarixi</h2>
        {txns.length === 0 ? (
          <div className="card text-sm text-zinc-500">Hozircha amallar yo'q.</div>
        ) : (
          <ul className="flex flex-col gap-2">
            {txns.map((t) => {
              const reversed = !!t.reversedAt;
              const out = reversed || OUTFLOW.has(t.type);
              return (
                <li
                  key={t.id}
                  className="card flex items-center justify-between py-3"
                >
                  <div>
                    <div className="text-sm font-medium text-white">
                      {TXN_LABEL[t.type] ?? t.type}
                      {t.method === "DEMO" && (
                        <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                          DEMO
                        </span>
                      )}
                      {reversed && (
                        <span className="ml-2 rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
                          BEKOR QILINGAN
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-500">
                      {t.createdAt.toLocaleString("uz")}
                      {t.note ? ` · ${t.note}` : ""}
                    </div>
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      reversed
                        ? "text-red-400 line-through"
                        : out
                          ? "text-zinc-300"
                          : "text-emerald-400"
                    }`}
                  >
                    {out ? "−" : "+"}
                    {formatSom(t.amount)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
