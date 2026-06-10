import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "멍BTI 행동학 테스트 | 펫푸드 주오",
  description:
    "우리 아이의 진짜 성향을 알아보고, 그에 딱 맞는 100% 프리미엄 수제 간식을 추천받아 보세요!",
};

export default function PetBtiPage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center p-8 text-center">
      <p className="text-charcoal/60">멍BTI 새 단장 중이에요 🐾</p>
    </main>
  );
}
