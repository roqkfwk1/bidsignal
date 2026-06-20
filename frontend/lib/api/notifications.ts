import { apiFetch } from '../api';
import type { NotificationHistory, NotificationSettings, PageResponse } from '@/types/notice';

export async function getNotificationHistories(
  page = 0,
  size = 20
): Promise<PageResponse<NotificationHistory>> {
  return apiFetch<PageResponse<NotificationHistory>>(
    `/notification-histories?page=${page}&size=${size}`
  );
}

export async function markNotificationRead(id: number): Promise<void> {
  return apiFetch<void>(`/notification-histories/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead(): Promise<void> {
  return apiFetch<void>('/notification-histories/read-all', { method: 'PATCH' });
}

export async function getUnreadCount(): Promise<number> {
  return apiFetch<number>('/notification-histories/unread-count');
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  return apiFetch<NotificationSettings>('/notification-settings/me');
}

export async function updateNotificationSettings(
  settings: NotificationSettings
): Promise<void> {
  return apiFetch<void>('/notification-settings/me', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}
