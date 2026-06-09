import { describe, it, expect } from "vitest";
import foods from "../data/foodSafety.json";
import type { FoodSafetyItem } from "./foodSafety";

const items = foods as FoodSafetyItem[];
const VALID_VERDICTS = ["danger", "caution", "safe"];

describe("foodSafety.json 무결성", () => {
  it("비어있지 않은 배열", () => {
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });
  it("id 중복 없음", () => {
    const ids = items.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("모든 항목 필수 필드 유효", () => {
    for (const f of items) {
      expect(f.id.length, `id: ${JSON.stringify(f)}`).toBeGreaterThan(0);
      expect(f.name.length, `name on ${f.id}`).toBeGreaterThan(0);
      expect(f.reason.length, `reason on ${f.id}`).toBeGreaterThan(0);
      expect(VALID_VERDICTS, `verdict on ${f.id}`).toContain(f.verdict);
      expect(Array.isArray(f.aliases), `aliases on ${f.id}`).toBe(true);
    }
  });
});
