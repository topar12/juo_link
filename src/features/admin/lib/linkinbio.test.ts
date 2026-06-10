import { describe, expect, it } from "vitest";
import type { Ga4FilterExpression } from "./ga4";
import { buildBrandFilter } from "./linkinbio";

/** 필터 트리(filter / andGroup / orGroup)를 평탄화해 leaf 필터만 모은다. */
function leafFilters(expr: Ga4FilterExpression | null | undefined): NonNullable<Ga4FilterExpression["filter"]>[] {
  if (!expr) return [];
  if (expr.filter) return [expr.filter];
  const expressions = expr.orGroup?.expressions ?? expr.andGroup?.expressions ?? [];
  return expressions.flatMap(leafFilters);
}

describe("buildBrandFilter", () => {
  it("브랜드가 없거나 'all'이면 필터 없음(null)", () => {
    expect(buildBrandFilter(null)).toBeNull();
    expect(buildBrandFilter("all")).toBeNull();
  });

  it("서브도메인 방문(주소창 pagePath='/')을 잡도록 hostName(punycode)으로 매칭한다", () => {
    const filter = buildBrandFilter("petfoodjuo");
    const hostFilter = leafFilters(filter).find((f) => f.fieldName === "hostName");
    expect(hostFilter?.inListFilter?.values).toContain("xn--hy1b679cura.xn--vk5b15c.info");
  });

  it("hostName과 pagePath를 OR로 묶어 둘 중 하나만 맞아도 포함한다", () => {
    const filter = buildBrandFilter("petfoodjuo");
    expect(filter?.orGroup).toBeDefined();
    const fields = leafFilters(filter).map((f) => f.fieldName);
    expect(fields).toContain("hostName");
    expect(fields).toContain("pagePath");
  });

  it("과거 경로 방식(/<brand>) 트래픽도 계속 포함되도록 pagePath EXACT 매칭을 유지한다", () => {
    const filter = buildBrandFilter("lovejuo");
    const pathFilter = leafFilters(filter).find((f) => f.fieldName === "pagePath");
    expect(pathFilter?.stringFilter).toEqual({ value: "/lovejuo", matchType: "EXACT" });
  });
});
