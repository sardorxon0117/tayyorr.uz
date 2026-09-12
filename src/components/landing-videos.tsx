type VideoItem = { id: string; title: string; videoUrl: string };

/**
 * 4ta videoni oddiy teng katakli emas, "bento" uslubidagi nomutanosib
 * panjarada joylashtiradi: biri katta, ikkitasi kichik, biri keng.
 */
const BENTO_SPAN = [
  "sm:col-span-2 sm:row-span-2",
  "",
  "",
  "sm:col-span-2",
];

export function LandingVideos({ videos }: { videos: VideoItem[] }) {
  if (videos.length === 0) return null;

  return (
    <section id="videolar" className="relative z-10 mx-auto max-w-5xl px-6 py-20">
      <div className="blur-in mx-auto max-w-xl text-center">
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-400">
          Amaliyotda
        </div>
        <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Platforma qanday ishlashini ko&apos;ring
        </h2>
        <p className="mt-3 text-zinc-400">
          Ro&apos;yxatdan o&apos;tishdan tayyor ishni qabul qilishgacha — bir
          necha qisqa video.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-4 sm:auto-rows-[10rem] lg:auto-rows-[11rem]">
        {videos.slice(0, 4).map((v, i) => (
          <div
            key={v.id}
            className={`lq-glass blur-in group relative aspect-video overflow-hidden rounded-2xl sm:aspect-auto ${BENTO_SPAN[i] ?? ""}`}
          >
            <video
              src={v.videoUrl}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent p-4 pt-12">
              <p className="text-sm font-medium text-white">{v.title}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
