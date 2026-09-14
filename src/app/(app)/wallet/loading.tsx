import { SBar, SRow, SWrap } from "@/components/skeleton";

export default function WalletLoading() {
  return (
    <SWrap>
      <SBar className="h-7 w-40" />
      <div className="card h-32 w-full" />
      <div className="card h-24 w-full" />
      <div className="card h-40 w-full" />
      <SBar className="h-5 w-32" />
      <SRow withAvatar={false} />
      <SRow withAvatar={false} />
      <SRow withAvatar={false} />
    </SWrap>
  );
}
