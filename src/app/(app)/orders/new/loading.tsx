import { SBar, SField, SWrap } from "@/components/skeleton";

export default function NewOrderLoading() {
  return (
    <SWrap>
      <SBar className="h-6 w-56" />
      <div className="card space-y-4">
        <SField />
        <SField />
        <div className="flex gap-3">
          <SField w="w-1/2" />
          <SField w="w-1/2" />
        </div>
        <SField />
        <SBar className="h-10 w-32" />
      </div>
    </SWrap>
  );
}
