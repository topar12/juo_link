import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "펫푸드주오 | PETFOOD JUO",
  description: "엄마의 마음으로 만드는 수제 펫푸드. 휴먼그레이드 HACCP 인증. 당일생산 익일배송.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="antialiased">
      <body className="min-h-screen flex items-center justify-center selection:bg-brand-coral-500 selection:text-white">
        {/* Desktop Mockup Wrapper */}
        <div className="relative w-full max-w-[430px] h-[100dvh] sm:h-[850px] sm:max-h-[90vh] sm:rounded-[3rem] sm:border-[12px] sm:border-slate-800 bg-slate-50 overflow-hidden sm:shadow-2xl">
          {/* Mockup Notch */}
          <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-slate-800 rounded-b-3xl z-50"></div>
          
          {children}
        </div>
      </body>
    </html>
  );
}
