'use client';

import { useState, useEffect, useSyncExternalStore, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { SaveToast } from '@/components/common/SaveToast';
import {
  NoticeResults,
  NoticePagination,
  ResultsSkeleton,
  ResultsEmpty,
  ResultsError,
} from '@/components/notices/NoticeResults';
import { searchNotices } from '@/lib/api/notices';
import { getWatchlist, saveWatchlist, deleteWatchlist } from '@/lib/api/watchlist';
import { ACCESS_TOKEN_KEY } from '@/lib/api';
import { cn, bidTypeToKorean } from '@/lib/utils';
import type { NoticeListItem, NoticeSearchParams, SearchCondition } from '@/types/notice';

/* ────────────────────────────────────────────────────────── */
/* Types                                                       */
/* ────────────────────────────────────────────────────────── */
type SearchPhase = 'idle' | 'loading' | 'success' | 'error';

const LS_KEY = 'bidsignal_conditions';

/* ────────────────────────────────────────────────────────── */
/* useSyncExternalStore helpers — localStorage → React state  */
/* ────────────────────────────────────────────────────────── */
function subscribeAuthChange(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('authchange', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('authchange', callback);
  };
}

function getIsLoggedInSnapshot(): boolean {
  return !!localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getIsLoggedInServerSnapshot(): boolean {
  return false;
}

let cachedSavedConditionRaw: string | null = null;
let cachedSavedConditionParsed: SearchCondition | null = null;

function getSavedConditionSnapshot(): SearchCondition | null {
  const raw = localStorage.getItem(LS_KEY);
  if (raw === cachedSavedConditionRaw) return cachedSavedConditionParsed;
  cachedSavedConditionRaw = raw;
  if (!raw) {
    cachedSavedConditionParsed = null;
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    cachedSavedConditionParsed = {
      bidTypes:           Array.isArray(parsed.bidTypes) ? (parsed.bidTypes as string[]) : [],
      keywords:           typeof parsed.keywords === 'string' ? parsed.keywords : '',
      urgentAlertEnabled: Boolean(parsed.urgentAlertEnabled),
    };
  } catch {
    cachedSavedConditionParsed = null;
  }
  return cachedSavedConditionParsed;
}

function getSavedConditionServerSnapshot(): SearchCondition | null {
  return null;
}

/**
 * 정렬 UI 값 → 백엔드 sort 파라미터.
 * 백엔드(NoticeRepositoryCustomImpl)가 처리하는 속성: bidClseDt, bidNtceDt, bdgtAmt, createdAt.
 * 'rgstDt'는 백엔드에서 무시되어 기본 정렬(bidNtceDt desc, id desc)로 처리된다 → 결과적으로 게시일 최신순.
 */
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
/* 필터 옵션 (금액 구간은 CLAUDE.md 확정값 — 변경 금지)            */
/* ────────────────────────────────────────────────────────── */
const BID_TYPE_OPTIONS = [
  { code: 'GOODS',        label: '물품' },
  { code: 'SERVICE',      label: '용역' },
  { code: 'CONSTRUCTION', label: '공사' },
  { code: 'FOREIGN',      label: '외자' },
  { code: 'ETC',          label: '기타' },
] as const;

const AMOUNT_OPTIONS = [
  { value: 'all',     label: '전체' },
  { value: 'under5k', label: '5천만 미만' },
  { value: '5kto1',   label: '5천만 ~ 1억' },
  { value: '1to5',    label: '1억 ~ 5억' },
  { value: 'over5',   label: '5억 이상' },
] as const;

const DEADLINE_OPTIONS = [
  { value: 'all',    label: '전체' },
  { value: 'today',  label: '오늘 마감' },
  { value: '7days',  label: '7일 이내' },
  { value: '30days', label: '30일 이내' },
] as const;

const SORT_OPTIONS = [
  { value: 'deadline',    label: '마감임박순' },
  { value: 'latest',      label: '최신순' },
  { value: 'amount_desc', label: '금액높은순' },
  { value: 'amount_asc',  label: '금액낮은순' },
] as const;

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';
const controlHeight = 'h-11 text-base md:text-base';

/* ────────────────────────────────────────────────────────── */
/* 공고 유형 탭 (다중 선택 유지, 빈 배열 = 전체)                    */
/* ────────────────────────────────────────────────────────── */
function BidTypeTabs({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const allSelected = value.length === 0 || value.length === BID_TYPE_OPTIONS.length;

  function toggle(code: string) {
    /* 5종 모두 선택된 상태는 '전체'로 보이므로, 이때 유형을 누르면 그 유형만 선택 */
    if (allSelected) {
      onChange([code]);
      return;
    }
    onChange(value.includes(code) ? value.filter((c) => c !== code) : [...value, code]);
  }

  const chip = (pressed: boolean) =>
    cn(
      'inline-flex h-11 items-center gap-1.5 rounded-full border px-4 text-base whitespace-nowrap transition-colors',
      pressed
        ? 'border-primary bg-primary font-medium text-primary-foreground'
        : 'border-border bg-card text-foreground hover:bg-accent',
      focusRing,
    );

  return (
    <div role="group" aria-label="공고 유형 (여러 개 선택 가능)" className="flex flex-wrap gap-2">
      <button type="button" aria-pressed={allSelected} onClick={() => onChange([])} className={chip(allSelected)}>
        {allSelected && <Check aria-hidden="true" className="size-4" />}
        전체
      </button>
      {BID_TYPE_OPTIONS.map(({ code, label }) => {
        const pressed = !allSelected && value.includes(code);
        return (
          <button
            key={code}
            type="button"
            aria-pressed={pressed}
            onClick={() => toggle(code)}
            className={chip(pressed)}
          >
            {pressed && <Check aria-hidden="true" className="size-4" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Page component                                             */
/* ────────────────────────────────────────────────────────── */
export default function NoticesPage() {
  const router = useRouter();
  const resultsRef = useRef<HTMLElement>(null);
  const searchRequestIdRef = useRef(0);

  /* Filter states */
  const [query, setQuery]             = useState('');
  const [bidTypes, setBidTypes]       = useState<string[]>([]);
  const [amountRange, setAmountRange] = useState('all');
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
  const [bookmarked, setBookmarked]             = useState<Set<number>>(new Set());
  const [showToast, setShowToast]               = useState(false);
  const [showLoginModal, setShowLoginModal]     = useState(false);
  const [filtersOpen, setFiltersOpen]           = useState(false);
  const isLoggedIn = useSyncExternalStore(
    subscribeAuthChange,
    getIsLoggedInSnapshot,
    getIsLoggedInServerSnapshot,
  );

  const savedCondition = useSyncExternalStore(
    subscribeAuthChange,
    getSavedConditionSnapshot,
    getSavedConditionServerSnapshot,
  );

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
    overrides?: {
      bidTypes?: string[];
      query?: string;
      includeExpired?: boolean;
      amountRange?: string;
      deadlineFilter?: string;
    },
  ) => {
    const effectiveSort           = overrideSort ?? sort;
    const effectiveBidTypes       = overrides?.bidTypes        ?? bidTypes;
    const effectiveQuery          = overrides?.query           ?? query;
    const effectiveIncludeExpired = overrides?.includeExpired  ?? includeExpired;
    const effectiveAmountRange    = overrides?.amountRange     ?? amountRange;
    const effectiveDeadline       = overrides?.deadlineFilter  ?? deadlineFilter;

    /* 연달아 검색하면 늦게 도착한 이전 응답이 최신 결과를 덮어쓰지 않도록, 마지막 요청의 응답만 반영 */
    const requestId = ++searchRequestIdRef.current;

    setPhase('loading');
    setCurrentPage(page);

    const params: NoticeSearchParams = {
      keyword:        effectiveQuery.trim() || undefined,
      bidTypes:       effectiveBidTypes.length > 0 ? effectiveBidTypes : undefined,
      ...amountRangeToParams(effectiveAmountRange),
      ...deadlineToParams(effectiveDeadline),
      includeExpired: effectiveIncludeExpired || undefined,
      page,
      size: 20,
      sort: sortToApiParam(effectiveSort),
    };

    try {
      const data = await searchNotices(params);
      if (requestId !== searchRequestIdRef.current) return;
      setResults(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
      setPhase('success');
    } catch {
      if (requestId !== searchRequestIdRef.current) return;
      setPhase('error');
    }
  }, [query, bidTypes, amountRange, deadlineFilter, includeExpired, sort]);

  function handleSearch() { runSearch(undefined, 0); }

  function handleRetry() { runSearch(undefined, currentPage); }

  function handleSortChange(newSort: string) {
    setSort(newSort);
    if (phase === 'success') runSearch(newSort, 0);
  }

  function handlePageChange(page: number) {
    runSearch(undefined, page);
    resultsRef.current?.scrollIntoView({ block: 'start' });
  }

  /* 필터는 바뀌는 즉시 검색 (기존 '마감된 공고 포함'과 동일한 방식) */
  function handleBidTypesChange(next: string[]) {
    setBidTypes(next);
    runSearch(undefined, 0, { bidTypes: next });
  }

  function handleAmountChange(next: string) {
    setAmountRange(next);
    runSearch(undefined, 0, { amountRange: next });
  }

  function handleDeadlineChange(next: string) {
    setDeadlineFilter(next);
    runSearch(undefined, 0, { deadlineFilter: next });
  }

  function handleIncludeExpiredChange(next: boolean) {
    setIncludeExpired(next);
    if (phase !== 'idle') runSearch(undefined, 0, { includeExpired: next });
  }

  function resetFilters() {
    setQuery('');
    setBidTypes([]);
    setAmountRange('all');
    setDeadlineFilter('all');
    setIncludeExpired(false);
    runSearch(undefined, 0, {
      query: '',
      bidTypes: [],
      amountRange: 'all',
      deadlineFilter: 'all',
      includeExpired: false,
    });
  }

  function applyCondition() {
    if (!savedCondition) return;
    const newBidTypes = savedCondition.bidTypes;
    const newQuery    = savedCondition.keywords || '';

    setBidTypes(newBidTypes);
    setQuery(newQuery);

    runSearch(undefined, 0, { bidTypes: newBidTypes, query: newQuery });
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
    bidTypes.length > 0 ||
    amountRange !== 'all' ||
    deadlineFilter !== 'all';

  const detailFilterCount =
    (amountRange !== 'all' ? 1 : 0) +
    (deadlineFilter !== 'all' ? 1 : 0) +
    (includeExpired ? 1 : 0);

  const isLoading = phase === 'idle' || phase === 'loading';

  /* ── Render ── */
  return (
    <div className="flex min-w-0 flex-col gap-6">
      {/* 제목 */}
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-foreground lg:text-[32px]">공고 찾기</h1>
        <p className="mt-1 text-base text-muted-foreground">
          나라장터 공고를 공고명과 조건으로 찾아보세요.
        </p>
      </div>

      {/* 1. 검색창 */}
      <form
        role="search"
        aria-label="공고 검색"
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="flex gap-2"
      >
        <div className="relative min-w-0 flex-1">
          <label htmlFor="notice-keyword" className="sr-only">공고명 검색어</label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="notice-keyword"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="공고명 검색 (예: 도로 보수, 시스템 구축)"
            className={cn(controlHeight, 'bg-card pl-11')}
          />
        </div>
        <Button type="submit" disabled={phase === 'loading'} className={cn(controlHeight, 'shrink-0 px-5 sm:px-7')}>
          검색
        </Button>
      </form>

      <div className="flex flex-col gap-3">
        {/* 2. 공고 유형 탭 + 상세 필터 열기 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <BidTypeTabs value={bidTypes} onChange={handleBidTypesChange} />
          <Button
            type="button"
            variant="outline"
            aria-expanded={filtersOpen}
            aria-controls="notice-detail-filters"
            onClick={() => setFiltersOpen((v) => !v)}
            className={cn(controlHeight, 'shrink-0 self-start bg-card px-4')}
          >
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            상세 필터
            {detailFilterCount > 0 && (
              <span className="tabular-nums text-primary">
                <span className="sr-only">적용 중 </span>{detailFilterCount}
              </span>
            )}
            <ChevronDown
              aria-hidden="true"
              className={cn('size-4 transition-transform', filtersOpen && 'rotate-180')}
            />
          </Button>
        </div>

        {/* 3. 상세 필터 (금액 / 마감일 / 마감 포함) */}
        <div
          id="notice-detail-filters"
          hidden={!filtersOpen}
          className="rounded-[10px] border border-border bg-card p-4 sm:p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[240px_240px_1fr] lg:items-end">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="notice-amount" className="text-base font-medium text-foreground">공고 금액</label>
              <Select value={amountRange} onValueChange={handleAmountChange}>
                <SelectTrigger id="notice-amount" className={cn(controlHeight, 'w-full')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {AMOUNT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-base">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="notice-deadline" className="text-base font-medium text-foreground">마감일</label>
              <Select value={deadlineFilter} onValueChange={handleDeadlineChange}>
                <SelectTrigger id="notice-deadline" className={cn(controlHeight, 'w-full')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {DEADLINE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-base">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:col-span-2 lg:col-span-1">
              <label htmlFor="include-expired" className="flex min-h-11 cursor-pointer items-center gap-2.5 select-none">
                <Checkbox
                  id="include-expired"
                  checked={includeExpired}
                  onCheckedChange={(checked) => handleIncludeExpiredChange(checked === true)}
                  className="size-5"
                />
                <span className="text-base text-foreground">마감된 공고 포함</span>
              </label>
              <Button
                type="button"
                variant="ghost"
                onClick={resetFilters}
                className={cn(controlHeight, 'px-3 text-muted-foreground underline underline-offset-4 hover:text-foreground')}
              >
                조건 초기화
              </Button>
            </div>
          </div>
        </div>

        {/* 저장한 관심 조건 (로그인 상태, localStorage 기준 — 검색 조건으로만 사용) */}
        {isLoggedIn && (
          <div className="flex flex-col gap-2 rounded-[10px] bg-accent px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            {savedCondition ? (
              <>
                <p className="min-w-0 text-base text-foreground">
                  <span className="font-medium">저장한 관심 조건</span>
                  <span className="text-muted-foreground">
                    {' · '}
                    {savedCondition.bidTypes.length > 0
                      ? savedCondition.bidTypes.map(bidTypeToKorean).join(', ')
                      : '전체 유형'}
                    {savedCondition.keywords && <> · <span className="wrap-anywhere">{savedCondition.keywords}</span></>}
                  </span>
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={applyCondition}
                    className={cn(controlHeight, 'bg-card px-4')}
                  >
                    저장한 조건 적용
                  </Button>
                  <Link
                    href="/settings/conditions"
                    aria-label="관심 조건 설정"
                    className={cn('inline-flex min-h-11 items-center rounded-lg px-3 text-base text-primary hover:underline', focusRing)}
                  >
                    설정
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-base text-muted-foreground">
                  자주 찾는 공고 유형과 키워드를 저장해 두면 한 번에 검색할 수 있어요.
                </p>
                <Link
                  href="/settings/conditions"
                  className={cn('inline-flex min-h-11 shrink-0 items-center rounded-lg px-1 text-base font-medium text-primary hover:underline sm:px-3', focusRing)}
                >
                  관심 조건 설정하기
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* 4. 결과 */}
      <section
        ref={resultsRef}
        aria-labelledby="notice-results-heading"
        aria-busy={isLoading}
        className="flex scroll-mt-32 flex-col gap-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h2 id="notice-results-heading" className="text-lg font-bold text-foreground">
            <span aria-live="polite">
              {isLoading ? (
                <span className="font-medium text-muted-foreground">공고를 찾는 중…</span>
              ) : phase === 'success' ? (
                <>
                  {hasActiveFilter ? '검색 결과' : '전체 공고'}{' '}
                  <span className="text-primary tabular-nums">{totalElements.toLocaleString()}건</span>
                </>
              ) : (
                '검색 결과'
              )}
            </span>
          </h2>
          {phase !== 'idle' && phase !== 'error' && (
            <div className="flex items-center gap-2">
              <label htmlFor="notice-sort" className="text-base text-muted-foreground">정렬</label>
              <Select value={sort} onValueChange={handleSortChange} disabled={phase === 'loading'}>
                <SelectTrigger id="notice-sort" className={cn(controlHeight, 'w-40 bg-card')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="end">
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-base">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {isLoading && <ResultsSkeleton />}

        {phase === 'error' && <ResultsError onRetry={handleRetry} />}

        {phase === 'success' && results.length === 0 && (
          <ResultsEmpty onReset={hasActiveFilter || includeExpired ? resetFilters : undefined} />
        )}

        {phase === 'success' && results.length > 0 && (
          <>
            <NoticeResults results={results} bookmarked={bookmarked} onToggleBookmark={toggleBookmark} />
            <NoticePagination current={currentPage} total={totalPages} onChange={handlePageChange} />
          </>
        )}
      </section>

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
