import { PET_TYPE_CODES, type PetTypeCode } from "@/features/petbti/data/types";
import type { PetbtiProduct } from "./petbtiDb";

// write API(admin POST/PUT)와 무결성 테스트가 공유하는 순수 검증 모듈 (D1 의존 없음).

type Result = { ok: true; value: PetbtiProduct } | { ok: false; error: string };

/**
 * 추천제품 입력을 검증·정규화해 PetbtiProduct 로 반환한다.
 * - typeCode: 16유형 코드 중 하나(필수)
 * - productName: trim 후 비어있지 않음(필수)
 * - imageUrl/reason/shopUrl: 선택, trim 후 빈값이면 생략
 */
export function validateProductInput(input: unknown): Result {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "본문이 객체가 아니에요." };
  }
  const o = input as Record<string, unknown>;

  if (typeof o.typeCode !== "string" || !(PET_TYPE_CODES as readonly string[]).includes(o.typeCode)) {
    return { ok: false, error: "typeCode 가 16유형 중 하나가 아니에요." };
  }
  if (typeof o.productName !== "string" || o.productName.trim().length === 0) {
    return { ok: false, error: "productName 은 필수예요." };
  }

  const opt = (k: string) =>
    typeof o[k] === "string" && (o[k] as string).trim().length > 0 ? (o[k] as string).trim() : undefined;

  const value: PetbtiProduct = {
    typeCode: o.typeCode as PetTypeCode,
    productName: o.productName.trim(),
  };
  const img = opt("imageUrl");
  if (img) value.imageUrl = img;
  const rs = opt("reason");
  if (rs) value.reason = rs;
  const su = opt("shopUrl");
  if (su) value.shopUrl = su;

  return { ok: true, value };
}
