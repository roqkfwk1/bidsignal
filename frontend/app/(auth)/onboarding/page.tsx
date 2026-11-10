'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Bookmark, CalendarClock, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { controlHeight, focusRing } from '@/components/auth/AuthForm';

const LS_KEY = 'bidsignal_onboarding_done';

/* 현재 기능과 대조한 문구 (지역 필터 없음, 알림은 D-3·D-1 이메일뿐) */
const STEPS = [
  {
    Icon: Search,
    label: '공고 찾기',
    title: '나라장터 공고를 한 곳에서 찾아보세요',
    points: [
      '공고명 키워드와 공고 유형으로 검색해요.',
      '금액 구간과 마감일로 결과를 좁힐 수 있어요.',
    ],
  },
  {
    Icon: Bookmark,
    label: '관심 공고',
    title: '중요한 공고는 관심 공고로 저장하세요',
    points: [
      '검토중 · 준비중 · 제출완료 · 포기 상태로 진행 상황을 관리해요.',
      '저장하면 공고에 맞는 서류 준비 체크리스트가 만들어져요.',
    ],
  },
  {
    Icon: CalendarClock,
    label: '마감 관리',
    title: '마감이 다가오는 공고를 놓치지 마세요',
    points: [
      '홈의 오늘 할 일에서 D-3 이내, D-4~D-7 공고를 확인해요.',
      '마감 3일 전, 1일 전에 이메일 알림을 받을 수 있어요.',
    ],
  },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const movedRef = useRef(false);

  useEffect(() => {
    if (localStorage.getItem(LS_KEY)) {
      router.replace('/');
    }
  }, [router]);

  /* 단계를 바꾼 뒤에는 새 단계 제목으로 포커스 이동 (첫 렌더 제외) */
  useEffect(() => {
    if (!movedRef.current) return;
    headingRef.current?.focus();
  }, [current]);

  function finish() {
    localStorage.setItem(LS_KEY, 'true');
    router.push('/');
  }

  /* 마지막 단계의 실제 다음 행동: 완료 표시는 finish와 같고 이동만 공고 찾기로 */
  function startSearch() {
    localStorage.setItem(LS_KEY, 'true');
    router.push('/notices');
  }

  function goTo(index: number) {
    movedRef.current = true;
    setCurrent(index);
  }

  const step = STEPS[current];
  const isFirst = current === 0;
  const isLast = current === STEPS.length - 1;

  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-primary">BidSignal 시작하기</p>
          <p className="mt-1 text-base text-muted-foreground">세 가지 흐름만 알면 바로 시작할 수 있어요.</p>
        </div>
        <Button type="button" variant="ghost" onClick={finish} className={cn(controlHeight, 'shrink-0 px-3 text-muted-foreground')}>
          건너뛰기
        </Button>
      </div>

      {/* 단계 표시 — 숫자·이름 글자로도 현재 단계를 알 수 있게 */}
      <ol aria-label="사용 안내 단계" className="mt-6 grid grid-cols-3 gap-2">
        {STEPS.map((s, i) => {
          const active = i === current;
          const done = i < current;
          return (
            <li key={s.label}>
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-current={active ? 'step' : undefined}
                className={cn('flex w-full min-h-11 flex-col gap-1.5 rounded-md pt-1 text-left', focusRing)}
              >
                <span
                  aria-hidden="true"
                  className={cn('h-1 w-full rounded-full', active || done ? 'bg-primary' : 'bg-border')}
                />
                <span className={cn('text-base', active ? 'font-bold text-foreground' : 'text-muted-foreground')}>
                  <span className="tabular-nums">{i + 1}.</span> {s.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <section
        aria-labelledby="onboarding-step-title"
        className="mt-6 rounded-[10px] border border-border bg-card px-5 py-7 sm:px-8 sm:py-9"
      >
        <p className="text-base text-muted-foreground tabular-nums">
          {current + 1} / {STEPS.length}단계
        </p>
        <div className="mt-3 flex items-start gap-4">
          <span aria-hidden="true" className="hidden size-12 shrink-0 items-center justify-center rounded-[10px] bg-accent text-primary sm:flex">
            <step.Icon className="size-6" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <h1
              id="onboarding-step-title"
              ref={headingRef}
              tabIndex={-1}
              className="text-[24px] leading-snug font-bold tracking-tight break-keep text-foreground focus:outline-none sm:text-[28px]"
            >
              {step.title}
            </h1>
            <ul className="mt-4 flex flex-col gap-2">
              {step.points.map((p) => (
                <li key={p} className="flex gap-2 text-base leading-relaxed text-foreground">
                  <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="break-keep">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => goTo(current - 1)}
            disabled={isFirst}
            className={cn(controlHeight, 'px-5')}
          >
            이전
          </Button>
          {isLast ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={finish} className={cn(controlHeight, 'px-5')}>
                홈으로
              </Button>
              <Button type="button" onClick={startSearch} className={cn(controlHeight, 'px-6 font-semibold')}>
                공고 찾기 시작
                <ArrowRight aria-hidden="true" className="size-5" />
              </Button>
            </div>
          ) : (
            <Button type="button" onClick={() => goTo(current + 1)} className={cn(controlHeight, 'px-6 font-semibold')}>
              다음
              <ArrowRight aria-hidden="true" className="size-5" />
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
