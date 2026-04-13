"use client";

import { Player } from "@remotion/player";
import {
  INTRO_DURATION_IN_FRAMES,
  INTRO_FPS,
  INTRO_VARIANTS,
  IntroComposition,
} from "./IntroComposition";

const previewWords = ["RESCUE.", "RE-HOMING.", "LOVE JUO."];

export default function IntroVariantPreview() {
  return (
    <main className="h-full overflow-y-auto bg-slate-50 px-5 py-8 no-scrollbar">
      <header className="mb-6 flex flex-col gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-coral-500">
          Remotion Intro Lab
        </span>
        <h1 className="text-3xl font-black leading-none tracking-tight text-slate-900">
          사랑해주오 인트로 비교
        </h1>
        <p className="text-xs font-medium leading-relaxed text-slate-500">
          후보를 먼저 보고 고른 뒤, 실제 링크인바이오에 연결하면 됩니다.
        </p>
      </header>

      <div className="flex flex-col gap-5 pb-8">
        {INTRO_VARIANTS.map((variant) => (
          <section
            key={variant.id}
            className="overflow-hidden rounded-xl border-2 border-slate-200 bg-white shadow-[4px_4px_0px_0px_rgba(30,41,59,0.08)]"
          >
            <div className="border-b-2 border-slate-200 px-4 py-3">
              <h2 className="text-sm font-black tracking-tight text-slate-900">
                {variant.label}
              </h2>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500">
                {variant.description}
              </p>
            </div>
            <div className="bg-slate-100">
              <Player
                component={IntroComposition}
                inputProps={{
                  words: previewWords,
                  accentWordIndex: 2,
                  variant: variant.id,
                }}
                durationInFrames={INTRO_DURATION_IN_FRAMES}
                compositionWidth={430}
                compositionHeight={932}
                fps={INTRO_FPS}
                style={{
                  width: "100%",
                  aspectRatio: "430 / 932",
                }}
                controls
                loop
                autoPlay
                acknowledgeRemotionLicense
              />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
