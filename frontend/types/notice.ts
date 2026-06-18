export type NoticeStatus = 'urgent' | 'corrected' | 'new' | 'review';

// ── 백엔드 공통 응답 래퍼 ──────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  code: string;
  data: T;
  message: string;
}

// ── 백엔드 공고 목록 응답 ─────────────────────────────────────────────
export interface NoticeListItem {
  id: number;
  bidNtceNo: string;
  bidNtceOrd: string;
  bidNtceNm: string;
  ntceInsttNm: string;
  dminsttNm: string | null;
  bidType: 'GOODS' | 'SERVICE' | 'CONSTRUCTION' | 'FOREIGN' | 'ETC';
  ntceKindNm: string;
  prtcptLmtRgnNm: string;
  bidClseDt: string;
  bdgtAmt: number;
  bidNtceDtlUrl: string;
}

// ── 백엔드 공고 상세 응답 ─────────────────────────────────────────────
export interface NoticeDetail extends NoticeListItem {
  reNtceYn: string;
  bidNtceDt: string;
  bidBeginDt: string;
  opengDt: string;
  rgstDt: string;
  chgDt: string;
  presmptPrce: number;
  cntrctCnclsMthdNm: string;
  bidMethdNm: string;
}

// ── 백엔드 관심 공고 응답 ─────────────────────────────────────────────
export interface WatchlistItem {
  watchlistItemId: number;
  noticeId: number;
  bidNtceNo: string;
  bidNtceOrd: string;
  bidNtceNm: string;
  ntceInsttNm: string;
  bidClseDt: string;
  status: WatchlistStatus;
  memo: string;
  dDay: number | null;
}

// ── 백엔드 관심 공고 저장 응답 ───────────────────────────────────────
export interface WatchlistSaveResult {
  watchlistItemId: number;
  noticeId: number;
  status: WatchlistStatus;
  createdAt: string;
}

// ── 백엔드 공고 검색 요청 ─────────────────────────────────────────────
export interface NoticeSearchParams {
  keyword?: string;
  bidTypes?: string[];
  prtcptLmtRgnNm?: string;
  minAmt?: number;
  maxAmt?: number;
  bidClseDateFrom?: string;
  bidClseDateTo?: string;
  includeExpired?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

// ── 백엔드 대시보드 응답 ─────────────────────────────────────────────
export interface DashboardSummary {
  urgentCount: number;
  preparingCount: number;
  weeklyCount: number;
}

// ── 백엔드 페이지 응답 ───────────────────────────────────────────────
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ── 토큰 응답 ────────────────────────────────────────────────────────
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

// ── 유저 응답 ────────────────────────────────────────────────────────
export interface UserResponse {
  id: number;
  email: string;
  nickname: string;
  phoneNumber: string;
}

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
  region: string;           // 선택된 시도 (빈 문자열 = 전체)
  bidTypes: string[];       // BidType 코드 배열 (예: ['CONSTRUCTION', 'SERVICE'])
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
