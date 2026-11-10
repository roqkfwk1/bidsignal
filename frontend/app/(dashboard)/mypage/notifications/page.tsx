'use client';

import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AccountLayout,
  LoadError,
  LoginRequired,
  SaveStatus,
  SettingsSection,
  SwitchRow,
  controlHeight,
  type SaveTone,
} from '@/components/account/AccountLayout';
import { cn } from '@/lib/utils';
import { getNotificationSettings, updateNotificationSettings } from '@/lib/api/notifications';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { useIsLoggedIn } from '@/lib/hooks/useIsLoggedIn';
import { ACCESS_TOKEN_KEY } from '@/lib/api';
import type { NotificationSettings } from '@/types/notice';

type LoadState = 'loading' | 'error' | 'ready';

function sameSettings(a: NotificationSettings, b: NotificationSettings): boolean {
  return a.emailNotificationEnabled === b.emailNotificationEnabled
    && a.d3Enabled === b.d3Enabled
    && a.d1Enabled === b.d1Enabled;
}

function RowsSkeleton({ rows }: { rows: number }) {
  return (
    <div aria-hidden="true" className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-4">
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-2/3" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}

const PAGE_DESCRIPTION = '관심 공고의 마감 임박 이메일 알림을 받을지, 언제 받을지 정하세요.';

export default function NotificationsSettingsPage() {
  useRequireAuth();
  const isLoggedIn = useIsLoggedIn();

  const [saved, setSaved]           = useState<NotificationSettings | null>(null);
  const [draft, setDraft]           = useState<NotificationSettings | null>(null);
  const [loadState, setLoadState]   = useState<LoadState>('loading');
  const [saving, setSaving]         = useState(false);
  const [saveResult, setSaveResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    if (!localStorage.getItem(ACCESS_TOKEN_KEY)) return;
    let cancelled = false;
    getNotificationSettings()
      .then((s) => { if (!cancelled) { setSaved(s); setLoadState('ready'); } })
      .catch(() => { if (!cancelled) setLoadState('error'); });
    return () => { cancelled = true; };
  }, []);

  function retryLoad() {
    setLoadState('loading');
    getNotificationSettings()
      .then((s) => { setSaved(s); setDraft(null); setLoadState('ready'); })
      .catch(() => setLoadState('error'));
  }

  const current = draft ?? saved;
  const dirty = draft !== null && saved !== null && !sameSettings(draft, saved);

  function handleChange(key: keyof NotificationSettings, value: boolean) {
    if (!current) return;
    setDraft({ ...current, [key]: value });
    setSaveResult(null);
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    setSaveResult(null);
    try {
      await updateNotificationSettings(draft);
      setSaved(draft);
      setDraft(null);
      setSaveResult('success');
    } catch {
      /* 실패 시 초안을 유지해 그대로 다시 저장할 수 있게 함 */
      setSaveResult('error');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setDraft(null);
    setSaveResult(null);
  }

  if (!isLoggedIn) {
    return (
      <AccountLayout title="알림 설정" description={PAGE_DESCRIPTION}>
        <LoginRequired description="알림 설정은 로그인한 뒤 바꿀 수 있어요." />
      </AccountLayout>
    );
  }

  if (loadState === 'error') {
    return (
      <AccountLayout title="알림 설정" description={PAGE_DESCRIPTION}>
        <LoadError message="알림 설정을 불러오지 못했어요." onRetry={retryLoad} />
      </AccountLayout>
    );
  }

  const ready = loadState === 'ready' && current !== null;
  const emailOn = current?.emailNotificationEnabled ?? false;
  const noTiming = ready && emailOn && !current.d3Enabled && !current.d1Enabled;

  let statusTone: SaveTone = 'neutral';
  let statusMessage = dirty ? '저장하지 않은 변경 사항이 있어요.' : '변경 사항이 없어요.';
  if (!ready) statusMessage = '알림 설정을 불러오는 중이에요.';
  else if (saving) statusMessage = '저장 중이에요.';
  else if (saveResult === 'success') { statusTone = 'success'; statusMessage = '알림 설정을 저장했어요.'; }
  else if (saveResult === 'error') { statusTone = 'error'; statusMessage = '알림 설정을 저장하지 못했어요. 다시 시도해 주세요.'; }

  return (
    <AccountLayout title="알림 설정" description={PAGE_DESCRIPTION}>
      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => { e.preventDefault(); if (dirty && !saving) handleSave(); }}
      >
        <SettingsSection
          headingId="email-channel-heading"
          title="이메일 알림"
          description="검토중·준비중인 관심 공고가 대상이에요. 가입한 이메일로 발송돼요."
        >
          {ready ? (
            <SwitchRow
              id="email-enabled"
              label="이메일 알림 받기"
              description="끄면 아래 시점 설정과 관계없이 알림 메일을 보내지 않아요."
              checked={current.emailNotificationEnabled}
              onCheckedChange={(v) => handleChange('emailNotificationEnabled', v)}
              disabled={saving}
            />
          ) : (
            <RowsSkeleton rows={1} />
          )}
        </SettingsSection>

        <SettingsSection
          headingId="timing-heading"
          title="알림 받을 시점"
          description="마감일 기준으로 받을 시점을 고르세요."
        >
          {ready ? (
            <>
              {!emailOn && (
                <p className="mb-1 flex items-start gap-2 rounded-lg bg-muted px-3 py-2.5 text-base text-foreground">
                  <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                  <span>
                    이메일 알림이 꺼져 있어 지금은 어떤 시점에도 메일이 발송되지 않아요.
                    아래 설정은 그대로 저장되고, 이메일 알림을 다시 켜면 적용돼요.
                  </span>
                </p>
              )}
              <div className="divide-y divide-border">
                <SwitchRow
                  id="d3-enabled"
                  label="마감 3일 전 (D-3)"
                  description="마감 3일 전에 미리 알려드려요."
                  checked={current.d3Enabled}
                  onCheckedChange={(v) => handleChange('d3Enabled', v)}
                  disabled={saving}
                />
                <SwitchRow
                  id="d1-enabled"
                  label="마감 1일 전 (D-1)"
                  description="제출 전 마지막으로 확인할 수 있게 알려드려요."
                  checked={current.d1Enabled}
                  onCheckedChange={(v) => handleChange('d1Enabled', v)}
                  disabled={saving}
                />
              </div>
              {noTiming && (
                <p className="mt-1 flex items-start gap-2 rounded-lg bg-muted px-3 py-2.5 text-base text-foreground">
                  <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                  <span>받을 시점을 하나도 고르지 않아 알림 메일이 발송되지 않아요.</span>
                </p>
              )}
            </>
          ) : (
            <RowsSkeleton rows={2} />
          )}
        </SettingsSection>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex gap-2">
            <Button type="submit" disabled={!dirty || saving} className={cn(controlHeight, 'px-8')}>
              {saving ? '저장 중...' : '설정 저장'}
            </Button>
            {dirty && !saving && (
              <Button type="button" variant="ghost" onClick={handleReset} className={cn(controlHeight, 'px-4')}>
                되돌리기
              </Button>
            )}
          </div>
          <SaveStatus tone={statusTone} message={statusMessage} />
        </div>
      </form>
    </AccountLayout>
  );
}
