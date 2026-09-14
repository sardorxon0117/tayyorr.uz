export default function AdminMessageDetailLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-4">
      <div className="h-4 w-40 rounded-md bg-white/5" />
      <div className="flex flex-col gap-2.5">
        <div className="h-10 w-2/5 rounded-2xl bg-white/5" />
        <div className="h-10 w-1/2 self-end rounded-2xl bg-white/10" />
        <div className="h-10 w-1/3 rounded-2xl bg-white/5" />
      </div>
    </div>
  );
}
