import { NextResponse } from "next/server";
import { getStats } from "@/lib/petbtiDb";

export const dynamic = "force-dynamic";

/**
 * 공개 읽기 — 유형별 집계 + total. 형태: { ESBG: n, ..., total: n }.
 * 엣지 캐시(s-maxage 60s)로 빠르게 제공.
 * 실패 시 200 + null → 희귀도 배지만 숨기고 앱은 계속 동작(무해).
 */
export async function GET() {
  try {
    return NextResponse.json(await getStats(), {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (e) {
    console.error("petbti stats failed:", e);
    return NextResponse.json(null);
  }
}
