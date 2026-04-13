import type { Metadata } from "next";
import IntroVariantPreview from "@/features/linkinbio/intro/IntroVariantPreview";

export const metadata: Metadata = {
  title: "인트로 비교 | 주오 링크인바이오",
  description: "사랑해주오 링크인바이오 인트로 후보를 비교합니다.",
};

export default function IntroPreviewPage() {
  return <IntroVariantPreview />;
}
