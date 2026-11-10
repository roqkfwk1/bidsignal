'use client';

import { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AccountLayout,
  LoginRequired,
  SaveStatus,
  SettingsSection,
  SwitchRow,
  controlHeight,
  focusRing,
  type SaveTone,
} from '@/components/account/AccountLayout';
import { cn } from '@/lib/utils';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { useIsLoggedIn } from '@/lib/hooks/useIsLoggedIn';
import { ACCESS_TOKEN_KEY } from '@/lib/api';
import { getNotificationSettings, updateNotificationSettings } from '@/lib/api/notifications';
import type { SearchCondition, NotificationSettings } from '@/types/notice';

/* ── 상수 ── */
const BID_TYPES = [
  { code: 'GOODS',        label: '물품' },
  { code: 'SERVICE',      label: '용역' },
  { code: 'CONSTRUCTION', label: '공사' },
  { code: 'FOREIGN',      label: '외자' },
  { code: 'ETC',          label: '기타' },
] as const;

const LS_KEY = 'bidsignal_conditions';

const INITIAL: SearchCondition = {
  bidTypes: [],
  keywords: '',
  urgentAlertEnabled: false,
};

/* ── localStorage(bidsignal_conditions) 읽기 — 저장 형식은 기존과 동일 ── */
function subscribeStorage(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}
const getRawSnapshot = () => localStorage.getItem(LS_KEY);
const getRawServerSnapshot = () => null;

function parseCondition(raw: string | null): { condition: SearchCondition; broken: boolean } {
  if (!raw) return { condition: INITIAL, broken: false };
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      condition: {
        ...INITIAL,
        ...parsed,
        bidTypes: Array.isArray(parsed.bidTypes) ? (parsed.bidTypes as string[]) : [],
        keywords: typeof parsed.keywords === 'string' ? parsed.keywords : '',
      },
      broken: false,
    };
  } catch {
    return { condition: INITIAL, broken: true };
  }
}

function sameCondition(a: SearchCondition, b: SearchCondition): boolean {
  if (a.keywords !== b.keywords) return false;
  if (a.bidTypes.length !== b.bidTypes.length) return false;
  return a.bidTypes.every((t) => b.bidTypes.includes(t));
}

type NotifLoad = 'loading' | 'error' | 'ready';
type SaveResult =
  | null
  | 'success'
  | 'error-condition'
  | 'error-email'
  | 'error-all';

