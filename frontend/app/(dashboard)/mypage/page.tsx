'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AccountLayout,
  LoadError,
  LoginRequired,
  SettingsSection,
  controlHeight,
  focusRing,
} from '@/components/account/AccountLayout';
import { HELP_EMAIL } from '@/components/auth/AuthForm';
import { cn, formatPhoneNumber } from '@/lib/utils';
import { logout, getMyInfo, deleteAccount } from '@/lib/api/auth';
import { getWatchlist } from '@/lib/api/watchlist';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { useIsLoggedIn } from '@/lib/hooks/useIsLoggedIn';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/lib/api';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import type { UserResponse } from '@/types/notice';

const PAGE_DESCRIPTION = '가입 정보를 확인하고 계정 설정을 관리하세요.';

const SHORTCUTS = [
  { href: '/settings/conditions', label: '관심 조건 설정', description: '공고 찾기에서 불러올 검색 조건' },
  { href: '/mypage/notifications', label: '알림 설정', description: '마감 임박 이메일 알림 수신과 시점(D-3, D-1)' },
] as const;

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:gap-4">
      <dt className="text-base text-muted-foreground sm:w-32 sm:shrink-0">{label}</dt>
      <dd className="min-w-0 text-base wrap-anywhere text-foreground">{children}</dd>
    </div>
  );
}

