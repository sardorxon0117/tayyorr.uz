import { SBar, SWrap } from "@/components/skeleton";

export default function MyOffersLoading() {
  return (
    <SWrap>
      <SBar className="h-6 w-48" />
      <SBar className="h-3 w-64" />
      <div className="flex flex-wrap gap-1.5">
        <SBar className="h-7 w-16 rounded-full" />
        <SBar className="h-7 w-16 rounded-full" />
        <SBar className="h-7 w-20 rounded-full" />
        <SBar className="h-7 w-28 rounded-full" />
        <SBar className="h-7 w-24 rounded-full" />
      </div>
      <div className="card space-y-2">
        <div className="flex justify-between">
          <SBar className="h-4 w-1/2" />
          <SBar className="h-4 w-10" />
        </div>
        <SBar className="h-3 w-1/3" />
        <SBar className="h-3 w-1/4" />
      </div>
      <div className="card space-y-2">
        <div className="flex justify-between">
          <SBar className="h-4 w-1/3" />
          <SBar className="h-4 w-10" />
        </div>
        <SBar className="h-3 w-1/3" />
        <SBar className="h-3 w-1/4" />
      </div>
    </SWrap>
  );
}
