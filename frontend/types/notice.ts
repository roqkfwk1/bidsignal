export type NoticeStatus = 'urgent' | 'corrected' | 'new' | 'review';

export interface Notice {
  id: number;
  name: string;
  agency: string;
  bidNo: string;
  deadline: string;
  deadlineTime: string;
  dDay: number;
  status: NoticeStatus;
  todo: string;
  amount: string;
  contractType: string;
  category: string;
  region: string;
  isBookmarked: boolean;
  isModified: boolean;
  matchScore?: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  category: string;
}

export interface AlertItem {
  id: string;
  type: 'urgent' | 'new' | 'system';
  title: string;
  description: string;
  createdAt: string;
  isRead: boolean;
  noticeId?: number;
}

export interface SearchCondition {
  id: string;
  name: string;
  regions: string[];
  categories: string[];
  agencyTypes: string[];
  amountRange: string;
  keywords: string;
  urgentAlertEnabled: boolean;
}

export type WatchlistStatus = 'REVIEWING' | 'PREPARING' | 'SUBMITTED' | 'DROPPED';

export const WATCHLIST_STATUS_LABEL: Record<WatchlistStatus, string> = {
  REVIEWING: '검토중',
  PREPARING: '준비중',
  SUBMITTED: '제출완료',
  DROPPED: '포기',
};

export interface SavedNotice extends Notice {
  watchlistStatus: WatchlistStatus;
  memo: string;
  savedAt: string;
}
