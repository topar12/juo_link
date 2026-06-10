import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PET_TYPE_CODES, PET_TYPES, type PetTypeCode } from "@/features/petbti/data/types";
import ResultView from "@/features/petbti/components/ResultView";

// 16유형 결과 퍼머링크 — SSG(빌드타임 16종) + 유형별 OG. 그 외 타입은 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return PET_TYPE_CODES.map((type) => ({ type }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const meta = PET_TYPES[type as PetTypeCode];
  if (!meta) return {};
  const og = `/og/petbti/${meta.code}.png`;
  const title = `${meta.nickname} | 멍BTI`;
  const shareTitle = `우리 아이는 ${meta.nickname}`;
  return {
    title,
    description: meta.catchphrase,
    openGraph: {
      title: shareTitle,
      description: meta.catchphrase,
      images: [{ url: og, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description: meta.catchphrase,
      images: [og],
    },
  };
}

export default async function ResultPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const meta = PET_TYPES[type as PetTypeCode];
  if (!meta) notFound();
  return <ResultView meta={meta} />;
}
