'use client';

import {
  LayoutDashboard,
  Settings,
  ExternalLink,
  Plus,
  Apple,
  MapPin,
} from 'lucide-react';
import { PROJECTS } from '@/features/admin/lib/constants';

// 호스트 앱은 admin 을 단일 클라이언트 페이지로 로드하므로 next/link·usePathname 대신
// 상위(AdminDashboard)에서 내려주는 활성 뷰 상태/콜백으로 네비게이션을 처리한다.
// 'foods' = 음식 데이터 CRUD 편집기, 'stores' = 매장 데이터 CRUD 편집기
// (둘 다 프로젝트가 아닌 데이터 관리 뷰).
export type AdminView = 'overview' | 'foods' | 'stores' | string;

interface SidebarProps {
  activeView: AdminView;
  onSelect: (view: AdminView) => void;
}

export default function Sidebar({ activeView, onSelect }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] bg-[#111113] border-r border-[#1e1e23] flex flex-col z-50">
      {/* Brand */}
      <div className="p-5 pb-4 border-b border-[#1e1e23]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20">
            J
          </div>
          <div>
            <h1 className="text-[13px] font-bold text-white tracking-tight">
              주오컴퍼니
            </h1>
            <p className="text-[10px] text-[#52525B] font-medium tracking-wide uppercase">
              Analytics Hub
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {/* General */}
        <p className="text-[10px] font-semibold text-[#52525B] uppercase tracking-wider px-3 pt-2 pb-2.5">
          일반
        </p>
        <button
          type="button"
          onClick={() => onSelect('overview')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
            activeView === 'overview'
              ? 'bg-[#6366F1]/10 text-[#818CF8]'
              : 'text-[#A1A1AA] hover:text-white hover:bg-[#1c1c22]'
          }`}
        >
          <LayoutDashboard
            size={16}
            className={activeView === 'overview' ? 'text-[#818CF8]' : 'text-[#52525B]'}
          />
          전체 개요
        </button>

        {/* Projects */}
        <p className="text-[10px] font-semibold text-[#52525B] uppercase tracking-wider px-3 pt-5 pb-2.5">
          프로젝트
        </p>
        <div className="space-y-0.5">
          {PROJECTS.map((project) => {
            const isActive = activeView === project.id;
            return (
              <button
                type="button"
                key={project.id}
                onClick={() => onSelect(project.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#6366F1]/10 text-[#818CF8]'
                    : 'text-[#A1A1AA] hover:text-white hover:bg-[#1c1c22]'
                }`}
              >
                <span className="text-[15px] w-4 text-center">{project.emoji}</span>
                {project.name}
              </button>
            );
          })}

          {/* Add project hint */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] text-[#2a2a32] cursor-default">
            <Plus size={14} />
            <span className="italic">constants.ts에서 추가</span>
          </div>
        </div>

        {/* Data — 코드 수정·재배포 없이 관리하는 데이터(D1) 뷰 */}
        <p className="text-[10px] font-semibold text-[#52525B] uppercase tracking-wider px-3 pt-5 pb-2.5">
          데이터
        </p>
        <button
          type="button"
          onClick={() => onSelect('foods')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
            activeView === 'foods'
              ? 'bg-[#6366F1]/10 text-[#818CF8]'
              : 'text-[#A1A1AA] hover:text-white hover:bg-[#1c1c22]'
          }`}
        >
          <Apple
            size={16}
            className={activeView === 'foods' ? 'text-[#818CF8]' : 'text-[#52525B]'}
          />
          음식 데이터
        </button>
        <button
          type="button"
          onClick={() => onSelect('stores')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
            activeView === 'stores'
              ? 'bg-[#6366F1]/10 text-[#818CF8]'
              : 'text-[#A1A1AA] hover:text-white hover:bg-[#1c1c22]'
          }`}
        >
          <MapPin
            size={16}
            className={activeView === 'stores' ? 'text-[#818CF8]' : 'text-[#52525B]'}
          />
          매장 데이터
        </button>

        {/* Settings */}
        <p className="text-[10px] font-semibold text-[#52525B] uppercase tracking-wider px-3 pt-5 pb-2.5">
          기타
        </p>
        <button
          type="button"
          disabled
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] text-[#A1A1AA]/30 cursor-not-allowed font-medium"
        >
          <Settings size={16} className="text-[#52525B]/30" />
          설정
          <span className="ml-auto text-[9px] bg-[#27272A] text-[#52525B] px-1.5 py-0.5 rounded font-medium">
            SOON
          </span>
        </button>
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-[#1e1e23] space-y-0.5">
        {PROJECTS.filter((p) => p.url).map((project) => (
          <a
            key={project.id}
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] text-[#3f3f46] hover:text-[#A1A1AA] hover:bg-[#1c1c22] transition-all duration-150 font-medium"
          >
            <ExternalLink size={13} />
            {project.name} 사이트
          </a>
        ))}
      </div>
    </aside>
  );
}
