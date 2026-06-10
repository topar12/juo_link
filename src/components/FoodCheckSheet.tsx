"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MagnifyingGlass, Warning, X } from "@phosphor-icons/react";
import clsx from "clsx";
import foodSafetyData from "@/data/foodSafety.json";
import { trackEvent } from "@/lib/analytics";
import {
  searchFoods,
  VERDICT_FILTER_ORDER,
  VERDICT_META,
  type FoodSafetyItem,
  type FoodVerdict,
} from "@/lib/foodSafety";

type FoodCheckSheetProps = {
  analyticsPageId?: string;
  onClose: () => void;
};

// 폴백 데이터 — 번들된 시드 JSON. API(/api/foods)가 실패하면 이걸 쓴다.
// 건강·안전 데이터라 검색기가 절대 빈 화면이 되면 안 되므로 항상 보유한다.
const FALLBACK_FOODS = foodSafetyData as FoodSafetyItem[];
const ALL = "all" as const;
const LOOPBACK_URL = "https://www.lovejuo.com/shop/";

export default function FoodCheckSheet({ analyticsPageId, onClose }: FoodCheckSheetProps) {
  const [query, setQuery] = useState("");
  const [activeVerdict, setActiveVerdict] = useState<FoodVerdict | typeof ALL>(ALL);
  // null = 아직 미로딩. fetch 성공 시 D1 데이터, 실패 시 폴백으로 채운다.
  const [foods, setFoods] = useState<FoodSafetyItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const lastSearchSignatureRef = useRef("");
  // 시트는 열릴 때 마운트되므로(부모가 조건부 렌더), fetch는 마운트당 1회만.
  // StrictMode 이중 호출·재진입을 막는 가드.
  const hasFetchedRef = useRef(false);

  // 시트가 열릴 때(=마운트) /api/foods를 lazy fetch. 로딩 중에도 폴백으로
  // 검색을 막지 않도록, 화면에 넘기는 데이터는 foods ?? FALLBACK_FOODS로 보장.
  useEffect(() => {
    if (hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;

    // 언마운트 후 늦게 도착한 응답으로 상태를 갱신하지 않기 위한 가드.
    let aborted = false;
    setIsLoading(true);

    (async () => {
      try {
        const res = await fetch("/api/foods");
        // 비200(서버/D1 오류는 500)은 폴백으로 처리.
        if (!res.ok) {
          throw new Error(`/api/foods responded ${res.status}`);
        }
        const data = (await res.json()) as FoodSafetyItem[];
        // 빈 배열은 데이터 누락으로 간주 — 안전 데이터라 폴백 사용.
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("/api/foods returned empty data");
        }
        if (!aborted) {
          setFoods(data);
        }
      } catch {
        // 네트워크 오류·비200·빈 응답 → 번들 폴백으로 검색기 유지.
        if (!aborted) {
          setFoods(FALLBACK_FOODS);
        }
      } finally {
        if (!aborted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      aborted = true;
    };
  }, []);

  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  // 로딩 첫 프레임에도 빈 화면이 없도록 폴백을 기본값으로 사용(검색 즉시 동작).
  const items = foods ?? FALLBACK_FOODS;
  const results = searchFoods(items, normalizedQuery, activeVerdict);
  // 최초 로딩 중(아직 fetch 결과 미반영)에만 스켈레톤 노출.
  const showSkeleton = isLoading && foods === null;
  const filterOptions: Array<FoodVerdict | typeof ALL> = [ALL, ...VERDICT_FILTER_ORDER];

  useEffect(() => {
    if (normalizedQuery.length === 0) {
      return;
    }
    const signature = `${normalizedQuery}|${activeVerdict}|${results.length}`;
    if (lastSearchSignatureRef.current === signature) {
      return;
    }
    const timeout = window.setTimeout(() => {
      lastSearchSignatureRef.current = signature;
      trackEvent("food_search", {
        page: analyticsPageId,
        brand_page: analyticsPageId,
        active_verdict: activeVerdict,
        query_length: normalizedQuery.length,
        result_count: results.length,
        has_result: results.length > 0 ? "true" : "false",
      });
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [activeVerdict, analyticsPageId, normalizedQuery, results.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="absolute inset-0 z-40 bg-slate-50"
    >
      <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
        <div className="sticky top-0 z-10 border-b-2 border-slate-200 bg-slate-50/95 px-5 pb-4 pt-5 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col items-start gap-2">
              <span className="inline-flex items-center rounded-full bg-brand-coral-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                Food Check
              </span>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">우리 아이 먹어도 돼요?</h2>
                <p className="mt-1 text-xs font-medium text-slate-500">음식 이름을 검색해 먹어도 되는지 확인해보세요.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="음식 검색 닫기"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-900 hover:text-slate-900"
            >
              <X weight="bold" className="text-lg" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-5 py-4 pb-8">
          <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] font-medium leading-relaxed text-slate-500">
            <Warning weight="fill" className="mt-0.5 shrink-0 text-sm text-brand-coral-400" />
            <span>일반적인 정보예요. 진단·처방이 아니며, 먹은 게 의심되거나 증상이 있으면 바로 수의사와 상담하세요.</span>
          </div>

          <div className="relative">
            <MagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="음식 검색"
              placeholder="예: 초콜릿, 사과, 양파"
              className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-white pl-12 pr-4 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-coral-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {filterOptions.map((option) => {
              const isActive = activeVerdict === option;
              const label = option === ALL ? "전체" : `${VERDICT_META[option].emoji} ${VERDICT_META[option].label}`;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveVerdict(option)}
                  className={clsx(
                    "shrink-0 rounded-full border-2 px-4 py-2 text-xs font-bold tracking-tight transition-all duration-200",
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white shadow-[2px_2px_0px_0px_var(--link-accent-shadow-solid)]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <p className="px-1 text-xs font-semibold text-slate-500">
            {showSkeleton ? "불러오는 중…" : `${results.length}개 음식`}
          </p>

          <div className="flex flex-col gap-3">
            {showSkeleton ? (
              // 최초 로딩 스켈레톤 — 결과 카드와 동일한 토큰으로 갑작스러운 전환 방지.
              <div aria-busy="true" aria-label="음식 데이터 불러오는 중" className="flex flex-col gap-3">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className="flex w-full items-start gap-3 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-[3px_3px_0px_0px_rgba(30,41,59,0.06)]"
                  >
                    <div className="h-11 min-w-11 animate-pulse rounded-xl bg-slate-200" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2 py-1">
                      <div className="h-3.5 w-1/3 animate-pulse rounded-full bg-slate-200" />
                      <div className="h-3 w-4/5 animate-pulse rounded-full bg-slate-100" />
                      <div className="h-3 w-3/5 animate-pulse rounded-full bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              results.map((food) => {
                const meta = VERDICT_META[food.verdict];
                return (
                  <div
                    key={food.id}
                    className={clsx(
                      "relative flex w-full items-start gap-3 overflow-hidden rounded-2xl border-2 bg-white p-4 shadow-[3px_3px_0px_0px_rgba(30,41,59,0.06)]",
                      meta.cardBorderClassName
                    )}
                  >
                    <div className={clsx("flex h-11 min-w-11 items-center justify-center rounded-xl text-xl", meta.badgeClassName)}>
                      <span>{food.emoji ?? meta.emoji}</span>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm font-black tracking-tight text-slate-900">{food.name}</strong>
                        <span className={clsx("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black", meta.pillClassName)}>
                          {meta.emoji} {meta.label}
                        </span>
                      </div>
                      <p className="text-xs font-medium leading-relaxed text-slate-500">{food.reason}</p>
                      {food.note ? (
                        <p className="text-[11px] font-medium leading-relaxed text-slate-400">{food.note}</p>
                      ) : null}
                      {food.verdict === "danger" ? (
                        <p className="mt-1 text-[11px] font-bold text-brand-coral-600">이미 먹었다면 즉시 동물병원에 연락하세요.</p>
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-5 py-8 text-center">
                <p className="text-sm font-bold text-slate-800">아직 등록 안 된 음식이에요</p>
                <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500">헷갈리는 음식은 수의사와 상담하는 게 가장 안전해요.</p>
              </div>
            )}
          </div>

        </div>

        <div className="sticky bottom-0 mt-auto border-t-2 border-slate-200 bg-slate-50/95 px-5 py-3 backdrop-blur-sm">
          <a
            href={LOOPBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent("food_loopback_click", {
                page: analyticsPageId,
                brand_page: analyticsPageId,
              })
            }
            className="flex items-center justify-between rounded-2xl border-2 border-brand-coral-200 bg-brand-coral-50 px-5 py-3.5 text-sm font-bold text-slate-900 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-coral-500"
          >
            <span>안심하고 줄 수 있는 간식 보기</span>
            <span className="text-base leading-none">&rarr;</span>
          </a>
          <p className="mt-2 text-center text-[10px] font-medium leading-relaxed text-slate-400">참고용 정보이며, 우리 아이 상태·기저질환에 따라 다를 수 있어요.</p>
        </div>
      </div>
    </motion.div>
  );
}
