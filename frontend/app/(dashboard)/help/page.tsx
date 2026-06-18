'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, MessageCircle, Phone, Mail, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const FAQ_ITEMS = [
  {
    question: 'BidSignal은 어떤 서비스인가요?',
    answer:
      '나라장터 공공입찰 공고를 한 곳에서 관리할 수 있는 입찰 업무 도우미 서비스입니다. 공고 검색부터 관심 공고 저장, 마감일 관리까지 입찰 업무 흐름을 끊기지 않게 지원합니다.',
  },
  {
    question: '공고 데이터는 어디서 가져오나요?',
    answer:
      '나라장터 OpenAPI(공개 데이터)를 통해 공고를 수집합니다. 나라장터에 등록된 공사·물품·용역·외자 등 모든 공개 입찰 공고를 검색할 수 있습니다.',
  },
  {
    question: '관심 공고는 어떻게 저장하나요?',
    answer:
      '공고 목록 또는 공고 상세 페이지에서 ★ 아이콘을 클릭하면 관심 공고로 저장됩니다. 저장된 공고는 [관심 공고] 메뉴에서 상태 관리 및 메모와 함께 확인할 수 있습니다.',
  },
  {
    question: '마감 임박 공고는 어디서 확인하나요?',
    answer:
      '홈 대시보드 상단에 마감 임박(D-3 이내), 이번 주 마감(D-7 이내) 공고 건수가 표시됩니다. [관심 공고] 메뉴의 "마감임박 (D-3 이내)" 탭에서도 한눈에 확인할 수 있습니다.',
  },
  {
    question: '공고 상태(검토중·준비중·제출완료·포기)는 어떻게 변경하나요?',
    answer:
      '관심 공고 카드 하단의 상태 드롭다운을 클릭해 변경할 수 있습니다. 공고 상세 페이지 오른쪽 패널에서도 동일하게 변경 가능합니다.',
  },
  {
    question: '비밀번호를 잊어버렸어요.',
    answer:
      '현재 비밀번호 찾기 기능은 준비 중입니다. 고객센터(1544-1234)로 문의주시면 도움드리겠습니다.',
  },
  {
    question: '회원 탈퇴는 어떻게 하나요?',
    answer:
      '고객센터 이메일(support@bidsignal.kr)로 탈퇴 신청을 보내주시면 처리해드립니다. 탈퇴 시 저장된 공고·메모·설정 정보가 모두 삭제됩니다.',
  },
];

const GUIDE_ITEMS = [
  {
    href: '/notices',
    title: '공고 찾기 시작하기',
    description: '키워드·지역·업종으로 나라장터 공고를 검색해보세요.',
  },
  {
    href: '/watchlist',
    title: '관심 공고 관리하기',
    description: '저장한 공고의 상태와 메모를 한눈에 관리하세요.',
  },
  {
    href: '/settings/conditions',
    title: '관심 조건 설정하기',
    description: '자주 찾는 지역·업종·키워드를 기본 필터로 저장하세요.',
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <span className="text-base font-medium text-gray-900 pr-4">{question}</span>
        {open ? (
          <ChevronUp className="size-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="size-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-base text-gray-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="flex gap-6 items-start">
      {/* ── 왼쪽 메인 ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        {/* 섹션 1: 페이지 제목 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">도움말</h1>
          <p className="text-gray-500 mt-1 text-base">자주 묻는 질문과 이용 안내를 확인하세요.</p>
        </div>

        {/* 섹션 2: 빠른 시작 가이드 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="size-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">빠른 시작 가이드</h2>
          </div>
          <div className="flex flex-col gap-3">
            {GUIDE_ITEMS.map(({ href, title, description }) => (
              <Link
                key={href}
                href={href}
                className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between hover:bg-gray-50 hover:border-blue-200 transition-colors group"
              >
                <div>
                  <p className="text-base font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {title}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">{description}</p>
                </div>
                <ChevronDown className="size-5 text-gray-400 -rotate-90 flex-shrink-0 ml-4" />
              </Link>
            ))}
          </div>
        </section>

        {/* 섹션 3: 자주 묻는 질문 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="size-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">자주 묻는 질문</h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.question} question={item.question} answer={item.answer} />
            ))}
          </div>
        </section>
      </div>

      {/* ── 오른쪽 고객센터 패널 ── */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-4">
        {/* 고객센터 연락처 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 text-base mb-4">고객센터</h3>

          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 size-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Phone className="size-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">전화 문의</p>
                <p className="text-base font-semibold text-gray-900 mt-0.5">1544-1234</p>
                <p className="text-sm text-gray-400 mt-0.5">평일 09:00 ~ 18:00</p>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 size-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Mail className="size-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">이메일 문의</p>
                <p className="text-base font-semibold text-gray-900 mt-0.5">support@bidsignal.kr</p>
                <p className="text-sm text-gray-400 mt-0.5">1~2 영업일 내 답변</p>
              </div>
            </div>
          </div>

          <Button
            className="w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => alert('준비 중입니다.')}
          >
            문의하기
          </Button>
        </div>

        {/* 공지사항 안내 */}
        <div className={cn('bg-blue-50 rounded-xl border border-blue-100 p-4')}>
          <h3 className="font-semibold text-blue-800 text-base mb-2">서비스 안내</h3>
          <ul className="flex flex-col gap-2">
            {[
              '현재 1차 MVP 서비스 운영 중입니다.',
              '마감 임박 알림, 입찰 서류 체크리스트 기능은 2차 업데이트에서 순차적으로 제공될 예정입니다.',
              '개선 의견은 이메일로 보내주시면 적극 반영합니다.',
            ].map((tip) => (
              <li key={tip} className="flex gap-2 text-sm text-blue-700">
                <span className="flex-shrink-0 mt-0.5">•</span>
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
