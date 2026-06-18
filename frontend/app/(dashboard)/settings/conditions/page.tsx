'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { bidTypeToKorean, REGIONS } from '@/lib/utils';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import type { SearchCondition } from '@/types/notice';

/* ── 상수 ── */
const BID_TYPES = [
  { code: 'CONSTRUCTION', label: '공사' },
  { code: 'GOODS',        label: '물품' },
  { code: 'SERVICE',      label: '용역' },
  { code: 'FOREIGN',      label: '외자' },
  { code: 'ETC',          label: '기타' },
] as const;

const LS_KEY = 'bidsignal_conditions';

const INITIAL: SearchCondition = {
  region: '',
  bidTypes: [],
  keywords: '',
  urgentAlertEnabled: false,
};

/* ── 폼 필드 래퍼 ── */
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 last:mb-0">
      <label className="block text-base font-semibold text-gray-800 mb-2">{label}</label>
      {children}
    </div>
  );
}

/* ── 미리보기 행 helper ── */
function PreviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      {children}
    </div>
  );
}

/* ── 메인 페이지 ── */
export default function ConditionsPage() {
  useRequireAuth();

  const [condition, setCondition] = useState<SearchCondition>(() => {
    if (typeof window === 'undefined') return INITIAL;
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (!saved) return INITIAL;
      const parsed = JSON.parse(saved) as Record<string, unknown>;
      return {
        ...INITIAL,
        ...parsed,
        region:   typeof parsed.region === 'string' ? parsed.region : '',
        bidTypes: Array.isArray(parsed.bidTypes) ? (parsed.bidTypes as string[]) : [],
      };
    } catch {
      return INITIAL;
    }
  });

  const [showToast, setShowToast]     = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  function handleSave() {
    localStorage.setItem(LS_KEY, JSON.stringify(condition));
    setShowToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setShowToast(false), 2500);
  }

  function toggleBidType(code: string) {
    setCondition((c) => ({
      ...c,
      bidTypes: c.bidTypes.includes(code)
        ? c.bidTypes.filter((t) => t !== code)
        : [...c.bidTypes, code],
    }));
  }

  return (
    <div className="flex gap-6 items-start">
      {/* ── 왼쪽 설정 폼 ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        {/* 섹션 1: 페이지 제목 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">관심 조건 설정</h1>
          <p className="text-gray-500 mt-1 text-base">
            설정한 조건은 공고 찾기에서 기본 필터로 적용돼요.
          </p>
        </div>

        {/* 섹션 2: 설정 폼 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {/* 항목 1: 지역 */}
          <FormField label="지역">
            <Select
              value={condition.region || 'all'}
              onValueChange={(v) => setCondition((c) => ({ ...c, region: v === 'all' ? '' : v }))}
            >
              <SelectTrigger className="h-10 text-base max-w-xs">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">전체 (미설정)</SelectItem>
                {REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-2">
              선택하지 않으면 전국 공고가 표시돼요.
            </p>
          </FormField>

          {/* 항목 2: 공고 유형 */}
          <FormField label="공고 유형">
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {BID_TYPES.map(({ code, label }) => (
                <label key={code} className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={condition.bidTypes.includes(code)}
                    onCheckedChange={() => toggleBidType(code)}
                    className="size-5"
                  />
                  <span className="text-base text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </FormField>

          {/* 항목 3: 키워드 */}
          <FormField label="키워드">
            <Input
              value={condition.keywords}
              onChange={(e) => setCondition((c) => ({ ...c, keywords: e.target.value }))}
              placeholder="예: 환경개선, 보수, 공사"
              className="h-10 text-base max-w-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              쉼표로 구분하여 여러 키워드를 입력할 수 있어요.
            </p>
          </FormField>

        </div>

        {/* 섹션 3: 저장 버튼 */}
        <div className="mt-2">
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 h-11 text-base"
          >
            설정 저장
          </Button>
        </div>
      </div>

      {/* ── 오른쪽 보조 패널 ── */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-4">
        {/* 패널 1: 현재 설정 미리보기 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 text-base mb-3">현재 설정</h3>
          <div className="flex flex-col gap-3 text-sm">
            <PreviewRow label="지역">
              {condition.region ? (
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium inline-block mt-0.5">
                  {condition.region}
                </span>
              ) : (
                <span className="text-gray-400 text-xs">미설정 (전국)</span>
              )}
            </PreviewRow>

            <PreviewRow label="공고 유형">
              <div className="flex flex-wrap gap-1 mt-0.5">
                {condition.bidTypes.length > 0 ? (
                  condition.bidTypes.map((code) => (
                    <span
                      key={code}
                      className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium"
                    >
                      {bidTypeToKorean(code)}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-xs">미설정 (전체)</span>
                )}
              </div>
            </PreviewRow>

            <PreviewRow label="키워드">
              {condition.keywords ? (
                <span className="text-gray-700 break-all">{condition.keywords}</span>
              ) : (
                <span className="text-gray-400 text-xs">미설정</span>
              )}
            </PreviewRow>
          </div>
        </div>

        {/* 패널 2: 설정 도움말 */}
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
          <h3 className="font-semibold text-blue-800 text-base mb-3">설정 도움말</h3>
          <ul className="flex flex-col gap-2">
            {[
              '지역을 선택하면 해당 지역 공고만 표시돼요.',
              '키워드는 공고명에서 검색됩니다.',
              '저장된 조건은 공고 찾기의 기본 필터로 자동 적용돼요.',
            ].map((tip) => (
              <li key={tip} className="flex gap-2 text-sm text-blue-700">
                <span className="flex-shrink-0 mt-0.5">•</span>
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── 저장 완료 토스트 ── */}
      {showToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-gray-900 px-5 py-3 text-base text-white shadow-lg whitespace-nowrap"
        >
          기본 검색 조건이 저장됐어요.
        </div>
      )}
    </div>
  );
}
