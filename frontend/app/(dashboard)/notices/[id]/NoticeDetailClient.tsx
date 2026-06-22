'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star, Download, FileText, ExternalLink } from 'lucide-react';

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
} from '@/lib/api/watchlist';
import { ACCESS_TOKEN_KEY } from '@/lib/api';
import {
  computeDDay,
  formatIsoDate,
  formatWon,
  formatRegion,
  bidTypeToKorean,
} from '@/lib/utils';
import type { NoticeDetail, WatchlistStatus } from '@/types/notice';
import { splitSucsfbidMthdNm } from '@/lib/notice';

interface Props {
  noticeId: number;
}

const mockFiles = [
  { name: '입찰공고문.pdf' },
  { name: '설계도면.dwg' },
  { name: '현장설명서.hwp' },
];

const qualifications = [
  { label: '업종 제한', value: '건축공사업 면허 보유' },
  { label: '실적 요건', value: '최근 3년 이내 유사 공사 실적' },
  { label: '지역 제한', value: '해당 지역 소재 업체 우대' },
  { label: '기타 요건', value: '사업자 등록증 필수' },
];

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

  const load = useCallback(async () => {
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
      }
    }

    setLoading(false);
  }, [noticeId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

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
      } catch { /* 실패 시 상태 유지 */ }
    } else {
      try {
        await saveWatchlist(noticeId);
        setIsBookmarked(true);
        setWatchlistStatus('REVIEWING');
        setMemo('');
        setShowToast(true);
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
    try {
      await updateWatchlistMemo(noticeId, memo);
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
          <ApiErrorState onRetry={load} />
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

          {/* 섹션 2: 탭 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <Tabs defaultValue="detail" className="w-full gap-0">
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
                <div className="grid grid-cols-2 gap-4">
                  {qualifications.map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                      <p className="text-base text-gray-800 font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="files" className="p-6 text-base">
                <div className="flex flex-col divide-y divide-gray-100">
                  {mockFiles.map(({ name }) => (
                    <div key={name} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <FileText className="size-5 text-gray-400" />
                        <span className="text-base text-gray-700">{name}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => alert('준비 중입니다.')}
                        className="gap-1.5"
                      >
                        <Download className="size-3.5" />
                        다운로드
                      </Button>
                    </div>
                  ))}
                </div>
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
                  <Button size="sm" onClick={handleMemoSave}>저장</Button>
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
                저장하면 마감 임박 시 대시보드에서 바로 확인할 수 있어요.
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
                <span className="text-gray-500">참가지역</span>
                <span className="text-gray-900 font-medium">{formatRegion(notice.prtcptLmtRgnNm)}</span>
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
              <div className="flex justify-between items-center py-2 text-sm">
                <span className="text-gray-500">공고 유형</span>
                <span className="text-gray-900 font-medium">{bidType}</span>
              </div>
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
