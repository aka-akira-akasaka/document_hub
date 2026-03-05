import { useDealStore } from "@/stores/deal-store";

/** 指定案件が閲覧専用（viewer権限の共有案件）かどうかを返す */
export function useIsReadOnly(dealId: string): boolean {
  const deal = useDealStore((s) => s.deals.find((d) => d.id === dealId));
  return deal?.shareRole === "viewer";
}

/** 指定案件のオーナーかどうかを返す */
export function useIsOwner(dealId: string): boolean {
  const deal = useDealStore((s) => s.deals.find((d) => d.id === dealId));
  return !deal?.shareRole;
}
