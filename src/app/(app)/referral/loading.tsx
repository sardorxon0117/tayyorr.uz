import { SBar, SBlock, SRow, SWrap } from "@/components/skeleton";

export default function ReferralLoading() {
  return (
    <SWrap>
      <SBar className="h-6 w-32" />
      <SBar className="h-3 w-64" />
      <SBlock className="h-32 w-full" />
      <SBar className="h-5 w-40" />
      <SRow withAvatar={false} />
      <SRow withAvatar={false} />
    </SWrap>
  );
}
