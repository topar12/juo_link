import { AXES, PET_TYPE_CODES } from "../data/types";
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
 * AXES 순서대로 3개씩 슬라이스, 축당 first pole 이 2개 이상이면 first 아니면 second.
 * 축당 3문항(홀수)이라 동점이 없다. 잘못된 길이/코드는 throw.
 */
export function calculateResult(answers: Pole[]): PetTypeCode {
  if (answers.length !== 12) throw new Error(`expected 12 answers, got ${answers.length}`);
  let code = "";
  AXES.forEach((axis, i) => {
    const slice = answers.slice(i * 3, i * 3 + 3);
    const firstCount = slice.filter((p) => p === axis.poles.first).length;
    code += firstCount >= 2 ? axis.poles.first : axis.poles.second; // 홀수라 동점 없음
  });
  if (!(PET_TYPE_CODES as readonly string[]).includes(code)) {
    throw new Error(`invalid code: ${code}`);
  }
  return code as PetTypeCode;
}
