import type { Metadata } from "next";
import AdminClient from "./AdminClient";

export const metadata: Metadata = {
  title: "주오 대시보드",
  // 관리자 대시보드는 검색엔진에 노출되면 안 된다.
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminClient />;
}
