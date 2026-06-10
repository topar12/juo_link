'use client';

import { useEffect, useState } from 'react';
import { Share2, Users, ArrowRight } from 'lucide-react';

interface ShareData {
  id: string;
  label: string;
  count: number;
}

export default function ShareChart({ days }: { days: string }) {
  const [data, setData] = useState<ShareData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchShareData() {
      try {
        setLoading(true);
        const res = await fetch(`/admin/api/ga4/share?days=${days}`);
        if (!res.ok) throw new Error('API Error');
        const json = await res.json();
        if (json.success && isMounted) {
          setData(json.data);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setError('데이터를 불러오지 못했습니다.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchShareData();
    return () => { isMounted = false; };
  }, [days]);

  if (error) {
    return (
      <div className="bg-[#18181B] rounded-2xl p-6 border border-[#27272A] w-full text-center">
        <p className="text-[#EF4444] text-sm">{error}</p>
      </div>
    );
  }

  // 개별 지표를 안전하게 추출
  const nativeShare = data?.find(d => d.id === 'share_result')?.count || 0;
  const linkCopy = data?.find(d => d.id === 'copy_link')?.count || 0;
  const totalShares = nativeShare + linkCopy;
  const inboundVisit = data?.find(d => d.id === 'shared_link_visit')?.count || 0;

  // 단순 바이럴 유입률
  const viralRate = totalShares > 0 ? ((inboundVisit / totalShares) * 100).toFixed(1) : 0;

  return (
    <div className="bg-[#18181B] rounded-2xl p-6 border border-[#27272A] flex flex-col w-full h-full mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[16px] font-bold text-white tracking-tight flex items-center gap-2">
            <Share2 size={18} className="text-[#10B981]" />
            공유 유입 데이터 퍼널
          </h3>
          <p className="text-[12px] text-[#71717A] mt-1">
            유저 간 자발적 공유 횟수 대비 실제 신규 테스트 유입(Viral) 성과입니다.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
          <div className="h-28 bg-[#27272A] rounded-xl animate-pulse" />
          <div className="hidden md:block w-8 h-8 rounded animate-pulse bg-[#27272A]" />
          <div className="h-28 bg-[#27272A] rounded-xl animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
          {/* 카드 1: 공유하기 합계 */}
          <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-5 flex flex-col justify-center relative overflow-hidden h-28">
             <div className="absolute top-0 left-0 w-1 h-full bg-[#10B981]/50 rounded-r-xl" />
            <div className="flex justify-between items-start mb-2 pl-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#10B981]/10 flex items-center justify-center border border-[#10B981]/20">
                  <Share2 size={13} className="text-[#10B981]" />
                </div>
                <span className="text-[13px] font-bold text-white">공유하기 합계</span>
              </div>
              <div className="text-[11px] text-[#71717A] font-medium text-right bg-[#18181B] px-2 py-0.5 rounded-md border border-[#27272A]">
                네이티브 <span className="text-[#E4E4E7]">{nativeShare}</span> / 복사 <span className="text-[#E4E4E7]">{linkCopy}</span>
              </div>
            </div>
            <div className="pl-2 mt-1">
              <span className="text-[28px] font-extrabold text-white tracking-tight">{totalShares.toLocaleString()}</span>
              <span className="text-[13px] font-medium text-[#71717A] ml-1">회</span>
            </div>
          </div>

          {/* 카드 2: 화살표 */}
          <div className="hidden md:flex items-center justify-center p-2 rounded-full border border-[#27272A] bg-[#18181B] shadow-inner text-[#71717A]">
            <ArrowRight size={20} />
          </div>

          {/* 카드 3: 공유 링크 유입 */}
          <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-5 flex flex-col justify-center relative overflow-hidden h-28">
            <div className="absolute top-0 right-0 w-1 h-full bg-[#6366F1]/50 rounded-r-xl" />
            <div className="flex items-center gap-2 mb-2 pr-2">
              <div className="w-6 h-6 rounded-md bg-[#6366F1]/10 flex items-center justify-center border border-[#6366F1]/20">
                <Users size={13} className="text-[#6366F1]" />
              </div>
              <span className="text-[13px] font-bold text-white">공유 링크 유입</span>

              {totalShares > 0 && (
                <div className="ml-auto text-[11px] font-bold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                  유입률 {viralRate}%
                </div>
              )}
            </div>
            <div className="mt-1 pr-2">
              <span className="text-[28px] font-extrabold text-[#818CF8] tracking-tight">{inboundVisit.toLocaleString()}</span>
              <span className="text-[13px] font-medium text-[#71717A] ml-1">명</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
