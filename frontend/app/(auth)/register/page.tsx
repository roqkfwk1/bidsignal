'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

/* 중복 아이디 mock 목록 — API 연동 후 제거 */
const MOCK_EXISTING_IDS = ['admin', 'test'];

interface FormErrors {
  name: string;
  userId: string;
  password: string;
  agreed: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName]               = useState('');
  const [userId, setUserId]           = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone]             = useState('');
  const [agreed, setAgreed]           = useState(false);
  const [errors, setErrors]           = useState<FormErrors>({ name: '', userId: '', password: '', agreed: '' });

  function clearFieldError(field: keyof FormErrors) {
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const next: FormErrors = { name: '', userId: '', password: '', agreed: '' };
    let hasError = false;

    if (!name.trim()) {
      next.name = '이름을 입력해주세요.';
      hasError = true;
    }
    if (!userId.trim()) {
      next.userId = '아이디를 입력해주세요.';
      hasError = true;
    } else if (MOCK_EXISTING_IDS.includes(userId.trim())) {
      next.userId = '이미 사용 중인 아이디예요.';
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

    router.push('/login');
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
        <h2 className="text-xl font-bold text-gray-900 mb-1">회원가입</h2>
        <p className="text-sm text-gray-500 mb-6">간단한 정보를 입력하면 됩니다.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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

          {/* 아이디 */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="userId" className="text-sm font-medium text-gray-700">아이디</label>
            <Input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => { setUserId(e.target.value); clearFieldError('userId'); }}
              placeholder="아이디를 입력하세요"
              className={cn('h-11 text-base', errors.userId && 'border-red-500 focus-visible:ring-red-300')}
              autoComplete="username"
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
                placeholder="비밀번호를 입력하세요"
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
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold mt-1"
          >
            회원가입
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
      </div>
    </div>
  );
}
