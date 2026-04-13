import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const INTRO_FPS = 30;
export const INTRO_DURATION_IN_FRAMES = 96;

export const INTRO_VARIANTS = [
  {
    id: "wordRise",
    label: "Word Rise",
    description: "기존 방식에 가까운 짧은 단어 전환",
  },
  {
    id: "signalLine",
    label: "Signal Line",
    description: "구조 신호처럼 선이 모이며 브랜드를 드러냄",
  },
  {
    id: "stamp",
    label: "Center Stamp",
    description: "리호밍센터 도장처럼 묵직하게 찍히는 느낌",
  },
  {
    id: "careSteps",
    label: "Care Steps",
    description: "상담, 만남, 가족 연결 흐름을 짧게 보여줌",
  },
] as const;

export type IntroVariantId = (typeof INTRO_VARIANTS)[number]["id"];

export type IntroCompositionProps = {
  words: string[];
  accentWordIndex: number;
  variant?: IntroVariantId;
};

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export function IntroComposition({
  words,
  accentWordIndex,
  variant = "wordRise",
}: IntroCompositionProps) {
  if (variant === "signalLine") {
    return <SignalLineIntro words={words} accentWordIndex={accentWordIndex} />;
  }

  if (variant === "stamp") {
    return <StampIntro words={words} accentWordIndex={accentWordIndex} />;
  }

  if (variant === "careSteps") {
    return <CareStepsIntro words={words} accentWordIndex={accentWordIndex} />;
  }

  return <WordRiseIntro words={words} accentWordIndex={accentWordIndex} />;
}

function WordRiseIntro({
  words,
  accentWordIndex,
}: Required<Pick<IntroCompositionProps, "words" | "accentWordIndex">>) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const framesPerWord = fps;
  const currentWordIndex = Math.min(Math.floor(frame / framesPerWord), words.length - 1);
  const currentWord = words[currentWordIndex];
  const frameWithinWord = frame % framesPerWord;
  const yOffset = interpolate(frameWithinWord, [0, 0.2 * fps, 0.78 * fps, fps], [34, 0, 0, -34], clamp);
  const opacity = interpolate(frameWithinWord, [0, 0.2 * fps, 0.78 * fps, fps], [0, 1, 1, 0], clamp);

  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-50 p-8">
      <div
        style={{
          transform: `translateY(${yOffset}px)`,
          opacity,
        }}
        className={`text-center text-[44px] font-black uppercase leading-none tracking-tighter sm:text-5xl ${
          currentWordIndex === accentWordIndex ? "text-brand-coral-500" : "text-slate-900"
        }`}
      >
        {currentWord}
      </div>
    </div>
  );
}

function SignalLineIntro({
  words,
  accentWordIndex,
}: Required<Pick<IntroCompositionProps, "words" | "accentWordIndex">>) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const title = words[accentWordIndex] ?? words.at(-1) ?? "JUO.";
  const lineOne = words[0] ?? "RESCUE.";
  const lineTwo = words[1] ?? "RE-HOMING.";
  const signal = spring({ frame, fps, durationInFrames: 34, config: { damping: 200 } });
  const titleIn = spring({ frame: frame - 26, fps, durationInFrames: 42, config: { damping: 20, stiffness: 160 } });
  const topText = interpolate(frame, [10, 24], [0, 1], clamp);
  const bottomText = interpolate(frame, [48, 68], [0, 1], clamp);
  const fadeOut = interpolate(frame, [86, 96], [1, 0.92], clamp);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-slate-950 p-8 text-white">
      <div className="absolute left-8 top-8 h-20 w-px bg-brand-coral-500" />
      <div className="absolute bottom-10 right-8 h-px w-24 bg-white/18" />
      <div className="flex w-full flex-col gap-7" style={{ opacity: fadeOut }}>
        <div
          style={{
            opacity: topText,
            transform: `translateY(${interpolate(topText, [0, 1], [16, 0])}px)`,
          }}
          className="text-[11px] font-black uppercase tracking-[0.24em] text-brand-coral-200"
        >
          {lineOne}
        </div>
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((index) => {
            const width = interpolate(signal, [0, 1], [26 + index * 16, 280 - index * 34]);
            return (
              <div
                key={index}
                className={index === 1 ? "h-3 rounded-full bg-brand-coral-500" : "h-3 rounded-full bg-white"}
                style={{
                  width,
                  opacity: index === 1 ? 1 : 0.18 + index * 0.16,
                }}
              />
            );
          })}
        </div>
        <div
          style={{
            transform: `translateY(${interpolate(titleIn, [0, 1], [36, 0])}px)`,
            opacity: titleIn,
          }}
          className="text-[48px] font-black uppercase leading-none tracking-tighter text-white"
        >
          {title}
        </div>
        <div
          style={{
            opacity: bottomText,
            transform: `translateY(${interpolate(bottomText, [0, 1], [12, 0])}px)`,
          }}
          className="max-w-[300px] text-sm font-semibold leading-relaxed text-slate-300"
        >
          {lineTwo}
        </div>
      </div>
    </div>
  );
}

