"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// 대시보드는 recharts 등 브라우저 전용 라이브러리에 의존한다. 이들을
// 서버(Cloudflare Workers) 번들에서 평가하면 런타임 오류가 나므로,
// ssr:false 로 클라이언트에서만 로드한다.
const AdminDashboard = dynamic(() => import("@/features/admin/AdminDashboard"), {
  ssr: false,
});

export default function AdminClient() {
  return (
    <Suspense fallback={null}>
      <AdminDashboard />
    </Suspense>
  );
}
