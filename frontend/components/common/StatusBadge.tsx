import { cn } from '@/lib/utils';
import { WatchlistStatus, WATCHLIST_STATUS_LABEL } from '@/types/notice';
import { STATUS_COLOR } from '@/constants/notice';

interface StatusBadgeProps {
  status: WatchlistStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium',
        STATUS_COLOR[status],
        className
      )}
    >
      {WATCHLIST_STATUS_LABEL[status]}
    </span>
  );
}
