import { Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CanceledBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-md bg-destructive-soft px-2 text-base leading-7 font-semibold whitespace-nowrap text-destructive',
        className,
      )}
    >
      <Ban aria-hidden="true" className="size-4" />
      취소된 공고
    </span>
  );
}
