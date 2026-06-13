'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import { NoticeStatusBadge } from '@/components/notices/NoticeStatusBadge';
import { DDayBadge } from '@/components/common/DDayBadge';
import { StatusDropdown } from '@/components/common/StatusDropdown';
import { EmptyState } from '@/components/common/EmptyState';
import { mockWatchlist } from '@/data/mockWatchlist';
import { SavedNotice, WatchlistStatus } from '@/types/notice';
import { cn } from '@/lib/utils';

/* ────────────────────────────────────────────────────────── */
/* Types                                                       */
/* ────────────────────────────────────────────────────────── */
type TabKey   = 'all' | 'imminent' | 'preparing' | 'submitted';
type SortKey  = 'deadline' | 'savedAt' | 'status';

const STATUS_ORDER: Record<WatchlistStatus, number> = {
  REVIEWING: 0,
  PREPARING: 1,
  SUBMITTED: 2,
  DROPPED:   3,
};

/* ────────────────────────────────────────────────────────── */
/* NoticeCard                                                  */
/* ────────────────────────────────────────────────────────── */
function NoticeCard({
  notice,
  onStatusChange,
  onRequestDelete,
}: {
  notice: SavedNotice;
  onStatusChange: (id: number, status: WatchlistStatus) => void;
  onRequestDelete: (id: number) => void;
}) {
  const isDropped = notice.watchlistStatus === 'DROPPED';

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 transition-opacity',
        isDropped && 'opacity-50'
      )}
    >
      {/* ── 상단: 공고명 + ... 메뉴 ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <Link
            href={`/notices/${notice.id}`}
            className="font-medium text-base text-gray-900 hover:text-blue-600 transition-colors leading-snug"
          >
            {notice.name}
          </Link>
          <div className="mt-1.5">
            <NoticeStatusBadge status={notice.status} size="sm" />
          </div>
        </div>

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
              onSelect={() => onRequestDelete(notice.id)}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              관심 공고 삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── 중단: 기관명 + D-day ── */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{notice.agency}</span>
        <DDayBadge dDay={notice.dDay} deadline={notice.deadline} />
      </div>

      {/* ── 메모 미리보기 ── */}
      <Link href={`/notices/${notice.id}`} className="block min-h-[20px]">
        {notice.memo ? (
          <p className="text-sm text-gray-600 truncate">{notice.memo}</p>
        ) : (
          <p className="text-sm text-gray-400">메모 추가</p>
        )}
      </Link>

      {/* ── 하단: 상태 드롭다운 ── */}
      <div className="pt-2 border-t border-gray-100">
        <StatusDropdown
          status={notice.watchlistStatus}
          onChange={(s) => onStatusChange(notice.id, s)}
        />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Page                                                        */
/* ────────────────────────────────────────────────────────── */
export default function WatchlistPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [notices, setNotices]             = useState<SavedNotice[]>(mockWatchlist);
  const [activeTab, setActiveTab]         = useState<TabKey>('all');
  const [sort, setSort]                   = useState<SortKey>('deadline');
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  /* URL 쿼리 파라미터로 초기 탭 설정 (대시보드 링크 연동) */
  useEffect(() => {
    const tab    = searchParams.get('tab');
    const status = searchParams.get('status');
    if (tab === 'urgent')            setActiveTab('imminent');
    else if (status === 'PREPARING') setActiveTab('preparing');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* 탭별 카운트 */
  const tabCounts = useMemo(() => ({
    all:       notices.length,
    imminent:  notices.filter((n) => n.dDay <= 7).length,
    preparing: notices.filter((n) => n.watchlistStatus === 'PREPARING').length,
    submitted: notices.filter((n) => n.watchlistStatus === 'SUBMITTED').length,
  }), [notices]);

  /* 탭 필터링 + 정렬 (DROPPED는 항상 최하단) */
  const sortedNotices = useMemo<SavedNotice[]>(() => {
    let list = [...notices];

    switch (activeTab) {
      case 'imminent':  list = list.filter((n) => n.dDay <= 7); break;
      case 'preparing': list = list.filter((n) => n.watchlistStatus === 'PREPARING'); break;
      case 'submitted': list = list.filter((n) => n.watchlistStatus === 'SUBMITTED'); break;
    }

    const active  = list.filter((n) => n.watchlistStatus !== 'DROPPED');
    const dropped = list.filter((n) => n.watchlistStatus === 'DROPPED');

    const compareFn = (a: SavedNotice, b: SavedNotice): number => {
      switch (sort) {
        case 'savedAt':   return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
        case 'status':    return STATUS_ORDER[a.watchlistStatus] - STATUS_ORDER[b.watchlistStatus];
        default:          return a.dDay - b.dDay; // deadline
      }
    };

    return [...active.sort(compareFn), ...dropped];
  }, [notices, activeTab, sort]);

  /* 상태 낙관적 업데이트 */
  function handleStatusChange(id: number, status: WatchlistStatus) {
    setNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, watchlistStatus: status } : n))
    );
  }

  /* 삭제 확인 → 제거 */
  function handleDelete() {
    if (deleteTargetId === null) return;
    setNotices((prev) => prev.filter((n) => n.id !== deleteTargetId));
    setDeleteTargetId(null);
  }

  const deleteTarget = notices.find((n) => n.id === deleteTargetId);

  /* ── Render ── */
  return (
    <div className="flex flex-col gap-6">
      {/* 섹션 1: 페이지 제목 + 정렬 */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">관심 공고</h1>
          <p className="text-gray-500 mt-1 text-base">저장한 공고를 한눈에 확인하세요.</p>
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deadline">마감일 임박순</SelectItem>
            <SelectItem value="savedAt">최근 저장순</SelectItem>
            <SelectItem value="status">상태순</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 섹션 2: 탭 필터 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
        <TabsList className="h-10 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="all"       className="text-base px-5 rounded-md">
            전체 {tabCounts.all}
          </TabsTrigger>
          <TabsTrigger value="imminent"  className="text-base px-5 rounded-md">
            마감임박 {tabCounts.imminent}
          </TabsTrigger>
          <TabsTrigger value="preparing" className="text-base px-5 rounded-md">
            준비중 {tabCounts.preparing}
          </TabsTrigger>
          <TabsTrigger value="submitted" className="text-base px-5 rounded-md">
            제출완료 {tabCounts.submitted}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 섹션 3: 카드 목록 */}
      {sortedNotices.length === 0 ? (
        <EmptyState
          title="저장한 공고가 없어요"
          description="공고를 찾아서 관심 공고에 추가해보세요"
          actionLabel="공고 찾기"
          onAction={() => router.push('/notices')}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {sortedNotices.map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
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
                <span className="font-medium text-gray-700">{deleteTarget.name}</span>
              )}
              <br />
              제거하면 저장된 메모와 상태 정보가 모두 삭제됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTargetId(null)}>
              취소
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              제거
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
