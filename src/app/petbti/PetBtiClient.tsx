"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// 멍BTI는 100% 클라이언트 인터랙티브 위젯이며 firebase / html-to-image / html2canvas 등
// 브라우저 전용 라이브러리에 의존한다. 이들을 서버(Cloudflare Workers) 번들에서 평가하면
// 런타임 500이 나므로, ssr:false 로 클라이언트에서만 로드한다.
const PetBtiApp = dynamic(() => import("@/features/petbti/PetBtiApp"), {
  ssr: false,
});

export default function PetBtiClient() {
  return (
    <Suspense fallback={null}>
      <PetBtiApp />
    </Suspense>
  );
}
