import { NextResponse } from "next/server";
import { getDb } from "@/lib/d1";

export const dynamic = "force-dynamic";

/** 유형별 집계 + total 을 반환한다. 형태: { EGA: n, ..., total: n } */
export async function GET() {
  try {
    const { results } = await getDb()
      .prepare("SELECT type_code, count FROM petbti_stats")
      .all<{ type_code: string; count: number }>();

    const stats: Record<string, number> = {};
    let total = 0;
    for (const row of results) {
      stats[row.type_code] = row.count;
      total += row.count;
    }
    stats.total = total;
    return NextResponse.json(stats);
  } catch (error) {
    console.error("petbti stats fetch failed:", error);
    // 실패해도 앱은 계속 동작(배지만 숨김)
    return NextResponse.json(null);
  }
}
