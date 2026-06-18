import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { NoticeStatus } from "@/types/notice"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** ISO 날짜문자열에서 D-day 계산 (오늘 기준) */
export function computeDDay(isoDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(isoDateStr);
  deadline.setHours(0, 0, 0, 0);
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** ISO 날짜문자열을 "YYYY-MM-DD" 형식으로 변환. null/undefined이면 "-" 반환 */
export function formatIsoDate(isoDateStr: string | null | undefined): string {
  if (!isoDateStr) return '-';
  return isoDateStr.split('T')[0];
}

/** 원 단위 금액을 억원/천만원 단위 한국어 문자열로 변환 */
export function formatWon(won: number | null | undefined): string {
  if (!won || won === 0) return '금액 미정';
  const eok = Math.floor(won / 100_000_000);
  const remainder = won % 100_000_000;
  const cheonman = Math.floor(remainder / 10_000_000);
  if (eok === 0) return `${cheonman}천만원`;
  if (cheonman === 0) return `${eok}억원`;
  return `${eok}억 ${cheonman}천만원`;
}

/** bidType 영문 코드를 한국어로 변환 */
export function bidTypeToKorean(bidType: string): string {
  const map: Record<string, string> = {
    GOODS: '물품',
    SERVICE: '용역',
    CONSTRUCTION: '공사',
    FOREIGN: '외자',
    ETC: '기타',
  };
  return map[bidType] ?? bidType;
}

/** 공고 상태 파생: reNtceYn, dDay로 NoticeStatus 결정 */
export function deriveNoticeStatus(dDay: number, reNtceYn?: string): NoticeStatus {
  if (reNtceYn === 'Y') return 'corrected';
  if (dDay <= 3) return 'urgent';
  return 'new';
}

/** 전화번호를 010-1234-5678 형식으로 변환 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return phone;
  if (phone.includes('-')) return phone;
  if (phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
}

/** 참가 제한 지역 표시: 값 없으면 "전국" */
export function formatRegion(region: string | null | undefined): string {
  return region?.trim() ? region : '전국';
}

/** 17개 시도 목록 */
export const REGIONS = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시',
  '대전광역시', '울산광역시', '세종특별자치시', '경기도', '강원도',
  '충청북도', '충청남도', '전라북도', '전라남도', '경상북도', '경상남도', '제주특별자치도',
] as const;
