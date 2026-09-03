export type Locale = "uz" | "ru" | "en";

export const LOCALES: Locale[] = ["uz", "ru", "en"];
export const LOCALE_SHORT: Record<Locale, string> = {
  uz: "UZ",
  ru: "RU",
  en: "EN",
};

type Dict = Record<string, string>;

const uz: Dict = {
  "nav.dashboard": "Kabinet",
  "nav.messages": "Xabarlar",
  "nav.wallet": "Hamyon",
  "nav.profile": "Profil",
  "theme.light": "Yorug'",
  "theme.dark": "Qorong'i",
  "role.orderer": "Buyurtma beruvchi",
  "role.preparer": "Tayyorlovchi",
  "orders.title.mine": "Buyurtmalarim",
  "orders.title.all": "Buyurtmalar",
  "orders.new": "+ Yangi buyurtma",
  "orders.search": "Sarlavha, tavsif yoki tur bo'yicha qidirish…",
  "orders.filter": "Filtr",
  "orders.count": "ta",
  "orders.empty": "Hali buyurtma yo'q.",
  "orders.noMatch": "Mos buyurtma topilmadi.",
  "sort.new": "Yangi",
  "sort.old": "Eski",
  "sort.offers": "Takliflar",
  "sort.budget": "Byudjet",
  "wallet.balanceLabel": "Hisobingizdagi pul",
  "wallet.topup": "Hisobni to'ldirish",
};

const ru: Dict = {
  "nav.dashboard": "Кабинет",
  "nav.messages": "Сообщения",
  "nav.wallet": "Кошелёк",
  "nav.profile": "Профиль",
  "theme.light": "Светлая",
  "theme.dark": "Тёмная",
  "role.orderer": "Заказчик",
  "role.preparer": "Исполнитель",
  "orders.title.mine": "Мои заказы",
  "orders.title.all": "Заказы",
  "orders.new": "+ Новый заказ",
  "orders.search": "Поиск по названию, описанию или типу…",
  "orders.filter": "Фильтр",
  "orders.count": "шт",
  "orders.empty": "Пока нет заказов.",
  "orders.noMatch": "Ничего не найдено.",
  "sort.new": "Новые",
  "sort.old": "Старые",
  "sort.offers": "Отклики",
  "sort.budget": "Бюджет",
  "wallet.balanceLabel": "Ваш баланс",
  "wallet.topup": "Пополнить счёт",
};

const en: Dict = {
  "nav.dashboard": "Dashboard",
  "nav.messages": "Messages",
  "nav.wallet": "Wallet",
  "nav.profile": "Profile",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "role.orderer": "Orderer",
  "role.preparer": "Preparer",
  "orders.title.mine": "My orders",
  "orders.title.all": "Orders",
  "orders.new": "+ New order",
  "orders.search": "Search by title, description or type…",
  "orders.filter": "Filter",
  "orders.count": "",
  "orders.empty": "No orders yet.",
  "orders.noMatch": "Nothing found.",
  "sort.new": "Newest",
  "sort.old": "Oldest",
  "sort.offers": "Offers",
  "sort.budget": "Budget",
  "wallet.balanceLabel": "Your balance",
  "wallet.topup": "Top up",
};

const DICT: Record<Locale, Dict> = { uz, ru, en };

export function translate(locale: Locale, key: string): string {
  return DICT[locale]?.[key] ?? uz[key] ?? key;
}
