'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Bookmark,
  Bell,
  Settings,
  User,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const menuItems: MenuItem[] = [
  { href: '/',                    label: '홈',            icon: Home },
  { href: '/notices',             label: '공고 찾기',      icon: Search },
  { href: '/watchlist',           label: '관심 공고',      icon: Bookmark },
  { href: '/alerts',              label: '알림 내역',      icon: Bell },
  { href: '/settings/conditions', label: '관심 조건 설정', icon: Settings },
  { href: '/mypage',              label: '마이페이지',     icon: User },
  { href: '/help',                label: '도움말',         icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-white border-r border-gray-200 flex flex-col overflow-y-auto z-20">
      {/* 로고 */}
      <div className="p-5 border-b border-gray-200 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <Zap className="size-5 text-primary fill-primary" />
          <span className="text-lg font-bold text-primary tracking-tight">BidSignal</span>
        </Link>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 py-4">
        {menuItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 w-full px-4 py-3 text-base transition-colors border-l-2',
                isActive
                  ? 'text-blue-600 font-medium bg-blue-50 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
              )}
            >
              <Icon className="size-5 flex-shrink-0" />
              <span className="flex-1">{label}</span>
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
