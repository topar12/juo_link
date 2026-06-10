"use client";

import { motion } from 'framer-motion';
import { questions } from '@/features/petbti/data/questions';

interface QuizProps {
  currentQ: string;
  onAnswer: (qId: string, answerId: string) => void;
  progress: number; // 0 to 1
  onRestart: () => void;
}

export function QuizScreen({ currentQ, onAnswer, progress, onRestart }: QuizProps) {
  const qData = questions.find(q => q.id === currentQ);

  if (!qData) return null;

  return (
    <motion.div
      key={currentQ}
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex-1 flex flex-col pt-6 pb-12 px-6 w-full"
    >
      {/* Progress Indicator & Restart */}
      <div className="w-full mb-12">
        <div className="flex justify-between items-end mb-3">
          <button
            onClick={onRestart}
            className="text-[11px] text-black/40 font-bold tracking-widest uppercase hover:text-black/80 transition-colors flex items-center gap-1"
          >
            &larr; 다시하기
          </button>
          <div className="text-xs text-[var(--color-sage)] font-bold tracking-widest uppercase text-right">
            Step {currentQ.replace('q', '')} / 7
          </div>
        </div>
        <div className="h-[2px] w-full bg-black/10 relative overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 bottom-0 bg-[var(--color-sage)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-start mt-4">
        <h2 className="text-3xl leading-snug mb-12 whitespace-pre-line text-balance text-[var(--color-charcoal)] break-keep">
          {qData.question}
        </h2>

        <div className="space-y-4">
          {qData.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onAnswer(qData.id, opt.id)}
              className="w-full text-left p-6 border border-black/10 bg-white shadow-sm transition-all active:scale-[0.98] hover:border-black/30 flex items-center justify-between group rounded-xl"
            >
              <span className="text-lg leading-relaxed whitespace-pre-line text-black/80 group-hover:text-black">
                {opt.text}
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-4 text-[var(--color-sage)]">
                &rarr;
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
