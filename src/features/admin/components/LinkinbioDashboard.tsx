'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CalendarDays,
  ExternalLink,
  MapPinned,
  MousePointerClick,
  RefreshCw,
  Share2,
  ShoppingBag,
  Store,
  Users,
} from 'lucide-react';
import type { ProjectConfig } from '@/features/admin/lib/constants';
import { LINKINBIO_BRANDS } from '@/features/admin/lib/linkinbio';
import KpiCard from '@/features/admin/components/KpiCard';

type SummaryResponse = {
  totalUsers: number;
  totalEvents: number;
  officialMallClicks: number;
  meongbtiClicks: number;
  storeFinderOpens: number;
  storeSelections: number;
  socialClicks: number;
  locateMeClicks: number;
  actions: Array<{ id: string; label: string; count: number }>;
};

type TrendPoint = {
  date: string;
  label: string;
  users: number;
  events: number;
};

type CountItem = {
  id: string;
  label: string;
  count?: number;
  users?: number;
  isDirect?: boolean;
};

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
  hint?: string;
  code?: string;
  requiresCustomDimensions?: boolean;
};

interface LinkinbioDashboardProps {
  project: ProjectConfig;
}

function EmptyPanel({
  title,
  hint,
}: {
  title: string;
  hint: string;
}) {
  return (
    <div className="bg-[#18181B] rounded-2xl p-6 border border-dashed border-[#27272A] h-full flex flex-col justify-center">
      <h3 className="text-[14px] font-bold text-white">{title}</h3>
      <p className="text-[12px] text-[#71717A] leading-relaxed mt-2">{hint}</p>
    </div>
  );
}

