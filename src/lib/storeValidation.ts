import type { StoreCategory, StoreLocation } from "./stores";
import { STORE_CATEGORIES } from "./stores";

// write API 와 시드 무결성 테스트가 공유하는 순수 검증 모듈 (D1 의존 없음)

// 영문 슬러그: 소문자·숫자, 하이픈으로 구분 (예: "store-abc", "vet-clinic-1")
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// 한국 대략 위경도 범위 — 오타·잘못된 지오코딩 좌표를 거른다.
const LAT_MIN = 33;
const LAT_MAX = 39;
const LNG_MIN = 124;
const LNG_MAX = 132;

/** category 가 허용된 6종 enum 중 하나인지 */
export function isValidStoreCategory(value: unknown): value is StoreCategory {
  return typeof value === "string" && (STORE_CATEGORIES as string[]).includes(value);
}

/**
 * id 결정 규칙:
 * - providedId 가 있으면 그대로 (슬러그 검증은 호출부에서).
 * - 없으면 `store-<8 hex>` 유니크 id 생성 (매장 이름은 대부분 한글이라 안정적 슬러그가 어려움).
 */
export function generateStoreId(providedId?: string): string {
  const trimmedId = providedId?.trim();
  if (trimmedId) return trimmedId;
  return `store-${crypto.randomUUID().slice(0, 8)}`;
}

type ValidationResult =
  | { ok: true; value: StoreLocation }
  | { ok: false; error: string };

/**
 * 매장 입력을 검증·정규화해 StoreLocation 으로 반환한다.
 * 라우트(POST/PUT)와 시드 무결성 테스트가 함께 사용한다.
 */
export function validateStoreInput(input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "본문이 객체가 아니에요." };
  }
  const obj = input as Record<string, unknown>;

  // name — 필수, trim 후 비어있지 않음
  if (typeof obj.name !== "string" || obj.name.trim().length === 0) {
    return { ok: false, error: "name 은 필수예요." };
  }
  const name = obj.name.trim();

  // category — 필수, 허용된 6종
  if (!isValidStoreCategory(obj.category)) {
    return { ok: false, error: "category 는 병원/펫샵/미용/훈련/보호소/기타 중 하나여야 해요." };
  }
  const category = obj.category;

  // address — 필수, trim 후 비어있지 않음
  if (typeof obj.address !== "string" || obj.address.trim().length === 0) {
    return { ok: false, error: "address 는 필수예요." };
  }
  const address = obj.address.trim();

  // lat — 필수, 유한 숫자 + 한국 위도 범위
  if (typeof obj.lat !== "number" || !Number.isFinite(obj.lat)) {
    return { ok: false, error: "lat 은 숫자여야 해요." };
  }
  if (obj.lat < LAT_MIN || obj.lat > LAT_MAX) {
    return { ok: false, error: `lat 은 ${LAT_MIN}~${LAT_MAX} 범위여야 해요.` };
  }
  const lat = obj.lat;

  // lng — 필수, 유한 숫자 + 한국 경도 범위
  if (typeof obj.lng !== "number" || !Number.isFinite(obj.lng)) {
    return { ok: false, error: "lng 은 숫자여야 해요." };
  }
  if (obj.lng < LNG_MIN || obj.lng > LNG_MAX) {
    return { ok: false, error: `lng 은 ${LNG_MIN}~${LNG_MAX} 범위여야 해요.` };
  }
  const lng = obj.lng;

  // rawCategory — 선택, 비우면 category 로 기본
  let rawCategory = category as string;
  if (obj.rawCategory != null) {
    if (typeof obj.rawCategory !== "string") {
      return { ok: false, error: "rawCategory 는 문자열이어야 해요." };
    }
    const trimmed = obj.rawCategory.trim();
    if (trimmed.length > 0) rawCategory = trimmed;
  }

  // id — 있으면 슬러그 형식 검증, 없으면 생성
  let providedId: string | undefined;
  if (obj.id != null) {
    if (typeof obj.id !== "string") {
      return { ok: false, error: "id 는 문자열이어야 해요." };
    }
    const trimmed = obj.id.trim();
    if (trimmed.length > 0) {
      if (!SLUG_RE.test(trimmed)) {
        return { ok: false, error: "id 는 영문 소문자·숫자·하이픈 슬러그여야 해요." };
      }
      providedId = trimmed;
    }
  }
  const id = generateStoreId(providedId);

  const value: StoreLocation = { id, name, category, rawCategory, address, lat, lng };
  return { ok: true, value };
}
