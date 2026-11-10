'use client';

import Link from 'next/link';
import { AlertCircle, SearchX, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn, computeDDay, formatIsoDate, formatWon, bidTypeToKorean } from '@/lib/utils';
import { splitSucsfbidMthdNm } from '@/lib/notice';
import type { NoticeListItem } from '@/types/notice';

/* ────────────────────────────────────────────────────────── */
/* 공통 표시 조각                                               */
/* ────────────────────────────────────────────────────────── */
function noticeNumber(notice: NoticeListItem): string {
  return notice.bidNtceOrd ? `${notice.bidNtceNo}-${notice.bidNtceOrd}` : notice.bidNtceNo;
}

function agencyName(notice: NoticeListItem): string {
  return notice.dminsttNm || notice.ntceInsttNm;
}

/** 마감 D-Day 텍스트. 마감 임박(D-Day~D-3)은 위험 토큰 색 + 굵게, 마감 지난 공고는 보조색. 색만으로 구분하지 않도록 라벨 항상 동반. */
function DeadlineLabel({ bidClseDt }: { bidClseDt: string | null }) {
  if (!bidClseDt) return <span className="text-muted-foreground">-</span>;
  const dDay = computeDDay(bidClseDt);
  const label = dDay < 0 ? '마감' : dDay === 0 ? 'D-Day' : `D-${dDay}`;
  return (
    <span
      className={cn(
        'tabular-nums',
        dDay < 0
          ? 'text-muted-foreground'
          : dDay <= 3
            ? 'font-bold text-destructive'
            : dDay <= 7
              ? 'font-semibold text-foreground'
              : 'text-foreground',
      )}
    >
      {label}
    </span>
  );
}

function BidTypeTag({ type }: { type: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-md border border-border px-1.5 text-base leading-6 whitespace-nowrap text-muted-foreground">
      {bidTypeToKorean(type)}
    </span>
  );
}

function BookmarkButton({
  notice,
  saved,
  onToggle,
}: {
  notice: NoticeListItem;
  saved: boolean;
  onToggle: (notice: NoticeListItem) => void;
}) {
  const label = saved ? `관심 공고 해제: ${notice.bidNtceNm}` : `관심 공고에 추가: ${notice.bidNtceNm}`;
  return (
    <button
      type="button"
      onClick={() => onToggle(notice)}
      aria-pressed={saved}
      aria-label={label}
      title={saved ? '관심 공고 해제' : '관심 공고에 추가'}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Star
        aria-hidden="true"
        strokeWidth={1.8}
        className={cn('size-5', saved ? 'fill-primary text-primary' : 'text-muted-foreground')}
      />
    </button>
  );
}

function SucsfbidMethod({ value }: { value: string | null }) {
  const primary = splitSucsfbidMthdNm(value).primary;
  if (!value || !primary) return <span className="text-muted-foreground">-</span>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* 키보드 사용자도 전체 낙찰방법을 볼 수 있도록 포커스 가능 */}
        <span
          tabIndex={0}
          className="block truncate rounded-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {primary}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-base">
        {value}
      </TooltipContent>
    </Tooltip>
  );
}

/* ────────────────────────────────────────────────────────── */
/* 데스크톱 비교 표 (lg 이상)                                    */
/* ────────────────────────────────────────────────────────── */
function TableColumns() {
  return (
    <colgroup>
      <col />
      <col className="w-[180px]" />
      <col className="w-[150px]" />
      <col className="hidden w-[116px] xl:table-column" />
      <col className="w-[124px]" />
      <col className="w-[128px]" />
      <col className="w-[68px]" />
    </colgroup>
  );
}

function TableHead() {
  return (
    <thead>
      <tr className="border-b border-border bg-muted text-left text-base text-muted-foreground">
        <th scope="col" className="px-5 py-3 font-medium">공고명</th>
        <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">수요기관</th>
        <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">낙찰방법</th>
        <th scope="col" className="hidden px-4 py-3 font-medium whitespace-nowrap xl:table-cell">게시일</th>
        <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">마감</th>
        <th scope="col" className="px-4 py-3 text-right font-medium whitespace-nowrap">금액</th>
        <th scope="col" className="px-2 py-3 text-center font-medium whitespace-nowrap">
          <span className="sr-only">관심 공고</span>
          <Star aria-hidden="true" className="mx-auto size-4" strokeWidth={1.8} />
        </th>
      </tr>
    </thead>
  );
}

