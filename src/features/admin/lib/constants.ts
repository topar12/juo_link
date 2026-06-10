// =============================================
// 프로젝트 설정 — 새 프로젝트를 추가하려면 여기만 수정!
// =============================================

import {
  PET_TYPE_CODES,
  PET_TYPES,
} from "@/features/petbti/data/types";

export interface ProjectType {
  code: string;
  label: string;
  description: string;
  color: string;
}

export type DashboardKind = "quiz" | "linkinbio";

export interface ProjectConfig {
  id: string;
  name: string;
  emoji: string;
  description: string;
  url: string;
  accentColor: string;
  dashboardKind: DashboardKind;
  ga4PropertyEnv?: string;
  firestoreCollection?: string;
  firestoreDoc?: string;
  types?: Record<string, ProjectType>;
}

// ─── 멍-BTI ──────────────────────────────────
// (원본은 비공개 const 였으나, 컴포넌트에서 직접 참조할 수 있도록 named export 로 노출)
//
// 풀 리빌드 정합화(워크스트림 E):
//  - url: 구 Netlify 단독 SPA → Next 네이티브 `/petbti` 경로.
//  - types: 구 3축 8유형(EGA…) → 신 4축 16유형(ESBG…). D1 `petbti_stats` 의 키와
//    일치해야 OverviewContent/QuizProjectDashboard 의 topType·차트가 동작하므로,
//    petbti 공유 계약(PET_TYPES)에서 직접 파생해 단일 출처를 유지한다(드리프트 방지).
//  - firestoreCollection/firestoreDoc: 이름은 firebase 레거시지만, 현재는 firebase 를
//    호출하지 않는다. 이 두 필드의 "존재 여부"가 quiz 프로젝트의 D1 집계(/api/petbti/stats)
//    조회를 켜는 게이트로만 쓰인다(OverviewContent.tsx · QuizProjectDashboard.tsx).
//    소비처를 깨지 않으려고 필드는 그대로 두되, 의미는 'D1 집계 보유 플래그'로 본다.
export const MEONG_BTI: ProjectConfig = {
  id: "meong-bti",
  name: "멍-BTI",
  emoji: "🐶",
  description: "강아지 행동학 유형 테스트 (4축 16유형)",
  url: "/petbti",
  accentColor: "#6366F1",
  dashboardKind: "quiz",
  ga4PropertyEnv: "GA4_PROPERTY_ID",
  // ↓ firebase 레거시 명칭이지만 실제로는 'D1 집계 보유' 게이트로만 소비된다(위 주석 참조).
  firestoreCollection: "stats",
  firestoreDoc: "meong-bti",
  // 신 16유형 — petbti 공유 계약에서 파생. 축: 에너지(E/C)·사회성(S/R)·대담함(B/T)·식탐(G/P).
  // label = "<코드>형", description = 4축 성향(활발·사교·대담·식탐 …), color = 유형 팔레트.
  types: Object.fromEntries(
    PET_TYPE_CODES.map((code) => {
      const meta = PET_TYPES[code];
      return [
        code,
        {
          code,
          label: `${code}형`,
          description: meta.traits.join(" · "),
          color: meta.color,
        } satisfies ProjectType,
      ];
    })
  ),
};

export const JUO_LINKINBIO: ProjectConfig = {
  id: "juo-linkinbio",
  name: "주오 링크인바이오",
  emoji: "🔗",
  description: "링크인바이오 CTA와 매장찾기 성과 대시보드",
  url: "",
  accentColor: "#FF6B6B",
  dashboardKind: "linkinbio",
  ga4PropertyEnv: "GA4_LINKINBIO_PROPERTY_ID",
};

// ─── 냥-BTI (예시 — 나중에 활성화) ─────────────
// const NYANG_BTI: ProjectConfig = {
//   id: 'nyang-bti',
//   name: '냥-BTI',
//   emoji: '🐱',
//   description: '고양이 성격 유형 테스트',
//   url: '',
//   accentColor: '#F59E0B',
//   firestoreCollection: 'stats',
//   firestoreDoc: 'nyang-bti',
//   types: {
//     // 유형 정의 추가
//   },
// };

// ─── 프로젝트 목록 ────────────────────────────
export const PROJECTS: ProjectConfig[] = [
  MEONG_BTI,
  JUO_LINKINBIO,
  // NYANG_BTI,  ← 냥-BTI 만들면 주석 해제!
];

// ─── 헬퍼 함수 ────────────────────────────────
export function getProject(id: string): ProjectConfig | undefined {
  return PROJECTS.find((p) => p.id === id);
}

export function getProjectTypeCodes(project: ProjectConfig): string[] {
  return project.types ? Object.keys(project.types) : [];
}
