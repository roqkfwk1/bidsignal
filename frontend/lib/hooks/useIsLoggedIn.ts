import { useSyncExternalStore } from 'react';
import { ACCESS_TOKEN_KEY } from '@/lib/api';

/**
 * 로그인 여부(액세스 토큰 존재)를 읽기만 하는 훅. 인증 로직은 바꾸지 않는다.
 * 리다이렉트는 useRequireAuth가 담당하고, 이 훅은 리다이렉트 직전 화면에 무엇을 그릴지 정하는 데만 쓴다.
 */
function subscribeAuthChange(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('authchange', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('authchange', callback);
  };
}

const getSnapshot = () => !!localStorage.getItem(ACCESS_TOKEN_KEY);
/* SSR에선 로딩 화면을 그리도록 로그인으로 가정 (관심 공고 화면과 동일) */
const getServerSnapshot = () => true;

export function useIsLoggedIn(): boolean {
  return useSyncExternalStore(subscribeAuthChange, getSnapshot, getServerSnapshot);
}
