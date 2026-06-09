# 우리 아이 체크 도구 (음식 안전 검색기) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 펫푸드주오 링크인바이오에 음식 이름을 검색하면 🟢먹어도 돼요 / 🟡조심해요 / 🔴안 돼요를 알려주는 바텀시트 도구를 추가한다.

**Architecture:** 기존 `StoreFinderSheet`(검색+필터칩+결과카드+`trackEvent`) 패턴을 복제한 `FoodCheckSheet`. 순수 검색/판정 로직은 `src/lib/foodSafety.ts`로 분리해 단위 테스트, 음식 데이터는 `src/data/foodSafety.json`. `우리 아이 체크 도구` 섹션(featureCards)의 카드를 누르면 시트가 열린다 — 트리거는 기존 `toggleCenterMap` 선례와 동일하게 `FeatureCard.opens === "foodCheck"` 플래그로 배선.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, framer-motion, @phosphor-icons/react. 테스트는 Vitest(신규, 순수 로직 한정).

**작업 브랜치:** `feature/food-checker` (이미 생성·체크아웃됨, master 미사용). 모든 명령은 레포 루트 `D:\a_linkinbio\linkinbio-web` 기준 — 명령에 `git -C` / `npm --prefix`로 경로를 명시했다.

**스펙:** [docs/superpowers/specs/2026-06-09-food-checker-design.md](../specs/2026-06-09-food-checker-design.md)

**범위 밖(이번에 안 함):** 전용 URL 라우트, 종 토글, 급여량·대체간식 추천, 배포(`npm run deploy`). 음식 데이터는 발행 전 별도 검수 게이트(아래 Task 2 주석 참고).

---

## File Structure

| 파일 | 역할 | 신규/수정 |
|---|---|---|
| `src/lib/foodSafety.ts` | 타입(`FoodVerdict`,`FoodSafetyItem`), 판정 메타(`VERDICT_META`), 순수 `searchFoods()` | 신규 |
| `src/lib/foodSafety.test.ts` | `searchFoods`/`VERDICT_META` 단위 테스트 | 신규 |
| `src/lib/foodSafety.data.test.ts` | `foodSafety.json` 데이터 무결성 테스트 | 신규 |
| `src/data/foodSafety.json` | 음식 데이터 배열(시작 34종) | 신규 |
| `src/components/FoodCheckSheet.tsx` | 검색 바텀시트 UI | 신규 |
| `src/data/linkPages/types.ts` | `FeatureCard.opens?` + `IconKey`에 `"search"` 추가 | 수정 |
| `src/features/linkinbio/LinkInBioPage.tsx` | `showFoodCheck` 상태·핸들러·시트 렌더·아이콘·트리거 배선 | 수정 |
| `src/data/linkPages/petfoodJuo.ts` | `우리 아이 체크 도구` 섹션 추가(추천 상품 다음) | 수정 |
| `package.json` | vitest devDep + `test` 스크립트 | 수정 |

---

## Task 1: Vitest + 순수 검색/판정 로직

**Files:**
- Modify: `package.json` (devDependencies, scripts)
- Create: `src/lib/foodSafety.ts`
- Test: `src/lib/foodSafety.test.ts`

- [ ] **Step 1: Vitest 설치**

Run:
```
npm --prefix "D:\a_linkinbio\linkinbio-web" install -D vitest
```
Expected: `package.json` devDependencies에 `vitest` 추가, 설치 성공.

- [ ] **Step 2: test 스크립트 추가**

`package.json`의 `scripts`에 두 줄 추가 (기존 줄은 그대로):
```jsonc
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest",
  "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
  "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
  "upload": "opennextjs-cloudflare build && opennextjs-cloudflare upload",
  "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
}
```

- [ ] **Step 3: 실패하는 테스트 작성**

