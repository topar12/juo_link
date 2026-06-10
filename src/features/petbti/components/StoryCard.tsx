"use client";

import { forwardRef, useState } from "react";
import type { TypeMeta } from "../data/types";

// 스토리 카드 — 9:16 (1080×1920) 인스타 스토리 캡처 전용.
// 화면 밖 고정(position:fixed; left:-9999px; top:0)으로 항상 마운트해 두고,
// SaveImageButton 이 이 root ref 를 snapdom 으로 캡처한다(forwardRef 로 ref 전달).
// ResultCard 와 같은 콘텐츠를 세로로 크게 재구성 + "@petfood.thejuo" 태그 + "/petbti" 안내.
//
// 캡처 전용이라 반응형/접근성보다 고정 픽셀 레이아웃의 정확성이 우선.
// 폰트는 embedFonts 로 snapdom 이 인라인하지만, 안전하게 시스템/Pretendard 기본만 사용.

type StoryCardProps = {
  meta: TypeMeta;
  /** 보호자가 업로드한 강아지 사진(data URL). 있으면 일러스트 아래 합성. */
  userPhoto?: string;
};

function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return hex;
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const StoryCard = forwardRef<HTMLDivElement, StoryCardProps>(function StoryCard(
  { meta, userPhoto },
  ref
) {
  const [jumeongFailed, setJumeongFailed] = useState(false);
  const jumeongSrc = `/images/petbti/jumeong/${meta.code}.webp`;
  const accent = meta.color;

  return (
    <div
      ref={ref}
      aria-hidden
      style={{
        position: "fixed",
        left: -9999,
        top: 0,
        width: 1080,
        height: 1920,
        pointerEvents: "none",
        zIndex: -1,
        // 캡처 배경 — 유형 컬러 옅은 그라데이션 위 오프화이트 패널.
        background: `linear-gradient(160deg, ${withAlpha(accent, 0.18)} 0%, #F9F8F6 55%)`,
        fontFamily: '"Pretendard", system-ui, -apple-system, sans-serif',
        color: "#1A202C",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        padding: "96px 80px",
      }}
    >
      {/* 헤더: 브랜드 + 코드 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: accent,
        }}
      >
        <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: "0.36em" }}>
          멍BTI
        </span>
        <span style={{ fontSize: 44, fontWeight: 900, letterSpacing: "0.18em" }}>
          {meta.code}
        </span>
      </div>

      {/* 일러스트 */}
      <div
        style={{
          marginTop: 64,
          width: "100%",
          height: 760,
          borderRadius: 48,
          overflow: "hidden",
          border: `6px solid ${accent}`,
          backgroundColor: withAlpha(accent, 0.16),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {jumeongFailed ? (
          <span style={{ fontSize: 280, lineHeight: 1 }} role="img" aria-label="강아지">
            🐶
          </span>
        ) : (
          <img
            src={jumeongSrc}
            alt=""
            onError={() => setJumeongFailed(true)}
            draggable={false}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}

        {userPhoto ? (
          <div
            style={{
              position: "absolute",
              bottom: 40,
              right: 40,
              width: 220,
              height: 220,
              transform: "rotate(3deg)",
              background: "#ffffff",
              padding: 12,
              borderRadius: 28,
              boxShadow: "0 12px 36px rgba(0,0,0,0.2)",
              border: `4px solid ${withAlpha(accent, 0.6)}`,
            }}
          >
            <img
              src={userPhoto}
              alt=""
              draggable={false}
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 18 }}
            />
          </div>
        ) : null}
      </div>

      {/* 별명 + 캐치프레이즈 */}
      <div style={{ marginTop: 64 }}>
        <h2
          style={{
            fontSize: 88,
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          {meta.nickname}
        </h2>
        <p
          style={{
            marginTop: 28,
            fontSize: 40,
            fontWeight: 500,
            lineHeight: 1.5,
            color: withAlpha("#1A202C", 0.72),
          }}
        >
          {meta.catchphrase}
        </p>
      </div>

      {/* 4축 traits 배지 */}
      <div style={{ marginTop: 40, display: "flex", flexWrap: "wrap", gap: 20 }}>
        {meta.traits.map((trait) => (
          <span
            key={trait}
            style={{
              display: "inline-flex",
              alignItems: "center",
              borderRadius: 999,
              padding: "18px 36px",
              fontSize: 38,
              fontWeight: 800,
              backgroundColor: withAlpha(accent, 0.14),
              color: accent,
            }}
          >
            {trait}
          </span>
        ))}
      </div>

      {/* 푸터: 태그 + 안내 (mt-auto 로 하단 고정) */}
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: `3px solid ${withAlpha(accent, 0.3)}`,
          paddingTop: 40,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 40, fontWeight: 900, color: accent }}>
            @petfood.thejuo
          </span>
          <span style={{ fontSize: 32, fontWeight: 600, color: withAlpha("#1A202C", 0.55) }}>
            나도 테스트하기 · lovejuo.com/petbti
          </span>
        </div>
        <span style={{ fontSize: 72, lineHeight: 1 }} role="img" aria-label="발자국">
          🐾
        </span>
      </div>
    </div>
  );
});

StoryCard.displayName = "StoryCard";

export default StoryCard;
