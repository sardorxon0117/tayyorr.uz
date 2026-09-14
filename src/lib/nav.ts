import type { NavLink } from "@/components/nav-menu";

const BASE_NAV: NavLink[] = [
  { href: "/dashboard", label: "Asosiy menyu", tkey: "nav.dashboard", icon: "🏠" },
  { href: "/messages", label: "Xabarlar", tkey: "nav.messages", icon: "💬" },
  { href: "/wallet", label: "Hamyon", tkey: "nav.wallet", icon: "💳" },
  { href: "/profile", label: "Profil", tkey: "nav.profile", icon: "👤" },
];

const MY_OFFERS_LINK: NavLink = {
  href: "/offers",
  label: "Mening takliflarim",
  tkey: "nav.myOffers",
  icon: "🙋",
};

const REFERRAL_LINK: NavLink = {
  href: "/referral",
  label: "Referal",
  tkey: "nav.referral",
  icon: "🎁",
};

/** Rolga qarab navigatsiya ro'yxati — "Mening takliflarim" va "Referal" faqat tayyorlovchiga. */
export function navForRole(role: string | null | undefined): NavLink[] {
  if (role !== "PREPARER") return BASE_NAV;
  return [BASE_NAV[0], MY_OFFERS_LINK, REFERRAL_LINK, ...BASE_NAV.slice(1)];
}

/** Orqaga moslik uchun — rolsiz joylarda standart ro'yxat. */
export const APP_NAV = BASE_NAV;
