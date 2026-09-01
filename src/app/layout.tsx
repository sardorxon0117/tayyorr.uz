import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "tayyorr.uz — prezentatsiya va kurs ishlari",
  description:
    "Buyurtma bering yoki tayyorlang: prezentatsiya, kurs ishi, referat va boshqalar.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
