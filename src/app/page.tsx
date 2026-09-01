import Link from "next/link";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  const loggedIn = !!session?.user;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07070c] text-zinc-100 antialiased">
      {/* ---------- background ---------- */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid" />
        <div
          className="blob animate-float-a"
          style={{
            top: "-8rem",
            left: "-6rem",
            width: "34rem",
            height: "34rem",
            background:
              "radial-gradient(circle at 30% 30%, #6366f1, transparent 70%)",
          }}
        />
        <div
          className="blob animate-float-b"
          style={{
            top: "4rem",
            right: "-10rem",
            width: "38rem",
            height: "38rem",
            background:
              "radial-gradient(circle at 60% 40%, #d946ef, transparent 70%)",
          }}
        />
        <div
          className="blob animate-float-c"
          style={{
            bottom: "-14rem",
            left: "20%",
            width: "40rem",
            height: "40rem",
            background:
              "radial-gradient(circle at 50% 50%, #06b6d4, transparent 70%)",
            opacity: 0.4,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#07070c]" />
      </div>

      {/* ---------- nav ---------- */}
      <header className="relative z-20">
        <nav className="mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-2xl glass px-5 py-3">
          <span className="text-lg font-semibold tracking-tight">
            tayyorr<span className="text-indigo-400">.uz</span>
          </span>
          <div className="hidden items-center gap-7 text-sm text-zinc-400 sm:flex">
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
                Kabinet
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
        </nav>
      </header>

      {/* ---------- hero ---------- */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pt-24 pb-20 text-center sm:pt-32">
        <div className="animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            O'zbekcha ta'lim platformasi
          </span>
        </div>

        <h1
          className="animate-rise mt-7 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl"
          style={{ animationDelay: "60ms" }}
        >
          Ilmiy ishlaringiz uchun
          <br />
          <span className="text-sheen">to'g'ri odam</span> topiladi
        </h1>

        <p
          className="animate-rise mx-auto mt-6 max-w-xl text-lg text-zinc-400"
          style={{ animationDelay: "120ms" }}
        >
          Prezentatsiya, kurs ishi, referat yoki diplom ishi — buyurtma qoldiring,
          u barcha tayyorlovchilarga ko'rinadi. Yoki o'zingiz tayyorlab, daromad
          qiling.
        </p>

        <div
          className="animate-rise mt-9 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "180ms" }}
        >
          <Link
            href={loggedIn ? "/dashboard" : "/register"}
            className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            {loggedIn ? "Kabinetga o'tish" : "Bepul boshlash"}
            <span className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </Link>
          <a
            href="#qanday"
            className="rounded-xl glass px-6 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/10"
          >
            Qanday ishlaydi?
          </a>
        </div>

        <dl
          className="animate-rise mx-auto mt-16 grid max-w-lg grid-cols-3 gap-6 text-center"
          style={{ animationDelay: "240ms" }}
        >
          {[
            ["2", "rol: buyurtmachi va tayyorlovchi"],
            ["10 daq", "ichida birinchi taklif"],
            ["100%", "xavfsiz fayl almashinuvi"],
          ].map(([n, l]) => (
            <div key={l}>
              <dt className="text-2xl font-semibold text-white">{n}</dt>
              <dd className="mt-1 text-xs leading-relaxed text-zinc-500">{l}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------- dual role ---------- */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-2">
          <RolePanel
            tone="indigo"
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
            tone="fuchsia"
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
      <section id="qanday" className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <SectionHeading
          kicker="Jarayon"
          title="Uch qadamda natija"
          subtitle="Ro'yxatdan o'tishdan tayyor ishgacha — ortiqcha suhbatlarsiz."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            {
              n: "01",
              t: "Ro'yxatdan o'ting",
              d: "Rolni tanlaysiz, Google bilan tasdiqlaysiz, ism-familiya, login va glavniy rasm kiritasiz.",
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
          ].map((s, i) => (
            <div
              key={s.n}
              className="relative rounded-2xl glass p-6"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="text-sm font-mono text-indigo-400">{s.n}</div>
              <h3 className="mt-3 text-lg font-semibold text-white">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- work types ---------- */}
      <section id="turlar" className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <SectionHeading
          kicker="Ish turlari"
          title="Nima buyurtma qilish mumkin"
          subtitle="Eng ko'p so'raladigan yo'nalishlar — ro'yxat kengayib boradi."
        />
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {[
            "Prezentatsiya",
            "Kurs ishi",
            "Referat",
            "Diplom ishi",
            "Esse",
            "Mustaqil ish",
            "Taqdimot dizayni",
            "Amaliyot hisoboti",
            "Slaydlar",
          ].map((t) => (
            <span
              key={t}
              className="rounded-full glass px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ---------- features ---------- */}
      <section id="imkoniyat" className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <SectionHeading
          kicker="Imkoniyatlar"
          title="Nega tayyorr.uz"
          subtitle="Ishni tez, tartibli va xavfsiz qiladigan mayda-chuydalar."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Feature
            icon={<IconShield />}
            title="Xavfsiz fayllar"
            text="Tayyor ishlar yopiq saqlanadi, faqat ishtirokchilarga vaqtinchalik havola."
          />
          <Feature
            icon={<IconBolt />}
            title="Band / bo'sh"
            text="Tayyorlovchi holati bir bosishda yangilanadi va buyurtmachiga ko'rinadi."
          />
          <Feature
            icon={<IconGoogle />}
            title="Google bilan kirish"
            text="Parolni unutish muammosi yo'q — Google orqali ishonchli tasdiqlash."
          />
          <Feature
            icon={<IconChat />}
            title="Takliflar tizimi"
            text="Har bir buyurtmaga narx va izohli takliflar; eng mosini tanlaysiz."
          />
        </div>
      </section>

      {/* ---------- final CTA ---------- */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-24">
        <div className="relative overflow-hidden rounded-3xl glass-strong p-10 text-center sm:p-16">
          <div
            aria-hidden
            className="blob"
            style={{
              top: "-6rem",
              left: "50%",
              width: "28rem",
              height: "28rem",
              transform: "translateX(-50%)",
              background:
                "radial-gradient(circle, #8b5cf6, transparent 70%)",
              opacity: 0.4,
            }}
          />
          <h2 className="relative text-3xl font-semibold tracking-tight sm:text-4xl">
            Bugun birinchi buyurtmangizni qoldiring
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-zinc-400">
            Ro'yxatdan o'tish bir daqiqa. To'lov faqat kelishilgan ish uchun.
          </p>
          <Link
            href={loggedIn ? "/dashboard" : "/register"}
            className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            {loggedIn ? "Kabinetga o'tish" : "Hoziroq boshlash"} →
          </Link>
        </div>
      </section>

      {/* ---------- footer ---------- */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-zinc-500 sm:flex-row">
          <span>
            tayyorr<span className="text-indigo-400">.uz</span> ·{" "}
            {new Date().getFullYear()}
          </span>
          <div className="flex gap-6">
            <Link href="/login" className="transition hover:text-zinc-300">
              Kirish
            </Link>
            <Link href="/register" className="transition hover:text-zinc-300">
              Ro'yxatdan o'tish
            </Link>
          </div>
        </div>
      </footer>
    </main>
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
    <div className="mx-auto max-w-2xl text-center">
      <div className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-400">
        {kicker}
      </div>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-zinc-400">{subtitle}</p>
    </div>
  );
}

function RolePanel({
  tone,
  title,
  lead,
  points,
  cta,
}: {
  tone: "indigo" | "fuchsia";
  title: string;
  lead: string;
  points: string[];
  cta: { href: string; label: string };
}) {
  const ring =
    tone === "indigo"
      ? "from-indigo-500/25"
      : "from-fuchsia-500/25";
  return (
    <div className="group relative overflow-hidden rounded-3xl glass p-8">
      <div
        className={`pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-gradient-to-br ${ring} to-transparent blur-2xl`}
      />
      <h3 className="relative text-xl font-semibold text-white">{title}</h3>
      <p className="relative mt-1 text-sm text-zinc-400">{lead}</p>
      <ul className="relative mt-6 space-y-3">
        {points.map((p) => (
          <li key={p} className="flex gap-3 text-sm text-zinc-300">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                tone === "indigo" ? "bg-indigo-500/20 text-indigo-300" : "bg-fuchsia-500/20 text-fuchsia-300"
              }`}
            >
              ✓
            </span>
            {p}
          </li>
        ))}
      </ul>
      <Link
        href={cta.href}
        className="relative mt-8 inline-flex rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
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
    <div className="rounded-2xl glass p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-indigo-300">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-white">{title}</h3>
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
function IconBolt() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" {...sw}>
      <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />
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
