import { useSyncExternalStore } from 'react';
import { ACCESS_TOKEN_KEY } from '@/lib/api';

/**
 * 로그인 여부(액세스 토큰 존재)를 읽기만 하는 훅. 인증 로직은 바꾸지 않는다.
 * 리다이렉트는 useRequireAuth가 담당하고, 이 훅은 리다이렉트 직전 화면에 무엇을 그릴지 정하는 데만 쓴다.
 */
export function subscribeAuthChange(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('authchange', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('authchange', callback);
  };
}

const getSnapshot = () => !!localStorage.getItem(ACCESS_TOKEN_KEY);

/**
 * @param serverValue SSR/하이드레이션 시점에 쓸 기본값. 화면마다 로그인 전제로 그리거나
 * (기본 true) 비로그인 전제로 그려야 하는 경우(false)가 달라서 호출하는 쪽에서 고를 수 있게 둔다.
 */
export function useIsLoggedIn(serverValue = true): boolean {
  const getServerSnapshot = () => serverValue;
  return useSyncExternalStore(subscribeAuthChange, getSnapshot, getServerSnapshot);
}
