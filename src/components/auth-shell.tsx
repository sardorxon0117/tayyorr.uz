import Link from "next/link";
import { AuroraBackground } from "@/components/aurora-background";
import { ForceDark } from "@/components/force-dark";

export function AuthShell({
  children,
  width = "max-w-md",
}: {
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <ForceDark />
      <AuroraBackground />
      <Link
        href="/"
        className="mb-8 text-lg font-semibold tracking-tight text-zinc-200"
      >
        tayyorr<span className="text-indigo-400">.uz</span>
      </Link>
      <div className={`w-full ${width} animate-rise`}>{children}</div>
    </main>
  );
}
