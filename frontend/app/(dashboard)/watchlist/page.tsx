'use client';

import { useState, useMemo, useEffect, useSyncExternalStore, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, MoreHorizontal, StickyNote } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DDayBadge } from '@/components/common/DDayBadge';
import { StatusDropdown } from '@/components/common/StatusDropdown';
import { ResultsError } from '@/components/notices/NoticeResults';
import { getWatchlist, deleteWatchlist, updateWatchlistStatus } from '@/lib/api/watchlist';
import { ACCESS_TOKEN_KEY } from '@/lib/api';
import { formatIsoDate } from '@/lib/utils';
import { DDAY_WARNING_THRESHOLD } from '@/constants/notice';
import { WATCHLIST_STATUS_LABEL } from '@/types/notice';
import type { WatchlistItem, WatchlistStatus } from '@/types/notice';
import { cn } from '@/lib/utils';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';

/* ────────────────────────────────────────────────────────── */
/* Types & constants                                           */
/* ────────────────────────────────────────────────────────── */
type TabKey    = 'all' | 'reviewing' | 'preparing' | 'submitted' | 'dropped';
type DueWithin = 'all' | '3' | '7';
type Lane      = { tab: Exclude<TabKey, 'all'>; status: WatchlistStatus };

/* 탭 키 → WatchlistStatus 매핑 겸 레인 순서 — 포기는 항상 마지막 */
const LANE_ORDER: Lane[] = [
  { tab: 'reviewing', status: 'REVIEWING' },
  { tab: 'preparing', status: 'PREPARING' },
  { tab: 'submitted', status: 'SUBMITTED' },
  { tab: 'dropped',   status: 'DROPPED' },
];

function parseStatusParam(raw: string | null): TabKey {
  const valid: TabKey[] = ['all', 'reviewing', 'preparing', 'submitted', 'dropped'];
  return valid.includes(raw as TabKey) ? (raw as TabKey) : 'all';
}

function parseDueWithin(raw: string | null): DueWithin {
  if (raw === '3' || raw === '7') return raw;
  return 'all';
}

/** ?dueFrom=N — 남은 일수 하한(N 이상). 0 이상의 정수만 허용, 그 외는 무시 */
function parseDueFrom(raw: string | null): number | null {
  if (raw === null || !/^\d{1,3}$/.test(raw)) return null;
  return Number(raw);
}

/** ?active=1 — 검토중·준비중만 보기 (홈 '오늘 할 일' 건수 정의와 동일한 상태 조건) */
function parseActiveOnly(raw: string | null): boolean {
  return raw === '1' || raw === 'true';
}

const ACTIVE_STATUSES: readonly WatchlistStatus[] = ['REVIEWING', 'PREPARING'];

/* 로그인 상태 — localStorage → React */
function subscribeAuthChange(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('authchange', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('authchange', callback);
  };
}
const getIsLoggedInSnapshot = () => !!localStorage.getItem(ACCESS_TOKEN_KEY);
const getIsLoggedInServerSnapshot = () => true; /* SSR에선 로딩 화면을 그리도록 로그인으로 가정 */

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';
const controlHeight = 'h-11 text-base md:text-base';

/* ────────────────────────────────────────────────────────── */
/* 표(lg 이상) 정렬·표시 도우미                                    */
/* ────────────────────────────────────────────────────────── */
/* 진행 중(검토중·준비중) → 제출완료 → 포기 */
const TABLE_STATUS_RANK: Record<WatchlistStatus, number> = { REVIEWING: 0, PREPARING: 0, SUBMITTED: 1, DROPPED: 2 };

/* 같은 상태 묶음 안: 마감 전(임박순) → 마감 지남(최근 마감순) → 마감일 없음 */
function deadlineRank(dDay: number | null): [number, number] {
  if (dDay === null) return [2, 0];
  return dDay < 0 ? [1, -dDay] : [0, dDay];
}

