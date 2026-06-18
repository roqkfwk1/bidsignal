import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ACCESS_TOKEN_KEY } from '@/lib/api';

/** 비로그인 상태면 /login으로 리다이렉트하는 훅. 인증 필요 페이지에서 호출. */
export function useRequireAuth() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem(ACCESS_TOKEN_KEY)) {
      router.replace('/login');
    }
  }, [router]);
}
