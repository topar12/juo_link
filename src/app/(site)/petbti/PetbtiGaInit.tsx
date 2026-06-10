"use client";

import { useEffect } from "react";
import { configurePetbtiGa } from "@/features/petbti/lib/ga";

// 멍BTI 라우트 진입 시 멍BTI GA4 스트림(G-P2G6LQGGSJ)을 1회 config.
// 루트 레이아웃이 gtag.js + 사이트 스트림(G-WD1Q4Q5CDH)을 이미 로드해 두므로
// 여기서는 멍BTI 스트림 config 만 추가하고, 이벤트는 send_to 로 분리 전송한다.
export default function PetbtiGaInit() {
  useEffect(() => {
    configurePetbtiGa();
  }, []);
  return null;
}
