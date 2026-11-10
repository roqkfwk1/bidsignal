import { toast } from 'sonner';

/* 색은 globals.css 시맨틱 토큰을 참조 → 라이트/다크 모드 모두 토큰 값을 따른다 */
const SUCCESS_STYLE = {
  background: 'var(--accent)',
  color: 'var(--primary)',
  border: '1px solid color-mix(in oklch, var(--primary) 30%, transparent)',
  boxShadow: '0 2px 8px color-mix(in oklch, var(--foreground) 10%, transparent)',
  fontSize: '16px',
} as const;

const ERROR_STYLE = {
  background: 'var(--destructive-soft)',
  color: 'var(--destructive)',
  border: '1px solid color-mix(in oklch, var(--destructive) 30%, transparent)',
  boxShadow: '0 2px 8px color-mix(in oklch, var(--foreground) 10%, transparent)',
  fontSize: '16px',
} as const;

export function showSuccessToast(message: string) {
  toast.success(message, { style: SUCCESS_STYLE });
}

export function showErrorToast(message: string) {
  toast.error(message, { style: ERROR_STYLE });
}
