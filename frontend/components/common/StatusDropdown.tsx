'use client';

import { ChevronDownIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WatchlistStatus, WATCHLIST_STATUS_LABEL } from '@/types/notice';
import { StatusBadge } from './StatusBadge';

const ALL_STATUSES: WatchlistStatus[] = ['REVIEWING', 'PREPARING', 'SUBMITTED', 'DROPPED'];

interface StatusDropdownProps {
  status: WatchlistStatus;
  onChange: (status: WatchlistStatus) => void;
}

export function StatusDropdown({ status, onChange }: StatusDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`진행 상태: ${WATCHLIST_STATUS_LABEL[status]} (변경)`}
          className="-mx-1 flex min-h-11 items-center gap-1 rounded-lg px-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <StatusBadge status={status} />
          <ChevronDownIcon aria-hidden="true" className="size-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {ALL_STATUSES.map((s) => (
          <DropdownMenuItem key={s} onSelect={() => onChange(s)} className="min-h-11">
            <StatusBadge status={s} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
