"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resultsData } from '@/features/petbti/data/questions';
import * as htmlToImage from 'html-to-image';
import { InstagramLogo, CheckCircle, Copy, ArrowCounterClockwise, Sparkle, MagicWand, DownloadSimple, ArrowRight, Camera, Users, ShareNetwork, CaretDown } from '@phosphor-icons/react';
import { incrementResultCount, getResultStats, logEvent } from '@/features/petbti/firebase';

// resultId → Firestore typeCode 매핑
const resultToTypeCode: Record<string, string> = {
  result1: 'EGA', result2: 'EGI', result3: 'EPI', result4: 'CGA',
  result5: 'CGI', result6: 'CPA', result7: 'CPI', result8: 'EPA',
};

export function ResultScreen({ resultId, onRestart }: { resultId: string, onRestart: () => void }) {
  const data = resultsData[resultId as keyof typeof resultsData] || resultsData.result7;
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [statPercent, setStatPercent] = useState<number | null>(null);
  const [statTotal, setStatTotal] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const typeCode = resultToTypeCode[resultId] || 'CPI';

  // Firebase: 결과 카운트 증가 + 통계 로드
  useEffect(() => {
    const doStats = async () => {
      await incrementResultCount(typeCode);
      const stats = await getResultStats();
      if (stats && stats.total > 0) {
        const myCount = stats[typeCode] || 0;
        setStatPercent(Math.round((myCount / stats.total) * 1000) / 10);
        setStatTotal(stats.total);
      }
    };
    doStats();
    // GA4 커스텀 이벤트
    logEvent('quiz_complete', { result_type: typeCode, result_title: data.title });
  }, [typeCode, data.title]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCustomPhoto(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    logEvent('photo_upload', { result_type: typeCode });
  };

  const handleCopyTags = () => {
    navigator.clipboard.writeText('#멍BTI #펫푸드주오 #강아지성향테스트 #강아지mbti #강아지수제간식');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    logEvent('copy_tags');
  };

  const handleDownload = async () => {
    if (!ticketRef.current || isDownloading) return;
    setIsDownloading(true);
    logEvent('result_download', { result_type: typeCode });

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await htmlToImage.toPng(ticketRef.current, {
        pixelRatio: 2,
        backgroundColor: '#FDFCF8',
        filter: (node) => {
          const el = node as HTMLElement;
          return !el?.classList?.contains('hide-on-capture');
        },
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });

      const link = document.createElement('a');
      link.download = `멍BTI_결과_${data.type.replace(/[^A-Za-z]/g, '')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to capture image', error);
      alert('이미지 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    const targetUrl = `${window.location.origin}/petbti?r=${resultId}&utm_source=share_link&utm_medium=social&utm_campaign=meong_bti_share`;
    const shareData = {
      title: '멍-BTI 성향 테스트',
      text: `🐶 우리 아이는 [${data.type}] ${data.title} 유형이에요!\n너네 댕댕이의 기질에 맞는 맞춤 간식도 추천받아보세요! 👇`,
      url: targetUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        logEvent('share_result', { result_type: typeCode });
      } catch (err) {
        console.log('Share canceled', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(targetUrl);
        alert('테스트참여 링크가 복사되었습니다!');
        logEvent('copy_link', { result_type: typeCode });
      } catch (err) {
        alert('링크 복사에 실패했습니다.');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="flex-1 flex flex-col w-full h-full bg-[#1C1B1A] text-white overflow-y-auto selection:bg-[#FDFCF8]/20"
    >
      <div className="flex-1 flex flex-col p-5 sm:p-6 w-full max-w-md mx-auto min-h-[90vh] pb-12 pt-8">

        {/* MBTI Explanation Toggle */}
        <div className="mb-6 w-full">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 flex items-center justify-between transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#A8BBA2]/20 flex items-center justify-center">
                <span className="text-[18px]">🔬</span>
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <span className="font-bold text-white/90 text-[13px] sm:text-[14px]">멍-BTI 기질 분석 시스템 안내</span>
                <span className="text-[11px] text-[#A8BBA2] font-medium tracking-wide">C-BARQ, MCPQ Framework</span>
              </div>
            </div>
            <div className={`w-7 h-7 rounded-full bg-white/5 flex items-center justify-center transition-transform duration-300 ${showExplanation ? 'rotate-180' : ''}`}>
              <CaretDown weight="bold" size={14} className="text-white/70" />
            </div>
          </button>

          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 pb-2 w-full">
                  <div className="bg-[#242220] p-5 rounded-[1.25rem] text-sm shadow-inner border border-white/5 relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#A8BBA2] rounded-l-[1.25rem]"></div>
                    <p className="text-[12px] text-white/60 leading-relaxed mb-4 break-keep font-medium pl-1">
                      실제 수의학·행동학에서 사용하는 기질 평가 지표를 바탕으로 우리 아이의 핵심 본능 3가지를 분석합니다.
                    </p>
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 ml-1">
                      <ul className="space-y-3.5 text-white/80 font-bold text-xs">
                        <li className="flex items-center gap-3.5">
                          <span className="w-10 text-center bg-white/5 border border-white/10 rounded-lg py-1.5 text-[10px] text-white/90 shadow-sm">E/C</span>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-white/50 tracking-wider">ENERGY</span>
                            <span className="text-[11px] text-white/80">활동 에너지 (활동적 ↔ 차분함)</span>
                          </div>
                        </li>
                        <li className="flex items-center gap-3.5">
                          <span className="w-10 text-center bg-white/5 border border-white/10 rounded-lg py-1.5 text-[10px] text-white/90 shadow-sm">G/P</span>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-white/50 tracking-wider">GASTRONOMY</span>
                            <span className="text-[11px] text-white/80">식탐 수준 (폭풍흡입 ↔ 까탈입맛)</span>
                          </div>
                        </li>
                        <li className="flex items-center gap-3.5">
                          <span className="w-10 text-center bg-white/5 border border-white/10 rounded-lg py-1.5 text-[10px] text-white/90 shadow-sm">I/A</span>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-white/50 tracking-wider">INDEPENDENCE</span>
                            <span className="text-[11px] text-white/80">독립성 (독립적 ↔ 불안/껌딱지)</span>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BLOCK 1: Capture-able Result Card */}
        <div
          ref={ticketRef}
          className="relative w-full rounded-[1.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col p-7 sm:p-8 pb-10 items-start overflow-hidden mb-6 border border-white/5"
          style={{
            backgroundColor: '#FDFCF8',
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
            '--accent': data.bgColor
          } as React.CSSProperties}
        >
          {/* Header Row */}
          <div className="w-full flex justify-between items-start mb-8 z-10">
            <span className="bg-[#1C1B1A] text-[#FDFCF8] px-3 py-1.5 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-medium rounded-md shadow-sm">
              MEONG-BTI RESULT
            </span>
            <span className="text-[10px] text-[#1C1B1A] font-bold tracking-widest uppercase flex items-center gap-1.5 opacity-40">
              <Sparkle weight="fill" /> Petfood Juo
            </span>
          </div>

          {/* Main Result Image */}
          <div
            className="w-[90%] mx-auto aspect-square rounded-[1.5rem] mb-10 relative flex items-center justify-center z-10 cursor-pointer group"
            style={{ boxShadow: `0 25px 50px -12px ${data.bgColor}60, 0 0 40px -10px ${data.bgColor}40` }}
            onClick={() => fileInputRef.current?.click()}
          >
            <img
              src={customPhoto ?? `/images/petbti/${data.type.replace(/[\s\-형]/g, '')}.jpg`}
              alt={`${data.title} 캐릭터`}
              className="w-full h-full object-cover rounded-[1.5rem] relative z-10 bg-white"
              crossOrigin="anonymous"
            />
            <div className="absolute inset-0 scale-105 blur-2xl opacity-40 z-0 rounded-[1.5rem]" style={{ backgroundColor: data.bgColor }}></div>
            <div className="hide-on-capture absolute inset-0 z-20 rounded-[1.5rem] bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <Camera weight="fill" size={32} className="text-white/90" />
              <span className="text-white font-bold text-sm tracking-wide">{customPhoto ? '사진 변경하기' : '내 강아지 사진으로 바꾸기'}</span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />

          {/* Typography Hierarchy */}
          <div className="mb-2 w-full flex flex-col items-center text-center z-10">
            <div
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full shadow-sm mb-5 text-white"
              style={{ backgroundColor: data.bgColor }}
            >
              <MagicWand weight="fill" size={12} className="opacity-90" />
              <span className="text-[12px] font-bold tracking-[0.1em] drop-shadow-sm">{data.type}</span>
            </div>

            <h1 className="text-[28px] sm:text-[32px] text-[#111] leading-[1.2] mb-5 tracking-tighter font-black break-keep text-balance">
              {data.title}
            </h1>

            {/* 실시간 통계 뱃지 */}
            {statPercent !== null && statTotal !== null && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#888] mb-5 font-medium">
                <Users weight="bold" size={13} />
                <span>
                  전체 <strong className="text-[#555]">{statTotal.toLocaleString()}</strong>명 중 <strong className="text-[#555]">{statPercent}%</strong>만 이 유형!
                </span>
              </div>
            )}

            <div className="w-8 h-1 mb-6 rounded-full opacity-80" style={{ backgroundColor: data.bgColor }}></div>

            <p className="text-[#444] leading-[1.7] text-[13px] sm:text-[14px] break-keep font-medium text-center w-full px-2">
              {data.behaviorAnalysis}
            </p>
          </div>
        </div>

        {/* Photo Upload Hint */}
        <div className="hide-on-capture flex items-center justify-center gap-2 text-white/40 text-[12px] font-medium mb-4 tracking-wide">
          <Camera weight="duotone" size={15} />
          <span>사진을 탭하면 내 강아지 사진으로 교체할 수 있어요</span>
        </div>

        {/* BLOCK 2: Download & Share & Restart */}
        <div className="flex flex-col gap-3 w-full mb-8">
          <div className="flex gap-3 w-full">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white font-semibold py-4 px-2 rounded-[1.25rem] flex items-center justify-center gap-1.5 transition-all duration-300 active:scale-95 disabled:opacity-50 border border-white/10 backdrop-blur-md"
            >
              <DownloadSimple weight="bold" size={18} className={isDownloading ? 'animate-bounce' : ''} style={{ color: data.bgColor }} />
              <span className="tracking-[0.05em] text-[13px] sm:text-[14px]">{isDownloading ? '저장중...' : '이미지 저장'}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white font-semibold py-4 px-2 rounded-[1.25rem] flex items-center justify-center gap-1.5 transition-all duration-300 active:scale-95 border border-white/10 backdrop-blur-md"
            >
              <ShareNetwork weight="bold" size={18} style={{ color: data.bgColor }} />
              <span className="tracking-[0.05em] text-[13px] sm:text-[14px]">테스트 공유</span>
            </button>
          </div>

          <button
            onClick={onRestart}
            className="w-full bg-transparent hover:bg-white/5 text-white/90 font-bold py-4 px-4 rounded-[1.25rem] flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 border border-white/20 border-dashed"
          >
            <ArrowCounterClockwise weight="bold" size={16} className="opacity-80" />
            <span className="tracking-widest text-[13.5px] sm:text-[14px]">다시하기</span>
          </button>
        </div>

        {/* BLOCK 3: Custom Solution */}
        <div className="bg-[#242220] p-7 rounded-[1.5rem] text-white relative shadow-2xl w-full mb-8 border border-white/10 overflow-hidden">
          <div className="absolute top-0 right-0 p-5 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
            <Sparkle weight="fill" size={120} />
          </div>

          <div className="flex flex-col gap-3 mb-6 pb-6 border-b border-white/10">
            <p className="text-[10px] text-white/40 tracking-[0.2em] font-bold uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: data.bgColor }}></span>
              Custom Solution
            </p>

            <div
              className="self-start flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-black tracking-wide text-white shadow-md"
              style={{ backgroundColor: data.bgColor }}
            >
              <span className="w-2 h-2 rounded-full bg-white/60"></span>
              {data.type}
            </div>

            <h3 className="text-[19px] sm:text-[21px] font-black tracking-tight break-keep leading-snug text-white/90">
              우리 아이에게 꼭 필요한<br/>맞춤 간식은?
            </h3>
          </div>

          <div className="flex flex-col gap-3 relative z-10">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2 break-keep">
              {data.recommendedProduct}
            </h2>
            <p className="text-[13px] sm:text-[14px] text-white/60 leading-[1.6] break-keep font-medium">
              {data.productReason}
            </p>
          </div>
        </div>

        {/* BLOCK 4: Premium Shopping Mall CTA */}
        <div className="w-full mb-10">
          <a
            href="https://www.lovejuo.com/shop/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => logEvent('shop_click', { result_type: typeCode })}
            className="group relative w-full bg-[#1C1B1A] p-7 rounded-[1.5rem] shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-start active:scale-[0.98] border border-white/10 overflow-hidden"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-tr from-transparent via-white to-transparent pointer-events-none"></div>

            <span className="text-[#E8D18C] text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-bold mb-3 flex items-center gap-2">
              Premium Shop
            </span>

            <h4 className="text-[17px] sm:text-[19px] font-bold tracking-tight text-white/95 leading-snug mb-3 break-keep relative z-10">
              수의사가 직접 만든 프리미엄 수제간식<br/>공식몰에서 최저가 혜택받기
            </h4>

            <p className="text-[12px] sm:text-[13px] text-white/50 tracking-wide font-medium leading-relaxed mb-6 break-keep relative z-10">
              100% 휴먼그레이드 바른 먹거리부터 믿을 수 있는 베스트 용품까지.
            </p>

            <div className="w-full flex items-center justify-between relative z-10 border-t border-white/10 pt-5 mt-auto">
              <span className="text-[11px] sm:text-[12px] font-bold tracking-widest text-[#E8D18C]/80 group-hover:text-[#E8D18C] transition-colors uppercase">
                쇼핑몰 바로가기
              </span>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#E8D18C]/20 group-hover:text-[#E8D18C] transition-all duration-300 text-white/50">
                <ArrowRight weight="bold" size={14} />
              </div>
            </div>
          </a>
        </div>

        {/* BLOCK 5: Viral Sharing Section */}
        <div className="p-6 sm:p-7 rounded-[1.5rem] w-full mb-10 flex flex-col items-center bg-black/20 border border-white/5 shadow-inner">
          <h3 className="text-[12px] sm:text-[13px] font-bold mb-6 text-white/50 tracking-[0.1em] uppercase">
            인스타에 결과 공유하고 간식 받기
          </h3>

          <div className="w-full space-y-3 mb-5">
            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/60 shrink-0">1</div>
              <p className="text-[12px] sm:text-[13px] text-white/80 font-medium">위 버튼으로 <strong className="text-white">이미지 저장하기</strong></p>
            </div>
            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/60 shrink-0">2</div>
              <p className="text-[12px] sm:text-[13px] text-white/80 font-medium">
                <a href="https://instagram.com/petfood.thejuo" target="_blank" rel="noopener noreferrer" className="font-bold text-white hover:text-[#E8D18C] underline decoration-white/30 underline-offset-4 transition-colors">@petfood.thejuo</a> 팔로우
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/60 shrink-0">3</div>
              <p className="text-[12px] sm:text-[13px] text-white/80 font-medium">해시태그와 함께 인스타 <strong className="text-white">스토리 공유</strong></p>
            </div>
            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/60 shrink-0">4</div>
              <div className="flex-1 flex items-center justify-between gap-3">
                <p className="text-[12px] sm:text-[13px] text-white/80 font-medium">DM으로 <strong className="text-white">참여 완료</strong> 메시지 보내기</p>
                <a
                  href="https://instagram.com/petfood.thejuo"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => logEvent('dm_click', { result_type: typeCode })}
                  className="shrink-0 relative overflow-hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[11px] text-white border border-white/10 active:scale-95 group/dm transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F56040]"></div>
                  <InstagramLogo weight="fill" size={13} className="relative z-10" />
                  <span className="relative z-10">DM 보내기</span>
                </a>
              </div>
            </div>
          </div>

          <button
            onClick={handleCopyTags}
            className="text-[12px] font-bold tracking-wide bg-white/10 hover:bg-white/20 p-4 rounded-xl transition-all flex items-center justify-between w-full border border-white/10 active:scale-95"
          >
            <span className="text-white/60 font-normal truncate mr-4">#멍BTI #펫푸드주오...</span>
            <span className="flex items-center gap-1.5 shrink-0 transition-colors" style={{ color: copied ? '#4ADE80' : data.bgColor }}>
              {copied ? <><CheckCircle weight="fill" size={16} /> 복사완료</> : <><Copy weight="bold" size={16} /> 태그 복사</>}
            </span>
          </button>
        </div>

      </div>
    </motion.div>
  );
}
