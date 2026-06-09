import { describe, it, expect } from "vitest";
import { searchFoods, VERDICT_META, VERDICT_FILTER_ORDER, type FoodSafetyItem } from "./foodSafety";

const FIXTURE: FoodSafetyItem[] = [
  { id: "chocolate", name: "초콜릿", aliases: ["초콜렛", "choco"], verdict: "danger", reason: "테오브로민 중독." },
  { id: "apple", name: "사과", aliases: ["애플"], verdict: "safe", reason: "씨만 빼면 간식으로 좋아요." },
  { id: "cheese", name: "치즈", aliases: [], verdict: "caution", reason: "지방·염분, 소량만." },
];

describe("searchFoods", () => {
  it("한글 이름 부분일치", () => {
    expect(searchFoods(FIXTURE, "초콜", "all").map((f) => f.id)).toEqual(["chocolate"]);
  });
  it("별칭(오타·영문) 매칭", () => {
    expect(searchFoods(FIXTURE, "choco", "all").map((f) => f.id)).toEqual(["chocolate"]);
    expect(searchFoods(FIXTURE, "초콜렛", "all").map((f) => f.id)).toEqual(["chocolate"]);
  });
  it("빈 검색어면 전체, 위험한 것부터 정렬", () => {
    expect(searchFoods(FIXTURE, "", "all").map((f) => f.id)).toEqual(["chocolate", "cheese", "apple"]);
  });
  it("판정으로 필터", () => {
    expect(searchFoods(FIXTURE, "", "safe").map((f) => f.id)).toEqual(["apple"]);
  });
  it("매칭 없으면 빈 배열", () => {
    expect(searchFoods(FIXTURE, "양파", "all")).toEqual([]);
  });
  it("대소문자 무시", () => {
    expect(searchFoods(FIXTURE, "CHOCO", "all").map((f) => f.id)).toEqual(["chocolate"]);
  });
  it("앞뒤 공백 무시", () => {
    expect(searchFoods(FIXTURE, "  초콜  ", "all").map((f) => f.id)).toEqual(["chocolate"]);
  });
});

describe("VERDICT_META", () => {
  it("세 판정 라벨", () => {
    expect(VERDICT_META.danger.label).toBe("안 돼요");
    expect(VERDICT_META.caution.label).toBe("조심해요");
    expect(VERDICT_META.safe.label).toBe("먹어도 돼요");
  });
});

describe("VERDICT_FILTER_ORDER", () => {
  it("위험한 것부터 순서", () => {
    expect(VERDICT_FILTER_ORDER).toEqual(["danger", "caution", "safe"]);
  });
});
