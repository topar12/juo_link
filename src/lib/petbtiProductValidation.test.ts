import { describe, it, expect } from "vitest";
import { validateProductInput } from "./petbtiProductValidation";

describe("validateProductInput", () => {
  it("정상 입력 통과", () => {
    const r = validateProductInput({ typeCode: "ESBG", productName: "우족 슬라이스", reason: "씹기" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.typeCode).toBe("ESBG");
      expect(r.value.productName).toBe("우족 슬라이스");
      expect(r.value.reason).toBe("씹기");
    }
  });

  it("잘못된 typeCode 거부", () => {
    expect(validateProductInput({ typeCode: "ZZZZ", productName: "x" }).ok).toBe(false);
  });

  it("구 8유형 코드도 거부 (16유형만 허용)", () => {
    expect(validateProductInput({ typeCode: "EGA", productName: "x" }).ok).toBe(false);
  });

  it("빈 productName 거부", () => {
    expect(validateProductInput({ typeCode: "ESBG", productName: "  " }).ok).toBe(false);
  });

  it("객체가 아니면 거부", () => {
    expect(validateProductInput(null).ok).toBe(false);
    expect(validateProductInput("nope").ok).toBe(false);
  });

  it("선택 필드는 trim 되고 빈값이면 생략", () => {
    const r = validateProductInput({
      typeCode: "CRTP",
      productName: "  닭가슴살 육포  ",
      imageUrl: "  https://x/i.png  ",
      reason: "   ",
      shopUrl: "",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.productName).toBe("닭가슴살 육포");
      expect(r.value.imageUrl).toBe("https://x/i.png");
      expect(r.value.reason).toBeUndefined();
      expect(r.value.shopUrl).toBeUndefined();
    }
  });
});
