import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/petbtiDb";

export const dynamic = "force-dynamic";

/**
 * 공개 읽기 — 유형별 추천제품 전체(항상 16개, 미설정은 types.ts 기본값 폴백).
 * 엣지 캐시(s-maxage 60s). D1 실패 시 500 → 클라이언트는 types 기본값으로 폴백.
 */
export async function GET() {
  try {
    return NextResponse.json(await getAllProducts(), {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (e) {
    console.error("petbti products failed:", e);
    return NextResponse.json({ error: "unavailable" }, { status: 500 });
  }
}
