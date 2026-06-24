'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star, FileText, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import { ApiErrorState } from '@/components/common/ApiErrorState';
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



/* ── 로딩 스켈레톤 ── */
function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-5 w-24" />
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-8 w-80" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>
      <div className="flex gap-6">
        <div className="flex-1 flex flex-col gap-5">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="w-80 flex flex-col gap-4">
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ── 메인 컴포넌트 ── */
export function NoticeDetailClient({ noticeId }: Props) {
  const router = useRouter();
  const [notice, setNotice]               = useState<NoticeDetail | null>(null);
  const [loading, setLoading]             = useState(true);
  const [fetchError, setFetchError]       = useState(false);

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
  const [activeTab, setActiveTab]   = useState('detail');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setFetchError(false);

      /* 비로그인 상태에서 watchlist API를 호출하면 401 → 전역 login redirect 발생하므로 토큰이 있을 때만 호출 */
      const isLoggedIn = !!localStorage.getItem(ACCESS_TOKEN_KEY);
      const [noticeResult, watchlistResult] = await Promise.allSettled([
        getNotice(noticeId),
        isLoggedIn ? getWatchlist() : Promise.resolve([]),
      ]);

      if (noticeResult.status === 'rejected') {
        setFetchError(true);
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
  }, [noticeId, refreshKey]);

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

  if (loading) return <DetailSkeleton />;

  if (fetchError || !notice) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/notices" className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-base transition-colors">
          <ArrowLeft className="size-4" /> 목록으로
        </Link>
        <div className="bg-white rounded-xl border border-gray-200">
          <ApiErrorState onRetry={() => setRefreshKey((k) => k + 1)} />
        </div>
      </div>
    );
  }

  const dDay     = notice.bidClseDt ? computeDDay(notice.bidClseDt) : null;
  const deadline = formatIsoDate(notice.bidClseDt);
  const amount   = formatWon(notice.presmptPrce || notice.bdgtAmt);
  const bidType  = bidTypeToKorean(notice.bidType);
  const { primary: bidMthdPrimary, detail: bidMthdDetail } = splitSucsfbidMthdNm(notice.sucsfbidMthdNm);
  const noticeNumber = notice.bidNtceOrd ? `${notice.bidNtceNo}-${notice.bidNtceOrd}` : notice.bidNtceNo;

  return (
    <div className="flex flex-col gap-6">
      {/* ── 브레드크럼 + 공고명 헤더 ── */}
      <div>
        <Link
          href="/notices"
          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-base mb-4 transition-colors"
        >
          <ArrowLeft className="size-4" />
          목록으로
        </Link>

        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">{notice.bidNtceNm}</h1>

          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            {notice.bidNtceDtlUrl && (
              <a
                href={notice.bidNtceDtlUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="gap-1.5">
                  <ExternalLink className="size-4" />
                  공고 원문 보기
                </Button>
              </a>
            )}
            <button
              onClick={handleToggleSave}
              aria-label={isBookmarked ? '관심 공고 해제' : '관심 공고 추가'}
              className="hover:scale-110 transition-transform"
            >
              <Star
                className={`size-6 transition-colors ${
                  isBookmarked
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 hover:text-yellow-300'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── 2열 레이아웃 ── */}
      <div className="flex gap-6 items-start">
        {/* ── 왼쪽 메인 ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {/* 섹션 1: 공고 기본 정보 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="공고번호"  value={noticeNumber} />
              <InfoItem label="공고기관"  value={notice.ntceInsttNm} />
              <InfoItem label="수요기관"  value={notice.dminsttNm || '-'} />
              <InfoItem label="게시일"    value={notice.bidNtceDt ? formatIsoDate(notice.bidNtceDt) : '-'} />
              <InfoItem label="입찰방식"  value={notice.bidMethdNm || '-'} />
              <InfoItem
                label="낙찰방법"
                value={bidMthdPrimary || '-'}
                inlineDetail={bidMthdDetail}
                detailTitle={notice.sucsfbidMthdNm ?? undefined}
              />
              <InfoItem label="예산금액"  value={amount} />
              <InfoItem label="공고 유형" value={bidType} />

              {/* 마감일 강조 */}
              <div
                className={`col-span-2 rounded-lg p-4 ${
                  dDay !== null && dDay <= 3 ? 'bg-red-50' : dDay !== null && dDay <= 7 ? 'bg-orange-50' : 'bg-gray-50'
                }`}
              >
                <p className="text-xs text-gray-500 mb-1">마감일</p>
                <div className="flex items-center gap-3">
                  <span className="text-base font-semibold text-gray-900">{deadline}</span>
                  <DDayBadge dDay={dDay} deadline={deadline} />
                </div>
              </div>
            </div>
          </div>

          {/* 섹션 2: 체크리스트 (관심공고 등록 시에만 표시) */}
          {isBookmarked && (
            checklistLoading ? (
              <Skeleton className="h-48 w-full rounded-xl" />
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

          {/* 섹션 3: 탭 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full gap-0">
              <div className="border-b border-gray-100 px-2 pt-1">
                <TabsList variant="line" className="bg-transparent h-auto pb-0 gap-0 w-auto">
                  {['detail', 'qualifications', 'files'].map((val, i) => (
                    <TabsTrigger key={val} value={val} className="px-5 py-3 text-base rounded-none">
                      {['상세내용', '자격요건', '첨부파일'][i]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="detail" className="p-6 text-base">
                <section className="mb-6">
                  <h3 className="font-semibold text-gray-900 text-base mb-2">사업 개요</h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    {notice.ntceKindNm || '상세 내용은 공고 원문을 확인하세요.'}
                  </p>
                </section>
                {notice.reNtceYn === 'Y' && (
                  <section className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-sm text-amber-700 font-medium">이 공고는 정정된 공고입니다. 원문에서 변경 내용을 확인하세요.</p>
                  </section>
                )}
              </TabsContent>

              <TabsContent value="qualifications" className="p-6 text-base">
                <div className="flex flex-col items-center gap-4 py-6">
                  <p className="text-base text-gray-600 text-center">
                    자격요건은 첨부된 파일에서 확인하실 수 있어요.
                  </p>
                  <div className="flex gap-2">
                    {notice.attachments.length > 0 && (
                      <Button
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => setActiveTab('files')}
                      >
                        <FileText className="size-4" />
                        첨부파일 보기
                      </Button>
                    )}
                    {notice.bidNtceDtlUrl && (
                      <a
                        href={notice.bidNtceDtlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" className="gap-1.5">
                          <ExternalLink className="size-4" />
                          공고 원문 보기
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="files" className="p-6 text-base">
                {notice.attachments.length === 0 ? (
                  <p className="text-base text-gray-500 text-center py-4">첨부파일이 없습니다.</p>
                ) : (
                  <div className="flex flex-col divide-y divide-gray-100">
                    {notice.attachments.map(({ id, fileName, fileUrl }) => (
                      <div key={id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                        <FileText className="size-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base text-blue-600 hover:text-blue-700 hover:underline break-all"
                        >
                          {fileName}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* ── 오른쪽 보조 패널 ── */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-4">
          {/* 패널 1: 관심 공고 액션 */}
          {isBookmarked ? (
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">진행 상태</p>
                <StatusDropdown status={watchlistStatus} onChange={handleStatusChange} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">메모</p>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  maxLength={200}
                  placeholder="이 공고에 대한 메모를 남겨보세요"
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-base text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-xs text-gray-400">{memo.length}/200</span>
                  <Button size="sm" onClick={handleMemoSave} disabled={memoSaving}>
                    {memoSaving ? '저장 중...' : '저장'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <Button
                onClick={handleToggleSave}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-base h-11"
              >
                + 관심 공고에 추가
              </Button>
              <p className="text-sm text-gray-500 mt-2 text-center leading-relaxed">
                저장하면 마감 임박 알림과 함께, 낙찰방법에 맞는 준비 체크리스트도 자동으로 만들어드려요.
              </p>
            </div>
          )}

          {/* 패널 2: 핵심 정보 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 text-base mb-3">핵심 정보</h3>
            <div className="flex flex-col">
              <div className="flex justify-between items-center py-2 text-sm border-b border-gray-100">
                <span className="text-gray-500">마감까지</span>
                <DDayBadge dDay={dDay} deadline={deadline} />
              </div>
              <div className="flex justify-between items-center py-2 text-sm border-b border-gray-100">
                <span className="text-gray-500">예산금액</span>
                <span className="text-gray-900 font-medium">{amount}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm border-b border-gray-100">
                <span className="text-gray-500">입찰방식</span>
                <span className="text-gray-900 font-medium">{notice.bidMethdNm || '-'}</span>
              </div>
              <div className="flex justify-between items-start py-2 text-sm border-b border-gray-100">
                <span className="text-gray-500 flex-shrink-0">낙찰방법</span>
                <div className="flex flex-col items-end ml-2 min-w-0">
                  <span className="text-gray-900 font-medium truncate max-w-[160px]">
                    {bidMthdPrimary || '-'}
                  </span>
                  {notice.techAbltEvlRt != null &&
                   String(notice.techAbltEvlRt).trim().length > 0 &&
                   notice.bidPrceEvlRt != null &&
                   String(notice.bidPrceEvlRt).trim().length > 0 && (
                    <span className="text-xs text-gray-400 mt-0.5">
                      기술 {notice.techAbltEvlRt}% · 가격 {notice.bidPrceEvlRt}%
                    </span>
                  )}
                </div>
              </div>
              <div className={`flex justify-between items-center py-2 text-sm ${isBookmarked && checklist ? 'border-b border-gray-100' : ''}`}>
                <span className="text-gray-500">공고 유형</span>
                <span className="text-gray-900 font-medium">{bidType}</span>
              </div>
              {isBookmarked && checklist && (
                <div className="flex justify-between items-center py-2 text-sm">
                  <span className="text-gray-500">준비 진행률</span>
                  <span className="text-gray-900 font-medium">
                    {checklist.checkedCount}/{checklist.totalCount}
                    <span className="ml-1 text-gray-500 font-normal">({checklist.progressRate}%)</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 패널 3: 초보자 팁 */}
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
            <h3 className="font-semibold text-amber-800 text-base mb-2">초보자 팁</h3>
            <p className="text-sm text-amber-700 leading-relaxed">
              마감일 3일 전까지 서류를 준비해두는 것을 권장합니다.
              <br />
              궁금한 점은 발주기관에 직접 문의하세요.
            </p>
          </div>
        </div>
      </div>

      {/* 저장 완료 토스트 */}
      <SaveToast show={showToast} onHide={() => setShowToast(false)} />

      {/* 로그인 유도 모달 */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>로그인이 필요해요</DialogTitle>
            <DialogDescription>
              관심 공고를 저장하려면 로그인이 필요합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoginModal(false)}>취소</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => router.push('/login')}
            >
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
  inlineDetail,
  detailTitle,
}: {
  label: string;
  value: string;
  inlineDetail?: string | null;
  detailTitle?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p
        className={`text-base font-medium text-gray-900${inlineDetail ? ' truncate' : ''}`}
        title={detailTitle}
      >
        {value}
        {inlineDetail && inlineDetail !== value && (
          <span className="ml-1.5 text-xs font-normal text-gray-400">({inlineDetail})</span>
        )}
      </p>
    </div>
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
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* 헤더 — 항상 표시 */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-gray-900 text-base">{checklist.templateTitle}</h3>
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-label={isExpanded ? '체크리스트 접기' : '체크리스트 펼치기'}
            className="flex-shrink-0 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
        {checklist.guideMessage && (
          <p className="text-sm text-gray-500 mt-1">{checklist.guideMessage}</p>
        )}
      </div>

      {/* 진행률 — 항상 표시 */}
      <div className={isExpanded ? 'mb-5' : ''}>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm text-gray-600">준비 진행률</span>
          <span className="text-sm font-semibold text-gray-900">
            {checklist.checkedCount}/{checklist.totalCount}
            <span className="ml-1 text-gray-500 font-normal">({checklist.progressRate}%)</span>
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${checklist.progressRate}%` }}
          />
        </div>
      </div>

      {/* 항목 목록 + 추가 입력창 — 접으면 숨김 */}
      {isExpanded && (
        <>
          {checklist.totalCount === 0 ? (
            <p className="text-base text-gray-500 text-center py-4">체크리스트 항목이 없습니다.</p>
          ) : (
            <div className="flex flex-col">
              {checklist.items.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => onToggle(item.id, !item.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                  />
                  <span
                    className={`text-base flex-1 ${
                      item.checked ? 'line-through text-gray-400' : 'text-gray-800'
                    }`}
                  >
                    {item.title}
                  </span>
                  {!item.defaultItem && (
                    <span className="text-xs text-gray-400 flex-shrink-0">직접 추가</span>
                  )}
                </label>
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => onNewItemTitleChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onAdd(); }}
              placeholder="항목을 입력하세요"
              maxLength={100}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button
              onClick={onAdd}
              disabled={!newItemTitle.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
            >
              추가
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
