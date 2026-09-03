import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ro'yxatdan o'tish",
  description:
    "tayyorr.uz'ga bepul ro'yxatdan o'ting: prezentatsiya, kurs ishi va referat buyurtma qiling yoki tayyorlovchi sifatida daromad qiling.",
  alternates: { canonical: "/register" },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