export default function MyPage() {
  useRequireAuth();
  const isLoggedIn = useIsLoggedIn();
  const router = useRouter();

  const [user, setUser]                           = useState<UserResponse | null>(null);
  const [userError, setUserError]                 = useState(false);
  const [watchlistCount, setWatchlistCount]       = useState<number | null>(null);
  const [loading, setLoading]                     = useState(true);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawing, setWithdrawing]             = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(ACCESS_TOKEN_KEY)) return;
    let cancelled = false;
    async function load() {
      const [userResult, watchlistResult] = await Promise.allSettled([
        getMyInfo(),
        getWatchlist(),
      ]);
      if (cancelled) return;
      if (userResult.status === 'fulfilled') setUser(userResult.value);
      else setUserError(true);
      if (watchlistResult.status === 'fulfilled') setWatchlistCount(watchlistResult.value.length);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function retryUser() {
    setLoading(true);
    setUserError(false);
    try {
      setUser(await getMyInfo());
    } catch {
      setUserError(true);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
    }
  }

  async function handleWithdraw() {
    setWithdrawing(true);
    try {
      await deleteAccount();
      if (typeof window !== 'undefined') {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem('bidsignal_conditions');
        window.dispatchEvent(new Event('authchange'));
      }
      showSuccessToast('탈퇴가 완료되었습니다.');
      router.push('/login');
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : '탈퇴 처리 중 오류가 발생했습니다.');
      setWithdrawing(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <AccountLayout title="마이페이지" description={PAGE_DESCRIPTION}>
        <LoginRequired description="마이페이지는 로그인한 뒤 이용할 수 있어요." />
      </AccountLayout>
    );
  }

  return (
    <AccountLayout title="마이페이지" description={PAGE_DESCRIPTION}>
      <div className="flex flex-col gap-6">
        {/* 가입 정보 */}
        {userError && !loading ? (
          <LoadError message="가입 정보를 불러오지 못했어요." onRetry={retryUser} />
        ) : (
          <SettingsSection headingId="account-info-heading" title="가입 정보">
            {loading ? (
              <div aria-hidden="true" className="flex flex-col gap-4 py-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-56" />
                <Skeleton className="h-5 w-36" />
              </div>
            ) : (
              <dl className="-my-3 divide-y divide-border">
                <InfoRow label="닉네임">{user?.nickname || '-'}</InfoRow>
                <InfoRow label="이메일">{user?.email || '-'}</InfoRow>
                <InfoRow label="휴대폰 번호">
                  {user?.phoneNumber
                    ? formatPhoneNumber(user.phoneNumber)
                    : <span className="text-muted-foreground">등록하지 않음</span>}
                </InfoRow>
                <InfoRow label="관심 공고">
                  {watchlistCount === null ? (
                    <span className="text-muted-foreground">불러오지 못함</span>
                  ) : (
                    <Link href="/watchlist" className={cn('rounded-sm text-primary tabular-nums hover:underline', focusRing)}>
                      {watchlistCount}건 보기
                    </Link>
                  )}
                </InfoRow>
              </dl>
            )}
          </SettingsSection>
        )}

        {/* 설정 바로가기 */}
        <SettingsSection headingId="shortcut-heading" title="설정">
          <ul className="-my-1 divide-y divide-border">
            {SHORTCUTS.map(({ href, label, description }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={cn('-mx-2 flex min-h-14 items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted', focusRing)}
                >
                  <span className="min-w-0">
                    <span className="block text-base font-medium text-foreground">{label}</span>
                    <span className="block text-base text-muted-foreground">{description}</span>
                  </span>
                  <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </SettingsSection>

        {/* 계정 관리 */}
        <SettingsSection headingId="account-manage-heading" title="계정 관리">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-medium text-foreground">로그아웃</p>
                <p className="text-base text-muted-foreground">이 브라우저에 저장한 관심 조건도 함께 지워져요.</p>
              </div>
              <Button type="button" variant="outline" onClick={handleLogout} className={cn(controlHeight, 'self-start px-5 sm:self-auto')}>
                로그아웃
              </Button>
            </div>
            <div className="flex flex-col gap-2 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-medium text-foreground">회원 탈퇴</p>
                <p className="text-base text-muted-foreground">모든 정보가 삭제되며 되돌릴 수 없어요.</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setWithdrawModalOpen(true)}
                className={cn(controlHeight, 'self-start px-5 text-destructive hover:bg-destructive-soft hover:text-destructive sm:self-auto')}
              >
                회원 탈퇴
              </Button>
            </div>
          </div>
        </SettingsSection>

        <p className="text-base text-muted-foreground">
          도움이 필요하면{' '}
          {/* 이메일+조사를 한 덩어리로 묶어 이메일 앞에서만 줄이 나뉘게 함 */}
          <span className="whitespace-nowrap">
            <a href={`mailto:${HELP_EMAIL}`} className={cn('rounded-sm font-medium text-primary hover:underline', focusRing)}>
              {HELP_EMAIL}
            </a>
            으로
          </span>{' '}
          문의해 주세요.
        </p>
      </div>

      {/* 회원 탈퇴 확인 — 되돌릴 수 없는 동작이므로 반드시 확인 단계를 거침 */}
      <Dialog
        open={withdrawModalOpen}
        onOpenChange={(open) => { if (!withdrawing) setWithdrawModalOpen(open); }}
      >
        <DialogContent showCloseButton={false} className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              회원 탈퇴
            </DialogTitle>
            <DialogDescription className="space-y-1 text-base leading-relaxed break-keep text-foreground">
              <span className="block">회원 탈퇴하시겠습니까?</span>
              <span className="block">탈퇴 시 모든 정보가 삭제되며 복구할 수 없습니다.</span>
            </DialogDescription>
          </DialogHeader>

          {/* 취소(왼쪽/기본 포커스), 탈퇴하기(오른쪽/위험) */}
          <div className="-mx-4 -mb-4 flex flex-row gap-2 rounded-b-xl border-t border-border bg-muted p-4">
            <Button
              type="button"
              variant="outline"
              className={cn(controlHeight, 'flex-1')}
              onClick={() => setWithdrawModalOpen(false)}
              disabled={withdrawing}
            >
              취소
            </Button>
            <Button
              type="button"
              className={cn(controlHeight, 'flex-1 border-0 bg-destructive text-primary-foreground hover:bg-destructive/90')}
              onClick={handleWithdraw}
              disabled={withdrawing}
            >
              {withdrawing ? '처리 중...' : '탈퇴하기'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AccountLayout>
  );
}
