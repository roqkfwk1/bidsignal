'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { DDayBadge } from '@/components/common/DDayBadge';
import { StatusDropdown } from '@/components/common/StatusDropdown';
import { EmptyState } from '@/components/common/EmptyState';
import { ApiErrorState } from '@/components/common/ApiErrorState';
import { getWatchlist, deleteWatchlist, updateWatchlistStatus } from '@/lib/api/watchlist';
import { formatIsoDate } from '@/lib/utils';
import type { WatchlistItem, WatchlistStatus } from '@/types/notice';
import { cn } from '@/lib/utils';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';

/* ────────────────────────────────────────────────────────── */
/* Types & constants                                           */
/* ────────────────────────────────────────────────────────── */
type TabKey    = 'all' | 'reviewing' | 'preparing' | 'submitted' | 'dropped';
type SortKey   = 'deadline' | 'status';
type DueWithin = 'all' | '3' | '7';

/* 탭 키 → WatchlistStatus 매핑 */
const STATUS_FILTER: Record<Exclude<TabKey, 'all'>, WatchlistStatus> = {
  reviewing: 'REVIEWING',
  preparing: 'PREPARING',
  submitted: 'SUBMITTED',
  dropped:   'DROPPED',
};

const STATUS_ORDER: Record<WatchlistStatus, number> = {
  REVIEWING: 0,
  PREPARING: 1,
  SUBMITTED: 2,
  DROPPED:   3,
};

function parseStatusParam(raw: string | null): TabKey {
  const valid: TabKey[] = ['all', 'reviewing', 'preparing', 'submitted', 'dropped'];
  return valid.includes(raw as TabKey) ? (raw as TabKey) : 'all';
}

function parseDueWithin(raw: string | null): DueWithin {
  if (raw === '3' || raw === '7') return raw;
  return 'all';
}

/* ────────────────────────────────────────────────────────── */
/* NoticeCard                                                  */
/* ────────────────────────────────────────────────────────── */
function NoticeCard({
  item,
  onStatusChange,
  onRequestDelete,
}: {
  item: WatchlistItem;
  onStatusChange: (noticeId: number, status: WatchlistStatus) => void;
  onRequestDelete: (noticeId: number) => void;
}) {
  const isDropped = item.status === 'DROPPED';
  const deadline  = formatIsoDate(item.bidClseDt);

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 transition-opacity',
        isDropped && 'opacity-50'
      )}
    >
      {/* ── 공고명 + ... 메뉴 ── */}
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/notices/${item.noticeId}`}
          className="flex-1 min-w-0 font-medium text-base text-gray-900 hover:text-blue-600 transition-colors leading-snug line-clamp-2"
          title={item.bidNtceNm}
        >
          {item.bidNtceNm}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="공고 메뉴"
              className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => onRequestDelete(item.noticeId)}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              관심 공고 삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── 수요기관 ── */}
      <p className="text-sm text-gray-500 truncate">{item.ntceInsttNm}</p>

      {/* ── D-day + 마감일 ── */}
      <div className="flex items-center gap-2">
        <DDayBadge dDay={item.dDay} deadline={deadline} />
        <span className="text-sm text-gray-400">{deadline}</span>
      </div>

      {/* ── 체크리스트 진행률 ── */}
      {item.checklistTotalCount > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              체크리스트 {item.checklistCheckedCount}/{item.checklistTotalCount}
            </span>
            <span className="text-sm text-gray-500">({item.checklistProgressRate}%)</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${item.checklistProgressRate}%` }}
            />
          </div>
        </div>
      )}

      {/* ── 메모 ── */}
      <Link href={`/notices/${item.noticeId}`} className="block min-h-[20px]">
        {item.memo ? (
          <p className="text-sm text-gray-600 truncate">{item.memo}</p>
        ) : (
          <p className="text-sm text-gray-400">메모 추가</p>
        )}
      </Link>

      {/* ── 상태 드롭다운 ── */}
      <div className="pt-2 border-t border-gray-100">
        <StatusDropdown
          status={item.status}
          onChange={(s) => onStatusChange(item.noticeId, s)}
        />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Page                                                        */
