import { SBar, SWrap } from "@/components/skeleton";

export default function AdminComplaintDetailLoading() {
  return (
    <SWrap>
      <SBar className="h-4 w-32" />
      <div className="card h-24 w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card h-32" />
        <div className="card h-32" />
      </div>
    </SWrap>
  );
}
