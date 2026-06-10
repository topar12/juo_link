import { describe, it, expect } from "vitest";
import { validateFoodInput, slugifyOrGenerate, isValidVerdict } from "./foodValidation";

describe("validateFoodInput", () => {
  const base = { name: "초콜릿", verdict: "danger", reason: "테오브로민 중독." };

  it("최소 유효 입력을 정규화한다", () => {
    const r = validateFoodInput({ ...base, id: "chocolate" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toEqual({
      id: "chocolate",
      name: "초콜릿",
      aliases: [],
      verdict: "danger",
      reason: "테오브로민 중독.",
    });
  });

  it("name·reason 을 trim 한다", () => {
    const r = validateFoodInput({ ...base, id: "x", name: "  사과  ", reason: "  좋아요  " });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.name).toBe("사과");
    expect(r.value.reason).toBe("좋아요");
  });

  it("잘못된 verdict 를 거부한다", () => {
    const r = validateFoodInput({ ...base, verdict: "maybe" });
    expect(r.ok).toBe(false);
  });

  it("빈 name 을 거부한다", () => {
    const r = validateFoodInput({ ...base, name: "   " });
    expect(r.ok).toBe(false);
  });

  it("빈 reason 을 거부한다", () => {
    const r = validateFoodInput({ ...base, reason: "" });
    expect(r.ok).toBe(false);
  });

  it("aliases 를 trim·빈값제거·중복제거 한다", () => {
    const r = validateFoodInput({ ...base, id: "x", aliases: [" choco ", "choco", "", "카카오"] });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.aliases).toEqual(["choco", "카카오"]);
  });

  it("aliases 누락은 [] 로 처리한다", () => {
    const r = validateFoodInput({ ...base, id: "x" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.aliases).toEqual([]);
  });

  it("aliases 가 배열이 아니면 거부한다", () => {
    const r = validateFoodInput({ ...base, aliases: "choco" });
    expect(r.ok).toBe(false);
  });

  it("빈 emoji·note 는 생략된다", () => {
    const r = validateFoodInput({ ...base, id: "x", emoji: "  ", note: "" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.emoji).toBeUndefined();
    expect(r.value.note).toBeUndefined();
  });

  it("emoji·note 를 trim 해 보존한다", () => {
    const r = validateFoodInput({ ...base, id: "x", emoji: " 🍫 ", note: " 메모 " });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.emoji).toBe("🍫");
    expect(r.value.note).toBe("메모");
  });

  it("잘못된 슬러그 id 를 거부한다", () => {
    expect(validateFoodInput({ ...base, id: "Choco Late" }).ok).toBe(false);
    expect(validateFoodInput({ ...base, id: "UPPER" }).ok).toBe(false);
    expect(validateFoodInput({ ...base, id: "-bad" }).ok).toBe(false);
    expect(validateFoodInput({ ...base, id: "bad-" }).ok).toBe(false);
  });

  it("id 누락 시 영문 이름은 슬러그화한다", () => {
    const r = validateFoodInput({ name: "Sweet Potato", verdict: "safe", reason: "ok" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.id).toBe("sweet-potato");
  });

  it("id 누락 시 한글 이름은 food- 접두 id 를 생성한다", () => {
    const r = validateFoodInput({ name: "초콜릿", verdict: "danger", reason: "ok" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.id).toMatch(/^food-[0-9a-f]{8}$/);
  });

  it("객체가 아니면 거부한다", () => {
    expect(validateFoodInput(null).ok).toBe(false);
    expect(validateFoodInput("nope").ok).toBe(false);
    expect(validateFoodInput(42).ok).toBe(false);
  });
});

describe("slugifyOrGenerate", () => {
  it("제공된 id 를 우선한다", () => {
    expect(slugifyOrGenerate("초콜릿", "chocolate")).toBe("chocolate");
  });
  it("영문 이름을 슬러그화한다", () => {
    expect(slugifyOrGenerate("Sweet Potato")).toBe("sweet-potato");
  });
  it("한글 이름은 food- 접두 id 를 생성한다", () => {
    expect(slugifyOrGenerate("초콜릿")).toMatch(/^food-[0-9a-f]{8}$/);
  });
});

describe("isValidVerdict", () => {
  it("세 값만 허용한다", () => {
    expect(isValidVerdict("danger")).toBe(true);
    expect(isValidVerdict("caution")).toBe(true);
    expect(isValidVerdict("safe")).toBe(true);
    expect(isValidVerdict("other")).toBe(false);
    expect(isValidVerdict(null)).toBe(false);
  });
});
