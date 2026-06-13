'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Compass, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const FEATURES = [
  {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    icon: (
      <span className="text-xl font-black leading-none select-none">A</span>
    ),
    title: '큰 글씨와 큰 버튼',
    description: '글씨와 버튼을 크게 표시하여 쉽게 볼 수 있어요.',
  },
  {
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    icon: <Check className="size-6" />,
    title: '중요 정보 한눈에',
    description: '필요한 정보만 간단하게 정리해 보여줘요.',
  },
  {
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    icon: <Compass className="size-6" />,
    title: '쉬운 탐색',
    description: '복잡한 메뉴 없이 쉽게 이용할 수 있어요.',
  },
];

const TODAY_TASKS = [
  { label: '마감 임박 공고 확인', count: 3, countClass: 'text-red-500' },
  { label: '새로운 맞춤 공고 확인', count: 5, countClass: 'text-blue-600' },
  { label: '제출 체크리스트 확인', count: 2, countClass: 'text-orange-500' },
];

export default function HelpPage() {
  const [simpleMode, setSimpleMode] = useState(false);

  return (
    <div className="flex gap-6 items-start">
      {/* ── 왼쪽 가이드 콘텐츠 ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        {/* 섹션 1: 페이지 제목 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">간편 모드 안내</h1>
          <p className="text-gray-500 mt-1 text-base">더 쉽고 크게 사용할 수 있어요.</p>
        </div>

        {/* 섹션 2: 특징 카드 3개 */}
        <div className="flex flex-col gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4"
            >
              <div
                className={cn(
                  'flex-shrink-0 flex items-center justify-center size-12 rounded-full',
                  f.iconBg,
                  f.iconColor
                )}
              >
                {f.icon}
              </div>
              <div>
                <p className="font-semibold text-lg text-gray-900">{f.title}</p>
                <p className="text-base text-gray-500 mt-1">{f.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 섹션 3: 간편 모드 토글 카드 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-base text-gray-900">간편 모드 설정</p>
              <p className="text-sm text-gray-500 mt-0.5">
                사이드바 하단에서도 언제든 켜고 끌 수 있어요.
              </p>
            </div>
            <Switch
              checked={simpleMode}
              onCheckedChange={setSimpleMode}
              size="default"
            />
          </div>
          {simpleMode && (
            <p className="text-sm text-green-600 mt-3 font-medium">
              간편 모드가 적용 중이에요.
            </p>
          )}
        </div>

        {/* 섹션 4: 페이지네이션 점 */}
        <div className="flex justify-center items-center gap-2 mt-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                'block rounded-full transition-all',
                i === 0
                  ? 'w-5 h-2 bg-blue-600'
                  : 'w-2 h-2 bg-gray-300'
              )}
            />
          ))}
        </div>

        {/* 하단 버튼 */}
        <div>
          <Button asChild variant="ghost" className="text-gray-500 hover:text-gray-700">
            <Link href="/">다음에 보기</Link>
          </Button>
        </div>
      </div>

      {/* ── 오른쪽 오늘 할 일 패널 ── */}
      <div className="w-80 flex-shrink-0">
        <div className="bg-blue-600 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-white text-base">오늘 할 일</p>
            <ChevronRight className="size-5 text-blue-300" />
          </div>

          <div className="flex flex-col gap-2">
            {TODAY_TASKS.map((task) => (
              <div
                key={task.label}
                className="bg-white rounded-lg flex items-center justify-between px-4 py-3"
              >
                <span className="text-base text-gray-800 font-medium">
                  {task.label}
                </span>
                <span className={cn('font-bold text-base', task.countClass)}>
                  {task.count}건
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-sm text-blue-200 hover:text-white font-medium transition-colors"
            >
              더보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
