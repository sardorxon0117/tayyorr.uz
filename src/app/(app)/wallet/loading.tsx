import { SBar, SBlock, SRow, SWrap } from "@/components/skeleton";

export default function WalletLoading() {
  return (
    <SWrap>
      <SBar className="h-7 w-40" />
      <SBlock className="h-32 w-full" />
      <SBlock className="h-24 w-full" />
      <SBlock className="h-40 w-full" />
      <SBar className="h-5 w-32" />
      <SRow withAvatar={false} />
      <SRow withAvatar={false} />
      <SRow withAvatar={false} />
    </SWrap>
  );
}
