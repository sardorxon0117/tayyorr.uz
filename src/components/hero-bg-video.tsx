/**
 * Hero fon videosi — sarlavha ortida, ekran chetiga qadar cho'zilib turadi.
 * Kompyuterda o'ng chetga qarab, telefonda esa pastga qarab xiralashib fon
 * rangiga (orqadagi bloblarga) singib ketadi. Telefonda matn bilan
 * qoplashmasligi uchun video matndan pastroqda boshlanadi; ustki chetiga
 * yumshoq qorong'ilik qo'yilgan — shu orqali yuqoridagi header/matn har
 * doim o'qiladigan bo'lib qoladi.
 */
export function HeroBgVideo({ url }: { url: string }) {
  if (!url) return null;

  return (
    <div className="hero-video-mask absolute right-0 top-[35rem] h-[15rem] w-full overflow-hidden sm:top-0 sm:h-[40rem] sm:w-[75%] md:w-[64%] lg:h-[46rem] lg:w-[54%]">
      <video
        className="h-full w-full object-cover"
        src={url}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#07070c]/60 via-transparent to-transparent sm:from-[#07070c]/85 sm:via-[#07070c]/10" />
    </div>
  );
}