/* ── 메인 페이지 ── */
export default function ConditionsPage() {
  useRequireAuth();
  const isLoggedIn = useIsLoggedIn();

  /* 저장된 조건 (localStorage) + 편집 중 초안. 초안이 null이면 저장값을 그대로 보여준다. */
  const raw = useSyncExternalStore(subscribeStorage, getRawSnapshot, getRawServerSnapshot);
  const { condition: savedCondition, broken } = useMemo(() => parseCondition(raw), [raw]);
  const [draft, setDraft] = useState<SearchCondition | null>(null);
  const condition = draft ?? savedCondition;

  /* 마감 임박 이메일 알림 (서버 설정) */
  const [notifSettings, setNotifSettings] = useState<NotificationSettings | null>(null);
  const [notifLoad, setNotifLoad]         = useState<NotifLoad>('loading');
  const [emailDraft, setEmailDraft]       = useState<boolean | null>(null);

  const [saving, setSaving]         = useState(false);
  const [saveResult, setSaveResult] = useState<SaveResult>(null);

  useEffect(() => {
    if (!localStorage.getItem(ACCESS_TOKEN_KEY)) return;
    let cancelled = false;
    getNotificationSettings()
      .then((s) => { if (!cancelled) { setNotifSettings(s); setNotifLoad('ready'); } })
      .catch(() => { if (!cancelled) setNotifLoad('error'); });
    return () => { cancelled = true; };
  }, []);

  function retryNotif() {
    setNotifLoad('loading');
    getNotificationSettings()
      .then((s) => { setNotifSettings(s); setNotifLoad('ready'); })
      .catch(() => setNotifLoad('error'));
  }

  const conditionDirty = draft !== null && !sameCondition(draft, savedCondition);
  const emailValue = emailDraft ?? notifSettings?.emailNotificationEnabled ?? false;
  const emailDirty = notifSettings !== null && emailDraft !== null
    && emailDraft !== notifSettings.emailNotificationEnabled;
  const dirty = conditionDirty || emailDirty;

  function editCondition(next: SearchCondition) {
    setDraft(next);
    setSaveResult(null);
  }

  function toggleBidType(code: string) {
    editCondition({
      ...condition,
      bidTypes: condition.bidTypes.includes(code)
        ? condition.bidTypes.filter((t) => t !== code)
        : [...condition.bidTypes, code],
    });
  }

  function handleEmailChange(value: boolean) {
    setEmailDraft(value);
    setSaveResult(null);
  }

  function handleReset() {
    setDraft(null);
    setEmailDraft(null);
    setSaveResult(null);
  }

  async function handleSave() {
    setSaving(true);
    setSaveResult(null);
    let conditionOk = true;
    let emailOk = true;

    if (conditionDirty && draft) {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(draft));
        setDraft(null); // 다시 렌더링되며 저장값(snapshot)을 새로 읽는다
      } catch {
        conditionOk = false;
      }
    }

    if (emailDirty && notifSettings && emailDraft !== null) {
      const updated = { ...notifSettings, emailNotificationEnabled: emailDraft };
      try {
        await updateNotificationSettings(updated);
        setNotifSettings(updated);
        setEmailDraft(null);
      } catch {
        emailOk = false;
      }
    }

    setSaveResult(
      conditionOk && emailOk ? 'success'
        : !conditionOk && !emailOk ? 'error-all'
          : !conditionOk ? 'error-condition'
            : 'error-email'
    );
    setSaving(false);
  }

  /* 저장 영역 안내 문구 */
  let statusTone: SaveTone = 'neutral';
  let statusMessage = dirty ? '저장하지 않은 변경 사항이 있어요.' : '변경 사항이 없어요.';
  if (saving) statusMessage = '저장 중이에요.';
  else if (saveResult === 'success') { statusTone = 'success'; statusMessage = '설정을 저장했어요.'; }
  else if (saveResult === 'error-condition') { statusTone = 'error'; statusMessage = '검색 조건을 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.'; }
  else if (saveResult === 'error-email') { statusTone = 'error'; statusMessage = '이메일 알림 설정을 저장하지 못했어요. 다시 시도해 주세요.'; }
  else if (saveResult === 'error-all') { statusTone = 'error'; statusMessage = '설정을 저장하지 못했어요. 다시 시도해 주세요.'; }

  const pageDescription = '자주 찾는 공고 유형과 키워드를 저장해 두고, 공고 찾기에서 한 번에 불러오세요.';

  if (!isLoggedIn) {
    return (
      <AccountLayout title="관심 조건 설정" description={pageDescription}>
        <LoginRequired description="관심 조건은 로그인한 뒤 설정할 수 있어요." />
      </AccountLayout>
    );
  }

  return (
    <AccountLayout title="관심 조건 설정" description={pageDescription}>
      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => { e.preventDefault(); if (dirty && !saving) handleSave(); }}
      >
        <SettingsSection
          headingId="search-condition-heading"
          title="검색 조건"
          description={
            <>
              공고 찾기에서 <strong className="font-medium text-foreground">저장한 조건 적용</strong>을 누르면 이 조건으로 검색해요.
              {' '}이 조건은 지금 쓰는 브라우저에만 저장되고, 로그아웃하면 지워져요. 이메일 알림 대상에는 쓰이지 않아요.
            </>
          }
        >
          {broken && (
            <p role="alert" className="mb-4 rounded-lg bg-destructive-soft px-3 py-2 text-base text-destructive">
              저장된 조건을 읽지 못해 기본값으로 표시했어요. 다시 저장하면 새로 저장돼요.
            </p>
          )}

          <fieldset aria-describedby="bidtype-help">
            <legend className="text-base font-semibold text-foreground">공고 유형</legend>
            <p id="bidtype-help" className="mt-0.5 text-base text-muted-foreground">
              여러 개를 고를 수 있어요. 고르지 않으면 모든 유형으로 검색해요.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {BID_TYPES.map(({ code, label }) => {
                const checked = condition.bidTypes.includes(code);
                const id = `bidtype-${code}`;
                return (
                  <label
                    key={code}
                    htmlFor={id}
                    className={cn(
                      'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3.5 text-base select-none transition-colors',
                      checked
                        ? 'border-primary bg-accent font-semibold text-foreground'
                        : 'border-border bg-card text-foreground hover:bg-muted'
                    )}
                  >
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={() => toggleBidType(code)}
                      className="size-5"
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-6">
            <label htmlFor="condition-keywords" className="text-base font-semibold text-foreground">
              검색 키워드
            </label>
            <Input
              id="condition-keywords"
              value={condition.keywords}
              onChange={(e) => editCondition({ ...condition, keywords: e.target.value })}
              placeholder="예: 유지보수"
              aria-describedby="keywords-help"
              className={cn(controlHeight, 'mt-2 max-w-lg bg-card px-3')}
            />
            <p id="keywords-help" className="mt-1.5 text-base text-muted-foreground">
              공고명에 이 단어가 들어간 공고를 찾아요. 입력한 내용 전체를 한 덩어리로 검색해요.
            </p>
          </div>
        </SettingsSection>

        <SettingsSection
          headingId="email-alert-heading"
          title="마감 임박 이메일 알림"
          description="위 검색 조건과는 관계없이, 관심 공고로 저장한 공고를 기준으로 발송돼요."
        >
          {notifLoad === 'loading' ? (
            <div className="flex items-center justify-between gap-4 py-4" aria-hidden="true">
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-3/4" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ) : notifLoad === 'error' ? (
            <div role="alert" className="flex flex-col items-start gap-2 py-2">
              <p className="text-base text-destructive">이메일 알림 설정을 불러오지 못했어요.</p>
              <Button type="button" variant="outline" onClick={retryNotif} className={cn(controlHeight, 'px-4')}>
                다시 시도
              </Button>
            </div>
          ) : (
            <SwitchRow
              id="condition-email-enabled"
              label="이메일 알림 받기"
              description="검토중·준비중인 관심 공고의 마감이 다가오면 가입한 이메일로 알려드려요."
              checked={emailValue}
              onCheckedChange={handleEmailChange}
              disabled={saving}
            />
          )}
          <p className="border-t border-border pt-3 text-base text-muted-foreground">
            받을 시점(D-3, D-1)은{' '}
            <Link href="/mypage/notifications" className={cn('rounded-sm font-medium text-primary hover:underline', focusRing)}>
              알림 설정
            </Link>
            에서 바꿀 수 있어요.
          </p>
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
