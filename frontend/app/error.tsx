'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const controlHeight = 'h-11 text-base md:text-base';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-2 rounded-[10px] border border-border bg-card px-6 py-16 text-center sm:px-10">
        <AlertCircle aria-hidden="true" className="mb-1 size-10 text-destructive" strokeWidth={1.5} />
        <h1 className="text-[26px] font-bold tracking-tight text-foreground">문제가 생겼어요</h1>
        <p className="max-w-sm text-base text-muted-foreground">
          잠시 후 다시 시도해 주세요.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => reset()} className={cn(controlHeight, 'px-6 font-semibold')}>
            다시 시도
          </Button>
          <Button asChild variant="outline" className={cn(controlHeight, 'px-6')}>
            <Link href="/">홈으로 이동</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
