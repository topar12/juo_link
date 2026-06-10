// /admin 전용 전체 화면 셸 — (site) 폰 프레임 밖에서 다크 캔버스를 깐다.
// 사이드바·카드 등 표면은 대시보드 컴포넌트가 직접 그리므로, 여기서는
// 전체 화면 배경/기본 텍스트 색만 지정한다.
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA]">{children}</div>
  );
}
