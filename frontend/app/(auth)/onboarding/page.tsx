'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bookmark, CheckCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LS_KEY = 'bidsignal_onboarding_done';

const SLIDES = [
  {
    Icon: Search,
    title: '나라장터 공고를 한 곳에서',
    description: '키워드, 지역, 업종으로 원하는 공고를 빠르게 찾아보세요.',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    Icon: Bookmark,
    title: '관심 공고를 저장하고 관리하세요',
    description: '마감일 D-day를 한눈에 확인하고, 준비 상태를 기록하세요.',
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
  },
  {
    Icon: CheckCircle,
    title: '마감을 절대 놓치지 마세요',
    description: '마감 임박 공고를 대시보드에서 바로 확인하세요.',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
  },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(LS_KEY)) {
      router.replace('/');
    }
  }, [router]);

  function finish() {
    localStorage.setItem(LS_KEY, 'true');
    router.push('/');
  }

  function goNext() {
    setCurrent((c) => c + 1);
  }

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  return (
    <div className="w-full max-w-md px-4">
      {/* 로고 */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <Zap className="size-5 text-blue-600 fill-blue-600" />
        <span className="text-xl font-bold text-blue-600 tracking-tight">BidSignal</span>
      </div>

      {/* 카드 */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">BidSignal 시작하기</h2>
          <button
            type="button"
            onClick={finish}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            건너뛰기
          </button>
        </div>

        {/* 슬라이드 본문 */}
        <div className="flex flex-col items-center text-center gap-6 py-8">
          <div
            className={`size-24 rounded-2xl ${slide.iconBg} flex items-center justify-center`}
          >
            <slide.Icon className={`size-12 ${slide.iconColor}`} strokeWidth={1.5} />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-lg font-bold text-gray-900">{slide.title}</p>
            <p className="text-base text-gray-500 leading-relaxed">{slide.description}</p>
          </div>
        </div>

        {/* 페이지 인디케이터 */}
        <div className="flex justify-center gap-2 mb-6">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`슬라이드 ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-200 ${
                i === current ? 'w-6 bg-blue-600' : 'w-2 bg-gray-200 hover:bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* 버튼 */}
        {isLast ? (
          <Button
            onClick={finish}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold"
          >
            시작하기
          </Button>
        ) : (
          <Button
            onClick={goNext}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold"
          >
            다음
          </Button>
        )}
      </div>
    </div>
  );
}
