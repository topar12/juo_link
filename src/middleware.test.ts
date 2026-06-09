import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

function requestFrom(host: string, path = "/") {
  return new NextRequest(new URL(`http://localhost${path}`), {
    headers: { host },
  });
}

describe("middleware — 브랜드 서브도메인 rewrite", () => {
  it("펫푸드 서브도메인 루트 → /petfoodjuo 로 rewrite", () => {
    const res = middleware(requestFrom("xn--hy1b679cura.xn--vk5b15c.info"));
    expect(res.headers.get("x-middleware-rewrite")).toContain("/petfoodjuo");
  });

  it("사랑해 서브도메인 루트 → /lovejuo 로 rewrite (브랜드 정확히 분기)", () => {
    const res = middleware(requestFrom("xn--9i2br6obor.xn--vk5b15c.info"));
    const rewrite = res.headers.get("x-middleware-rewrite");
    expect(rewrite).toContain("/lovejuo");
    expect(rewrite).not.toContain("/petfoodjuo");
  });

  it("서브도메인이라도 루트(/)가 아니면 rewrite 하지 않는다", () => {
    const res = middleware(requestFrom("xn--hy1b679cura.xn--vk5b15c.info", "/lovejuo"));
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("매핑되지 않은 호스트(workers.dev)는 통과한다", () => {
    const res = middleware(requestFrom("juolinkinbio.ttoparr12.workers.dev"));
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });
});
