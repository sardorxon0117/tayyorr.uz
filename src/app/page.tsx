import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { ForceDark } from "@/components/force-dark";
import { Logo } from "@/components/logo";
import { ScrollHeader } from "@/components/scroll-header";
import { RevealOnScroll } from "@/components/reveal-on-scroll";
import { HeroMockup } from "@/components/hero-mockup";
import { TelegramIcon, InstagramIcon } from "@/components/icons";
import { SERVICES } from "@/lib/services";

const TELEGRAM_URL = "https://t.me/tayyorruz";
const INSTAGRAM_URL = "https://instagram.com/tayyorr.uz";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const STATS: [string, string][] = [
  ["2", "rol: buyurtmachi va tayyorlovchi"],
  ["10 daq", "ichida birinchi taklif"],
  ["100%", "xavfsiz fayl almashinuvi"],
];

export default async function Home() {
  const session = await auth();
  const loggedIn = !!session?.user;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07070c] text-zinc-100 antialiased">
      <ForceDark />
      <RevealOnScroll />

      {/* ---------- background ---------- */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="blob animate-float-a"
          style={{
            top: "-8rem",
            left: "-8rem",
            width: "32rem",
            height: "32rem",
            background: "radial-gradient(circle at 30% 30%, #6366f1, transparent 70%)",
            opacity: 0.4,
          }}
        />
        <div
          className="blob animate-float-b"
          style={{
            top: "6rem",
            right: "-12rem",
            width: "34rem",
            height: "34rem",
            background: "radial-gradient(circle at 60% 40%, #7c3aed, transparent 70%)",
            opacity: 0.3,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#07070c]" />
      </div>

      {/* ---------- nav (fixed) ---------- */}
      <ScrollHeader>
        <Logo className="h-5 sm:h-6" />
        <div className="hidden items-center gap-7 text-sm text-zinc-400 sm:flex">
          <Link href="/xizmatlar" className="transition hover:text-white">
            Xizmatlar
          </Link>
          <a href="#qanday" className="transition hover:text-white">
            Qanday ishlaydi
          </a>
          <a href="#turlar" className="transition hover:text-white">
            Ish turlari
          </a>
          <a href="#imkoniyat" className="transition hover:text-white">
            Imkoniyatlar
          </a>
        </div>
        <div className="flex items-center gap-2">
          {loggedIn ? (
            <Link
              href="/dashboard"
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              Asosiy menyu
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-300 transition hover:text-white"
              >
                Kirish
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
              >
                Boshlash
              </Link>
            </>
          )}
        </div>
      </ScrollHeader>

      {/* ---------- hero ---------- */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-32 pb-20 sm:pt-40">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          {/* matn */}
          <div className="text-center lg:text-left">
            <h1
              className="font-display animate-rise text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl"
            >
              Ilmiy ishlaringiz uchun{" "}
              <span className="text-indigo-300">doim odam</span> topiladi
            </h1>

            <p
              className="animate-rise mx-auto mt-6 max-w-lg text-lg text-zinc-400 lg:mx-0"
              style={{ animationDelay: "80ms" }}
            >
              Prezentatsiya, kurs ishi, referat yoki diplom ishi — buyurtma
              qoldiring, u barcha tayyorlovchilarga ko'rinadi. Yoki o'zingiz
              tayyorlab, daromad qiling.
            </p>

            <div
              className="animate-rise mt-9 grid grid-cols-2 gap-3 sm:inline-flex sm:flex-wrap sm:items-center sm:justify-center lg:justify-start"
              style={{ animationDelay: "140ms" }}
            >
              <Link
                href={loggedIn ? "/dashboard" : "/register"}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                {loggedIn ? "Asosiy menyuga o'tish" : "Bepul boshlash"}
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
              <a
                href="#qanday"
                className="lq-glass inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-medium text-zinc-200"
              >
                Qanday ishlaydi?
              </a>
            </div>

            <div
              className="lq-glass animate-rise mx-auto mt-14 flex max-w-md flex-wrap items-stretch justify-center divide-x divide-white/10 rounded-2xl px-2 py-5 lg:mx-0 lg:justify-start"
              style={{ animationDelay: "200ms" }}
            >
              {STATS.map(([n, l]) => (
                <div key={l} className="min-w-[7rem] flex-1 px-4 text-center lg:text-left">
                  <div className="text-2xl font-semibold text-white">{n}</div>
                  <div className="mt-1 text-xs leading-relaxed text-zinc-500">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* vizual: prezentatsiya + hujjat maketi — birinchi qarashda "bu nima uchun sayt" ayon bo'lsin (mobilda joy tejash uchun yashirin) */}
          <div className="animate-rise hidden lg:block" style={{ animationDelay: "100ms" }}>
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* ---------- dual role ---------- */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-2">
          <RolePanel
            title="Buyurtma beruvchi"
            lead="Vaqtingizni tejang."
            points={[
              "Bir marta buyurtma qoldirasiz — barcha tayyorlovchilar ko'radi",
              "Kelgan takliflardan narx va reyting bo'yicha tanlaysiz",
              "Tayyor ishni bevosita platformada qabul qilasiz",
            ]}
            cta={{ href: "/register", label: "Buyurtma qoldirish" }}
          />
          <RolePanel
            title="Tayyorlovchi"
            lead="Bilimingizni daromadga aylantiring."
            points={[
              "Ochiq buyurtmalar lentasini real vaqtda ko'rasiz",
              '"Band / bo\'sh" holatini bir bosishda yangilaysiz',
              "Taklif yuborasiz, tanlansangiz — ishga kirishasiz",
            ]}
            cta={{ href: "/register", label: "Tayyorlovchi bo'lish" }}
          />
        </div>
      </section>

      {/* ---------- how it works ---------- */}
      <section id="qanday" className="relative z-10 mx-auto max-w-5xl px-6 py-20">
        <SectionHeading
          kicker="Jarayon"
          title="Uch qadamda natija"
          subtitle="Ro'yxatdan o'tishdan tayyor ishgacha — ortiqcha suhbatlarsiz."
        />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {[
            {
              n: "01",
              t: "Ro'yxatdan o'ting",
              d: "Rolni tanlaysiz, Google bilan tasdiqlaysiz, ism-familiya va login kiritasiz.",
            },
            {
              n: "02",
              t: "Buyurtma yoki taklif",
              d: "Buyurtmachi ish shartini yozadi. Tayyorlovchilar narx va izoh bilan taklif yuboradi.",
            },
            {
              n: "03",
              t: "Kelishuv va topshirish",
              d: "Buyurtmachi bitta taklifni tanlaydi, fayllar xavfsiz almashiladi, ish yakunlanadi.",
            },
          ].map((s) => (
            <div key={s.n} className="lq-glass blur-in rounded-2xl p-6">
              <div className="text-sm font-mono text-indigo-400">{s.n}</div>
              <h3 className="font-display mt-3 text-lg font-bold text-white">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- xizmatlar ---------- */}
      <section id="turlar" className="relative z-10 mx-auto max-w-5xl px-6 py-20">
        <SectionHeading
          kicker="Ish turlari"
          title="Nima buyurtma qilish mumkin"
          subtitle="Eng ko'p so'raladigan yo'nalishlar — har birining o'z sahifasi bor."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <Link
              key={s.slug}
              href={`/xizmatlar/${s.slug}`}
              className="lq-glass blur-in group flex flex-col rounded-2xl p-6"
            >
              <h3 className="font-display font-bold text-white">{s.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
                {s.tagline}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-300 transition group-hover:gap-2.5">
                Batafsil <span>→</span>
              </span>
            </Link>
          ))}
        </div>
        <div className="blur-in mt-8 text-center">
          <Link
            href="/xizmatlar"
            className="text-sm font-medium text-zinc-400 transition hover:text-white"
          >
            Barcha xizmatlarni ko'rish →
          </Link>
        </div>
      </section>

      {/* ---------- features ---------- */}
      <section id="imkoniyat" className="relative z-10 mx-auto max-w-5xl px-6 py-20">
        <SectionHeading
          kicker="Imkoniyatlar"
          title="Nega tayyorr.uz"
          subtitle="Ishni tez, tartibli va xavfsiz qiladigan mayda-chuydalar."
        />
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Feature
            icon={<IconShield />}
            title="Xavfsiz fayllar"
            text="Faqat ishtirokchilarga vaqtinchalik havola bilan ochiladi."
          />
          <Feature
            icon={<IconLock />}
            title="Eskrou to'lov"
            text="Ish yakunlanguncha hamyonda bloklanadi, keyin o'tkaziladi."
          />
          <Feature
            icon={<IconChat />}
            title="Takliflar tizimi"
            text="Narx va izohli takliflar; eng mosini tanlaysiz."
          />
          <Feature
            icon={<IconGoogle />}
            title="Google bilan kirish"
            text="Parolni unutish muammosi yo'q."
          />
        </div>
      </section>

      {/* ---------- final CTA ---------- */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 py-24">
        <div className="lq-glass-strong blur-in relative overflow-hidden rounded-3xl p-10 text-center sm:p-16">
          <div
            aria-hidden
            className="blob"
            style={{
              top: "-6rem",
              left: "50%",
              width: "24rem",
              height: "24rem",
              transform: "translateX(-50%)",
              background: "radial-gradient(circle, #6366f1, transparent 70%)",
              opacity: 0.3,
            }}
          />
          <h2 className="font-display relative text-3xl font-bold tracking-tight sm:text-4xl">
            Bugun birinchi buyurtmangizni qoldiring
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-zinc-400">
            Ro'yxatdan o'tish bir daqiqa. To'lov faqat kelishilgan ish uchun.
          </p>
          <Link
            href={loggedIn ? "/dashboard" : "/register"}
            className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            {loggedIn ? "Asosiy menyuga o'tish" : "Hoziroq boshlash"} →
          </Link>
        </div>
      </section>

      {/* ---------- footer ---------- */}
      <footer className="relative z-10 border-t border-white/10 bg-[#08080d]/70 backdrop-blur-2xl">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            {/* brend + ijtimoiy tarmoqlar */}
            <div>
              <Logo className="h-5 sm:h-6" />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">
                Prezentatsiya, kurs ishi, referat va diplom ishini ishonchli
                tayyorlovchilarga buyurtma qiling yoki o&apos;zingiz tayyorlab
                daromad qiling.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Telegram"
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                  <TelegramIcon className="h-5 w-5" />
                </a>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                  <InstagramIcon className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* xizmatlar */}
            <FooterCol title="Xizmatlar">
              {SERVICES.map((s) => (
                <FooterLink key={s.slug} href={`/xizmatlar/${s.slug}`}>
                  {s.title.replace(
                    " (bitiruv malakaviy) ishi tayyorlashda yordam",
                    " ishi",
                  )}
                </FooterLink>
              ))}
              <FooterLink href="/xizmatlar">Barcha xizmatlar</FooterLink>
            </FooterCol>

            {/* platforma */}
            <FooterCol title="Platforma">
              <FooterLink href="/#qanday">Qanday ishlaydi</FooterLink>
              <FooterLink href="/#turlar">Ish turlari</FooterLink>
              <FooterLink href="/#imkoniyat">Imkoniyatlar</FooterLink>
              <FooterLink href="/register">Ro&apos;yxatdan o&apos;tish</FooterLink>
              <FooterLink href="/login">Kirish</FooterLink>
            </FooterCol>

            {/* huquqiy */}
            <FooterCol title="Huquqiy">
              <FooterLink href="/terms">Ommaviy oferta</FooterLink>
              <FooterLink href="/terms">Foydalanish shartlari</FooterLink>
              <FooterLink href={TELEGRAM_URL} external>
                Qo&apos;llab-quvvatlash
              </FooterLink>
            </FooterCol>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-xs text-zinc-600 sm:flex-row">
            <span>
              © {new Date().getFullYear()} tayyorr
              <span className="text-indigo-400">.uz</span> — Barcha huquqlar
              himoyalangan.
            </span>
            <span>
              <a
                href="https://sardorkhon.me"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-zinc-300"
              >
                sardorkhon.me
              </a>{" "}
              tomonidan ishlab chiqilgan
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <ul className="mt-4 space-y-2.5 text-sm text-zinc-500">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  if (external) {
    return (
      <li>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="transition hover:text-zinc-200"
        >
          {children}
        </a>
      </li>
    );
  }
  return (
    <li>
      <Link href={href} className="transition hover:text-zinc-200">
        {children}
      </Link>
    </li>
  );
}

/* ---------------- helpers ---------------- */

function SectionHeading({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="blur-in mx-auto max-w-xl text-center">
      <div className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-400">
        {kicker}
      </div>
      <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-zinc-400">{subtitle}</p>
    </div>
  );
}

function RolePanel({
  title,
  lead,
  points,
  cta,
}: {
  title: string;
  lead: string;
  points: string[];
  cta: { href: string; label: string };
}) {
  return (
    <div className="lq-glass blur-in rounded-2xl p-8">
      <h3 className="font-display text-xl font-bold text-white">{title}</h3>
      <p className="mt-1 text-sm text-zinc-400">{lead}</p>
      <ul className="mt-6 space-y-3">
        {points.map((p) => (
          <li key={p} className="flex gap-3 text-sm text-zinc-300">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-300">
              ✓
            </span>
            {p}
          </li>
        ))}
      </ul>
      <Link
        href={cta.href}
        className="mt-8 inline-flex rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
      >
        {cta.label}
      </Link>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="lq-glass blur-in rounded-2xl p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-indigo-300">
        {icon}
      </div>
      <h3 className="font-display mt-4 font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{text}</p>
    </div>
  );
}

/* inline icons (no dependency) */
const sw = { strokeWidth: 1.6, stroke: "currentColor", fill: "none" };
function IconShield() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" {...sw}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function IconGoogle() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" {...sw}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" {...sw}>
      <path d="M5 6h14v10H9l-4 3V6z" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" {...sw}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
