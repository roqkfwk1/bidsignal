'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

import { TodayTodoCard } from '@/components/dashboard/TodayTodoCard';
import { DDayBadge } from '@/components/common/DDayBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getDashboardSummary } from '@/lib/api/dashboard';
import { getWatchlist } from '@/lib/api/watchlist';
import { getUnreadCount } from '@/lib/api/notifications';
import { ACCESS_TOKEN_KEY } from '@/lib/api';
import { cn, formatIsoDate } from '@/lib/utils';
import type { DashboardSummary, WatchlistItem } from '@/types/notice';

const PRIORITY_LIMIT = 5;

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';
const card = 'rounded-[10px] border border-border bg-card';

/* ── 표시 조각 ── */
function SectionHeader({ id, title, description, href, linkLabel }: {
  id: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    /* lg 미만: 제목과 링크를 한 줄(grid 1행), 설명은 아래 줄 전체 폭(2행).
       lg 이상: 기존 그대로 flex — 설명이 있으면 링크를 설명 줄 아래에, 제목만 있으면 제목과 세로 가운데로 맞춘다.
       가운데 div는 lg 미만에서 contents로 풀려 제목·설명이 각각 grid 칸에 놓인다. */
    <div
      className={cn(
        'mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 lg:flex lg:justify-between lg:gap-3',
        description ? 'lg:items-end' : 'lg:items-center',
      )}
    >
      <div className="contents lg:block lg:min-w-0">
        <h2 id={id} className="text-lg font-bold text-foreground">{title}</h2>
        {description && <p className="col-span-2 row-start-2 mt-0.5 text-base text-muted-foreground">{description}</p>}
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className={cn('col-start-2 row-start-1 inline-flex min-h-11 shrink-0 items-center rounded-md px-1 text-base font-medium text-primary hover:underline', focusRing)}
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className={cn(card, 'flex flex-col items-center gap-2 px-4 py-10 text-center')}>
      <AlertCircle aria-hidden="true" className="size-8 text-destructive" strokeWidth={1.5} />
      <p className="text-base text-foreground">{message}</p>
      <Button variant="outline" onClick={onRetry} className="mt-1 h-11 px-5 text-base">다시 시도</Button>
    </div>
  );
}

