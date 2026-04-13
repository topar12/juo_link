"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { Player } from "@remotion/player";
import { motion } from "framer-motion";
import {
  INTRO_DURATION_IN_FRAMES,
  INTRO_FPS,
  IntroComposition,
  type IntroVariantId,
} from "@/features/linkinbio/intro/IntroComposition";

type IntroAnimationProps = {
  words?: string[];
  accentWordIndex?: number;
  variant?: IntroVariantId;
  backgroundVideoSrc?: string;
  videoDurationMs?: number;
  videoStartFromEndMs?: number;
  videoTitle?: string;
  videoSubtitle?: string;
  onComplete: () => void;
};

export default function IntroAnimation({
  words = ["FRESH.", "HUMAN GRADE.", "PETFOOD JUO."],
  accentWordIndex = 2,
  variant = "wordRise",
  backgroundVideoSrc,
  videoDurationMs = 5000,
  videoStartFromEndMs,
  videoTitle,
  videoSubtitle,
  onComplete,
}: IntroAnimationProps) {
  const completedRef = useRef(false);

  const completeIntro = useCallback(() => {
    if (completedRef.current) {
      return;
    }

    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const timer = setTimeout(() => {
      completeIntro();
    }, backgroundVideoSrc ? videoDurationMs + 120 : (INTRO_DURATION_IN_FRAMES / INTRO_FPS) * 1000 + 100);
    return () => clearTimeout(timer);
  }, [backgroundVideoSrc, completeIntro, videoDurationMs]);

  return (
    <motion.div 
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="absolute inset-0 z-50 overflow-hidden bg-slate-950"
    >
      {backgroundVideoSrc ? (
        <VideoIntro
          src={backgroundVideoSrc}
          title={videoTitle}
          subtitle={videoSubtitle}
          startFromEndMs={videoStartFromEndMs}
          onEnded={completeIntro}
        />
      ) : (
        <Player
          component={IntroComposition}
          inputProps={{
            words,
            accentWordIndex,
            variant,
          }}
          durationInFrames={INTRO_DURATION_IN_FRAMES}
          compositionWidth={430}
          compositionHeight={932}
          fps={INTRO_FPS}
          style={{
            width: "100%",
            height: "100%",
          }}
          autoPlay
          controls={false}
          acknowledgeRemotionLicense
        />
      )}
      <button
        type="button"
        onClick={completeIntro}
        className="absolute right-5 top-5 z-10 rounded-full border border-white/28 bg-slate-950/30 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-[0_4px_18px_rgba(15,23,42,0.18)] backdrop-blur-sm transition-colors hover:bg-slate-950/44 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        Skip
      </button>
    </motion.div>
  );
}

function VideoIntro({
  src,
  title,
  subtitle,
  startFromEndMs,
  onEnded,
}: {
  src: string;
  title?: string;
  subtitle?: string;
  startFromEndMs?: number;
  onEnded: () => void;
}) {
  return (
    <div className="relative h-full w-full bg-slate-950">
      <video
        src={src}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        playsInline
        preload="auto"
        onLoadedMetadata={(event) => {
          if (!startFromEndMs) {
            return;
          }

          const video = event.currentTarget;
          if (!Number.isFinite(video.duration)) {
            return;
          }

          video.currentTime = Math.max(video.duration - startFromEndMs / 1000, 0);
          video.play().catch(() => undefined);
        }}
        onEnded={onEnded}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.46)_0%,rgba(15,23,42,0.22)_30%,rgba(15,23,42,0.06)_58%,rgba(15,23,42,0.26)_100%)]" />
      {(title || subtitle) ? (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: "easeOut", delay: 0.35 }}
          className="absolute inset-x-0 top-14 flex flex-col items-start gap-3 px-8 text-white"
        >
          {subtitle ? (
            <div className="rounded-full border border-white/30 bg-slate-950/34 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-white shadow-[0_3px_18px_rgba(15,23,42,0.18)] backdrop-blur-sm">
              {subtitle}
            </div>
          ) : null}
          {title ? (
            <div className="whitespace-pre-line text-[38px] font-black leading-[1.04] tracking-tight text-white drop-shadow-[0_4px_16px_rgba(15,23,42,0.58)]">
              {title}
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </div>
  );
}
