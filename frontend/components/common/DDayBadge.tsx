import { cn } from '@/lib/utils';

interface DDayBadgeProps {
  dDay: number | null;
  deadline: string;
}

export function DDayBadge({ dDay, deadline }: DDayBadgeProps) {
  if (dDay === null) {
    return <span className="text-base text-muted-foreground" title={deadline}>-</span>;
  }

  const label = dDay < 0 ? '마감' : dDay === 0 ? 'D-Day' : `D-${dDay}`;

  const colorClass =
    dDay < 0
      ? 'text-muted-foreground'
      : dDay <= 3
        ? 'text-destructive font-semibold'
        : dDay <= 7
          ? 'text-foreground font-semibold'
          : 'text-foreground';

  return (
    <span className={cn('text-base', colorClass)} title={deadline}>
      {label}
    </span>
  );
}
