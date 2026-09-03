"use client";

import { useEffect } from "react";

/** Ushbu sahifa har doim qorong'i (landing / login / register). */
export function ForceDark() {
  useEffect(() => {
    document.documentElement.classList.remove("light");
    return () => {
      try {
        if (localStorage.getItem("tyr_theme") === "light") {
          document.documentElement.classList.add("light");
        }
      } catch {
        /* ignore */
      }
    };
  }, []);
  return null;
}
