'use client';

import { forwardRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';
export const controlHeight = 'h-11 text-base md:text-base';

/* ────────────────────────────────────────────────────────── */
/* 워드마크 — TopNav와 동일한 표기                                 */
/* ────────────────────────────────────────────────────────── */
export function Wordmark() {
  return (
    <Link
      href="/"
      aria-label="BidSignal 홈으로"
      className={cn('inline-flex items-center gap-2 rounded-sm text-2xl font-bold tracking-tight text-foreground', focusRing)}
    >
      <span aria-hidden="true" className="block h-6 w-[13px] -skew-x-[20deg] rounded-[2px] bg-primary" />
      BidSignal
    </Link>
  );
}

/* ────────────────────────────────────────────────────────── */
/* 로그인·회원가입 공통 틀: 브랜드 설명(좌) + 폼(우), 모바일 1열       */
/* ────────────────────────────────────────────────────────── */
const BRAND_POINTS = ['공고 검색', '관심 공고 관리', '마감 관리'] as const;

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="grid w-full gap-8 lg:grid-cols-[1fr_440px] lg:items-center lg:gap-16">
      <div className="hidden lg:block">
        <p className="text-base font-semibold tracking-wide text-primary">나라장터 입찰 공고 관리</p>
        <p className="mt-3 text-[32px] leading-snug font-bold tracking-tight text-foreground">
          놓치면 안 되는 공고와 마감을
          <br />
          한곳에서 정리하세요.
        </p>
        <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
          공고를 찾아 관심 공고로 저장하고, 진행 상태와 서류 준비, 마감 일정을 함께 관리할 수 있어요.
        </p>
        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
          {BRAND_POINTS.map((p) => (
            <li key={p} className="flex items-center gap-1.5 text-base font-medium text-foreground">
              <Check aria-hidden="true" className="size-5 text-primary" />
              {p}
            </li>
          ))}
        </ul>
      </div>

      <section
        aria-labelledby="auth-title"
        className="w-full rounded-[10px] border border-border bg-card px-5 py-7 sm:px-8 sm:py-8"
      >
        <h1 id="auth-title" className="text-[26px] font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-base text-muted-foreground">{description}</p>
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6 border-t border-border pt-5">{footer}</div>}
      </section>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* 폼 전체 오류(인증 실패/서버 오류) 배너                            */
/* ────────────────────────────────────────────────────────── */
export function FormAlert({ id, message }: { id?: string; message: string }) {
  return (
    <div
      id={id}
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive-soft px-3.5 py-3 text-base text-destructive"
    >
      <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <span><span className="sr-only">오류: </span>{message}</span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* 입력 항목 — 레이블, 도움말, 오류를 aria-describedby로 연결         */
/* ────────────────────────────────────────────────────────── */
export function fieldDescribedBy(id: string, opts: { hint?: boolean; error?: string }): string | undefined {
  const ids = [opts.hint ? `${id}-hint` : null, opts.error ? `${id}-error` : null].filter(Boolean);
  return ids.length ? ids.join(' ') : undefined;
}

export function Field({
  id,
  label,
  optional,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-base font-medium text-foreground">
        {label}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(선택)</span>}
      </label>
      {children}
      {hint && <p id={`${id}-hint`} className="text-base text-muted-foreground">{hint}</p>}
      {error && <FieldError id={`${id}-error`} message={error} />}
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-base text-destructive">
      <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <span><span className="sr-only">오류: </span>{message}</span>
    </p>
  );
}

export function inputClass(invalid: boolean, extra?: string) {
  return cn(
    controlHeight,
    'bg-card px-3',
    invalid && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20',
    extra
  );
}

/* ────────────────────────────────────────────────────────── */
/* 비밀번호 입력 — type="password" 기본, 보기 버튼으로만 전환         */
/* ────────────────────────────────────────────────────────── */
type PasswordInputProps = Omit<React.ComponentProps<'input'>, 'type'> & { invalid: boolean };

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ invalid, className, ...props }, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          aria-invalid={invalid || undefined}
          className={inputClass(invalid, cn('pr-12', className))}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? '비밀번호 숨기기' : '비밀번호 보기'}
          aria-pressed={visible}
          className={cn(
            'absolute top-1/2 right-0.5 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground',
            focusRing
          )}
        >
          {visible ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
        </button>
      </div>
    );
  }
);

export const HELP_EMAIL = 'bidsignal.help@gmail.com';
