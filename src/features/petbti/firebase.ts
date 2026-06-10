import { initializeApp } from "firebase/app";
import {
  getAnalytics,
  isSupported,
  logEvent as firebaseLogEvent,
  type Analytics,
} from "firebase/analytics";

// 멍BTI GA4 이벤트 전송 전용 모듈.
// (결과 집계는 Cloudflare D1 + /api/petbti 로 이관됨 — features/petbti/stats.ts)
const firebaseConfig = {
  apiKey: "AIzaSyAaITXJ9SKtc4Yyo2hbNIouG5m2d-hrCRM",
  authDomain: "juo-company.firebaseapp.com",
  projectId: "juo-company",
  storageBucket: "juo-company.firebasestorage.app",
  messagingSenderId: "1063207314132",
  appId: "1:1063207314132:web:8fbaf2125e28d8fa175141",
  measurementId: "G-P2G6LQGGSJ",
};

const app = initializeApp(firebaseConfig);

// getAnalytics()는 window/cookies에 접근하므로 SSR/prerender에서 터진다.
// 브라우저에서만, isSupported() 확인 후 지연(lazy) 초기화한다.
let analyticsPromise: Promise<Analytics | null> | null = null;

function resolveAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }
  if (!analyticsPromise) {
    analyticsPromise = isSupported()
      .then((supported) => (supported ? getAnalytics(app) : null))
      .catch(() => null);
  }
  return analyticsPromise;
}

export function logEvent(eventName: string, params?: Record<string, string | number>) {
  if (typeof window === "undefined") {
    return;
  }
  void resolveAnalytics().then((analytics) => {
    if (analytics) {
      firebaseLogEvent(analytics, eventName, params);
    }
  });
}
