import { toast } from 'sonner';

const SUCCESS_STYLE = {
  background: 'rgba(19, 160, 95, 0.12)',
  color: '#065F46',
  border: '1px solid rgba(19, 160, 95, 0.35)',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
  fontSize: '16px',
} as const;

const ERROR_STYLE = {
  background: 'rgba(229, 57, 53, 0.10)',
  color: '#991B1B',
  border: '1px solid rgba(229, 57, 53, 0.30)',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
  fontSize: '16px',
} as const;

export function showSuccessToast(message: string) {
  toast.success(message, { style: SUCCESS_STYLE });
}

export function showErrorToast(message: string) {
  toast.error(message, { style: ERROR_STYLE });
}
