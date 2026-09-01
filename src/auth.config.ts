import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge (middleware) uchun xavfsiz konfiguratsiya.
 * Bu yerda Prisma yoki bcrypt ishlatilmaydi.
 */
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      // API route'lar o'z ichida auth() bilan tekshiradi — bu yerda ushlab qolmaymiz
      if (path.startsWith("/api")) return true;
      // admin panel alohida autentifikatsiyaga ega
      if (path.startsWith("/sardorxon")) return true;

      const isPublic =
        path === "/" ||
        path.startsWith("/login") ||
        path.startsWith("/register");

      if (isPublic) return true;
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
