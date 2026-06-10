"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { motion } from "framer-motion";
import { AXES, PET_TYPES, type TypeMeta } from "../data/types";
import { trackPetbti } from "../lib/ga";
import ResultCard from "./ResultCard";
import StoryCard from "./StoryCard";
import RarityBadge from "./RarityBadge";
import ShareButtons from "./ShareButtons";
import SaveImageButton from "./SaveImageButton";

// 결과 페이지 본문(클라 섬). result/[type]/page.tsx(SSG)가 meta 를 넘긴다.
// - from=quiz 진입 시: POST /api/petbti/result(typeCode+answers) + quiz_complete 1회, 쿼리 제거.
// - 추천제품: /api/petbti/products fetch, 실패/미설정 시 meta.recommendedProduct 폴백.
// - 공유/저장: ResultCard(1:1)·StoryCard(9:16) 캡처, ShareButtons(카카오/native/복사).

type ProductInfo = {
  typeCode: string;
  productName: string;
  imageUrl?: string;
  reason?: string;
  shopUrl?: string;
};

const DEFAULT_SHOP_URL = "https://www.lovejuo.com/shop/";
const INSTAGRAM_URL = "https://www.instagram.com/petfood.thejuo";

function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return hex;
  const int = parseInt(m[1], 16);
  return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`;
}

export default function ResultView({ meta }: { meta: TypeMeta }) {
  const [userPhoto, setUserPhoto] = useState<string | undefined>(undefined);
  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [origin, setOrigin] = useState("");

  const cardRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const recordedRef = useRef(false);

  const accent = meta.color;
  const soulmate = PET_TYPES[meta.soulmate];
  const clash = PET_TYPES[meta.clash];

  // 결과 기록(quiz 완주 시 1회) + origin 확정.
  useEffect(() => {
    setOrigin(window.location.origin);

    if (recordedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("from") !== "quiz") return;
    recordedRef.current = true;

    let answers = "";
    try {
      answers = sessionStorage.getItem("petbti-answers") ?? "";
      sessionStorage.removeItem("petbti-answers");
    } catch {
      // 무시
    }

    trackPetbti("quiz_complete", { result_type: meta.code, result_title: meta.nickname });
    fetch("/api/petbti/result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ typeCode: meta.code, answers }),
    }).catch(() => {
      // 기록 실패는 무해(통계만 누락).
    });

    // 새로고침 시 재기록 방지 — 쿼리 제거.
    window.history.replaceState(null, "", `/petbti/result/${meta.code}`);
  }, [meta.code, meta.nickname]);

  // 추천제품 로드(D1 → 미설정은 코드 기본값 폴백).
  useEffect(() => {
    let aborted = false;
    fetch("/api/petbti/products")
      .then((r) => (r.ok ? r.json() : null))
      .then((list) => {
        if (aborted || !Array.isArray(list)) return;
        const found = list.find((p: ProductInfo) => p.typeCode === meta.code);
        if (found) setProduct(found);
      })
      .catch(() => {});
    return () => {
      aborted = true;
    };
  }, [meta.code]);

  function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUserPhoto(typeof reader.result === "string" ? reader.result : undefined);
      trackPetbti("photo_upload", { result_type: meta.code });
    };
    reader.readAsDataURL(file);
  }

  const productName = product?.productName ?? meta.recommendedProduct;
  const productReason = product?.reason ?? `${meta.nickname}에게 딱 맞는 든든한 한 입이에요.`;
  const shopUrl = product?.shopUrl ?? DEFAULT_SHOP_URL;
  const resultUrl = origin ? `${origin}/petbti/result/${meta.code}` : `/petbti/result/${meta.code}`;
  const ogUrl = origin ? `${origin}/og/petbti/${meta.code}.png` : `/og/petbti/${meta.code}.png`;

  return (
    <main className="mx-auto flex h-full w-full max-w-md flex-col gap-8 overflow-y-auto bg-offwhite px-5 py-8">
      {/* 결과 카드 (캡처 대상) */}
      <div className="flex flex-col items-center gap-4">
        <RarityBadge code={meta.code} />
        <div ref={cardRef} className="w-full max-w-[420px]">
          <ResultCard meta={meta} userPhoto={userPhoto} />
        </div>

        {/* 주요 액션 — 이미지 저장(다운로드, 강조) + 우리 아이 사진 넣기 */}
        <div className="hide-on-capture flex w-full max-w-[420px] flex-col gap-2">
          <SaveImageButton
            targetRef={cardRef}
            filename={`멍BTI_${meta.code}`}
            label="📸 결과 이미지 저장"
            onSaved={() => trackPetbti("result_download", { result_type: meta.code })}
            style={{ backgroundColor: accent }}
            className="hide-on-capture inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-black text-white shadow-lg transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl border-2 border-charcoal/15 bg-white px-4 py-2.5 text-xs font-bold text-charcoal/70 transition-colors hover:border-charcoal/30">
            📷 우리 아이 사진 넣기
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </label>
        </div>
      </div>

      {/* 유형 설명 */}
      <section className="flex flex-col gap-3">
        <h1 className="text-2xl font-black leading-tight tracking-tight text-charcoal">
          {meta.nickname}
        </h1>
        <p className="text-[15px] font-medium leading-relaxed text-charcoal/75">
          {meta.description}
        </p>
      </section>

      {/* 4축 게이지 */}
      <section className="flex flex-col gap-3 rounded-3xl border-2 border-charcoal/10 bg-white p-5">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-charcoal/40">
          우리 아이 성향
        </h2>
        {AXES.map((axis, i) => {
          const isFirst = meta.code[i] === axis.poles.first;
          return (
            <div key={axis.key} className="flex items-center gap-3 text-xs font-bold">
              <span
                className="w-12 shrink-0 text-right"
                style={{ color: isFirst ? accent : "rgba(0,0,0,0.3)" }}
              >
                {axis.left}
              </span>
              <div className="relative h-2 flex-1 rounded-full bg-charcoal/10">
                <div
                  className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full shadow"
                  style={{
                    left: isFirst ? "6%" : "auto",
                    right: isFirst ? "auto" : "6%",
                    backgroundColor: accent,
                  }}
                />
              </div>
              <span
                className="w-12 shrink-0"
                style={{ color: isFirst ? "rgba(0,0,0,0.3)" : accent }}
              >
                {axis.right}
              </span>
            </div>
          );
        })}
      </section>

      {/* 궁합 */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-charcoal/40">궁합</h2>
        <div className="grid grid-cols-2 gap-3">
          <a
            href={`/petbti/result/${soulmate.code}`}
            className="flex flex-col gap-1 rounded-2xl border-2 p-4 transition-transform hover:-translate-y-0.5"
            style={{ borderColor: withAlpha(soulmate.color, 0.5), backgroundColor: withAlpha(soulmate.color, 0.08) }}
          >
            <span className="text-xs font-bold text-charcoal/50">🧡 찰떡궁합</span>
            <span className="text-sm font-black text-charcoal">{soulmate.nickname}</span>
            <span className="text-[11px] font-bold" style={{ color: soulmate.color }}>{soulmate.code}</span>
          </a>
          <a
            href={`/petbti/result/${clash.code}`}
            className="flex flex-col gap-1 rounded-2xl border-2 p-4 transition-transform hover:-translate-y-0.5"
            style={{ borderColor: withAlpha(clash.color, 0.5), backgroundColor: withAlpha(clash.color, 0.08) }}
          >
            <span className="text-xs font-bold text-charcoal/50">⚡ 밀당궁합</span>
            <span className="text-sm font-black text-charcoal">{clash.nickname}</span>
            <span className="text-[11px] font-bold" style={{ color: clash.color }}>{clash.code}</span>
          </a>
        </div>
      </section>

      {/* 추천 간식 (퍼널 본체) */}
      <section
        className="flex flex-col gap-4 rounded-3xl p-5"
        style={{ backgroundColor: withAlpha(accent, 0.1), border: `2px solid ${withAlpha(accent, 0.3)}` }}
      >
        <div className="flex flex-col gap-1">
          <span className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: accent }}>
            맞춤 간식 추천
          </span>
          <h2 className="text-xl font-black text-charcoal">{productName}</h2>
        </div>
        {product?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={productName} className="h-40 w-full rounded-2xl object-cover" />
        ) : null}
        <p className="text-sm font-medium leading-relaxed text-charcoal/75">{productReason}</p>
        <a
          href={shopUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackPetbti("shop_click", { result_type: meta.code })}
          className="inline-flex w-full items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-black text-white shadow-lg transition-transform hover:-translate-y-0.5"
          style={{ backgroundColor: accent }}
        >
          공식몰에서 보러가기
        </a>
      </section>

      {/* 공유 */}
      <section className="hide-on-capture flex flex-col gap-3">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-charcoal/40">공유하기</h2>
        <ShareButtons meta={meta} resultUrl={resultUrl} ogUrl={ogUrl} />
        <SaveImageButton
          targetRef={storyRef}
          filename={`멍BTI_스토리_${meta.code}`}
          label="📲 인스타 스토리용 저장 (9:16)"
          onSaved={() => trackPetbti("result_download", { result_type: meta.code, format: "story" })}
          className="hide-on-capture inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-charcoal/20 bg-white px-4 py-3 text-sm font-bold text-charcoal transition-all hover:border-charcoal/40 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </section>

      {/* 인스타 인증 이벤트 (동선만 — 추첨 운영은 추후) */}
      <section className="hide-on-capture flex flex-col gap-3 rounded-3xl border-2 border-dashed border-charcoal/15 bg-white/60 p-5 text-center">
        <p className="text-sm font-bold text-charcoal">
          결과를 스토리에 올리고 <span style={{ color: accent }}>@petfood.thejuo</span> 태그하면?
        </p>
        <p className="text-xs font-medium text-charcoal/55">
          이벤트 준비 중이에요. 먼저 팔로우하고 소식 받아보세요 🐾
        </p>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackPetbti("dm_click", { result_type: meta.code })}
          className="inline-flex items-center justify-center rounded-2xl border-2 border-charcoal bg-charcoal px-5 py-3 text-sm font-bold text-offwhite transition-all hover:opacity-90"
        >
          인스타그램 팔로우하기
        </a>
      </section>

      {/* 다시하기 */}
      <motion.a
        href="/petbti"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="hide-on-capture mb-4 inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-charcoal/60 transition-colors hover:text-charcoal"
      >
        🔄 다시 테스트하기
      </motion.a>

      {/* 캡처 전용 9:16 스토리 카드 (화면 밖) */}
      <StoryCard ref={storyRef} meta={meta} userPhoto={userPhoto} />
    </main>
  );
}
