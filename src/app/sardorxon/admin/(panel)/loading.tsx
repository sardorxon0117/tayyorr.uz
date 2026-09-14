/** Admin panelida sahifa o'tishlarini darhol ko'rsatadi (yuqoridagi izohga qarang). */
export default function AdminLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-4">
      <div className="h-6 w-40 rounded-lg bg-white/5" />
      <div className="flex flex-col gap-2">
        <div className="h-16 rounded-xl bg-white/5" />
        <div className="h-16 rounded-xl bg-white/5" />
        <div className="h-16 rounded-xl bg-white/5" />
        <div className="h-16 rounded-xl bg-white/5" />
      </div>
    </div>
  );
}
