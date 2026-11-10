'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, CircleHelp, CircleUserRound } from 'lucide-react';
import { ACCESS_TOKEN_KEY } from '@/lib/api';
import { useNotification } from '@/lib/context/NotificationContext';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
}

/* 기존 Sidebar 메뉴와 동일한 목적지 유지. 마이페이지는 오른쪽 계정 영역, 도움말은 오른쪽 보조 영역으로 이동. */
const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: '홈' },
  { href: '/notices', label: '공고 찾기' },
  { href: '/watchlist', label: '관심 공고' },
  { href: '/alerts', label: '알림 내역' },
  { href: '/settings/conditions', label: '관심 조건 설정' },
];

/* ── 로그인 상태: localStorage → React. lib/api/auth.ts가 로그인/로그아웃 시 'authchange'를 발생시킨다. ── */
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

/* 서버 렌더링 및 하이드레이션 시점에는 로그아웃 상태로 그린다. */
function getIsLoggedInServerSnapshot(): boolean {
  return false;
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

export function TopNav() {
  const pathname = usePathname();
  const { unreadCount } = useNotification();
  const isLoggedIn = useSyncExternalStore(
    subscribeAuthChange,
    getIsLoggedInSnapshot,
    getIsLoggedInServerSnapshot,
  );
  const navRef = useRef<HTMLUListElement>(null);

  /* 모바일 가로 스크롤 메뉴에서 현재 메뉴가 화면 밖에 있으면 보이도록 스크롤 */
  useEffect(() => {
    const list = navRef.current;
    if (!list || list.scrollWidth <= list.clientWidth) return;
    const active = list.querySelector<HTMLElement>('[aria-current="page"]');
    if (!active) return;
    const left = active.offsetLeft - list.offsetLeft;
    const right = left + active.offsetWidth;
    if (left < list.scrollLeft || right > list.scrollLeft + list.clientWidth) {
      list.scrollLeft = left - 16;
    }
  }, [pathname]);

  const showUnread = isLoggedIn && unreadCount > 0;
  const unreadText = unreadCount > 99 ? '99+' : String(unreadCount);
  const alertsLabel = showUnread ? `알림 내역, 읽지 않은 알림 ${unreadCount}건` : '알림 내역';
  const helpActive = isActivePath(pathname, '/help');
  const mypageActive = isActivePath(pathname, '/mypage');

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <a
        href="#main-content"
        className={cn(
          'sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-base focus:text-primary-foreground',
          focusRing,
        )}
      >
        본문 바로가기
      </a>

      {/* 본문(main)과 같은 최대 폭·좌우 여백 → 로고와 마이페이지가 본문 가장자리와 정렬 */}
      <div className="mx-auto flex max-w-content flex-wrap items-center gap-x-10 px-4 sm:px-6 lg:h-16 lg:flex-nowrap lg:px-7">
        {/* 워드마크 */}
        <Link
          href="/"
          aria-label="BidSignal 홈으로"
          className={cn(
            'flex h-14 items-center gap-2 rounded-sm text-[22px] font-bold tracking-tight whitespace-nowrap text-foreground lg:h-auto lg:text-2xl',
            focusRing,
          )}
        >
          <span aria-hidden="true" className="block h-5 w-[11px] -skew-x-[20deg] rounded-[2px] bg-primary lg:h-6 lg:w-[13px]" />
          BidSignal
        </Link>

        {/* 주요 메뉴: lg 이상은 한 줄, 그 아래는 두 번째 줄 가로 스크롤 */}
        <nav aria-label="주요 메뉴" className="order-3 -mx-4 w-[calc(100%+2rem)] border-t border-border sm:-mx-6 sm:w-[calc(100%+3rem)] lg:order-none lg:mx-0 lg:w-auto lg:self-stretch lg:border-t-0">
          <ul
            ref={navRef}
            className="flex h-12 gap-6 overflow-x-auto px-4 [scrollbar-width:none] sm:px-6 lg:h-full lg:gap-7 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
          >
            {NAV_ITEMS.map(({ href, label }) => {
              const active = isActivePath(pathname, href);
              return (
                <li key={href} className="flex shrink-0">
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center border-b-2 text-base whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                      active
                        ? 'border-primary font-bold text-foreground'
                        : 'border-transparent font-medium text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 보조/계정 영역 */}
        <div className="ml-auto flex h-14 items-center gap-1 lg:h-auto">
          <Link
            href="/help"
            aria-current={helpActive ? 'page' : undefined}
            aria-label="도움말"
            className={cn(
              'flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg px-2 text-base transition-colors hover:bg-accent sm:px-3',
              helpActive ? 'font-bold text-foreground' : 'font-medium text-muted-foreground hover:text-foreground',
              focusRing,
            )}
          >
            <CircleHelp className="size-5" strokeWidth={1.8} aria-hidden="true" />
            <span className="hidden sm:inline">도움말</span>
          </Link>

          <Link
            href="/alerts"
            aria-label={alertsLabel}
            className={cn(
              'relative flex size-11 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent',
              focusRing,
            )}
          >
            <Bell className="size-5" strokeWidth={1.8} aria-hidden="true" />
            {showUnread && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-base leading-none font-bold text-primary-foreground"
              >
                {unreadText}
              </span>
            )}
          </Link>

          {isLoggedIn ? (
            <Link
              href="/mypage"
              aria-current={mypageActive ? 'page' : undefined}
              aria-label="마이페이지"
              className={cn(
                'flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg px-2 text-base transition-colors hover:bg-accent sm:px-3',
                mypageActive ? 'font-bold text-foreground' : 'font-medium text-muted-foreground hover:text-foreground',
                focusRing,
              )}
            >
              <CircleUserRound className="size-[22px]" strokeWidth={1.7} aria-hidden="true" />
              <span className="hidden sm:inline">마이페이지</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className={cn(
                'ml-1 flex min-h-11 items-center rounded-lg bg-primary px-4 text-base font-medium whitespace-nowrap text-primary-foreground transition-colors hover:bg-primary-hover',
                focusRing,
              )}
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
