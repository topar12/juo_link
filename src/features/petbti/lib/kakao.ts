"use client";

// 카카오 공유(Kakao Share) 전용 로더 + sendDefault(feed) 헬퍼.
// 카카오맵 SDK(StoreFinderSheet 의 dapi.kakao.com maps)와는 별개로, 공유 SDK는
// t1.kakaocdn.net 의 kakao_js_sdk 를 쓴다. JavaScript 앱 키는 카카오맵과 동일
// (NEXT_PUBLIC_KAKAO_MAP_APP_KEY) 키를 재사용한다 — 같은 카카오 앱이기 때문.
//
// 클릭 시점에만 import 되도록(서버 평가 회피) "use client" + 동적 로드.

const KAKAO_SDK_SRC = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";
// SRI 무결성 해시: 카카오 공식 문서의 2.7.4 값. 버전을 올리면 이 값도 반드시 갱신해야
// 하며, 불일치 시 브라우저가 스크립트를 차단한다. 값이 의심되면 빈 문자열로 두면
// integrity 없이(crossOrigin 만으로) 로드한다 — 통합 단계에서 1회 검증 포인트.
const KAKAO_SDK_INTEGRITY =
  "sha384-kYPsUbBPlktXsY6/oNHSUDZoTX6+YI51f63jCPEIPFP09ttByAdxd2mEjKuhdqn4";

// 카카오 SDK 의 최소 표면만 타입화(공유에 필요한 메서드).
type KakaoShareContent = {
  title: string;
  description: string;
  imageUrl: string;
  link: { mobileWebUrl: string; webUrl: string };
};

type KakaoShareButton = {
  title: string;
  link: { mobileWebUrl: string; webUrl: string };
};

type KakaoFeedPayload = {
  objectType: "feed";
  content: KakaoShareContent;
  buttons: KakaoShareButton[];
};

type KakaoSdk = {
  isInitialized: () => boolean;
  init: (appKey: string) => void;
  Share: {
    sendDefault: (payload: KakaoFeedPayload) => void;
  };
};

type KakaoWindow = Window & { Kakao?: KakaoSdk };

// 멱등 로드 가드 — 여러 번 호출돼도 SDK 스크립트는 1회만 주입.
let loadPromise: Promise<KakaoSdk> | null = null;

function getAppKey(): string | null {
  return process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? null;
}

/** 카카오 공유 기능 사용 가능 여부(앱 키 존재 + 브라우저). 버튼 노출 판단용. */
export function isKakaoShareAvailable(): boolean {
  return typeof window !== "undefined" && Boolean(getAppKey());
}

/**
 * 카카오 JS SDK 를 동적으로 로드하고 init 한 뒤, 초기화된 Kakao 객체를 돌려준다.
 * - 이미 로드/초기화돼 있으면 즉시 그 인스턴스를 반환.
 * - 앱 키가 없거나 서버면 reject (호출부에서 폴백 처리).
 */
function loadKakao(): Promise<KakaoSdk> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Kakao SDK는 브라우저에서만 로드할 수 있어요."));
  }

  const appKey = getAppKey();
  if (!appKey) {
    return Promise.reject(new Error("NEXT_PUBLIC_KAKAO_MAP_APP_KEY 가 설정되지 않았어요."));
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise<KakaoSdk>((resolve, reject) => {
    const w = window as KakaoWindow;

    const ensureInit = (sdk: KakaoSdk) => {
      if (!sdk.isInitialized()) {
        sdk.init(appKey);
      }
      resolve(sdk);
    };

    // 이미 전역에 SDK가 있으면(다른 곳에서 주입) 그대로 사용.
    if (w.Kakao) {
      ensureInit(w.Kakao);
      return;
    }

    // 이미 같은 스크립트 태그가 주입돼 있으면 onload 를 기다린다(중복 주입 방지).
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${KAKAO_SDK_SRC}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => {
        if (w.Kakao) ensureInit(w.Kakao);
        else reject(new Error("Kakao SDK 로드 후에도 window.Kakao 가 없어요."));
      });
      existing.addEventListener("error", () =>
        reject(new Error("Kakao SDK 스크립트를 불러오지 못했어요."))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = KAKAO_SDK_SRC;
    script.async = true;
    if (KAKAO_SDK_INTEGRITY) {
      script.integrity = KAKAO_SDK_INTEGRITY;
    }
    script.crossOrigin = "anonymous";
    script.onload = () => {
      if (w.Kakao) ensureInit(w.Kakao);
      else reject(new Error("Kakao SDK 로드 후에도 window.Kakao 가 없어요."));
    };
    script.onerror = () => {
      // 다음 시도에서 재로드할 수 있도록 가드 해제.
      loadPromise = null;
      reject(new Error("Kakao SDK 스크립트를 불러오지 못했어요."));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export type ShareKakaoOptions = {
  title: string;
  description: string;
  imageUrl: string;
  url: string;
};

/**
 * 카카오톡 공유(feed) 전송.
 * 버튼 2개: "결과 보기"(결과 URL) · "나도 테스트하기"(origin + /petbti).
 * imageUrl·url 은 절대 URL 권장(카카오 스크래핑·미리보기 안정성).
 * 실패 시 throw — 호출부(ShareButtons)에서 네이티브/복사로 폴백.
 */
export async function shareKakao(opts: ShareKakaoOptions): Promise<void> {
  const sdk = await loadKakao();
  const testUrl = `${window.location.origin}/petbti`;

  sdk.Share.sendDefault({
    objectType: "feed",
    content: {
      title: opts.title,
      description: opts.description,
      imageUrl: opts.imageUrl,
      link: { mobileWebUrl: opts.url, webUrl: opts.url },
    },
    buttons: [
      {
        title: "결과 보기",
        link: { mobileWebUrl: opts.url, webUrl: opts.url },
      },
      {
        title: "나도 테스트하기",
        link: { mobileWebUrl: testUrl, webUrl: testUrl },
      },
    ],
  });
}
