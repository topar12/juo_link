import { NextResponse } from "next/server";
import { getAllFoods, createFood, FoodIdConflictError } from "@/lib/foodsDb";
import { validateFoodInput } from "@/lib/foodValidation";

export const dynamic = "force-dynamic";

// /admin 아래라 Cloudflare Access 로 보호됨 (게이팅은 인프라 레벨).

/** 관리 표용 전체 목록 — 캐시 없이 항상 최신. */
export async function GET() {
  try {
    const foods = await getAllFoods();
    return NextResponse.json(foods, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("admin foods list failed:", error);
    return NextResponse.json({ ok: false, error: "목록을 불러오지 못했어요." }, { status: 500 });
  }
}

/** 신규 1건 생성. 검증 실패 400, id 중복 409. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON 본문을 읽지 못했어요." }, { status: 400 });
  }

  const result = validateFoodInput(body);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  try {
    await createFood(result.value);
    return NextResponse.json({ ok: true, item: result.value }, { status: 201 });
  } catch (error) {
    if (error instanceof FoodIdConflictError) {
      return NextResponse.json({ ok: false, error: "id 중복" }, { status: 409 });
    }
    console.error("admin foods create failed:", error);
    return NextResponse.json({ ok: false, error: "생성에 실패했어요." }, { status: 500 });
  }
}