Create `src/lib/foodSafety.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { searchFoods, VERDICT_META, type FoodSafetyItem } from "./foodSafety";

const FIXTURE: FoodSafetyItem[] = [
  { id: "chocolate", name: "초콜릿", aliases: ["초콜렛", "choco"], verdict: "danger", reason: "테오브로민 중독." },
  { id: "apple", name: "사과", aliases: ["애플"], verdict: "safe", reason: "씨만 빼면 간식으로 좋아요." },
  { id: "cheese", name: "치즈", aliases: [], verdict: "caution", reason: "지방·염분, 소량만." },
];

describe("searchFoods", () => {
  it("한글 이름 부분일치", () => {
    expect(searchFoods(FIXTURE, "초콜", "all").map((f) => f.id)).toEqual(["chocolate"]);
  });
  it("별칭(오타·영문) 매칭", () => {
    expect(searchFoods(FIXTURE, "choco", "all").map((f) => f.id)).toEqual(["chocolate"]);
    expect(searchFoods(FIXTURE, "초콜렛", "all").map((f) => f.id)).toEqual(["chocolate"]);
  });
  it("빈 검색어면 전체, 위험한 것부터 정렬", () => {
    expect(searchFoods(FIXTURE, "", "all").map((f) => f.id)).toEqual(["chocolate", "cheese", "apple"]);
  });
  it("판정으로 필터", () => {
    expect(searchFoods(FIXTURE, "", "safe").map((f) => f.id)).toEqual(["apple"]);
  });
  it("매칭 없으면 빈 배열", () => {
    expect(searchFoods(FIXTURE, "양파", "all")).toEqual([]);
  });
});

describe("VERDICT_META", () => {
  it("세 판정 라벨", () => {
    expect(VERDICT_META.danger.label).toBe("안 돼요");
    expect(VERDICT_META.caution.label).toBe("조심해요");
    expect(VERDICT_META.safe.label).toBe("먹어도 돼요");
  });
});
```

- [ ] **Step 4: 테스트 실패 확인**

Run:
```
npm --prefix "D:\a_linkinbio\linkinbio-web" run test
```
Expected: FAIL — `Cannot find module './foodSafety'` (아직 파일 없음).

- [ ] **Step 5: 최소 구현 작성**

Create `src/lib/foodSafety.ts`:
```ts
export type FoodVerdict = "danger" | "caution" | "safe";

export type FoodSafetyItem = {
  id: string;
  name: string;
  aliases: string[];
  emoji?: string;
  verdict: FoodVerdict;
  reason: string;
  note?: string;
};

type VerdictMeta = {
  label: string;
  emoji: string;
  badgeClassName: string;
  pillClassName: string;
  cardBorderClassName: string;
};

export const VERDICT_META: Record<FoodVerdict, VerdictMeta> = {
  danger: {
    label: "안 돼요",
    emoji: "🔴",
    badgeClassName: "bg-brand-coral-50 text-brand-coral-600",
    pillClassName: "bg-brand-coral-100 text-brand-coral-700",
    cardBorderClassName: "border-brand-coral-200",
  },
  caution: {
    label: "조심해요",
    emoji: "🟡",
    badgeClassName: "bg-amber-50 text-amber-600",
    pillClassName: "bg-amber-100 text-amber-700",
    cardBorderClassName: "border-amber-200",
  },
  safe: {
    label: "먹어도 돼요",
    emoji: "🟢",
    badgeClassName: "bg-emerald-50 text-emerald-600",
    pillClassName: "bg-emerald-100 text-emerald-700",
    cardBorderClassName: "border-emerald-200",
  },
};

// 칩/정렬 순서 — 위험한 것부터
export const VERDICT_FILTER_ORDER: FoodVerdict[] = ["danger", "caution", "safe"];

const VERDICT_SORT_RANK: Record<FoodVerdict, number> = {
  danger: 0,
  caution: 1,
  safe: 2,
};

export function searchFoods(
  items: FoodSafetyItem[],
  query: string,
  verdict: FoodVerdict | "all"
): FoodSafetyItem[] {
  const normalized = query.trim().toLowerCase();
  return items
    .filter((item) => {
      if (verdict !== "all" && item.verdict !== verdict) return false;
      if (normalized.length === 0) return true;
      return [item.name, ...item.aliases].some((token) =>
        token.toLowerCase().includes(normalized)
      );
    })
    .sort((a, b) => {
      if (a.verdict !== b.verdict) {
        return VERDICT_SORT_RANK[a.verdict] - VERDICT_SORT_RANK[b.verdict];
      }
      return a.name.localeCompare(b.name, "ko");
    });
}
```

- [ ] **Step 6: 테스트 통과 확인**

Run:
```
npm --prefix "D:\a_linkinbio\linkinbio-web" run test
```
Expected: PASS (7 assertions / 6 tests green).

- [ ] **Step 7: 커밋**

```
git -C "D:\a_linkinbio\linkinbio-web" add package.json package-lock.json src/lib/foodSafety.ts src/lib/foodSafety.test.ts
git -C "D:\a_linkinbio\linkinbio-web" commit -m "feat: add food safety search logic + vitest" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: 음식 데이터 + 무결성 테스트

**Files:**
- Create: `src/data/foodSafety.json`
- Test: `src/lib/foodSafety.data.test.ts`

> ⚠️ **검수 게이트:** 아래 데이터는 일반적 반려동물 독성 상식 기반 시작본이다. **발행/배포 전 사장님 또는 협력 수의사 1회 검수** 필요(스펙 §13). 이 플랜은 배포를 포함하지 않는다.

- [ ] **Step 1: 실패하는 데이터 무결성 테스트 작성**

Create `src/lib/foodSafety.data.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import foods from "../data/foodSafety.json";
import type { FoodSafetyItem } from "./foodSafety";

