'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AuthShell,
  Field,
  FormAlert,
  HELP_EMAIL,
  PasswordInput,
  controlHeight,
  fieldDescribedBy,
  focusRing,
  inputClass,
} from '@/components/auth/AuthForm';
import { cn } from '@/lib/utils';
import { login } from '@/lib/api/auth';

interface FormErrors {
  userId: string;
  password: string;
  auth: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId]         = useState('');
  const [password, setPassword]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]         = useState<FormErrors>({ userId: '', password: '', auth: '' });

  const userIdRef   = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function clearFieldError(field: keyof FormErrors) {
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const next: FormErrors = { userId: '', password: '', auth: '' };
    let hasError = false;

    if (!userId.trim()) {
      next.userId = '이메일을 입력해주세요.';
      hasError = true;
    }
    if (!password.trim()) {
      next.password = '비밀번호를 입력해주세요.';
      hasError = true;
    }

    setErrors(next);
    if (hasError) {
      /* 첫 번째 오류 칸으로 포커스 → 연결된 오류 문구가 함께 낭독됨 */
      (next.userId ? userIdRef : passwordRef).current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await login(userId.trim(), password);
      router.push('/');
    } catch (err) {
      /* fetch 자체가 실패(TypeError)한 경우만 연결 오류로 구분, 그 외는 기존 문구 유지 */
      const message = err instanceof TypeError
        ? '서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.'
        : '아이디 또는 비밀번호를 확인해주세요.';
      setErrors((e) => ({ ...e, auth: message }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="로그인"
      description="가입한 이메일과 비밀번호로 로그인하세요."
      footer={
        <div className="flex flex-col gap-2 text-base">
          <p className="text-muted-foreground">
            계정이 없으신가요?{' '}
            <Link href="/register" className={cn('rounded-sm font-medium text-primary hover:underline', focusRing)}>
              회원가입
            </Link>
          </p>
          {/* 문장은 이메일 앞에서 줄을 나누고, 이메일+조사는 한 덩어리(whitespace-nowrap)로 */}
          <p className="text-muted-foreground">
            아이디나 비밀번호를 잊으셨다면
            <br />
            <span className="whitespace-nowrap">
              <a href={`mailto:${HELP_EMAIL}`} className={cn('rounded-sm font-medium text-primary hover:underline', focusRing)}>
                {HELP_EMAIL}
              </a>
              으로
            </span>{' '}
            문의해 주세요.
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate aria-describedby={errors.auth ? 'login-auth-error' : undefined}>
        {errors.auth && <FormAlert id="login-auth-error" message={errors.auth} />}

        <Field id="userId" label="이메일" error={errors.userId}>
          <Input
            ref={userIdRef}
            id="userId"
            type="email"
            value={userId}
            onChange={(e) => { setUserId(e.target.value); clearFieldError('userId'); clearFieldError('auth'); }}
            placeholder="name@company.com"
            autoComplete="email"
            aria-invalid={!!errors.userId || undefined}
            aria-describedby={fieldDescribedBy('userId', { error: errors.userId })}
            className={inputClass(!!errors.userId)}
          />
        </Field>

        <Field id="password" label="비밀번호" error={errors.password}>
          <PasswordInput
            ref={passwordRef}
            id="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); clearFieldError('auth'); }}
            placeholder="비밀번호를 입력하세요"
            autoComplete="current-password"
            invalid={!!errors.password}
            aria-describedby={fieldDescribedBy('password', { error: errors.password })}
          />
        </Field>

        <Button type="submit" disabled={submitting} className={cn(controlHeight, 'mt-1 w-full font-semibold')}>
          {submitting ? '로그인 중...' : '로그인'}
        </Button>
      </form>
    </AuthShell>
  );
}
