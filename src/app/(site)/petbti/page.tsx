import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LEGACY_RESULT_MAP } from "./legacyRedirect";
import QuizClient from "./quiz/QuizClient";

export const metadata: Metadata = {
  title: "멍BTI 행동학 테스트 | 펫푸드 주오",
  description:
    "12개의 질문으로 우리 아이의 4가지 성향을 알아보고, 딱 맞는 100% 수제 간식을 추천받아 보세요!",
  openGraph: {
    title: "우리 아이의 진짜 성향은? | 멍BTI",
    description: "12개의 질문으로 알아보는 우리 아이 4축 성향 + 맞춤 간식 추천",
    type: "website",
  },
};

// 멍BTI 진입점 — 구 공유 링크(?r=result1..8)는 가장 근접한 신 유형으로 301 후,
// 그 외엔 QuizClient(인트로→문항→채점→결과 push)를 렌더한다.
export default async function PetBtiPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string | string[] }>;
}) {
  const sp = await searchParams;
  const r = Array.isArray(sp?.r) ? sp.r[0] : sp?.r;
  if (r && LEGACY_RESULT_MAP[r]) {
    redirect(`/petbti/result/${LEGACY_RESULT_MAP[r]}`);
  }
  return <QuizClient />;
}
