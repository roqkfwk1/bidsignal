'use client';

import { useEffect, useRef, useState } from 'react';
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
import { ApiError } from '@/lib/api';
import { sendEmailVerificationCode, signup, verifyEmailCode } from '@/lib/api/auth';

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

type VerifyStatus = 'idle' | 'sent' | 'verified';

const CODE_VALID_MS = 5 * 60 * 1000;
const RESEND_WAIT_MS = 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_EXPIRED_MESSAGE = '인증번호가 만료되었어요. 다시 받아 주세요.';

const VERIFICATION_ERROR_MESSAGE: Record<string, string> = {
  EMAIL_VERIFICATION_TOO_FREQUENT: '잠시 후 다시 요청해 주세요. 재발송은 60초 뒤에 가능해요.',
  EMAIL_VERIFICATION_CODE_NOT_FOUND: CODE_EXPIRED_MESSAGE,
  INVALID_EMAIL_VERIFICATION_CODE: '인증번호가 맞지 않아요.',
  EMAIL_VERIFICATION_ATTEMPTS_EXCEEDED: '시도 횟수를 초과했어요. 인증번호를 다시 받아 주세요.',
  EMAIL_SEND_FAILED: '메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.',
};

function verificationErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError) || !err.code) return fallback;
  if (VERIFICATION_ERROR_MESSAGE[err.code]) return VERIFICATION_ERROR_MESSAGE[err.code];
  // 이미 가입된 이메일, 형식 오류는 서버 문구를 그대로 쓴다 ("email: ..." 접두어 제거)
  if (err.code === 'DUPLICATE_EMAIL' || err.code === 'INVALID_INPUT_VALUE') {
    return err.message.replace(/^\w+: /, '');
  }
  return fallback;
}

