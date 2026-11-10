'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HELP_EMAIL } from '@/components/auth/AuthForm';
import { cn } from '@/lib/utils';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';
const controlHeight = 'h-11 text-base md:text-base';

/* 현재 구현된 기능과 대조한 문구 */
const FAQ_ITEMS: readonly { question: string; answer: React.ReactNode }[] = [
  {
    question: 'BidSignal은 어떤 서비스인가요?',
    answer:
      '나라장터 공공입찰 공고를 검색하고, 관심 공고로 저장해 진행 상태와 서류 준비, 마감 일정을 함께 관리하는 서비스입니다.',
  },
  {
    question: '공고 데이터는 어디서 가져오나요?',
    answer:
      '나라장터 OpenAPI(공개 데이터)로 공고를 수집합니다. 공사·물품·용역·외자·기타 유형으로 나눠 검색할 수 있습니다.',
  },
  {
    question: '키워드는 어떻게 검색되나요?',
    answer:
      '입력한 내용 전체가 공고명에 들어 있는 공고를 찾습니다. 쉼표로 나눠 여러 키워드를 한 번에 검색하지는 않으니, 한 번에 한 단어나 구절로 검색해 주세요.',
  },
  {
    question: '관심 공고는 어떻게 저장하나요?',
    answer:
      '로그인한 뒤 공고 찾기 목록의 별 버튼이나 공고 상세의 "관심 공고에 추가" 버튼을 누르면 저장됩니다. 저장한 공고는 [관심 공고]에서 상태별로 확인할 수 있습니다.',
  },
  {
    question: '마감 임박 공고는 어디서 확인하나요?',
    answer:
      '홈의 "오늘 할 일"에서 검토중·준비중인 관심 공고 중 마감이 D-3 이내인 공고와 D-4~D-7인 공고의 건수를 확인할 수 있습니다. [관심 공고]에서도 마감 3일 이내, 7일 이내로 걸러 볼 수 있습니다.',
  },
  {
    question: '공고 상태(검토중·준비중·제출완료·포기)는 어떻게 바꾸나요?',
    answer:
      '[관심 공고]에서 각 공고의 상태 메뉴로 바꿀 수 있고, 공고 상세 화면에서도 같은 방식으로 바꿀 수 있습니다.',
  },
  {
    question: '어떤 알림을 받을 수 있나요?',
    answer:
      '검토중·준비중인 관심 공고의 마감 3일 전(D-3)과 1일 전(D-1)에 이메일 알림을 보냅니다. [마이페이지 > 알림 설정]에서 이메일 알림과 시점을 켜고 끌 수 있고, 받은 알림은 [알림 내역]에서 확인할 수 있습니다. 새 공고나 공고 변경을 알려주는 알림은 아직 제공하지 않습니다.',
  },
  {
    question: '관심 조건 설정은 어디에 쓰이나요?',
    answer:
      '자주 찾는 공고 유형과 키워드를 저장해 두고, 공고 찾기에서 "저장한 조건 적용" 버튼을 누르면 그 조건으로 검색합니다. 조건은 지금 쓰는 브라우저에만 저장되고 로그아웃하면 지워지며, 이메일 알림 대상에는 쓰이지 않습니다.',
  },
  {
    question: '입찰 서류 체크리스트는 어떻게 쓰나요?',
    answer:
      '공고를 관심 공고로 저장하면 낙찰방법과 계약방법에 맞는 기본 항목이 만들어집니다. 공고 상세 화면의 체크리스트에서 항목을 체크하거나 직접 추가할 수 있고, 진행률은 [관심 공고]에서 함께 보입니다.',
  },
  {
    question: '공고문 AI 요약은 모든 공고에 있나요?',
    answer:
      '아니요. 요약이 만들어진 공고에만 공고 상세 화면에 표시됩니다. 공고문 파일이 없거나 읽을 수 없는 공고는 요약이 없을 수 있습니다. 요약은 참고용이니 중요한 내용은 공고 원문에서 꼭 확인해 주세요.',
  },
  {
    question: '아이디나 비밀번호를 잊어버렸어요.',
    answer: (
      <>
        아이디·비밀번호 찾기 기능은 준비 중입니다.{' '}
        <span className="whitespace-nowrap">{HELP_EMAIL}으로</span> 문의해 주세요.
      </>
    ),
  },
  {
    question: '회원 탈퇴는 어떻게 하나요?',
    answer:
      '[마이페이지 > 계정 관리]에서 회원 탈퇴를 누르고 확인하면 바로 처리됩니다. 탈퇴하면 저장한 공고·메모·설정 정보가 모두 삭제되며 복구할 수 없습니다.',
  },
];

