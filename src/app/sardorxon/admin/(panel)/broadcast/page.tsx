import { BroadcastForm } from "@/components/admin/broadcast-form";

export default function AdminBroadcast() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-white">Ommaviy xabar</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Filtrlangan foydalanuvchilarga «tayyorr.uz support» nomidan xabar
          yuboriladi (real vaqt + push).
        </p>
      </div>
      <BroadcastForm />
    </div>
  );
}
