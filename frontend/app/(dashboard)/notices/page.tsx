'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Star, Tag } from 'lucide-react';
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
import { NoticeStatusBadge } from '@/components/notices/NoticeStatusBadge';
import { DDayBadge } from '@/components/common/DDayBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ApiErrorState } from '@/components/common/ApiErrorState';
import { SaveToast } from '@/components/common/SaveToast';
import { mockNotices } from '@/data/mockNotices';
import { Notice } from '@/types/notice';

/* ────────────────────────────────────────────────────────── */
/* Types                                                       */
/* ────────────────────────────────────────────────────────── */
type SearchPhase = 'idle' | 'loading' | 'success' | 'error';

/* ────────────────────────────────────────────────────────── */
/* Helpers                                                     */
/* ────────────────────────────────────────────────────────── */
function parseMinAmountManWon(amount: string): number {
  const firstPart = amount.split('~')[0].trim();
  let total = 0;
  const eok = firstPart.match(/(\d+)\s*억/);
  if (eok) total += parseInt(eok[1], 10) * 10_000;
  const cheonMan = firstPart.match(/(\d+)\s*천만/);
  if (cheonMan) total += parseInt(cheonMan[1], 10) * 1_000;
  return total;
}

function applyFilters(
  list: Notice[],
  opts: {
    query: string;
    region: string;
    category: string;
    contractType: string;
    amountRange: string;
    deadlineFilter: string;
  }
): Notice[] {
  let result = [...list];

  if (opts.query.trim()) {
    const q = opts.query.toLowerCase();
    result = result.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.agency.toLowerCase().includes(q) ||
        n.bidNo.toLowerCase().includes(q)
    );
  }

  if (opts.region !== 'all') result = result.filter((n) => n.region === opts.region);
  if (opts.category !== 'all') result = result.filter((n) => n.category === opts.category);
  if (opts.contractType !== 'all') result = result.filter((n) => n.contractType === opts.contractType);

  if (opts.amountRange !== 'all') {
    result = result.filter((n) => {
      const min = parseMinAmountManWon(n.amount);
      if (opts.amountRange === 'under1') return min < 10_000;
      if (opts.amountRange === '1to5') return min >= 10_000 && min < 50_000;
      if (opts.amountRange === '5to10') return min >= 50_000 && min < 100_000;
      if (opts.amountRange === 'over10') return min >= 100_000;
      return true;
    });
  }

  if (opts.deadlineFilter !== 'all') {
    result = result.filter((n) => {
      if (opts.deadlineFilter === 'today') return n.dDay === 0;
      if (opts.deadlineFilter === '7days') return n.dDay <= 7;
      if (opts.deadlineFilter === '30days') return n.dDay <= 30;
      return true;
    });
  }

  return result;
}

/* ────────────────────────────────────────────────────────── */
/* Skeleton rows                                               */
/* ────────────────────────────────────────────────────────── */
function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <tr key={i} className="border-t border-gray-100">
          <td className="px-5 py-4">
            <Skeleton className="h-4 w-52 mb-1.5" />
            <Skeleton className="h-3 w-28" />
          </td>
          <td className="px-5 py-4">
            <Skeleton className="h-4 w-14" />
          </td>
          <td className="px-5 py-4">
            <Skeleton className="h-4 w-28" />
          </td>
          <td className="px-5 py-4">
            <Skeleton className="h-4 w-14 mb-1.5" />
            <Skeleton className="h-3 w-20" />
          </td>
          <td className="px-5 py-4">
            <Skeleton className="h-4 w-24" />
          </td>
          <td className="px-5 py-4">
            <Skeleton className="h-6 w-16 rounded-full" />
          </td>
          <td className="px-5 py-4 text-center">
            <Skeleton className="h-5 w-5 mx-auto rounded" />
          </td>
        </tr>
      ))}
    </>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Saved conditions (mock)                                    */
/* ────────────────────────────────────────────────────────── */
const savedConditions = [
  { id: 1, name: '강원도 건축공사', tags: ['강원도', '건축공사'], region: '강원도', category: '건축공사' },
  { id: 2, name: '경기도 시설공사', tags: ['경기도', '시설공사'], region: '경기도', category: '시설공사' },
  { id: 3, name: '서울 전자입찰',   tags: ['서울', '전자입찰'],   region: '서울',   category: '전자입찰' },
];