function MetricListCard({
  title,
  subtitle,
  items,
  color,
  formatter = (value) => `${value.toLocaleString()}`,
  highlightDirect = false,
}: {
  title: string;
  subtitle: string;
  items: CountItem[];
  color: string;
  formatter?: (value: number) => string;
  highlightDirect?: boolean;
}) {
  if (items.length === 0) {
    return (
      <EmptyPanel
        title={title}
        hint="아직 표시할 데이터가 충분하지 않거나, 해당 차원이 GA4에 설정되지 않았습니다."
      />
    );
  }

  const maxValue = Math.max(...items.map((item) => item.count ?? item.users ?? 0), 1);

  return (
    <div className="bg-[#18181B] rounded-2xl p-6 border border-[#27272A] h-full">
      <div className="mb-5">
        <h3 className="text-[15px] font-bold text-white">{title}</h3>
        <p className="text-[12px] text-[#71717A] mt-1">{subtitle}</p>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const value = item.count ?? item.users ?? 0;
          const width = (value / maxValue) * 100;
          return (
            <div key={item.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex items-center gap-2">
                  <span className="truncate text-[13px] font-medium text-[#E4E4E7]">
                    {item.label}
                  </span>
                  {highlightDirect && item.isDirect ? (
                    <span className="shrink-0 rounded-full border border-[#FF6B6B]/30 bg-[#FF6B6B]/10 px-2 py-0.5 text-[10px] font-bold text-[#FF9E8B]">
                      직영
                    </span>
                  ) : null}
                </div>
                <span className="text-[12px] font-bold text-white">
                  {formatter(value)}
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-[#27272A] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.max(width, 4)}%`,
                    backgroundColor: color,
                    opacity: 0.95,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LinkinbioDashboard({ project }: LinkinbioDashboardProps) {
  const [daysFilter, setDaysFilter] = useState('30');
  const [brandFilter, setBrandFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [traffic, setTraffic] = useState<CountItem[]>([]);
  const [social, setSocial] = useState<CountItem[]>([]);
  const [filters, setFilters] = useState<CountItem[]>([]);
  const [stores, setStores] = useState<CountItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [setupHint, setSetupHint] = useState<string | null>(null);
  const [needsCustomDimensions, setNeedsCustomDimensions] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchJson = useCallback(async <T,>(url: string) => {
    const response = await fetch(url);
    const text = await response.text();
    const json = text ? (JSON.parse(text) as ApiEnvelope<T>) : { success: false };

    if (!response.ok) {
      throw new Error(json.error || 'API request failed');
    }

    return json;
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = `days=${daysFilter}&brand=${brandFilter}`;
      const [
        summaryRes,
        trendRes,
        trafficRes,
        socialRes,
        filtersRes,
        storesRes,
      ] = await Promise.all([
        fetchJson<SummaryResponse>(`/admin/api/ga4/linkinbio/summary?${params}`),
        fetchJson<TrendPoint[]>(`/admin/api/ga4/linkinbio/trend?${params}`),
        fetchJson<CountItem[]>(`/admin/api/ga4/linkinbio/traffic?${params}`),
        fetchJson<CountItem[]>(`/admin/api/ga4/linkinbio/social?${params}`),
        fetchJson<CountItem[]>(`/admin/api/ga4/linkinbio/filters?${params}`),
        fetchJson<CountItem[]>(`/admin/api/ga4/linkinbio/stores?${params}`),
      ]);

      setSummary(summaryRes.data ?? null);
      setTrend(trendRes.data ?? []);
      setTraffic(trafficRes.data ?? []);
      setSocial(socialRes.data ?? []);
      setFilters(filtersRes.data ?? []);
      setStores(storesRes.data ?? []);
      setNeedsCustomDimensions(
        Boolean(
          socialRes.requiresCustomDimensions ||
            filtersRes.requiresCustomDimensions ||
            storesRes.requiresCustomDimensions
        )
      );
      setSetupHint(
        summaryRes.hint ||
          socialRes.hint ||
          filtersRes.hint ||
          storesRes.hint ||
          null
      );
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [daysFilter, brandFilter, fetchJson]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleRefresh = () => {
    loadDashboard();
  };

  const actionItems = summary?.actions ?? [];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-[#09090B]/80 backdrop-blur-xl border-b border-[#1e1e23]">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-[24px]">{project.emoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[18px] font-bold text-white tracking-tight">{project.name}</h1>
                {project.url ? (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3f3f46] hover:text-[#71717A] transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                ) : null}
              </div>
              <p className="text-[12px] text-[#52525B] mt-0.5">{project.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated ? (
              <span className="text-[11px] text-[#3f3f46] font-medium hidden sm:inline-block">
                {lastUpdated.toLocaleTimeString('ko-KR')}
              </span>
            ) : null}

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
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[16px] font-bold text-white tracking-tight">링크인바이오 핵심 행동 지표</h2>
            <p className="text-[12px] text-[#71717A] mt-1">
              CTA, 매장찾기, 소셜 유입을 중심으로 본 실제 사용자 반응 데이터입니다.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 bg-[#18181B] border border-[#27272A] rounded-lg px-1.5 py-1">
              {LINKINBIO_BRANDS.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => setBrandFilter(brand.id)}
                  className={`px-3 py-1 rounded-md text-[12px] font-bold transition-all ${
                    brandFilter === brand.id
                      ? 'bg-[#27272A] text-white shadow-sm'
                      : 'text-[#71717A] hover:text-[#A1A1AA]'
                  }`}
                >
                  {brand.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-1.5 w-max">
              <CalendarDays size={14} className="text-[#a1a1aa]" />
              <select
                value={daysFilter}
                onChange={(e) => setDaysFilter(e.target.value)}
                className="bg-transparent text-[13px] font-bold text-white outline-none cursor-pointer appearance-none px-1"
              >
                <option value="7" className="bg-[#18181B] text-white">최근 7일</option>
                <option value="14" className="bg-[#18181B] text-white">최근 14일</option>
                <option value="30" className="bg-[#18181B] text-white">최근 30일</option>
                <option value="90" className="bg-[#18181B] text-white">최근 90일</option>
              </select>
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-[#18181B] rounded-2xl p-6 border border-[#3f1d1d]">
            <h3 className="text-[15px] font-bold text-white">GA4 설정 확인이 필요합니다</h3>
            <p className="text-[13px] text-[#FCA5A5] mt-2">{error}</p>
            {setupHint ? (
              <p className="text-[12px] text-[#71717A] mt-3">점검 항목: {setupHint}</p>
            ) : null}
          </div>
        ) : null}

        {needsCustomDimensions ? (
          <div className="bg-[#18181B] rounded-2xl p-5 border border-[#27272A]">
            <p className="text-[13px] text-[#FDE68A] font-medium">
              일부 세부 차트는 GA4 커스텀 차원 등록 후 데이터가 채워집니다.
            </p>
            {setupHint ? (
              <p className="text-[12px] text-[#71717A] mt-2">{setupHint}</p>
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard title="활성 사용자" value={summary?.totalUsers ?? 0} icon={Users} iconColor="#818CF8" loading={loading} />
          <KpiCard title="전체 이벤트" value={summary?.totalEvents ?? 0} icon={MousePointerClick} iconColor="#F59E0B" loading={loading} />
          <KpiCard title="공식몰 클릭" value={summary?.officialMallClicks ?? 0} icon={ShoppingBag} iconColor="#FF6B6B" loading={loading} />
          <KpiCard title="멍BTI 클릭" value={summary?.meongbtiClicks ?? 0} icon={Share2} iconColor="#22C55E" loading={loading} />
          <KpiCard title="매장찾기 열기" value={summary?.storeFinderOpens ?? 0} icon={MapPinned} iconColor="#38BDF8" loading={loading} />
          <KpiCard title="매장 선택" value={summary?.storeSelections ?? 0} icon={Store} iconColor="#A78BFA" loading={loading} />
          <KpiCard title="소셜 클릭" value={summary?.socialClicks ?? 0} icon={Share2} iconColor="#F472B6" loading={loading} />
          <KpiCard title="내 위치 클릭" value={summary?.locateMeClicks ?? 0} icon={MapPinned} iconColor="#94A3B8" loading={loading} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <MetricListCard
            title="핵심 행동 분포"
            subtitle="어떤 CTA와 기능이 가장 많이 반응을 얻는지 보여줍니다."
            items={actionItems}
            color="#FF6B6B"
          />
          <MetricListCard
            title="트래픽 유입 경로"
            subtitle="선택한 기간 동안 어떤 채널로 들어왔는지 보여줍니다."
            items={traffic}
            color="#38BDF8"
            formatter={(value) => `${value.toLocaleString()}명`}
          />
        </div>

        <div className="bg-[#18181B] rounded-2xl p-6 border border-[#27272A]">
          <div className="mb-6">
            <h3 className="text-[15px] font-bold text-white">일별 트래픽 추이</h3>
            <p className="text-[12px] text-[#71717A] mt-1">활성 사용자와 전체 이벤트 수를 동시에 확인합니다.</p>
          </div>

          {loading ? (
            <div className="h-[280px] rounded-2xl animate-shimmer" />
          ) : trend.length === 0 ? (
            <EmptyPanel title="일별 트렌드" hint="아직 표시할 트렌드 데이터가 없습니다." />
          ) : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="linkinbioUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818CF8" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="linkinbioEvents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis yAxisId="left" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1c1c22',
                      border: '1px solid #2a2a32',
                      borderRadius: '12px',
                      color: '#fff',
                      fontWeight: 500,
                      fontSize: '12px',
                    }}
                    itemStyle={{ color: '#E4E4E7' }}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="users" name="활성 사용자" stroke="#818CF8" strokeWidth={2} fillOpacity={1} fill="url(#linkinbioUsers)" />
                  <Area yAxisId="right" type="monotone" dataKey="events" name="이벤트 수" stroke="#FF6B6B" strokeWidth={2} fillOpacity={1} fill="url(#linkinbioEvents)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <MetricListCard
            title="소셜 채널 분포"
            subtitle="어떤 소셜 채널 클릭이 가장 많이 발생했는지 보여줍니다."
            items={social}
            color="#F472B6"
          />
          <MetricListCard
            title="매장 필터 사용"
            subtitle="사용자가 가장 많이 눌러본 카테고리 필터입니다."
            items={filters}
            color="#22C55E"
          />
          <MetricListCard
            title="인기 매장 선택"
            subtitle="가장 많이 선택된 매장입니다."
            items={stores}
            color="#A78BFA"
            highlightDirect
          />
        </div>
      </main>
    </div>
  );
}
