import { NextResponse } from "next/server";
import { updateFood, deleteFood, foodExists } from "@/lib/foodsDb";
import { validateFoodInput } from "@/lib/foodValidation";

export const dynamic = "force-dynamic";

// /admin 아래라 Cloudflare Access 로 보호됨. Next 16: params 는 Promise.

/** 수정 — id 는 라우트 파라미터로 강제. 없으면 404. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON 본문을 읽지 못했어요." }, { status: 400 });
  }

  // 본문의 id 가 무엇이든 라우트 id 로 고정해 검증한다.
  const merged =
    typeof body === "object" && body !== null
      ? { ...(body as Record<string, unknown>), id }
      : body;
  const result = validateFoodInput(merged);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  try {
    if (!(await foodExists(id))) {
      return NextResponse.json({ ok: false, error: "없는 항목이에요." }, { status: 404 });
    }
    await updateFood(id, result.value);
    return NextResponse.json({ ok: true, item: result.value });
  } catch (error) {
    console.error("admin foods update failed:", error);
    return NextResponse.json({ ok: false, error: "수정에 실패했어요." }, { status: 500 });
  }
}

/** 삭제 — 없으면 404. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const existed = await deleteFood(id);
    if (!existed) {
      return NextResponse.json({ ok: false, error: "없는 항목이에요." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin foods delete failed:", error);
    return NextResponse.json({ ok: false, error: "삭제에 실패했어요." }, { status: 500 });
  }
}
