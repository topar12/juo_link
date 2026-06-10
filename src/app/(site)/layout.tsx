// (site) 그룹 레이아웃 — 브랜드 페이지와 /petbti 등에 폰 목업 프레임을 입힌다.
// 문서 레이아웃이 아니므로 <html>/<body>는 두지 않는다(루트 레이아웃이 담당).
// /admin 은 이 그룹 밖에 있어 이 프레임을 거치지 않고 전체 화면으로 렌더된다.
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* Desktop Mockup Wrapper */}
      <div className="relative w-full max-w-[430px] h-[100dvh] sm:h-[850px] sm:max-h-[90vh] sm:rounded-[3rem] sm:border-[12px] sm:border-slate-800 bg-slate-50 overflow-hidden sm:shadow-2xl">
        {/* Mockup Notch */}
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-slate-800 rounded-b-3xl z-50"></div>

        {children}
      </div>
    </div>
  );
}
