// =============================================
// 프로젝트 설정 — 새 프로젝트를 추가하려면 여기만 수정!
// =============================================

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
export const MEONG_BTI: ProjectConfig = {
  id: "meong-bti",
  name: "멍-BTI",
  emoji: "🐶",
  description: "강아지 성격 유형 테스트",
  url: "https://meong-bti.netlify.app/",
  accentColor: "#6366F1",
  dashboardKind: "quiz",
  ga4PropertyEnv: "GA4_PROPERTY_ID",
  firestoreCollection: "stats",
  firestoreDoc: "meong-bti",
  types: {
    EGA: { code: "EGA", label: "E-G-A형", description: "외향적 · 사교적 · 활동적", color: "#6366F1" },
    EGI: { code: "EGI", label: "E-G-I형", description: "외향적 · 사교적 · 신중한", color: "#8B5CF6" },
    EPI: { code: "EPI", label: "E-P-I형", description: "외향적 · 독립적 · 신중한", color: "#EC4899" },
    EPA: { code: "EPA", label: "E-P-A형", description: "외향적 · 독립적 · 활동적", color: "#F43F5E" },
    CGA: { code: "CGA", label: "C-G-A형", description: "차분한 · 사교적 · 활동적", color: "#F59E0B" },
    CGI: { code: "CGI", label: "C-G-I형", description: "차분한 · 사교적 · 신중한", color: "#22C55E" },
    CPA: { code: "CPA", label: "C-P-A형", description: "차분한 · 독립적 · 활동적", color: "#06B6D4" },
    CPI: { code: "CPI", label: "C-P-I형", description: "차분한 · 독립적 · 신중한", color: "#3B82F6" },
  },
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
