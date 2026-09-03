/* tayyorr.uz logotipi — mavzuga qarab (yorug'/qorong'i) rasm almashadi.
   public/logo-dark.png  — qorong'i rejim uchun (oq logo)
   public/logo-light.png — yorug' rejim uchun (qora logo) */
export function Logo({
  className = "h-6 w-auto",
}: {
  className?: string;
}) {
  return (
    <span className="inline-flex select-none items-center" aria-label="tayyorr.uz">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-dark.png"
        alt="tayyorr.uz"
        className={`logo-dark ${className}`}
        draggable={false}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-light.png"
        alt="tayyorr.uz"
        className={`logo-light ${className}`}
        draggable={false}
      />
    </span>
  );
}
