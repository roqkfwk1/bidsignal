import { apiFetch } from '../api';
import type { DashboardSummary } from '@/types/notice';

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>('/dashboard/summary');
}
