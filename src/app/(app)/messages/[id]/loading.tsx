import { SBubble, SCircle, SWrap } from "@/components/skeleton";

/** Chat ko'rinishiga o'xshab — pufakchalar chapdan-o'ngga navbat bilan. */
export default function ChatLoading() {
  return (
    <SWrap>
      <div className="card flex items-center gap-3">
        <SCircle className="h-9 w-9" />
        <div className="skel h-4 w-32 rounded-md" />
      </div>
      <div className="flex flex-col gap-2.5">
        <SBubble w="w-2/5" />
        <SBubble w="w-1/2" mine />
        <SBubble w="w-3/5" />
        <SBubble w="w-2/5" mine />
        <SBubble w="w-1/3" />
      </div>
    </SWrap>
  );
}
