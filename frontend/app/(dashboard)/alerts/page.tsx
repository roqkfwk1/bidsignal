'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationRow } from '@/components/notifications/NotificationRow';
import { LoadError, LoginRequired, controlHeight, focusRing } from '@/components/account/AccountLayout';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { useIsLoggedIn } from '@/lib/hooks/useIsLoggedIn';
import { useNotification } from '@/lib/context/NotificationContext';
import { ACCESS_TOKEN_KEY } from '@/lib/api';
import { showErrorToast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import {
  getNotificationHistories,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/api/notifications';
import type { NotificationHistory } from '@/types/notice';

const PAGE_SIZE = 20;

function PageTitle({ action }: { action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-foreground lg:text-[32px]">알림 내역</h1>
        <p className="mt-1 text-base text-muted-foreground">관심 공고의 마감 임박 알림을 확인하세요.</p>
      </div>
      {action}
    </div>
  );
}

function ListSkeleton() {
  return (
    <ul aria-hidden="true" className="divide-y divide-border overflow-hidden rounded-[10px] border border-border bg-card">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex items-start gap-3 px-4 py-4 sm:px-5">
          <Skeleton className="mt-2 size-2.5 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-40" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function AlertsPage() {
  useRequireAuth();
  const isLoggedIn = useIsLoggedIn();
  const router = useRouter();
  const { unreadCount, decreaseUnreadCount, clearUnreadCount } = useNotification();

  const [histories, setHistories] = useState<NotificationHistory[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  /*
   * 첫 페이지 조회. 이전에는 setState를 담은 useCallback(fetchPage)을 effect 본문에서 바로 호출해
   * react-hooks/set-state-in-effect에 걸렸다. 같은 요청을 effect 안에서 직접 보내고
   * 결과 반영은 비동기 콜백에서만 하도록 바꿨다(요청·반영 내용은 동일).
   */
  useEffect(() => {
    if (!localStorage.getItem(ACCESS_TOKEN_KEY)) return;
    let cancelled = false;
    getNotificationHistories(0, PAGE_SIZE)
      .then((result) => {
        if (cancelled) return;
        setHistories(result.content);
        setHasMore(0 < result.totalPages - 1);
      })
      .catch(() => { if (!cancelled) setLoadError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function handleRetry() {
    setLoading(true);
    setLoadError(false);
    try {
      const result = await getNotificationHistories(0, PAGE_SIZE);
      setHistories(result.content);
      setHasMore(0 < result.totalPages - 1);
      setPage(0);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadMore() {
    const nextPage = page + 1;
    setLoadingMore(true);
    setLoadMoreError(false);
    try {
      const result = await getNotificationHistories(nextPage, PAGE_SIZE);
      setHistories((prev) => [...prev, ...result.content]);
      setHasMore(nextPage < result.totalPages - 1);
      setPage(nextPage);
    } catch {
      /* 실패 시 현재 목록 유지, 페이지 번호는 올리지 않아 같은 페이지를 다시 시도 */
      setLoadMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleOpen(history: NotificationHistory) {
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
      showErrorToast('모두 읽음 처리하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setMarkingAll(false);
    }
  }

  const hasUnread = histories.some((h) => !h.read);

  /* ── 비로그인 ── */
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col gap-6">
        <PageTitle />
        <LoginRequired description="알림 내역은 로그인한 뒤 확인할 수 있어요." />
      </div>
    );
  }

  /* ── 불러오기 실패 ── */
  if (loadError && !loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageTitle />
        <LoadError message="알림 내역을 불러오지 못했어요." onRetry={handleRetry} />
      </div>
    );
  }

  const markAllButton = !loading && histories.length > 0 && (
    <Button
      type="button"
      variant="outline"
      onClick={handleMarkAllRead}
      disabled={markingAll || !hasUnread}
      className={cn(controlHeight, 'self-start px-4 sm:self-auto')}
    >
      {markingAll ? '처리 중...' : '모두 읽음 처리'}
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageTitle action={markAllButton} />

      {loading ? (
        <>
          <p className="sr-only" role="status">알림 내역을 불러오는 중이에요.</p>
          <ListSkeleton />
        </>
      ) : histories.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[10px] border border-border bg-card px-4 py-16 text-center">
          <p className="text-lg font-medium text-foreground">받은 알림이 없어요</p>
          <p className="max-w-md text-base break-keep text-muted-foreground">
            이메일 알림을 켜 두면 검토중·준비중인 관심 공고의 마감 3일 전(D-3)과 1일 전(D-1)에 메일이 발송되고, 여기에 기록돼요.
          </p>
          <Link
            href="/mypage/notifications"
            className={cn('mt-2 inline-flex min-h-11 items-center rounded-lg px-3 text-base font-medium text-primary hover:underline', focusRing)}
          >
            알림 설정 확인하기
          </Link>
        </div>
      ) : (
        <section aria-labelledby="inbox-heading" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="inbox-heading" className="text-lg font-bold text-foreground">받은 알림</h2>
            <p className="text-base text-muted-foreground tabular-nums">
              {/* 건수는 서버 기준(NotificationContext). 건수 조회가 실패해 0이어도 목록에 안 읽은 항목이 있으면 그대로 알림 */}
              {unreadCount > 0
                ? `읽지 않은 알림 ${unreadCount}건`
                : hasUnread ? '읽지 않은 알림이 있어요' : '모두 읽었어요'}
            </p>
          </div>

          <ul className="divide-y divide-border overflow-hidden rounded-[10px] border border-border">
            {histories.map((history) => (
              <NotificationRow key={history.id} history={history} onOpen={handleOpen} />
            ))}
          </ul>

          {(hasMore || loadMoreError) && (
            <div className="flex flex-col items-center gap-2">
              {loadMoreError && (
                <p role="alert" className="text-base text-destructive">
                  알림을 더 불러오지 못했어요. 다시 시도해 주세요.
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className={cn(controlHeight, 'px-8')}
              >
                {loadingMore ? '불러오는 중...' : loadMoreError ? '다시 시도' : '더 보기'}
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
