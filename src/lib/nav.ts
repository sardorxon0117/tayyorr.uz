import type { NavLink } from "@/components/nav-menu";

export const APP_NAV: NavLink[] = [
  { href: "/dashboard", label: "Kabinet", tkey: "nav.dashboard", icon: "🏠" },
  { href: "/messages", label: "Xabarlar", tkey: "nav.messages", icon: "💬" },
  { href: "/wallet", label: "Hamyon", tkey: "nav.wallet", icon: "💳" },
  { href: "/profile", label: "Profil", tkey: "nav.profile", icon: "👤" },
];
