import { ChecklistItem } from '@/types/notice';

export const mockChecklist: ChecklistItem[] = [
  { id: '1', label: '입찰 참가 신청서', done: true, category: '필수 서류' },
  { id: '2', label: '사업자 등록증', done: true, category: '필수 서류' },
  { id: '3', label: '법인 등기부 등본', done: false, category: '필수 서류' },
  { id: '4', label: '인감 증명서', done: false, category: '필수 서류' },
  { id: '5', label: '사용 인감계', done: false, category: '필수 서류' },
  { id: '6', label: '입찰 보증금 납부 확인서', done: true, category: '입찰 관련 서류' },
  { id: '7', label: '입찰서', done: false, category: '입찰 관련 서류' },
  { id: '8', label: '공사 이행 보증서', done: false, category: '입찰 관련 서류' },
  { id: '9', label: '건설업 등록증 사본', done: false, category: '자격 증빙' },
  { id: '10', label: '시공 실적 증명서', done: false, category: '자격 증빙' },
];
