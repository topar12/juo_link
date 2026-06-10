"use client";

import { useState } from "react";
import type { TypeMeta } from "../data/types";

// 결과 카드 — 1:1 정사각 캡처 대상(snapdom).
// 구성: 주멍이 일러스트(없으면 색 배경 폴백) + 유형 코드 + 별명 + 캐치프레이즈
//      + 4축 traits 배지 + (userPhoto 있으면 합성 영역) + 워터마크.
// meta.color 를 액센트로 사용. 캡처 안정성을 위해 외부 폰트/그라데이션은 절제하고
// 인라인 스타일(유형 컬러)·기본 팔레트(globals.css) 위주로 구성한다.

type ResultCardProps = {
  meta: TypeMeta;
  /** 보호자가 업로드한 강아지 사진(data URL). 있으면 우상단에 폴라로이드처럼 합성. */
  userPhoto?: string;
};

// #RRGGBB → rgba(.., alpha). 유형 컬러로 옅은 배경/테두리를 만들 때 사용.
function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return hex;
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function ResultCard({ meta, userPhoto }: ResultCardProps) {
  // 주멍이 이미지 로드 실패 시 색 배경 폴백으로 전환(이미지 미제공 단계에서도 깨지지 않게).
  const [jumeongFailed, setJumeongFailed] = useState(false);
  const jumeongSrc = `/images/petbti/jumeong/${meta.code}.png`;
  const accent = meta.color;

  return (
    <div
      className="relative flex aspect-square w-full max-w-[420px] flex-col overflow-hidden rounded-[28px] bg-offwhite"
      style={{ border: `3px solid ${accent}` }}
    >
      {/* 상단 액센트 바 + 코드 라벨 */}
      <div
        className="flex items-center justify-between px-6 pt-5"
        style={{ color: accent }}
      >
        <span className="text-xs font-black uppercase tracking-[0.32em]">멍BTI</span>
        <span className="text-sm font-black tracking-[0.2em]">{meta.code}</span>
      </div>

      {/* 일러스트 + (선택) 사용자 사진 합성 영역 */}
      <div className="relative mx-6 mt-3 flex-1 overflow-hidden rounded-3xl">
        {jumeongFailed ? (
          // 폴백: 유형 컬러 그라데이션 + 발자국 이모지(이미지 미제공 시).
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${withAlpha(accent, 0.22)} 0%, ${withAlpha(accent, 0.42)} 100%)`,
            }}
          >
            <span className="text-[64px] leading-none" role="img" aria-label="강아지">
              🐶
            </span>
          </div>
        ) : (
          <img
            src={jumeongSrc}
            alt={`${meta.nickname} 일러스트`}
            className="h-full w-full object-cover"
            style={{ backgroundColor: withAlpha(accent, 0.16) }}
            onError={() => setJumeongFailed(true)}
            draggable={false}
          />
        )}

        {userPhoto ? (
          // 보호자 사진 — 우하단 폴라로이드 합성.
          <div
            className="absolute bottom-3 right-3 h-24 w-24 rotate-3 overflow-hidden rounded-xl bg-white p-1 shadow-lg"
            style={{ border: `2px solid ${withAlpha(accent, 0.6)}` }}
          >
            <img
              src={userPhoto}
              alt="우리 아이 사진"
              className="h-full w-full rounded-lg object-cover"
              draggable={false}
            />
          </div>
        ) : null}
      </div>

      {/* 별명 + 캐치프레이즈 */}
      <div className="px-6 pt-4">
        <h2 className="text-2xl font-black leading-tight tracking-tight text-charcoal">
          {meta.nickname}
        </h2>
        <p className="mt-1.5 text-sm font-medium leading-relaxed text-charcoal/70">
          {meta.catchphrase}
        </p>
      </div>

      {/* 4축 traits 배지 */}
      <div className="flex flex-wrap gap-2 px-6 pb-5 pt-3">
        {meta.traits.map((trait) => (
          <span
            key={trait}
            className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold"
            style={{
              backgroundColor: withAlpha(accent, 0.14),
              color: accent,
            }}
          >
            {trait}
          </span>
        ))}
      </div>

      {/* 워터마크 푸터 */}
      <div
        className="flex items-center justify-between px-6 py-3"
        style={{ backgroundColor: withAlpha(accent, 0.1) }}
      >
        <span className="text-[11px] font-bold tracking-tight text-charcoal/60">
          멍BTI 행동학 테스트
        </span>
        <span className="text-[11px] font-black tracking-tight" style={{ color: accent }}>
          펫푸드 주오
        </span>
      </div>
    </div>
  );
}
