import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const controlHeight = 'h-11 text-base md:text-base';

const STEPS = [
  { title: '공고를 관심 공고에 저장', body: '공고 찾기 목록이나 공고 상세에서 관심 공고로 저장하세요.' },
  { title: '관심 공고에서 공고 선택', body: '저장한 공고의 제목을 눌러 공고 상세로 이동하세요.' },
  { title: '상세 화면에서 체크리스트 관리', body: '저장할 때 공고에 맞춰 만들어진 기본 항목을 체크하고, 필요한 항목을 직접 추가할 수 있어요.' },
] as const;

export default function ChecklistPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-foreground lg:text-[32px]">제출 체크리스트</h1>
        <p className="mt-1 text-base text-muted-foreground">입찰 서류 준비 상황은 공고별로 관리해요.</p>
      </div>

      <section
        aria-labelledby="checklist-guide-heading"
        className="max-w-3xl rounded-[10px] border border-border bg-card px-5 py-6 sm:px-8 sm:py-8"
      >
        <h2 id="checklist-guide-heading" className="text-lg font-bold text-foreground">
          체크리스트는 공고 상세 화면에서 관리해요
        </h2>
        <p className="mt-1 text-base text-muted-foreground">
          모든 공고의 체크리스트를 한 화면에서 보는 기능은 아직 준비 중이에요.
          관심 공고에 저장한 공고라면 해당 공고의 상세 화면에서 바로 확인할 수 있어요.
        </p>

        <ol className="mt-6 flex flex-col gap-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-base font-bold text-primary tabular-nums"
              >
                {i + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-base font-medium text-foreground">{s.title}</p>
                <p className="text-base text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <Button asChild className={cn(controlHeight, 'px-6 font-semibold')}>
            <Link href="/watchlist">관심 공고로 이동</Link>
          </Button>
          <Button asChild variant="outline" className={cn(controlHeight, 'px-6')}>
            <Link href="/notices">공고 찾기</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
