'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockNotices } from '@/data/mockNotices';
import { SearchCondition } from '@/types/notice';

/* ── 상수 ── */
const REGION_OPTIONS   = ['강원도', '경기도', '서울', '인천', '부산', '전국'];
const CATEGORY_OPTIONS = ['건축공사', '시설공사', '건설공사', '용역', '물품'];
const AGENCY_TYPES     = ['자치체', '공공기관', '교육청', '기타'];
const AMOUNT_OPTIONS   = ['전체', '1억 미만', '1억 ~ 10억원', '10억 ~ 50억원', '50억 이상'];
const LS_KEY           = 'bidsignal_conditions';

const INITIAL: SearchCondition = {
  id: '1',
  name: '내 관심 조건',
  regions: ['강원도', '경기도'],
  categories: ['건축공사', '시설공사'],
  agencyTypes: ['자치체', '공공기관'],
  amountRange: '1억 ~ 10억원',
  keywords: '환경개선, 보수, 공사',
  urgentAlertEnabled: false,
};

/* ── 재사용 태그 렌더러 ── */
function TagList({ values, onRemove }: { values: string[]; onRemove: (v: string) => void }) {
  return (
    <>
      {values.map((v) => (
        <span
          key={v}
          className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-sm font-medium px-2.5 py-1 rounded-full"
        >
          {v}
          <button
            type="button"
            onClick={() => onRemove(v)}
            className="hover:text-blue-900 transition-colors"
            aria-label={`${v} 제거`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
    </>
  );
}

/* ── 태그 추가용 인라인 Select ── */
function AddTagSelect({
  options,
  current,
  onAdd,
}: {
  options: string[];
  current: string[];
  onAdd: (v: string) => void;
}) {
  const available = options.filter((o) => !current.includes(o));
  if (available.length === 0) return null;

  return (
    <Select value="" onValueChange={(v) => { if (v) onAdd(v); }}>
      <SelectTrigger className="h-8 w-36 text-sm text-blue-600 border-blue-300 hover:bg-blue-50">
        <SelectValue placeholder="+ 추가" />
      </SelectTrigger>
      <SelectContent>
        {available.map((opt) => (
          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

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
  const [condition, setCondition] = useState<SearchCondition>(() => {
    if (typeof window === 'undefined') return INITIAL;
    try {
      const saved = localStorage.getItem(LS_KEY);
      return saved ? (JSON.parse(saved) as SearchCondition) : INITIAL;
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
    const toSave = { ...condition, urgentAlertEnabled: false };
    localStorage.setItem(LS_KEY, JSON.stringify(toSave));
    setShowToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setShowToast(false), 2500);
  }

  function removeRegion(v: string) {
    setCondition((c) => ({ ...c, regions: c.regions.filter((r) => r !== v) }));
  }
  function addRegion(v: string) {
    setCondition((c) => ({
      ...c,
      regions: c.regions.includes(v) ? c.regions : [...c.regions, v],
    }));
  }

  function removeCategory(v: string) {
    setCondition((c) => ({ ...c, categories: c.categories.filter((r) => r !== v) }));
  }
  function addCategory(v: string) {
    setCondition((c) => ({
      ...c,
      categories: c.categories.includes(v) ? c.categories : [...c.categories, v],
    }));
  }

  function toggleAgencyType(v: string) {
    setCondition((c) => ({
      ...c,
      agencyTypes: c.agencyTypes.includes(v)
        ? c.agencyTypes.filter((t) => t !== v)
        : [...c.agencyTypes, v],
    }));
  }

  const matchingCount = mockNotices.filter((n) => condition.regions.includes(n.region)).length;

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
            <div className="flex flex-wrap items-center gap-2">
              <TagList values={condition.regions} onRemove={removeRegion} />
              <AddTagSelect options={REGION_OPTIONS} current={condition.regions} onAdd={addRegion} />
            </div>
          </FormField>

          {/* 항목 2: 공고 유형 */}
          <FormField label="공고 유형">
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {AGENCY_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={condition.agencyTypes.includes(type)}
                    onCheckedChange={() => toggleAgencyType(type)}
                    className="size-5"
                  />
                  <span className="text-base text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          </FormField>

          {/* 항목 3: 업종/분류 */}
          <FormField label="업종/분류">
            <div className="flex flex-wrap items-center gap-2">
              <TagList values={condition.categories} onRemove={removeCategory} />
              <AddTagSelect
                options={CATEGORY_OPTIONS}
                current={condition.categories}
                onAdd={addCategory}
              />
            </div>
          </FormField>

          {/* 항목 4: 공고 금액 */}
          <FormField label="공고 금액">
            <Select
              value={condition.amountRange}
              onValueChange={(v) => setCondition((c) => ({ ...c, amountRange: v }))}
            >
              <SelectTrigger className="w-56 h-10 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AMOUNT_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {/* 항목 5: 키워드 */}
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

          {/* 항목 6: 마감 임박 알림 받기 (3차 예정 — 비활성) */}
          <div className="flex justify-between items-center opacity-50">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-gray-800">
                  마감 임박 알림 받기
                </span>
                <span className="text-[11px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-medium leading-none">
                  3차 업데이트 예정
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                마감 7일 전부터 알림을 보내드립니다.
              </p>
            </div>
            <Switch
              checked={false}
              disabled
              aria-label="마감 임박 알림 (준비 중)"
            />
          </div>
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
              <div className="flex flex-wrap gap-1 mt-0.5">
                {condition.regions.length > 0 ? (
                  condition.regions.map((r) => (
                    <span key={r} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-xs">미설정</span>
                )}
              </div>
            </PreviewRow>

            <PreviewRow label="업종">
              <div className="flex flex-wrap gap-1 mt-0.5">
                {condition.categories.length > 0 ? (
                  condition.categories.map((c) => (
                    <span key={c} className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-xs">미설정</span>
                )}
              </div>
            </PreviewRow>

            <PreviewRow label="금액">
              <span className="text-gray-700">{condition.amountRange}</span>
            </PreviewRow>

            <PreviewRow label="키워드">
              <span className="text-gray-700 break-all">
                {condition.keywords || <span className="text-gray-400">미설정</span>}
              </span>
            </PreviewRow>
          </div>
        </div>

        {/* 패널 2: 맞춤 공고 현황 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 text-base mb-3">현재 조건 맞춤 공고</h3>
          <p className="text-2xl font-bold text-blue-600 mb-1">
            조건에 맞는 공고 <span>{matchingCount}</span>건
          </p>
          <Link href="/notices" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            공고 보러가기 →
          </Link>
        </div>

        {/* 패널 3: 도움말 카드 */}
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
          <h3 className="font-semibold text-blue-800 text-base mb-3">설정 도움말</h3>
          <ul className="flex flex-col gap-2">
            {[
              '지역과 업종을 좁힐수록 더 정확한 공고를 추천받아요.',
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
