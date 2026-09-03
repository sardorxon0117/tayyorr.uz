import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth-shell";
import { TermsContent } from "@/components/terms-content";

export const metadata: Metadata = {
  title: "Ommaviy oferta va foydalanish shartlari",
  description:
    "tayyorr.uz ommaviy ofertasi: ma'lumotlarni ixtiyoriy taqdim etish, taqiqlangan ishlar, chatda o'zaro hurmat, to'lovlar va cheklovlar.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <AuthShell width="max-w-2xl">
      <div className="card p-7">
        <h1 className="text-xl font-semibold text-white">
          Ommaviy oferta va foydalanish shartlari
        </h1>
        <div className="mt-4">
          <TermsContent />
        </div>
        <div className="mt-6 flex gap-3">
          <Link href="/register" className="btn-primary">
            Ro'yxatdan o'tish
          </Link>
          <Link href="/" className="btn-ghost">
            Bosh sahifa
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
