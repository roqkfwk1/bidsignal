'use client';

import { ChevronDownIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WatchlistStatus } from '@/types/notice';
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
        <button className="flex items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
          <StatusBadge status={status} />
          <ChevronDownIcon className="size-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {ALL_STATUSES.map((s) => (
          <DropdownMenuItem key={s} onSelect={() => onChange(s)}>
            <StatusBadge status={s} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
