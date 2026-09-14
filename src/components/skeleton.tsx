/**
 * Skeleton-loading uchun kichik qurilish bloklari — har bir sahifa
 * o'zining haqiqiy shakliga mos ravishda shulardan yig'adi (bir xil
 * "quti" hamma joyda emas).
 */

export function SBar({ className = "" }: { className?: string }) {
  return <div className={`rounded-md bg-white/5 ${className}`} />;
}

export function SCircle({ className = "h-10 w-10" }: { className?: string }) {
  return <div className={`shrink-0 rounded-full bg-white/5 ${className}`} />;
}

/** Ro'yxat qatori: doira (avatar) + ikki qator matn + o'ngda kichik belgi. */
export function SRow({ withAvatar = true }: { withAvatar?: boolean }) {
  return (
    <div className="card flex items-center gap-3">
      {withAvatar && <SCircle />}
      <div className="flex-1 space-y-2">
        <SBar className="h-4 w-2/3" />
        <SBar className="h-3 w-1/3" />
      </div>
      <SBar className="h-5 w-12" />
    </div>
  );
}

/** Karta qatori: sarlavha + tavsif + pastda kichik metama'lumot qatori. */
export function SCard() {
  return (
    <div className="card space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <SBar className="h-4 w-1/2" />
        <SBar className="h-5 w-16 rounded-full" />
      </div>
      <SBar className="h-3 w-full" />
      <SBar className="h-3 w-2/3" />
      <SBar className="h-3 w-24" />
    </div>
  );
}

/** Forma maydoni: yorliq + input. */
export function SField({ w = "w-full" }: { w?: string }) {
  return (
    <div className={`space-y-1.5 ${w}`}>
      <SBar className="h-3 w-20" />
      <SBar className="h-10 w-full" />
    </div>
  );
}

/** Jadval qatori (admin ro'yxatlar). */
export function STableRow({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 border-t border-white/5 px-4 py-3">
      {Array.from({ length: cols }).map((_, i) => (
        <SBar key={i} className={`h-3.5 ${i === 0 ? "w-1/4" : "flex-1"}`} />
      ))}
    </div>
  );
}

/** Umumiy o'ram — pulse animatsiyasi shu yerda beriladi. */
export function SWrap({ children }: { children: React.ReactNode }) {
  return <div className="flex animate-pulse flex-col gap-4">{children}</div>;
}
