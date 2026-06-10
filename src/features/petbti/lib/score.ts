import type { AxisKey, Pole, PetTypeCode } from "../data/types";

export interface QuizOption {
  label: string; // 선택지 텍스트
  pole: Pole;    // 이 선택이 가산하는 극
}

export interface Question {
  id: string;                          // "q1"…"q12"
  axis: AxisKey;                       // 이 문항이 측정하는 축
  prompt: string;                      // 질문 텍스트
  options: [QuizOption, QuizOption];   // 2지선다
}

/**
 * 12개 응답(문항 순서대로 pole) → 4글자 유형 코드.
 * 축당 3문항 다수결, 축당 홀수라 동점 없음.
 * Task A2 에서 구현.
 */
export function calculateResult(_answers: Pole[]): PetTypeCode {
  throw new Error("not implemented");
}
