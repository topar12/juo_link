import { NextResponse } from "next/server";
import { getAnswerDistribution } from "@/lib/petbtiDb";

export const dynamic = "force-dynamic";

// /admin 아래라 Cloudflare Access 로 보호됨.

/** 문항별 응답 분포. ?days=N (기본 30) 기간 내 응답을 위치별 pole 로 집계. */
export async function GET(req: Request) {
  const days = Number(new URL(req.url).searchParams.get("days") ?? "30");
  const since = Date.now() - Math.max(1, days) * 86_400_000;
  try {
    return NextResponse.json(await getAnswerDistribution(since), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("answers dist failed:", e);
    return NextResponse.json({ error: "unavailable" }, { status: 500 });
  }
}
