'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Ban,
  ChevronDown,
  ExternalLink,
  FileSearch,
  FileText,
  Sparkles,
  Star,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { DDayBadge } from '@/components/common/DDayBadge';
import { StatusDropdown } from '@/components/common/StatusDropdown';
import { SaveToast } from '@/components/common/SaveToast';
import { ResultsError } from '@/components/notices/NoticeResults';
import { getNotice } from '@/lib/api/notices';
import {
  getWatchlist,
  saveWatchlist,
  deleteWatchlist,
  updateWatchlistStatus,
  updateWatchlistMemo,
  getChecklist,
  toggleChecklistItem,
  addChecklistItem,
} from '@/lib/api/watchlist';
import { ACCESS_TOKEN_KEY } from '@/lib/api';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import {
  cn,
  computeDDay,
  formatIsoDate,
  formatWon,
  bidTypeToKorean,
} from '@/lib/utils';
import type {
  NoticeDetail,
  WatchlistStatus,
  ChecklistResponse,
  ChecklistItemResponse,
} from '@/types/notice';
import { splitSucsfbidMthdNm } from '@/lib/notice';

interface Props {
  noticeId: number;
}

/* 백엔드 ErrorCode.NOTICE_NOT_FOUND 메시지. apiFetch가 HTTP 상태 코드를 전달하지 않아 메시지로 구분한다. */
const NOTICE_NOT_FOUND_MESSAGE = '공고를 찾을 수 없습니다.';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';
const controlHeight = 'h-11 text-base md:text-base';
const card = 'rounded-[10px] border border-border bg-card';

/* ── 표시 유틸 ── */
/** ISO 일시 → "YYYY-MM-DD HH:mm". 시간이 없으면 날짜만, 값이 없으면 '-' */
function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  const [date, time] = iso.split('T');
  if (!time) return date;
  const hhmm = time.slice(0, 5);
  return hhmm === '00:00' ? date : `${date} ${hhmm}`;
}

function hasValue(v: number | string | null | undefined): boolean {
  return v != null && String(v).trim().length > 0;
}

/* ── 로딩 스켈레톤 (레이아웃과 같은 모양) ── */
function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="공고 정보를 불러오는 중" className="flex flex-col gap-6">
      <Skeleton className="h-6 w-40" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-9 w-full max-w-2xl" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="order-2 flex flex-col gap-5 lg:order-1">
          <Skeleton className="h-40 w-full rounded-[10px]" />
          <Skeleton className="h-72 w-full rounded-[10px]" />
        </div>
        <Skeleton className="order-1 h-64 w-full rounded-[10px] lg:order-2" />
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/notices"
      className={cn(
        'inline-flex min-h-11 items-center gap-1.5 self-start rounded-md text-base text-muted-foreground transition-colors hover:text-foreground',
        focusRing,
      )}
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      공고 찾기로 돌아가기
    </Link>
  );
}

function NotFoundState() {
  return (
    <div className={cn(card, 'flex flex-col items-center gap-2 px-4 py-16 text-center')}>
      <FileSearch aria-hidden="true" className="mb-1 size-10 text-muted-foreground" strokeWidth={1.5} />
      <h1 className="text-lg font-medium text-foreground">공고를 찾을 수 없어요</h1>
      <p className="text-base text-muted-foreground">삭제되었거나 주소가 잘못된 공고입니다.</p>
      <Button asChild variant="outline" className={cn(controlHeight, 'mt-3 px-5')}>
        <Link href="/notices">공고 찾기로 이동</Link>
      </Button>
    </div>
  );
}

