/**
 * Hero fon videosi — matn ortida, ekran chap chetiga qadar cho'zilib turadi.
 * Kompyuterda ekranning chap chetidan boshlanib, markazga yaqinlashguncha
 * xiralashib fon rangiga (orqadagi bloblarga) singib ketadi; telefonda esa
 * matndan pastroqda boshlanib, pastga qarab xiralashadi. Video bevosita
 * matn orqasida turgani uchun ustiga qorong'i qatlam qo'yilgan — shu
 * orqali sarlavha va header har doim o'qiladigan bo'lib qoladi.
 */
export function HeroBgVideo({ url }: { url: string }) {
  if (!url) return null;

  return (
    <div className="hero-video-mask absolute left-0 top-[35rem] h-[15rem] w-full overflow-hidden sm:top-0 sm:h-[40rem] sm:w-[75%] md:w-[64%] lg:h-[46rem] lg:w-[54%]">
      <video
        className="h-full w-full object-cover"
        src={url}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      {/* mobil: video matndan pastda, yengil tepa qorayish yetarli */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#07070c]/60 via-transparent to-transparent sm:hidden" />
      {/* kompyuter: video bevosita matn orqasida — butun balandlikda qorong'i qatlam kerak */}
      <div className="absolute inset-0 hidden bg-[#07070c]/75 sm:block" />
    </div>
  );
}
