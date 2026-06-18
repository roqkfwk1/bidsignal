'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [name, setName]                 = useState('');
  const [userId, setUserId]             = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone]               = useState('');
  const [agreed, setAgreed]             = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [errors, setErrors]             = useState<FormErrors>(EMPTY_ERRORS);
  const [success, setSuccess]           = useState(false);

  function clearFieldError(field: keyof FormErrors) {
    setErrors((e) => ({ ...e, [field]: '' }));
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
    if (hasError) return;

    setSubmitting(true);
    try {
      await signup(userId.trim(), password, name.trim(), phone.trim() || undefined);
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setErrors((e) => ({ ...e, ...parseApiError(msg) }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-lg px-4">
      {/* 로고 */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <Zap className="size-5 text-blue-600 fill-blue-600" />
        <span className="text-xl font-bold text-blue-600 tracking-tight">BidSignal</span>
      </div>

      {/* 카드 */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        {success ? (
          /* ── 가입 완료 화면 ── */
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2 className="size-16 text-green-500" strokeWidth={1.5} />
            <div>
              <h2 className="text-xl font-bold text-gray-900">회원가입이 완료되었습니다!</h2>
              <p className="text-base text-gray-500 mt-2">
                로그인하고 BidSignal을 시작해보세요.
              </p>
            </div>
            <Button
              asChild
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold mt-2"
            >
              <Link href="/login">로그인하기</Link>
            </Button>
          </div>
        ) : (
          /* ── 회원가입 폼 ── */
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">회원가입</h2>
            <p className="text-sm text-gray-500 mb-6">간단한 정보를 입력하면 됩니다.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              {/* 서버 에러 배너 */}
              {errors.server && (
                <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {errors.server}
                </div>
              )}

              {/* 이름 */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-sm font-medium text-gray-700">이름</label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearFieldError('name'); }}
                  placeholder="이름을 입력하세요"
                  className={cn('h-11 text-base', errors.name && 'border-red-500 focus-visible:ring-red-300')}
                  autoComplete="name"
                />
                {errors.name && (
                  <p className="text-sm text-red-500" role="alert">{errors.name}</p>
                )}
              </div>

              {/* 이메일 */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="userId" className="text-sm font-medium text-gray-700">이메일</label>
                <Input
                  id="userId"
                  type="email"
                  value={userId}
                  onChange={(e) => { setUserId(e.target.value); clearFieldError('userId'); }}
                  placeholder="이메일을 입력하세요"
                  className={cn('h-11 text-base', errors.userId && 'border-red-500 focus-visible:ring-red-300')}
                  autoComplete="email"
                />
                {errors.userId && (
                  <p className="text-sm text-red-500" role="alert">{errors.userId}</p>
                )}
              </div>

              {/* 비밀번호 */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">비밀번호</label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                    placeholder="8자 이상 입력하세요"
                    className={cn('h-11 text-base pr-11', errors.password && 'border-red-500 focus-visible:ring-red-300')}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500" role="alert">{errors.password}</p>
                )}
              </div>

              {/* 휴대폰 번호 (선택) */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  휴대폰 번호{' '}
                  <span className="font-normal text-gray-400">(선택)</span>
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-0000-0000 (선택사항)"
                  className="h-11 text-base"
                  autoComplete="tel"
                  inputMode="numeric"
                />
              </div>

              {/* 이용약관 동의 */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="agree"
                    checked={agreed}
                    onCheckedChange={(v) => { setAgreed(!!v); clearFieldError('agreed'); }}
                    className={cn('size-4 mt-0.5 flex-shrink-0', errors.agreed && 'border-red-500')}
                  />
                  <label
                    htmlFor="agree"
                    className="text-sm text-gray-700 leading-relaxed cursor-pointer select-none"
                  >
                    이용약관 및 개인정보 처리방침에 동의합니다.{' '}
                    <button
                      type="button"
                      onClick={() => alert('준비 중입니다.')}
                      className="text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2"
                    >
                      약관 보기
                    </button>
                  </label>
                </div>
                {errors.agreed && (
                  <p className="text-sm text-red-500 ml-6" role="alert">{errors.agreed}</p>
                )}
              </div>

              {/* 회원가입 버튼 */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold mt-1"
              >
                {submitting ? '가입 중...' : '회원가입'}
              </Button>
            </form>

            {/* 로그인 안내 */}
            <p className="text-sm text-center mt-6 text-gray-500">
              이미 계정이 있으신가요?{' '}
              <Link
                href="/login"
                className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
              >
                로그인
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
