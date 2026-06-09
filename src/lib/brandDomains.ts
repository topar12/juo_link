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
