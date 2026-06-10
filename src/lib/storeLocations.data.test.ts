import { describe, it, expect } from "vitest";
import stores from "../data/storeLocations.json";
import { STORE_CATEGORIES } from "./stores";
import type { StoreLocation } from "./stores";
import { validateStoreInput, isValidStoreCategory } from "./storeValidation";

const items = stores as StoreLocation[];

describe("storeLocations.json 무결성", () => {
  it("비어있지 않은 배열", () => {
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  it("id 중복 없음", () => {
    const ids = items.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("모든 category 가 enum(6종)에 속함", () => {
    for (const s of items) {
      expect(isValidStoreCategory(s.category), `bad category in ${s.id}: ${s.category}`).toBe(true);
    }
    // enum 자체도 6종인지 가드
    expect(STORE_CATEGORIES.length).toBe(6);
  });

  it("모든 시드 항목의 데이터 필드가 validateStoreInput 을 통과", () => {
    // 시드 id 는 한글이 섞인 레거시 슬러그(예: "store-001-대구-...")라 슬러그 검증을 통과하지 못한다.
    // 따라서 데이터 품질 필드(name/category/address/lat/lng)만 검증한다 — id 는 제외해 서버 생성에 맡긴다.
    for (const s of items) {
      const { id: _id, ...withoutId } = s;
      const result = validateStoreInput(withoutId);
      expect(result.ok, `invalid seed ${s.id}: ${result.ok ? "" : result.error}`).toBe(true);
    }
  });

  it("검증이 좌표·이름·카테고리를 원본대로 보존한다", () => {
    for (const s of items) {
      const { id: _id, ...withoutId } = s;
      const result = validateStoreInput(withoutId);
      if (!result.ok) throw new Error(`unexpected invalid: ${s.id}`);
      expect(result.value.name).toBe(s.name);
      expect(result.value.category).toBe(s.category);
      expect(result.value.address).toBe(s.address);
      expect(result.value.lat).toBe(s.lat);
      expect(result.value.lng).toBe(s.lng);
      expect(result.value.rawCategory).toBe(s.rawCategory);
    }
  });
});
