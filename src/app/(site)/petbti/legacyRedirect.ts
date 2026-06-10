import type { PetTypeCode } from "@/features/petbti/data/types";

// 구 8유형(?r=result1..8) → 가장 근접한 신 16유형 (죽은 링크 방지용 근사 매핑).
// 실제 리다이렉트는 /petbti/page.tsx 에서 searchParams.r 확인 후 redirect().
export const LEGACY_RESULT_MAP: Record<string, PetTypeCode> = {
  result1: "ERBG", // 구 EGA 파괴왕
  result2: "ERTG", // 구 EGI 점프 관절
  result3: "ESTP", // 구 EPI 자기관리 헬스견
  result4: "CRBG", // 구 CGA 껌딱지 요정
  result5: "CRTG", // 구 CGI 선비견
  result6: "ESTG", // 구 CPA 참견쟁이
  result7: "CRTP", // 구 CPI 미식 황제
  result8: "ERTP", // 구 EPA 프로 예민러
};
