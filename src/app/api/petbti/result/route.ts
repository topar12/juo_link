import { NextResponse } from "next/server";
import { getDb } from "@/lib/d1";

export const dynamic = "force-dynamic";

const VALID_TYPES = new Set([
  "EGA",
  "EGI",
  "EPI",
  "EPA",
  "CGA",
  "CGI",
  "CPA",
  "CPI",
]);

/** 멍BTI 결과 유형 카운트를 1 증가시킨다. */
export async function POST(request: Request) {
  let typeCode: unknown;
  try {
    ({ typeCode } = (await request.json()) as { typeCode?: unknown });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  if (typeof typeCode !== "string" || !VALID_TYPES.has(typeCode)) {
    return NextResponse.json({ ok: false, error: "invalid typeCode" }, { status: 400 });
  }

  try {
    await getDb()
      .prepare(
        "INSERT INTO petbti_stats (type_code, count) VALUES (?, 1) " +
          "ON CONFLICT(type_code) DO UPDATE SET count = count + 1",
      )
      .bind(typeCode)
      .run();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("petbti result increment failed:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
