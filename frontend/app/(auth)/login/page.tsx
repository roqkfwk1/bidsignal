'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { login } from '@/lib/api/auth';

interface FormErrors {
  userId: string;
  password: string;
  auth: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId]               = useState('');
  const [password, setPassword]           = useState('');
  const [showPassword, setShowPassword]   = useState(false);
  const [saveId, setSaveId]               = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [errors, setErrors]              = useState<FormErrors>({ userId: '', password: '', auth: '' });

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
    if (hasError) return;

    setSubmitting(true);
    try {
      await login(userId.trim(), password);
      router.push('/');
    } catch {
      setErrors((e) => ({ ...e, auth: '아이디 또는 비밀번호를 확인해주세요.' }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md px-4">
      {/* 로고 */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <Zap className="size-5 text-blue-600 fill-blue-600" />
        <span className="text-xl font-bold text-blue-600 tracking-tight">BidSignal</span>
      </div>

      {/* 카드 */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-1">로그인</h2>
        <p className="text-sm text-gray-500 mb-6">계정으로 로그인하세요.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* 인증 에러 배너 */}
          {errors.auth && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
            >
              {errors.auth}
            </div>
          )}

          {/* 이메일 */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="userId" className="text-sm font-medium text-gray-700">
              이메일
            </label>
            <Input
              id="userId"
              type="email"
              value={userId}
              onChange={(e) => { setUserId(e.target.value); clearFieldError('userId'); clearFieldError('auth'); }}
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
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              비밀번호
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); clearFieldError('auth'); }}
                placeholder="비밀번호를 입력하세요"
                className={cn('h-11 text-base pr-11', errors.password && 'border-red-500 focus-visible:ring-red-300')}
                autoComplete="current-password"
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

          {/* 아이디 저장 */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              id="saveId"
              checked={saveId}
              onCheckedChange={(v) => setSaveId(!!v)}
              className="size-4"
            />
            <span className="text-sm text-gray-600">아이디 저장</span>
          </label>

          {/* 로그인 버튼 */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold mt-1"
          >
            {submitting ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        {/* 아이디/비밀번호 찾기 */}
        <div className="flex items-center justify-center gap-4 mt-4 text-sm">
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            아이디 찾기
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            비밀번호 찾기
          </button>
        </div>

        {/* 회원가입 안내 */}
        <p className="text-sm text-center mt-6 text-gray-500">
          계정이 없으신가요?{' '}
          <Link
            href="/register"
            className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
          >
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
