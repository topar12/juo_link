'use client';

import { useEffect, useState } from 'react';
import { PROJECTS, getProjectTypeCodes } from '@/features/admin/lib/constants';
import type { AdminView } from '@/features/admin/components/Sidebar';
import {
  Users,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface ProjectSummary {
  id: string;
  total: number;
  subtitle: string;
  topType: { code: string; count: number } | null;
}

// 호스트 앱은 라우팅 없이 단일 페이지로 동작하므로 프로젝트 카드 클릭 시
// next/link 대신 상위에서 내려준 onSelect 콜백으로 뷰를 전환한다.
interface OverviewContentProps {
  onSelect: (view: AdminView) => void;
}

export default function OverviewContent({ onSelect }: OverviewContentProps) {
  const [summaries, setSummaries] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      const results: ProjectSummary[] = [];

      for (const project of PROJECTS) {
        try {
          if (project.dashboardKind === 'quiz' && project.firestoreCollection && project.firestoreDoc) {
            // 멍BTI 결과 집계는 Cloudflare D1(/api/petbti/stats)에서 1회성으로 가져온다.
            // 응답 형태: { EGA: n, ..., total: n } 또는 실패 시 null
            const res = await fetch('/api/petbti/stats', { cache: 'no-store' });
            const data = res.ok ? ((await res.json()) as Record<string, number> | null) : null;

            if (data) {
              const typeCodes = getProjectTypeCodes(project);
              const topType = typeCodes.reduce(
                (best, code) => {
                  const count = data[code] || 0;
                  return count > best.count ? { code, count } : best;
                },
                { code: '', count: 0 }
              );
              results.push({
                id: project.id,
                total: data.total || 0,
                subtitle: '전체 참여',
                topType: topType.code ? topType : null,
              });
            } else {
              results.push({ id: project.id, total: 0, subtitle: '전체 참여', topType: null });
            }
          } else {
            const res = await fetch('/admin/api/ga4/linkinbio/summary?days=30');
            const json = await res.json();
            results.push({
              id: project.id,
              total: json.success ? json.data?.totalEvents || 0 : 0,
              subtitle: '전체 이벤트',
              topType: null,
            });
          }
        } catch {
          results.push({
            id: project.id,
            total: 0,
            subtitle: project.dashboardKind === 'quiz' ? '전체 참여' : '전체 이벤트',
            topType: null,
          });
        }
      }

      setSummaries(results);
      setLoading(false);
    }

    fetchAll();
  }, []);

  const totalParticipants = summaries.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#09090B]/80 backdrop-blur-xl border-b border-[#1e1e23]">
        <div className="px-6 py-4">
          <h1 className="text-[18px] font-bold text-white tracking-tight">
            전체 개요
          </h1>
          <p className="text-[12px] text-[#52525B] mt-0.5">
            모든 프로젝트 현황을 한눈에
          </p>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Global Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#18181B] rounded-2xl p-5 border border-[#27272A]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#6366F1]/15 flex items-center justify-center">
                <Users size={18} className="text-[#6366F1]" />
              </div>
              <span className="text-[12px] text-[#71717A] font-medium">전체 참여자</span>
            </div>
            {loading ? (
              <div className="h-8 w-24 rounded-lg animate-shimmer" />
            ) : (
              <p className="text-[28px] font-extrabold text-white tracking-tight">
                {totalParticipants.toLocaleString()}
              </p>
            )}
          </div>

          <div className="bg-[#18181B] rounded-2xl p-5 border border-[#27272A]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#22C55E]/15 flex items-center justify-center">
                <TrendingUp size={18} className="text-[#22C55E]" />
              </div>
              <span className="text-[12px] text-[#71717A] font-medium">활성 프로젝트</span>
            </div>
            {loading ? (
              <div className="h-8 w-12 rounded-lg animate-shimmer" />
            ) : (
              <p className="text-[28px] font-extrabold text-white tracking-tight">
                {PROJECTS.length}
              </p>
            )}
          </div>

          <div className="bg-[#18181B] rounded-2xl p-5 border border-[#27272A]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/15 flex items-center justify-center">
                <Users size={18} className="text-[#F59E0B]" />
              </div>
              <span className="text-[12px] text-[#71717A] font-medium">프로젝트당 평균</span>
            </div>
            {loading ? (
              <div className="h-8 w-20 rounded-lg animate-shimmer" />
            ) : (
              <p className="text-[28px] font-extrabold text-white tracking-tight">
                {PROJECTS.length > 0
                  ? Math.round(totalParticipants / PROJECTS.length).toLocaleString()
                  : 0}
              </p>
            )}
          </div>
        </div>

        {/* Project Cards */}
        <div>
          <h2 className="text-[14px] font-bold text-[#71717A] uppercase tracking-wider mb-4">
            프로젝트
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROJECTS.map((project) => {
              const summary = summaries.find((s) => s.id === project.id);
              return (
                <button
                  type="button"
                  key={project.id}
                  onClick={() => onSelect(project.id)}
                  className="group bg-[#18181B] rounded-2xl p-6 border border-[#27272A] hover:border-[#3f3f46] transition-all duration-300 hover:shadow-lg hover:shadow-black/20 flex flex-col text-left"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <span className="text-[28px]">{project.emoji}</span>
                      <div>
                        <h3 className="text-[16px] font-bold text-white group-hover:text-[#818CF8] transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-[12px] text-[#52525B] mt-0.5">
                          {project.description}
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-[#27272A] flex items-center justify-center text-[#52525B] group-hover:bg-[#6366F1]/10 group-hover:text-[#818CF8] transition-all">
                      <ArrowRight size={14} />
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex gap-6">
                      <div className="h-10 w-20 rounded-lg animate-shimmer" />
                      <div className="h-10 w-32 rounded-lg animate-shimmer" />
                    </div>
                  ) : (
                    <div className="flex gap-6">
                      <div>
                        <p className="text-[22px] font-extrabold text-white">
                          {(summary?.total || 0).toLocaleString()}
                        </p>
                        <p className="text-[11px] text-[#52525B] font-medium">{summary?.subtitle || '전체 참여'}</p>
                      </div>
                      {summary?.topType && (
                        <div>
                          <p className="text-[22px] font-extrabold text-white">
                            {project.types?.[summary.topType.code]?.label || '—'}
                          </p>
                          <p className="text-[11px] text-[#52525B] font-medium">
                            인기 유형 ({summary.topType.count.toLocaleString()}명)
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Accent line */}
                  <div
                    className="mt-5 h-1 rounded-full w-12 opacity-40 group-hover:w-20 group-hover:opacity-80 transition-all duration-500"
                    style={{ backgroundColor: project.accentColor }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
