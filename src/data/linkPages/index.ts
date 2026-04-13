import { loveJuoPage } from "./loveJuo";
import { petfoodJuoPage } from "./petfoodJuo";
import type { BrandSlug, LinkPageConfig } from "./types";

export const LINK_PAGE_ALIASES: Record<string, BrandSlug> = {
  petfoodjuo: "petfoodjuo",
  "petfood-juo": "petfoodjuo",
  lovejuo: "lovejuo",
};

export const LINK_PAGES: Record<BrandSlug, LinkPageConfig> = {
  petfoodjuo: petfoodJuoPage,
  lovejuo: loveJuoPage,
};

export const CANONICAL_BRAND_SLUGS = Object.keys(LINK_PAGES) as BrandSlug[];

export function resolveLinkPageSlug(slug: string) {
  return LINK_PAGE_ALIASES[slug] ?? null;
}

export function getLinkPage(slug: BrandSlug) {
  return LINK_PAGES[slug];
}
