type FaqItem = { id: string; question: string; answer: string };

export function LandingFaq({ faqs }: { faqs: FaqItem[] }) {
  if (faqs.length === 0) return null;

  return (
    <section id="savollar" className="relative z-10 mx-auto max-w-3xl px-6 py-20">
      <div className="blur-in mx-auto max-w-xl text-center">
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-400">
          Savol-javob
        </div>
        <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ko&apos;p so&apos;raladigan savollar
        </h2>
      </div>

      <div className="lq-glass blur-in mt-12 divide-y divide-white/10 rounded-2xl px-6">
        {faqs.map((f) => (
          <details key={f.id} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-white marker:content-none">
              {f.question}
              <span className="shrink-0 text-lg leading-none text-indigo-400 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.answer}</p>
          </details>
        ))}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          }),
        }}
      />
    </section>
  );
}
