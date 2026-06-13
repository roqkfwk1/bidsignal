import Link from 'next/link';
import { Bell, Bookmark, Inbox } from 'lucide-react';

import { TodayTodoCard } from '@/components/dashboard/TodayTodoCard';
import { DDayBadge } from '@/components/common/DDayBadge';
import { Button } from '@/components/ui/button';
import { mockAlerts } from '@/data/mockAlerts';
import { mockDashboardSummary, mockRecentSavedNotices } from '@/data/mockDashboard';

const stats = [
  {
    Icon: Bookmark,
    label: '관심 공고',
    count: 4,
    href: '/watchlist',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    Icon: Bell,
    label: '읽지 않은 알림',
    count: mockAlerts.filter((a) => !a.isRead).length,
    href: '/alerts',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
  },
];

export default function HomePage() {
  return (
    <div>
      {/* 인사 영역 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">안녕하세요, 성준님!</h1>
        <p className="text-gray-500 mt-1 text-base">오늘도 새로운 기회를 찾아보세요.</p>
      </div>

      {/* 2열 레이아웃 */}
      <div className="flex gap-6 items-start">
        {/* ── 왼쪽 메인 ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {/* 섹션 1: 오늘 할 일 */}
          <TodayTodoCard
            urgentCount={mockDashboardSummary.urgentCount}
            preparingCount={mockDashboardSummary.preparingCount}
            weeklyCount={mockDashboardSummary.weeklyCount}
          />

          {/* 섹션 2: 최근 저장한 공고 */}
          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-900">최근 저장한 공고</h2>
              <Link href="/watchlist">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  더보기 →
                </Button>
              </Link>
            </div>

            {mockRecentSavedNotices.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 py-16 flex flex-col items-center gap-3 text-center">
                <Inbox className="size-12 text-gray-300" strokeWidth={1.5} />
                <p className="text-base font-medium text-gray-700">아직 저장한 공고가 없어요</p>
                <p className="text-base text-gray-500">공고를 찾아서 저장해보세요</p>
                <Link href="/notices">
                  <Button className="mt-2">공고 찾기</Button>
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                {mockRecentSavedNotices.map((notice) => (
                  <Link
                    key={notice.id}
                    href={`/notices/${notice.id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors min-h-[56px]"
                  >
                    <div className="min-w-0">
                      <p className="text-base font-medium text-gray-900 truncate">
                        {notice.name}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">{notice.agency}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <DDayBadge dDay={notice.dDay} deadline={notice.deadline} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── 오른쪽 보조 패널 ── */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-base mb-4">나의 현황</h3>
            <div className="flex flex-col gap-1">
              {stats.map(({ Icon, label, count, href, iconBg, iconColor }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`size-8 rounded-lg flex items-center justify-center ${iconBg}`}>
                      <Icon className={`size-4 ${iconColor}`} />
                    </div>
                    <span className="text-base text-gray-700">{label}</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{count}건</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
