/* tayyorr.uz logotipi — mavzuга qarab rasm almashadi. */
export function Logo({ className = "h-7" }: { className?: string }) {
  return (
    <span className="inline-flex max-w-full select-none items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-dark.png"
        alt="tayyorr.uz"
        className={`logo-dark w-auto max-w-full object-contain ${className}`}
        draggable={false}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-light.png"
        alt="tayyorr.uz"
        className={`logo-light w-auto max-w-full object-contain ${className}`}
        draggable={false}
      />
    </span>
  );
}
