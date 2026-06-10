"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PawPrint, ArrowLeft } from "@phosphor-icons/react";
import { QUESTIONS } from "@/features/petbti/data/questions";
import { calculateResult } from "@/features/petbti/lib/score";
import type { Pole } from "@/features/petbti/data/types";
import { trackPetbti } from "@/features/petbti/lib/ga";
import LoadingBake from "@/features/petbti/components/LoadingBake";

// 퀴즈 오케스트레이션(클라). 상태머신:
//   intro  → question(0..11, 진행바·한 화면 한 문항·2지선다) → baking(LoadingBake)
//          → calculateResult(answers) → router.push(/petbti/result/<code>?from=quiz)
//
// - 인트로 CTA 클릭에 trackPetbti("quiz_start").
// - 인트로 누적 참여수 = 클라에서 /api/petbti/stats fetch 한 total (실패 무시).
// - 답은 Pole[] 로 누적(문항 순서 = 인덱스). 12개 채워지면 채점 → baking → 결과 push.
// - 결과 기록(POST /api/petbti/result)·quiz_complete 이벤트는 결과 페이지(ResultView)가 담당.

type Phase = "intro" | "question" | "baking";

const TOTAL = QUESTIONS.length; // 12

export default function QuizClient() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Pole[]>([]);
  const [participantTotal, setParticipantTotal] = useState<number | null>(null);
  // 방향(앞/뒤) — 카드 전환 애니메이션 방향 결정.
  const [direction, setDirection] = useState<1 | -1>(1);
  const hasFetchedRef = useRef(false);

  // 인트로 누적 참여수 — 마운트 시 1회 fetch, 실패는 조용히 무시.
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    let aborted = false;
    (async () => {
      try {
        const res = await fetch("/api/petbti/stats", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { total?: number } | null;
        if (!aborted && data && typeof data.total === "number") {
          setParticipantTotal(data.total);
        }
      } catch {
        // 무시 — 참여수는 부가 정보.
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

  function startQuiz() {
    trackPetbti("quiz_start");
    setDirection(1);
    setIndex(0);
    setAnswers([]);
    setPhase("question");
  }

  function selectOption(pole: Pole) {
    const next = [...answers.slice(0, index), pole];
    setAnswers(next);

    if (next.length >= TOTAL) {
      // 마지막 문항 → 굽기 단계로.
      setPhase("baking");
      return;
    }
    setDirection(1);
    setIndex((i) => i + 1);
  }

  function goBack() {
    if (index === 0) {
      setPhase("intro");
      return;
    }
    setDirection(-1);
    setIndex((i) => i - 1);
    // 되돌아가면 해당 문항부터 다시 답하도록 누적 답을 잘라낸다.
    setAnswers((prev) => prev.slice(0, index - 1));
  }

  function handleBakeDone() {
    // 12개 답 → 코드 산출 후 결과 페이지로. calculateResult 는 항상 16유형 중 하나 반환.
    const code = calculateResult(answers);
    // 응답 raw(12자 pole 문자열)를 결과 페이지(ResultView)가 POST 에 쓰도록 핸드오프.
    try {
      sessionStorage.setItem("petbti-answers", answers.join(""));
    } catch {
      // sessionStorage 차단 환경 — 답안 분포 기록만 생략(통계/유형은 정상).
    }
    router.push(`/petbti/result/${code}?from=quiz`);
  }

  // ── baking ──────────────────────────────────────────────
  if (phase === "baking") {
    return (
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-offwhite">
        <LoadingBake onDone={handleBakeDone} />
      </main>
    );
  }

  // ── intro ───────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center gap-8 bg-offwhite px-6 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col items-center gap-6"
        >
          <motion.div
            className="flex h-28 w-28 items-center justify-center rounded-full bg-butter/30"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-6xl leading-none" role="img" aria-label="강아지">
              🐶
            </span>
          </motion.div>

          <div className="flex flex-col gap-3">
            <span className="text-xs font-black uppercase tracking-[0.32em] text-rose">
              멍BTI 행동학 테스트
            </span>
            <h1 className="text-3xl font-black leading-tight tracking-tight text-charcoal">
              우리 아이의 진짜 성향은?
            </h1>
            <p className="text-sm font-medium leading-relaxed text-charcoal/70">
              12개의 질문으로 우리 아이의 4가지 성향을 알아보고,
              <br />딱 맞는 간식까지 추천받아 보세요.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-charcoal/50">
            <span>질문 12개</span>
            <span aria-hidden>·</span>
            <span>약 2분</span>
            {participantTotal !== null ? (
              <>
                <span aria-hidden>·</span>
                <span>{participantTotal.toLocaleString()}마리 참여</span>
              </>
            ) : null}
          </div>
        </motion.div>

        <motion.button
          type="button"
          onClick={startQuiz}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
          className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-rose px-8 py-4 text-base font-black text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95"
        >
          <PawPrint weight="fill" className="text-xl" />
          테스트 시작하기
        </motion.button>

        <p className="max-w-xs text-[11px] font-medium leading-relaxed text-charcoal/40">
          재미로 보는 행동 성향 테스트예요. 수의학적 진단이 아니며, 견종·나이·중성화 여부에 따라
          다를 수 있어요.
        </p>
      </main>
    );
  }

  // ── question ────────────────────────────────────────────
  const question = QUESTIONS[index];
  const progress = ((index + 1) / TOTAL) * 100;

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-offwhite px-6 py-6">
      {/* 헤더: 뒤로 + 진행 표시 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          aria-label="이전"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-charcoal/15 bg-white text-charcoal/60 transition-colors hover:border-charcoal/30 hover:text-charcoal"
        >
          <ArrowLeft weight="bold" className="text-base" />
        </button>
        <div className="flex-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-charcoal/10">
            <motion.div
              className="h-full rounded-full bg-rose"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>
        <span className="shrink-0 text-xs font-black tabular-nums text-charcoal/50">
          {index + 1}/{TOTAL}
        </span>
      </div>

      {/* 문항 카드 — 한 화면 한 문항, 좌우 슬라이드 전환 */}
      <div className="relative flex flex-1 items-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={question.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -48 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="flex w-full flex-col gap-8"
          >
            <h2 className="text-center text-2xl font-black leading-snug tracking-tight text-charcoal">
              {question.prompt}
            </h2>

            <div className="flex flex-col gap-4">
              {question.options.map((option, optIndex) => (
                <motion.button
                  key={`${question.id}-${option.pole}`}
                  type="button"
                  onClick={() => selectOption(option.pole)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.06 * optIndex }}
                  className="group flex items-center gap-4 rounded-3xl border-2 border-charcoal/12 bg-white px-5 py-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-rose hover:shadow-[0_8px_24px_rgba(212,154,137,0.18)] active:scale-[0.98]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-charcoal/5 text-sm font-black text-charcoal/50 transition-colors group-hover:bg-rose/15 group-hover:text-rose">
                    {optIndex === 0 ? "A" : "B"}
                  </span>
                  <span className="text-base font-bold leading-snug text-charcoal">
                    {option.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
