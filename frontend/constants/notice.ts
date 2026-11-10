import { WatchlistStatus } from '@/types/notice';

/* 관심 공고 상태 라벨 색 (globals.css 시맨틱 토큰). 라벨 텍스트(WATCHLIST_STATUS_LABEL)와 항상 함께 쓴다. */
export const STATUS_COLOR: Record<WatchlistStatus, string> = {
  REVIEWING: 'bg-muted text-foreground',
  PREPARING: 'bg-accent text-primary',
  SUBMITTED: 'bg-primary text-primary-foreground',
  DROPPED: 'bg-destructive-soft text-destructive',
};

export const DDAY_WARNING_THRESHOLD = 3;
