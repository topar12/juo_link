import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import PetbtiGaInit from "./PetbtiGaInit";

// 멍BTI 그룹 레이아웃 — (site) 폰 프레임 안에서:
//  ① 멍BTI GA4 스트림 config 1회 주입(PetbtiGaInit)
//  ② metadataBase 지정 — 유형별 OG(/og/petbti/*.png)가 절대 URL 로 해석되게.
//     멀티테넌트 서브도메인이지만 OG 에셋은 같은 워커가 모든 도메인에서 서빙하므로
//     canonical 도메인(주 브랜드 펫푸드.주오.info, punycode)을 기준으로 둔다.
//     NEXT_PUBLIC_SITE_URL 로 오버라이드 가능(빌드타임 인라인).
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://xn--hy1b679cura.xn--vk5b15c.info"
  ),
};

export const viewport: Viewport = {
  themeColor: "#FDFCF8",
};

export default function PetbtiLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PetbtiGaInit />
      {children}
    </>
  );
}
