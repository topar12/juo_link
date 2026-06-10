import { getDb } from "./d1";
import { PET_TYPE_CODES, PET_TYPES, type PetTypeCode } from "@/features/petbti/data/types";

// D1 멍BTI 접근 헬퍼 (foodsDb 패턴 미러). 집계·응답·추천제품 3테이블을 다룬다.

export interface PetbtiProduct {
  typeCode: PetTypeCode;
  productName: string;
  imageUrl?: string;
  reason?: string;
  shopUrl?: string;
}

export type StatsMap = Record<string, number> & { total: number };

/** 유형별 카운트 + total. 실패는 호출부(라우트)에서 처리. */
export async function getStats(): Promise<StatsMap> {
  const { results } = await getDb()
    .prepare("SELECT type_code, count FROM petbti_stats")
    .all<{ type_code: string; count: number }>();
  const map = {} as StatsMap;
  let total = 0;
  for (const r of results) {
    map[r.type_code] = r.count;
    total += r.count;
  }
  map.total = total;
  return map;
}

/** 결과 1건 기록: 카운터 +1 + 응답 raw INSERT (batch). */
export async function recordResult(typeCode: PetTypeCode, answers: string): Promise<void> {
  const db = getDb();
  await db
    .prepare(
      `INSERT INTO petbti_stats (type_code, count) VALUES (?, 1)
       ON CONFLICT(type_code) DO UPDATE SET count = count + 1`
    )
    .bind(typeCode)
    .run();
  await db
    .prepare(
      `INSERT INTO petbti_responses (id, result_type, answers, created_at) VALUES (?, ?, ?, ?)`
    )
    .bind(crypto.randomUUID(), typeCode, answers, Date.now())
    .run();
}

type ProductRow = {
  type_code: string;
  product_name: string;
  image_url: string | null;
  reason: string | null;
  shop_url: string | null;
};

function rowToProduct(r: ProductRow): PetbtiProduct {
  const p: PetbtiProduct = { typeCode: r.type_code as PetTypeCode, productName: r.product_name };
  if (r.image_url != null) p.imageUrl = r.image_url;
  if (r.reason != null) p.reason = r.reason;
  if (r.shop_url != null) p.shopUrl = r.shop_url;
  return p;
}

/** 전체 추천제품. 미설정 유형은 types.ts 기본값으로 폴백 채움(항상 16개 보장). */
export async function getAllProducts(): Promise<PetbtiProduct[]> {
  const { results } = await getDb().prepare("SELECT * FROM petbti_products").all<ProductRow>();
  const byCode = new Map(results.map((r) => [r.type_code, rowToProduct(r)]));
  return PET_TYPE_CODES.map(
    (code) =>
      byCode.get(code) ?? { typeCode: code, productName: PET_TYPES[code].recommendedProduct }
  );
}

/** 추천제품 1건 upsert (type_code 기준). */
export async function upsertProduct(p: PetbtiProduct): Promise<void> {
  await getDb()
    .prepare(
      `INSERT INTO petbti_products (type_code, product_name, image_url, reason, shop_url, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(type_code) DO UPDATE SET
         product_name=excluded.product_name, image_url=excluded.image_url,
         reason=excluded.reason, shop_url=excluded.shop_url, updated_at=excluded.updated_at`
    )
    .bind(p.typeCode, p.productName, p.imageUrl ?? null, p.reason ?? null, p.shopUrl ?? null, Date.now())
    .run();
}

/** 문항별 분포: answers 12자 문자열에서 위치별 pole 집계. */
export async function getAnswerDistribution(
  sinceMs: number
): Promise<Record<number, Record<string, number>>> {
  const { results } = await getDb()
    .prepare("SELECT answers FROM petbti_responses WHERE created_at >= ?")
    .bind(sinceMs)
    .all<{ answers: string }>();
  const dist: Record<number, Record<string, number>> = {};
  for (const { answers } of results) {
    for (let i = 0; i < answers.length; i++) {
      (dist[i] ??= {})[answers[i]] = (dist[i][answers[i]] ?? 0) + 1;
    }
  }
  return dist;
}
