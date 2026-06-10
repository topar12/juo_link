import type { FoodSafetyItem, FoodVerdict } from "./foodSafety";

// write API 와 데이터 무결성 테스트가 공유하는 순수 검증 모듈 (D1 의존 없음)

const VALID_VERDICTS: FoodVerdict[] = ["danger", "caution", "safe"];

// 영문 슬러그: 소문자·숫자, 하이픈으로 구분 (예: "chocolate", "raw-chicken-bones")
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** verdict 가 허용된 세 값 중 하나인지 */
export function isValidVerdict(value: unknown): value is FoodVerdict {
  return typeof value === "string" && (VALID_VERDICTS as string[]).includes(value);
}

/** ASCII(영문/숫자/공백/하이픈)로만 된 이름인지 — 슬러그화 가능 여부 판단용 */
function isAsciiSluggable(name: string): boolean {
  return /^[\x00-\x7F]+$/.test(name) && /[a-z0-9]/i.test(name);
}

/** 영문 이름을 슬러그로 변환 ("Sweet Potato" → "sweet-potato") */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // 영숫자 외 → 하이픈
    .replace(/^-+|-+$/g, ""); // 양끝 하이픈 제거
}

/**
 * id 결정 규칙:
 * - providedId 가 있으면 그대로 (검증은 호출부에서).
 * - 없으면 ASCII 이름은 slugify, 그 외(한글 등)는 `food-<8 hex>` 생성.
 */
export function slugifyOrGenerate(name: string, providedId?: string): string {
  const trimmedId = providedId?.trim();
  if (trimmedId) return trimmedId;

  if (isAsciiSluggable(name)) {
    const slug = slugify(name);
    if (slug.length > 0) return slug;
  }
  // 한글 등 비ASCII 이름은 안정적 슬러그가 어려워 유니크 id 생성
  return `food-${crypto.randomUUID().slice(0, 8)}`;
}

/** aliases 정규화: 문자열 배열만, 각 trim·빈값 제거·중복 제거 */
function normalizeAliases(input: unknown): string[] | null {
  if (input == null) return []; // 누락 허용 → []
  if (!Array.isArray(input)) return null;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    if (typeof raw !== "string") return null;
    const trimmed = raw.trim();
    if (trimmed.length === 0) continue; // 빈값 제거
    if (seen.has(trimmed)) continue; // 중복 제거
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

type ValidationResult =
  | { ok: true; value: FoodSafetyItem }
  | { ok: false; error: string };

/**
 * 음식 입력을 검증·정규화해 FoodSafetyItem 으로 반환한다.
 * 라우트(POST/PUT)와 시드 무결성 테스트가 함께 사용한다.
 */
export function validateFoodInput(input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "본문이 객체가 아니에요." };
  }
  const obj = input as Record<string, unknown>;

  // verdict — 필수, 허용된 세 값
  if (!isValidVerdict(obj.verdict)) {
    return { ok: false, error: "verdict 는 danger / caution / safe 중 하나여야 해요." };
  }
  const verdict = obj.verdict;

  // name — 필수, trim 후 비어있지 않음
  if (typeof obj.name !== "string" || obj.name.trim().length === 0) {
    return { ok: false, error: "name 은 필수예요." };
  }
  const name = obj.name.trim();

  // reason — 필수, trim 후 비어있지 않음
  if (typeof obj.reason !== "string" || obj.reason.trim().length === 0) {
    return { ok: false, error: "reason 은 필수예요." };
  }
  const reason = obj.reason.trim();

  // aliases — 문자열 배열 (누락 허용)
  const aliases = normalizeAliases(obj.aliases);
  if (aliases === null) {
    return { ok: false, error: "aliases 는 문자열 배열이어야 해요." };
  }

  // emoji — 선택, trim 후 빈값이면 생략
  let emoji: string | undefined;
  if (obj.emoji != null) {
    if (typeof obj.emoji !== "string") {
      return { ok: false, error: "emoji 는 문자열이어야 해요." };
    }
    const trimmed = obj.emoji.trim();
    if (trimmed.length > 0) emoji = trimmed;
  }

  // note — 선택, trim 후 빈값이면 생략
  let note: string | undefined;
  if (obj.note != null) {
    if (typeof obj.note !== "string") {
      return { ok: false, error: "note 는 문자열이어야 해요." };
    }
    const trimmed = obj.note.trim();
    if (trimmed.length > 0) note = trimmed;
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
  const id = slugifyOrGenerate(name, providedId);

  // FoodSafetyItem 형태로 복원 (선택 필드는 값이 있을 때만 포함)
  const value: FoodSafetyItem = { id, name, aliases, verdict, reason };
  if (emoji !== undefined) value.emoji = emoji;
  if (note !== undefined) value.note = note;

  return { ok: true, value };
}