function StampIntro({
  words,
  accentWordIndex,
}: Required<Pick<IntroCompositionProps, "words" | "accentWordIndex">>) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const title = words[accentWordIndex] ?? words.at(-1) ?? "JUO.";
  const first = words[0] ?? "RESCUE.";
  const second = words[1] ?? "RE-HOMING.";
  const stamp = spring({ frame: frame - 8, fps, durationInFrames: 28, config: { damping: 9, stiffness: 120 } });
  const ring = interpolate(frame, [4, 36], [0, 1], { ...clamp, easing: Easing.out(Easing.circle) });
  const smallText = interpolate(frame, [34, 52], [0, 1], clamp);
  const rotate = interpolate(stamp, [0, 1], [-9, -2]);
  const scale = interpolate(stamp, [0, 1], [1.34, 1]);

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#fff8f8] p-8">
      <div className="relative flex h-[310px] w-[310px] items-center justify-center">
        <div
          className="absolute inset-0 rounded-full border-2 border-slate-900"
          style={{
            opacity: ring,
            transform: `scale(${interpolate(ring, [0, 1], [0.82, 1])})`,
          }}
        />
        <div
          className="absolute inset-7 rounded-full border border-brand-coral-500"
          style={{
            opacity: ring,
            transform: `scale(${interpolate(ring, [0, 1], [0.72, 1])})`,
          }}
        />
        <div
          className="relative flex h-[176px] w-[248px] flex-col items-center justify-center border-[5px] border-brand-coral-500 bg-white px-5 text-center shadow-[8px_8px_0px_0px_rgba(15,23,42,0.12)]"
          style={{
            opacity: stamp,
            transform: `rotate(${rotate}deg) scale(${scale})`,
          }}
        >
          <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
            {first}
          </div>
          <div className="mt-3 text-[38px] font-black uppercase leading-none tracking-tighter text-brand-coral-500">
            {title}
          </div>
          <div className="mt-3 h-1 w-16 bg-slate-900" />
        </div>
        <div
          className="absolute bottom-6 text-center text-[13px] font-black uppercase tracking-[0.2em] text-slate-900"
          style={{
            opacity: smallText,
            transform: `translateY(${interpolate(smallText, [0, 1], [12, 0])}px)`,
          }}
        >
          {second}
        </div>
      </div>
    </div>
  );
}

function CareStepsIntro({
  words,
  accentWordIndex,
}: Required<Pick<IntroCompositionProps, "words" | "accentWordIndex">>) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const title = words[accentWordIndex] ?? words.at(-1) ?? "JUO.";
  const progress = interpolate(frame, [0, 78], [0, 1], clamp);
  const titleIn = spring({ frame: frame - 46, fps, durationInFrames: 36, config: { damping: 200 } });
  const steps = ["상담", "만남", "가족"];

  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-50 p-8">
      <div className="flex w-full flex-col gap-8">
        <div className="flex items-center gap-3">
          <div
            className="h-px bg-brand-coral-500"
            style={{
              width: interpolate(progress, [0, 1], [0, 132]),
            }}
          />
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            RE-HOMING FLOW
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {steps.map((step, index) => {
            const stepIn = spring({
              frame: frame - (index * 13 + 8),
              fps,
              durationInFrames: 28,
              config: { damping: 200 },
            });
            return (
              <div
                key={step}
                className="flex items-center gap-4"
                style={{
                  opacity: stepIn,
                  transform: `translateX(${interpolate(stepIn, [0, 1], [-28, 0])}px)`,
                }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-brand-coral-500 bg-white text-sm font-black text-brand-coral-500">
                  {index + 1}
                </div>
                <div className="text-[30px] font-black leading-none tracking-tighter text-slate-900">
                  {step}
                </div>
              </div>
            );
          })}
        </div>
        <div
          className="text-[48px] font-black uppercase leading-none tracking-tighter text-brand-coral-500"
          style={{
            opacity: titleIn,
            transform: `translateY(${interpolate(titleIn, [0, 1], [30, 0])}px)`,
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}
