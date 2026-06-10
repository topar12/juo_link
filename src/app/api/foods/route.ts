import { NextResponse } from "next/server";
import { getAllFoods } from "@/lib/foodsDb";

export const dynamic = "force-dynamic";

/**
 * 공개 읽기 — 음식 데이터 전체를 FoodSafetyItem[] 로 반환.
 * 엣지 캐시(s-maxage 60s)로 편집이 ~1분 내 반영되면서 빠르게 제공된다.
 * D1 실패 시 500 → 공개 클라이언트(FoodCheckSheet)는 번들된 JSON 으로 폴백한다.
 */
export async function GET() {
  try {
    const foods = await getAllFoods();
    return NextResponse.json(foods, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("foods fetch failed:", error);
    // 빈 배열 대신 500 — 클라이언트가 번들 사본으로 폴백하도록 (건강 안전 데이터)
    return NextResponse.json({ error: "foods unavailable" }, { status: 500 });
  }
}
