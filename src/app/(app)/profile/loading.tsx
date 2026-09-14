import { SBar, SCircle, SField, SWrap } from "@/components/skeleton";

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
      <SWrap>
        <div className="card flex items-center gap-4">
          <SCircle className="h-16 w-16" />
          <SBar className="h-9 w-32" />
        </div>
        <div className="flex gap-3">
          <SField w="w-1/2" />
          <SField w="w-1/2" />
        </div>
        <SField />
        <SBar className="h-10 w-32" />
      </SWrap>
    </div>
  );
}
