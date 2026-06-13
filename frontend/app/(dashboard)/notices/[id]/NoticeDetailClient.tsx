'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star, Download, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { NoticeStatusBadge } from '@/components/notices/NoticeStatusBadge';
import { DDayBadge } from '@/components/common/DDayBadge';
import { StatusDropdown } from '@/components/common/StatusDropdown';
import { SaveToast } from '@/components/common/SaveToast';
import { Notice, SavedNotice, WatchlistStatus } from '@/types/notice';

interface Props {
  notice: Notice;
  savedNotice?: SavedNotice;
}

const mockFiles = [
  { name: '입찰공고문.pdf' },
  { name: '설계도면.dwg' },
  { name: '현장설명서.hwp' },
];

const qualifications = [
  { label: '업종 제한', value: '건축공사업 면허 보유' },
  { label: '실적 요건', value: '최근 3년 이내 유사 공사 실적' },
  { label: '지역 제한', value: '강원도 소재 업체 우대' },
  { label: '기타 요건', value: '사업자 등록증 필수' },
];

export function NoticeDetailClient({ notice, savedNotice }: Props) {
  const [isBookmarked, setIsBookmarked]       = useState(!!savedNotice);
  const [watchlistStatus, setWatchlistStatus] = useState<WatchlistStatus>(
    savedNotice?.watchlistStatus ?? 'REVIEWING'
  );
  const [memo, setMemo]         = useState(savedNotice?.memo ?? '');
  const [showToast, setShowToast] = useState(false);

  function handleToggleSave() {
    const willSave = !isBookmarked;
    setIsBookmarked(willSave);
    if (willSave) {
      setWatchlistStatus('REVIEWING');
      setMemo('');
      setShowToast(true);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── 브레드크럼 + 공고명 헤더 ── */}
      <div>
        <Link
          href="/notices"
          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-base mb-4 transition-colors"
        >
          <ArrowLeft className="size-4" />
          목록으로
        </Link>

        <div className="flex items-start justify-between gap-4">
          {/* 공고명 + 상태 배지 */}
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{notice.name}</h1>
            <NoticeStatusBadge status={notice.status} />
          </div>

          {/* 우측 상단 CTA */}
          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            <button
              onClick={handleToggleSave}
              aria-label={isBookmarked ? '관심 공고 해제' : '관심 공고 추가'}
              className="hover:scale-110 transition-transform"
            >
              <Star
                className={`size-6 transition-colors ${
                  isBookmarked
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 hover:text-yellow-300'
                }`}
              />
            </button>
            <Button
              onClick={handleToggleSave}
              variant={isBookmarked ? 'outline' : 'default'}
              className={isBookmarked ? '' : 'bg-blue-600 hover:bg-blue-700 text-white'}
            >
              {isBookmarked ? '관심 공고에서 제거' : '관심 공고에 추가'}
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2열 레이아웃 ── */}
      <div className="flex gap-6 items-start">
        {/* ── 왼쪽 메인 ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {/* 섹션 1: 공고 기본 정보 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="공고번호" value={notice.bidNo} />
              <InfoItem label="공고기관" value={notice.agency} />
              <InfoItem label="공고일" value="2025.05.01" />
              <InfoItem label="입찰방식" value={notice.contractType} />
              <InfoItem label="예산금액" value={notice.amount} />
              <InfoItem label="업종/분류" value={notice.category} />

              {/* 마감일 강조 */}
              <div
                className={`col-span-2 rounded-lg p-4 ${
                  notice.dDay <= 3 ? 'bg-red-50' : notice.dDay <= 7 ? 'bg-orange-50' : 'bg-gray-50'
                }`}
              >
                <p className="text-xs text-gray-500 mb-1">마감일</p>
                <div className="flex items-center gap-3">
                  <span className="text-base font-semibold text-gray-900">
                    {notice.deadline}
                  </span>
                  <DDayBadge dDay={notice.dDay} deadline={notice.deadline} />
                </div>
              </div>
            </div>
          </div>

          {/* 섹션 2: 탭 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <Tabs defaultValue="detail" className="w-full gap-0">
              <div className="border-b border-gray-100 px-2 pt-1">
                <TabsList variant="line" className="bg-transparent h-auto pb-0 gap-0 w-auto">
                  {['detail', 'qualifications', 'files'].map((val, i) => (
                    <TabsTrigger key={val} value={val} className="px-5 py-3 text-base rounded-none">
                      {['상세내용', '자격요건', '첨부파일'][i]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="detail" className="p-6 text-base">
                <section className="mb-6">
                  <h3 className="font-semibold text-gray-900 text-base mb-2">사업 개요</h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    관내 경로당 시설 환경개선을 위한 공사 사업입니다.
                  </p>
                </section>
                <section>
                  <h3 className="font-semibold text-gray-900 text-base mb-3">공사 내용</h3>
                  <ul className="flex flex-col gap-2">
                    {['내부 도배 및 장판 교체', '화장실 개선 공사', '냉·난방 설비 교체'].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-base text-gray-600">
                        <span className="size-1.5 rounded-full bg-gray-400 flex-shrink-0 mt-2.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              </TabsContent>

              <TabsContent value="qualifications" className="p-6 text-base">
                <div className="grid grid-cols-2 gap-4">
                  {qualifications.map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                      <p className="text-base text-gray-800 font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="files" className="p-6 text-base">
                <div className="flex flex-col divide-y divide-gray-100">
                  {mockFiles.map(({ name }) => (
                    <div
                      key={name}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="size-5 text-gray-400" />
                        <span className="text-base text-gray-700">{name}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => alert('준비 중입니다.')}
                        className="gap-1.5"
                      >
                        <Download className="size-3.5" />
                        다운로드
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* ── 오른쪽 보조 패널 ── */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-4">
          {/* 패널 1: 관심 공고 액션 영역 */}
          {isBookmarked ? (
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-4">
              {/* 상태 변경 */}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">진행 상태</p>
                <StatusDropdown status={watchlistStatus} onChange={setWatchlistStatus} />
              </div>

              {/* 메모 입력 */}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">메모</p>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  maxLength={200}
                  placeholder="이 공고에 대한 메모를 남겨보세요"
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-base text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-xs text-gray-400">{memo.length}/200</span>
                  <Button size="sm" onClick={() => {}}>
                    저장
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <Button
                onClick={handleToggleSave}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-base h-11"
              >
                + 관심 공고에 추가
              </Button>
              <p className="text-sm text-gray-500 mt-2 text-center leading-relaxed">
                저장하면 마감 임박 시 대시보드에서 바로 확인할 수 있어요.
              </p>
            </div>
          )}

          {/* 패널 2: 핵심 정보 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 text-base mb-3">핵심 정보</h3>
            <div className="flex flex-col">
              {(
                [
                  { label: '마감까지', value: notice.dDay, isDay: true },
                  { label: '예산',     value: notice.amount },
                  { label: '지역',     value: notice.region },
                  { label: '입찰방식', value: notice.contractType },
                  { label: '업종',     value: notice.category },
                ] as Array<{ label: string; value: string | number; isDay?: boolean }>
              ).map(({ label, value, isDay }, i, arr) => (
                <div
                  key={label}
                  className={`flex justify-between items-center py-2 text-sm ${
                    i < arr.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <span className="text-gray-500">{label}</span>
                  {isDay ? (
                    <DDayBadge dDay={notice.dDay} deadline={notice.deadline} />
                  ) : (
                    <span className="text-gray-900 font-medium">{value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 패널 3: 초보자 팁 */}
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
            <h3 className="font-semibold text-amber-800 text-base mb-2">💡 초보자 팁</h3>
            <p className="text-sm text-amber-700 leading-relaxed">
              마감일 3일 전까지 서류를 준비해두는 것을 권장합니다.
              <br />
              궁금한 점은 발주기관에 직접 문의하세요.
            </p>
          </div>
        </div>
      </div>

      {/* 저장 완료 토스트 */}
      <SaveToast show={showToast} onHide={() => setShowToast(false)} />
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-base font-medium text-gray-900">{value}</p>
    </div>
  );
}
