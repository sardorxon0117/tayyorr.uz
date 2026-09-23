import { db } from "@/lib/db";
import { HeroVideoManager } from "@/components/admin/hero-video-manager";
import { LandingFaqManager, type Faq } from "@/components/admin/landing-faq-manager";
import {
  LandingVideoManager,
  type Video,
} from "@/components/admin/landing-video-manager";
import {
  LandingPhoneSlideManager,
  type PhoneSlide,
} from "@/components/admin/landing-phone-slide-manager";

export default async function AdminLandingContent() {
  const [heroVideo, faqRows, videoRows, phoneSlideRows] = await Promise.all([
    db.heroVideo.findUnique({ where: { id: "hero" } }),
    db.landingFaq.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
    db.landingVideo.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
    db.landingPhoneSlide.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
  ]);

  const faqs: Faq[] = faqRows.map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
    order: f.order,
    active: f.active,
  }));

  const videos: Video[] = videoRows.map((v) => ({
    id: v.id,
    title: v.title,
    videoUrl: v.videoUrl,
    videoKey: v.videoKey ?? "",
    order: v.order,
    active: v.active,
  }));

  const phoneSlides: PhoneSlide[] = phoneSlideRows.map((p) => ({
    id: p.id,
    title: p.title,
    subtitle: p.subtitle,
    imageUrl: p.imageUrl,
    imageKey: p.imageKey ?? "",
    order: p.order,
    active: p.active,
  }));

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-xl font-semibold text-white">Sayt kontenti</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Landing sahifaning footerdan oldingi video va savol-javob
          bo'limlarini shu yerdan boshqarasiz.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">Hero fon videosi</h2>
        <HeroVideoManager
          initialUrl={heroVideo?.videoUrl ?? ""}
          initialActive={heroVideo?.active ?? true}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">
          Telefon slaydlari (yuklab olishdan oldingi bo&apos;lim)
        </h2>
        <LandingPhoneSlideManager initial={phoneSlides} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">Videolar</h2>
        <LandingVideoManager initial={videos} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">
          Ko&apos;p so&apos;raladigan savollar
        </h2>
        <LandingFaqManager initial={faqs} />
      </section>
    </div>
  );
}