function ResultTable({
  results,
  bookmarked,
  onToggleBookmark,
}: {
  results: NoticeListItem[];
  bookmarked: Set<number>;
  onToggleBookmark: (notice: NoticeListItem) => void;
}) {
  return (
    <div className="hidden overflow-hidden rounded-[10px] border border-border bg-card lg:block">
      <table className="w-full table-fixed text-base">
        <caption className="sr-only">공고 검색 결과</caption>
        <TableColumns />
        <TableHead />
        <tbody>
          {results.map((notice) => (
            <tr key={notice.id} className="border-t border-border first:border-t-0 transition-colors hover:bg-accent/50">
              <td className="min-w-0 px-5 py-3 align-middle">
                <Link
                  href={`/notices/${notice.id}`}
                  title={notice.bidNtceNm}
                  className="block truncate rounded-sm font-medium text-foreground hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {notice.bidNtceNm}
                </Link>
                <div className="mt-1 flex min-w-0 items-center gap-2">
                  <BidTypeTag type={notice.bidType} />
                  <span className="truncate text-muted-foreground tabular-nums">{noticeNumber(notice)}</span>
                </div>
              </td>
              <td className="px-4 py-3 align-middle text-foreground">
                <span className="block truncate" title={agencyName(notice)}>{agencyName(notice)}</span>
              </td>
              <td className="px-4 py-3 align-middle">
                <SucsfbidMethod value={notice.sucsfbidMthdNm} />
              </td>
              <td className="hidden px-4 py-3 align-middle whitespace-nowrap text-muted-foreground tabular-nums xl:table-cell">
                {notice.bidNtceDt ? formatIsoDate(notice.bidNtceDt) : '-'}
              </td>
              <td className="px-4 py-3 align-middle whitespace-nowrap">
                <DeadlineLabel bidClseDt={notice.bidClseDt} />
                <p className="text-muted-foreground tabular-nums">{formatIsoDate(notice.bidClseDt)}</p>
              </td>
              <td className="px-4 py-3 text-right align-middle whitespace-nowrap text-foreground tabular-nums">
                {formatWon(notice.bdgtAmt)}
              </td>
              <td className="px-2 py-2 text-center align-middle">
                <BookmarkButton notice={notice} saved={bookmarked.has(notice.id)} onToggle={onToggleBookmark} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* 모바일/태블릿 목록 행 (lg 미만) — 카드가 아닌 구분선 목록          */
/* ────────────────────────────────────────────────────────── */
function ResultList({
  results,
  bookmarked,
  onToggleBookmark,
}: {
  results: NoticeListItem[];
  bookmarked: Set<number>;
  onToggleBookmark: (notice: NoticeListItem) => void;
}) {
  return (
    <ul aria-label="공고 검색 결과" className="divide-y divide-border border-y border-border lg:hidden">
      {results.map((notice) => (
        <li key={notice.id} className="flex min-w-0 gap-2 py-4">
          <div className="min-w-0 flex-1">
            <Link
              href={`/notices/${notice.id}`}
              title={notice.bidNtceNm}
              className="line-clamp-2 rounded-sm font-medium wrap-anywhere text-foreground hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {notice.bidNtceNm}
            </Link>
            <div className="mt-1 flex min-w-0 items-center gap-2 text-muted-foreground">
              <BidTypeTag type={notice.bidType} />
              <span className="truncate">{agencyName(notice)}</span>
            </div>
            <div className="mt-1 flex min-w-0 items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-baseline gap-2 whitespace-nowrap">
                <DeadlineLabel bidClseDt={notice.bidClseDt} />
                <span className="text-muted-foreground tabular-nums">{formatIsoDate(notice.bidClseDt)}</span>
              </span>
              <span className="shrink-0 text-right text-foreground tabular-nums">{formatWon(notice.bdgtAmt)}</span>
            </div>
          </div>
          <BookmarkButton notice={notice} saved={bookmarked.has(notice.id)} onToggle={onToggleBookmark} />
        </li>
      ))}
    </ul>
  );
}

/* ────────────────────────────────────────────────────────── */
/* 상태별 화면                                                  */
/* ────────────────────────────────────────────────────────── */
export function ResultsSkeleton() {
  const rows = Array.from({ length: 5 });
  return (
    <div aria-hidden="true">
      <div className="hidden overflow-hidden rounded-[10px] border border-border bg-card lg:block">
        <table className="w-full table-fixed text-base">
          <TableColumns />
          <TableHead />
          <tbody>
            {rows.map((_, i) => (
              <tr key={i} className="h-[72px] border-t border-border first:border-t-0">
                <td className="px-5 py-3"><Skeleton className="mb-2 h-5 w-3/4" /><Skeleton className="h-5 w-1/3" /></td>
                <td className="px-4 py-3"><Skeleton className="h-5 w-28" /></td>
                <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                <td className="hidden px-4 py-3 xl:table-cell"><Skeleton className="h-5 w-20" /></td>
                <td className="px-4 py-3"><Skeleton className="mb-2 h-5 w-12" /><Skeleton className="h-5 w-20" /></td>
                <td className="px-4 py-3"><Skeleton className="ml-auto h-5 w-20" /></td>
                <td className="px-2 py-3"><Skeleton className="mx-auto size-6 rounded-md" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-border border-y border-border lg:hidden">
        {rows.map((_, i) => (
          <li key={i} className="py-4">
            <Skeleton className="mb-2 h-5 w-11/12" />
            <Skeleton className="mb-2 h-5 w-1/2" />
            <Skeleton className="h-5 w-2/3" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ResultsEmpty({ onReset }: { onReset?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[10px] border border-border bg-card px-4 py-16 text-center">
      <SearchX aria-hidden="true" className="mb-1 size-10 text-muted-foreground" strokeWidth={1.5} />
      <p className="text-lg font-medium text-foreground">조건에 맞는 공고가 없어요</p>
      <p className="text-base text-muted-foreground">다른 검색어를 입력하거나 조건을 줄여 보세요.</p>
      {onReset && (
        <Button variant="outline" onClick={onReset} className="mt-3 h-11 px-5 text-base">
          조건 초기화
        </Button>
      )}
    </div>
  );
}

export function ResultsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-2 rounded-[10px] border border-border bg-card px-4 py-16 text-center"
    >
      <AlertCircle aria-hidden="true" className="mb-1 size-10 text-destructive" strokeWidth={1.5} />
      <p className="text-lg font-medium text-foreground">공고를 불러오지 못했어요</p>
      <p className="text-base text-muted-foreground">잠시 후 다시 시도해 주세요.</p>
      <Button variant="outline" onClick={onRetry} className="mt-3 h-11 px-5 text-base">
        다시 시도
      </Button>
    </div>
  );
}

export function NoticeResults(props: {
  results: NoticeListItem[];
  bookmarked: Set<number>;
  onToggleBookmark: (notice: NoticeListItem) => void;
}) {
  return (
    <>
      <ResultTable {...props} />
      <ResultList {...props} />
    </>
  );
}

/* ────────────────────────────────────────────────────────── */
/* 페이지네이션                                                  */
/* ────────────────────────────────────────────────────────── */
export function NoticePagination({
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

  const base = 'h-11 min-w-11 px-3 text-base tabular-nums';

  return (
    <nav aria-label="검색 결과 페이지" className="flex flex-wrap items-center justify-center gap-1 pt-6">
      <Button variant="outline" onClick={() => onChange(current - 1)} disabled={current === 0} className={base}>
        이전
      </Button>
      {items.map((item, idx) =>
        item === 'ellipsis' ? (
          <span key={`el-${idx}`} aria-hidden="true" className="hidden px-1 text-base text-muted-foreground select-none sm:inline">…</span>
        ) : (
          <Button
            key={item}
            variant={item === current ? 'default' : 'ghost'}
            onClick={() => onChange(item)}
            aria-current={item === current ? 'page' : undefined}
            aria-label={`${item + 1}페이지`}
            className={cn(base, 'hidden sm:inline-flex')}
          >
            {item + 1}
          </Button>
        ),
      )}
      <span className="px-3 text-base text-foreground tabular-nums sm:hidden">
        <span className="sr-only">현재 페이지 </span>
        {current + 1} / {total}
      </span>
      <Button variant="outline" onClick={() => onChange(current + 1)} disabled={current === total - 1} className={base}>
        다음
      </Button>
    </nav>
  );
}
