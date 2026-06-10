"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// 로딩 연출 — 주멍이가 결과지를 "굽는" 2.5초 연출 후 onDone() 호출.
// 주멍이 일러스트가 없어도 깨지지 않게 이모지·도형으로 구성한다.
// QuizClient 의 baking 단계에서 사용.

const DURATION_MS = 2500;

// 단계별 카피 — 오븐 굽기 메타포.
const STEPS = [
  "반죽을 섞는 중…",
  "성향을 굽는 중…",
  "결과지를 꺼내는 중…",
];

type LoadingBakeProps = {
  onDone: () => void;
};

export default function LoadingBake({ onDone }: LoadingBakeProps) {
  const [stepIndex, setStepIndex] = useState(0);
  // onDone 을 effect 의존성에서 빼서(부모가 매 렌더 새 함수 전달해도) 타이머 재설정 방지.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const done = window.setTimeout(() => onDoneRef.current(), DURATION_MS);
    const stepEvery = DURATION_MS / STEPS.length;
    const stepTimer = window.setInterval(() => {
      setStepIndex((i) => (i < STEPS.length - 1 ? i + 1 : i));
    }, stepEvery);

    return () => {
      window.clearTimeout(done);
      window.clearInterval(stepTimer);
    };
  }, []);

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-8 px-6 text-center">
      {/* 오븐 + 주멍이 연출 */}
      <div className="relative flex h-40 w-40 items-center justify-center">
        {/* 김(steam) — 위로 떠오르는 점들 */}
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute text-2xl"
            style={{ left: `${30 + i * 20}%`, top: 0 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: [0, 0.8, 0], y: [-4, -28] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeOut",
            }}
            aria-hidden
          >
            ·
          </motion.span>
        ))}

        {/* 굽는 주멍이 — 위아래로 살짝 바운스 */}
        <motion.div
          className="flex h-28 w-28 items-center justify-center rounded-full bg-butter/30"
          animate={{ scale: [1, 1.08, 1], rotate: [0, -4, 4, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-6xl leading-none" role="img" aria-label="요리하는 강아지">
            🐶
          </span>
        </motion.div>

        {/* 회전하는 액센트 링 */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-dashed border-rose/50"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          aria-hidden
        />
      </div>

      {/* 단계 카피 */}
      <div className="flex flex-col items-center gap-3">
        <motion.p
          key={stepIndex}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-lg font-bold text-charcoal"
          aria-live="polite"
        >
          {STEPS[stepIndex]}
        </motion.p>

        {/* 진행 바 — DURATION 동안 0→100% */}
        <div className="h-2 w-48 overflow-hidden rounded-full bg-charcoal/10">
          <motion.div
            className="h-full rounded-full bg-rose"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: DURATION_MS / 1000, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
}
