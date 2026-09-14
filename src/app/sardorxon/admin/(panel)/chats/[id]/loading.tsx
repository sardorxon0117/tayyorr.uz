export default function AdminChatDetailLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-4">
      <div className="card flex items-center gap-3">
        <div className="h-4 w-48 rounded-md bg-white/5" />
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="h-10 w-2/5 rounded-2xl bg-white/5" />
        <div className="h-10 w-1/2 self-end rounded-2xl bg-white/10" />
        <div className="h-14 w-3/5 rounded-2xl bg-white/5" />
        <div className="h-10 w-2/5 self-end rounded-2xl bg-white/10" />
      </div>
    </div>
  );
}
