"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { QuizScreen } from '@/features/petbti/Quiz';
import { LoadingScreen } from '@/features/petbti/Loading';
import { ResultScreen } from '@/features/petbti/Result';
import { calculateResult } from '@/features/petbti/data/questions';
import { logEvent } from '@/features/petbti/firebase';

// Logic constants
type Step = 'intro' | 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7' | 'loading' | 'result';

export default function PetBtiApp() {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finalResult, setFinalResult] = useState<string>('');

  useEffect(() => {
    const r = searchParams.get('r');
    const utmSource = searchParams.get('utm_source');

    // Validate if the result id is valid
    if (r && ['result1', 'result2', 'result3', 'result4', 'result5', 'result6', 'result7', 'result8'].includes(r)) {
      if (utmSource === 'share_link') {
        logEvent('shared_link_visit', { shared_result_type: r });
      }
      setFinalResult(r);
      setCurrentStep('result');
    }
  }, [searchParams]);

  const handleAnswer = (questionId: string, answerId: string) => {
    const newAnswers = { ...answers, [questionId]: answerId };
    setAnswers(newAnswers);

    const nextStepMap: Record<string, string> = {
      'q1': 'q2', 'q2': 'q3', 'q3': 'q4',
      'q4': 'q5', 'q5': 'q6', 'q6': 'q7'
    };

    if (questionId === 'q7') {
      setFinalResult(calculateResult(newAnswers));
      setCurrentStep('loading');
    } else {
      setCurrentStep(nextStepMap[questionId] as Step);
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setCurrentStep('intro');
    // URL에서 결과 파라미터 제거
    if (window.history.replaceState) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  // Variants for fast screen transitions
  const pageVariants: Variants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: 'easeIn' } }
  };

  const getProgress = () => {
    switch(currentStep) {
      case 'q1': return 14;
      case 'q2': return 28;
      case 'q3': return 42;
      case 'q4': return 57;
      case 'q5': return 71;
      case 'q6': return 85;
      case 'q7': return 100;
      default: return 0;
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gray-100 text-[var(--color-charcoal)] flex flex-col items-center">
      <div className="w-full max-w-[400px] min-h-[100dvh] bg-[var(--color-offwhite)] shadow-2xl relative flex flex-col overflow-hidden sm:min-h-screen">

        <AnimatePresence mode="wait">
          {currentStep === 'intro' && (
            <motion.div key="intro" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col p-8">
              <div className="flex-1 flex flex-col justify-center">
                <img src="/images/petbti/favicon.svg" alt="멍-BTI 로고" className="w-[72px] h-[72px] drop-shadow-sm mb-6 rounded-2xl" />
                <span className="text-sm tracking-widest uppercase mb-4 text-[var(--color-sage)] font-bold">PETFOOD JUO</span>
                <h1 className="leading-tight mb-6 flex flex-col gap-1">
                  <span className="text-xl font-extrabold text-[#E6AD84] tracking-wide">우리 아이의 진짜 속마음</span>
                  <span className="text-4xl sm:text-5xl font-black text-[var(--color-charcoal)] tracking-tight">멍-BTI 행동학 테스트</span>
                </h1>
                <p className="text-sm text-black/70 leading-relaxed max-w-xs break-keep">
                  보이지 않는 우리 아이의 진짜 성향을 알아보고, 그에 딱 맞는 100% 프리미엄 수제 간식을 추천받아 보세요!
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="bg-black/5 text-black/60 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider">🐾 100% 휴먼그레이드 지원</span>
                  <span className="bg-black/5 text-black/60 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider">💡 기질 분석 데이터 기반</span>
                </div>


              </div>
              <div className="pb-8">
                <button
                  onClick={() => { logEvent('quiz_start'); setCurrentStep('q1'); }}
                  className="w-full py-5 px-6 bg-[var(--color-charcoal)] text-[var(--color-offwhite)] rounded-none text-lg font-bold flex justify-between items-center transition-transform active:scale-95"
                >
                  <span>우리 아이 진짜 성향 알아보기</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </motion.div>
          )}

          {['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'].includes(currentStep) && (
            <QuizScreen
              key={currentStep}
              currentQ={currentStep}
              onAnswer={handleAnswer}
              progress={getProgress()}
              onRestart={handleRestart}
            />
          )}

          {currentStep === 'loading' && (
            <LoadingScreen
              key="loading"
              onComplete={() => setCurrentStep('result')}
            />
          )}

          {currentStep === 'result' && (
            <ResultScreen
              key="result"
              resultId={finalResult}
              onRestart={handleRestart}
            />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
