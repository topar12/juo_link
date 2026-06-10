import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "주오 링크인바이오",
  description: "주오 브랜드의 공식 링크인바이오입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  // 루트 레이아웃은 문서 셸(<html>/<body>)만 담당한다.
  // 폰 목업 프레임은 (site) 그룹 레이아웃으로 옮겼으므로, /admin 같은
  // 그룹 밖 라우트는 전체 화면을 그대로 사용할 수 있다.
  return (
    <html lang="ko" className="antialiased">
      <body className="selection:bg-brand-coral-500 selection:text-white">
        {children}
      </body>
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </html>
  );
}
