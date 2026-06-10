# 멍BTI 풀 리빌드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 멍BTI(7문항·3축·8유형 Vite SPA 흡수본)를 Next 네이티브로 풀 리빌드 — 4축 16유형·12문항, firebase 제거, D1 3테이블, snapdom 캡처, 카카오 공유, 빌드타임 OG 합성, 주멍이 일러스트.

**Architecture:** App Router `(site)/petbti` 인트로(정적) → `/quiz`(클라) → `/result/[type]`(SSG 16종 + 클라 섬). 데이터는 코드(문항·점수·유형) + D1(집계·응답·추천제품). 1단계 기반(직렬: 버전 업그레이드·삭제·타입 스캐폴드) → 2단계 5워크스트림 병렬(콘텐츠·화면·OG·데이터·admin) → 3단계 통합·배포.

**Tech Stack:** Next 16.2.x + @opennextjs/cloudflare 1.19.x → Cloudflare Workers, D1, Tailwind v4, React 19, TS strict, vitest, snapdom, Kakao JS SDK, gtag.

**승인 스펙:** `docs/superpowers/specs/2026-06-10-petbti-rebuild-design.md` (이하 "스펙"). 16유형 별명·추천·장면·궁합 표 = 스펙 §1.4, 16개 이미지 프롬프트 = 스펙 §5, 보존 계약 = 스펙 "보존/폐기".

**전역 규칙:**
- 설치는 `npx npm@10.9.2 install`(CI lockfile 호환). 빌드 검증은 항상 클린: `Remove-Item -Recurse -Force .next; npx opennextjs-cloudflare build`(증분 TS 진단 불신, 클린 빌드만 신뢰).
- 단위 테스트: `npm test`(vitest). 커밋 메시지 끝에 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- 커밋만 하고 **푸시는 3단계 통합 후 사용자 승인 시**(master 푸시 = 즉시 배포).
- D1 스키마/시드는 wrangler 미인증 → Cloudflare 대시보드 D1 콘솔에 SQL 붙여넣기(`--` 주석 줄 제거).

---

## 파일 구조 (생성/수정 맵)

**기반(1단계)**
- Modify: `package.json`(deps 업그레이드·제거), `open-next.config.ts`(캐시), `db/schema.sql`(3테이블·16시드)
- Delete: `src/features/petbti/**`(구 SPA 흡수본), `src/app/(site)/petbti/PetBtiClient.tsx`
- Create: `src/features/petbti/data/types.ts`(16유형 메타·축·코드 — 공유 계약), `src/features/petbti/lib/score.ts`(Question 인터페이스·calculateResult 시그니처 스텁), `src/features/petbti/data/questions.ts`(타입드 스텁)

**워크스트림 A 콘텐츠·로직** — `data/questions.ts`, `lib/score.ts`, `lib/__tests__/score.test.ts`
**워크스트림 B 화면** — `app/(site)/petbti/quiz/QuizClient.tsx`, `components/{ResultView,ResultCard,StoryCard,SaveImageButton,ShareButtons,RarityBadge,LoadingBake}.tsx`
**워크스트림 C OG·비주얼** — `scripts/generate-og.mjs`, `public/og/petbti/*.png`, `data/types.ts`의 컬러(기반에서 정의)
**워크스트림 D 데이터·API·호환** — `lib/petbtiDb.ts`, `lib/petbtiProductValidation.ts`, `app/api/petbti/{stats,result,products}/route.ts`, `app/admin/api/petbti/{products/route.ts,products/[type]/route.ts,answers/route.ts}`, `features/petbti/lib/ga.ts`, `app/(site)/petbti/legacyRedirect.ts`
**워크스트림 E admin** — `features/admin/components/PetbtiProductsManager.tsx`, admin 배선, `features/admin/lib/constants.ts` 정합화
**통합(3단계)** — `app/(site)/petbti/page.tsx`, `app/(site)/petbti/quiz/page.tsx`, `app/(site)/petbti/result/[type]/page.tsx`, 브랜드 카드(`src/data/linkPages/*.ts`)

---

# 1단계 — 기반 (직렬, 선행)

### Task F1: 버전 동반 업그레이드 + 클린 빌드 베이스라인

**Files:** Modify `package.json`

- [ ] **Step 1: 최신 호환 버전 확인**

Run: `npx npm@10.9.2 view next dist-tags.latest; npx npm@10.9.2 view @opennextjs/cloudflare dist-tags.latest`
Expected: Next `16.2.x`(≥16.2.6), adapter `1.19.x`(≥1.19.11) 류 출력. 두 값을 기록.

- [ ] **Step 2: package.json 버전 갱신**

`next`/`eslint-config-next`를 확인된 16.2.x 최신으로, `@opennextjs/cloudflare`를 1.19.x 최신으로 수정:
```jsonc
"next": "16.2.8",                 // Step 1에서 확인한 값
"eslint-config-next": "16.2.8",
// devDependencies
"@opennextjs/cloudflare": "^1.19.11"  // Step 1에서 확인한 값
```

- [ ] **Step 3: 설치 + 클린 빌드**

Run: `npx npm@10.9.2 install; Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue; npx opennextjs-cloudflare build`
Expected: 빌드 성공(현행 기능 그대로). 실패 시 어댑터 릴리스 노트의 호환 Next 버전으로 재조정.

- [ ] **Step 4: 커밋**

```bash
git add package.json package-lock.json
git commit -m "chore: upgrade Next + opennextjs-cloudflare for petbti rebuild"
```

### Task F2: 구 petbti 삭제 + 죽은 의존성 제거 + 캐시 설정

**Files:** Delete `src/features/petbti/**`, `src/app/(site)/petbti/PetBtiClient.tsx`; Modify `src/app/(site)/petbti/page.tsx`, `open-next.config.ts`, `package.json`

- [ ] **Step 1: 구 흡수본 삭제**

Run:
```powershell
Remove-Item -Recurse -Force src/features/petbti
Remove-Item -Force "src/app/(site)/petbti/PetBtiClient.tsx"
```
(`/api/petbti/*`·admin 은 firebase 미사용이므로 그대로 둔다.)

- [ ] **Step 2: /petbti 임시 플레이스홀더**

Replace `src/app/(site)/petbti/page.tsx` 전체:
```tsx
export const metadata = { title: "멍BTI 행동학 테스트 | 펫푸드 주오" };

export default function PetBtiPage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center p-8 text-center">
      <p className="text-charcoal/60">멍BTI 새 단장 중이에요 🐾</p>
    </main>
  );
}
```

- [ ] **Step 3: 죽은 의존성 제거**

`package.json` dependencies 에서 `firebase`, `html2canvas`, `html-to-image` 3줄 삭제.

- [ ] **Step 4: incremental cache 설정**

Replace `open-next.config.ts` 전체:
```ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
```

- [ ] **Step 5: 재설치 + 클린 빌드 검증**

Run: `npx npm@10.9.2 install; Remove-Item -Recurse -Force .next; npx opennextjs-cloudflare build`
Expected: 빌드 성공(firebase/html-to-image 참조 0 → 미설치여도 통과).

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "chore: remove legacy petbti SPA + firebase/html-to-image deps, add static-assets cache"
```

### Task F3: 공유 타입·16유형 메타 (`data/types.ts`)

**Files:** Create `src/features/petbti/data/types.ts`; Test `src/features/petbti/data/types.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/features/petbti/data/types.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { PET_TYPES, PET_TYPE_CODES, AXES } from "./types";

