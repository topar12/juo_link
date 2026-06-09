import { NextResponse, type NextRequest } from "next/server";
import { resolveBrandFromHost } from "@/lib/brandDomains";

/**
 * 브랜드 서브도메인(예: 펫푸드.주오.info)으로 들어온 루트 요청을
 * 내부적으로 해당 브랜드 페이지(/petfoodjuo 등)로 rewrite 한다.
 *
 * - rewrite이므로 주소창 URL은 서브도메인 그대로 유지된다.
 * - 매핑되지 않은 Host(workers.dev, apex 등)는 기존 동작을 그대로 통과시킨다.
 */
export function middleware(request: NextRequest) {
  const slug = resolveBrandFromHost(request.headers.get("host"));

  if (slug && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${slug}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  // 정적 자산/내부 경로는 제외하고 페이지 요청에만 적용
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
