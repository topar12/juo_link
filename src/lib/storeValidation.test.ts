import { describe, it, expect } from "vitest";
import { validateStoreInput, generateStoreId, isValidStoreCategory } from "./storeValidation";

describe("validateStoreInput", () => {
  // 서울시청 부근 좌표 — 한국 범위 안의 유효 기본값
  const base = {
    name: "행복동물병원",
    category: "병원",
    address: "서울 중구 세종대로 110",
    lat: 37.5665,
    lng: 126.978,
  };

  it("최소 유효 입력을 정규화한다", () => {
    const r = validateStoreInput({ ...base, id: "happy-vet" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toEqual({
      id: "happy-vet",
      name: "행복동물병원",
      category: "병원",
      rawCategory: "병원", // 비우면 category 로 기본
      address: "서울 중구 세종대로 110",
      lat: 37.5665,
      lng: 126.978,
    });
  });

  it("name·address 를 trim 한다", () => {
    const r = validateStoreInput({ ...base, id: "x", name: "  펫샵  ", address: "  서울  " });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.name).toBe("펫샵");
    expect(r.value.address).toBe("서울");
  });

  it("빈 name 을 거부한다", () => {
    expect(validateStoreInput({ ...base, name: "   " }).ok).toBe(false);
  });

  it("빈 address 를 거부한다", () => {
    expect(validateStoreInput({ ...base, address: "" }).ok).toBe(false);
  });

  it("잘못된 category 를 거부한다", () => {
    expect(validateStoreInput({ ...base, category: "카페" }).ok).toBe(false);
    expect(validateStoreInput({ ...base, category: "hospital" }).ok).toBe(false);
  });

  it("6종 category 를 모두 허용한다", () => {
    for (const category of ["병원", "펫샵", "미용", "훈련", "보호소", "기타"]) {
      const r = validateStoreInput({ ...base, id: "x", category });
      expect(r.ok, `category ${category}`).toBe(true);
    }
  });

  it("rawCategory 가 있으면 보존한다", () => {
    const r = validateStoreInput({ ...base, id: "x", category: "펫샵", rawCategory: "분양샵" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.rawCategory).toBe("분양샵");
  });

  it("rawCategory 가 비면 category 로 기본 처리한다", () => {
    const r = validateStoreInput({ ...base, id: "x", category: "미용", rawCategory: "   " });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.rawCategory).toBe("미용");
  });

  it("lat 이 숫자가 아니면 거부한다", () => {
    expect(validateStoreInput({ ...base, lat: "37.5" }).ok).toBe(false);
    expect(validateStoreInput({ ...base, lat: Number.NaN }).ok).toBe(false);
  });

  it("lng 이 숫자가 아니면 거부한다", () => {
    expect(validateStoreInput({ ...base, lng: "126" }).ok).toBe(false);
    expect(validateStoreInput({ ...base, lng: Number.POSITIVE_INFINITY }).ok).toBe(false);
  });

  it("한국 범위 밖 lat 을 거부한다 (오타·잘못된 지오코딩 방지)", () => {
    expect(validateStoreInput({ ...base, lat: 0 }).ok).toBe(false);
    expect(validateStoreInput({ ...base, lat: 40 }).ok).toBe(false);
    expect(validateStoreInput({ ...base, lat: 32.9 }).ok).toBe(false);
  });

  it("한국 범위 밖 lng 을 거부한다", () => {
    expect(validateStoreInput({ ...base, lng: 0 }).ok).toBe(false);
    expect(validateStoreInput({ ...base, lng: 123.9 }).ok).toBe(false);
    expect(validateStoreInput({ ...base, lng: 132.1 }).ok).toBe(false);
  });

  it("경계값 lat/lng 은 허용한다", () => {
    expect(validateStoreInput({ ...base, id: "x", lat: 33, lng: 124 }).ok).toBe(true);
    expect(validateStoreInput({ ...base, id: "y", lat: 39, lng: 132 }).ok).toBe(true);
  });

  it("잘못된 슬러그 id 를 거부한다", () => {
    expect(validateStoreInput({ ...base, id: "Happy Vet" }).ok).toBe(false);
    expect(validateStoreInput({ ...base, id: "UPPER" }).ok).toBe(false);
    expect(validateStoreInput({ ...base, id: "-bad" }).ok).toBe(false);
    expect(validateStoreInput({ ...base, id: "bad-" }).ok).toBe(false);
    // 한글 id 는 슬러그가 아니라 거부 (시드의 한글 id 는 별도 마이그레이션 경로)
    expect(validateStoreInput({ ...base, id: "store-001-병원" }).ok).toBe(false);
  });

  it("id 누락 시 store- 접두 id 를 생성한다", () => {
    const r = validateStoreInput({ ...base });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.id).toMatch(/^store-[0-9a-f]{8}$/);
  });

  it("객체가 아니면 거부한다", () => {
    expect(validateStoreInput(null).ok).toBe(false);
    expect(validateStoreInput("nope").ok).toBe(false);
    expect(validateStoreInput(42).ok).toBe(false);
  });
});

describe("generateStoreId", () => {
  it("제공된 id 를 우선한다", () => {
    expect(generateStoreId("vet-clinic")).toBe("vet-clinic");
  });
  it("id 가 없으면 store- 접두 id 를 생성한다", () => {
    expect(generateStoreId()).toMatch(/^store-[0-9a-f]{8}$/);
    expect(generateStoreId("   ")).toMatch(/^store-[0-9a-f]{8}$/);
  });
});

describe("isValidStoreCategory", () => {
  it("6종만 허용한다", () => {
    expect(isValidStoreCategory("병원")).toBe(true);
    expect(isValidStoreCategory("기타")).toBe(true);
    expect(isValidStoreCategory("카페")).toBe(false);
    expect(isValidStoreCategory(null)).toBe(false);
  });
});
