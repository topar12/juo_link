// 매장(제휴처) 공유 타입 — 원래 StoreFinderSheet.tsx 안에 인라인 정의돼 있던 것을 추출.
// 공개 컴포넌트(StoreFinderSheet)·공개 API·관리 API·검증 모듈·편집기가 모두 이 정의를 공유한다.

export type StoreCategory = "병원" | "펫샵" | "미용" | "훈련" | "보호소" | "기타";

// 공개 필터/관리 셀렉트가 쓰는 6종 카테고리 목록 (순서 유지)
export const STORE_CATEGORIES: StoreCategory[] = ["병원", "펫샵", "미용", "훈련", "보호소", "기타"];

export type StoreLocation = {
  id: string;
  name: string;
  category: StoreCategory;
  rawCategory: string;
  address: string;
  lat: number;
  lng: number;
};
