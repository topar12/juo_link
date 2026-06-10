import { NextResponse } from "next/server";
import { getAllProducts, upsertProduct } from "@/lib/petbtiDb";
import { validateProductInput } from "@/lib/petbtiProductValidation";

export const dynamic = "force-dynamic";

// /admin 아래라 Cloudflare Access 로 보호됨 (게이팅은 인프라 레벨).

/** 관리 표용 전체 목록 — 캐시 없이 항상 최신(16개, 폴백 포함). */
export async function GET() {
  const items = await getAllProducts();
  return NextResponse.json(items, { headers: { "Cache-Control": "no-store" } });
}

/** 추천제품 upsert. 검증 실패 400, 성공 201. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const v = validateProductInput(body);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  await upsertProduct(v.value);
  return NextResponse.json({ ok: true }, { status: 201 });
}
