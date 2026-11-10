import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodayTodoCardProps {
  urgentCount: number;
  weeklyCount: number;
}

/* "오늘 할 일" — 항상 표시, 닫기(X) 버튼 없음, 라벨 고정 (CLAUDE.md 확정 사항) */
export function TodayTodoCard({ urgentCount, weeklyCount }: TodayTodoCardProps) {
  const todos = [
    {
      label: '마감 임박 공고 확인 (D-3 이내)',
      count: urgentCount,
      urgent: true,
      /* 건수 정의(백엔드 DashboardService)와 동일: 검토중·준비중, 마감 D-Day~D-3 */
      href: '/watchlist?status=all&dueFrom=0&dueWithin=3&active=1',
    },
    {
      label: '곧 마감될 공고 (D-4~D-7)',
      count: weeklyCount,
      urgent: false,
      /* 건수 정의와 동일: 검토중·준비중, 마감 D-4~D-7 */
      href: '/watchlist?status=all&dueFrom=4&dueWithin=7&active=1',
    },
  ];

  return (
    <section aria-labelledby="today-todo-heading" className="rounded-[10px] border border-primary/25 bg-accent p-5 sm:p-6">
      <h2 id="today-todo-heading" className="mb-3 text-lg font-bold text-foreground">오늘 할 일</h2>

      <ul className="flex flex-col gap-2">
        {todos.map((todo) => (
          <li key={todo.label}>
            <Link
              href={todo.href}
              className="flex min-h-14 items-center justify-between gap-3 rounded-lg bg-card px-4 py-2 transition-colors hover:bg-card/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="min-w-0 text-base text-foreground">{todo.label}</span>
              <span className="flex shrink-0 items-center gap-1">
                <span
                  className={cn(
                    'text-[28px] leading-none font-bold tabular-nums',
                    todo.urgent && todo.count > 0 ? 'text-destructive' : 'text-foreground',
                  )}
                >
                  {todo.count}
                </span>
                <span className="text-base text-muted-foreground">건</span>
                <ChevronRight aria-hidden="true" className="size-5 text-muted-foreground" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
