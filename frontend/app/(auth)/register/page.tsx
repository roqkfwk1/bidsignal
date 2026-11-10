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
  agreed: string;
  server: string;
}

const EMPTY_ERRORS: FormErrors = { name: '', userId: '', password: '', agreed: '', server: '' };

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
  const [name, setName]             = useState('');
  const [userId, setUserId]         = useState('');
  const [password, setPassword]     = useState('');
  const [phone, setPhone]           = useState('');
  const [agreed, setAgreed]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]         = useState<FormErrors>(EMPTY_ERRORS);
  const [success, setSuccess]       = useState(false);

  const nameRef     = useRef<HTMLInputElement>(null);
  const userIdRef   = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const agreeRef    = useRef<HTMLButtonElement>(null);

  function clearFieldError(field: keyof FormErrors) {
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  function focusFirstError(errs: Partial<FormErrors>) {
    if (errs.name) nameRef.current?.focus();
    else if (errs.userId) userIdRef.current?.focus();
    else if (errs.password) passwordRef.current?.focus();
    else if (errs.agreed) agreeRef.current?.focus();
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
    if (!agreed) {
      next.agreed = '이용약관에 동의해주세요.';
      hasError = true;
    }

    setErrors(next);
    if (hasError) {
      focusFirstError(next);
      return;
    }

    setSubmitting(true);
    try {
      await signup(userId.trim(), password, name.trim(), phone.trim() || undefined);
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

        <Field id="phone" label="휴대폰 번호" optional hint="입력하지 않아도 가입할 수 있어요.">
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-0000-0000"
            autoComplete="tel"
            inputMode="numeric"
            aria-describedby={fieldDescribedBy('phone', { hint: true })}
            className={inputClass(false)}
          />
        </Field>

        {/* 이용약관 동의 */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start gap-3">
            <Checkbox
              ref={agreeRef}
              id="agree"
              checked={agreed}
              onCheckedChange={(v) => { setAgreed(!!v); clearFieldError('agreed'); }}
              aria-invalid={!!errors.agreed || undefined}
              aria-describedby={errors.agreed ? 'agree-error' : undefined}
              className="mt-0.5 size-5"
            />
            <label htmlFor="agree" className="cursor-pointer text-base leading-relaxed text-foreground select-none">
              이용약관 및 개인정보 처리방침에 동의합니다. <span className="text-muted-foreground">(필수)</span>
            </label>
          </div>
          {errors.agreed && (
            <div className="pl-8">
              <FieldError id="agree-error" message={errors.agreed} />
            </div>
          )}
        </div>

        <Button type="submit" disabled={submitting} className={cn(controlHeight, 'mt-1 w-full font-semibold')}>
          {submitting ? '가입 중...' : '회원가입'}
        </Button>
      </form>
    </AuthShell>
  );
}
