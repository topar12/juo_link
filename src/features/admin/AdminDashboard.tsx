'use client';

import { useState } from 'react';
import { PROJECTS } from '@/features/admin/lib/constants';
import Sidebar, { type AdminView } from '@/features/admin/components/Sidebar';
import OverviewContent from '@/features/admin/components/OverviewContent';
import DashboardContent from '@/features/admin/components/DashboardContent';
import FoodsManager from '@/features/admin/components/FoodsManager';

// 원본(juo_dashboard)은 Next 라우팅(/ 개요 + /projects/[projectId])으로 화면을 나눴지만,
// 호스트 앱은 admin 을 단일 클라이언트 페이지(ssr:false)로 로드하므로 중첩 라우팅이 없다.
// 따라서 선택된 뷰를 URL 파라미터 대신 클라이언트 상태(useState)로 관리하고,
// Sidebar/OverviewContent 의 네비게이션은 콜백(onSelect)으로 처리한다.
// 다크 페이지 배경(bg-[#09090B])은 원본 app/layout.tsx 의 body 스타일을 셸에서 재현한다.
export default function AdminDashboard() {
  const [activeView, setActiveView] = useState<AdminView>('overview');

  // 현재 뷰에 해당하는 프로젝트 설정을 찾는다. 개요이거나 알 수 없는 id 면 undefined.
  const activeProject = PROJECTS.find((p) => p.id === activeView);

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <Sidebar activeView={activeView} onSelect={setActiveView} />
      <div className="ml-[240px]">
        {/* 음식 데이터 뷰는 프로젝트가 아니므로 프로젝트 조회보다 먼저 분기한다. */}
        {activeView === 'foods' ? (
          <FoodsManager />
        ) : activeProject ? (
          <DashboardContent project={activeProject} />
        ) : (
          <OverviewContent onSelect={setActiveView} />
        )}
      </div>
    </div>
  );
}
