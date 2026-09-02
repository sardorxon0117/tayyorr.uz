import { db } from "@/lib/db";
import { AnnouncementForm } from "@/components/admin/announcement-form";

export default async function AdminAnnouncement() {
  const a = await db.announcement.findFirst({ orderBy: { updatedAt: "desc" } });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-white">E'lon banneri</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Buyurtmalar ro'yxati ustida (faqat kompyuterda) ko'rinadigan e'lon.
        </p>
      </div>
      <AnnouncementForm
        initial={{
          title: a?.title ?? "",
          body: a?.body ?? "",
          buttonText: a?.buttonText ?? "",
          buttonUrl: a?.buttonUrl ?? "",
          active: a?.active ?? true,
        }}
      />
    </div>
  );
}
