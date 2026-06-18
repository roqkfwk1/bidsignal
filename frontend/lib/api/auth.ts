import { apiFetch, BASE_URL, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../api';
import type { TokenResponse, UserResponse } from '@/types/notice';

export async function signup(
  email: string,
  password: string,
  nickname: string,
  phoneNumber?: string
): Promise<UserResponse> {
  return apiFetch<UserResponse>('/users/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, nickname, phoneNumber }),
  });
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const res = await fetch(`${BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => null) as { message?: string } | null;
    throw new Error(errJson?.message ?? `API error: ${res.status}`);
  }

  const text = await res.text();
  const json = JSON.parse(text) as Record<string, unknown>;
  const tokens = ('data' in json && 'success' in json ? json.data : json) as TokenResponse;

  if (typeof window !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }
  return tokens;
}

export async function logout(): Promise<void> {
  try {
    await apiFetch<void>('/users/logout', { method: 'POST' });
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      window.location.href = '/login';
    }
  }
}

export async function reissue(refreshToken: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>('/users/reissue', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

export async function getMyInfo(): Promise<UserResponse> {
  return apiFetch<UserResponse>('/users/me');
}
