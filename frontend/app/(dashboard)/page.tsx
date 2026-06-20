'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bookmark, ClipboardList, Inbox, Bell } from 'lucide-react';

import { TodayTodoCard } from '@/components/dashboard/TodayTodoCard';
import { DDayBadge } from '@/components/common/DDayBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getDashboardSummary } from '@/lib/api/dashboard';
import { getWatchlist } from '@/lib/api/watchlist';
import { getUnreadCount } from '@/lib/api/notifications';
import { ACCESS_TOKEN_KEY } from '@/lib/api';
import { formatIsoDate } from '@/lib/utils';
import type { DashboardSummary, WatchlistItem } from '@/types/notice';

export default function HomePage() {
  const router = useRouter();
  const [summary, setSummary]               = useState<DashboardSummary>({ urgentCount: 0, preparingCount: 0, weeklyCount: 0 });
  const [recentNotices, setRecentNotices]   = useState<WatchlistItem[]>([]);
  const [watchlistTotal, setWatchlistTotal] = useState(0);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    /* 비로그인 → 공개 페이지(공고 찾기)로 이동. 홈 대시보드는 로그인 전용. */
    if (!localStorage.getItem(ACCESS_TOKEN_KEY)) {
      router.replace('/notices');
      return;
    }

    async function load() {
      try {
        const [summaryData, watchlistData, unreadData] = await Promise.allSettled([
          getDashboardSummary(),
          getWatchlist(),
          getUnreadCount(),
        ]);

        if (summaryData.status === 'fulfilled')  setSummary(summaryData.value);
        if (watchlistData.status === 'fulfilled') {
          setWatchlistTotal(watchlistData.value.length);
          setRecentNotices(watchlistData.value.slice(0, 3));
        }
        if (unreadData.status === 'fulfilled') setUnreadCount(unreadData.value);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const stats = [
    {
      Icon: Bookmark,
      label: '관심 공고',
      count: watchlistTotal,
      href: '/watchlist',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      Icon: ClipboardList,
      label: '준비중 공고',
      count: summary.preparingCount,
      href: '/watchlist?status=preparing',
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      Icon: Bell,
      label: '읽지 않은 알림',
      count: unreadCount,
      href: '/alerts',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  return (
    <div>
      {/* 인사 영역 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">안녕하세요!</h1>
        <p className="text-gray-500 mt-1 text-base">오늘도 새로운 기회를 찾아보세요.</p>
      </div>

      {/* 2열 레이아웃 */}
      <div className="flex gap-6 items-start">
        {/* ── 왼쪽 메인 ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {/* 섹션 1: 오늘 할 일 */}
          {loading ? (
            <Skeleton className="h-40 w-full rounded-xl" />
          ) : (
            <TodayTodoCard
              urgentCount={summary.urgentCount}
              weeklyCount={summary.weeklyCount}
            />
          )}

          {/* 섹션 2: 최근 저장한 공고 */}
          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-900">최근 저장한 공고</h2>
              <Link href="/watchlist">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  더보기 →
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-4 min-h-[56px]">
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-52" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-4 w-10" />
                  </div>
                ))}
              </div>
            ) : recentNotices.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 py-16 flex flex-col items-center gap-3 text-center">
                <Inbox className="size-12 text-gray-300" strokeWidth={1.5} />
                <p className="text-base font-medium text-gray-700">아직 저장한 공고가 없어요</p>
                <p className="text-base text-gray-500">공고를 찾아서 저장해보세요</p>
                <Link href="/notices">
                  <Button className="mt-2">공고 찾기</Button>
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                {recentNotices.map((notice) => {
                  const deadline = formatIsoDate(notice.bidClseDt);
                  return (
                    <Link
                      key={notice.watchlistItemId}
                      href={`/notices/${notice.noticeId}`}
                      className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors min-h-[56px]"
                    >
                      <div className="min-w-0">
                        <p className="text-base font-medium text-gray-900 truncate">
                          {notice.bidNtceNm}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">{notice.ntceInsttNm}</p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <DDayBadge dDay={notice.dDay} deadline={deadline} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ── 오른쪽 보조 패널 ── */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-base mb-4">나의 현황</h3>
            <div className="flex flex-col gap-1">
              {stats.map(({ Icon, label, count, href, iconBg, iconColor }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`size-8 rounded-lg flex items-center justify-center ${iconBg}`}>
                      <Icon className={`size-4 ${iconColor}`} />
                    </div>
                    <span className="text-base text-gray-700">{label}</span>
                  </div>
                  {loading ? (
                    <Skeleton className="h-5 w-8" />
                  ) : (
                    <span className="text-lg font-bold text-gray-900">{count}건</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
