import { SCircle } from "@/components/skeleton";

/** Chat ko'rinishiga o'xshab — pufakchalar chapdan-o'ngga navbat bilan. */
export default function ChatLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-4">
      <div className="card flex items-center gap-3">
        <SCircle className="h-9 w-9" />
        <div className="h-4 w-32 rounded-md bg-white/5" />
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="h-10 w-2/5 rounded-2xl bg-white/5" />
        <div className="h-10 w-1/2 self-end rounded-2xl bg-white/10" />
        <div className="h-14 w-3/5 rounded-2xl bg-white/5" />
        <div className="h-10 w-2/5 self-end rounded-2xl bg-white/10" />
        <div className="h-10 w-1/3 rounded-2xl bg-white/5" />
      </div>
    </div>
  );
}
