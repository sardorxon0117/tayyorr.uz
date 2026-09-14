import { SBar, SWrap } from "@/components/skeleton";

export default function WalletTxLoading() {
  return (
    <SWrap>
      <SBar className="h-4 w-24" />
      <div className="card space-y-3">
        <SBar className="h-6 w-1/2" />
        <SBar className="h-4 w-1/3" />
        <SBar className="h-4 w-2/3" />
        <SBar className="h-4 w-1/4" />
      </div>
      <SBar className="h-10 w-40" />
    </SWrap>
  );
}
