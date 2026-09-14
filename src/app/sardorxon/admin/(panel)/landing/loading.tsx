import { SBar, SWrap } from "@/components/skeleton";

export default function AdminLandingLoading() {
  return (
    <SWrap>
      <SBar className="h-6 w-40" />
      <div className="card h-40 w-full" />
      <div className="card h-32 w-full" />
    </SWrap>
  );
}