/* ── 메인 컴포넌트 ── */
export function NoticeDetailClient({ noticeId }: Props) {
  const router = useRouter();
  const isValidId = Number.isInteger(noticeId) && noticeId > 0;

  const [notice, setNotice]               = useState<NoticeDetail | null>(null);
  const [loading, setLoading]             = useState(isValidId);
  const [fetchError, setFetchError]       = useState(false);
  const [notFound, setNotFound]           = useState(!isValidId);

  const [isBookmarked, setIsBookmarked]       = useState(false);
  const [watchlistStatus, setWatchlistStatus] = useState<WatchlistStatus>('REVIEWING');
  const [memo, setMemo]                       = useState('');
  const [showToast, setShowToast]             = useState(false);
  const [showLoginModal, setShowLoginModal]   = useState(false);

  const [memoSaving, setMemoSaving]         = useState(false);

  const [checklist, setChecklist]           = useState<ChecklistResponse | null>(null);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [newItemTitle, setNewItemTitle]     = useState('');

  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab]   = useState('info');

  useEffect(() => {
    if (!isValidId) return;
    async function load() {
      setLoading(true);
      setFetchError(false);
      setNotFound(false);

      /* 비로그인 상태에서 watchlist API를 호출하면 401 → 전역 login redirect 발생하므로 토큰이 있을 때만 호출 */
      const isLoggedIn = !!localStorage.getItem(ACCESS_TOKEN_KEY);
      const [noticeResult, watchlistResult] = await Promise.allSettled([
        getNotice(noticeId),
        isLoggedIn ? getWatchlist() : Promise.resolve([]),
      ]);

      if (noticeResult.status === 'rejected') {
        const reason: unknown = noticeResult.reason;
        if (reason instanceof Error && reason.message === NOTICE_NOT_FOUND_MESSAGE) {
          setNotFound(true);
        } else {
          setFetchError(true);
        }
        setLoading(false);
        return;
      }

      setNotice(noticeResult.value);

      if (watchlistResult.status === 'fulfilled') {
        const saved = watchlistResult.value.find((w) => w.noticeId === noticeId);
        if (saved) {
          setIsBookmarked(true);
          setWatchlistStatus(saved.status);
          setMemo(saved.memo ?? '');
          setChecklistLoading(true);
          try {
            const checklistData = await getChecklist(noticeId);
            setChecklist(checklistData);
          } catch {
            setChecklist(null);
          } finally {
            setChecklistLoading(false);
          }
        }
      }

      setLoading(false);
    }
    load();
  }, [noticeId, refreshKey, isValidId]);

  const fetchChecklist = useCallback(async () => {
    setChecklistLoading(true);
    try {
      const data = await getChecklist(noticeId);
      setChecklist(data);
    } catch {
      setChecklist(null);
    } finally {
      setChecklistLoading(false);
    }
  }, [noticeId]);

  async function handleToggleSave() {
    if (!notice) return;

    if (!localStorage.getItem(ACCESS_TOKEN_KEY)) {
      setShowLoginModal(true);
      return;
    }

    if (isBookmarked) {
      try {
        await deleteWatchlist(noticeId);
        setIsBookmarked(false);
        setChecklist(null);
        setChecklistLoading(false);
      } catch { /* 실패 시 상태 유지 */ }
    } else {
      try {
        await saveWatchlist(noticeId);
        setIsBookmarked(true);
        setWatchlistStatus('REVIEWING');
        setMemo('');
        setShowToast(true);
        fetchChecklist();
      } catch { /* 실패 시 상태 유지 */ }
    }
  }

  async function handleStatusChange(status: WatchlistStatus) {
    const prev = watchlistStatus;
    setWatchlistStatus(status);
    try {
      await updateWatchlistStatus(noticeId, status);
    } catch {
      setWatchlistStatus(prev);
    }
  }

  async function handleMemoSave() {
    setMemoSaving(true);
    try {
      await updateWatchlistMemo(noticeId, memo);
      showSuccessToast('메모가 저장되었습니다');
    } catch {
      showErrorToast('메모 저장에 실패했습니다. 다시 시도해주세요');
    } finally {
      setMemoSaving(false);
    }
  }

  async function handleToggleItem(itemId: number, checked: boolean) {
    if (!checklist) return;

    const originalItems = checklist.items;

    const applyItems = (items: ChecklistItemResponse[], base: ChecklistResponse): ChecklistResponse => {
      const checkedCount = items.filter((i) => i.checked).length;
      const progressRate = base.totalCount > 0 ? Math.round((checkedCount / base.totalCount) * 100) : 0;
      return { ...base, items, checkedCount, progressRate };
    };

    // 낙관적 업데이트
    const optimisticItems = originalItems.map((item) =>
      item.id === itemId ? { ...item, checked } : item
    );
    setChecklist(applyItems(optimisticItems, checklist));

    try {
      const updated = await toggleChecklistItem(noticeId, itemId, checked);
      setChecklist((prev) => {
        if (!prev) return prev;
        const items = prev.items.map((item) => (item.id === itemId ? updated : item));
        const checkedCount = items.filter((i) => i.checked).length;
        const progressRate = prev.totalCount > 0 ? Math.round((checkedCount / prev.totalCount) * 100) : 0;
        return { ...prev, items, checkedCount, progressRate };
      });
    } catch {
      // 실패 시 원복
      setChecklist(applyItems(originalItems, checklist));
    }
  }

  async function handleAddItem() {
    if (!newItemTitle.trim() || !checklist) return;
    const title = newItemTitle.trim();
    setNewItemTitle('');
    try {
      const newItem = await addChecklistItem(noticeId, title);
      setChecklist((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: [...prev.items, newItem],
          totalCount: prev.totalCount + 1,
        };
      });
    } catch { /* 실패 무시 */ }
  }

  /* ── 상태별 화면 ── */
  if (loading) return <DetailSkeleton />;

  if (notFound) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <NotFoundState />
      </div>
    );
  }

  if (fetchError || !notice) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <h1 className="sr-only">공고 상세</h1>
        <ResultsError onRetry={() => setRefreshKey((k) => k + 1)} />
      </div>
    );
  }

  const dDay     = notice.bidClseDt ? computeDDay(notice.bidClseDt) : null;
  const deadline = formatIsoDate(notice.bidClseDt);
  const amount   = formatWon(notice.presmptPrce || notice.bdgtAmt);
  const bidType  = bidTypeToKorean(notice.bidType);
  const { primary: bidMthdPrimary, detail: bidMthdDetail } = splitSucsfbidMthdNm(notice.sucsfbidMthdNm);
  const noticeNumber = notice.bidNtceOrd ? `${notice.bidNtceNo}-${notice.bidNtceOrd}` : notice.bidNtceNo;
  const hasEvalRate  = hasValue(notice.techAbltEvlRt) && hasValue(notice.bidPrceEvlRt);
  const agency       = notice.dminsttNm || notice.ntceInsttNm;
  const attachments  = notice.attachments ?? [];

  /* 공고 종류: 변경공고/취소공고만 표시 (등록공고·재공고 등 그 외 값은 표시하지 않음) */
  const kind        = notice.ntceKindNm?.trim();
  const isCancelled = kind === '취소공고';
  const isChanged   = kind === '변경공고';
  const ordText     = notice.bidNtceOrd?.trim() ? `차수 ${notice.bidNtceOrd.trim()}` : null;

  const summary = notice.aiSummary?.trim() ? notice.aiSummary : null;

  const originalLink = notice.bidNtceDtlUrl ? (
    <Button asChild variant="outline" className={cn(controlHeight, 'w-full bg-card px-4')}>
      <a href={notice.bidNtceDtlUrl} target="_blank" rel="noopener noreferrer">
        <ExternalLink aria-hidden="true" className="size-4" />
        공고 원문 보기
        <span className="sr-only">(새 창)</span>
      </a>
    </Button>
  ) : null;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <BackLink />

      {/* ── 취소공고 안내 ── */}
      {isCancelled && (
        <div
          role="note"
          className="flex items-start gap-3 rounded-[10px] border border-destructive/40 bg-destructive-soft px-4 py-3.5"
        >
          <Ban aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div className="min-w-0">
            <p className="text-base font-bold text-destructive">취소공고</p>
            <p className="text-base text-foreground">
              이 공고는 취소공고입니다. 취소 사유와 이후 일정은 공고 원문에서 확인하세요.
            </p>
          </div>
        </div>
      )}

      {/* ── 공고명 헤더 ── */}
      <header className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base text-muted-foreground">
          <span className="rounded-md border border-border px-1.5 leading-6">{bidType}</span>
          <span className="tabular-nums wrap-anywhere">{noticeNumber}</span>
          {isChanged && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-accent px-2 leading-7 font-medium text-foreground">
              변경공고
              {ordText && <span className="font-normal text-muted-foreground tabular-nums">· {ordText}</span>}
            </span>
          )}
        </div>
        <h1 className="text-[26px] leading-snug font-bold tracking-tight break-words text-foreground lg:text-[30px]">
          {notice.bidNtceNm}
        </h1>
        <p className="text-base break-words text-muted-foreground">{agency}</p>
      </header>

      {/* ── 본문 + 패널 ── */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[auto_1fr] lg:items-start">
        {/* 요약/행동 패널 — 모바일에선 제목 바로 아래 */}
        <aside
          aria-label="마감과 관심 공고"
          className={cn(card, 'order-1 flex flex-col gap-4 p-5 lg:col-start-2 lg:row-start-1')}
        >
          <div>
            <p className="text-base text-muted-foreground">마감까지</p>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3">
              <span className="text-[28px] leading-tight font-bold tabular-nums [&>span]:text-[28px]">
                <DDayBadge dDay={dDay} deadline={deadline} />
              </span>
              <span className="text-base text-foreground tabular-nums">{formatDateTime(notice.bidClseDt)}</span>
            </div>
          </div>

          <dl className="flex flex-col divide-y divide-border border-y border-border text-base">
            <div className="flex items-baseline justify-between gap-3 py-2.5">
              <dt className="shrink-0 text-muted-foreground">예산금액</dt>
              <dd className="text-right font-medium text-foreground tabular-nums">{amount}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 py-2.5">
              <dt className="shrink-0 text-muted-foreground">낙찰방법</dt>
              <dd className="min-w-0 text-right">
                <span className="block font-medium break-words text-foreground">{bidMthdPrimary || '-'}</span>
                {hasEvalRate && (
                  <span className="block text-muted-foreground tabular-nums">
                    기술 {notice.techAbltEvlRt}% · 가격 {notice.bidPrceEvlRt}%
                  </span>
                )}
              </dd>
            </div>
            {isBookmarked && checklist && (
              <div className="flex items-baseline justify-between gap-3 py-2.5">
                <dt className="shrink-0 text-muted-foreground">준비 진행률</dt>
                <dd className="font-medium text-foreground tabular-nums">
                  {checklist.checkedCount}/{checklist.totalCount}
                  <span className="ml-1 font-normal text-muted-foreground">({checklist.progressRate}%)</span>
                </dd>
              </div>
            )}
          </dl>

          <div className="flex flex-col gap-2">
            {isBookmarked ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleToggleSave}
                className={cn(controlHeight, 'w-full bg-card px-4')}
              >
                <Star aria-hidden="true" className="size-5 fill-primary text-primary" />
                관심 공고 해제
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  onClick={handleToggleSave}
                  className={cn(controlHeight, 'w-full px-4')}
                >
                  <Star aria-hidden="true" className="size-5" />
                  관심 공고에 추가
                </Button>
                <p className="text-base leading-relaxed text-muted-foreground">
                  저장하면 마감 임박 알림과 함께, 낙찰방법에 맞는 준비 체크리스트도 자동으로 만들어드려요.
                </p>
              </>
            )}
            {originalLink}
          </div>
        </aside>

        {/* 관심 공고 관리 (저장한 경우) */}
        {isBookmarked && (
          <section
            aria-labelledby="manage-heading"
            className={cn(card, 'order-3 flex flex-col gap-4 p-5 lg:col-start-2 lg:row-start-2')}
          >
            <h2 id="manage-heading" className="text-base font-bold text-foreground">관심 공고 관리</h2>
            <div>
              <p id="status-label" className="mb-2 text-base text-muted-foreground">진행 상태</p>
              <div role="group" aria-labelledby="status-label">
                <StatusDropdown status={watchlistStatus} onChange={handleStatusChange} />
              </div>
            </div>
            <div>
              <label htmlFor="notice-memo" className="mb-2 block text-base text-muted-foreground">메모</label>
              <textarea
                id="notice-memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                maxLength={200}
                placeholder="이 공고에 대한 메모를 남겨보세요"
                rows={4}
                aria-describedby="notice-memo-count"
                className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              />
              <div className="mt-1.5 flex items-center justify-between">
                <span id="notice-memo-count" className="text-base text-muted-foreground tabular-nums">
                  {memo.length}/200
                </span>
                <Button onClick={handleMemoSave} disabled={memoSaving} className={cn(controlHeight, 'px-5')}>
                  {memoSaving ? '저장 중...' : '메모 저장'}
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* ── 문서형 본문: AI 요약(있을 때) → 정보 탭 → 체크리스트(저장한 공고) ── */}
        <div className="order-2 flex min-w-0 flex-col gap-5 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          {summary && <AiSummarySection summary={summary} />}

          {/* 정보 탭 */}
          <div className={cn(card, 'overflow-hidden')}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full gap-0">
              {/*
                가로 스크롤만 허용. TabsList 기본값(group-data-horizontal/tabs:h-8)이 h-auto보다 우선해 목록이 32px로 눌리고,
                48px 탭과 밑줄(after:bottom-[-5px])이 아래로 넘쳐 세로 스크롤바(위아래 화살표)가 생기던 문제를 막는다.
              */}
              <div className="overflow-x-auto overflow-y-hidden border-b border-border px-2">
                <TabsList variant="line" className="h-auto w-auto gap-0 bg-transparent p-0 group-data-horizontal/tabs:h-auto">
                  <TabsTrigger value="info" className="h-12 rounded-none px-4 text-base sm:px-5 group-data-horizontal/tabs:after:bottom-0">공고 정보</TabsTrigger>
                  <TabsTrigger value="files" className="h-12 rounded-none px-4 text-base sm:px-5 group-data-horizontal/tabs:after:bottom-0">
                    첨부파일
                    <span className="ml-1 text-muted-foreground tabular-nums">{attachments.length}</span>
                  </TabsTrigger>
                  <TabsTrigger value="qualifications" className="h-12 rounded-none px-4 text-base sm:px-5 group-data-horizontal/tabs:after:bottom-0">자격요건</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="info" className="p-5 text-base sm:p-6">
                <dl className="grid gap-x-8 sm:grid-cols-2">
                  <InfoItem label="공고번호" value={noticeNumber} />
                  <InfoItem label="공고 유형" value={bidType} />
                  <InfoItem label="공고기관" value={notice.ntceInsttNm || '-'} />
                  <InfoItem label="수요기관" value={notice.dminsttNm || '-'} />
                  <InfoItem label="입찰방식" value={notice.bidMethdNm || '-'} />
                  <InfoItem label="계약방법" value={notice.cntrctCnclsMthdNm || '-'} />
                  <InfoItem
                    label="낙찰방법"
                    value={bidMthdPrimary || '-'}
                    detail={bidMthdDetail}
                    className="sm:col-span-2"
                  />
                  {hasEvalRate && (
                    <InfoItem
                      label="평가비율"
                      value={`기술 ${notice.techAbltEvlRt}% · 가격 ${notice.bidPrceEvlRt}%`}
                    />
                  )}
                  <InfoItem label="예산금액" value={amount} />
                  <InfoItem label="게시일" value={formatDateTime(notice.bidNtceDt)} />
                  <InfoItem label="입찰 시작" value={formatDateTime(notice.bidBeginDt)} />
                  <InfoItem label="입찰 마감" value={formatDateTime(notice.bidClseDt)} emphasize={dDay !== null && dDay >= 0 && dDay <= 3} />
                  <InfoItem label="개찰일" value={formatDateTime(notice.opengDt)} />
                </dl>
                <p className="mt-5 text-base text-muted-foreground">
                  공고 내용과 일정은 변경될 수 있어요. 입찰 전 공고 원문에서 최종 내용을 확인하세요.
                </p>
              </TabsContent>

              <TabsContent value="files" className="p-5 text-base sm:p-6">
                {attachments.length === 0 ? (
                  <p className="py-4 text-center text-base text-muted-foreground">첨부파일이 없습니다.</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-border">
                    {attachments.map(({ id, fileName, fileUrl }) => (
                      <li key={id} className="py-1 first:pt-0 last:pb-0">
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            'flex min-h-11 items-start gap-3 rounded-md py-2 text-base text-foreground hover:text-primary hover:underline',
                            focusRing,
                          )}
                        >
                          <FileText aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 wrap-anywhere">{fileName || '이름 없는 파일'}</span>
                          <span className="sr-only">(새 창)</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              <TabsContent value="qualifications" className="p-5 text-base sm:p-6">
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                  <p className="text-base text-muted-foreground">
                    자격요건은 첨부된 파일이나 공고 원문에서 확인하실 수 있어요.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {attachments.length > 0 && (
                      <Button
                        variant="outline"
                        className={cn(controlHeight, 'px-4')}
                        onClick={() => setActiveTab('files')}
                      >
                        <FileText aria-hidden="true" className="size-4" />
                        첨부파일 보기
                      </Button>
                    )}
                    {notice.bidNtceDtlUrl && (
                      <Button asChild variant="outline" className={cn(controlHeight, 'px-4')}>
                        <a href={notice.bidNtceDtlUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink aria-hidden="true" className="size-4" />
                          공고 원문 보기
                          <span className="sr-only">(새 창)</span>
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 체크리스트 (저장한 공고만) — 정보 탭 아래에 두어 저장 여부와 관계없이 탭 위치를 같게 한다 */}
          {isBookmarked && (
            checklistLoading ? (
              <Skeleton aria-label="체크리스트를 불러오는 중" className="h-48 w-full rounded-[10px]" />
            ) : checklist ? (
              <ChecklistSection
                checklist={checklist}
                onToggle={handleToggleItem}
                onAdd={handleAddItem}
                newItemTitle={newItemTitle}
                onNewItemTitleChange={setNewItemTitle}
              />
            ) : null
          )}
        </div>
      </div>

      {/* 저장 완료 토스트 */}
      <SaveToast show={showToast} onHide={() => setShowToast(false)} />

      {/* 로그인 유도 모달 */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-lg">로그인이 필요해요</DialogTitle>
            <DialogDescription className="text-base">
              관심 공고를 저장하려면 로그인이 필요합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoginModal(false)} className={cn(controlHeight, 'px-5')}>
              취소
            </Button>
            <Button onClick={() => router.push('/login')} className={cn(controlHeight, 'px-5')}>
              로그인하러 가기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoItem({
  label,
  value,
  detail,
  emphasize = false,
  className,
}: {
  label: string;
  value: string;
  detail?: string | null;
  emphasize?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0 border-b border-border py-3', className)}>
      <dt className="text-base text-muted-foreground">{label}</dt>
      <dd className={cn('mt-0.5 text-base font-medium break-words', emphasize ? 'text-destructive' : 'text-foreground')}>
        {value}
        {detail && detail !== value && (
          <span className="mt-0.5 block font-normal text-muted-foreground">{detail}</span>
        )}
      </dd>
    </div>
  );
}

function AiSummarySection({ summary }: { summary: string }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <section aria-labelledby="ai-summary-heading" className={cn(card, 'p-5 sm:p-6')}>
      <div className="flex items-center justify-between gap-2">
        <h2 id="ai-summary-heading" className="flex items-center gap-1.5 text-base font-bold text-foreground">
          <Sparkles aria-hidden="true" className="size-4 text-primary" />
          공고문 AI 요약
        </h2>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-controls="ai-summary-body"
          aria-label={isExpanded ? 'AI 요약 접기' : 'AI 요약 펼치기'}
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
            focusRing,
          )}
        >
          <ChevronDown aria-hidden="true" className={cn('size-5 transition-transform', isExpanded && 'rotate-180')} />
        </button>
      </div>

      <div id="ai-summary-body" hidden={!isExpanded} className="mt-2">
        <p className="text-base leading-relaxed whitespace-pre-line break-words text-foreground">{summary}</p>
        <p className="mt-3 text-base text-muted-foreground">
          AI가 생성한 요약이며, 정확한 내용은 공고 원문을 확인하세요.
        </p>
      </div>
    </section>
  );
}

interface ChecklistSectionProps {
  checklist: ChecklistResponse;
  onToggle: (itemId: number, checked: boolean) => void;
  onAdd: () => void;
  newItemTitle: string;
  onNewItemTitleChange: (v: string) => void;
}

function ChecklistSection({
  checklist,
  onToggle,
  onAdd,
  newItemTitle,
  onNewItemTitleChange,
}: ChecklistSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <section aria-labelledby="checklist-heading" className={cn(card, 'p-5 sm:p-6')}>
      {/* 헤더 — 항상 표시 */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2">
          <h2 id="checklist-heading" className="min-w-0 text-base font-bold break-words text-foreground">
            {checklist.templateTitle}
          </h2>
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            aria-controls="checklist-body"
            aria-label={isExpanded ? '체크리스트 접기' : '체크리스트 펼치기'}
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
              focusRing,
            )}
          >
            <ChevronDown aria-hidden="true" className={cn('size-5 transition-transform', isExpanded && 'rotate-180')} />
          </button>
        </div>
        {checklist.guideMessage && (
          <p className="mt-1 text-base text-muted-foreground">{checklist.guideMessage}</p>
        )}
      </div>

      {/* 진행률 — 항상 표시 */}
      <div className={isExpanded ? 'mb-4' : ''}>
        <div className="mb-1.5 flex items-center justify-between">
          <span id="checklist-progress-label" className="text-base text-muted-foreground">준비 진행률</span>
          <span className="text-base font-semibold text-foreground tabular-nums">
            {checklist.checkedCount}/{checklist.totalCount}
            <span className="ml-1 font-normal text-muted-foreground">({checklist.progressRate}%)</span>
          </span>
        </div>
        <div
          role="progressbar"
          aria-labelledby="checklist-progress-label"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={checklist.progressRate}
          className="h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${checklist.progressRate}%` }}
          />
        </div>
      </div>

      {/* 항목 목록 + 추가 입력창 — 접으면 숨김 */}
      <div id="checklist-body" hidden={!isExpanded}>
        {checklist.totalCount === 0 ? (
          <p className="py-4 text-center text-base text-muted-foreground">체크리스트 항목이 없습니다.</p>
        ) : (
          <ul className="flex flex-col">
            {checklist.items.map((item) => (
              <li key={item.id}>
                <label className="-mx-2 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/60">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => onToggle(item.id, !item.checked)}
                    className={cn('size-5 shrink-0 cursor-pointer accent-primary', focusRing)}
                  />
                  <span
                    className={cn(
                      'min-w-0 flex-1 text-base break-words',
                      item.checked ? 'text-muted-foreground line-through' : 'text-foreground',
                    )}
                  >
                    {item.title}
                  </span>
                  {!item.defaultItem && (
                    <span className="shrink-0 text-base text-muted-foreground">직접 추가</span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAdd();
          }}
          className="mt-4 flex gap-2 border-t border-border pt-4"
        >
          <label htmlFor="checklist-new-item" className="sr-only">체크리스트 항목 추가</label>
          <Input
            id="checklist-new-item"
            type="text"
            value={newItemTitle}
            onChange={(e) => onNewItemTitleChange(e.target.value)}
            placeholder="항목을 입력하세요"
            maxLength={100}
            className={cn(controlHeight, 'min-w-0 flex-1 bg-card')}
          />
          <Button type="submit" disabled={!newItemTitle.trim()} className={cn(controlHeight, 'shrink-0 px-5')}>
            추가
          </Button>
        </form>
      </div>
    </section>
  );
}
