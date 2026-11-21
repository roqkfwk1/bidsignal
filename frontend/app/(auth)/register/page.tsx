'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AuthShell,
  Field,
  FieldError,
  FormAlert,
  PasswordInput,
  controlHeight,
  fieldDescribedBy,
  focusRing,
  inputClass,
} from '@/components/auth/AuthForm';
import { cn } from '@/lib/utils';
import { signup } from '@/lib/api/auth';

interface FormErrors {
  name: string;
  userId: string;
  password: string;
  agreedTerms: string;
  agreedPrivacy: string;
  server: string;
}

const EMPTY_ERRORS: FormErrors = {
  name: '',
  userId: '',
  password: '',
  agreedTerms: '',
  agreedPrivacy: '',
  server: '',
};

/**
 * 백엔드 에러 메시지를 폼 필드에 매핑.
 * Validation 에러: "fieldName: 구체적인 메시지" 형식
 * Business 에러: 필드 접두어 없이 메시지만 전달됨
 */
function parseApiError(msg: string): Partial<FormErrors> {
  const colonIdx = msg.indexOf(': ');
  if (colonIdx !== -1) {
    const field = msg.slice(0, colonIdx);
    const text  = msg.slice(colonIdx + 2);
    if (field === 'email')    return { userId: text };
    if (field === 'password') return { password: text };
    if (field === 'nickname') return { name: text };
  }
  if (msg.includes('이메일')) return { userId: msg };
  return { server: msg || '회원가입 중 오류가 발생했어요. 다시 시도해주세요.' };
}