/* ────────────────────────────────────────────────────────── */
export default function WatchlistPage() {
  useRequireAuth();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems]                   = useState<WatchlistItem[]>([]);
  const [loading, setLoading]               = useState(true);
  const [fetchError, setFetchError]         = useState(false);
  const [activeTab, setActiveTab]           = useState<TabKey>('all');
  const [dueWithin, setDueWithin]           = useState<DueWithin>('all');
  const [sort, setSort]                     = useState<SortKey>('deadline');
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  async function load() {
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
    const due = parseDueWithin(searchParams.get('dueWithin'));
    setDueWithin(due);
    if (due !== 'all') setSort('deadline');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 탭별 카운트 — dueWithin과 무관하게 전체 기준 */
  const tabCounts = useMemo(() => ({
    all:       items.length,
    reviewing: items.filter((n) => n.status === 'REVIEWING').length,
    preparing: items.filter((n) => n.status === 'PREPARING').length,
    submitted: items.filter((n) => n.status === 'SUBMITTED').length,
    dropped:   items.filter((n) => n.status === 'DROPPED').length,
  }), [items]);

  /* 상태 탭 필터링 + 마감 기준 필터링 + 정렬 */
  const sortedItems = useMemo<WatchlistItem[]>(() => {
    let list = [...items];

    // 1. 상태 탭 필터
    if (activeTab !== 'all') {
      list = list.filter((n) => n.status === STATUS_FILTER[activeTab]);
    }

    // 2. 마감 기준 필터 (탭과 독립적으로 조합)
    if (dueWithin !== 'all') {
      const days = Number(dueWithin);
      list = list.filter((n) => n.dDay !== null && n.dDay <= days);
    }

    const compareFn = (a: WatchlistItem, b: WatchlistItem): number => {
      if (sort === 'status') return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (a.dDay === null && b.dDay === null) return 0;
      if (a.dDay === null) return 1;
      if (b.dDay === null) return -1;
      return a.dDay - b.dDay;
    };

    // 전체 탭에서만 DROPPED를 최하단으로
    if (activeTab === 'all') {
      const active  = list.filter((n) => n.status !== 'DROPPED');
      const dropped = list.filter((n) => n.status === 'DROPPED');
      return [...active.sort(compareFn), ...dropped.sort(compareFn)];
    }

    return list.sort(compareFn);
  }, [items, activeTab, dueWithin, sort]);

  /* 상태 변경 — 낙관적 업데이트 */
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

  /* ── Render ── */
  if (fetchError) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">관심 공고</h1>
          <p className="text-gray-500 mt-1 text-base">저장한 공고를 한눈에 확인하세요.</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200">
          <ApiErrorState message="공고 정보를 불러올 수 없어요." onRetry={load} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 섹션 1: 페이지 제목 + 마감 기준 드롭다운 + 정렬 */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">관심 공고</h1>
          <p className="text-gray-500 mt-1 text-base">저장한 공고를 한눈에 확인하세요.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dueWithin} onValueChange={(v) => setDueWithin(v as DueWithin)}>
            <SelectTrigger className="w-32 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="all">전체 기간</SelectItem>
              <SelectItem value="3">3일 이내</SelectItem>
              <SelectItem value="7">7일 이내</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-36 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="deadline">마감일 임박순</SelectItem>
              <SelectItem value="status">상태순</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 섹션 2: 상태 탭 (WatchlistStatus 기준) */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
        <TabsList className="h-10 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="all"       className="text-base px-5 rounded-md">전체 {tabCounts.all}</TabsTrigger>
          <TabsTrigger value="reviewing" className="text-base px-5 rounded-md">검토중 {tabCounts.reviewing}</TabsTrigger>
          <TabsTrigger value="preparing" className="text-base px-5 rounded-md">준비중 {tabCounts.preparing}</TabsTrigger>
          <TabsTrigger value="submitted" className="text-base px-5 rounded-md">제출완료 {tabCounts.submitted}</TabsTrigger>
          <TabsTrigger value="dropped"   className="text-base px-5 rounded-md">포기 {tabCounts.dropped}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 섹션 3: 카드 목록 */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : sortedItems.length === 0 ? (
        items.length === 0 ? (
          <EmptyState
            title="저장한 공고가 없어요"
            description="공고를 찾아서 관심 공고에 추가해보세요"
            actionLabel="공고 찾기"
            onAction={() => router.push('/notices')}
          />
        ) : (
          <EmptyState
            title="조건에 맞는 공고가 없어요"
            description="다른 상태나 마감 기준을 선택해보세요"
          />
        )
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sortedItems.map((item) => (
            <NoticeCard
              key={item.watchlistItemId}
              item={item}
              onStatusChange={handleStatusChange}
              onRequestDelete={(id) => setDeleteTargetId(id)}
            />
          ))}
        </div>
      )}

      {/* 삭제 확인 모달 */}
      <Dialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>관심 공고에서 제거하시겠어요?</DialogTitle>
            <DialogDescription>
              {deleteTarget && (
                <span className="font-medium text-gray-700">{deleteTarget.bidNtceNm}</span>
              )}
              <br />
              제거하면 저장된 메모와 상태 정보가 모두 삭제됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTargetId(null)}>취소</Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">제거</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
