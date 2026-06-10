"use client";

import { useState } from "react";
import type { TypeMeta } from "../data/types";

// 결과 카드 — 공유/다운로드 캡처 대상(snapdom).
// 주멍이 일러스트를 큰 정사각 히어로로 두고, 그 아래 별명·캐치프레이즈·4축 배지.
// meta.color 를 액센트로. 외부 폰트는 절제하고 인라인 스타일(유형 컬러) 위주로 구성한다.

type ResultCardProps = {
  meta: TypeMeta;
  /** 보호자가 업로드한 강아지 사진(data URL). 있으면 일러스트 우하단에 폴라로이드로 합성. */
  userPhoto?: string;
};

// #RRGGBB → rgba(.., alpha).
function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return hex;
  const int = parseInt(m[1], 16);
  return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`;
}

export default function ResultCard({ meta, userPhoto }: ResultCardProps) {
  // 주멍이 이미지 로드 실패 시 색 배경 폴백(에셋 미제공 단계에서도 안 깨지게).
  const [jumeongFailed, setJumeongFailed] = useState(false);
  const jumeongSrc = `/images/petbti/jumeong/${meta.code}.webp`;
  const accent = meta.color;

  return (
    <div
      className="relative w-full max-w-[420px] overflow-hidden rounded-[32px] bg-white shadow-[0_16px_48px_rgba(0,0,0,0.1)]"
      style={{ border: `1px solid ${withAlpha(accent, 0.3)}` }}
    >
      {/* 히어로 일러스트 — 큰 정사각(주멍이 원본이 정사각이라 크롭 최소) */}
      <div
        className="relative aspect-square w-full overflow-hidden"
        style={{ backgroundColor: withAlpha(accent, 0.12) }}
      >
        {jumeongFailed ? (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${withAlpha(accent, 0.22)} 0%, ${withAlpha(accent, 0.45)} 100%)`,
            }}
          >
            <span className="text-[96px] leading-none" role="img" aria-label="강아지">
              🐶
            </span>
          </div>
        ) : (
          <img
            src={jumeongSrc}
            alt={`${meta.nickname} 일러스트`}
            className="h-full w-full object-cover"
            onError={() => setJumeongFailed(true)}
            draggable={false}
          />
        )}

        {/* 상단 라벨 — 옅은 그라데이션 위 알약 배지(가독성) */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.22), rgba(0,0,0,0))" }}
        >
          <span
            className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] shadow-sm"
            style={{ color: accent }}
          >
            멍BTI
          </span>
          <span
            className="rounded-full px-3 py-1 text-[11px] font-black tracking-[0.16em] text-white shadow-sm"
            style={{ backgroundColor: accent }}
          >
            {meta.code}
          </span>
        </div>

        {/* 보호자 사진 — 우하단 폴라로이드 */}
        {userPhoto ? (
          <div
            className="absolute bottom-4 right-4 h-28 w-28 rotate-3 overflow-hidden rounded-2xl bg-white p-1.5 shadow-xl"
            style={{ border: `2px solid ${withAlpha(accent, 0.6)}` }}
          >
            <img
              src={userPhoto}
              alt="우리 아이 사진"
              className="h-full w-full rounded-xl object-cover"
              draggable={false}
            />
          </div>
        ) : null}
      </div>

      {/* 정보 — 별명 + 캐치프레이즈 + 4축 배지 */}
      <div
        className="flex flex-col gap-3 px-6 pb-5 pt-5"
        style={{ background: `linear-gradient(to bottom, ${withAlpha(accent, 0.07)}, #ffffff 70%)` }}
      >
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[26px] font-black leading-tight tracking-tight text-charcoal">
            {meta.nickname}
          </h2>
          <p className="text-sm font-medium leading-relaxed text-charcoal/65">
            {meta.catchphrase}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {meta.traits.map((trait) => (
            <span
              key={trait}
              className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold"
              style={{ backgroundColor: withAlpha(accent, 0.14), color: accent }}
            >
              {trait}
            </span>
          ))}
        </div>
      </div>

      {/* 워터마크 푸터 */}
      <div
        className="flex items-center justify-between px-6 py-3"
        style={{ backgroundColor: withAlpha(accent, 0.1) }}
      >
        <span className="text-[11px] font-bold tracking-tight text-charcoal/55">
          멍BTI 행동학 테스트
        </span>
        <span className="text-[11px] font-black tracking-tight" style={{ color: accent }}>
          펫푸드 주오
        </span>
      </div>
    </div>
  );
}