export default function RegisterPage() {
  const [name, setName]                 = useState('');
  const [userId, setUserId]             = useState('');
  const [password, setPassword]         = useState('');
  const [agreedTerms, setAgreedTerms]     = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [errors, setErrors]             = useState<FormErrors>(EMPTY_ERRORS);
  const [success, setSuccess]           = useState(false);

  const nameRef     = useRef<HTMLInputElement>(null);
  const userIdRef   = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const termsRef    = useRef<HTMLButtonElement>(null);
  const privacyRef  = useRef<HTMLButtonElement>(null);

  function clearFieldError(field: keyof FormErrors) {
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  function focusFirstError(errs: Partial<FormErrors>) {
    if (errs.name) nameRef.current?.focus();
    else if (errs.userId) userIdRef.current?.focus();
    else if (errs.password) passwordRef.current?.focus();
    else if (errs.agreedTerms) termsRef.current?.focus();
    else if (errs.agreedPrivacy) privacyRef.current?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const next: FormErrors = { ...EMPTY_ERRORS };
    let hasError = false;

    if (!name.trim()) {
      next.name = '이름을 입력해주세요.';
      hasError = true;
    }
    if (!userId.trim()) {
      next.userId = '이메일을 입력해주세요.';
      hasError = true;
    }
    if (!password.trim()) {
      next.password = '비밀번호를 입력해주세요.';
      hasError = true;
    }
    if (!agreedTerms) {
      next.agreedTerms = '이용약관에 동의해주세요.';
      hasError = true;
    }
    if (!agreedPrivacy) {
      next.agreedPrivacy = '개인정보 수집 및 이용에 동의해주세요.';
      hasError = true;
    }

    setErrors(next);
    if (hasError) {
      focusFirstError(next);
      return;
    }

    setSubmitting(true);
    try {
      await signup(userId.trim(), password, name.trim());
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      const mapped = parseApiError(msg);
      setErrors((e) => ({ ...e, ...mapped }));
      focusFirstError(mapped);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <AuthShell title="회원가입 완료" description="계정이 만들어졌어요.">
        <div role="status" className="flex flex-col items-center gap-4 py-4 text-center">
          <CheckCircle2 aria-hidden="true" className="size-14 text-primary" strokeWidth={1.5} />
          <div>
            <p className="text-lg font-bold text-foreground">회원가입이 완료되었습니다!</p>
            <p className="mt-1 text-base text-muted-foreground">로그인하고 BidSignal을 시작해보세요.</p>
          </div>
          <Button asChild className={cn(controlHeight, 'mt-2 w-full font-semibold')}>
            <Link href="/login">로그인하기</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="회원가입"
      description="간단한 정보로 계정을 만들 수 있어요."
      footer={
        <p className="text-base text-muted-foreground">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className={cn('rounded-sm font-medium text-primary hover:underline', focusRing)}>
            로그인
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {errors.server && <FormAlert message={errors.server} />}

        <Field id="name" label="이름" error={errors.name}>
          <Input
            ref={nameRef}
            id="name"
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); clearFieldError('name'); }}
            placeholder="이름을 입력하세요"
            autoComplete="name"
            aria-invalid={!!errors.name || undefined}
            aria-describedby={fieldDescribedBy('name', { error: errors.name })}
            className={inputClass(!!errors.name)}
          />
        </Field>

        <Field id="userId" label="이메일" hint="로그인 아이디로 쓰이고, 마감 임박 알림 메일도 이 주소로 발송돼요." error={errors.userId}>
          <Input
            ref={userIdRef}
            id="userId"
            type="email"
            value={userId}
            onChange={(e) => { setUserId(e.target.value); clearFieldError('userId'); }}
            placeholder="name@company.com"
            autoComplete="email"
            aria-invalid={!!errors.userId || undefined}
            aria-describedby={fieldDescribedBy('userId', { hint: true, error: errors.userId })}
            className={inputClass(!!errors.userId)}
          />
        </Field>

        <Field id="password" label="비밀번호" hint="8자 이상 입력하세요." error={errors.password}>
          <PasswordInput
            ref={passwordRef}
            id="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
            placeholder="비밀번호를 입력하세요"
            autoComplete="new-password"
            invalid={!!errors.password}
            aria-describedby={fieldDescribedBy('password', { hint: true, error: errors.password })}
          />
        </Field>

        {/* 이용약관 동의 */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start gap-3">
            <Checkbox
              ref={termsRef}
              id="agree-terms"
              checked={agreedTerms}
              onCheckedChange={(v) => { setAgreedTerms(!!v); clearFieldError('agreedTerms'); }}
              aria-invalid={!!errors.agreedTerms || undefined}
              aria-describedby={errors.agreedTerms ? 'agree-terms-error' : undefined}
              className="mt-0.5 size-5"
            />
            <label htmlFor="agree-terms" className="cursor-pointer text-base leading-relaxed text-foreground select-none">
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={cn('rounded-sm font-medium text-primary hover:underline', focusRing)}
              >
                이용약관
              </Link>
              에 동의합니다. <span className="text-muted-foreground">(필수)</span>
            </label>
          </div>
          {errors.agreedTerms && (
            <div className="pl-8">
              <FieldError id="agree-terms-error" message={errors.agreedTerms} />
            </div>
          )}
        </div>

        {/* 개인정보 수집·이용 동의 */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start gap-3">
            <Checkbox
              ref={privacyRef}
              id="agree-privacy"
              checked={agreedPrivacy}
              onCheckedChange={(v) => { setAgreedPrivacy(!!v); clearFieldError('agreedPrivacy'); }}
              aria-invalid={!!errors.agreedPrivacy || undefined}
              aria-describedby={errors.agreedPrivacy ? 'agree-privacy-error' : undefined}
              className="mt-0.5 size-5"
            />
            <label htmlFor="agree-privacy" className="cursor-pointer text-base leading-relaxed text-foreground select-none">
              개인정보 수집 및 이용에 동의합니다. <span className="text-muted-foreground">(필수)</span>
            </label>
          </div>
          {errors.agreedPrivacy && (
            <div className="pl-8">
              <FieldError id="agree-privacy-error" message={errors.agreedPrivacy} />
            </div>
          )}

          {/* 개인정보 수집 안내 */}
          <div className="ml-8 rounded-[10px] bg-muted px-4 py-3.5 text-base text-muted-foreground">
            <p>수집 항목: 이름, 이메일, 비밀번호</p>
            <p>이용 목적: 회원 식별, 마감 알림 메일 발송</p>
            <p>보유 기간: 회원 탈퇴 시까지</p>
            <p className="mt-1.5">
              동의를 거부할 수 있으며, 거부하면 회원가입이 제한됩니다. 자세한 내용은{' '}
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className={cn('font-medium text-primary hover:underline', focusRing)}
              >
                개인정보 처리방침
              </Link>
              을 확인해주세요.
            </p>
          </div>
        </div>

        <Button type="submit" disabled={submitting} className={cn(controlHeight, 'mt-1 w-full font-semibold')}>
          {submitting ? '가입 중...' : '회원가입'}
        </Button>
      </form>
    </AuthShell>
  );
}
