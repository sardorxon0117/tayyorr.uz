import { SRow, SWrap } from "@/components/skeleton";

export default function AdminComplaintsLoading() {
  return (
    <SWrap>
      <div className="h-6 w-40 rounded-md bg-white/5" />
      <SRow withAvatar={false} />
      <SRow withAvatar={false} />
      <SRow withAvatar={false} />
      <SRow withAvatar={false} />
    </SWrap>
  );
}
