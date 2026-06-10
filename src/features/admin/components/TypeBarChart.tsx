'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { type ProjectConfig } from '@/features/admin/lib/constants';

interface TypeBarChartProps {
  data: Record<string, number>;
  project: ProjectConfig;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: { code: string; name: string; value: number; color: string; description: string };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-[#1c1c22] border border-[#2a2a32] rounded-xl px-4 py-3 shadow-xl">
      <p className="text-[13px] font-bold text-white">{item.name}</p>
      <p className="text-[11px] text-[#71717A]">{item.description}</p>
      <p className="text-[15px] font-extrabold text-white mt-1">
        {item.value.toLocaleString()}명
      </p>
    </div>
  );
}

export default function TypeBarChart({ data, project }: TypeBarChartProps) {
  const chartData = Object.entries(project.types ?? {})
    .map(([code, info]) => ({
      code,
      name: info.label,
      description: info.description,
      value: data[code] || 0,
      color: info.color,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="bg-[#18181B] rounded-2xl p-6 border border-[#27272A] min-w-0">
      <div className="mb-6">
        <h3 className="text-[15px] font-bold text-white">유형별 참여 수</h3>
        <p className="text-[12px] text-[#52525B] mt-0.5">참여자 수 기준 내림차순</p>
      </div>

      <div className="h-[280px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
            barCategoryGap="20%"
          >
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#52525B', fontSize: 11 }} />
            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 12, fontWeight: 500 }} width={65} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} animationDuration={800}>
              {chartData.map((entry) => (
                <Cell key={entry.code} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
