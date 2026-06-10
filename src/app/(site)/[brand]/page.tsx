import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import LinkInBioPage from "@/features/linkinbio/LinkInBioPage";
import {
  CANONICAL_BRAND_SLUGS,
  getLinkPage,
  resolveLinkPageSlug,
} from "@/data/linkPages";

type BrandPageProps = {
  params: Promise<{
    brand: string;
  }>;
};

export function generateStaticParams() {
  return CANONICAL_BRAND_SLUGS.map((brand) => ({ brand }));
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { brand } = await params;
  const resolvedSlug = resolveLinkPageSlug(brand);

  if (!resolvedSlug) {
    return {
      title: "주오 링크인바이오",
    };
  }

  const page = getLinkPage(resolvedSlug);

  return {
    title: page.metadata.title,
    description: page.metadata.description,
    alternates: {
      canonical: `/${resolvedSlug}`,
    },
    openGraph: {
      title: page.metadata.title,
      description: page.metadata.description,
      type: "website",
    },
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { brand } = await params;
  const resolvedSlug = resolveLinkPageSlug(brand);

  if (!resolvedSlug) {
    notFound();
  }

  if (resolvedSlug !== brand) {
    redirect(`/${resolvedSlug}`);
  }

  return <LinkInBioPage config={getLinkPage(resolvedSlug)} />;
}
