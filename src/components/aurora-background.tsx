/**
 * Sahifa orqa foni: katak (grid) + sekin suzuvchi blur gradient "blob"lar.
 * Dekorativ, interaktiv emas.
 */
export function AuroraBackground({ compact = false }: { compact?: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-grid" />
      <div
        className="blob animate-float-a"
        style={{
          top: compact ? "-10rem" : "-6rem",
          left: "-8rem",
          width: "32rem",
          height: "32rem",
          background: "radial-gradient(circle at 30% 30%, #6366f1, transparent 70%)",
          opacity: 0.45,
        }}
      />
      <div
        className="blob animate-float-b"
        style={{
          top: "2rem",
          right: "-12rem",
          width: "34rem",
          height: "34rem",
          background: "radial-gradient(circle at 60% 40%, #d946ef, transparent 70%)",
          opacity: 0.35,
        }}
      />
      {!compact && (
        <div
          className="blob animate-float-c"
          style={{
            bottom: "-16rem",
            left: "25%",
            width: "36rem",
            height: "36rem",
            background:
              "radial-gradient(circle at 50% 50%, #06b6d4, transparent 70%)",
            opacity: 0.28,
          }}
        />
      )}
      <div className="aurora-fade absolute inset-0 bg-gradient-to-b from-transparent via-[#08080d]/40 to-[#08080d]" />
    </div>
  );
}