function formatRemaining(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
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

  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('idle');
  const [code, setCode]                 = useState('');
  const [codeError, setCodeError]       = useState('');
  const [sending, setSending]           = useState(false);
  const [verifying, setVerifying]       = useState(false);
  const [codeExpiresAt, setCodeExpiresAt] = useState<number | null>(null);
  const [resendAt, setResendAt]         = useState<number | null>(null);
  const [now, setNow]                   = useState(0);

  const nameRef     = useRef<HTMLInputElement>(null);
  const userIdRef   = useRef<HTMLInputElement>(null);
  const codeRef     = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const termsRef    = useRef<HTMLButtonElement>(null);
  const privacyRef  = useRef<HTMLButtonElement>(null);

  const email = userId.trim();
  const emailValid = EMAIL_PATTERN.test(email);
  const verified = verifyStatus === 'verified';
  const codeRemaining = codeExpiresAt ? Math.max(0, Math.ceil((codeExpiresAt - now) / 1000)) : 0;
  const resendRemaining = resendAt ? Math.max(0, Math.ceil((resendAt - now) / 1000)) : 0;
  const codeExpired = verifyStatus === 'sent' && codeRemaining === 0;

  // 유효시간·재발송 카운트다운
  useEffect(() => {
    if (codeExpiresAt === null && resendAt === null) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [codeExpiresAt, resendAt]);

  // 코드 입력칸이 나타나면 그쪽으로, 인증이 끝나면 다음 입력으로 포커스를 옮긴다
  useEffect(() => {
    if (verifyStatus === 'sent') codeRef.current?.focus();
    if (verifyStatus === 'verified') passwordRef.current?.focus();
  }, [verifyStatus]);

  function clearFieldError(field: keyof FormErrors) {
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  function resetVerification() {
    setVerifyStatus('idle');
    setCode('');
    setCodeError('');
    setCodeExpiresAt(null);
    setResendAt(null);
  }

  function handleEmailChange(value: string) {
    setUserId(value);
    clearFieldError('userId');
    // 다른 주소로 바꾸면 이전에 보낸 인증번호는 쓸 수 없다
    if (verifyStatus === 'sent') resetVerification();
  }

  function handleChangeEmail() {
    resetVerification();
    clearFieldError('userId');
    userIdRef.current?.focus();
  }

  async function handleSendCode() {
    if (!emailValid || sending || resendRemaining > 0) return;

    setSending(true);
    clearFieldError('userId');
    try {
      await sendEmailVerificationCode(email);
      const sentAt = Date.now();
      setNow(sentAt);
      setCodeExpiresAt(sentAt + CODE_VALID_MS);
      setResendAt(sentAt + RESEND_WAIT_MS);
      setCode('');
      setCodeError('');
      setVerifyStatus('sent');
    } catch (err) {
      const message = verificationErrorMessage(err, '인증번호를 보내지 못했어요. 잠시 후 다시 시도해 주세요.');
      setErrors((e) => ({ ...e, userId: message }));
    } finally {
      setSending(false);
    }
  }

  async function handleVerifyCode() {
    if (code.length !== 6 || verifying || codeExpired) return;

    setVerifying(true);
    setCodeError('');
    try {
      await verifyEmailCode(email, code);
      setCodeExpiresAt(null);
      setResendAt(null);
      setCode('');
      setVerifyStatus('verified');
    } catch (err) {
      setCodeError(verificationErrorMessage(err, '인증하지 못했어요. 잠시 후 다시 시도해 주세요.'));
      // 서버에서 코드가 폐기된 경우: 입력을 막고 다시 받게 한다
      if (err instanceof ApiError
        && (err.code === 'EMAIL_VERIFICATION_CODE_NOT_FOUND' || err.code === 'EMAIL_VERIFICATION_ATTEMPTS_EXCEEDED')) {
        setCodeExpiresAt(Date.now());
      }
    } finally {
      setVerifying(false);
    }
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
    } else if (!verified) {
      next.userId = '이메일 인증을 완료해 주세요.';
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
      if (err instanceof ApiError && err.code === 'EMAIL_NOT_VERIFIED') {
        resetVerification();
        setErrors((e) => ({ ...e, userId: '이메일 인증이 만료되었어요. 다시 인증해 주세요.' }));
        userIdRef.current?.focus();
        return;
      }
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

        <Field id="userId" label="이메일">
          <div className="flex gap-2">
            <Input
              ref={userIdRef}
              id="userId"
              type="email"
              value={userId}
              onChange={(e) => handleEmailChange(e.target.value)}
              readOnly={verified}
              placeholder="name@company.com"
              autoComplete="email"
              aria-invalid={!!errors.userId || undefined}
              aria-describedby={[
                fieldDescribedBy('userId', { hint: true, error: errors.userId }),
                verified ? 'userId-verified' : '',
              ].filter(Boolean).join(' ')}
              className={inputClass(!!errors.userId, cn('min-w-0 flex-1', verified && 'bg-muted'))}
            />
            {verified ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleChangeEmail}
                className={cn(controlHeight, 'px-4')}
              >
                이메일 변경
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={handleSendCode}
                disabled={!emailValid || sending || resendRemaining > 0}
                className={cn(controlHeight, 'px-4 tabular-nums')}
              >
                {sending
                  ? '보내는 중...'
                  : resendRemaining > 0
                    ? `재발송 (${resendRemaining}초)`
                    : verifyStatus === 'sent' ? '재발송' : '인증번호 받기'}
              </Button>
            )}
          </div>
          <p id="userId-hint" className="text-base text-muted-foreground">
            로그인 아이디로 쓰이고, 마감 임박 알림 메일도 이 주소로 발송돼요.
          </p>
          <div aria-live="polite">
            {errors.userId && <FieldError id="userId-error" message={errors.userId} />}
            {verified && (
              <p id="userId-verified" className="flex items-center gap-1.5 text-base font-medium text-primary">
                <CheckCircle2 aria-hidden="true" className="size-5 shrink-0" />
                인증 완료
              </p>
            )}
          </div>
        </Field>

        {verifyStatus === 'sent' && (
          <div className="flex flex-col gap-3 rounded-[10px] bg-muted px-4 py-4 sm:px-5">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="verifyCode" className="text-base font-medium text-foreground">
                인증번호
              </label>
              <span className="text-base text-muted-foreground tabular-nums">
                남은 시간 <span className="font-semibold text-foreground">{formatRemaining(codeRemaining)}</span>
              </span>
            </div>
            <p id="verifyCode-hint" className="-mt-1 text-base break-all text-muted-foreground">
              {email}(으)로 보낸 6자리 숫자를 입력하세요.
            </p>
            <div className="flex gap-2">
              <Input
                ref={codeRef}
                id="verifyCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setCodeError(''); }}
                onKeyDown={(e) => {
                  // 엔터로 회원가입 폼이 제출되지 않게 막고 인증을 확인한다
                  if (e.key === 'Enter') { e.preventDefault(); handleVerifyCode(); }
                }}
                disabled={codeExpired}
                placeholder="000000"
                aria-invalid={!!codeError || undefined}
                aria-describedby={codeError || codeExpired ? 'verifyCode-hint verifyCode-error' : 'verifyCode-hint'}
                className={inputClass(!!codeError, 'min-w-0 flex-1 tracking-[0.3em] tabular-nums')}
              />
              <Button
                type="button"
                onClick={handleVerifyCode}
                disabled={code.length !== 6 || verifying || codeExpired}
                className={cn(controlHeight, 'px-5 font-semibold')}
              >
                {verifying ? '확인 중...' : '확인'}
              </Button>
            </div>
            <div aria-live="polite">
              {(codeError || codeExpired) && (
                <FieldError id="verifyCode-error" message={codeError || CODE_EXPIRED_MESSAGE} />
              )}
            </div>
          </div>
        )}

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

        <div className="mt-1 flex flex-col gap-2">
          <Button
            type="submit"
            disabled={submitting || !verified}
            aria-describedby={verified ? undefined : 'submit-hint'}
            className={cn(controlHeight, 'w-full font-semibold')}
          >
            {submitting ? '가입 중...' : '회원가입'}
          </Button>
          {!verified && (
            <p id="submit-hint" className="text-center text-base text-muted-foreground">
              이메일 인증을 마치면 가입할 수 있어요.
            </p>
          )}
        </div>
      </form>
    </AuthShell>
  );
}