const QUICK_LINKS = [
  { href: '/notices', title: '공고 찾기', description: '키워드와 공고 유형으로 공고 검색' },
  { href: '/watchlist', title: '관심 공고', description: '저장한 공고의 상태·메모·체크리스트 관리' },
  { href: '/settings/conditions', title: '관심 조건 설정', description: '공고 찾기에서 불러올 검색 조건 저장' },
  { href: '/mypage/notifications', title: '알림 설정', description: '마감 임박(D-3, D-1) 이메일 알림 설정' },
] as const;

function FaqItem({ id, question, answer }: { id: string; question: string; answer: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const buttonId = `${id}-button`;
  const panelId = `${id}-panel`;

  return (
    <li className="border-b border-border last:border-b-0">
      <h3>
        <button
          id={buttonId}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className={cn(
            'flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-muted sm:px-5',
            'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring'
          )}
        >
          <span className={cn('text-base text-foreground', open ? 'font-bold' : 'font-medium')}>{question}</span>
          <ChevronDown
            aria-hidden="true"
            className={cn('size-5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
          />
        </button>
      </h3>
      <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!open} className="px-4 pb-5 sm:px-5">
        <p className="text-base leading-relaxed break-keep text-muted-foreground">{answer}</p>
      </div>
    </li>
  );
}

export default function HelpPage() {
  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-foreground lg:text-[32px]">도움말</h1>
        <p className="mt-1 text-base text-muted-foreground">자주 묻는 질문과 이용 안내를 확인하세요.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-10">
        {/* 자주 묻는 질문 */}
        <section aria-labelledby="faq-heading" className="min-w-0">
          <h2 id="faq-heading" className="mb-3 text-lg font-bold text-foreground">자주 묻는 질문</h2>
          <ul className="overflow-hidden rounded-[10px] border border-border bg-card">
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem key={item.question} id={`faq-${i}`} question={item.question} answer={item.answer} />
            ))}
          </ul>
        </section>

        <aside className="flex flex-col gap-6">
          {/* 빠른 시작 */}
          <section aria-labelledby="quick-heading">
            <h2 id="quick-heading" className="mb-3 text-lg font-bold text-foreground">빠른 시작</h2>
            <ul className="divide-y divide-border overflow-hidden rounded-[10px] border border-border bg-card">
              {QUICK_LINKS.map(({ href, title, description }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      'flex min-h-14 items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted',
                      'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring'
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-base font-medium text-foreground">{title}</span>
                      <span className="block text-base text-muted-foreground">{description}</span>
                    </span>
                    <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* 서비스 안내 + 문의 (반영을 약속하지 않는 문장으로 정리) */}
          <section aria-labelledby="contact-heading" className="rounded-[10px] border border-border bg-card px-4 py-5 sm:px-5">
            <h2 id="contact-heading" className="text-lg font-bold text-foreground">서비스 안내</h2>
            <p className="mt-2 text-base leading-relaxed break-keep text-foreground">
              마감 임박 알림, 입찰 서류 준비 체크리스트, 공고문 AI 요약을 제공하고 있습니다.
              개선 의견은 이메일로 보내주세요.
            </p>
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-base text-muted-foreground">이메일 문의</p>
              <p className="text-base font-semibold whitespace-nowrap text-foreground">{HELP_EMAIL}</p>
              <p className="text-base text-muted-foreground">문의를 남기시면 확인 후 답변드립니다.</p>
            </div>
            <Button asChild variant="outline" className={cn(controlHeight, 'mt-4 w-full')}>
              <a href={`mailto:${HELP_EMAIL}`} className={focusRing}>문의하기</a>
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
}
