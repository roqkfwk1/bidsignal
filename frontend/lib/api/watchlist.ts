import { apiFetch } from '../api';
import type { WatchlistItem, WatchlistSaveResult } from '@/types/notice';

export async function getWatchlist(): Promise<WatchlistItem[]> {
  return apiFetch<WatchlistItem[]>('/watchlist');
}

export async function saveWatchlist(noticeId: number): Promise<WatchlistSaveResult> {
  return apiFetch<WatchlistSaveResult>(`/watchlist/${noticeId}`, {
    method: 'POST',
  });
}

export async function deleteWatchlist(noticeId: number): Promise<void> {
  return apiFetch<void>(`/watchlist/${noticeId}`, {
    method: 'DELETE',
  });
}

export async function updateWatchlistStatus(
  noticeId: number,
  status: string
): Promise<void> {
  return apiFetch<void>(`/watchlist/${noticeId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function updateWatchlistMemo(
  noticeId: number,
  memo: string
): Promise<void> {
  return apiFetch<void>(`/watchlist/${noticeId}/memo`, {
    method: 'PATCH',
    body: JSON.stringify({ memo }),
  });
}