describe("PET_TYPES", () => {
  it("정확히 16유형, 코드 중복 없음", () => {
    expect(PET_TYPE_CODES).toHaveLength(16);
    expect(new Set(PET_TYPE_CODES).size).toBe(16);
  });
  it("모든 유형이 필수 필드를 가짐", () => {
    for (const code of PET_TYPE_CODES) {
      const t = PET_TYPES[code];
      expect(t.nickname.length).toBeGreaterThan(0);
      expect(t.catchphrase.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(0);
      expect(t.recommendedProduct.length).toBeGreaterThan(0);
      expect(t.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(PET_TYPE_CODES).toContain(t.soulmate);
      expect(PET_TYPE_CODES).toContain(t.clash);
    }
  });
  it("4축 각 양극 글자가 코드와 정합", () => {
    expect(AXES.map((a) => a.key)).toEqual(["energy", "social", "bold", "appetite"]);
    for (const code of PET_TYPE_CODES) {
      expect(code).toMatch(/^[EC][SR][BT][GP]$/);
    }
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- types.test`
Expected: FAIL ("Cannot find module './types'").

- [ ] **Step 3: types.ts 구현**

`src/features/petbti/data/types.ts` — 축 정의 + 16유형 메타. **16유형 전부**를 스펙 §1.4 표(별명·추천제품·성향)에서 옮기고, `description`은 브랜드 담백 톤(장면묘사→강점→긍정변환), `color`는 유형 팔레트, `soulmate`/`clash`는 스펙 §1 궁합 규칙(에너지·대담함 반대=찰떡 / 4글자 정반대=상극):
```ts
export const AXES = [
  { key: "energy", poles: { first: "E", second: "C" }, label: "에너지", left: "활발", right: "차분" },
  { key: "social", poles: { first: "S", second: "R" }, label: "사회성", left: "사교", right: "낯가림" },
  { key: "bold",   poles: { first: "B", second: "T" }, label: "대담함", left: "대담", right: "신중" },
  { key: "appetite", poles: { first: "G", second: "P" }, label: "식탐", left: "식탐", right: "까탈" },
] as const;

export type AxisKey = (typeof AXES)[number]["key"];
export type Pole = "E"|"C"|"S"|"R"|"B"|"T"|"G"|"P";

export const PET_TYPE_CODES = [
  "ESBG","ESBP","ESTG","ESTP","ERBG","ERBP","ERTG","ERTP",
  "CSBG","CSBP","CSTG","CSTP","CRBG","CRBP","CRTG","CRTP",
] as const;
export type PetTypeCode = (typeof PET_TYPE_CODES)[number];

export interface TypeMeta {
  code: PetTypeCode;
  nickname: string;        // 별명 (스펙 §1.4)
  catchphrase: string;     // 한 줄 캐치프레이즈
  description: string;     // 2~3문장, 장면묘사→강점→긍정변환 (브랜드 담백 톤)
  traits: string[];        // ["활발","사교","대담","식탐"]
  color: string;           // 유형 액센트 (#RRGGBB)
  recommendedProduct: string; // 기본 추천(스펙 §1.4) — D1 미설정 시 폴백
  soulmate: PetTypeCode;
  clash: PetTypeCode;
}

// 예시 2종 (full). 나머지 14종도 동일 구조로 스펙 §1.4 에서 완성할 것.
export const PET_TYPES: Record<PetTypeCode, TypeMeta> = {
  ERBG: {
    code: "ERBG",
    nickname: "우리집 파괴왕 먹보",
    catchphrase: "밖에선 새침, 집에선 폭발하는 에너지 파괴왕",
    description:
      "보호자가 없을 때 쿠션을 잘근잘근 — 넘치는 에너지와 식탐을 '오래 씹기'로 풀어야 직성이 풀리는 터프가이예요. 낯선 사람 앞에선 의외로 새침. 파괴는 못된 게 아니라 에너지가 갈 곳을 찾는 신호라, 든든히 씹을 거리만 있으면 천사가 돼요.",
    traits: ["활발", "낯가림", "대담", "식탐"],
    color: "#D94833",
    recommendedProduct: "우족 슬라이스",
    soulmate: "CRTG",
    clash: "CSTP",
  },
  CRTP: {
    code: "CRTP",
    nickname: "고독한 미식 황제",
    catchphrase: "아무거나 먹지 않개, 최고만 허락하는 1인 미식가",
    description:
      "방석 위에서 느긋하게, 혼자만의 시간을 즐기는 황제마마. 낯선 식감엔 냄새만 맡고 돌아서는 확고한 기준이 있어요. 까다로운 게 아니라 좋은 걸 알아보는 거예요 — 순수 육즙의 기호성 만점 간식이면 단번에 마음을 엽니다.",
    traits: ["차분", "낯가림", "신중", "까탈"],
    color: "#5D7A8C",
    recommendedProduct: "닭가슴살 육포",
    soulmate: "ESBG",
    clash: "ESBG",
  },
  // … 나머지 14종 (ESBG, ESBP, ESTG, ESTP, ERBP, ERTG, ERTP, CSBG, CSBP, CSTG, CSTP, CRBG, CRBP, CRTG)
} as Record<PetTypeCode, TypeMeta>;
```
**완성 지침:** 14종을 스펙 §1.4 표의 별명·추천제품으로 채우고, description 은 위 톤으로 작성, color 는 유형별 구분되는 파스텔/딥 톤, soulmate=에너지·대담함 반대(사회성·식탐 동일)·clash=4글자 정반대. `as Record` 단언은 16종 모두 채운 뒤 제거.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- types.test`
Expected: PASS (3 tests).

- [ ] **Step 5: 커밋**

```bash
git add src/features/petbti/data/types.ts src/features/petbti/data/types.test.ts
git commit -m "feat(petbti): add 16-type metadata + axis definitions (shared contract)"
```

### Task F4: 채점 계약 스텁 (`lib/score.ts` + `data/questions.ts`)

**Files:** Create `src/features/petbti/lib/score.ts`, `src/features/petbti/data/questions.ts`

- [ ] **Step 1: score.ts 인터페이스 + 스텁**

`src/features/petbti/lib/score.ts`:
```ts
import type { AxisKey, Pole, PetTypeCode } from "../data/types";

export interface QuizOption {
  label: string;   // 선택지 텍스트
  pole: Pole;      // 이 선택이 가산하는 극
}
export interface Question {
  id: string;          // "q1"…"q12"
  axis: AxisKey;       // 이 문항이 측정하는 축
  prompt: string;      // 질문 텍스트
  options: [QuizOption, QuizOption]; // 2지선다
}

/** 12개 응답(문항 순서대로 pole) → 4글자 유형 코드. 축당 3문항 다수결, 동점 없음. */
export function calculateResult(_answers: Pole[]): PetTypeCode {
  throw new Error("not implemented"); // Task A2 에서 구현
}
```

- [ ] **Step 2: questions.ts 타입드 스텁**

`src/features/petbti/data/questions.ts`:
```ts
import type { Question } from "../lib/score";

// Task A1 에서 12문항으로 채움 (축당 3개)
export const QUESTIONS: Question[] = [];
```

- [ ] **Step 3: 컴파일 확인 + 커밋**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 타입 에러 없음.
```bash
git add src/features/petbti/lib/score.ts src/features/petbti/data/questions.ts
git commit -m "feat(petbti): scaffold scoring contract (Question, calculateResult)"
```

---

# 2단계 — 5워크스트림 병렬

> F1–F4 머지 후 시작. 각 워크스트림은 파일 소유가 겹치지 않음. 서브에이전트로 병렬 디스패치.

## 워크스트림 A — 콘텐츠·로직

### Task A1: 12문항 작성 (`data/questions.ts`)

**Files:** Modify `src/features/petbti/data/questions.ts`

- [ ] **Step 1: 12문항 채우기**

스펙 §1(축별 예시) + 리서치 02 §4 문항 초안을 바탕으로 축당 3문항(에너지·사회성·대담함·식탐), 상황-행동 2지선다. 각 옵션 `pole` 은 해당 축의 양극 글자:
```ts
import type { Question } from "../lib/score";

export const QUESTIONS: Question[] = [
  { id: "q1", axis: "energy", prompt: "산책 나갈 때 우리 아이는?",
    options: [{ label: "현관에서 폴짝폴짝, 빨리 나가자고 안달", pole: "E" },
              { label: "천천히 일어나 느긋하게 따라나서요", pole: "C" }] },
  { id: "q2", axis: "energy", prompt: "집에서 평소 모습은?",
    options: [{ label: "장난감 물고 우다다 뛰어다녀요", pole: "E" },
              { label: "대부분 엎드려 쉬거나 자요", pole: "C" }] },
  { id: "q3", axis: "energy", prompt: "한참 놀고 난 뒤에는?",
    options: [{ label: "여전히 더 놀자고 졸라요", pole: "E" },
              { label: "금세 흥미를 잃고 자기 자리로 가요", pole: "C" }] },
  { id: "q4", axis: "social", prompt: "집에 손님이 왔을 때?",
    options: [{ label: "먼저 다가가 반기고 만져달라고 해요", pole: "S" },
              { label: "거리를 두고 살피거나 숨어요", pole: "R" }] },
  { id: "q5", axis: "social", prompt: "산책 중 낯선 사람이 인사하면?",
    options: [{ label: "꼬리 흔들며 다가가요", pole: "S" },
              { label: "슬쩍 피하거나 보호자 뒤로 가요", pole: "R" }] },
  { id: "q6", axis: "social", prompt: "처음 보는 사람이 만지려 할 때?",
    options: [{ label: "편하게 받아들여요", pole: "S" },
              { label: "몸을 빼거나 굳어요", pole: "R" }] },
  { id: "q7", axis: "bold", prompt: "처음 가본 장소나 낯선 물건 앞에서?",
    options: [{ label: "코를 들이밀며 적극 탐색해요", pole: "B" },
              { label: "멀찍이서 한참 관찰한 뒤 다가가요", pole: "T" }] },
  { id: "q8", axis: "bold", prompt: "갑자기 큰 소리(청소기·천둥)가 나면?",
    options: [{ label: "잠깐 놀라도 금방 아무렇지 않아요", pole: "B" },
              { label: "숨거나 한동안 긴장해요", pole: "T" }] },
  { id: "q9", axis: "bold", prompt: "새 간식이나 장난감을 처음 줄 때?",
    options: [{ label: "망설임 없이 바로 다가가 시도해요", pole: "B" },
              { label: "냄새부터 조심스럽게 맡아봐요", pole: "T" }] },
  { id: "q10", axis: "appetite", prompt: "간식을 줬을 때 반응은?",
    options: [{ label: "입으로 직행, 1초 만에 순삭해요", pole: "G" },
              { label: "냄새부터 꼼꼼히, 맘에 안 들면 뱉어요", pole: "P" }] },
  { id: "q11", axis: "appetite", prompt: "평소 밥 먹는 속도는?",
    options: [{ label: "청소기처럼 그릇을 싹 비워요", pole: "G" },
              { label: "한 알씩 꼭꼭, 배고플 때만 조금씩", pole: "P" }] },
  { id: "q12", axis: "appetite", prompt: "새로운 사료로 바꿨을 때?",
    options: [{ label: "가리지 않고 잘 먹어요", pole: "G" },
              { label: "입맛에 맞아야만 먹어요", pole: "P" }] },
];
```

- [ ] **Step 2: 컴파일 확인 + 커밋**

Run: `npx tsc --noEmit`
Expected: 에러 없음.
```bash
git add src/features/petbti/data/questions.ts
git commit -m "feat(petbti): author 12 quiz questions (3 per axis)"
```

### Task A2: 채점 로직 구현 (TDD)

**Files:** Modify `src/features/petbti/lib/score.ts`; Create `src/features/petbti/lib/score.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/features/petbti/lib/score.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { calculateResult } from "./score";
import { QUESTIONS } from "../data/questions";
import { PET_TYPE_CODES, type Pole } from "../data/types";

describe("calculateResult", () => {
  it("모든 극을 첫 번째로 선택하면 ESBG", () => {
    expect(calculateResult(["E","E","E","S","S","S","B","B","B","G","G","G"])).toBe("ESBG");
  });
  it("모든 극을 두 번째로 선택하면 CRTP", () => {
    expect(calculateResult(["C","C","C","R","R","R","T","T","T","P","P","P"])).toBe("CRTP");
  });
  it("축당 2:1 다수결로 결정 (혼합)", () => {
    // energy: E,E,C → E / social: R,R,S → R / bold: B,T,B → B / appetite: P,P,G → P
    expect(calculateResult(["E","E","C","R","R","S","B","T","B","P","P","G"])).toBe("ERBP");
  });
  it("문항 수와 정렬이 QUESTIONS 와 일치", () => {
    expect(QUESTIONS).toHaveLength(12);
    expect(QUESTIONS.map((q) => q.axis)).toEqual([
      "energy","energy","energy","social","social","social",
      "bold","bold","bold","appetite","appetite","appetite",
    ]);
  });
  it("16개 코드 전부 도달 가능 (전수)", () => {
    const reached = new Set<string>();
    const poles: [Pole,Pole][] = [["E","C"],["S","R"],["B","T"],["G","P"]];
    for (let m = 0; m < 16; m++) {
      const ans: Pole[] = [];
      poles.forEach((p, axis) => {
        const pole = (m >> axis) & 1 ? p[1] : p[0];
        ans.push(pole, pole, pole); // 축당 3문항 동일 극
      });
      reached.add(calculateResult(ans));
    }
    expect(reached.size).toBe(16);
    PET_TYPE_CODES.forEach((c) => expect(reached.has(c)).toBe(true));
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- score.test`
Expected: FAIL ("not implemented").

- [ ] **Step 3: calculateResult 구현**

`src/features/petbti/lib/score.ts` 의 함수 교체:
```ts
import { AXES, PET_TYPE_CODES } from "../data/types";
import type { Pole, PetTypeCode } from "../data/types";

export function calculateResult(answers: Pole[]): PetTypeCode {
  if (answers.length !== 12) throw new Error(`expected 12 answers, got ${answers.length}`);
  let code = "";
  AXES.forEach((axis, i) => {
    const slice = answers.slice(i * 3, i * 3 + 3);
    const firstCount = slice.filter((p) => p === axis.poles.first).length;
    code += firstCount >= 2 ? axis.poles.first : axis.poles.second; // 홀수라 동점 없음
  });
  if (!(PET_TYPE_CODES as readonly string[]).includes(code)) {
    throw new Error(`invalid code: ${code}`);
  }
  return code as PetTypeCode;
}
```

- [ ] **Step 4: 통과 확인 + 커밋**

Run: `npm test -- score.test`
Expected: PASS (5 tests).
```bash
git add src/features/petbti/lib/score.ts src/features/petbti/lib/score.test.ts
git commit -m "feat(petbti): implement majority-vote scoring (no ties)"
```

## 워크스트림 D — 데이터·API·호환

### Task D1: D1 스키마 3테이블

**Files:** Modify `db/schema.sql`

- [ ] **Step 1: 스키마 추가**

`db/schema.sql` 의 `petbti_stats` 시드를 16유형으로 교체하고 두 테이블 추가:
```sql
-- petbti_stats: 시드를 16유형으로 (기존 8유형 INSERT 줄 교체)
INSERT OR IGNORE INTO petbti_stats (type_code, count) VALUES
  ('ESBG',0),('ESBP',0),('ESTG',0),('ESTP',0),('ERBG',0),('ERBP',0),('ERTG',0),('ERTP',0),
  ('CSBG',0),('CSBP',0),('CSTG',0),('CSTP',0),('CRBG',0),('CRBP',0),('CRTG',0),('CRTP',0);

CREATE TABLE IF NOT EXISTS petbti_responses (
  id          TEXT PRIMARY KEY,
  result_type TEXT NOT NULL,
  answers     TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_petbti_responses_created ON petbti_responses(created_at);
CREATE INDEX IF NOT EXISTS idx_petbti_responses_type    ON petbti_responses(result_type);

CREATE TABLE IF NOT EXISTS petbti_products (
  type_code    TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  image_url    TEXT,
  reason       TEXT,
  shop_url     TEXT,
  updated_at   INTEGER NOT NULL DEFAULT 0
);
```
(구 8유형 stats 행은 D1 콘솔에서 `DELETE FROM petbti_stats WHERE type_code IN ('EGA','EGI','EPI','EPA','CGA','CGI','CPA','CPI');` 로 정리 — 3단계 시드 시 실행.)

- [ ] **Step 2: 커밋**

```bash
git add db/schema.sql
git commit -m "feat(petbti): D1 schema — 16-type stats seed, responses, products tables"
```

### Task D2: petbtiDb 헬퍼 (TDD 가능한 순수부 분리)

**Files:** Create `src/lib/petbtiDb.ts`

- [ ] **Step 1: 구현** (foodsDb 패턴 미러)

```ts
import { getDb } from "./d1";
import { PET_TYPE_CODES, PET_TYPES, type PetTypeCode } from "@/features/petbti/data/types";

export interface PetbtiProduct {
  typeCode: PetTypeCode;
  productName: string;
  imageUrl?: string;
  reason?: string;
  shopUrl?: string;
}

export type StatsMap = Record<string, number> & { total: number };

/** 유형별 카운트 + total. 실패는 호출부(라우트)에서 처리. */
export async function getStats(): Promise<StatsMap> {
  const { results } = await getDb()
    .prepare("SELECT type_code, count FROM petbti_stats")
    .all<{ type_code: string; count: number }>();
  const map = {} as StatsMap;
  let total = 0;
  for (const r of results) { map[r.type_code] = r.count; total += r.count; }
  map.total = total;
  return map;
}

/** 결과 1건 기록: 카운터 +1 + 응답 raw INSERT (batch). */
export async function recordResult(typeCode: PetTypeCode, answers: string): Promise<void> {
  const db = getDb();
  await db.prepare(
    `INSERT INTO petbti_stats (type_code, count) VALUES (?, 1)
     ON CONFLICT(type_code) DO UPDATE SET count = count + 1`
  ).bind(typeCode).run();
  await db.prepare(
    `INSERT INTO petbti_responses (id, result_type, answers, created_at) VALUES (?, ?, ?, ?)`
  ).bind(crypto.randomUUID(), typeCode, answers, Date.now()).run();
}

type ProductRow = { type_code: string; product_name: string; image_url: string|null; reason: string|null; shop_url: string|null };
function rowToProduct(r: ProductRow): PetbtiProduct {
  const p: PetbtiProduct = { typeCode: r.type_code as PetTypeCode, productName: r.product_name };
  if (r.image_url != null) p.imageUrl = r.image_url;
  if (r.reason != null) p.reason = r.reason;
  if (r.shop_url != null) p.shopUrl = r.shop_url;
  return p;
}

/** 전체 추천제품. 미설정 유형은 types.ts 기본값으로 폴백 채움(항상 16개 보장). */
export async function getAllProducts(): Promise<PetbtiProduct[]> {
  const { results } = await getDb().prepare("SELECT * FROM petbti_products").all<ProductRow>();
  const byCode = new Map(results.map((r) => [r.type_code, rowToProduct(r)]));
  return PET_TYPE_CODES.map((code) =>
    byCode.get(code) ?? { typeCode: code, productName: PET_TYPES[code].recommendedProduct }
  );
}

export async function upsertProduct(p: PetbtiProduct): Promise<void> {
  await getDb().prepare(
    `INSERT INTO petbti_products (type_code, product_name, image_url, reason, shop_url, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(type_code) DO UPDATE SET
       product_name=excluded.product_name, image_url=excluded.image_url,
       reason=excluded.reason, shop_url=excluded.shop_url, updated_at=excluded.updated_at`
  ).bind(p.typeCode, p.productName, p.imageUrl ?? null, p.reason ?? null, p.shopUrl ?? null, Date.now()).run();
}

/** 문항별 분포: answers 12자 문자열에서 위치별 pole 집계. */
export async function getAnswerDistribution(sinceMs: number): Promise<Record<number, Record<string, number>>> {
  const { results } = await getDb()
    .prepare("SELECT answers FROM petbti_responses WHERE created_at >= ?")
    .bind(sinceMs).all<{ answers: string }>();
  const dist: Record<number, Record<string, number>> = {};
  for (const { answers } of results) {
    for (let i = 0; i < answers.length; i++) {
      (dist[i] ??= {})[answers[i]] = ((dist[i][answers[i]]) ?? 0) + 1;
    }
  }
  return dist;
}
```

- [ ] **Step 2: 컴파일 확인 + 커밋**

Run: `npx tsc --noEmit`
```bash
git add src/lib/petbtiDb.ts
git commit -m "feat(petbti): D1 helpers — stats, recordResult, products, answer distribution"
```

### Task D3: 추천제품 검증 모듈 (TDD)

**Files:** Create `src/lib/petbtiProductValidation.ts`, `src/lib/petbtiProductValidation.test.ts`

- [ ] **Step 1: 실패 테스트**

```ts
import { describe, it, expect } from "vitest";
import { validateProductInput } from "./petbtiProductValidation";

describe("validateProductInput", () => {
  it("정상 입력 통과", () => {
    const r = validateProductInput({ typeCode: "ESBG", productName: "우족 슬라이스", reason: "씹기" });
    expect(r.ok).toBe(true);
  });
  it("잘못된 typeCode 거부", () => {
    expect(validateProductInput({ typeCode: "ZZZZ", productName: "x" }).ok).toBe(false);
  });
  it("빈 productName 거부", () => {
    expect(validateProductInput({ typeCode: "ESBG", productName: "  " }).ok).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm test -- petbtiProductValidation`

- [ ] **Step 3: 구현**

```ts
import { PET_TYPE_CODES, type PetTypeCode } from "@/features/petbti/data/types";
import type { PetbtiProduct } from "./petbtiDb";

type Result = { ok: true; value: PetbtiProduct } | { ok: false; error: string };

export function validateProductInput(input: unknown): Result {
  if (typeof input !== "object" || input === null) return { ok: false, error: "본문이 객체가 아니에요." };
  const o = input as Record<string, unknown>;
  if (typeof o.typeCode !== "string" || !(PET_TYPE_CODES as readonly string[]).includes(o.typeCode))
    return { ok: false, error: "typeCode 가 16유형 중 하나가 아니에요." };
  if (typeof o.productName !== "string" || o.productName.trim().length === 0)
    return { ok: false, error: "productName 은 필수예요." };
  const opt = (k: string) => (typeof o[k] === "string" && (o[k] as string).trim().length > 0 ? (o[k] as string).trim() : undefined);
  const value: PetbtiProduct = { typeCode: o.typeCode as PetTypeCode, productName: o.productName.trim() };
  const img = opt("imageUrl"); if (img) value.imageUrl = img;
  const rs = opt("reason"); if (rs) value.reason = rs;
  const su = opt("shopUrl"); if (su) value.shopUrl = su;
  return { ok: true, value };
}
```

- [ ] **Step 4: 통과 + 커밋**

Run: `npm test -- petbtiProductValidation`
```bash
git add src/lib/petbtiProductValidation.ts src/lib/petbtiProductValidation.test.ts
git commit -m "feat(petbti): product validation module"
```

### Task D4: 공개 API 라우트 (stats·result·products)

**Files:** Modify `src/app/api/petbti/stats/route.ts`, `src/app/api/petbti/result/route.ts`; Create `src/app/api/petbti/products/route.ts`

- [ ] **Step 1: stats — 캐시 추가**

Replace `src/app/api/petbti/stats/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getStats } from "@/lib/petbtiDb";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(await getStats(), {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (e) {
    console.error("petbti stats failed:", e);
    return NextResponse.json(null); // 200+null → 희귀도 배지만 숨김(무해)
  }
}
```

- [ ] **Step 2: result — 카운터+응답 기록**

Replace `src/app/api/petbti/result/route.ts`:
```ts
import { NextResponse } from "next/server";
import { recordResult } from "@/lib/petbtiDb";
import { PET_TYPE_CODES, type PetTypeCode } from "@/features/petbti/data/types";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 }); }
  const o = body as Record<string, unknown>;
  if (typeof o?.typeCode !== "string" || !(PET_TYPE_CODES as readonly string[]).includes(o.typeCode))
    return NextResponse.json({ ok: false, error: "invalid typeCode" }, { status: 400 });
  const answers = typeof o.answers === "string" && /^[ECSRBTGP]{12}$/.test(o.answers) ? o.answers : "";
  try {
    await recordResult(o.typeCode as PetTypeCode, answers);
    return NextResponse.json({ ok: true });
  } catch (e) { console.error("petbti result failed:", e); return NextResponse.json({ ok: false }, { status: 500 }); }
}
```

- [ ] **Step 3: products — 공개 GET**

Create `src/app/api/petbti/products/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/petbtiDb";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(await getAllProducts(), {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (e) { console.error("petbti products failed:", e); return NextResponse.json({ error: "unavailable" }, { status: 500 }); }
}
```

- [ ] **Step 4: 빌드 확인 + 커밋**

Run: `npx tsc --noEmit`
```bash
git add src/app/api/petbti
git commit -m "feat(petbti): public API — stats(cached), result(record), products"
```

### Task D5: admin API (products CRUD + answers)

**Files:** Create `src/app/admin/api/petbti/products/route.ts`, `src/app/admin/api/petbti/products/[type]/route.ts`, `src/app/admin/api/petbti/answers/route.ts`

> Access 게이팅은 경로 `admin` 규칙으로 자동(스펙 보존). foods admin 라우트 패턴 미러.

- [ ] **Step 1: products 목록/upsert**

`src/app/admin/api/petbti/products/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getAllProducts, upsertProduct } from "@/lib/petbtiDb";
import { validateProductInput } from "@/lib/petbtiProductValidation";
export const dynamic = "force-dynamic";
export async function GET() {
  const items = await getAllProducts();
  return NextResponse.json(items, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(req: Request) {
  let body: unknown; try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid body" }, { status: 400 }); }
  const v = validateProductInput(body);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  await upsertProduct(v.value);
  return NextResponse.json({ ok: true }, { status: 201 });
}
```

- [ ] **Step 2: products [type] PUT/DELETE**

`src/app/admin/api/petbti/products/[type]/route.ts`:
```ts
import { NextResponse } from "next/server";
import { upsertProduct } from "@/lib/petbtiDb";
import { validateProductInput } from "@/lib/petbtiProductValidation";
import { getDb } from "@/lib/d1";
export const dynamic = "force-dynamic";
export async function PUT(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  let body: unknown; try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid body" }, { status: 400 }); }
  const v = validateProductInput({ ...(body as object), typeCode: type });
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  await upsertProduct(v.value);
  return NextResponse.json({ ok: true });
}
export async function DELETE(_req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  await getDb().prepare("DELETE FROM petbti_products WHERE type_code = ?").bind(type).run();
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: answers 분포**

`src/app/admin/api/petbti/answers/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getAnswerDistribution } from "@/lib/petbtiDb";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const days = Number(new URL(req.url).searchParams.get("days") ?? "30");
  const since = Date.now() - Math.max(1, days) * 86_400_000;
  try { return NextResponse.json(await getAnswerDistribution(since), { headers: { "Cache-Control": "no-store" } }); }
  catch (e) { console.error("answers dist failed:", e); return NextResponse.json({ error: "unavailable" }, { status: 500 }); }
}
```

- [ ] **Step 4: 빌드 + 커밋**

Run: `npx tsc --noEmit`
```bash
git add src/app/admin/api/petbti
git commit -m "feat(petbti): admin API — product CRUD + answer distribution (Access-gated)"
```

### Task D6: gtag 래퍼 + 레거시 `?r=` 리다이렉트

**Files:** Create `src/features/petbti/lib/ga.ts`, `src/app/(site)/petbti/legacyRedirect.ts`

- [ ] **Step 1: ga.ts (send_to 분리)**

```ts
const PETBTI_GA_ID = "G-P2G6LQGGSJ"; // 멍BTI 웹 스트림 (property 530064801) — 보존 계약

type GtagFn = (cmd: string, ...args: unknown[]) => void;
function gtag(): GtagFn | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { gtag?: GtagFn }).gtag ?? null;
}

/** 멍BTI 이벤트는 항상 send_to 로 멍BTI 스트림에만 전송 (이중 카운트 방지). */
export function trackPetbti(event: string, params: Record<string, unknown> = {}) {
  gtag()?.("event", event, { ...params, send_to: PETBTI_GA_ID });
}
export { PETBTI_GA_ID };
```

- [ ] **Step 2: 레거시 매핑 상수**

`src/app/(site)/petbti/legacyRedirect.ts`:
```ts
import type { PetTypeCode } from "@/features/petbti/data/types";
// 구 8유형(?r=result1..8) → 가장 근접한 신 16유형 (죽은 링크 방지용 근사 매핑)
export const LEGACY_RESULT_MAP: Record<string, PetTypeCode> = {
  result1: "ERBG", // 구 EGA 파괴왕
  result2: "ERTG", // 구 EGI 점프 관절
  result3: "ESTP", // 구 EPI 자기관리 헬스견
  result4: "CRBG", // 구 CGA 껌딱지 요정
  result5: "CRTG", // 구 CGI 선비견
  result6: "ESTG", // 구 CPA 참견쟁이
  result7: "CRTP", // 구 CPI 미식 황제
  result8: "ERTP", // 구 EPA 프로 예민러
};
```
(실제 리다이렉트는 Task I2 의 `/petbti/page.tsx` 에서 `searchParams.r` 확인 후 `redirect()`.)

- [ ] **Step 3: 커밋**

```bash
git add src/features/petbti/lib/ga.ts "src/app/(site)/petbti/legacyRedirect.ts"
git commit -m "feat(petbti): gtag wrapper (send_to split) + legacy ?r= type map"
```

## 워크스트림 C — OG·비주얼

### Task C1: OG 합성 스크립트

**Files:** Create `scripts/generate-og.mjs`; Modify `package.json`(scripts)

- [ ] **Step 1: sharp 설치(devDep, 빌드타임 전용)**

Run: `npx npm@10.9.2 install -D sharp`
(sharp 는 빌드 머신에서만 실행 — 워커 번들 무관.)

- [ ] **Step 2: generate-og.mjs 작성**

주멍이 PNG(`assets/petbti/jumeong/{TYPE}.png`, 사용자 제공·미존재 시 단색 플레이스홀더) + 유형명·별명·4축 미니바를 1200×630 으로 합성:
```js
import sharp from "sharp";
import { readFile, mkdir, access } from "node:fs/promises";
import { existsSync } from "node:fs";

const CODES = ["ESBG","ESBP","ESTG","ESTP","ERBG","ERBP","ERTG","ERTP","CSBG","CSBP","CSTG","CSTP","CRBG","CRBP","CRTG","CRTP"];
// types.ts 에서 nickname/color 를 읽기 위해 간단 파싱 대신, 별도 JSON 으로 export 하거나 여기 인라인.
// 권장: scripts/og-data.json (nickname,color) 를 types.ts 에서 생성하거나 손으로 동기화.
const META = JSON.parse(await readFile(new URL("./og-data.json", import.meta.url), "utf8"));

const W = 1200, H = 630;
await mkdir("public/og/petbti", { recursive: true });

for (const code of CODES) {
  const { nickname, color } = META[code];
  const dogPath = `assets/petbti/jumeong/${code}.png`;
  const hasDog = existsSync(dogPath);
  const dog = hasDog
    ? await sharp(dogPath).resize(440, 440, { fit: "contain", background: "#ffffff00" }).png().toBuffer()
    : await sharp({ create: { width: 440, height: 440, channels: 4, background: color + "33" } }).png().toBuffer();

  const svg = Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${W}" height="${H}" fill="#FDFCF8"/>
      <rect x="0" y="0" width="14" height="${H}" fill="${color}"/>
      <text x="560" y="250" font-family="sans-serif" font-size="40" fill="${color}" font-weight="700">${code}</text>
      <text x="560" y="320" font-family="sans-serif" font-size="60" fill="#2B2B2B" font-weight="800">${nickname}</text>
      <text x="560" y="380" font-family="sans-serif" font-size="30" fill="#888">멍BTI · 펫푸드 주오</text>
    </svg>`);

  await sharp({ create: { width: W, height: H, channels: 4, background: "#FDFCF8" } })
    .composite([{ input: dog, top: 95, left: 70 }, { input: svg, top: 0, left: 0 }])
    .png()
    .toFile(`public/og/petbti/${code}.png`);
  console.log(`og: ${code} ${hasDog ? "(주멍이)" : "(placeholder)"}`);
}
```
(한글 텍스트가 sharp/SVG 에서 폰트 미탑재로 깨지면, SVG `<text>` 대신 Noto Sans KR 서브셋을 `@font-face` 로 임베드하거나 satori 로 전환 — 빌드 스크립트라 런타임 무관.)

- [ ] **Step 3: og-data.json 동기화 스크립트 한 줄 + package.json**

`scripts/build-og-data.mjs`(types.ts 의 nickname/color 를 og-data.json 으로 추출) 또는 수기 동기화. `package.json` scripts 에 추가:
```jsonc
"og:data": "node scripts/build-og-data.mjs",
"og": "npm run og:data && node scripts/generate-og.mjs"
```

- [ ] **Step 4: 실행 + 커밋**

Run: `npm run og`
Expected: `public/og/petbti/{16}.png` 생성(주멍이 미제공분은 placeholder 로그).
```bash
git add scripts/generate-og.mjs scripts/build-og-data.mjs scripts/og-data.json public/og/petbti package.json package-lock.json
git commit -m "feat(petbti): build-time OG image compositing (16 types)"
```

## 워크스트림 B — 화면

> 패턴 참고: `src/components/FoodCheckSheet.tsx`(fetch+폴백), `StoreFinderSheet.tsx`. 멍BTI 팔레트는 `globals.css`. 동적 import 로 snapdom/kakao 를 클릭 시 로드(서버 평가 회피 → ssr:false 불필요).

### Task B1: snapdom 설치 + SaveImageButton

**Files:** Create `src/features/petbti/components/SaveImageButton.tsx`; Modify `package.json`

- [ ] **Step 1: snapdom 설치** — Run: `npx npm@10.9.2 install @zumer/snapdom`

- [ ] **Step 2: SaveImageButton 구현**

캡처 대상 ref + 파일명 받아 PNG 저장. snapdom 동적 import, `exclude`로 `.hide-on-capture` 제외:
```tsx
"use client";
import { useState } from "react";
export function SaveImageButton({ targetRef, filename, label = "이미지 저장", onSaved }:
  { targetRef: React.RefObject<HTMLElement | null>; filename: string; label?: string; onSaved?: () => void }) {
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!targetRef.current || busy) return;
    setBusy(true);
    try {
      const { snapdom } = await import("@zumer/snapdom");
      const result = await snapdom(targetRef.current, { scale: 2, exclude: [".hide-on-capture"], embedFonts: true });
      await result.download({ format: "png", filename });
      onSaved?.();
    } catch (e) { console.error("save failed:", e); alert("이미지 저장에 실패했어요. 다시 시도해 주세요."); }
    finally { setBusy(false); }
  }
  return <button onClick={save} disabled={busy} className="hide-on-capture …">{busy ? "저장 중…" : label}</button>;
}
```
(snapdom API 표면은 설치 후 `node -e "import('@zumer/snapdom').then(m=>console.log(Object.keys(m)))"` 로 확인하고 `download`/`toPng` 시그니처 맞출 것.)

- [ ] **Step 3: 커밋** — `git commit -m "feat(petbti): snapdom save-image button"`

### Task B2: ShareButtons (카카오 + native)

**Files:** Create `src/features/petbti/components/ShareButtons.tsx`, `src/features/petbti/lib/kakao.ts`

- [ ] **Step 1: kakao 로더**

```ts
const KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY!; // 카카오맵과 동일 JS 키 재사용
let loaded: Promise<void> | null = null;
function loadSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();
  if (loaded) return loaded;
  loaded = new Promise((res, rej) => {
    const w = window as unknown as { Kakao?: { isInitialized(): boolean; init(k: string): void } };
    if (w.Kakao?.isInitialized()) return res();
    const s = document.createElement("script");
    s.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"; // 버전·integrity 는 카카오 문서 최신값
    s.crossOrigin = "anonymous"; s.onload = () => { w.Kakao!.init(KEY); res(); }; s.onerror = rej;
    document.head.appendChild(s);
  });
  return loaded;
}
export async function shareKakao(opts: { title: string; description: string; imageUrl: string; url: string }) {
  await loadSdk();
  const Kakao = (window as unknown as { Kakao: any }).Kakao;
  Kakao.Share.sendDefault({
    objectType: "feed",
    content: { title: opts.title, description: opts.description, imageUrl: opts.imageUrl,
               link: { mobileWebUrl: opts.url, webUrl: opts.url } },
    buttons: [
      { title: "결과 보기", link: { mobileWebUrl: opts.url, webUrl: opts.url } },
      { title: "나도 테스트하기", link: { mobileWebUrl: location.origin + "/petbti", webUrl: location.origin + "/petbti" } },
    ],
  });
}
```

- [ ] **Step 2: ShareButtons** — 카카오/native share/링크복사 3버튼. `navigator.share` 미지원 시 클립보드. 각 클릭에 `trackPetbti("share_result"|"copy_link", {result_type})`. (코드는 FoodCheckSheet 의 버튼 패턴 + 위 shareKakao 호출.)

- [ ] **Step 3: 커밋** — `git commit -m "feat(petbti): share buttons (kakao feed + native + copy)"`

### Task B3: ResultCard + StoryCard (캡처 대상)

**Files:** Create `src/features/petbti/components/ResultCard.tsx`, `StoryCard.tsx`

- [ ] **Step 1: ResultCard(1:1)** — 주멍이 이미지(`/assets/petbti/jumeong/{code}.png` 또는 public 경로) + 유형명 + 별명 + 캐치프레이즈 + (선택)업로드한 강아지 사진 합성 영역. `TypeMeta` 받음. 정사각 레이아웃.
- [ ] **Step 2: StoryCard(9:16)** — 화면 밖 고정 1080×1920 레이아웃(`position:fixed; left:-9999px`), 같은 콘텐츠 세로 구성 + `@petfood.thejuo` 태그 자리. 캡처 전용.
- [ ] **Step 3: 커밋** — `git commit -m "feat(petbti): result card (1:1) + story card (9:16)"`

### Task B4: RarityBadge + LoadingBake

**Files:** Create `src/features/petbti/components/RarityBadge.tsx`, `LoadingBake.tsx`

- [ ] **Step 1: RarityBadge** — `/api/petbti/stats` fetch(no-store), `stats[code]/stats.total` → "전체 N마리 중 X%". `stats===null`이거나 total<임계(예:30)면 렌더 안 함(데이터 적을 때 숨김). FoodCheckSheet 의 fetch+폴백 패턴.
- [ ] **Step 2: LoadingBake** — 주멍이가 결과지 굽는 2~3초 연출(framer-motion). `onDone` 콜백.
- [ ] **Step 3: 커밋** — `git commit -m "feat(petbti): rarity badge + loading animation"`

### Task B5: QuizClient (인트로·문항·결과 오케스트레이션)

**Files:** Create `src/app/(site)/petbti/quiz/QuizClient.tsx`

- [ ] **Step 1: 구현** — 상태머신: `intro → question(0..11, 진행바) → baking(LoadingBake) → push(/petbti/result/<code>?from=quiz)`. 각 답 `Pole[]` 누적, 12개 완료 시 `calculateResult` → `router.push`. `quiz_start`(인트로 CTA), 완료 시 결과 페이지가 기록(아래 B는 인트로/문항만, 결과 표시는 result 페이지). 한 화면 한 문항, 2지선다 카드. 패턴: 기존 PetBtiApp 의 단계 전환 + framer-motion.
- [ ] **Step 2: 빌드 + 커밋** — Run: `npx tsc --noEmit`; `git commit -m "feat(petbti): quiz client (intro, 12 questions, scoring handoff)"`

## 워크스트림 E — admin

### Task E1: 추천제품 편집기 컴포넌트

**Files:** Create `src/features/admin/components/PetbtiProductsManager.tsx`

- [ ] **Step 1: 구현** — 16유형 행 테이블(유형코드·별명·제품명·이미지URL·카피·shopURL), 인라인/모달 편집 → `PUT /admin/api/petbti/products/[type]`. `GET /admin/api/petbti/products`로 로드. 패턴: `FoodsManager.tsx` 다크테마 테이블 미러(삭제 경고는 불필요 — upsert 기반, 빈 값이면 기본값 폴백).
- [ ] **Step 2: 커밋** — `git commit -m "feat(admin): petbti recommended-product editor"`

### Task E2: admin 배선 + 문항분포 패널 + constants 정합화

**Files:** Modify `src/features/admin/AdminDashboard.tsx`, `Sidebar.tsx`, `src/features/admin/lib/constants.ts`; (선택) Create 문항분포 패널

- [ ] **Step 1: 사이드바/뷰 추가** — '데이터' 그룹에 '멍BTI 추천' 뷰(`activeView==='petbti-products'`) 배선(foods/stores 추가와 동일 패턴).
- [ ] **Step 2: constants 정합화** — `constants.ts` 의 멍BTI url 을 `/petbti` 로, 축 설명(구 G=식탐/A=불안)을 신 4축 의미로, `firestoreCollection/firestoreDoc` 레거시 게이팅 정리(스펙 §7).
- [ ] **Step 3: (선택) 문항분포 패널** — `/admin/api/petbti/answers` 소비, 문항별 A/B 비율 막대. 시간 없으면 후속.
- [ ] **Step 4: 빌드 + 커밋** — Run: `npx tsc --noEmit`; `git commit -m "feat(admin): wire petbti products view + reconcile constants"`

---

# 3단계 — 통합·배포 (직렬)

### Task I1: result/[type] 페이지 (SSG 16종 + 클라 섬)

**Files:** Create `src/app/(site)/petbti/result/[type]/page.tsx`, `src/features/petbti/components/ResultView.tsx`

- [ ] **Step 1: ResultView(클라 섬)** — props: `TypeMeta` + 추천제품(fetch `/api/petbti/products`, 실패 시 types 기본값). 구성(스펙 §결과 페이지 권장안): ResultCard → RarityBadge → 설명 → 4축 게이지 → 궁합(soulmate/clash) → 추천제품+스토어 CTA → ShareButtons(+SaveImage 1:1/9:16) → 이벤트 박스(placeholder, 토글) → 다시하기. 마운트 시 `searchParams.from==='quiz'`면 `POST /api/petbti/result` + `trackPetbti("quiz_complete",{result_type,result_title})`(sessionStorage 중복방지). 강아지 사진 업로드(FileReader) → ResultCard 합성. shop/dm/download/share 클릭에 해당 이벤트.
- [ ] **Step 2: page.tsx(SSG)** —
```tsx
import { notFound } from "next/navigation";
import { PET_TYPE_CODES, PET_TYPES, type PetTypeCode } from "@/features/petbti/data/types";
import { ResultView } from "@/features/petbti/components/ResultView";
export const dynamicParams = false;
export function generateStaticParams() { return PET_TYPE_CODES.map((type) => ({ type })); }
export function generateMetadata({ params }: { params: { type: string } }) {
  const code = params.type as PetTypeCode;
  const t = PET_TYPES[code]; if (!t) return {};
  const og = `/og/petbti/${code}.png`;
  return { title: `${t.nickname} | 멍BTI`, description: t.catchphrase,
    openGraph: { title: `우리 아이는 ${t.nickname}`, description: t.catchphrase, images: [og] },
    twitter: { card: "summary_large_image", images: [og] } };
}
export default function ResultPage({ params }: { params: { type: string } }) {
  const t = PET_TYPES[params.type as PetTypeCode];
  if (!t) notFound();
  return <ResultView meta={t} />;
}
```
(Next 16 params 가 Promise 면 `await params` 로 조정.)

- [ ] **Step 3: 빌드 + 커밋** — Run: `npx tsc --noEmit`; `git commit -m "feat(petbti): result/[type] SSG page + ResultView"`

### Task I2: 인트로·quiz 페이지 + 레거시 리다이렉트 + GA config

**Files:** Modify `src/app/(site)/petbti/page.tsx`; Create `src/app/(site)/petbti/quiz/page.tsx`; Modify 멍BTI 레이아웃(GA config)

- [ ] **Step 1: 인트로 page.tsx** — 서버 컴포넌트. `searchParams.r` 있으면 `LEGACY_RESULT_MAP` 으로 `redirect('/petbti/result/<code>')`(301). 아니면 인트로(누적 참여수 = `getStats().total` 서버 조회, 소요시간 "약 2분", CTA → `/petbti/quiz`). 기본 OG 메타.
- [ ] **Step 2: quiz/page.tsx** — 서버 셸 + `<QuizClient/>`.
- [ ] **Step 3: GA config 추가** — 멍BTI 라우트에서 `gtag('config','G-P2G6LQGGSJ', { send_page_view: false })` 1회(스펙 §4). 기존 사이트 `trackEvent`에 `send_to:'G-WD1Q4Q5CDH'` 명시(이중 적재 방지).
- [ ] **Step 4: 빌드 + 커밋** — Run: `Remove-Item -Recurse -Force .next; npx opennextjs-cloudflare build`; `git commit -m "feat(petbti): intro + quiz pages, legacy redirect, GA send_to split"`

### Task I3: 브랜드 카드 연결 + 전체 검증

**Files:** Modify `src/data/linkPages/loveJuo.ts:159`, `src/data/linkPages/petfoodJuo.ts:157`(필요 시 라벨/이미지만)

- [ ] **Step 1: 브랜드 카드 확인** — `href:"/petbti"` 유지(경로 보존). 카드 카피/이미지 최신화(선택).
- [ ] **Step 2: 전체 단위테스트** — Run: `npm test`. Expected: types/score/productValidation 전부 PASS.
- [ ] **Step 3: 클린 빌드** — Run: `Remove-Item -Recurse -Force .next; npx opennextjs-cloudflare build`. Expected: 성공. 배포 gzip 크기 확인(`wrangler deploy` 출력의 Total/gzip — 무료 3MiB 한도 점검).
- [ ] **Step 4: 커밋** — `git commit -m "feat(petbti): wire brand cards, full build green"`

### Task I4: 배포 + D1 시드 + 라이브 스모크

- [ ] **Step 1: 사용자 승인 후 푸시** — `git push origin master`(= Workers Builds 자동배포). NEXT_PUBLIC_KAKAO_MAP_APP_KEY 등 빌드 env 확인.
- [ ] **Step 2: D1 콘솔 시드** — Cloudflare 대시보드 juo-db Console 에 `db/schema.sql`(3테이블·16시드, `--` 주석 제거) + 구 8유형 stats DELETE 실행. petbti_products 초기값(16유형 기본 추천)도 선택 삽입.
- [ ] **Step 3: 라이브 스모크** —
  - `GET /api/petbti/stats` → 200, `{ESBG:0,…,total:0}`.
  - `GET /api/petbti/products` → 200, 16개.
  - `/petbti/result/ESBG` → 200, OG 메타에 `/og/petbti/ESBG.png`.
  - `GET /og/petbti/ESBG.png` → 200.
  - `/admin/api/petbti/products` → 302(Access).
  - `/petbti?r=result1` → 301 → `/petbti/result/ERBG`.
  - 퀴즈 1회 완주 → stats total 1 증가 확인.
- [ ] **Step 4: 메모리 갱신** — `juo_platform_consolidation.md` 에 멍BTI 리빌드 완료(4축16유형·신 라우트·D1 3테이블) 기록.

---

## Self-Review (스펙 대비 커버리지)

- 4축16유형/12문항/동점없음 → F3,F4,A1,A2 ✅
- firebase 제거·gtag send_to → F2,D6,I2 ✅
- D1 3테이블·하이브리드 → D1,D2 ✅
- 공개/admin API → D4,D5 ✅
- snapdom 1:1/9:16·카카오·강아지사진 → B1,B2,B3,I1 ✅
- 희귀도·로딩연출 → B4 ✅
- 빌드타임 OG 16장·주멍이 슬롯 → C1 ✅
- 추천제품 D1편집·admin → D2,D5,E1,E2 ✅
- 궁합·콘텐츠 톤 → F3(soulmate/clash·description) ✅
- 레거시 `?r=`·경로보존 → D6,I2,I3 ✅
- 버전 업그레이드·캐시 → F1,F2 ✅
- 주냥이 카메오 → 에셋 프롬프트(스펙 §5), 시스템은 주멍이 슬롯과 동일 처리 ✅
- 스토리 인증 이벤트(동선만, 운영 나중) → I1 이벤트 박스 placeholder ✅

**미세 주의:** ① types.ts 14종 완성이 F3 의 실질 작업량(콘텐츠) — 스펙 §1.4 표가 source. ② OG 한글 폰트(C1)·snapdom API 표면(B1)·카카오 SDK 버전(B2)은 실행 시 1회 확인 포인트. ③ Next 16 `params`/`searchParams` Promise 여부는 빌드 에러로 드러나면 `await` 추가.
