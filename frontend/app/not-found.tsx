import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const controlHeight = 'h-11 text-base md:text-base';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-2 rounded-[10px] border border-border bg-card px-6 py-16 text-center sm:px-10">
        <SearchX aria-hidden="true" className="mb-1 size-10 text-muted-foreground" strokeWidth={1.5} />
        <h1 className="text-[26px] font-bold tracking-tight text-foreground">페이지를 찾을 수 없어요</h1>
        <p className="max-w-sm text-base text-muted-foreground">
          주소가 바뀌었거나 삭제된 페이지일 수 있어요.
        </p>
        <Button asChild className={cn(controlHeight, 'mt-3 px-6 font-semibold')}>
          <Link href="/notices">공고 찾기로 이동</Link>
        </Button>
      </div>
    </div>
  );
}
