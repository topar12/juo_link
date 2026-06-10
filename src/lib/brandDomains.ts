import type { BrandSlug } from "@/data/linkPages/types";

/**
 * 브랜드별 커스텀 (서브)도메인 → 브랜드 slug 매핑.
 *
 * HTTP Host 헤더는 항상 punycode(ASCII) 형태로 도착하므로 키는 punycode를 기준으로 둔다.
 * 혹시 모를 환경(유니코드 Host)을 대비해 한글 표기도 함께 등록한다.
 *
 *   펫푸드.주오.info → xn--hy1b679cura.xn--vk5b15c.info
 *   사랑해.주오.info → xn--9i2br6obor.xn--vk5b15c.info
 */
export const BRAND_DOMAIN_TO_SLUG: Record<string, BrandSlug> = {
  // punycode (실제 Host 헤더 형태)
  "xn--hy1b679cura.xn--vk5b15c.info": "petfoodjuo",
  "xn--9i2br6obor.xn--vk5b15c.info": "lovejuo",
  // unicode (방어적 fallback)
  "펫푸드.주오.info": "petfoodjuo",
  "사랑해.주오.info": "lovejuo",
};

/**
 * 브랜드 slug → 호스트 목록(역방향 매핑). BRAND_DOMAIN_TO_SLUG 에서 파생하므로
 * 도메인 목록의 단일 출처(single source of truth)는 위 매핑 하나뿐이다.
 *
 * punycode 항목이 먼저 오도록 삽입 순서를 유지한다(GA4 hostName이 punycode로
 * 기록될 가능성이 높기 때문).
 *
 *   petfoodjuo → ["xn--hy1b679cura.xn--vk5b15c.info", "펫푸드.주오.info"]
 */
export const BRAND_SLUG_TO_DOMAINS: Record<BrandSlug, string[]> = Object.entries(
  BRAND_DOMAIN_TO_SLUG
).reduce(
  (acc, [domain, slug]) => {
    (acc[slug] ??= []).push(domain);
    return acc;
  },
  {} as Record<BrandSlug, string[]>
);

/**
 * Host 헤더 값에서 브랜드 slug를 찾는다.
 * 포트(:443)·대소문자·앞뒤 공백을 정규화하고, 매핑이 없으면 null을 반환한다.
 *
 * @example
 *   resolveBrandFromHost("xn--hy1b679cura.xn--vk5b15c.info") // "petfoodjuo"
 *   resolveBrandFromHost("juolinkinbio.ttoparr12.workers.dev") // null
 */
export function resolveBrandFromHost(host: string | null | undefined): BrandSlug | null {
  if (!host) {
    return null;
  }
  const normalized = host.trim().toLowerCase().split(":")[0];
  return BRAND_DOMAIN_TO_SLUG[normalized] ?? null;
}

/**
 * 브랜드 slug에 매핑된 호스트 목록을 돌려준다. 매핑이 없으면 빈 배열.
 * 임의의 문자열(예: "all", 알 수 없는 brand)에도 안전하다.
 *
 * @example
 *   getBrandHosts("petfoodjuo") // ["xn--hy1b679cura.xn--vk5b15c.info", "펫푸드.주오.info"]
 *   getBrandHosts("all")        // []
 */
export function getBrandHosts(brand: string): string[] {
  return BRAND_SLUG_TO_DOMAINS[brand as BrandSlug] ?? [];
}
