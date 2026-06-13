'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

interface TodayTodoCardProps {
  urgentCount: number;
  preparingCount: number;
  weeklyCount: number;
}

export function TodayTodoCard({ urgentCount, preparingCount, weeklyCount }: TodayTodoCardProps) {
  const [closed, setClosed] = useState(false);

  if (closed) return null;

  const todos = [
    {
      label: '마감 임박 공고 확인',
      count: urgentCount,
      countColor: 'text-red-300 font-bold',
      href: '/watchlist?tab=urgent',
    },
    {
      label: '준비 중인 공고',
      count: preparingCount,
      countColor: 'text-blue-200 font-bold',
      href: '/watchlist?status=PREPARING',
    },
    {
      label: '이번 주 마감 공고',
      count: weeklyCount,
      countColor: 'text-orange-300 font-bold',
      href: '/watchlist?tab=urgent',
    },
  ];

  return (
    <div className="bg-blue-600 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white font-semibold text-lg">오늘 할 일</h2>
        <button
          onClick={() => setClosed(true)}
          className="text-white/60 hover:text-white transition-colors"
          aria-label="닫기"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {todos.map((todo) => (
          <Link key={todo.label} href={todo.href}>
            <div className="bg-white rounded-lg px-4 py-3 flex justify-between items-center hover:bg-blue-50 transition-colors cursor-pointer">
              <span className="text-gray-800 text-base">{todo.label}</span>
              <span className={`text-base ${todo.countColor}`}>{todo.count}건</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
