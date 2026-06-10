"use client";

import { useEffect, useState } from "react";
import { ChatCircleDots, Export, LinkSimple, Check } from "@phosphor-icons/react";
import type { TypeMeta } from "../data/types";
import { trackPetbti } from "@/features/petbti/lib/ga";
import { shareKakao, isKakaoShareAvailable } from "../lib/kakao";

// 공유 버튼 3종 — 카카오 / navigator.share(네이티브) / 링크 복사.
// - 카카오: 앱 키 있을 때만 노출. 실패 시 링크 복사로 폴백.
// - 네이티브: navigator.share 지원 시. 미지원이면 버튼 자체를 링크 복사로 대체.
// - 각 공유 클릭에 trackPetbti("share_result", { result_type }) / 복사엔 "copy_link".
//
// props:
//   meta       유형 메타(코드·별명·캐치프레이즈)
//   resultUrl  공유할 결과 페이지 URL(절대 URL 권장)
//   ogUrl      카카오 미리보기 이미지 URL(유형 OG PNG, 절대 URL 권장)

type ShareButtonsProps = {
  meta: TypeMeta;
  resultUrl: string;
  ogUrl: string;
  className?: string;
};

const BTN_BASE =
  "inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60";

export default function ShareButtons({ meta, resultUrl, ogUrl, className }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [canKakao, setCanKakao] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  // 클라이언트 능력 감지는 마운트 후에(서버/클라 마크업 불일치 방지).
  useEffect(() => {
    setCanKakao(isKakaoShareAvailable());
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
  }, []);

  async function copyLink() {
    trackPetbti("copy_link", { result_type: meta.code });
    try {
      await navigator.clipboard.writeText(resultUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // 클립보드 API 차단 환경 — 최후의 폴백 프롬프트.
      window.prompt("아래 링크를 복사하세요", resultUrl);
    }
  }

  async function handleKakao() {
    trackPetbti("share_result", { result_type: meta.code, channel: "kakao" });
    try {
      await shareKakao({
        title: `우리 아이는 ${meta.nickname}`,
        description: meta.catchphrase,
        imageUrl: ogUrl,
        url: resultUrl,
      });
    } catch (error) {
      console.error("[petbti] 카카오 공유 실패:", error);
      // 폴백: 링크 복사.
      await copyLink();
    }
  }

  async function handleNativeShare() {
    trackPetbti("share_result", { result_type: meta.code, channel: "native" });
    try {
      await navigator.share({
        title: `우리 아이는 ${meta.nickname} | 멍BTI`,
        text: meta.catchphrase,
        url: resultUrl,
      });
    } catch (error) {
      // 사용자가 공유 시트를 닫으면 AbortError — 무시(폴백 불필요).
      if ((error as DOMException)?.name === "AbortError") {
        return;
      }
      console.error("[petbti] 네이티브 공유 실패:", error);
      await copyLink();
    }
  }

  return (
    <div className={className ?? "flex w-full flex-wrap gap-2"}>
      {canKakao ? (
        <button
          type="button"
          onClick={handleKakao}
          className={`${BTN_BASE} border-[#FEE500] bg-[#FEE500] text-[#3C1E1E] hover:bg-[#FADA00]`}
        >
          <ChatCircleDots weight="fill" className="text-lg" />
          카카오톡
        </button>
      ) : null}

      {canNativeShare ? (
        <button
          type="button"
          onClick={handleNativeShare}
          className={`${BTN_BASE} border-charcoal bg-charcoal text-offwhite hover:opacity-90`}
        >
          <Export weight="bold" className="text-lg" />
          공유하기
        </button>
      ) : null}

      <button
        type="button"
        onClick={copyLink}
        aria-live="polite"
        className={
          copied
            ? `${BTN_BASE} border-sage bg-sage/15 text-sage`
            : `${BTN_BASE} border-charcoal/20 bg-white text-charcoal hover:border-charcoal/40`
        }
      >
        {copied ? (
          <>
            <Check weight="bold" className="text-lg" />
            복사됨
          </>
        ) : (
          <>
            <LinkSimple weight="bold" className="text-lg" />
            링크 복사
          </>
        )}
      </button>
    </div>
  );
}
