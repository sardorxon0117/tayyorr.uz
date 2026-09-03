import type { Metadata } from "next";
import { cookies } from "next/headers";

import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "tayyorr.uz — prezentatsiya va kurs ishlari",
  description:
    "Buyurtma bering yoki tayyorlang: prezentatsiya, kurs ishi, referat va boshqalar.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const light = (await cookies()).get("tyr_theme")?.value === "light";

  return (
    <html lang="uz" className={light ? "light" : undefined}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            // landing / login / register — har doim qorong'i
            __html: `(function(){try{var p=location.pathname;if(p==='/'||p.indexOf('/login')===0||p.indexOf('/register')===0)document.documentElement.classList.remove('light');document.documentElement.classList.add('js-reveal');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