function compareForTable(a: WatchlistItem, b: WatchlistItem): number {
  const byStatus = TABLE_STATUS_RANK[a.status] - TABLE_STATUS_RANK[b.status];
  if (byStatus !== 0) return byStatus;
  const [ag, av] = deadlineRank(a.dDay);
  const [bg, bv] = deadlineRank(b.dDay);
  return ag !== bg ? ag - bg : av - bv;
}

function dDayText(dDay: number | null): string {
  if (dDay === null) return '-';
  if (dDay < 0) return '마감';
  return dDay === 0 ? 'D-Day' : `D-${dDay}`;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 'YYYY-MM-DD (요일)'. 날짜 부분만 읽어서 시간대 영향 없이 요일을 구한다 */
function formatDeadlineWithWeekday(iso: string | null | undefined): string {
  const date = formatIsoDate(iso);
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return date;
  return `${date} (${WEEKDAYS[new Date(y, m - 1, d).getDay()]})`;
}

/*
 * 제출완료·포기 행은 흐리게(표와 모바일 레인 공통). muted-foreground(card 위 약 5.1:1)는 그대로 두고,
 * 주요 글자(공고명·D-Day·진행 수·메모)만 foreground 투명도로 낮춘다. 행 전체 opacity는 쓰지 않는다.
 * 라이트 기준 card 위 대비: /75 ≈ 6.7:1, /65 ≈ 4.8:1 (다크는 더 높음)
 */
const DIM_TEXT: Partial<Record<WatchlistStatus, string>> = {
  SUBMITTED: 'text-foreground/75',
  DROPPED:   'text-foreground/65',
};

/* ────────────────────────────────────────────────────────── */
/* 행 메뉴 (삭제) — 표와 목록 행이 함께 씀                           */
/* ────────────────────────────────────────────────────────── */
function RowMenu({
  item,
  onRequestDelete,
  className,
}: {
  item: WatchlistItem;
  onRequestDelete: (noticeId: number) => void;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${item.bidNtceNm} 메뉴`}
          className={cn('flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground', className, focusRing)}
        >
          <MoreHorizontal aria-hidden="true" className="size-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() => onRequestDelete(item.noticeId)}
          className="min-h-11 text-base text-destructive focus:bg-destructive-soft focus:text-destructive"
        >
          관심 공고 삭제
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ────────────────────────────────────────────────────────── */
/* lg 미만: 관심 공고 행 (레인 안의 항목)                           */
/* ────────────────────────────────────────────────────────── */
function WatchlistRow({
  item,
  onStatusChange,
  onRequestDelete,
}: {
  item: WatchlistItem;
  onStatusChange: (noticeId: number, status: WatchlistStatus) => void;
  onRequestDelete: (noticeId: number) => void;
}) {
  /* 제출완료·포기는 표와 같은 방식으로 주요 글자색만 흐리게 (DIM_TEXT) */
  const dim       = DIM_TEXT[item.status];
  const deadline  = formatIsoDate(item.bidClseDt);

  return (
    <li className="flex flex-col gap-2 bg-card px-4 py-3.5">
      {/* 공고명 + 메뉴 */}
      <div className="flex items-start justify-between gap-1">
        <Link
          href={`/notices/${item.noticeId}`}
          title={item.bidNtceNm}
          className={cn('line-clamp-2 min-w-0 flex-1 rounded-sm leading-snug font-medium wrap-anywhere hover:text-primary hover:underline', dim ?? 'text-foreground', focusRing)}
        >
          {item.bidNtceNm}
        </Link>
        <RowMenu item={item} onRequestDelete={onRequestDelete} className="-mt-2 -mr-2" />
      </div>

      <p className="truncate text-base text-muted-foreground">{item.ntceInsttNm}</p>

      {/* 마감 + 체크리스트 진행을 한 줄로 */}
      <p className="flex flex-wrap items-baseline gap-x-2 text-base">
        <span className="sr-only">마감</span>
        {dim ? (
          <span className={cn('text-base', dim)} title={deadline}>{dDayText(item.dDay)}</span>
        ) : (
          <DDayBadge dDay={item.dDay} deadline={deadline} />
        )}
        <span className="text-muted-foreground tabular-nums">{deadline}</span>
        {item.checklistTotalCount > 0 && (
          <span className={cn('ml-auto tabular-nums', dim ?? 'text-foreground')}>
            <span className="text-muted-foreground">체크리스트 </span>
            {item.checklistCheckedCount}/{item.checklistTotalCount}
            <span className="ml-1 text-muted-foreground">({item.checklistProgressRate}%)</span>
          </span>
        )}
      </p>

      {/* 메모 — 상세에서 편집. 메모가 비어 있으면 아래 상태 줄의 '메모 추가'로 대신한다 */}
      {item.memo && (
        <Link
          href={`/notices/${item.noticeId}`}
          className={cn('block rounded-sm text-base', focusRing)}
          aria-label={`메모: ${item.memo} (공고 상세에서 수정)`}
        >
          <span className={cn('block truncate', dim ?? 'text-foreground')}>{item.memo}</span>
        </Link>
      )}

      {/* 상태 변경 — 드롭다운(마우스·키보드·터치) */}
      <div className="flex items-center justify-between gap-2 border-t border-border pt-1.5">
        <StatusDropdown status={item.status} onChange={(s) => onStatusChange(item.noticeId, s)} />
        {!item.memo && (
          <Link
            href={`/notices/${item.noticeId}`}
            aria-label={`${item.bidNtceNm} 메모 추가`}
            className={cn('-mr-1 inline-flex min-h-11 items-center rounded-lg px-1 text-base text-muted-foreground underline-offset-4 hover:underline', focusRing)}
          >
            메모 추가
          </Link>
        )}
      </div>
    </li>
  );
}

/* ────────────────────────────────────────────────────────── */
/* lg 미만: 상태 레인 (제목을 눌러 접고 펼침)                        */
/* ────────────────────────────────────────────────────────── */
function StatusLane({
  status,
  items,
  total,
  hasFilter,
  hideWhenEmpty,
  onStatusChange,
  onRequestDelete,
}: {
  status: WatchlistStatus;
  items: WatchlistItem[];
  total: number;
  hasFilter: boolean;
  /** 0건 레인을 숨길지 (다른 레인에 항목이 있을 때만 숨긴다) */
  hideWhenEmpty: boolean;
  onStatusChange: (noticeId: number, status: WatchlistStatus) => void;
  onRequestDelete: (noticeId: number) => void;
}) {
  const headingId = `lane-${status}`;
  const panelId = `lane-${status}-panel`;
  const filtered = items.length !== total;
  /* 기본 펼침, 레인마다 따로 */
  const [collapsed, setCollapsed] = useState(false);
  const countText = filtered ? `${items.length} / ${total}건` : `${total}건`;
  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        'min-w-0 flex-col rounded-[10px] border border-border bg-muted/60',
        hideWhenEmpty && items.length === 0 ? 'hidden' : 'flex',
      )}
    >
      <h2 id={headingId} className="text-base font-bold text-foreground">
        {/* 제목 줄 전체가 접기/펼치기 버튼 */}
        <button
          type="button"
          aria-expanded={!collapsed}
          aria-controls={panelId}
          onClick={() => setCollapsed((v) => !v)}
          className={cn(
            'flex min-h-11 w-full items-center justify-between gap-2 rounded-[10px] px-4 py-2 text-left',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
          )}
        >
          <span>{WATCHLIST_STATUS_LABEL[status]}</span>
          <span className="flex items-center gap-1.5 font-medium text-muted-foreground tabular-nums">
            {countText}
            <ChevronDown aria-hidden="true" className={cn('size-5 transition-transform', !collapsed && 'rotate-180')} />
          </span>
        </button>
      </h2>
      <div id={panelId} className={cn(collapsed && 'hidden')}>
      {items.length === 0 ? (
        <p className="border-t border-border px-4 py-6 text-center text-base text-muted-foreground">
          {hasFilter ? '조건에 맞는 공고가 없어요' : '이 상태의 공고가 없어요'}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-b-[10px] border-t border-border">
          {items.map((item) => (
            <WatchlistRow
              key={item.watchlistItemId}
              item={item}
              onStatusChange={onStatusChange}
              onRequestDelete={onRequestDelete}
            />
          ))}
        </ul>
      )}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────── */
/* lg 이상: 관심 공고 표                                          */
/* ────────────────────────────────────────────────────────── */
const cellPad = 'px-3 py-3';

function WatchlistTableRow({
  item,
  onStatusChange,
  onRequestDelete,
}: {
  item: WatchlistItem;
  onStatusChange: (noticeId: number, status: WatchlistStatus) => void;
  onRequestDelete: (noticeId: number) => void;
}) {
  const dim = DIM_TEXT[item.status];
  const isUrgent = item.dDay !== null && item.dDay >= 0 && item.dDay <= DDAY_WARNING_THRESHOLD;
  const dDayClass = dim
    ? dim
    : isUrgent
      ? 'text-destructive'
      : item.dDay === null || item.dDay < 0
        ? 'text-muted-foreground'
        : 'text-foreground';
  const hasChecklist = item.checklistTotalCount > 0;

  return (
    <TableRow className="hover:bg-transparent">
      {/* D-Day */}
      <TableCell className={cn(cellPad, 'pl-4 font-bold tabular-nums', dDayClass)}>
        {item.dDay === null ? (
          <><span aria-hidden="true">-</span><span className="sr-only">마감일 없음</span></>
        ) : (
          dDayText(item.dDay)
        )}
      </TableCell>

      {/* 공고명 + 기관 — 이 칸만 링크 */}
      <TableHead scope="row" className={cn(cellPad, 'h-auto w-full max-w-0 font-normal')}>
        <div className="flex min-w-0 items-center gap-1.5">
          <Link
            href={`/notices/${item.noticeId}`}
            title={item.bidNtceNm}
            className={cn(
              'min-w-0 truncate rounded-sm font-medium hover:text-primary hover:underline',
              dim ?? 'text-foreground',
              focusRing,
            )}
          >
            {item.bidNtceNm}
          </Link>
          {item.memo && (
            /* xl 미만은 메모 열이 없어서 표시만 남긴다 */
            <span
              role="img"
              aria-label="메모 있음"
              title={`메모: ${item.memo}`}
              className="shrink-0 text-muted-foreground xl:hidden"
            >
              <StickyNote aria-hidden="true" className="size-4" />
            </span>
          )}
        </div>
        <p className="truncate text-muted-foreground">{item.ntceInsttNm}</p>
      </TableHead>

      {/* 마감일 */}
      <TableCell className={cn(cellPad, 'text-muted-foreground tabular-nums')}>
        {formatDeadlineWithWeekday(item.bidClseDt)}
      </TableCell>

      {/* 체크리스트 */}
      <TableCell className={cellPad}>
        {hasChecklist ? (
          <div className="flex items-center gap-2.5">
            <div
              role="progressbar"
              aria-label="체크리스트 진행률"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={item.checklistProgressRate}
              aria-valuetext={`${item.checklistTotalCount}개 중 ${item.checklistCheckedCount}개 완료 (${item.checklistProgressRate}%)`}
              className="h-1.5 w-20 overflow-hidden rounded-full bg-muted"
            >
              <div
                className={cn('h-full rounded-full transition-all duration-300', dim ? 'bg-primary/50' : 'bg-primary')}
                style={{ width: `${item.checklistProgressRate}%` }}
              />
            </div>
            <span aria-hidden="true" className={cn('tabular-nums', dim ?? 'text-foreground')}>
              {item.checklistCheckedCount}/{item.checklistTotalCount}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">
            <span aria-hidden="true">-</span><span className="sr-only">체크리스트 없음</span>
          </span>
        )}
      </TableCell>

      {/* 상태 */}
      <TableCell className={cellPad}>
        <StatusDropdown status={item.status} onChange={(s) => onStatusChange(item.noticeId, s)} />
      </TableCell>

      {/* 메모 — xl 이상 */}
      <TableCell className={cn(cellPad, 'hidden xl:table-cell')}>
        {item.memo ? (
          <Link
            href={`/notices/${item.noticeId}`}
            aria-label={`메모: ${item.memo} (공고 상세에서 수정)`}
            title={item.memo}
            className={cn('flex min-h-11 w-52 items-center rounded-sm', focusRing)}
          >
            <span className={cn('truncate', dim ?? 'text-foreground')}>{item.memo}</span>
          </Link>
        ) : (
          <Link
            href={`/notices/${item.noticeId}`}
            aria-label={`${item.bidNtceNm} 메모 추가`}
            className={cn('inline-flex min-h-11 items-center rounded-sm text-muted-foreground underline-offset-4 hover:underline', focusRing)}
          >
            메모 추가
          </Link>
        )}
      </TableCell>

      {/* 메뉴 */}
      <TableCell className={cn(cellPad, 'pr-2')}>
        <RowMenu item={item} onRequestDelete={onRequestDelete} />
      </TableCell>
    </TableRow>
  );
}

function WatchlistTableHeader() {
  const head = 'h-12 px-3 text-base font-medium text-foreground';
  return (
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        <TableHead scope="col" className={cn(head, 'w-24 pl-4')}>D-Day</TableHead>
        <TableHead scope="col" className={head}>공고명</TableHead>
        <TableHead scope="col" className={cn(head, 'w-40')}>마감일</TableHead>
        <TableHead scope="col" className={cn(head, 'w-40')}>체크리스트</TableHead>
        <TableHead scope="col" className={cn(head, 'w-36')}>상태</TableHead>
        <TableHead scope="col" className={cn(head, 'hidden w-56 xl:table-cell')}>메모</TableHead>
        <TableHead scope="col" className={cn(head, 'w-14 pr-2')}><span className="sr-only">메뉴</span></TableHead>
      </TableRow>
    </TableHeader>
  );
}

function WatchlistTable({
  rows,
  onStatusChange,
  onRequestDelete,
}: {
  rows: WatchlistItem[];
  onStatusChange: (noticeId: number, status: WatchlistStatus) => void;
  onRequestDelete: (noticeId: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-card">
      <Table>
        <TableCaption className="sr-only">
          관심 공고 목록. 마감이 가까운 순이며 제출완료와 포기 공고는 아래에 있습니다.
        </TableCaption>
        <WatchlistTableHeader />
        <TableBody>
          {rows.map((item) => (
            <WatchlistTableRow
              key={item.watchlistItemId}
              item={item}
              onStatusChange={onStatusChange}
              onRequestDelete={onRequestDelete}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* 스켈레톤 — lg 미만은 레인, lg 이상은 표 모양                      */
/* ────────────────────────────────────────────────────────── */
function LanesSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-4 lg:hidden">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex flex-col gap-px overflow-hidden rounded-[10px] border border-border bg-border">
          <div className="bg-muted px-4 py-3.5"><Skeleton className="h-5 w-20" /></div>
          {[1, 2].map((j) => (
            <div key={j} className="flex flex-col gap-2 bg-card px-4 py-3.5">
              <Skeleton className="h-5 w-11/12" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div aria-hidden="true" className="hidden overflow-hidden rounded-[10px] border border-border bg-card lg:block">
      <div className="flex h-12 items-center gap-6 border-b border-border px-4">
        <Skeleton className="h-4 w-12 shrink-0" />
        <div className="flex-1"><Skeleton className="h-4 w-16" /></div>
        <Skeleton className="h-4 w-32 shrink-0" />
        <Skeleton className="h-4 w-28 shrink-0" />
        <Skeleton className="h-4 w-24 shrink-0" />
        <Skeleton className="hidden h-4 w-40 shrink-0 xl:block" />
        <div className="size-8 shrink-0" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex h-[72px] items-center gap-6 border-b border-border px-4 last:border-b-0">
          <Skeleton className="h-5 w-12 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <Skeleton className="h-5 w-32 shrink-0" />
          <Skeleton className="h-2 w-28 shrink-0" />
          <Skeleton className="h-7 w-24 shrink-0" />
          <Skeleton className="hidden h-5 w-40 shrink-0 xl:block" />
          <Skeleton className="size-8 shrink-0" />
        </div>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <>
      <LanesSkeleton />
      <TableSkeleton />
    </>
  );
}

function PageTitle() {
  return (
    <div>
      <h1 className="text-[26px] font-bold tracking-tight text-foreground lg:text-[32px]">관심 공고</h1>
      <p className="mt-1 text-base text-muted-foreground">저장한 공고를 진행 상태별로 관리하세요.</p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Page                                                        */
/* ────────────────────────────────────────────────────────── */
function WatchlistContent() {
  useRequireAuth();
  const searchParams = useSearchParams();
  const isLoggedIn = useSyncExternalStore(subscribeAuthChange, getIsLoggedInSnapshot, getIsLoggedInServerSnapshot);

  const [items, setItems]                   = useState<WatchlistItem[]>([]);
  const [loading, setLoading]               = useState(true);
  const [fetchError, setFetchError]         = useState(false);
  const [activeTab, setActiveTab]           = useState<TabKey>('all');
  const [dueWithin, setDueWithin]           = useState<DueWithin>('all');
  const [dueFrom, setDueFrom]               = useState<number | null>(null);
  const [activeOnly, setActiveOnly]         = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  async function load() {
    /* 비로그인이면 호출하지 않음 (useRequireAuth가 /login으로 이동) */
    if (!localStorage.getItem(ACCESS_TOKEN_KEY)) return;
    setLoading(true);
    setFetchError(false);
    try {
      const data = await getWatchlist();
      setItems(data);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  /* URL 쿼리 파라미터로 초기 탭/필터 설정 — 마운트 시 1회만 읽음 */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveTab(parseStatusParam(searchParams.get('status')));
    setDueWithin(parseDueWithin(searchParams.get('dueWithin')));
    setDueFrom(parseDueFrom(searchParams.get('dueFrom')));
    setActiveOnly(parseActiveOnly(searchParams.get('active')));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 상태별 전체 건수 — dueWithin과 무관 */
  const tabCounts = useMemo(() => ({
    all:       items.length,
    reviewing: items.filter((n) => n.status === 'REVIEWING').length,
    preparing: items.filter((n) => n.status === 'PREPARING').length,
    submitted: items.filter((n) => n.status === 'SUBMITTED').length,
    dropped:   items.filter((n) => n.status === 'DROPPED').length,
  }), [items]);

  /* 마감 기준 필터(하한 dueFrom ~ 상한 dueWithin) + 상태 조건 + 마감일순 정렬 — 레인과 표가 함께 쓴다 */
  const filteredItems = useMemo(() => {
    let list = [...items];

    if (dueWithin !== 'all' || dueFrom !== null) {
      /* 하한 기본값 0 — 이미 마감된 공고(dDay < 0)는 제외. 상한이 없으면 하한만 적용 */
      const min = dueFrom ?? 0;
      const max = dueWithin === 'all' ? Infinity : Number(dueWithin);
      list = list.filter((n) => n.dDay !== null && n.dDay >= min && n.dDay <= max);
    }

    if (activeOnly) {
      list = list.filter((n) => ACTIVE_STATUSES.includes(n.status));
    }

    list.sort((a, b) => {
      if (a.dDay === null && b.dDay === null) return 0;
      if (a.dDay === null) return 1;
      if (b.dDay === null) return -1;
      return a.dDay - b.dDay;
    });
    return list;
  }, [items, dueWithin, dueFrom, activeOnly]);

  /* lg 미만 레인용 상태별 그룹 */
  const itemsByStatus = useMemo(() => {
    const groups: Record<WatchlistStatus, WatchlistItem[]> = { REVIEWING: [], PREPARING: [], SUBMITTED: [], DROPPED: [] };
    filteredItems.forEach((n) => groups[n.status]?.push(n));
    return groups;
  }, [filteredItems]);

  /* 보이는 상태 — 전체 보기에서 '검토중·준비중만'이면 해당 두 상태만 */
  const lanes = useMemo(
    () => activeTab === 'all'
      ? LANE_ORDER.filter((l) => !activeOnly || ACTIVE_STATUSES.includes(l.status))
      : LANE_ORDER.filter((l) => l.tab === activeTab),
    [activeTab, activeOnly],
  );

  /* lg 이상 표 행 — 보이는 상태만, 진행 중 → 제출완료 → 포기, 그 안에서 마감 임박순 */
  const tableRows = useMemo(() => {
    const visible = new Set(lanes.map((l) => l.status));
    return filteredItems.filter((n) => visible.has(n.status)).sort(compareForTable);
  }, [filteredItems, lanes]);
  const visibleCount = tableRows.length;

  /* 상태 변경 — 낙관적 업데이트, 실패 시 원복 */
  async function handleStatusChange(noticeId: number, status: WatchlistStatus) {
    const prevItems = items;
    setItems((prev) =>
      prev.map((n) => (n.noticeId === noticeId ? { ...n, status } : n))
    );
    try {
      await updateWatchlistStatus(noticeId, status);
    } catch {
      setItems(prevItems);
    }
  }

  /* 삭제 */
  async function handleDelete() {
    if (deleteTargetId === null) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    setItems((prev) => prev.filter((n) => n.noticeId !== id));
    try {
      await deleteWatchlist(id);
    } catch {
      load();
    }
  }

  const deleteTarget = items.find((n) => n.noticeId === deleteTargetId);

  const hasFilter = dueWithin !== 'all' || dueFrom !== null || activeOnly;
  const rangeMin = dueFrom ?? 0;
  const rangeText =
    dueWithin === 'all' && dueFrom === null
      ? null
      : dueWithin === 'all'
        ? `${rangeMin === 0 ? 'D-Day' : `D-${rangeMin}`} 이후 마감`
        : `${rangeMin === 0 ? 'D-Day' : `D-${rangeMin}`}~D-${dueWithin} 마감`;
  const filterText = [rangeText, activeOnly ? '검토중·준비중' : null].filter(Boolean).join(' · ');

  function handleTabChange(key: TabKey) {
    setActiveTab(key);
    /* 제출완료·포기를 직접 고르면 '검토중·준비중만' 조건은 해제 */
    if (key === 'submitted' || key === 'dropped') setActiveOnly(false);
  }

  function handleDueWithinChange(v: DueWithin) {
    /* 직접 기간을 고르면 링크로 들어온 하한(dueFrom)은 해제 — 오늘부터 N일 이내 */
    setDueWithin(v);
    setDueFrom(null);
  }

  function clearFilters() {
    setDueWithin('all');
    setDueFrom(null);
    setActiveOnly(false);
  }

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'all', label: '전체', count: tabCounts.all },
    ...LANE_ORDER.map((l) => ({ key: l.tab, label: WATCHLIST_STATUS_LABEL[l.status], count: tabCounts[l.tab] })),
  ];

  const requestDelete = (id: number) => setDeleteTargetId(id);

  /* ── Render ── */
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col gap-6">
        <PageTitle />
        <div className="flex flex-col items-center gap-2 rounded-[10px] border border-border bg-card px-4 py-16 text-center">
          <p className="text-lg font-medium text-foreground">로그인이 필요해요</p>
          <p className="text-base text-muted-foreground">관심 공고는 로그인한 뒤 확인할 수 있어요.</p>
          <Button asChild className={cn(controlHeight, 'mt-3 px-5')}>
            <Link href="/login">로그인하러 가기</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col gap-6">
        <PageTitle />
        <ResultsError onRetry={load} />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageTitle />

      {/* 보기(상태) + 마감 기준 */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div role="group" aria-label="진행 상태로 보기" className="flex flex-wrap gap-2">
          {tabs.map(({ key, label, count }) => {
            const pressed = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={pressed}
                onClick={() => handleTabChange(key)}
                className={cn(
                  'inline-flex h-11 items-center gap-1.5 rounded-full border px-4 text-base whitespace-nowrap transition-colors',
                  pressed
                    ? 'border-primary bg-primary font-medium text-primary-foreground'
                    : 'border-border bg-card text-foreground hover:bg-accent',
                  focusRing,
                )}
              >
                {label}
                <span className={cn('tabular-nums', pressed ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                  {loading ? '' : count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="watchlist-due" className="text-base text-muted-foreground">마감</label>
          <Select value={dueWithin} onValueChange={(v) => handleDueWithinChange(v as DueWithin)}>
            <SelectTrigger id="watchlist-due" className={cn(controlHeight, 'w-36 bg-card')}><SelectValue /></SelectTrigger>
            <SelectContent position="popper" align="end">
              <SelectItem value="all" className="text-base">전체 기간</SelectItem>
              <SelectItem value="3" className="text-base">3일 이내</SelectItem>
              <SelectItem value="7" className="text-base">7일 이내</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 목록 — lg 미만은 상태 레인, lg 이상은 표 */}
      {loading ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[10px] border border-border bg-card px-4 py-16 text-center">
          <p className="text-lg font-medium text-foreground">저장한 공고가 없어요</p>
          <p className="text-base text-muted-foreground">공고를 찾아서 관심 공고에 추가해 보세요.</p>
          <Button asChild className={cn(controlHeight, 'mt-3 px-5')}>
            <Link href="/notices">공고 찾기</Link>
          </Button>
        </div>
      ) : (
        <>
          {hasFilter && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p aria-live="polite" className="text-base text-muted-foreground">
                {filterText} 공고 <span className="font-medium text-foreground tabular-nums">{visibleCount}건</span>
                {rangeText && ' (이미 마감된 공고 제외)'}
              </p>
              <Button
                type="button"
                variant="ghost"
                onClick={clearFilters}
                className={cn(controlHeight, 'px-2 text-muted-foreground underline underline-offset-4 hover:text-foreground')}
              >
                조건 해제
              </Button>
            </div>
          )}

          {/* lg 미만: 상태 레인 (display:none이라 lg 이상에서는 스크린리더에도 노출되지 않음) */}
          <div className="grid items-start gap-4 lg:hidden">
            {lanes.map(({ status, tab }) => (
              <StatusLane
                key={status}
                status={status}
                items={itemsByStatus[status]}
                total={tabCounts[tab]}
                hasFilter={hasFilter}
                hideWhenEmpty={lanes.length > 1 && visibleCount > 0}
                onStatusChange={handleStatusChange}
                onRequestDelete={requestDelete}
              />
            ))}
          </div>

          {/* lg 이상: 하나의 표 */}
          <div className="hidden lg:block">
            {visibleCount === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-[10px] border border-border bg-card px-4 py-16 text-center">
                <p className="text-lg font-medium text-foreground">
                  {hasFilter
                    ? '조건에 맞는 공고가 없어요'
                    : `${lanes.length === 1 ? WATCHLIST_STATUS_LABEL[lanes[0].status] : '이'} 상태의 공고가 없어요`}
                </p>
                {hasFilter && (
                  <>
                    <p className="text-base text-muted-foreground">마감 기간이나 상태 조건을 해제하면 다른 공고를 볼 수 있어요.</p>
                    <Button type="button" variant="outline" onClick={clearFilters} className={cn(controlHeight, 'mt-3 px-5')}>
                      조건 해제
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <WatchlistTable rows={tableRows} onStatusChange={handleStatusChange} onRequestDelete={requestDelete} />
            )}
          </div>
        </>
      )}

      {/* 삭제 확인 모달 */}
      <Dialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-lg">관심 공고에서 제거하시겠어요?</DialogTitle>
            <DialogDescription className="text-base">
              {deleteTarget && (
                <span className="font-medium wrap-anywhere text-foreground">{deleteTarget.bidNtceNm}</span>
              )}
              <br />
              제거하면 저장된 메모와 상태 정보가 모두 삭제됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTargetId(null)} className={cn(controlHeight, 'px-5')}>
              취소
            </Button>
            <Button
              onClick={handleDelete}
              className={cn(controlHeight, 'bg-destructive px-5 text-primary-foreground hover:bg-destructive/90')}
            >
              제거
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WatchlistSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <PageTitle />
      <ListSkeleton />
    </div>
  );
}

export default function WatchlistPage() {
  return (
    <Suspense fallback={<WatchlistSkeleton />}>
      <WatchlistContent />
    </Suspense>
  );
}
