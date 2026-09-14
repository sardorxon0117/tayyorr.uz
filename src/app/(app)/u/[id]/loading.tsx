import { SBar, SCard, SCircle, SWrap } from "@/components/skeleton";

export default function PublicProfileLoading() {
  return (
    <SWrap>
      <div className="flex items-center gap-4">
        <SCircle className="h-20 w-20" />
        <div className="space-y-2">
          <SBar className="h-5 w-32" />
          <SBar className="h-3 w-24" />
        </div>
      </div>
      <div className="card space-y-2">
        <SBar className="h-3 w-full" />
        <SBar className="h-3 w-2/3" />
      </div>
      <SBar className="h-5 w-40" />
      <SCard />
      <SCard />
    </SWrap>
  );
}
