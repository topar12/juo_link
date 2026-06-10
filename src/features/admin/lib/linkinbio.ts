import { getBrandHosts } from "@/lib/brandDomains";
import type { Ga4FilterExpression } from "./ga4";

export const LINKINBIO_BRANDS = [
  { id: "all", label: "전체" },
  { id: "petfoodjuo", label: "펫푸드주오" },
  { id: "lovejuo", label: "사랑해주오" },
] as const;

/**
 * 브랜드별 GA4 dimension 필터.
 *
 * 브랜드는 서브도메인(예: 펫푸드.주오.info)으로 서빙된다. middleware가 서브도메인 루트를
 * 내부적으로 /<brand>로 rewrite하지만 주소창 경로(=GA4 pagePath)는 "/" 그대로이므로,
 * 서브도메인 방문자는 hostName으로 잡아야 한다. pagePath=/<brand> 만으로 필터하면 누락된다.
 *
 * 과거 경로 방식(예: *.workers.dev/<brand> 직접 접근) 트래픽도 잃지 않도록 pagePath EXACT
 * 매칭을 OR로 함께 둔다. (한 row는 hostName·pagePath 조합이 하나이므로 OR로 중복 집계되지 않음)
 *
 * NOTE: GA4 hostName이 punycode/unicode 중 무엇으로 기록되는지는 배포 후 라이브 데이터로
 * 재확인 필요 — 안전하게 두 형태를 모두 inList에 넣는다(getBrandHosts).
 */
export function buildBrandFilter(brand: string | null): Ga4FilterExpression | null {
  if (!brand || brand === "all") return null;

  const pagePathFilter: Ga4FilterExpression = {
    filter: {
      fieldName: "pagePath",
      stringFilter: { value: `/${brand}`, matchType: "EXACT" },
    },
  };

  const hosts = getBrandHosts(brand);
  if (hosts.length === 0) {
    // 서브도메인 매핑이 없는 브랜드 — 기존 경로 매칭만 유지(방어적).
    return pagePathFilter;
  }

  return {
    orGroup: {
      expressions: [
        { filter: { fieldName: "hostName", inListFilter: { values: hosts } } },
        pagePathFilter,
      ],
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
