'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Search, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { DDayBadge } from '@/components/common/DDayBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ApiErrorState } from '@/components/common/ApiErrorState';
import { SaveToast } from '@/components/common/SaveToast';
import { searchNotices } from '@/lib/api/notices';
import { getWatchlist, saveWatchlist, deleteWatchlist } from '@/lib/api/watchlist';
import { ACCESS_TOKEN_KEY } from '@/lib/api';
import {
  cn,
  computeDDay,
  formatIsoDate,
  formatWon,
  formatRegion,
  bidTypeToKorean,
  REGIONS,
} from '@/lib/utils';
import type { NoticeListItem, NoticeSearchParams, SearchCondition } from '@/types/notice';

/* ────────────────────────────────────────────────────────── */
/* Types                                                       */
/* ────────────────────────────────────────────────────────── */
type SearchPhase = 'idle' | 'loading' | 'success' | 'error';

const LS_KEY = 'bidsignal_conditions';

function sortToApiParam(sort: string): string {
  if (sort === 'latest')      return 'rgstDt,desc';
  if (sort === 'deadline')    return 'bidClseDt,asc';
  if (sort === 'amount_desc') return 'bdgtAmt,desc';
  if (sort === 'amount_asc')  return 'bdgtAmt,asc';
  return 'bidClseDt,asc';
}

function amountRangeToParams(range: string): { minAmt?: number; maxAmt?: number } {
  if (range === 'under5k') return { maxAmt: 49_999_999 };
  if (range === '5kto1')   return { minAmt: 50_000_000, maxAmt: 99_999_999 };
  if (range === '1to5')    return { minAmt: 100_000_000, maxAmt: 499_999_999 };
  if (range === 'over5')   return { minAmt: 500_000_000 };
  return {};
}

function deadlineToParams(filter: string): { bidClseDateFrom?: string; bidClseDateTo?: string } {
  const today = new Date();
  const pad   = (n: number) => String(n).padStart(2, '0');
  const fmt   = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const from  = fmt(today);

  if (filter === 'today') return { bidClseDateFrom: from, bidClseDateTo: from };
  if (filter === '7days') {
    const to = new Date(today); to.setDate(to.getDate() + 7);
    return { bidClseDateFrom: from, bidClseDateTo: fmt(to) };
  }
  if (filter === '30days') {
    const to = new Date(today); to.setDate(to.getDate() + 30);
    return { bidClseDateFrom: from, bidClseDateTo: fmt(to) };
  }
  return {};
}

/* ────────────────────────────────────────────────────────── */
/* Skeleton rows                                               */
/* ────────────────────────────────────────────────────────── */
function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <tr key={i} className="border-t border-gray-100">
          <td className="px-5 py-4 align-middle"><Skeleton className="h-4 w-52 mb-1.5" /><Skeleton className="h-3 w-28" /></td>
          <td className="px-5 py-4 align-middle"><Skeleton className="h-4 w-14" /></td>
          <td className="px-5 py-4 align-middle"><Skeleton className="h-4 w-28" /></td>
          <td className="px-5 py-4 align-middle"><Skeleton className="h-4 w-14 mb-1.5" /><Skeleton className="h-3 w-20" /></td>
          <td className="px-5 py-4 align-middle"><Skeleton className="h-4 w-24" /></td>
          <td className="px-5 py-4 align-middle text-center"><Skeleton className="h-5 w-5 mx-auto rounded" /></td>
        </tr>
      ))}
    </>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Pagination                                                  */
