import type { Metadata } from "next";
import { Suspense } from "react";
import PetBtiApp from "@/features/petbti/PetBtiApp";

export const metadata: Metadata = {
  title: "멍-BTI 행동학 테스트 | 펫푸드 주오",
  description:
    "우리 아이의 진짜 성향을 알아보고, 그에 딱 맞는 100% 프리미엄 수제 간식을 추천받아 보세요!",
};

export default function PetBtiPage() {
  return (
    <Suspense fallback={null}>
      <PetBtiApp />
    </Suspense>
  );
}