const items = foods as FoodSafetyItem[];
const VALID_VERDICTS = ["danger", "caution", "safe"];

describe("foodSafety.json 무결성", () => {
  it("비어있지 않은 배열", () => {
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });
  it("id 중복 없음", () => {
    const ids = items.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("모든 항목 필수 필드 유효", () => {
    for (const f of items) {
      expect(f.id.length, `id: ${JSON.stringify(f)}`).toBeGreaterThan(0);
      expect(f.name.length, `name on ${f.id}`).toBeGreaterThan(0);
      expect(f.reason.length, `reason on ${f.id}`).toBeGreaterThan(0);
      expect(VALID_VERDICTS, `verdict on ${f.id}`).toContain(f.verdict);
      expect(Array.isArray(f.aliases), `aliases on ${f.id}`).toBe(true);
    }
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run:
```
npm --prefix "D:\a_linkinbio\linkinbio-web" run test
```
Expected: FAIL — `Cannot find module '../data/foodSafety.json'`.

- [ ] **Step 3: 데이터 파일 작성**

Create `src/data/foodSafety.json`:
```json
[
  { "id": "chocolate", "name": "초콜릿", "aliases": ["초콜렛", "쵸콜릿", "choco", "카카오", "코코아"], "emoji": "🍫", "verdict": "danger", "reason": "테오브로민·카페인 성분이 중독을 일으킬 수 있어요.", "note": "다크초콜릿일수록 더 위험해요." },
  { "id": "onion", "name": "양파", "aliases": ["onion"], "emoji": "🧅", "verdict": "danger", "reason": "적혈구를 손상시켜 빈혈을 일으킬 수 있어요.", "note": "익히거나 가루로 넣은 음식도 위험해요." },
  { "id": "garlic", "name": "마늘", "aliases": ["garlic"], "emoji": "🧄", "verdict": "danger", "reason": "양파와 같은 파속이라 적혈구를 손상시킬 수 있어요." },
  { "id": "green-onion", "name": "파", "aliases": ["대파", "쪽파", "scallion"], "emoji": "🌿", "verdict": "danger", "reason": "파속 채소라 적혈구를 손상시킬 수 있어요." },
  { "id": "chives", "name": "부추", "aliases": ["chives"], "verdict": "danger", "reason": "파속 채소로 적혈구 손상 위험이 있어요." },
  { "id": "grape", "name": "포도", "aliases": ["grape", "머루"], "emoji": "🍇", "verdict": "danger", "reason": "소량으로도 신장 손상을 일으킬 수 있어요." },
  { "id": "raisin", "name": "건포도", "aliases": ["raisin"], "verdict": "danger", "reason": "포도와 같이 신장 손상 위험이 있어요." },
  { "id": "xylitol", "name": "자일리톨", "aliases": ["xylitol", "무설탕껌"], "verdict": "danger", "reason": "급격한 저혈당을 일으킬 수 있어요. 무설탕 껌·사탕에 많아요." },
  { "id": "alcohol", "name": "알코올", "aliases": ["술", "맥주", "alcohol"], "emoji": "🍺", "verdict": "danger", "reason": "소량도 중독을 일으킬 수 있어요." },
  { "id": "caffeine", "name": "카페인", "aliases": ["커피", "coffee", "에너지음료", "녹차"], "emoji": "☕", "verdict": "danger", "reason": "커피·에너지음료의 카페인은 중독을 일으킬 수 있어요." },
  { "id": "macadamia", "name": "마카다미아", "aliases": ["macadamia", "마카다미아넛"], "verdict": "danger", "reason": "강아지에게 힘 빠짐·떨림 등 신경 증상을 일으킬 수 있어요." },
  { "id": "stone-fruit-pit", "name": "복숭아·자두씨", "aliases": ["복숭아씨", "자두씨", "살구씨", "체리씨"], "verdict": "danger", "reason": "씨앗에 시안 성분이 있고, 삼키면 장이 막힐 수 있어요." },
  { "id": "raw-dough", "name": "생빵반죽", "aliases": ["빵반죽", "이스트반죽", "dough"], "verdict": "danger", "reason": "위에서 부풀고 알코올이 생겨 위험해요." },
  { "id": "milk", "name": "우유·유제품", "aliases": ["우유", "milk", "유제품"], "emoji": "🥛", "verdict": "caution", "reason": "유당을 소화 못 해 설사할 수 있어요.", "note": "특히 고양이는 유당불내가 흔해요." },
  { "id": "cheese", "name": "치즈", "aliases": ["cheese"], "emoji": "🧀", "verdict": "caution", "reason": "지방·염분이 높아 아주 소량만 권해요." },
  { "id": "raw-egg", "name": "생계란", "aliases": ["날계란", "생달걀", "raw egg"], "emoji": "🥚", "verdict": "caution", "reason": "살모넬라 위험이 있어 익혀서 주는 게 좋아요." },
  { "id": "salty-processed", "name": "짠 음식·가공육", "aliases": ["햄", "소시지", "베이컨", "ham", "sausage"], "verdict": "caution", "reason": "나트륨·지방이 많아 권하지 않아요." },
  { "id": "cooked-bone", "name": "익힌 뼈", "aliases": ["닭뼈", "사골뼈", "cooked bone"], "emoji": "🦴", "verdict": "caution", "reason": "익힌 뼈는 쪼개져 입·장을 다치게 할 수 있어요." },
  { "id": "avocado", "name": "아보카도", "aliases": ["avocado"], "emoji": "🥑", "verdict": "caution", "reason": "페르신 성분과 큰 씨앗 때문에 권하지 않아요." },
  { "id": "nuts", "name": "견과류", "aliases": ["땅콩", "호두", "아몬드", "nuts"], "emoji": "🥜", "verdict": "caution", "reason": "지방이 많고 소화가 어려워요. 마카다미아는 특히 위험해요." },
  { "id": "citrus", "name": "감귤류", "aliases": ["오렌지", "레몬", "귤", "citrus"], "emoji": "🍊", "verdict": "caution", "reason": "신맛과 기름 성분이 속을 자극할 수 있어 소량만." },
  { "id": "unripe-tomato", "name": "덜 익은 토마토", "aliases": ["토마토", "tomato", "토마토줄기"], "emoji": "🍅", "verdict": "caution", "reason": "덜 익은 열매와 줄기엔 솔라닌이 있어요. 잘 익은 건 소량 가능." },
  { "id": "carrot", "name": "당근", "aliases": ["carrot"], "emoji": "🥕", "verdict": "safe", "reason": "간식으로 좋아요. 잘게 잘라 주세요." },
  { "id": "apple", "name": "사과", "aliases": ["apple", "애플"], "emoji": "🍎", "verdict": "safe", "reason": "씨와 심을 빼면 간식으로 좋아요." },
  { "id": "sweet-potato", "name": "고구마", "aliases": ["sweet potato"], "emoji": "🍠", "verdict": "safe", "reason": "익혀서 주면 좋아요." },
  { "id": "pumpkin", "name": "단호박", "aliases": ["호박", "pumpkin"], "emoji": "🎃", "verdict": "safe", "reason": "익힌 단호박은 소화에 부담이 적어요." },
  { "id": "blueberry", "name": "블루베리", "aliases": ["blueberry"], "emoji": "🫐", "verdict": "safe", "reason": "한두 알 간식으로 좋아요." },
  { "id": "watermelon", "name": "수박", "aliases": ["watermelon"], "emoji": "🍉", "verdict": "safe", "reason": "씨와 껍질을 빼고 과육만 소량 주세요." },
  { "id": "banana", "name": "바나나", "aliases": ["banana"], "emoji": "🍌", "verdict": "safe", "reason": "당이 있어 소량만 간식으로 좋아요." },
  { "id": "cucumber", "name": "오이", "aliases": ["cucumber"], "emoji": "🥒", "verdict": "safe", "reason": "수분 많은 시원한 간식이에요." },
  { "id": "chicken-breast", "name": "무염 닭가슴살", "aliases": ["닭가슴살", "chicken"], "emoji": "🍗", "verdict": "safe", "reason": "간 없이 익힌 닭가슴살은 좋은 단백질 간식이에요." },
  { "id": "plain-yogurt", "name": "플레인 요거트", "aliases": ["요거트", "yogurt"], "verdict": "safe", "reason": "무가당 플레인이면 소량 가능해요.", "note": "유당에 민감하면 설사할 수 있어요." },
  { "id": "broccoli", "name": "브로콜리", "aliases": ["broccoli"], "emoji": "🥦", "verdict": "safe", "reason": "익혀서 소량 주면 좋아요." },
  { "id": "strawberry", "name": "딸기", "aliases": ["strawberry"], "emoji": "🍓", "verdict": "safe", "reason": "꼭지 빼고 소량 간식으로 좋아요." }
]
```

- [ ] **Step 4: 테스트 통과 확인**

Run:
```
npm --prefix "D:\a_linkinbio\linkinbio-web" run test
```
Expected: PASS (Task 1 + Task 2 모든 테스트 green).

- [ ] **Step 5: 커밋**

```
git -C "D:\a_linkinbio\linkinbio-web" add src/data/foodSafety.json src/lib/foodSafety.data.test.ts
git -C "D:\a_linkinbio\linkinbio-web" commit -m "feat: add food safety dataset (34 items, pre-review)" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: FoodCheckSheet 컴포넌트

**Files:**
- Create: `src/components/FoodCheckSheet.tsx`

UI 단위 테스트 프레임워크가 없으므로 이 Task는 `npm run lint`(타입·린트) + 다음 Task의 화면 확인으로 검증한다.

- [ ] **Step 1: 컴포넌트 작성**

Create `src/components/FoodCheckSheet.tsx`:
```tsx
"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MagnifyingGlass, Warning, X } from "@phosphor-icons/react";
import clsx from "clsx";
import foodSafetyData from "@/data/foodSafety.json";
import { trackEvent } from "@/lib/analytics";
import {
  searchFoods,
  VERDICT_FILTER_ORDER,
  VERDICT_META,
  type FoodSafetyItem,
  type FoodVerdict,
} from "@/lib/foodSafety";

type FoodCheckSheetProps = {
  analyticsPageId?: string;
  onClose: () => void;
};

const FOODS = foodSafetyData as FoodSafetyItem[];
const ALL = "all" as const;
const LOOPBACK_URL = "https://www.lovejuo.com/shop/";

export default function FoodCheckSheet({ analyticsPageId, onClose }: FoodCheckSheetProps) {
  const [query, setQuery] = useState("");
  const [activeVerdict, setActiveVerdict] = useState<FoodVerdict | typeof ALL>(ALL);
  const lastSearchSignatureRef = useRef("");

  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const results = searchFoods(FOODS, normalizedQuery, activeVerdict);
  const filterOptions: Array<FoodVerdict | typeof ALL> = [ALL, ...VERDICT_FILTER_ORDER];

  useEffect(() => {
    if (normalizedQuery.length === 0) {
      return;
    }
    const signature = `${normalizedQuery}|${activeVerdict}|${results.length}`;
    if (lastSearchSignatureRef.current === signature) {
      return;
    }
    const timeout = window.setTimeout(() => {
      lastSearchSignatureRef.current = signature;
      trackEvent("food_search", {
        page: analyticsPageId,
        brand_page: analyticsPageId,
        active_verdict: activeVerdict,
        query_length: normalizedQuery.length,
        result_count: results.length,
        has_result: results.length > 0 ? "true" : "false",
      });
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [activeVerdict, analyticsPageId, normalizedQuery, results.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="absolute inset-0 z-40 bg-slate-50"
    >
      <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
        <div className="sticky top-0 z-10 border-b-2 border-slate-200 bg-slate-50/95 px-5 pb-4 pt-5 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col items-start gap-2">
              <span className="inline-flex items-center rounded-full bg-brand-coral-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                Food Check
              </span>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">우리 아이 먹어도 돼요?</h2>
                <p className="mt-1 text-xs font-medium text-slate-500">음식 이름을 검색해 먹어도 되는지 확인해보세요.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="음식 검색 닫기"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-900 hover:text-slate-900"
            >
              <X weight="bold" className="text-lg" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-5 py-4 pb-8">
          <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] font-medium leading-relaxed text-slate-500">
            <Warning weight="fill" className="mt-0.5 shrink-0 text-sm text-brand-coral-400" />
            <span>일반적인 정보예요. 진단·처방이 아니며, 먹은 게 의심되거나 증상이 있으면 바로 수의사와 상담하세요.</span>
          </div>

          <div className="relative">
            <MagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="예: 초콜릿, 사과, 양파"
              className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-white pl-12 pr-4 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-coral-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {filterOptions.map((option) => {
              const isActive = activeVerdict === option;
              const label = option === ALL ? "전체" : `${VERDICT_META[option].emoji} ${VERDICT_META[option].label}`;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setActiveVerdict(option)}
                  className={clsx(
                    "shrink-0 rounded-full border-2 px-4 py-2 text-xs font-bold tracking-tight transition-all duration-200",
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white shadow-[2px_2px_0px_0px_var(--link-accent-shadow-solid)]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <p className="px-1 text-xs font-semibold text-slate-500">{results.length}개 음식</p>

          <div className="flex flex-col gap-3">
            {results.length > 0 ? (
              results.map((food) => {
                const meta = VERDICT_META[food.verdict];
                return (
                  <div
                    key={food.id}
                    className={clsx(
                      "relative flex w-full items-start gap-3 overflow-hidden rounded-2xl border-2 bg-white p-4 shadow-[3px_3px_0px_0px_rgba(30,41,59,0.06)]",
                      meta.cardBorderClassName
                    )}
                  >
                    <div className={clsx("flex h-11 min-w-11 items-center justify-center rounded-xl text-xl", meta.badgeClassName)}>
                      <span>{food.emoji ?? meta.emoji}</span>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm font-black tracking-tight text-slate-900">{food.name}</strong>
                        <span className={clsx("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black", meta.pillClassName)}>
                          {meta.emoji} {meta.label}
                        </span>
                      </div>
                      <p className="text-xs font-medium leading-relaxed text-slate-500">{food.reason}</p>
                      {food.note ? (
                        <p className="text-[11px] font-medium leading-relaxed text-slate-400">{food.note}</p>
                      ) : null}
                      {food.verdict === "danger" ? (
                        <p className="mt-1 text-[11px] font-bold text-brand-coral-600">이미 먹었다면 즉시 동물병원에 연락하세요.</p>
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-5 py-8 text-center">
                <p className="text-sm font-bold text-slate-800">아직 등록 안 된 음식이에요</p>
                <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500">헷갈리는 음식은 수의사와 상담하는 게 가장 안전해요.</p>
              </div>
            )}
          </div>

          <a
            href={LOOPBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent("food_loopback_click", {
                page: analyticsPageId,
                brand_page: analyticsPageId,
              })
            }
            className="mt-2 flex items-center justify-between rounded-2xl border-2 border-brand-coral-200 bg-brand-coral-50/50 px-5 py-4 text-sm font-bold text-slate-900 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-coral-500"
          >
            <span>안심하고 줄 수 있는 간식 보기</span>
            <span className="text-base leading-none">&rarr;</span>
          </a>
          <p className="px-1 text-[11px] font-medium leading-relaxed text-slate-400">참고용 정보이며, 우리 아이 상태·기저질환에 따라 다를 수 있어요.</p>
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: 타입/린트 확인 (이 시점엔 아직 미사용이라 lint만)**

Run:
```
npm --prefix "D:\a_linkinbio\linkinbio-web" run lint
```
Expected: 새 파일에 린트 에러 없음. (컴포넌트는 Task 4에서 연결되므로 "미사용" 경고는 없음 — export default라 무방.)

- [ ] **Step 3: 커밋**

```
git -C "D:\a_linkinbio\linkinbio-web" add src/components/FoodCheckSheet.tsx
git -C "D:\a_linkinbio\linkinbio-web" commit -m "feat: add FoodCheckSheet component" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: 타입 확장 + LinkInBioPage 배선

**Files:**
- Modify: `src/data/linkPages/types.ts`
- Modify: `src/features/linkinbio/LinkInBioPage.tsx`

- [ ] **Step 1: `types.ts` — IconKey에 `search`, FeatureCard에 `opens` 추가**

`IconKey` 유니온에 `"search"` 추가 (예: `"sparkle"` 다음):
```ts
export type IconKey =
  | "cart"
  | "crown"
  | "map"
  | "store"
  | "firstAid"
  | "scissors"
  | "graduation"
  | "car"
  | "house"
  | "heart"
  | "shootingStar"
  | "tent"
  | "shield"
  | "instagram"
  | "kakao"
  | "blog"
  | "sparkle"
  | "search";
```

`FeatureCard` 타입에 `opens?` 추가 (기존 필드 아래에):
```ts
export type FeatureCard = {
  id: string;
  badge?: string;
  title: string;
  description: string;
  imageSrc?: string;
  imageAlt?: string;
  icon?: IconKey;
  href?: string;
  notice?: string;
  opens?: "foodCheck";
  tracking?: TrackingConfig;
};
```

- [ ] **Step 2: `LinkInBioPage.tsx` — import 추가**

phosphor import 블록(상단)에 `MagnifyingGlass,` 추가하고, StoreFinderSheet import 아래에 FoodCheckSheet import 추가:
```ts
import {
  CarProfile,
  Crown,
  FirstAid,
  GraduationCap,
  Heart,
  HouseLine,
  InstagramLogo,
  MagnifyingGlass,
  MapPin,
  NewspaperClipping,
  Scissors,
  ShieldStar,
  ShootingStar,
  ShoppingCart,
  Sparkle,
  Storefront,
  Tent,
} from "@phosphor-icons/react";
import clsx from "clsx";
import CenterMapSheet from "@/components/CenterMapSheet";
import IntroAnimation from "@/components/IntroAnimation";
import StoreFinderSheet from "@/components/StoreFinderSheet";
import FoodCheckSheet from "@/components/FoodCheckSheet";
```

- [ ] **Step 3: ICONS 맵에 `search` 추가**

`map: MapPin,` 줄 아래에 추가:
```ts
const ICONS = {
  cart: ShoppingCart,
  crown: Crown,
  map: MapPin,
  search: MagnifyingGlass,
  store: Storefront,
  firstAid: FirstAid,
  scissors: Scissors,
  graduation: GraduationCap,
  car: CarProfile,
  house: HouseLine,
  heart: Heart,
  shootingStar: ShootingStar,
  tent: Tent,
  shield: ShieldStar,
  instagram: InstagramLogo,
  blog: NewspaperClipping,
  sparkle: Sparkle,
};
```

- [ ] **Step 4: 상태 + 오픈 핸들러 추가**

`const [showStoreFinder, setShowStoreFinder] = useState(false);` 아래에:
```ts
  const [showFoodCheck, setShowFoodCheck] = useState(false);
```

`handleStoreFinderOpen` 함수 정의 바로 아래에:
```ts
  const handleFoodCheckOpen = () => {
    trackEvent("food_check_open", {
      page: config.analyticsPageId,
      brand_page: config.analyticsPageId,
      location: "pet_tools_section",
    });
    setShowFoodCheck(true);
  };
```

- [ ] **Step 5: renderSection 호출에 핸들러 전달**

`config.sections.map` 안의 `renderSection({...})` 객체에 한 줄 추가:
```tsx
          {config.sections.map((section) =>
            renderSection({
              section,
              activeProductTabs,
              setActiveProductTabs,
              handleTrackedClick,
              handleUniverseCardClick,
              handleUniverseCardLinkClick,
              onCenterMapToggle: config.centerLocations?.length ? () => setShowCenterMap(true) : undefined,
              onOpenFoodCheck: handleFoodCheckOpen,
              analyticsPageId: config.analyticsPageId,
            })
          )}
```

- [ ] **Step 6: 시트 렌더 추가**

StoreFinder의 `<AnimatePresence>` 블록 아래에 추가:
```tsx
      <AnimatePresence>
        {showFoodCheck ? (
          <FoodCheckSheet
            analyticsPageId={config.analyticsPageId}
            onClose={() => setShowFoodCheck(false)}
          />
        ) : null}
      </AnimatePresence>
```

- [ ] **Step 7: renderSection 시그니처 + featureCards 케이스에 핸들러 전달**

`renderSection` 파라미터 타입 객체에 `onOpenFoodCheck?: () => void;` 추가 (`onCenterMapToggle?: () => void;` 아래). 그리고 `case "featureCards":` 블록을 아래로 교체:
```tsx
    case "featureCards":
      return (
        <FeatureCards
          key={section.id}
          section={section}
          handleTrackedClick={handleTrackedClick}
          onOpenFoodCheck={onOpenFoodCheck}
        />
      );
```

- [ ] **Step 8: FeatureCards 컴포넌트에 핸들러 + 트리거 배선**

`FeatureCards` 함수를 아래로 교체:
```tsx
function FeatureCards({
  section,
  handleTrackedClick,
  onOpenFoodCheck,
}: {
  section: FeatureCardsSection;
  handleTrackedClick: (
    item: Pick<FeatureCard, "id" | "title" | "notice" | "tracking">,
    fallbackEvent: string,
    fallbackParams?: Record<string, string | number>
  ) => void;
  onOpenFoodCheck?: () => void;
}) {
  return (
    <section className="mt-4 flex w-full flex-col gap-3">
      <SectionHeader title={section.title} />
      <div className="grid grid-cols-1 gap-3">
        {section.cards.map((card) => (
          <FeatureCardButton
            key={card.id}
            card={card}
            onClick={() => {
              handleTrackedClick(card, "feature_card_click", {
                card_id: card.id,
              });
              if (card.opens === "foodCheck") {
                onOpenFoodCheck?.();
              }
            }}
          />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 9: 린트 + 빌드(타입체크) 확인**

Run:
```
npm --prefix "D:\a_linkinbio\linkinbio-web" run lint
npm --prefix "D:\a_linkinbio\linkinbio-web" run build
```
Expected: 둘 다 성공. 타입 에러·린트 에러 없음.

- [ ] **Step 10: 커밋**

```
git -C "D:\a_linkinbio\linkinbio-web" add src/data/linkPages/types.ts src/features/linkinbio/LinkInBioPage.tsx
git -C "D:\a_linkinbio\linkinbio-web" commit -m "feat: wire FoodCheckSheet into link-in-bio (search icon + opens trigger)" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: `우리 아이 체크 도구` 섹션 추가

**Files:**
- Modify: `src/data/linkPages/petfoodJuo.ts`

- [ ] **Step 1: 섹션 추가 (추천 상품 다음, 이벤트 앞)**

`sections` 배열에서 `recommended-products`(productTabs) 객체가 끝나는 `},` 바로 뒤, `events`(featureCards) 객체 앞에 새 섹션 삽입:
```ts
    {
      id: "pet-tools",
      type: "featureCards",
      title: "우리 아이 체크 도구",
      cards: [
        {
          id: "food-check",
          icon: "search",
          badge: "무료 체크",
          title: "우리 아이 먹어도 돼요?",
          description: "음식 이름을 검색하면 먹어도 되는지 바로 알려드려요.",
          opens: "foodCheck",
        },
      ],
    },
```

> 비주얼 메모(스펙 §13-②): 지금은 `icon: "search"`로 시작. 나중에 주멍·주냥 일러스트를 쓰려면 카드에 `imageSrc`(+`imageAlt`)를 추가하면 `FeatureCardButton`이 16:9 이미지로 자동 전환된다.

- [ ] **Step 2: 빌드 확인**

Run:
```
npm --prefix "D:\a_linkinbio\linkinbio-web" run build
```
Expected: 성공.

- [ ] **Step 3: 커밋**

```
git -C "D:\a_linkinbio\linkinbio-web" add src/data/linkPages/petfoodJuo.ts
git -C "D:\a_linkinbio\linkinbio-web" commit -m "feat: add 우리 아이 체크 도구 section to petfoodjuo" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: 전체 검증 + 푸시

**Files:** (없음 — 검증/푸시만)

- [ ] **Step 1: 테스트 + 린트 + 빌드 일괄 확인**

Run:
```
npm --prefix "D:\a_linkinbio\linkinbio-web" run test
npm --prefix "D:\a_linkinbio\linkinbio-web" run lint
npm --prefix "D:\a_linkinbio\linkinbio-web" run build
```
Expected: 셋 다 성공.

- [ ] **Step 2: 수동 화면 확인 (dev 서버)**

Run (백그라운드):
```
npm --prefix "D:\a_linkinbio\linkinbio-web" run dev
```
브라우저 `http://localhost:3000/petfoodjuo` 확인 체크리스트:
- 인트로(3.2s) 후 `추천 상품` 아래에 `우리 아이 체크 도구` 섹션 카드 노출
- 카드 탭 → 음식 검색 시트가 아래에서 올라옴
- 검색창에 `초콜` → 초콜릿(🔴 안 돼요) 카드 + "이미 먹었다면…" 문구
- `사과` → 🟢 먹어도 돼요 / `choco` → 별칭 매칭
- 필터칩 `🔴 안 돼요` → 위험 음식만
- 상단 면책 문구, 하단 "안심 간식 보기" 링크, 닫기(X) 동작
- 콘솔 에러 없음

확인 후 dev 서버 종료.

- [ ] **Step 3: 브랜치 푸시**

```
git -C "D:\a_linkinbio\linkinbio-web" push
```
Expected: `feature/food-checker` 원격 갱신.

- [ ] **Step 4 (선택): PR 열기**

리뷰가 필요하면:
```
gh --repo topar12/juo_link pr create --base master --head feature/food-checker --title "우리 아이 체크 도구 (음식 안전 검색기)" --body "스펙: docs/superpowers/specs/2026-06-09-food-checker-design.md"
```

> ⚠️ **배포 안 함:** `npm run deploy`(Cloudflare)는 이 플랜에 없음. 음식 데이터 수의사/사장님 검수 완료 후 사장님이 배포 결정.

---

## Self-Review (작성자 점검 결과)

**1. 스펙 커버리지**
- 검색→3판정+이유: Task 1(로직)+3(UI) ✓ / 데이터 30~50개·공용·note: Task 2 ✓ / 바텀시트·StoreFinder 패턴: Task 3 ✓ / 안전·면책 카피: Task 3(상단·위험카드·하단) ✓ / 배치(추천 상품 아래 신규 섹션): Task 5 ✓ / 트리거(opens 플래그): Task 4 ✓ / 애널리틱스(food_check_open·food_search·food_loopback_click): Task 4·3 ✓ / 피드 맛보기 글: 범위 밖(ig-feed 별도) — 의도된 분리 ✓

**2. Placeholder 스캔:** 모든 코드 스텝에 실제 코드. 데이터의 "검수 전"은 placeholder가 아니라 의도된 게이트(배포 전 검수). TODO 없음.

**3. 타입 일관성:** `FoodSafetyItem`/`FoodVerdict`(Task1 정의) → Task2 테스트·Task3 컴포넌트 동일 사용. `searchFoods(items, query, verdict)` 시그니처 Task1·3 일치. `VERDICT_META`/`VERDICT_FILTER_ORDER` 동일. `opens: "foodCheck"`(types.ts) ↔ petfoodJuo 카드 ↔ FeatureCards 분기 일치. `icon: "search"`(IconKey) ↔ ICONS 맵 일치.
