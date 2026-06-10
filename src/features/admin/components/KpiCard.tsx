import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  subtitle?: string;
  loading?: boolean;
  badge?: ReactNode;
}

export default function KpiCard({
  title,
  value,
  icon: Icon,
  iconColor = '#6366F1',
  subtitle,
  loading = false,
  badge,
}: KpiCardProps) {
  if (loading) {
    return (
      <div className="bg-[#18181B] rounded-2xl p-5 border border-[#27272A]">
        <div className="flex items-start justify-between mb-4">
          <div className="w-9 h-9 rounded-xl animate-shimmer" />
        </div>
        <div className="h-8 w-24 rounded-lg animate-shimmer mb-2" />
        <div className="h-4 w-16 rounded animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="group bg-[#18181B] rounded-2xl p-5 border border-[#27272A] hover:border-[#3f3f46] transition-all duration-300 hover:shadow-lg hover:shadow-black/20">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon size={18} style={{ color: iconColor }} />
        </div>
        {badge}
      </div>

      <p className="text-[28px] font-extrabold text-white tracking-tight leading-none mb-1.5">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      <div className="flex items-center gap-2">
        <p className="text-[12px] text-[#71717A] font-medium">{title}</p>
        {subtitle && (
          <span className="text-[10px] text-[#52525B] font-medium bg-[#27272A] px-1.5 py-0.5 rounded">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
