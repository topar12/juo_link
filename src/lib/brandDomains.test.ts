import { describe, expect, it } from "vitest";
import { getBrandHosts, resolveBrandFromHost } from "./brandDomains";

describe("resolveBrandFromHost", () => {
  it("펫푸드 서브도메인(punycode) → petfoodjuo", () => {
    expect(resolveBrandFromHost("xn--hy1b679cura.xn--vk5b15c.info")).toBe("petfoodjuo");
  });

  it("사랑해 서브도메인(punycode) → lovejuo", () => {
    expect(resolveBrandFromHost("xn--9i2br6obor.xn--vk5b15c.info")).toBe("lovejuo");
  });

  it("포트가 붙어 있어도 무시한다", () => {
    expect(resolveBrandFromHost("xn--hy1b679cura.xn--vk5b15c.info:443")).toBe("petfoodjuo");
  });

  it("대문자·앞뒤 공백을 정규화한다", () => {
    expect(resolveBrandFromHost("  XN--HY1B679CURA.XN--VK5B15C.INFO  ")).toBe("petfoodjuo");
  });

  it("유니코드 형태의 Host도 매핑한다", () => {
    expect(resolveBrandFromHost("펫푸드.주오.info")).toBe("petfoodjuo");
    expect(resolveBrandFromHost("사랑해.주오.info")).toBe("lovejuo");
  });

  it("매핑되지 않은 호스트는 null", () => {
    expect(resolveBrandFromHost("juolinkinbio.ttoparr12.workers.dev")).toBeNull();
    expect(resolveBrandFromHost("xn--vk5b15c.info")).toBeNull(); // apex 단독
    expect(resolveBrandFromHost("example.com")).toBeNull();
  });

  it("빈 값·null·undefined는 null", () => {
    expect(resolveBrandFromHost("")).toBeNull();
    expect(resolveBrandFromHost(null)).toBeNull();
    expect(resolveBrandFromHost(undefined)).toBeNull();
  });
});

describe("getBrandHosts", () => {
  it("브랜드 → punycode 서브도메인 호스트(GA4 hostName이 기록하는 형태)를 돌려준다", () => {
    expect(getBrandHosts("petfoodjuo")).toContain("xn--hy1b679cura.xn--vk5b15c.info");
    expect(getBrandHosts("lovejuo")).toContain("xn--9i2br6obor.xn--vk5b15c.info");
  });

  it("유니코드 호스트도 방어적으로 함께 포함한다", () => {
    expect(getBrandHosts("petfoodjuo")).toContain("펫푸드.주오.info");
    expect(getBrandHosts("lovejuo")).toContain("사랑해.주오.info");
  });

  it("매핑되지 않은 브랜드나 'all'은 빈 배열", () => {
    expect(getBrandHosts("nope")).toEqual([]);
    expect(getBrandHosts("all")).toEqual([]);
  });
});
