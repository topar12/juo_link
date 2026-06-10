'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { type ProjectConfig } from '@/features/admin/lib/constants';

interface TypeDonutChartProps {
  data: Record<string, number>;
  project: ProjectConfig;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: { code: string; percent: number; description: string };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-[#1c1c22] border border-[#2a2a32] rounded-xl px-4 py-3 shadow-xl">
      <p className="text-[13px] font-bold text-white mb-0.5">{item.name}</p>
      <p className="text-[11px] text-[#71717A]">{item.payload.description}</p>
      <div className="flex items-baseline gap-1.5 mt-1.5">
        <span className="text-[16px] font-extrabold text-white">
          {item.value.toLocaleString()}
        </span>
        <span className="text-[11px] text-[#71717A]">
          명 ({item.payload.percent.toFixed(1)}%)
        </span>
      </div>
    </div>
  );
}

export default function TypeDonutChart({ data, project }: TypeDonutChartProps) {
  const total = data.total || 0;
  const chartData = Object.entries(project.types ?? {}).map(([code, info]) => ({
    code,
    name: info.label,
    description: info.description,
    value: data[code] || 0,
    color: info.color,
    percent: total > 0 ? ((data[code] || 0) / total) * 100 : 0,
  }));

  const sorted = [...chartData].sort((a, b) => b.value - a.value);

  return (
    <div className="bg-[#18181B] rounded-2xl p-6 border border-[#27272A] min-w-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[15px] font-bold text-white">유형 분포</h3>
          <p className="text-[12px] text-[#52525B] mt-0.5">성격 유형별 비율</p>
        </div>
        <span className="text-[11px] text-[#52525B] font-medium bg-[#27272A] px-2.5 py-1 rounded-lg">
          전체 {total.toLocaleString()}명
        </span>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-6">
        <div className="w-[220px] h-[220px] flex-shrink-0 relative z-10">
          {/* 중앙 텍스트 (툴팁과 겹치지 않도록 차트 뒤에 배치) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
            <span className="text-[22px] font-extrabold text-white">{total.toLocaleString()}</span>
            <span className="text-[10px] text-[#52525B] font-medium">전체 참여</span>
          </div>

          <ResponsiveContainer width="100%" height="100%" className="relative z-10">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.code} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'transparent' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 w-full space-y-2">
          {sorted.map((item, index) => (
            <div key={item.code} className="flex items-center gap-3 group cursor-default">
              <span className="text-[11px] text-[#3f3f46] font-mono w-4 text-right">{index + 1}</span>
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform duration-200 group-hover:scale-125"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[13px] text-[#A1A1AA] font-medium flex-1 group-hover:text-white transition-colors">
                {item.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-white tabular-nums">
                  {item.value.toLocaleString()}
                </span>
                <span className="text-[11px] text-[#52525B] font-medium w-12 text-right tabular-nums">
                  {item.percent.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
