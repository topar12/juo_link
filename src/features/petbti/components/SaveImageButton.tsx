"use client";

import { useState, type CSSProperties, type ReactNode, type RefObject } from "react";

// snapdom 으로 캡처 대상(ref) DOM 을 PNG 로 저장하는 버튼.
// - snapdom 은 클릭 시점에 동적 import (서버 평가·초기 번들 회피).
// - .hide-on-capture 노드는 캡처에서 제외(excludeMode:"remove" → 빈 공간도 안 남김).
// - scale 2 로 고해상도 출력.
// - 실패 시 alert + console.error.

type SaveImageButtonProps = {
  /** 캡처할 루트 엘리먼트 ref (ResultCard / StoryCard 의 컨테이너). */
  targetRef: RefObject<HTMLElement | null>;
  /** 저장 파일명(확장자 제외 또는 포함 — snapdom 이 format 으로 png 부여). */
  filename: string;
  /** 버튼 라벨. 기본 "이미지 저장". */
  label?: ReactNode;
  /** 저장 성공 후 콜백(예: 분석 이벤트·토스트). */
  onSaved?: () => void;
  className?: string;
  style?: CSSProperties;
  /** 접근성 라벨(아이콘만 있는 경우). */
  ariaLabel?: string;
};

export default function SaveImageButton({
  targetRef,
  filename,
  label = "이미지 저장",
  onSaved,
  className,
  style,
  ariaLabel,
}: SaveImageButtonProps) {
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    const target = targetRef.current;
    if (!target || busy) {
      return;
    }

    setBusy(true);
    try {
      const { snapdom } = await import("@zumer/snapdom");
      const result = await snapdom(target, {
        scale: 2,
        exclude: [".hide-on-capture"],
        // "remove" → 제외 노드가 차지하던 레이아웃 공간까지 제거(캡처에 빈칸 방지).
        excludeMode: "remove",
        embedFonts: true,
        // 투명/누락 리소스 자리에 흰 배경(JPEG 외에도 안전한 기본 배경).
        backgroundColor: "#ffffff",
      });
      await result.download({ format: "png", filename });
      onSaved?.();
    } catch (error) {
      console.error("[petbti] 이미지 저장 실패:", error);
      alert("이미지 저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={busy}
      aria-label={ariaLabel}
      aria-busy={busy}
      style={style}
      className={
        className ??
        "hide-on-capture inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-charcoal bg-charcoal px-5 py-3 text-sm font-bold text-offwhite transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      {busy ? "저장 중…" : label}
    </button>
  );
}
