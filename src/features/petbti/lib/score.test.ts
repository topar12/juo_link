import { describe, it, expect } from "vitest";
import { calculateResult } from "./score";
import { QUESTIONS } from "../data/questions";
import { PET_TYPE_CODES, type Pole } from "../data/types";

describe("calculateResult", () => {
  it("모든 극을 첫 번째로 선택하면 ESBG", () => {
    expect(calculateResult(["E", "E", "E", "S", "S", "S", "B", "B", "B", "G", "G", "G"])).toBe("ESBG");
  });
  it("모든 극을 두 번째로 선택하면 CRTP", () => {
    expect(calculateResult(["C", "C", "C", "R", "R", "R", "T", "T", "T", "P", "P", "P"])).toBe("CRTP");
  });
  it("축당 2:1 다수결로 결정 (혼합)", () => {
    // energy: E,E,C → E / social: R,R,S → R / bold: B,T,B → B / appetite: P,P,G → P
    expect(calculateResult(["E", "E", "C", "R", "R", "S", "B", "T", "B", "P", "P", "G"])).toBe("ERBP");
  });
  it("문항 수와 정렬이 QUESTIONS 와 일치", () => {
    expect(QUESTIONS).toHaveLength(12);
    expect(QUESTIONS.map((q) => q.axis)).toEqual([
      "energy", "energy", "energy", "social", "social", "social",
      "bold", "bold", "bold", "appetite", "appetite", "appetite",
    ]);
  });
  it("16개 코드 전부 도달 가능 (전수)", () => {
    const reached = new Set<string>();
    const poles: [Pole, Pole][] = [["E", "C"], ["S", "R"], ["B", "T"], ["G", "P"]];
    for (let m = 0; m < 16; m++) {
      const ans: Pole[] = [];
      poles.forEach((p, axis) => {
        const pole = (m >> axis) & 1 ? p[1] : p[0];
        ans.push(pole, pole, pole); // 축당 3문항 동일 극
      });
      reached.add(calculateResult(ans));
    }
    expect(reached.size).toBe(16);
    PET_TYPE_CODES.forEach((c) => expect(reached.has(c)).toBe(true));
  });
});