/* ────────────────────────────────────────────────────────── */
/* Page component                                             */
/* ────────────────────────────────────────────────────────── */
export default function NoticesPage() {
  /* Filter states */
  const [query, setQuery]               = useState('');
  const [region, setRegion]             = useState('all');
  const [category, setCategory]         = useState('all');
  const [contractType, setContractType] = useState('all');
  const [amountRange, setAmountRange]   = useState('all');
  const [deadlineFilter, setDeadlineFilter] = useState('all');

  /* Search states */
  const [sort, setSort]               = useState('deadline');
  const [phase, setPhase]             = useState<SearchPhase>('idle');
  const [baseResults, setBaseResults] = useState<Notice[]>([]);

  /* UI states */
  const [bookmarked, setBookmarked] = useState<Set<number>>(
    () => new Set(mockNotices.filter((n) => n.isBookmarked).map((n) => n.id))
  );
  const [showToast, setShowToast] = useState(false);

  /* Sorted results derived from base */
  const sortedResults = useMemo<Notice[]>(() => {
    const list = [...baseResults];
    switch (sort) {
      case 'latest':   return list.sort((a, b) => b.id - a.id);
      case 'deadline': return list.sort((a, b) => a.dDay - b.dDay);
      case 'amount':   return list.sort((a, b) => parseMinAmountManWon(b.amount) - parseMinAmountManWon(a.amount));
      default:         return list;
    }
  }, [baseResults, sort]);

  /* Summary stats for right panel */
  const urgentCount    = sortedResults.filter((n) => n.dDay <= 7).length;
  const correctedCount = sortedResults.filter((n) => n.status === 'corrected').length;
  const newCount       = sortedResults.filter((n) => n.status === 'new').length;
  const reviewCount    = sortedResults.filter((n) => n.status === 'review').length;

  function handleSearch() {
    setPhase('loading');
    setTimeout(() => {
      const results = applyFilters(mockNotices, {
        query, region, category, contractType, amountRange, deadlineFilter,
      });
      setBaseResults(results);
      setPhase('success');
    }, 600);
  }

  function resetFilters() {
    setQuery('');
    setRegion('all');
    setCategory('all');
    setContractType('all');
    setAmountRange('all');
    setDeadlineFilter('all');
  }

  function toggleBookmark(id: number) {
    const isSaved = bookmarked.has(id);
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (!isSaved) setShowToast(true);
  }

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
              placeholder="예: 환경개선, 공사"
              className="pl-9 h-10 text-base w-full"
            />
          </div>

          {/* 2행: 지역 / 업종 / 공고 유형 */}
          <div className="grid grid-cols-3 gap-3">
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="w-full h-10 text-base">
                <SelectValue placeholder="전체 지역" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 지역</SelectItem>
                <SelectItem value="강원도">강원도</SelectItem>
                <SelectItem value="경기도">경기도</SelectItem>
                <SelectItem value="서울">서울</SelectItem>
                <SelectItem value="인천">인천</SelectItem>
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full h-10 text-base">
                <SelectValue placeholder="업종/분류" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="건축공사">건축공사</SelectItem>
                <SelectItem value="시설공사">시설공사</SelectItem>
                <SelectItem value="건설공사">건설공사</SelectItem>
              </SelectContent>
            </Select>

            <Select value={contractType} onValueChange={setContractType}>
              <SelectTrigger className="w-full h-10 text-base">
                <SelectValue placeholder="공고 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="전자입찰">전자입찰</SelectItem>
                <SelectItem value="수의계약">수의계약</SelectItem>
                <SelectItem value="제한경쟁">제한경쟁</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 3행: 금액 / 마감일 */}
          <div className="grid grid-cols-3 gap-3">
            <Select value={amountRange} onValueChange={setAmountRange}>
              <SelectTrigger className="w-full h-10 text-base">
                <SelectValue placeholder="공고 금액" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="under1">1억 미만</SelectItem>
                <SelectItem value="1to5">1억 ~ 5억</SelectItem>
                <SelectItem value="5to10">5억 ~ 10억</SelectItem>
                <SelectItem value="over10">10억 이상</SelectItem>
              </SelectContent>
            </Select>

            <Select value={deadlineFilter} onValueChange={setDeadlineFilter}>
              <SelectTrigger className="w-full h-10 text-base">
                <SelectValue placeholder="마감일" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="today">오늘 마감</SelectItem>
                <SelectItem value="7days">7일 이내</SelectItem>
                <SelectItem value="30days">30일 이내</SelectItem>
              </SelectContent>
            </Select>

            <div />
          </div>

          {/* 4행: 초기화 / 검색하기 */}
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              조건 초기화
            </Button>
            <Button
              onClick={handleSearch}
              disabled={phase === 'loading'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              검색하기
            </Button>
          </div>
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
                  <>검색 결과 <span className="text-blue-600">{sortedResults.length}건</span></>
                ) : null}
              </p>
              {phase === 'success' && (
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-36 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">최신순</SelectItem>
                    <SelectItem value="deadline">마감임박순</SelectItem>
                    <SelectItem value="amount">금액순</SelectItem>
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
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-gray-50 text-sm text-gray-500 border-b border-gray-100">
                    <th className="text-left px-5 py-3 font-medium">공고명</th>
                    <th className="text-left px-5 py-3 font-medium whitespace-nowrap">지역</th>
                    <th className="text-left px-5 py-3 font-medium whitespace-nowrap">발주기관</th>
                    <th className="text-left px-5 py-3 font-medium whitespace-nowrap">마감일</th>
                    <th className="text-left px-5 py-3 font-medium">금액</th>
                    <th className="text-left px-5 py-3 font-medium whitespace-nowrap">상태</th>
                    <th className="text-center px-5 py-3 font-medium whitespace-nowrap w-16">★</th>
                  </tr>
                </thead>
                <tbody>
                  <SkeletonRows />
                </tbody>
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
            sortedResults.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200">
                <EmptyState
                  title="검색 결과가 없어요"
                  description="다른 키워드나 조건으로 검색해보세요"
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-base">
                  <thead>
                    <tr className="bg-gray-50 text-sm text-gray-500 border-b border-gray-100">
                      <th className="text-left px-5 py-3 font-medium">공고명</th>
                      <th className="text-left px-5 py-3 font-medium whitespace-nowrap">지역</th>
                      <th className="text-left px-5 py-3 font-medium whitespace-nowrap">발주기관</th>
                      <th className="text-left px-5 py-3 font-medium whitespace-nowrap">마감일</th>
                      <th className="text-left px-5 py-3 font-medium">금액</th>
                      <th className="text-left px-5 py-3 font-medium whitespace-nowrap">상태</th>
                      <th className="text-center px-5 py-3 font-medium whitespace-nowrap w-16">★</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedResults.map((notice) => (
                      <tr
                        key={notice.id}
                        className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                        style={{ minHeight: '56px' }}
                      >
                        {/* 공고명 */}
                        <td className="px-5 py-4">
                          <Link
                            href={`/notices/${notice.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600 transition-colors leading-snug"
                          >
                            {notice.name}
                          </Link>
                          <p className="text-xs text-gray-400 mt-0.5">{notice.bidNo}</p>
                        </td>

                        {/* 지역 */}
                        <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {notice.region}
                        </td>

                        {/* 발주기관 */}
                        <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                          {notice.agency}
                        </td>

                        {/* 마감일 + DDayBadge */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <DDayBadge dDay={notice.dDay} deadline={notice.deadline} />
                          <p className="text-xs text-gray-400 mt-0.5">{notice.deadline}</p>
                        </td>

                        {/* 금액 */}
                        <td className="px-5 py-4 text-gray-600">{notice.amount}</td>

                        {/* 상태 */}
                        <td className="px-5 py-4">
                          <NoticeStatusBadge status={notice.status} size="sm" />
                        </td>

                        {/* 관심 공고 저장 */}
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => toggleBookmark(notice.id)}
                            title={bookmarked.has(notice.id) ? '관심 공고 해제' : '관심 공고에 추가'}
                            aria-label={bookmarked.has(notice.id) ? '관심 공고 해제' : '관심 공고에 추가'}
                            className="inline-flex items-center justify-center hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`size-5 transition-colors ${
                                bookmarked.has(notice.id)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300 hover:text-yellow-300'
                              }`}
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </section>
      </div>

      {/* ── 오른쪽 보조 패널 ── */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-4">
        {/* 패널 1: 검색 결과 요약 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 text-base mb-3">검색 결과 요약</h3>
          <div className="flex flex-col">
            {[
              { label: '마감임박', count: urgentCount,    color: 'text-red-600'    },
              { label: '정정됨',   count: correctedCount, color: 'text-orange-600' },
              { label: '신규',     count: newCount,       color: 'text-green-600'  },
              { label: '검토필요', count: reviewCount,    color: 'text-blue-600'   },
            ].map(({ label, count, color }, i, arr) => (
              <div
                key={label}
                className={`flex justify-between items-center py-2 ${
                  i < arr.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <span className="text-base text-gray-600">{label}</span>
                <span className={`font-semibold text-base ${color}`}>{count}건</span>
              </div>
            ))}
          </div>
        </div>

        {/* 패널 2: 저장된 조건 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900 text-base">저장된 조건</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              전체보기
            </button>
          </div>

          <div className="flex flex-col">
            {savedConditions.map((cond, i) => (
              <button
                key={cond.id}
                onClick={() => {
                  setRegion(cond.region);
                  if (cond.category !== cond.region) setCategory(cond.category);
                }}
                className={`flex flex-col items-start py-2.5 text-left hover:bg-gray-50 -mx-1 px-1 rounded transition-colors ${
                  i < savedConditions.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <span className="text-sm font-medium text-gray-800">{cond.name}</span>
                <div className="flex gap-1 mt-1">
                  {cond.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-600"
                    >
                      <Tag className="size-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" className="w-full mt-3 text-gray-600">
            + 현재 조건 저장
          </Button>
        </div>

        {/* 패널 3: 도움말 */}
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
          <h3 className="font-semibold text-blue-800 text-base mb-3">검색 도움말</h3>
          <ul className="flex flex-col gap-2">
            {[
              '지역과 업종을 함께 설정하면 더 정확한 결과를 볼 수 있어요.',
              '마감임박 필터로 놓치기 쉬운 공고를 확인하세요.',
              '조건을 저장하면 다음에 바로 적용할 수 있어요.',
            ].map((tip) => (
              <li key={tip} className="flex gap-2 text-sm text-blue-700">
                <span className="flex-shrink-0 mt-0.5">•</span>
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 저장 완료 토스트 */}
      <SaveToast show={showToast} onHide={() => setShowToast(false)} />
    </div>
  );
}
