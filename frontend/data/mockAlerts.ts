import { AlertItem } from '@/types/notice';

export const mockAlerts: AlertItem[] = [
  {
    id: '1',
    type: 'urgent',
    title: '마감 임박 알림',
    description: '강원도 경로당 환경개선 사업 아직까지 5일 남았습니다.',
    createdAt: '2025.05.15 10:30',
    isRead: false,
    noticeId: 1,
  },
  {
    id: '2',
    type: 'new',
    title: '새로운 맞춤 공고',
    description: '회원님의 관심 설정에 맞는 공고 3건이 등록되었습니다.',
    createdAt: '2025.05.15 09:00',
    isRead: false,
  },
  {
    id: '3',
    type: 'urgent',
    title: '마감 임박 알림',
    description: '노인 복지 시설 보수 공사 아직까지 10일 남았습니다.',
    createdAt: '2025.05.14 16:20',
    isRead: true,
    noticeId: 2,
  },
  {
    id: '4',
    type: 'system',
    title: '시스템 점검 안내',
    description: '시스템 업무가 완료되었습니다.',
    createdAt: '2025.05.14 14:00',
    isRead: true,
  },
];