/* ────────────────────────────────────────────────────────── */
function PaginationBar({
  current,
  total,
  onChange,
}: {
  current: number;
  total: number;
  onChange: (page: number) => void;
}) {
  if (total <= 1) return null;

  const delta = 2;
  const items: (number | 'ellipsis')[] = [];
  for (let i = 0; i < total; i++) {
    if (i === 0 || i === total - 1 || (i >= current - delta && i <= current + delta)) {
      items.push(i);
    } else if (items[items.length - 1] !== 'ellipsis') {
      items.push('ellipsis');
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(current - 1)}
        disabled={current === 0}
        className="h-9 px-3 text-base"
      >
        이전
      </Button>
      {items.map((item, idx) =>
        item === 'ellipsis' ? (
          <span key={`el-${idx}`} className="px-2 text-base text-gray-400 select-none">…</span>
        ) : (
          <Button
            key={item}
            variant={item === current ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(item)}
            className={`h-9 min-w-[2.25rem] text-base ${
              item === current ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' : ''
            }`}
          >
            {item + 1}
          </Button>
        )
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(current + 1)}
        disabled={current === total - 1}
        className="h-9 px-3 text-base"
      >
        다음
      </Button>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* BidType 멀티 선택 필터                                      */
/* ────────────────────────────────────────────────────────── */
const BID_TYPE_OPTIONS = [
  { code: 'CONSTRUCTION', label: '공사' },
  { code: 'GOODS',        label: '물품' },
  { code: 'SERVICE',      label: '용역' },
  { code: 'FOREIGN',      label: '외자' },
  { code: 'ETC',          label: '기타' },
] as const;

function BidTypeMultiSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef    = useRef<HTMLDivElement>(null);

  /* 외부 클릭 시 닫기 */
  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  function toggle(code: string) {
    onChange(
      value.includes(code)
        ? value.filter((c) => c !== code)
        : [...value, code]
    );
  }

  const triggerLabel =
    value.length === 0 || value.length === BID_TYPE_OPTIONS.length
      ? '전체'
      : value.map((c) => BID_TYPE_OPTIONS.find((t) => t.code === c)?.label ?? c).join(', ');

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          'flex w-full items-center justify-between gap-1.5',
          'rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 h-10',
          'text-base whitespace-nowrap',
          'transition-colors outline-none select-none',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          open && 'border-ring ring-3 ring-ring/50',
        )}
      >
        <span className="flex-1 min-w-0 truncate text-left">{triggerLabel}</span>
        <ChevronDown
          className={cn(
            'size-4 text-muted-foreground flex-shrink-0 transition-transform duration-150',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[8rem] rounded-lg border bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
          {BID_TYPE_OPTIONS.map(({ code, label }) => (
            <div
              key={code}
              role="option"
              aria-selected={value.includes(code)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => toggle(code)}
              className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-accent hover:text-accent-foreground cursor-default select-none"
            >
              <Checkbox
                checked={value.includes(code)}
                onCheckedChange={() => toggle(code)}
                className="size-4 flex-shrink-0 pointer-events-none"
                tabIndex={-1}
              />
              <span className="text-base">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* BidType badge                                               */
/* ────────────────────────────────────────────────────────── */
const BID_TYPE_STYLE: Record<string, string> = {
  CONSTRUCTION: 'bg-blue-100 text-blue-700',
  GOODS:        'bg-emerald-100 text-emerald-700',
  SERVICE:      'bg-purple-100 text-purple-700',
  FOREIGN:      'bg-orange-100 text-orange-700',
  ETC:          'bg-gray-100 text-gray-500',
};

function BidTypeBadge({ type }: { type: string }) {
  const style = BID_TYPE_STYLE[type] ?? BID_TYPE_STYLE.ETC;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${style}`}>
      {bidTypeToKorean(type)}
    </span>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Page component                                             */
/* ────────────────────────────────────────────────────────── */
export default function NoticesPage() {
  const router = useRouter();

  /* Filter states */
  const [query, setQuery]                   = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [bidTypes, setBidTypes]             = useState<string[]>([]);
  const [amountRange, setAmountRange]       = useState('all');
  const [deadlineFilter, setDeadlineFilter] = useState('all');
  const [includeExpired, setIncludeExpired] = useState(false);

  /* Search states */
  const [sort, setSort]               = useState('latest');
  const [phase, setPhase]             = useState<SearchPhase>('idle');
  const [results, setResults]         = useState<NoticeListItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages]   = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  /* UI states */
  const [bookmarked, setBookmarked]       = useState<Set<number>>(new Set());
  const [showToast, setShowToast]         = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [savedCondition] = useState<SearchCondition | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return {
        region:   typeof parsed.region === 'string' ? parsed.region : '',
        bidTypes: Array.isArray(parsed.bidTypes) ? (parsed.bidTypes as string[]) : [],
        keywords: typeof parsed.keywords === 'string' ? parsed.keywords : '',
        urgentAlertEnabled: Boolean(parsed.urgentAlertEnabled),
      };
    } catch { return null; }
  });

  /* 로그인 상태일 때만 관심 공고 목록 로드 (비로그인이면 watchlist API → 401 → 전체 login redirect 방지) */
  useEffect(() => {
    if (!localStorage.getItem(ACCESS_TOKEN_KEY)) return;
    getWatchlist()
      .then((list) => setBookmarked(new Set(list.map((w) => w.noticeId))))
      .catch(() => { });
  }, []);

  const runSearch = useCallback(async (
    overrideSort?: string,
    page = 0,
    overrides?: { region?: string; bidTypes?: string[]; query?: string; includeExpired?: boolean },
  ) => {
    const effectiveSort           = overrideSort ?? sort;
    const effectiveRegion         = overrides?.region          ?? selectedRegion;
    const effectiveBidTypes       = overrides?.bidTypes        ?? bidTypes;
    const effectiveQuery          = overrides?.query           ?? query;
    const effectiveIncludeExpired = overrides?.includeExpired  ?? includeExpired;

    setPhase('loading');
    setCurrentPage(page);

    const params: NoticeSearchParams = {
      keyword:         effectiveQuery.trim() || undefined,
      prtcptLmtRgnNm: effectiveRegion !== 'all' ? effectiveRegion : undefined,
      bidTypes:        effectiveBidTypes.length > 0 ? effectiveBidTypes : undefined,
      ...amountRangeToParams(amountRange),
      ...deadlineToParams(deadlineFilter),
      includeExpired: effectiveIncludeExpired || undefined,
      page,
      size: 20,
      sort: sortToApiParam(effectiveSort),
    };

    try {
      const data = await searchNotices(params);
      setResults(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
      setPhase('success');
    } catch {
      setPhase('error');
    }
  }, [query, selectedRegion, bidTypes, amountRange, deadlineFilter, includeExpired, sort]);

  function handleSearch() { runSearch(undefined, 0); }

  function handleSortChange(newSort: string) {
    setSort(newSort);
    if (phase === 'success') runSearch(newSort, 0);
  }

  function handlePageChange(page: number) {
    runSearch(undefined, page);
  }

  function resetFilters() {
    setQuery('');
    setSelectedRegion('all');
    setBidTypes([]);
    setAmountRange('all');
    setDeadlineFilter('all');
    setIncludeExpired(false);
  }

  function applyCondition() {
    if (!savedCondition) return;
    const newRegion   = savedCondition.region || 'all';
    const newBidTypes = savedCondition.bidTypes;
    const newQuery    = savedCondition.keywords || '';

    setSelectedRegion(newRegion);
    setBidTypes(newBidTypes);
    setQuery(newQuery);

    runSearch(undefined, 0, { region: newRegion, bidTypes: newBidTypes, query: newQuery });
  }

  async function toggleBookmark(notice: NoticeListItem) {
    if (!localStorage.getItem(ACCESS_TOKEN_KEY)) {
      setShowLoginModal(true);
      return;
    }

    const isSaved = bookmarked.has(notice.id);
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(notice.id);
      else next.add(notice.id);
      return next;
    });

    try {
      if (isSaved) {
        await deleteWatchlist(notice.id);
      } else {
        await saveWatchlist(notice.id);
        setShowToast(true);
      }
    } catch {
      setBookmarked((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(notice.id);
        else next.delete(notice.id);
        return next;
      });
    }
  }

  /* 페이지 진입 시 기본 조건으로 자동 검색 */
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { runSearch(); }, []);

  /* 필터 활성화 여부 */
  const hasActiveFilter =
    query.trim() !== '' ||
    selectedRegion !== 'all' ||
    bidTypes.length > 0 ||
    amountRange !== 'all' ||
    deadlineFilter !== 'all';


  /* ── Render ── */
  return (
    <div className="flex gap-6 items-start">
      {/* ── 왼쪽 메인 ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        {/* 섹션 1: 페이지 제목 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">공고 찾기</h1>
          <p className="text-gray-500 mt-1 text-base">원하는 조건으로 공고를 찾아보세요.</p>
        </div>

        {/* 섹션 2: 검색창 + 필터 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
          {/* 1행: 검색창 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="예: 도로 보수, 청사 신축, 시스템 구축"
              className="pl-9 h-10 text-base w-full"
            />
          </div>

          {/* 2행: 지역 / 공고 유형 / 금액 / 마감일
              flex + flex-1 min-w-0 조합으로 4개 항목 완전 균등 분할.
              Radix Select는 내부적으로 fragment를 렌더링해 grid item 제약이 불안정하므로
              각 필터를 flex-1 min-w-0 div로 감싸서 너비 제어를 div 레벨에서 수행함. */}
          <div className="flex gap-3">
            <div className="flex-1 min-w-0">
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-full h-10 text-base"><SelectValue placeholder="지역" /></SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">전체</SelectItem>
                  {REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-0">
              <BidTypeMultiSelect value={bidTypes} onChange={setBidTypes} />
            </div>

            <div className="flex-1 min-w-0">
              <Select value={amountRange} onValueChange={setAmountRange}>
                <SelectTrigger className="w-full h-10 text-base"><SelectValue placeholder="공고 금액" /></SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="under5k">5천만 미만</SelectItem>
                  <SelectItem value="5kto1">5천만 ~ 1억</SelectItem>
                  <SelectItem value="1to5">1억 ~ 5억</SelectItem>
                  <SelectItem value="over5">5억 이상</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-0">
              <Select value={deadlineFilter} onValueChange={setDeadlineFilter}>
                <SelectTrigger className="w-full h-10 text-base"><SelectValue placeholder="마감일" /></SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="today">오늘 마감</SelectItem>
                  <SelectItem value="7days">7일 이내</SelectItem>
                  <SelectItem value="30days">30일 이내</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>  {/* 2행 끝 */}

          {/* 3행: 초기화 / 마감 포함 체크박스 / 검색하기 */}
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-gray-500 hover:text-gray-700 underline underline-offset-2 decoration-gray-400"
            >
              조건 초기화
            </Button>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox
                  id="include-expired"
                  checked={includeExpired}
                  onCheckedChange={(checked) => {
                    const next = checked === true;
                    setIncludeExpired(next);
                    if (phase !== 'idle') runSearch(undefined, 0, { includeExpired: next });
                  }}
                  className="size-5"
                />
                <span className="text-base text-gray-600">마감된 공고 포함</span>
              </label>
              <Button
                onClick={handleSearch}
                disabled={phase === 'loading'}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                검색하기
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-400">
            마감된 공고 포함을 체크하면 지난 공고도 함께 볼 수 있어요.
          </p>
        </div>

        {/* 섹션 3: 검색 결과 */}
        <section>
          {/* 결과 헤더 */}
          {phase !== 'idle' && (
            <div className="flex justify-between items-center mb-3">
              <p className="text-base font-semibold text-gray-900">
                {phase === 'loading' ? (
                  <span className="text-gray-400">검색 중...</span>
                ) : phase === 'success' ? (
                  <>
                    {hasActiveFilter ? '검색 결과' : '전체 공고'}{' '}
                    <span className="text-blue-600">{totalElements.toLocaleString()}건</span>{' '}
                    중 {results.length.toLocaleString()}건 표시
                  </>
                ) : null}
              </p>
              {phase === 'success' && (
                <Select value={sort} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="deadline">마감임박순</SelectItem>
                    <SelectItem value="latest">최신순</SelectItem>
                    <SelectItem value="amount_desc">금액높은순</SelectItem>
                    <SelectItem value="amount_asc">금액낮은순</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* idle */}
          {phase === 'idle' && (
            <div className="bg-white rounded-xl border border-gray-200 py-16 flex flex-col items-center gap-2 text-center">
              <Search className="size-10 text-gray-200" strokeWidth={1.5} />
              <p className="text-base text-gray-400">검색 버튼을 눌러 공고를 찾아보세요.</p>
            </div>
          )}

          {/* loading */}
          {phase === 'loading' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-base table-fixed">
                <thead>
                  <tr className="bg-gray-50 text-sm text-gray-500 border-b border-gray-100">
                    <th className="text-left px-5 py-3 font-medium">공고명</th>
                    <th className="text-left px-5 py-3 font-medium whitespace-nowrap w-20">참가지역</th>
                    <th className="text-left px-5 py-3 font-medium whitespace-nowrap w-60">수요기관</th>
                    <th className="text-left px-5 py-3 font-medium whitespace-nowrap w-28">마감일</th>
                    <th className="text-left px-5 py-3 font-medium whitespace-nowrap w-32">금액</th>
                    <th className="text-center px-5 py-3 font-medium whitespace-nowrap w-14">★</th>
                  </tr>
                </thead>
                <tbody><SkeletonRows /></tbody>
              </table>
            </div>
          )}

          {/* error */}
          {phase === 'error' && (
            <div className="bg-white rounded-xl border border-gray-200">
              <ApiErrorState onRetry={handleSearch} />
            </div>
          )}

          {/* success */}
          {phase === 'success' && (
            results.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200">
                <EmptyState
                  title="검색 결과가 없어요"
                  description="다른 키워드나 조건으로 검색해보세요"
                />
              </div>
            ) : (
              <>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-base table-fixed">
                  <thead>
                    <tr className="bg-gray-50 text-sm text-gray-500 border-b border-gray-100">
                      <th className="text-left px-5 py-3 font-medium">공고명</th>
                      <th className="text-left px-5 py-3 font-medium whitespace-nowrap w-20">참가지역</th>
                      <th className="text-left px-5 py-3 font-medium whitespace-nowrap w-60">수요기관</th>
                      <th className="text-left px-5 py-3 font-medium whitespace-nowrap w-28">마감일</th>
                      <th className="text-left px-5 py-3 font-medium whitespace-nowrap w-32">금액</th>
                      <th className="text-center px-5 py-3 font-medium whitespace-nowrap w-14">★</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((notice) => {
                      const dDay     = notice.bidClseDt ? computeDDay(notice.bidClseDt) : null;
                      const deadline = formatIsoDate(notice.bidClseDt);
                      const amount   = formatWon(notice.bdgtAmt);
                      const isSaved  = bookmarked.has(notice.id);

                      return (
                        <tr
                          key={notice.id}
                          className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-5 py-4 align-middle max-w-0 overflow-hidden">
                            <Link
                              href={`/notices/${notice.id}`}
                              className="block font-medium text-gray-900 hover:text-blue-600 transition-colors truncate"
                              title={notice.bidNtceNm}
                            >
                              {notice.bidNtceNm}
                            </Link>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs text-gray-400 shrink-0">{notice.bidNtceNo}</span>
                              <BidTypeBadge type={notice.bidType} />
                            </div>
                          </td>

                          <td className="px-5 py-4 align-middle text-sm text-gray-500 whitespace-nowrap">
                            {formatRegion(notice.prtcptLmtRgnNm)}
                          </td>

                          <td className="px-5 py-4 align-middle text-gray-600 whitespace-nowrap overflow-hidden">
                            <span className="block truncate" title={notice.dminsttNm || notice.ntceInsttNm}>
                              {notice.dminsttNm || notice.ntceInsttNm}
                            </span>
                          </td>

                          <td className="px-5 py-4 align-middle whitespace-nowrap">
                            <DDayBadge dDay={dDay} deadline={deadline} />
                            <p className="text-xs text-gray-400 mt-0.5">{deadline}</p>
                          </td>

                          <td className="px-5 py-4 align-middle text-gray-600 whitespace-nowrap">{amount}</td>

                          <td className="px-5 py-4 align-middle text-center">
                            <button
                              onClick={() => toggleBookmark(notice)}
                              title={isSaved ? '관심 공고 해제' : '관심 공고에 추가'}
                              aria-label={isSaved ? '관심 공고 해제' : '관심 공고에 추가'}
                              className="inline-flex items-center justify-center hover:scale-110 transition-transform"
                            >
                              <Star
                                className={`size-5 transition-colors ${
                                  isSaved
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300 hover:text-yellow-300'
                                }`}
                              />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <PaginationBar
                current={currentPage}
                total={totalPages}
                onChange={handlePageChange}
              />
              </>
            )
          )}
        </section>
      </div>

      {/* ── 오른쪽 보조 패널 ── */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-4">
        {/* 패널 1: 관심 조건 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900 text-base">관심 조건</h3>
            <Link
              href="/settings/conditions"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              설정
            </Link>
          </div>

          {savedCondition ? (
            <div className="flex flex-col gap-2">
              {savedCondition.region && (
                <div>
                  <p className="text-xs text-gray-400 font-medium">지역</p>
                  <p className="text-sm text-gray-700 mt-0.5">{savedCondition.region}</p>
                </div>
              )}
              {savedCondition.bidTypes.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 font-medium">공고 유형</p>
                  <p className="text-sm text-gray-700 mt-0.5">
                    {savedCondition.bidTypes.map(bidTypeToKorean).join(', ')}
                  </p>
                </div>
              )}
              {savedCondition.keywords && (
                <div>
                  <p className="text-xs text-gray-400 font-medium">키워드</p>
                  <p className="text-sm text-gray-700 mt-0.5 break-all">{savedCondition.keywords}</p>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={applyCondition}
              >
                저장한 조건 적용
              </Button>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-gray-400 mb-2">저장된 조건이 없어요</p>
              <Link
                href="/settings/conditions"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                관심 조건 설정하기 →
              </Link>
            </div>
          )}
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
