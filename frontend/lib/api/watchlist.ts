import { apiFetch } from '../api';
import type {
  WatchlistItem,
  WatchlistSaveResult,
  ChecklistItemResponse,
  ChecklistResponse,
} from '@/types/notice';

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

export async function getChecklist(noticeId: number): Promise<ChecklistResponse> {
  return apiFetch<ChecklistResponse>(`/watchlist/${noticeId}/checklist`);
}

export async function toggleChecklistItem(
  noticeId: number,
  itemId: number,
  checked: boolean
): Promise<ChecklistItemResponse> {
  return apiFetch<ChecklistItemResponse>(`/watchlist/${noticeId}/checklist/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ checked }),
  });
}

export async function addChecklistItem(
  noticeId: number,
  title: string
): Promise<ChecklistItemResponse> {
  return apiFetch<ChecklistItemResponse>(`/watchlist/${noticeId}/checklist/items`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}
