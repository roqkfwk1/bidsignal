import { WatchlistStatus } from '@/types/notice';

export const STATUS_COLOR: Record<WatchlistStatus, string> = {
  REVIEWING: 'bg-gray-100 text-gray-700',
  PREPARING: 'bg-blue-50 text-blue-800',
  SUBMITTED: 'bg-green-100 text-green-800',
  DROPPED: 'bg-red-100 text-red-800',
};

export const DDAY_WARNING_THRESHOLD = 3;
export const DDAY_DANGER_THRESHOLD = 1;
