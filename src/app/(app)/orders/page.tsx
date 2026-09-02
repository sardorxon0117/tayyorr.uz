import { redirect } from "next/navigation";

// Buyurtmalar endi kabinetda — bu sahifa kabinetga yo'naltiradi.
export default function OrdersPage() {
  redirect("/dashboard");
}