function RowsSkeleton({ rows }: { rows: number }) {
  return (
    <ul aria-hidden="true" className={cn(card, 'divide-y divide-border')}>
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex min-h-16 items-center gap-4 px-4 py-3 sm:px-5">
          <Skeleton className="h-6 w-14" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** 체크리스트 진행 n/m (항목이 있을 때만) */
function ChecklistCount({ item }: { item: WatchlistItem }) {
  if (item.checklistTotalCount <= 0) return null;
  return (
    <span className="text-base text-muted-foreground tabular-nums">
      <span className="sr-only">체크리스트 </span>
      {item.checklistCheckedCount}/{item.checklistTotalCount}
    </span>
  );
}

/**
 * 마감 순 우선 확인 공고 행.
 * lg 이상: D-Day | 공고명·기관·마감일 | 상태·체크리스트 (기존 3열, lg:contents로 Link의 flex 자식이 됨)
 * lg 미만: 공고명(전체 폭 2줄) / 기관·마감일(전체 폭) / D-Day·상태·체크리스트 한 줄
 */
function PriorityRow({ item }: { item: WatchlistItem }) {
  const deadline = formatIsoDate(item.bidClseDt);
  return (
    <li>
      <Link
        href={`/notices/${item.noticeId}`}
        className={cn('block px-4 py-3 transition-colors hover:bg-accent/50 sm:px-5 lg:flex lg:min-h-16 lg:items-center lg:gap-4', focusRing, 'focus-visible:-outline-offset-2')}
      >
        {/* lg 미만 */}
        <span className="flex min-w-0 flex-col gap-1 lg:hidden">
          <span className="line-clamp-2 leading-snug font-medium wrap-anywhere text-foreground">{item.bidNtceNm}</span>
          <span className="flex min-w-0 gap-2 text-muted-foreground">
            <span className="truncate">{item.ntceInsttNm}</span>
            <span className="shrink-0 tabular-nums">· {deadline}</span>
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 tabular-nums">
            <DDayBadge dDay={item.dDay} deadline={deadline} />
            <StatusBadge status={item.status} />
            <ChecklistCount item={item} />
          </span>
        </span>

        {/* lg 이상 — 기존 구조 그대로 */}
        <span className="hidden lg:contents">
        <span className="w-16 shrink-0 tabular-nums">
          <DDayBadge dDay={item.dDay} deadline={deadline} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-foreground" title={item.bidNtceNm}>{item.bidNtceNm}</span>
          <span className="flex min-w-0 gap-2 text-muted-foreground">
            <span className="truncate">{item.ntceInsttNm}</span>
            <span className="shrink-0 tabular-nums">· {deadline}</span>
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <StatusBadge status={item.status} />
          <ChecklistCount item={item} />
        </span>
        </span>
      </Link>
    </li>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [summary, setSummary]               = useState<DashboardSummary>({ urgentCount: 0, preparingCount: 0, weeklyCount: 0 });
  const [watchlist, setWatchlist]           = useState<WatchlistItem[]>([]);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [loading, setLoading]               = useState(true);
  /* 실패한 응답을 0건으로 보여주지 않도록 출처별 실패 여부 기록 */
  const [summaryFailed, setSummaryFailed]     = useState(false);
  const [watchlistFailed, setWatchlistFailed] = useState(false);
  const [unreadFailed, setUnreadFailed]       = useState(false);
  const [reloadKey, setReloadKey]             = useState(0);

  useEffect(() => {
    /* 비로그인 → 공개 페이지(공고 찾기)로 이동. 홈 대시보드는 로그인 전용. */
    if (!localStorage.getItem(ACCESS_TOKEN_KEY)) {
      router.replace('/notices');
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const [summaryData, watchlistData, unreadData] = await Promise.allSettled([
          getDashboardSummary(),
          getWatchlist(),
          getUnreadCount(),
        ]);

        setSummaryFailed(summaryData.status === 'rejected');
        setWatchlistFailed(watchlistData.status === 'rejected');
        setUnreadFailed(unreadData.status === 'rejected');

        if (summaryData.status === 'fulfilled')  setSummary(summaryData.value);
        if (watchlistData.status === 'fulfilled') setWatchlist(watchlistData.value);
        if (unreadData.status === 'fulfilled') setUnreadCount(unreadData.value);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router, reloadKey]);

  const retry = () => setReloadKey((k) => k + 1);

  /* 우선 확인 공고: 검토중·준비중이면서 마감 전(D-Day 이후 아님)인 항목을 마감 가까운 순으로 */
  const priorityItems = useMemo(
    () =>
      watchlist
        .filter((w) => (w.status === 'REVIEWING' || w.status === 'PREPARING') && w.dDay !== null && w.dDay >= 0)
        .sort((a, b) => (a.dDay ?? 0) - (b.dDay ?? 0))
        .slice(0, PRIORITY_LIMIT),
    [watchlist],
  );

  const stats = [
    { label: '관심 공고',      value: watchlistFailed ? null : watchlist.length, href: '/watchlist' },
    { label: '준비중 공고',    value: summaryFailed ? null : summary.preparingCount, href: '/watchlist?status=preparing' },
    { label: '읽지 않은 알림', value: unreadFailed ? null : unreadCount, href: '/alerts' },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-foreground lg:text-[32px]">오늘의 입찰 업무</h1>
        <p className="mt-1 text-base text-muted-foreground">마감이 가까운 관심 공고부터 확인하세요.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        {/* ── 왼쪽: 오늘 할 일 + 우선 확인 공고 ── */}
        <div className="flex min-w-0 flex-col gap-8">
          {loading ? (
            <Skeleton className="h-[188px] w-full rounded-[10px]" />
          ) : summaryFailed ? (
            <section aria-label="오늘 할 일">
              <SectionError message="오늘 할 일을 불러오지 못했어요." onRetry={retry} />
            </section>
          ) : (
            <TodayTodoCard urgentCount={summary.urgentCount} weeklyCount={summary.weeklyCount} />
          )}

          <section aria-labelledby="priority-heading" aria-busy={loading}>
            <SectionHeader
              id="priority-heading"
              title="우선 확인 공고"
              description="검토중·준비중인 관심 공고를 마감이 가까운 순으로 보여드려요."
              href="/watchlist"
              linkLabel="관심 공고 전체 보기"
            />
            {loading ? (
              <RowsSkeleton rows={4} />
            ) : watchlistFailed ? (
              <SectionError message="관심 공고를 불러오지 못했어요." onRetry={retry} />
            ) : watchlist.length === 0 ? (
              <div className={cn(card, 'flex flex-col items-center gap-2 px-4 py-12 text-center')}>
                <p className="text-lg font-medium text-foreground">아직 저장한 공고가 없어요</p>
                <p className="text-base text-muted-foreground">공고를 찾아서 관심 공고에 저장해 보세요.</p>
                <Button asChild className="mt-2 h-11 px-5 text-base">
                  <Link href="/notices">공고 찾기</Link>
                </Button>
              </div>
            ) : priorityItems.length === 0 ? (
              <div className={cn(card, 'px-4 py-8 text-center')}>
                <p className="text-base text-muted-foreground">마감이 남은 검토중·준비중 공고가 없어요.</p>
              </div>
            ) : (
              <ul className={cn(card, 'divide-y divide-border overflow-hidden')}>
                {priorityItems.map((item) => <PriorityRow key={item.watchlistItemId} item={item} />)}
              </ul>
            )}
          </section>
        </div>

        {/* ── 오른쪽: 나의 현황 — 오늘 할 일과 같은 구조(제목이 박스 안, 같은 안쪽 여백)로 윗선을 맞춘다 ── */}
        <div className="min-w-0">
          <section aria-labelledby="status-heading" aria-busy={loading} className={cn(card, 'p-5 sm:p-6')}>
            <h2 id="status-heading" className="mb-3 text-lg font-bold text-foreground">나의 현황</h2>
            <ul className="-mx-2 grid grid-cols-3 divide-x divide-border lg:grid-cols-1 lg:divide-x-0 lg:divide-y">
              {stats.map(({ label, value, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      'flex h-full min-h-14 flex-col justify-center gap-1 rounded-lg px-2 py-3 transition-colors hover:bg-accent/50 lg:flex-row lg:items-center lg:justify-between',
                      focusRing,
                      'focus-visible:-outline-offset-2',
                    )}
                  >
                    <span className="text-base text-muted-foreground">{label}</span>
                    {loading ? (
                      <Skeleton className="h-7 w-10" />
                    ) : (
                      <span className="flex items-baseline gap-0.5">
                        <span className="text-[28px] leading-none font-bold text-foreground tabular-nums">
                          {value ?? '-'}
                        </span>
                        {value !== null && <span className="text-base text-muted-foreground">건</span>}
                        {value === null && <span className="sr-only">불러오지 못함</span>}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
