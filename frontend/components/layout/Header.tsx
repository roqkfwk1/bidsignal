'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ACCESS_TOKEN_KEY } from '@/lib/api';
import { useNotification } from '@/lib/context/NotificationContext';

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { unreadCount } = useNotification();

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem(ACCESS_TOKEN_KEY));
    setMounted(true);
  }, []);

  const showBadge = mounted && isLoggedIn && unreadCount > 0;

  return (
    <header className="fixed top-0 right-0 left-[220px] h-14 bg-white border-b border-gray-200 z-10 px-6 flex items-center justify-end gap-2">
      {/* 알림 벨 */}
      <div className="relative">
        <Button variant="ghost" size="icon" asChild aria-label="알림 내역">
          <Link href="/alerts">
            <Bell className={`size-5 ${showBadge ? 'text-gray-700' : 'text-gray-400'}`} />
          </Link>
        </Button>

        {showBadge && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[11px] font-bold px-1 pointer-events-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>

      {/* 로그인 상태에 따라 다르게 표시 — mounted 전에는 서버 렌더링과 동일하게 로그아웃 상태 유지 */}
      {mounted && isLoggedIn ? (
        <Button variant="ghost" size="icon" asChild aria-label="마이페이지">
          <Link href="/mypage">
            <User className="size-5 text-gray-400" />
          </Link>
        </Button>
      ) : (
        <Button
          asChild
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 h-8"
        >
          <Link href="/login">로그인</Link>
        </Button>
      )}
    </header>
  );
}
