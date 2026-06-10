const PETBTI_GA_ID = "G-P2G6LQGGSJ"; // 멍BTI 웹 스트림 (property 530064801) — 보존 계약

// dataLayer 직접 적재 — gtag.js(@next/third-parties GoogleAnalytics) 로드 전/후 모두 안전.
// gtag.js 는 로드 시 기존 dataLayer 엔트리를 처리하고, 이후 push 도 즉시 처리한다.
function pushGtag(...args: unknown[]) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push(args);
}

let configured = false;

/**
 * 멍BTI 페이지에서 멍BTI GA4 스트림을 1회 config.
 * send_page_view:false — 사이트 스트림(G-WD1Q4Q5CDH)이 이미 pageview 를 잡으므로
 * 멍BTI 스트림엔 명시 이벤트만 보낸다(자동 pageview 중복 방지).
 */
export function configurePetbtiGa() {
  if (configured) return;
  configured = true;
  pushGtag("config", PETBTI_GA_ID, { send_page_view: false });
}

/** 멍BTI 이벤트는 항상 send_to 로 멍BTI 스트림에만 전송 (이중 카운트 방지). */
export function trackPetbti(event: string, params: Record<string, unknown> = {}) {
  pushGtag("event", event, { ...params, send_to: PETBTI_GA_ID });
}

export { PETBTI_GA_ID };
