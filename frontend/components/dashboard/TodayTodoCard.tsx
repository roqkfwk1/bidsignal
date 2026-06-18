import Link from 'next/link';

interface TodayTodoCardProps {
  urgentCount: number;
  weeklyCount: number;
}

export function TodayTodoCard({ urgentCount, weeklyCount }: TodayTodoCardProps) {
  const todos = [
    {
      label: '마감 임박 공고 확인 (D-3 이내)',
      count: urgentCount,
      countColor: 'text-red-300 font-bold',
      href: '/watchlist?status=all&dueWithin=3',
    },
    {
      label: '곧 마감될 공고 (D-4~D-7)',
      count: weeklyCount,
      countColor: 'text-orange-300 font-bold',
      href: '/watchlist?status=all&dueWithin=7',
    },
  ];

  return (
    <div className="bg-blue-600 rounded-xl p-6">
      <h2 className="text-white font-semibold text-lg mb-4">오늘 할 일</h2>

      <div className="flex flex-col gap-2">
        {todos.map((todo) => (
          <Link key={todo.label} href={todo.href}>
            <div className="bg-white rounded-lg px-4 py-3 flex justify-between items-center hover:bg-blue-50 transition-colors cursor-pointer">
              <span className="text-gray-800 text-base">{todo.label}</span>
              <span className={`text-base ${todo.countColor}`}>{todo.count}건</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
