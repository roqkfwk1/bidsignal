import { cn } from '@/lib/utils';
import { NoticeStatus } from '@/types/notice';

const statusConfig: Record<
  NoticeStatus,
  { bg: string; text: string; label: string }
> = {
  urgent: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    label: '⏰ 마감임박',
  },
  corrected: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    label: '✎ 정정됨',
  },
  new: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: '★ 신규',
  },
  review: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    label: '🔍 검토필요',
  },
};

interface NoticeStatusBadgeProps {
  status: NoticeStatus;
  size?: 'sm' | 'default';
}

export function NoticeStatusBadge({
  status,
  size = 'default',
}: NoticeStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium whitespace-nowrap',
        config.bg,
        config.text,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      )}
    >
      {config.label}
    </span>
  );
}
