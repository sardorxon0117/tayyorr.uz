import { SBar, SCard, SWrap } from "@/components/skeleton";

export default function DashboardLoading() {
  return (
    <SWrap>
      <div className="card h-28 w-full" />
      <div className="flex items-center gap-2">
        <SBar className="h-10 flex-1" />
        <SBar className="h-10 w-20" />
      </div>
      <div className="flex gap-1.5">
        <SBar className="h-7 w-16 rounded-full" />
        <SBar className="h-7 w-16 rounded-full" />
        <SBar className="h-7 w-20 rounded-full" />
        <SBar className="h-7 w-20 rounded-full" />
      </div>
      <SCard />
      <SCard />
      <SCard />
    </SWrap>
  );
}
