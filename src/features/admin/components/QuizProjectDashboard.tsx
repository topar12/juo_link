'use client';

import { useCallback, useEffect, useState } from 'react';
import { type ProjectConfig, getProjectTypeCodes } from '@/features/admin/lib/constants';
import KpiCard from '@/features/admin/components/KpiCard';
import TypeDonutChart from '@/features/admin/components/TypeDonutChart';
import TypeBarChart from '@/features/admin/components/TypeBarChart';
import FunnelChart from '@/features/admin/components/FunnelChart';
import SourceChart from '@/features/admin/components/SourceChart';
import TrendChart from '@/features/admin/components/TrendChart';
import ShareChart from '@/features/admin/components/ShareChart';
import {
  Users,
  Trophy,
  Sparkles,
  BarChart3,
  RefreshCw,
  ExternalLink,
  CalendarDays,
} from 'lucide-react';

interface ProjectDashboardProps {
  project: ProjectConfig;
}

export default function QuizProjectDashboard({ project }: ProjectDashboardProps) {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [daysFilter, setDaysFilter] = useState<string>('30');

  const typeCodes = getProjectTypeCodes(project);

  // 멍BTI 결과 집계는 Cloudflare D1(/api/petbti/stats)에서 1회성으로 가져온다.
  // (기존 Firestore onSnapshot 실시간 구독 대체 — D1은 one-shot fetch)
  const fetchOnce = useCallback(async () => {
    // firestoreCollection/firestoreDoc 설정이 있는 프로젝트(=퀴즈 집계 백엔드 보유)만 조회한다.
    if (!project.firestoreCollection || !project.firestoreDoc) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/petbti/stats', { cache: 'no-store' });
      if (res.ok) {
        // 응답 형태: { EGA: n, ..., total: n } 또는 실패 시 null
        const data = (await res.json()) as Record<string, number> | null;
        if (data) {
          setStats(data);
        }
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error('petbti stats fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [project.firestoreCollection, project.firestoreDoc]);

  useEffect(() => {
    if (!project.firestoreCollection || !project.firestoreDoc) {
      setLoading(false);
      return;
    }

    setStats(null);
    setLoading(true);
    fetchOnce();
  }, [fetchOnce, project.firestoreCollection, project.firestoreDoc]);

  const handleRefresh = () => {
    setLoading(true);
    fetchOnce();
  };

  const total = stats?.total || 0;

  const topType = stats
    ? typeCodes.reduce(
        (best, code) => {
          const count = stats[code] || 0;
          return count > best.count ? { code, count } : best;
        },
        { code: '', count: 0 }
      )
    : null;

  const rareType = stats
    ? typeCodes.reduce(
        (rarest, code) => {
          const count = stats[code] || 0;
          if (rarest.count === -1) return { code, count };
          return count < rarest.count ? { code, count } : rarest;
        },
        { code: '', count: -1 }
      )
    : null;

  const avgPerType = total > 0 ? Math.round(total / typeCodes.length) : 0;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-[#09090B]/80 backdrop-blur-xl border-b border-[#1e1e23]">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-[24px]">{project.emoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[18px] font-bold text-white tracking-tight">
                  {project.name}
                </h1>
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3f3f46] hover:text-[#71717A] transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
              <p className="text-[12px] text-[#52525B] mt-0.5">
                {project.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-[11px] text-[#3f3f46] font-medium hidden sm:inline-block border-[#27272A] pr-1">
                {lastUpdated.toLocaleTimeString('ko-KR')}
              </span>
            )}

            <button
              onClick={handleRefresh}
              className="w-8 h-8 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-center text-[#52525B] hover:text-white hover:border-[#3f3f46] transition-all duration-200 active:scale-95"
              title="새로고침"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="전체 참여자"
            value={total}
            icon={Users}
            iconColor={project.accentColor}
            loading={loading}
            badge={
              <span className="text-[10px] text-[#52525B] bg-[#27272A] px-1.5 py-0.5 rounded font-medium">
                누적
              </span>
            }
          />
          <KpiCard
            title="인기 1위 유형"
            value={topType ? project.types?.[topType.code]?.label || '—' : '—'}
            icon={Trophy}
            iconColor="#F59E0B"
            subtitle={topType ? `${topType.count.toLocaleString()}명` : undefined}
            loading={loading}
          />
          <KpiCard
            title="희귀 유형"
            value={rareType && rareType.code ? project.types?.[rareType.code]?.label || '—' : '—'}
            icon={Sparkles}
            iconColor="#EC4899"
            subtitle={rareType && rareType.count >= 0 ? `${rareType.count.toLocaleString()}명` : undefined}
            loading={loading}
          />
          <KpiCard
            title="유형별 평균"
            value={avgPerType}
            icon={BarChart3}
            iconColor="#22C55E"
            subtitle="명/유형"
            loading={loading}
          />
        </div>

        {!loading && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-4">
              <TypeDonutChart data={stats} project={project} />
              <TypeBarChart data={stats} project={project} />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#27272A]">
              <div>
                <h2 className="text-[16px] font-bold text-white tracking-tight">상세 퍼널 및 트래픽 분석</h2>
                <p className="text-[12px] text-[#71717A] mt-1">Google Analytics 4 데이터를 기반으로 한 기간별 사용자 행동 데이터입니다.</p>
              </div>

              <div className="flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-1.5 w-max">
                <CalendarDays size={14} className="text-[#a1a1aa]" />
                <select
                  value={daysFilter}
                  onChange={(e) => setDaysFilter(e.target.value)}
                  className="bg-transparent text-[13px] font-bold text-white outline-none cursor-pointer appearance-none px-1"
                >
                  <option value="1" className="bg-[#18181B] text-white">오늘 (Today)</option>
                  <option value="7" className="bg-[#18181B] text-white">최근 7일</option>
                  <option value="14" className="bg-[#18181B] text-white">최근 14일</option>
                  <option value="30" className="bg-[#18181B] text-white">최근 30일 (기본)</option>
                  <option value="90" className="bg-[#18181B] text-white">최근 90일</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-2">
              <FunnelChart days={daysFilter} />
              <SourceChart days={daysFilter} />
            </div>

            <ShareChart days={daysFilter} />

            <TrendChart days={daysFilter} />
          </div>
        )}

        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-[#18181B] rounded-2xl h-[380px] border border-[#27272A] animate-shimmer" />
              <div className="bg-[#18181B] rounded-2xl h-[380px] border border-[#27272A] animate-shimmer" />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-[#18181B] rounded-2xl h-[340px] border border-[#27272A] animate-shimmer" />
              <div className="bg-[#18181B] rounded-2xl h-[340px] border border-[#27272A] animate-shimmer" />
            </div>
            <div className="bg-[#18181B] rounded-2xl h-[340px] border border-[#27272A] animate-shimmer" />
          </div>
        )}
      </main>
    </div>
  );
}
