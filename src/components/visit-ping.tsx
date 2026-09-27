"use client";

import { useEffect } from "react";

const FLAG = "tyr_visit_logged";

/**
 * Har bir yangi brauzer sessiyasida (tab/oyna ochilganda) bitta marta
 * saytga "tashrif" sifatida qayd qiladi. sessionStorage tab yopilganda
 * tozalanadi — shuning uchun qayta ochilsa yangi tashrif hisoblanadi,
 * bitta tab ichida esa (necha soat ochiq tursa ham) faqat bir marta.
 */
export function VisitPing() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(FLAG)) return;
      sessionStorage.setItem(FLAG, "1");
    } catch {
      /* sessionStorage yo'q bo'lsa ham davom etamiz — shunchaki har safar yozadi */
    }
    fetch("/api/me/visit", { method: "POST", keepalive: true }).catch(() => {});
  }, []);
  return null;
}
