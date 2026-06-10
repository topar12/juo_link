'use client';

import { useEffect, useState } from 'react';
import { Filter } from 'lucide-react';

interface FunnelStep {
  id: string;
  label: string;
  count: number;
}

interface FunnelChartProps {
  days: string;
}

export default function FunnelChart({ days }: FunnelChartProps) {
  const [data, setData] = useState<FunnelStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFunnel() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/ga4/funnel?days=${days}`);
        const text = await res.text();
        const json = JSON.parse(text);

        if (!res.ok) {
          throw new Error(json.error || 'Failed to fetch funnel');
        }

        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch funnel', err);
        setData([]);
        setError(err instanceof Error ? err.message : 'Failed to fetch funnel');
      } finally {
        setLoading(false);
      }
    }
    fetchFunnel();
  }, [days]);

  if (loading) {
    return <div className="bg-[#18181B] rounded-2xl h-[340px] border border-[#27272A] animate-shimmer" />;
  }

  if (error) {
    return (
      <div className="bg-[#18181B] rounded-2xl p-6 border border-[#27272A] flex items-center">
        <p className="text-[12px] text-[#FCA5A5]">GA4 퍼널 로드 실패: {error}</p>
      </div>
    );
  }

  if (data.length === 0) return null;

  const maxCount = data[0]?.count || 1;

  return (
    <div className="bg-[#18181B] rounded-2xl p-6 border border-[#27272A] flex flex-col h-full min-w-0">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className="text-[15px] font-bold text-white flex items-center gap-2">
            <Filter size={16} className="text-[#EC4899]" />
            전환 퍼널 (Funnel)
          </h3>
          <p className="text-[12px] text-[#71717A] mt-0.5">참여자 행동 기반 단계별 전환율</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-1">
        {data.map((step, index) => {
          const percentOfMax = (step.count / maxCount) * 100;

          // 직전 단계 대비 전환율 계산
          let conversionRate = 0;
          if (index > 0) {
            const prevCount = data[index - 1].count;
            conversionRate = prevCount > 0 ? (step.count / prevCount) * 100 : 0;
          }

          return (
            <div key={step.id} className="group relative py-2">
              <div
                className="absolute inset-y-0 left-0 bg-[#EC4899]/10 rounded-r-lg border-r-2 border-[#EC4899] transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(Math.max(percentOfMax, 2), 100)}%` }}
              />

              <div className="relative z-10 flex items-center justify-between px-3">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#27272A] text-[#A1A1AA] text-[10px] flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <span className="text-[13px] font-medium text-white group-hover:text-[#FBCFE8] transition-colors">
                    {step.label}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {index > 0 && (
                    <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-black/40 text-[#EC4899] border border-[#EC4899]/20">
                      {conversionRate.toFixed(1)}% 전환
                    </span>
                  )}
                  <span className="text-[14px] font-bold text-white w-14 text-right">
                    {step.count.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
