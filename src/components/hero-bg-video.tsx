/**
 * Hero fon videosi — matn ortida (barcha o'lchamlarda), ekran chetiga qadar
 * cho'zilib turadi. Telefonda pastga qarab, kompyuterda markazga
 * yaqinlashguncha xiralashib fon rangiga (orqadagi bloblarga) singib
 * ketadi. Video bevosita matn orqasida turgani uchun ustiga qorong'i
 * qatlam qo'yilgan — shu orqali sarlavha va header har doim o'qiladigan
 * bo'lib qoladi.
 */
export function HeroBgVideo({ url }: { url: string }) {
  if (!url) return null;

  return (
    <div className="hero-video-mask absolute left-0 top-0 h-[46rem] w-full overflow-hidden sm:h-[40rem] sm:w-[75%] md:w-[64%] lg:h-[46rem] lg:w-[54%]">
      <video
        className="h-full w-full object-cover"
        src={url}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      {/* video bevosita matn orqasida — butun balandlikda qorong'i qatlam kerak */}
      <div className="absolute inset-0 bg-[#07070c]/75" />
    </div>
  );
}
