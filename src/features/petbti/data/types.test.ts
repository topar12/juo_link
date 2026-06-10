import { describe, it, expect } from "vitest";
import { PET_TYPES, PET_TYPE_CODES, AXES } from "./types";

describe("PET_TYPES", () => {
  it("정확히 16유형, 코드 중복 없음", () => {
    expect(PET_TYPE_CODES).toHaveLength(16);
    expect(new Set(PET_TYPE_CODES).size).toBe(16);
  });

  it("모든 유형이 필수 필드를 가짐", () => {
    for (const code of PET_TYPE_CODES) {
      const t = PET_TYPES[code];
      expect(t.code).toBe(code);
      expect(t.nickname.length).toBeGreaterThan(0);
      expect(t.catchphrase.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(10);
      expect(t.recommendedProduct.length).toBeGreaterThan(0);
      expect(t.traits).toHaveLength(4);
      expect(t.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(PET_TYPE_CODES).toContain(t.soulmate);
      expect(PET_TYPE_CODES).toContain(t.clash);
      // 자기 자신이 궁합일 수 없음
      expect(t.soulmate).not.toBe(code);
      expect(t.clash).not.toBe(code);
    }
  });

  it("4축 정의와 코드 형식이 정합", () => {
    expect(AXES.map((a) => a.key)).toEqual(["energy", "social", "bold", "appetite"]);
    for (const code of PET_TYPE_CODES) {
      expect(code).toMatch(/^[EC][SR][BT][GP]$/);
    }
  });

  it("색상이 16유형 모두 고유", () => {
    const colors = PET_TYPE_CODES.map((c) => PET_TYPES[c].color);
    expect(new Set(colors).size).toBe(16);
  });
});
