import { cn } from '@/lib/utils';

interface DDayBadgeProps {
  dDay: number;
  deadline: string;
}

export function DDayBadge({ dDay, deadline }: DDayBadgeProps) {
  const label = dDay < 0 ? '마감' : dDay === 0 ? 'D-Day' : `D-${dDay}`;

  const colorClass =
    dDay < 0
      ? 'text-gray-400'
      : dDay <= 3
        ? 'text-red-600 font-semibold'
        : dDay <= 7
          ? 'text-orange-500 font-semibold'
          : 'text-gray-600';

  return (
    <span className={cn('text-base', colorClass)} title={deadline}>
      {label}
    </span>
  );
}
