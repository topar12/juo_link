import { getDb } from "./d1";
import type { FoodSafetyItem, FoodVerdict } from "./foodSafety";

// D1 `foods` 테이블 접근 헬퍼. 응답은 항상 FoodSafetyItem 형태로 복원한다.

/** id 중복으로 INSERT 실패 시 던지는 알려진 에러 (라우트에서 409/400 처리용) */
export class FoodIdConflictError extends Error {
  constructor(id: string) {
    super(`food id 중복: ${id}`);
    this.name = "FoodIdConflictError";
  }
}

// D1 row 그대로의 형태 (aliases 는 JSON 문자열, emoji/note 는 null 가능)
type FoodRow = {
  id: string;
  name: string;
  aliases: string;
  emoji: string | null;
  verdict: string;
  reason: string;
  note: string | null;
  updated_at: number;
};

/** D1 row → FoodSafetyItem (aliases 파싱, null emoji/note 생략) */
function rowToItem(row: FoodRow): FoodSafetyItem {
  let aliases: string[] = [];
  try {
    const parsed = JSON.parse(row.aliases);
    if (Array.isArray(parsed)) {
      aliases = parsed.filter((a): a is string => typeof a === "string");
    }
  } catch {
    // 손상된 JSON 은 빈 배열로 (검색기가 빈 화면이 되지 않도록)
    aliases = [];
  }

  const item: FoodSafetyItem = {
    id: row.id,
    name: row.name,
    aliases,
    verdict: row.verdict as FoodVerdict,
    reason: row.reason,
  };
  if (row.emoji != null) item.emoji = row.emoji;
  if (row.note != null) item.note = row.note;
  return item;
}

/** 전체 음식 목록 (정렬은 소비자가 searchFoods 로 재정렬하므로 여기선 무의미). */
export async function getAllFoods(): Promise<FoodSafetyItem[]> {
  const { results } = await getDb()
    .prepare("SELECT * FROM foods")
    .all<FoodRow>();
  return results.map(rowToItem);
}

/** id 존재 여부 */
export async function foodExists(id: string): Promise<boolean> {
  const row = await getDb()
    .prepare("SELECT 1 FROM foods WHERE id = ?")
    .bind(id)
    .first<{ 1: number }>();
  return row != null;
}

/** 신규 1건 생성. id 가 이미 있으면 FoodIdConflictError 를 던진다. */
export async function createFood(item: FoodSafetyItem): Promise<void> {
  if (await foodExists(item.id)) {
    throw new FoodIdConflictError(item.id);
  }
  await getDb()
    .prepare(
      `INSERT INTO foods (id, name, aliases, emoji, verdict, reason, note, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      item.id,
      item.name,
      JSON.stringify(item.aliases),
      item.emoji ?? null,
      item.verdict,
      item.reason,
      item.note ?? null,
      Date.now()
    )
    .run();
}

/** id 로 수정. 실제로 바뀐 행이 있으면 true. */
export async function updateFood(
  id: string,
  item: FoodSafetyItem
): Promise<boolean> {
  // UPDATE 영향 행 수는 D1 결과 메타에서 직접 못 읽으므로 존재 여부로 판정한다.
  if (!(await foodExists(id))) return false;
  await getDb()
    .prepare(
      `UPDATE foods
       SET name = ?, aliases = ?, emoji = ?, verdict = ?, reason = ?, note = ?, updated_at = ?
       WHERE id = ?`
    )
    .bind(
      item.name,
      JSON.stringify(item.aliases),
      item.emoji ?? null,
      item.verdict,
      item.reason,
      item.note ?? null,
      Date.now(),
      id
    )
    .run();
  return true;
}

/** id 로 삭제. 행이 있었으면 true. */
export async function deleteFood(id: string): Promise<boolean> {
  if (!(await foodExists(id))) return false;
  await getDb().prepare("DELETE FROM foods WHERE id = ?").bind(id).run();
  return true;
}
