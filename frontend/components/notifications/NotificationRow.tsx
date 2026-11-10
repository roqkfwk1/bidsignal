import { cn } from '@/lib/utils';
import type { NotificationHistory } from '@/types/notice';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring';

/** 발송 시각 "2026.11.10 09:00". 파싱할 수 없으면 null */
function formatSentAt(isoStr: string | null | undefined): string | null {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${mo}.${day} ${h}:${m}`;
}

/**
 * 알림 종류 라벨. 현재는 마감 임박(D-3, D-1) 알림만 있다.
 * remainingDays가 0 이상의 정수가 아니면(향후 다른 종류 알림 등) "D-undefined" 대신 일반 라벨을 쓴다.
 */
function alertKind(remainingDays: unknown): { label: string; urgent: boolean } {
  if (typeof remainingDays === 'number' && Number.isInteger(remainingDays) && remainingDays >= 0) {
    if (remainingDays === 0) return { label: '마감 당일 알림', urgent: true };
    return { label: `D-${remainingDays} 마감 알림`, urgent: remainingDays <= 1 };
  }
  return { label: '알림', urgent: false };
}

const CHANNEL_LABEL: Record<string, string> = { EMAIL: '이메일' };

interface NotificationRowProps {
  history: NotificationHistory;
  onOpen: (history: NotificationHistory) => void;
}

/** 알림 한 건 — 이메일함의 한 줄처럼 읽음/안 읽음을 굵기·점·글자로 함께 구분 */
export function NotificationRow({ history, onOpen }: NotificationRowProps) {
  const unread = !history.read;
  const kind = alertKind(history.remainingDays);
  const sentAt = formatSentAt(history.sentAt);
  const channel = CHANNEL_LABEL[history.channel];
  const title = history.noticeTitle?.trim() || '제목 없는 공고';

  return (
    <li className={cn(unread ? 'bg-card' : 'bg-background')}>
      <button
        type="button"
        onClick={() => onOpen(history)}
        className={cn(
          'flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-accent sm:px-5',
          focusRing
        )}
      >
        {/* 안 읽음 점 — 장식, 의미는 아래 글자 라벨이 전달 */}
        <span
          aria-hidden="true"
          className={cn(
            'mt-2 size-2.5 shrink-0 rounded-full',
            unread ? 'bg-primary' : 'border border-border bg-transparent'
          )}
        />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <span
              className={cn(
                'min-w-0 text-base wrap-anywhere sm:truncate',
                unread ? 'font-bold text-foreground' : 'font-normal text-muted-foreground'
              )}
            >
              {title}
            </span>
            <span className="shrink-0 text-base text-muted-foreground tabular-nums">
              {sentAt ? <time dateTime={history.sentAt}>{sentAt}</time> : '발송 시각 정보 없음'}
            </span>
          </span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base">
            <span className={cn('font-medium', kind.urgent ? 'text-destructive' : 'text-foreground')}>
              {kind.label}
            </span>
            {channel && (
              <>
                <span aria-hidden="true" className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{channel}</span>
              </>
            )}
            <span aria-hidden="true" className="text-muted-foreground">·</span>
            <span
              className={cn(
                'rounded-md px-1.5',
                unread ? 'bg-accent font-semibold text-primary' : 'text-muted-foreground'
              )}
            >
              {unread ? '안 읽음' : '읽음'}
            </span>
          </span>
        </span>
      </button>
    </li>
  );
}
