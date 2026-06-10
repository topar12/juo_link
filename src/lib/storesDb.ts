import { getDb } from "./d1";
import type { StoreCategory, StoreLocation } from "./stores";

// D1 `stores` 테이블 접근 헬퍼. 응답은 항상 StoreLocation 형태로 복원한다.

/** id 중복으로 INSERT 실패 시 던지는 알려진 에러 (라우트에서 409/400 처리용) */
export class StoreIdConflictError extends Error {
  constructor(id: string) {
    super(`store id 중복: ${id}`);
    this.name = "StoreIdConflictError";
  }
}

// D1 row 그대로의 형태 (raw_category 는 null 가능)
type StoreRow = {
  id: string;
  name: string;
  category: string;
  raw_category: string | null;
  address: string;
  lat: number;
  lng: number;
  updated_at: number;
};

/** D1 row → StoreLocation (raw_category → rawCategory, null 이면 category 로 기본) */
function rowToStore(row: StoreRow): StoreLocation {
  const category = row.category as StoreCategory;
  return {
    id: row.id,
    name: row.name,
    category,
    // 공개 타입의 rawCategory 는 필수 문자열 — null 이면 category 로 폴백
    rawCategory: row.raw_category ?? category,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
  };
}

/** 전체 매장 목록 (정렬은 소비자가 재정렬하므로 여기선 무의미). */
export async function getAllStores(): Promise<StoreLocation[]> {
  const { results } = await getDb()
    .prepare("SELECT * FROM stores")
    .all<StoreRow>();
  return results.map(rowToStore);
}

/** id 존재 여부 */
export async function storeExists(id: string): Promise<boolean> {
  const row = await getDb()
    .prepare("SELECT 1 FROM stores WHERE id = ?")
    .bind(id)
    .first<{ 1: number }>();
  return row != null;
}

/** 신규 1건 생성. id 가 이미 있으면 StoreIdConflictError 를 던진다. */
export async function createStore(store: StoreLocation): Promise<void> {
  if (await storeExists(store.id)) {
    throw new StoreIdConflictError(store.id);
  }
  await getDb()
    .prepare(
      `INSERT INTO stores (id, name, category, raw_category, address, lat, lng, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      store.id,
      store.name,
      store.category,
      store.rawCategory ?? null,
      store.address,
      store.lat,
      store.lng,
      Date.now()
    )
    .run();
}

/** id 로 수정. 실제로 바뀐 행이 있으면 true. */
export async function updateStore(
  id: string,
  store: StoreLocation
): Promise<boolean> {
  // UPDATE 영향 행 수는 D1 결과 메타에서 직접 못 읽으므로 존재 여부로 판정한다.
  if (!(await storeExists(id))) return false;
  await getDb()
    .prepare(
      `UPDATE stores
       SET name = ?, category = ?, raw_category = ?, address = ?, lat = ?, lng = ?, updated_at = ?
       WHERE id = ?`
    )
    .bind(
      store.name,
      store.category,
      store.rawCategory ?? null,
      store.address,
      store.lat,
      store.lng,
      Date.now(),
      id
    )
    .run();
  return true;
}

/** id 로 삭제. 행이 있었으면 true. */
export async function deleteStore(id: string): Promise<boolean> {
  if (!(await storeExists(id))) return false;
  await getDb().prepare("DELETE FROM stores WHERE id = ?").bind(id).run();
  return true;
}
