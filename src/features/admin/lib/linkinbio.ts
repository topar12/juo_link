import type { Ga4FilterExpression } from "./ga4";

export const LINKINBIO_BRANDS = [
  { id: "all", label: "전체" },
  { id: "petfoodjuo", label: "펫푸드주오" },
  { id: "lovejuo", label: "사랑해주오" },
] as const;

export function buildBrandFilter(brand: string | null): Ga4FilterExpression | null {
  if (!brand || brand === "all") return null;
  return {
    filter: {
      fieldName: "pagePath",
      stringFilter: { value: `/${brand}`, matchType: "EXACT" },
    },
  };
}

export function combineDimensionFilters(
  ...filters: (Ga4FilterExpression | null | undefined)[]
): Ga4FilterExpression | undefined {
  const valid = filters.filter((f): f is Ga4FilterExpression => f != null);
  if (valid.length === 0) return undefined;
  if (valid.length === 1) return valid[0];
  return { andGroup: { expressions: valid } };
}

export const LINKINBIO_CORE_EVENTS = [
  "official_mall_click",
  "product_click",
  "product_tab_change",
  "lovejuo_action_click",
  "meongbti_click",
  "social_click",
  "store_finder_open",
  "store_filter_select",
  "store_search",
  "store_select",
  "locate_me_click",
] as const;

export const LINKINBIO_ACTION_EVENT_LABELS: Record<string, string> = {
  official_mall_click: "공식몰 클릭",
  product_click: "상품 클릭",
  product_tab_change: "상품 탭 전환",
  lovejuo_action_click: "사랑해주오 액션",
  meongbti_click: "멍BTI 클릭",
  social_click: "소셜 클릭",
  store_finder_open: "매장찾기 열기",
  store_filter_select: "카테고리 필터",
  store_search: "매장 검색",
  store_select: "매장 선택",
  locate_me_click: "내 위치 클릭",
};

export const LINKINBIO_SETUP_HINT = [
  "GA4_LINKINBIO_PROPERTY_ID 환경변수",
  "GA4 서비스 계정 Viewer 권한",
  "customEvent:channel, customEvent:category, customEvent:store_name, customEvent:is_direct 커스텀 차원",
].join(" / ");

export function isMissingCustomDimensionError(error: unknown) {
  return error instanceof Error && /customEvent:|Unknown dimension|Did you mean/i.test(error.message);
}
