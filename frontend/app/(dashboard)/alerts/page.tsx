'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { useNotification } from '@/lib/context/NotificationContext';
import {
  getNotificationHistories,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/api/notifications';
import type { NotificationHistory, PageResponse } from '@/types/notice';

function formatSentAt(isoStr: string): string {
  const d = new Date(isoStr);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${mo}.${day} ${h}:${m}`;
}

function alertLabel(remainingDays: number): string {
  return `D-${remainingDays} 알림`;
}

export default function AlertsPage() {
  useRequireAuth();
  const router = useRouter();
  const { decreaseUnreadCount, clearUnreadCount } = useNotification();

  const [histories, setHistories] = useState<NotificationHistory[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    try {
      const result: PageResponse<NotificationHistory> =
        await getNotificationHistories(pageNum, 20);
      setHistories((prev) =>
        append ? [...prev, ...result.content] : result.content
      );
      setHasMore(pageNum < result.totalPages - 1);
    } catch {
      // 에러 시 현재 목록 유지
    }
  }, []);

  useEffect(() => {
    fetchPage(0, false).finally(() => setLoading(false));
  }, [fetchPage]);

  async function handleLoadMore() {
    const nextPage = page + 1;
    setLoadingMore(true);
    await fetchPage(nextPage, true);
    setPage(nextPage);
    setLoadingMore(false);
  }

  async function handleClick(history: NotificationHistory) {
    if (!history.read) {
      // 낙관적 업데이트
      setHistories((prev) =>
        prev.map((h) => (h.id === history.id ? { ...h, read: true } : h))
      );
      try {
        await markNotificationRead(history.id);
        decreaseUnreadCount(1);
      } catch {
        // 실패 시 롤백
        setHistories((prev) =>
          prev.map((h) => (h.id === history.id ? { ...h, read: false } : h))
        );
      }
    }
    router.push(`/notices/${history.noticeId}`);
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setHistories((prev) => prev.map((h) => ({ ...h, read: true })));
      clearUnreadCount();
    } catch {
      // 에러 시 목록 유지
    } finally {
      setMarkingAll(false);
    }
  }

  const hasUnread = histories.some((h) => !h.read);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">알림 내역</h1>
          <p className="text-gray-500 mt-1 text-base">마감 임박 알림을 확인하세요.</p>
        </div>
        {!loading && histories.length > 0 && (
          <Button
            variant="outline"
            onClick={handleMarkAllRead}
            disabled={markingAll || !hasUnread}
            className={`text-base flex-shrink-0 ${!hasUnread && !markingAll ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {markingAll ? '처리 중...' : '모두 읽음 처리'}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 px-5 py-4 min-h-[72px]">
              <Skeleton className="h-5 w-14 mt-0.5 flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : histories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center bg-white rounded-xl border border-gray-200">
          <BellOff className="size-14 text-gray-200 mb-5" strokeWidth={1.5} />
          <p className="text-xl font-semibold text-gray-700">알림 내역이 없어요</p>
          <p className="text-base text-gray-500 mt-2">
            관심 공고 마감 임박 시 이메일로 알림이 발송돼요.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {histories.map((history) => (
              <button
                key={history.id}
                type="button"
                onClick={() => handleClick(history)}
                className={`w-full text-left flex items-start gap-4 px-5 py-4 min-h-[72px] transition-colors hover:bg-gray-50 ${
                  history.read ? 'bg-white' : 'bg-blue-50'
                }`}
              >
                <span
                  className={`flex-shrink-0 mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    history.remainingDays === 1
                      ? 'bg-red-100 text-red-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {alertLabel(history.remainingDays)}
                </span>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-base truncate ${
                      history.read
                        ? 'text-gray-700 font-normal'
                        : 'text-gray-900 font-semibold'
                    }`}
                  >
                    {history.noticeTitle}
                  </p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {formatSentAt(history.sentAt)}
                  </p>
                </div>

                {!history.read && (
                  <span
                    className="flex-shrink-0 mt-1.5 size-2 rounded-full bg-blue-500"
                    aria-label="읽지 않음"
                  />
                )}
              </button>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-8 text-base"
              >
                {loadingMore ? '불러오는 중...' : '더 보기'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
