'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';
export const controlHeight = 'h-11 text-base md:text-base';

/* ────────────────────────────────────────────────────────── */
/* 계정 설정 메뉴 — 마이페이지 · 관심 조건 · 알림 설정 공통          */
/* ────────────────────────────────────────────────────────── */
const SETTINGS_MENU = [
  { href: '/mypage', label: '내 계정' },
  { href: '/settings/conditions', label: '관심 조건 설정' },
  { href: '/mypage/notifications', label: '알림 설정' },
] as const;

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="계정 설정 메뉴" className="lg:w-52 lg:shrink-0">
      <ul className="flex flex-wrap gap-1 lg:flex-col">
        {SETTINGS_MENU.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center rounded-lg px-3 text-base transition-colors',
                  /* 현재 메뉴: 배경 + 글자색 + 굵기로 구분 (디자인 킷 .settings-menu button.active) */
                  active
                    ? 'bg-accent font-bold text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  focusRing
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ────────────────────────────────────────────────────────── */
/* 페이지 틀: 제목 + (설정 메뉴 | 본문) 2열, 모바일 1열              */
/* ────────────────────────────────────────────────────────── */
export function AccountLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-foreground lg:text-[32px]">{title}</h1>
        <p className="mt-1 text-base text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-12">
        <SettingsNav />
        <div className="min-w-0 flex-1 lg:max-w-2xl">{children}</div>
      </div>
    </div>
  );
}

/* 흰 표면 섹션 */
export function SettingsSection({
  title,
  description,
  children,
  className,
  headingId,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headingId?: string;
}) {
  return (
    <section
      aria-labelledby={headingId}
      className={cn('rounded-[10px] border border-border bg-card px-4 py-5 sm:px-6', className)}
    >
      <h2 id={headingId} className="text-lg font-bold text-foreground">{title}</h2>
      {description && <p className="mt-1 text-base text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────── */
/* 스위치 한 줄 — 이름(label)·설명(aria-describedby)·켜짐/꺼짐 글자   */
/* ────────────────────────────────────────────────────────── */
export function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  id: string;
  label: string;
  description: React.ReactNode;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const descId = `${id}-desc`;
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0">
        <label htmlFor={id} className="cursor-pointer text-base font-medium text-foreground">
          {label}
        </label>
        <p id={descId} className="mt-0.5 text-base text-muted-foreground">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        {/* 상태를 색만으로 구분하지 않도록 글자 동반 (스크린리더는 스위치의 aria-checked로 읽음) */}
        <span aria-hidden="true" className="min-w-[2.5em] text-right text-base text-muted-foreground">
          {checked ? '켜짐' : '꺼짐'}
        </span>
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          aria-describedby={descId}
        />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* 저장 결과/변경 여부 안내 — 항상 렌더링되는 live region            */
/* ────────────────────────────────────────────────────────── */
export type SaveTone = 'neutral' | 'success' | 'error';

export function SaveStatus({ tone, message }: { tone: SaveTone; message: string }) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        'flex min-h-11 items-center gap-1.5 text-base',
        tone === 'success' && 'text-primary',
        tone === 'error' && 'text-destructive',
        tone === 'neutral' && 'text-muted-foreground'
      )}
    >
      {tone === 'success' && <CheckCircle2 aria-hidden="true" className="size-5 shrink-0" />}
      {tone === 'error' && <AlertCircle aria-hidden="true" className="size-5 shrink-0" />}
      <span>{message}</span>
    </p>
  );
}

/* ────────────────────────────────────────────────────────── */
/* 불러오기 실패 / 로그인 필요                                       */
/* ────────────────────────────────────────────────────────── */
export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-[10px] border border-border bg-card px-4 py-6 sm:px-6">
      <p className="flex items-center gap-2 text-base font-medium text-foreground">
        <AlertCircle aria-hidden="true" className="size-5 shrink-0 text-destructive" />
        {message}
      </p>
      <p className="text-base text-muted-foreground">네트워크 상태를 확인한 뒤 다시 시도해 주세요.</p>
      <Button type="button" variant="outline" onClick={onRetry} className={cn(controlHeight, 'px-5')}>
        다시 시도
      </Button>
    </div>
  );
}

export function LoginRequired({ description }: { description: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[10px] border border-border bg-card px-4 py-16 text-center">
      <p className="text-lg font-medium text-foreground">로그인이 필요해요</p>
      <p className="text-base text-muted-foreground">{description}</p>
      <Button asChild className={cn(controlHeight, 'mt-3 px-5')}>
        <Link href="/login">로그인하러 가기</Link>
      </Button>
    </div>
  );
}
