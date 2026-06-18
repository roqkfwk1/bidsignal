export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const ACCESS_TOKEN_KEY  = 'bidsignal_access_token';
const REFRESH_TOKEN_KEY = 'bidsignal_refresh_token';

export { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY };

async function reissueToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/users/reissue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = (json.data ?? json) as { accessToken: string; refreshToken?: string };
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    if (data.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  function buildHeaders(token?: string | null): Record<string, string> {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }

  const accessToken =
    typeof window !== 'undefined'
      ? localStorage.getItem(ACCESS_TOKEN_KEY)
      : null;

  let res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(accessToken),
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    const newToken = await reissueToken();
    if (newToken) {
      res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: buildHeaders(newToken),
      });
    } else {
      const hadToken = !!accessToken;
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      if (hadToken) {
        /* 로그인 세션이 만료된 경우에만 /login으로 이동. 비로그인 상태(토큰 없음)에서
           공개 API가 401을 반환하는 경우에는 리다이렉트하지 않고 예외만 던진다. */
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }
  }

  if (!res.ok) {
    const errJson = await res.json().catch(() => null) as { message?: string } | null;
    throw new Error(errJson?.message ?? `API error: ${res.status}`);
  }

  // 204 No Content 또는 빈 응답 처리
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;

  const json = JSON.parse(text) as Record<string, unknown>;
  // ApiResponse 래퍼 벗기기
  if (json && 'data' in json && 'success' in json) {
    return json.data as T;
  }
  return json as T;
}
