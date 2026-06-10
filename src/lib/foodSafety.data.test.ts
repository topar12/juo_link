import { describe, it, expect } from "vitest";
import foods from "../data/foodSafety.json";
import type { FoodSafetyItem } from "./foodSafety";
import { validateFoodInput } from "./foodValidation";

const items = foods as FoodSafetyItem[];

describe("foodSafety.json 무결성", () => {
  it("비어있지 않은 배열", () => {
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  it("id 중복 없음", () => {
    const ids = items.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("모든 시드 항목이 validateFoodInput 을 통과", () => {
    for (const f of items) {
      const result = validateFoodInput(f);
      expect(result.ok, `invalid seed ${f.id}: ${result.ok ? "" : result.error}`).toBe(true);
    }
  });

  it("검증 후에도 id 가 시드와 동일하게 보존됨", () => {
    // 시드 id 는 모두 슬러그 형식이라 validateFoodInput 이 그대로 보존해야 한다.
    for (const f of items) {
      const result = validateFoodInput(f);
      if (!result.ok) throw new Error(`unexpected invalid: ${f.id}`);
      expect(result.value.id).toBe(f.id);
    }
  });
});
