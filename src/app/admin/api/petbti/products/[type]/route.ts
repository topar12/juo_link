import { NextResponse } from "next/server";
import { upsertProduct } from "@/lib/petbtiDb";
import { validateProductInput } from "@/lib/petbtiProductValidation";
import { getDb } from "@/lib/d1";

export const dynamic = "force-dynamic";

// /admin 아래라 Cloudflare Access 로 보호됨. Next 16: params 는 Promise.

/** 수정 — typeCode 는 라우트 파라미터로 강제. 검증 실패 400. */
export async function PUT(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const v = validateProductInput({ ...(body as object), typeCode: type });
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  await upsertProduct(v.value);
  return NextResponse.json({ ok: true });
}

/** 삭제 — 해당 유형의 커스텀 추천을 지운다(이후 기본값으로 폴백). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  await getDb().prepare("DELETE FROM petbti_products WHERE type_code = ?").bind(type).run();
  return NextResponse.json({ ok: true });
}
