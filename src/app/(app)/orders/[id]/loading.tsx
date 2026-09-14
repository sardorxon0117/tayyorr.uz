import { SBar, SBlock, SCircle, SWrap } from "@/components/skeleton";

export default function OrderDetailLoading() {
  return (
    <SWrap>
      <SBar className="h-4 w-20" />
      <div className="card flex items-center gap-3">
        <SCircle className="h-11 w-11" />
        <div className="flex-1 space-y-2">
          <SBar className="h-4 w-1/3" />
          <SBar className="h-3 w-1/4" />
        </div>
      </div>
      <SBar className="h-3 w-24" />
      <SBar className="h-7 w-2/3" />
      <SBlock className="h-28 w-full" />
      <div className="flex gap-4">
        <SBar className="h-4 w-24" />
        <SBar className="h-4 w-28" />
      </div>
      <div className="card space-y-3">
        <SBar className="h-4 w-32" />
        <SBar className="h-10 w-full" />
        <SBar className="h-20 w-full" />
        <SBar className="h-10 w-32" />
      </div>
    </SWrap>
  );
}
