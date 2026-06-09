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

const FOODS = foodSafetyData as FoodSafetyItem[];
const ALL = "all" as const;
const LOOPBACK_URL = "https://www.lovejuo.com/shop/";

export default function FoodCheckSheet({ analyticsPageId, onClose }: FoodCheckSheetProps) {
  const [query, setQuery] = useState("");
  const [activeVerdict, setActiveVerdict] = useState<FoodVerdict | typeof ALL>(ALL);
  const lastSearchSignatureRef = useRef("");

  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const results = searchFoods(FOODS, normalizedQuery, activeVerdict);
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

          <p className="px-1 text-xs font-semibold text-slate-500">{results.length}개 음식</p>

          <div className="flex flex-col gap-3">
            {results.length > 0 ? (
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
            className="mt-2 flex items-center justify-between rounded-2xl border-2 border-brand-coral-200 bg-brand-coral-50/50 px-5 py-4 text-sm font-bold text-slate-900 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-coral-500"
          >
            <span>안심하고 줄 수 있는 간식 보기</span>
            <span className="text-base leading-none">&rarr;</span>
          </a>
          <p className="px-1 text-[11px] font-medium leading-relaxed text-slate-400">참고용 정보이며, 우리 아이 상태·기저질환에 따라 다를 수 있어요.</p>
        </div>
      </div>
    </motion.div>
  );
}
