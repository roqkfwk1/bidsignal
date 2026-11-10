import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "BidSignal — 공공입찰 공고 관리",
  description: "오늘 놓치면 안 되는 입찰 공고를 한눈에 관리하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKR.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
        {/* 상단 메뉴 높이: lg 이상 약 65px, lg 미만 약 105px(로고 줄 56 + 메뉴 줄 48 + 테두리). 두 경우 모두 겹치지 않도록 120px */}
        <Toaster position="top-center" offset={{ top: 120 }} mobileOffset={{ top: 120 }} />
      </body>
    </html>
  );
}
