export type FoodVerdict = "danger" | "caution" | "safe";

export type FoodSafetyItem = {
  id: string;
  name: string;
  aliases: string[];
  emoji?: string;
  verdict: FoodVerdict;
  reason: string;
  note?: string;
};

type VerdictMeta = {
  label: string;
  emoji: string;
  badgeClassName: string;
  pillClassName: string;
  cardBorderClassName: string;
};

export const VERDICT_META: Record<FoodVerdict, VerdictMeta> = {
  danger: {
    label: "안 돼요",
    emoji: "🔴",
    badgeClassName: "bg-brand-coral-50 text-brand-coral-600",
    pillClassName: "bg-brand-coral-100 text-brand-coral-700",
    cardBorderClassName: "border-brand-coral-200",
  },
  caution: {
    label: "조심해요",
    emoji: "🟡",
    badgeClassName: "bg-amber-50 text-amber-600",
    pillClassName: "bg-amber-100 text-amber-700",
    cardBorderClassName: "border-amber-200",
  },
  safe: {
    label: "먹어도 돼요",
    emoji: "🟢",
    badgeClassName: "bg-emerald-50 text-emerald-600",
    pillClassName: "bg-emerald-100 text-emerald-700",
    cardBorderClassName: "border-emerald-200",
  },
};

// 칩/정렬 순서 — 위험한 것부터
export const VERDICT_FILTER_ORDER: FoodVerdict[] = ["danger", "caution", "safe"];

const VERDICT_SORT_RANK: Record<FoodVerdict, number> = {
  danger: 0,
  caution: 1,
  safe: 2,
};

export function searchFoods(
  items: FoodSafetyItem[],
  query: string,
  verdict: FoodVerdict | "all"
): FoodSafetyItem[] {
  const normalized = query.trim().toLowerCase();
  return items
    .filter((item) => {
      if (verdict !== "all" && item.verdict !== verdict) return false;
      if (normalized.length === 0) return true;
      return [item.name, ...item.aliases].some((token) =>
        token.toLowerCase().includes(normalized)
      );
    })
    .sort((a, b) => {
      if (a.verdict !== b.verdict) {
        return VERDICT_SORT_RANK[a.verdict] - VERDICT_SORT_RANK[b.verdict];
      }
      return a.name.localeCompare(b.name, "ko");
    });
}
