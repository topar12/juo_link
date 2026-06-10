"use client";

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from '@phosphor-icons/react';

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    // Simulate loading for 1.8 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 1800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center p-8 text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
        className="mb-8 text-[var(--color-rose)]"
      >
        <Heart weight="fill" size={64} />
      </motion.div>
      <h2 className="text-2xl mb-4 font-display">
        우리 아이의 성향을<br />분석하고 있어요...
      </h2>
      <p className="text-sm text-black/50">
        잠시만 기다려주세요 🔍
      </p>
    </motion.div>
  );
}
