/**
 * Sahifadan sahifaga o'tishda darhol ko'rinadi (ma'lumot hali serverdan
 * kelmagan bo'lsa ham) — aks holda navigatsiya "qotib qolgandek" tuyuladi,
 * chunki Next.js loading.tsx bo'lmasa yangi sahifaning BARCHA ma'lumoti
 * tayyor bo'lguncha eski sahifada kutib turadi.
 */
export default function AppLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-4">
      <div className="h-7 w-48 rounded-lg bg-white/5" />
      <div className="h-24 rounded-2xl bg-white/5" />
      <div className="flex flex-col gap-2">
        <div className="h-20 rounded-xl bg-white/5" />
        <div className="h-20 rounded-xl bg-white/5" />
        <div className="h-20 rounded-xl bg-white/5" />
      </div>
    </div>
  );
}
