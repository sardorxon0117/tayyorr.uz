import { redirect } from "next/navigation";

// Buyurtmalar endi asosiy menyuda — bu sahifa asosiy menyuga yo'naltiradi.
export default function OrdersPage() {
  redirect("/dashboard");
}
