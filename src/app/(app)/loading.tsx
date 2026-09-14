import { SBar, SBlock, SWrap } from "@/components/skeleton";

/**
 * Zaxira (fallback) — har bir sahifa o'zining aniqroq loading.tsx
 * faylini beradi, bu faqat ulardan birortasi bo'lmagan holat uchun.
 */
export default function AppLoading() {
  return (
    <SWrap>
      <SBar className="h-7 w-48" />
      <SBlock className="h-24" />
      <div className="flex flex-col gap-2">
        <SBlock className="h-20" />
        <SBlock className="h-20" />
        <SBlock className="h-20" />
      </div>
    </SWrap>
  );
}
