import { SBar, SCircle, SWrap } from "@/components/skeleton";

export default function AdminUserDetailLoading() {
  return (
    <SWrap>
      <SBar className="h-4 w-32" />
      <div className="flex items-center gap-4">
        <SCircle className="h-14 w-14" />
        <SBar className="h-5 w-40" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-40" />
        ))}
      </div>
      <div className="card h-48" />
    </SWrap>
  );
}
