"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { PetTypeCode } from "../data/types";

// 희귀도 배지 — 마운트 시 /api/petbti/stats 를 no-store 로 fetch.
// 응답 형태(보존 계약): { [CODE]: number, …, total: number } 또는 실패 시 null(200+null).
// - stats === null 이거나 total < MIN_SAMPLE 이면 렌더하지 않음(표본 적을 때 숨김).
// - 그 외 "전체 N마리 중 X%" (X = 이 유형 비율, 소수 1자리) 표시.
// FoodCheckSheet 의 fetch + once-guard(hasFetchedRef) 패턴을 따른다.

const MIN_SAMPLE = 30;

type StatsResponse = (Record<string, number> & { total: number }) | null;

type RarityBadgeProps = {
  code: PetTypeCode;
  className?: string;
};

export default function RarityBadge({ code, className }: RarityBadgeProps) {
  const [stats, setStats] = useState<StatsResponse>(null);
  // 마운트당 1회만 fetch (StrictMode 이중 호출·재진입 방지).
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;

    // 언마운트 후 늦게 도착한 응답으로 상태 갱신 방지.
    let aborted = false;

    (async () => {
      try {
        const res = await fetch("/api/petbti/stats", { cache: "no-store" });
        if (!res.ok) {
          return; // 비200 → 배지 숨김(무해).
        }
        const data = (await res.json()) as StatsResponse;
        if (!aborted) {
          setStats(data);
        }
      } catch {
        // 네트워크 오류 → 배지 숨김.
      }
    })();

    return () => {
      aborted = true;
    };
  }, []);

  // 데이터 없음·표본 부족 → 렌더 안 함.
  if (!stats || typeof stats.total !== "number" || stats.total < MIN_SAMPLE) {
    return null;
  }

  const count = stats[code] ?? 0;
  const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
  const percentLabel = percent.toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={
        className ??
        "inline-flex items-center gap-2 rounded-full border-2 border-butter bg-butter/20 px-4 py-2 text-sm font-bold text-charcoal"
      }
    >
      <span role="img" aria-label="반짝">
        ✨
      </span>
      <span>
        전체 {stats.total.toLocaleString()}마리 중{" "}
        <strong className="font-black">{percentLabel}%</strong>
      </span>
    </motion.div>
  );
}
