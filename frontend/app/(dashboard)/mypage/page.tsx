'use client';

import { useRouter } from 'next/navigation';
import {
  User,
  Bell,
  Settings,
  SlidersHorizontal,
  Lock,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DISABLED_BADGE = (
  <span className="text-[11px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-medium leading-none">
    준비 중
  </span>
);

export default function MyPage() {
  const router = useRouter();

  function handleLogout() {
    if (confirm('로그아웃 하시겠습니까?')) {
      router.push('/login');
    }
  }

  return (
    <div className="flex gap-6 items-start">
      {/* ── 왼쪽 메인 ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        {/* 섹션 1: 페이지 제목 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">마이페이지</h1>
          <p className="text-gray-500 mt-1 text-base">내 정보를 확인하고 관리하세요.</p>
        </div>

        {/* 섹션 2: 사용자 프로필 카드 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-5">
          <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 text-gray-400">
            <User className="size-8" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold text-gray-900">성준님</p>
            <p className="text-base text-gray-500 mt-0.5">010-1234-5678</p>
            <p className="text-base text-gray-500">sungjun@example.com</p>
          </div>
          <Button
            variant="outline"
            onClick={() => alert('준비 중입니다.')}
            className="flex-shrink-0 text-gray-700"
          >
            정보 수정
          </Button>
        </div>

        {/* 섹션 3: 메뉴 목록 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {/* 활성 메뉴 */}
          <MenuRow
            icon={<User className="size-5" />}
            label="가입 정보"
            onClick={() => alert('준비 중입니다.')}
            right={<ChevronRight className="size-5 text-gray-400" />}
          />

          <MenuRow
            icon={<Lock className="size-5" />}
            label="비밀번호 변경"
            onClick={() => alert('준비 중입니다.')}
            right={<ChevronRight className="size-5 text-gray-400" />}
          />

          <MenuRow
            icon={<Settings className="size-5" />}
            label="관심 조건 설정"
            subtitle="공고 찾기 기본 필터로 적용돼요"
            onClick={() => router.push('/settings/conditions')}
            right={<ChevronRight className="size-5 text-gray-400" />}
          />

          {/* 비활성 메뉴 */}
          <MenuRow
            icon={<Bell className="size-5" />}
            label="알림 설정"
            right={DISABLED_BADGE}
            disabled
          />

          <MenuRow
            icon={<SlidersHorizontal className="size-5" />}
            label="간편 모드 설정"
            right={DISABLED_BADGE}
            disabled
          />

          {/* 로그아웃 */}
          <MenuRow
            icon={<LogOut className="size-5 text-red-500" />}
            label="로그아웃"
            labelClass="text-red-500"
            onClick={handleLogout}
          />
        </div>
      </div>

      {/* ── 오른쪽 보조 패널 ── */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-4">
        {/* 패널 1: 나의 현황 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 text-base mb-3">나의 현황</h3>
          <div className="flex flex-col">
            {[
              { label: '관심 공고',       count: '3건', countClass: 'text-blue-600' },
              { label: '읽지 않은 알림',  count: '2건', countClass: 'text-red-600' },
            ].map(({ label, count, countClass }, i, arr) => (
              <div
                key={label}
                className={cn(
                  'flex justify-between items-center py-3 text-sm',
                  i < arr.length - 1 ? 'border-b border-gray-100' : ''
                )}
              >
                <span className="text-gray-600">{label}</span>
                <span className={cn('font-bold', countClass)}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 패널 2: 도움말 카드 */}
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
          <h3 className="font-semibold text-blue-800 text-base mb-2">도움이 필요하신가요?</h3>
          <p className="text-sm text-blue-700 leading-relaxed mb-4">
            고객센터: 1544-1234
            <br />
            평일 09:00 ~ 18:00
          </p>
          <Button
            variant="outline"
            className="w-full text-blue-600 border-blue-300 hover:bg-blue-100 hover:border-blue-400"
            onClick={() => alert('준비 중입니다.')}
          >
            문의하기
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── 메뉴 행 컴포넌트 ── */
function MenuRow({
  icon,
  label,
  subtitle,
  labelClass,
  onClick,
  right,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  labelClass?: string;
  onClick?: () => void;
  right?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={disabled ? undefined : onClick}
      onKeyDown={
        onClick && !disabled
          ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }
          : undefined
      }
      aria-disabled={disabled || undefined}
      className={cn(
        'flex items-center justify-between px-6 py-4 transition-colors',
        disabled
          ? 'opacity-40 cursor-not-allowed pointer-events-none'
          : onClick
          ? 'hover:bg-gray-50 cursor-pointer'
          : ''
      )}
    >
      <div className="flex items-center gap-3 text-gray-700">
        {icon}
        <div>
          <p className={cn('text-base font-medium', labelClass)}>{label}</p>
          {subtitle && (
            <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}
