'use client';

import { useEffect, useState } from 'react';
import { Network } from 'lucide-react';

interface SourceData {
  id: string;
  label: string;
  users: number;
}

interface SourceChartProps {
  days: string;
}

export default function SourceChart({ days }: SourceChartProps) {
  const [data, setData] = useState<SourceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSources() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/admin/api/ga4/traffic?days=${days}`);
        const text = await res.text();
        const json = JSON.parse(text);

        if (!res.ok) {
          throw new Error(json.error || 'Failed to fetch sources');
        }

        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch sources', err);
        setData([]);
        setError(err instanceof Error ? err.message : 'Failed to fetch sources');
      } finally {
        setLoading(false);
      }
    }
    fetchSources();
  }, [days]);

  if (loading) {
    return <div className="bg-[#18181B] rounded-2xl h-[340px] border border-[#27272A] animate-shimmer" />;
  }

  if (error) {
    return (
      <div className="bg-[#18181B] rounded-2xl p-6 border border-[#27272A] flex items-center">
        <p className="text-[12px] text-[#FCA5A5]">GA4 유입 경로 로드 실패: {error}</p>
      </div>
    );
  }

  if (data.length === 0) return null;

  const total = data.reduce((sum, item) => sum + item.users, 0);

  return (
    <div className="bg-[#18181B] rounded-2xl p-6 border border-[#27272A] flex flex-col h-full min-w-0">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-[15px] font-bold text-white flex items-center gap-2">
            <Network size={16} className="text-[#F59E0B]" />
            트래픽 유입 경로
          </h3>
          <p className="text-[12px] text-[#71717A] mt-0.5">선택한 기간 접속 채널별 비율</p>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        {data.map((item, index) => {
          const percent = total > 0 ? (item.users / total) * 100 : 0;
          return (
            <div key={item.id} className="relative">
              <div className="flex justify-between items-end mb-1.5 relative z-10">
                <span className="text-[13px] font-medium text-[#E4E4E7]">
                  {item.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-white">
                    {item.users.toLocaleString()}명
                  </span>
                  <span className="text-[11px] font-mono text-[#71717A] w-10 text-right">
                    {percent.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="w-full h-1.5 bg-[#27272A] rounded-full overflow-hidden relative z-0">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: index === 0 ? '#F59E0B' : index === 1 ? '#FBBF24' : '#FCD34D',
                    opacity: 1 - (index * 0.15)
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
