'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { Notice } from '@/types/notice';
import { NoticeStatusBadge } from './NoticeStatusBadge';

interface NoticeTableProps {
  notices: Notice[];
  showBookmark?: boolean;
  maxRows?: number;
}

export function NoticeTable({
  notices,
  showBookmark = true,
  maxRows,
}: NoticeTableProps) {
  const [bookmarked, setBookmarked] = useState<Set<number>>(
    () => new Set(notices.filter((n) => n.isBookmarked).map((n) => n.id))
  );

  const rows = maxRows ? notices.slice(0, maxRows) : notices;

  function toggleBookmark(id: number) {
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <table className="w-full text-base">
      <thead>
        <tr className="bg-gray-50 text-sm text-gray-500 border-b border-gray-100">
          <th className="text-left px-5 py-3 font-medium">공고명</th>
          <th className="text-left px-5 py-3 font-medium">발주기관</th>
          <th className="text-left px-5 py-3 font-medium">마감일</th>
          <th className="text-left px-5 py-3 font-medium">금액</th>
          <th className="text-left px-5 py-3 font-medium">상태</th>
          {showBookmark && (
            <th className="text-center px-5 py-3 font-medium w-16">북마크</th>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((notice) => (
          <tr
            key={notice.id}
            className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
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

            {/* 발주기관 */}
            <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
              {notice.agency}
            </td>

            {/* 마감일 */}
            <td className="px-5 py-4 whitespace-nowrap">
              <span
                className={
                  notice.dDay <= 7
                    ? 'text-red-600 font-semibold'
                    : 'text-gray-700'
                }
              >
                {notice.deadlineTime}
              </span>
              <p className="text-xs text-gray-400 mt-0.5">{notice.deadline}</p>
            </td>

            {/* 금액 */}
            <td className="px-5 py-4 text-gray-600">{notice.amount}</td>

            {/* 상태 */}
            <td className="px-5 py-4">
              <NoticeStatusBadge status={notice.status} size="sm" />
            </td>

            {/* 북마크 */}
            {showBookmark && (
              <td className="px-5 py-4 text-center">
                <button
                  onClick={() => toggleBookmark(notice.id)}
                  aria-label={
                    bookmarked.has(notice.id) ? '북마크 해제' : '북마크 추가'
                  }
                  className="inline-flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <Star
                    className={`size-5 transition-colors ${
                      bookmarked.has(notice.id)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 hover:text-gray-400'
                    }`}
                  />
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
