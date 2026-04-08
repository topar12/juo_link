"use client";

import React, { useEffect } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Player } from "@remotion/player";
import { motion } from "framer-motion";

const FPS = 30;
const DURATION_IN_FRAMES = 90; // 3초 길이

const IntroComp = () => {
  const frame = useCurrentFrame();

  const words = ["FRESH.", "HUMAN GRADE.", "PETFOOD JUO."];
  const framesPerWord = 30; // 1초당 1개의 단어
  
  const currentWordIndex = Math.min(Math.floor(frame / framesPerWord), words.length - 1);
  const currentWord = words[currentWordIndex];
  
  const frameWithinWord = frame % framesPerWord;
  
  // 텍스트가 아래에서 위로 올라오면서 등장/퇴장하는 효과
  const yOffset = interpolate(
    frameWithinWord,
    [0, 6, framesPerWord - 6, framesPerWord],
    [30, 0, 0, -30],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 투명도 효과 (Fade In / Fade Out)
  const opacity = interpolate(
    frameWithinWord,
    [0, 6, framesPerWord - 6, framesPerWord],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill className="bg-slate-50 flex items-center justify-center p-8">
      <div 
        style={{ 
          transform: `translateY(${yOffset}px)`, 
          opacity,
          fontFamily: "system-ui, -apple-system, sans-serif" 
        }}
        className={`text-[44px] sm:text-5xl font-black tracking-tighter uppercase text-center leading-none ${currentWordIndex === 2 ? 'text-brand-coral-500' : 'text-slate-900'}`}
      >
        {currentWord}
      </div>
    </AbsoluteFill>
  );
};

export default function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    // 애니메이션이 끝나면 onComplete 콜백 호출
    const timer = setTimeout(() => {
      onComplete();
    }, (DURATION_IN_FRAMES / FPS) * 1000 + 100); // 3.1초 뒤 전환
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="absolute inset-0 z-50 bg-slate-50"
    >
      <Player
        component={IntroComp}
        durationInFrames={DURATION_IN_FRAMES}
        compositionWidth={430}
        compositionHeight={932}
        fps={FPS}
        style={{
          width: "100%",
          height: "100%",
        }}
        autoPlay
        controls={false}
        acknowledgeRemotionLicense
      />
    </motion.div>
  );
}
