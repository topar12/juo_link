import { NextResponse } from "next/server";
import { recordResult } from "@/lib/petbtiDb";
import { PET_TYPE_CODES, type PetTypeCode } from "@/features/petbti/data/types";

export const dynamic = "force-dynamic";

/**
 * 멍BTI 결과 1건 기록: 카운터 +1 + 원시 응답 INSERT.
 * 본문: { typeCode: 16유형, answers?: 12자 [ECSRBTGP] }.
 * answers 가 규격을 벗어나면 "" 로 저장(카운트는 유지).
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  if (typeof o?.typeCode !== "string" || !(PET_TYPE_CODES as readonly string[]).includes(o.typeCode)) {
    return NextResponse.json({ ok: false, error: "invalid typeCode" }, { status: 400 });
  }
  const answers =
    typeof o.answers === "string" && /^[ECSRBTGP]{12}$/.test(o.answers) ? o.answers : "";
  try {
    await recordResult(o.typeCode as PetTypeCode, answers);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("petbti result failed:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
