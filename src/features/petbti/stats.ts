// 멍BTI 결과 집계: Cloudflare D1 + /api/petbti 라우트 사용 (기존 Firestore 대체).

const RESULT_API = "/api/petbti/result";
const STATS_API = "/api/petbti/stats";

/** 결과 유형 카운트를 1 증가시킨다. 세션당 1회(중복 방지). */
export async function incrementResultCount(typeCode: string): Promise<void> {
  const sessionKey = `meong-bti-counted-${typeCode}`;
  if (typeof window !== "undefined" && window.sessionStorage.getItem(sessionKey)) {
    return;
  }
  try {
    const res = await fetch(RESULT_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ typeCode }),
    });
    if (res.ok && typeof window !== "undefined") {
      window.sessionStorage.setItem(sessionKey, "true");
    }
  } catch (error) {
    console.error("Failed to update stats:", error);
  }
}

/** 유형별 집계 + total 을 가져온다. 형태: { EGA: n, ..., total: n } */
export async function getResultStats(): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(STATS_API, { cache: "no-store" });
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as Record<string, number> | null;
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return null;
  }
}
