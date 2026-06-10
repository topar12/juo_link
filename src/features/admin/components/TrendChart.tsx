'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

interface TrendData {
  date: string;
  label: string;
  users: number;
  events: number;
}

interface TrendChartProps {
  days: string;
}

export default function TrendChart({ days }: TrendChartProps) {
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrend() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/ga4/trend?days=${days}`);
        const text = await res.text();
        const json = JSON.parse(text);

        if (!res.ok) {
          throw new Error(json.error || 'Failed to fetch trend');
        }

        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch trend', err);
        setData([]);
        setError(err instanceof Error ? err.message : 'Failed to fetch trend');
      } finally {
        setLoading(false);
      }
    }
    fetchTrend();
  }, [days]);

  if (loading) {
    return <div className="bg-[#18181B] rounded-2xl h-[340px] border border-[#27272A] animate-shimmer" />;
  }

  if (error) {
    return (
      <div className="bg-[#18181B] rounded-2xl p-6 border border-[#27272A] flex items-center min-w-0">
        <p className="text-[12px] text-[#FCA5A5]">GA4 추이 로드 실패: {error}</p>
      </div>
    );
  }

  if (data.length === 0) return null;

  return (
    <div className="bg-[#18181B] rounded-2xl p-6 border border-[#27272A] col-span-1 xl:col-span-2 min-w-0">
      <div className="mb-6">
        <h3 className="text-[15px] font-bold text-white">기간별 트래픽 추이</h3>
        <p className="text-[12px] text-[#71717A] mt-0.5">
          일별 활성 사용자(Users) 및 이벤트(Events) 발생 수치
        </p>
      </div>

      <div className="h-[240px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#71717A', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#71717A', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#71717A', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1c1c22',
                border: '1px solid #2a2a32',
                borderRadius: '12px',
                color: '#fff',
                fontWeight: 500,
                fontSize: '12px'
              }}
              itemStyle={{ color: '#E4E4E7' }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="users"
              name="활성 사용자"
              stroke="#6366F1"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorUsers)"
              animationDuration={1000}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="events"
              name="이벤트 (우측)"
              stroke="#22C55E"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorEvents)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
