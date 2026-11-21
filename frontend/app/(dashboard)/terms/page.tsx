import type { Metadata } from 'next';
import { HELP_EMAIL } from '@/components/auth/AuthForm';

export const metadata: Metadata = {
  title: '이용약관 | BidSignal',
  description: 'BidSignal 서비스 이용 조건과 공고 정보 이용 시 유의사항을 안내합니다.',
};

export default function TermsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-foreground lg:text-[32px]">이용약관</h1>
        <p className="mt-1 text-base text-muted-foreground">시행일: 2026년 11월 21일</p>
      </div>

      <div className="max-w-3xl rounded-[10px] border border-border bg-card px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-8">
          <section aria-labelledby="terms-1">
            <h2 id="terms-1" className="text-lg font-bold text-foreground">제1조 (목적)</h2>
            <p className="mt-2 text-base leading-relaxed break-keep text-foreground">
              이 약관은 BidSignal(이하 &quot;서비스&quot;)이 제공하는 공공입찰 공고 조회, 관심 공고 관리, 마감 알림 기능의 이용 조건과 운영자와 회원의 권리, 의무를 정합니다.
            </p>
          </section>

          <section aria-labelledby="terms-2">
            <h2 id="terms-2" className="text-lg font-bold text-foreground">제2조 (서비스 내용)</h2>
            <p className="mt-2 text-base leading-relaxed break-keep text-foreground">
              서비스는 나라장터 등 공공 데이터를 수집해 공고 검색, 관심 공고 저장, 준비 체크리스트, 마감 임박 알림 메일, 공고문 AI 요약 기능을 제공합니다.
            </p>
          </section>

          <section aria-labelledby="terms-3">
            <h2 id="terms-3" className="text-lg font-bold text-foreground">제3조 (정보의 정확성과 이용 시 유의사항)</h2>
            <ol className="mt-2 flex flex-col gap-1 list-decimal pl-5 text-base leading-relaxed break-keep text-foreground">
              <li>서비스의 공고 정보는 공공 데이터를 수집한 것으로, 수집 시점이나 처리 과정에 따라 원문과 다르거나 늦게 반영될 수 있습니다.</li>
              <li>공고 정정, 취소, 마감 변경 등은 서비스에 즉시 반영되지 않을 수 있습니다. 입찰 참여 전에는 반드시 나라장터 등 공고 원문을 확인해야 합니다.</li>
              <li>AI 요약은 참고용이며 부정확하거나 누락이 있을 수 있습니다. 요약이 제공되지 않는 공고도 있습니다.</li>
              <li>마감 알림 메일은 메일 서비스 사정이나 설정에 따라 지연되거나 도착하지 않을 수 있습니다.</li>
            </ol>
          </section>

          <section aria-labelledby="terms-4">
            <h2 id="terms-4" className="text-lg font-bold text-foreground">제4조 (회원가입과 계정 관리)</h2>
            <ol className="mt-2 flex flex-col gap-1 list-decimal pl-5 text-base leading-relaxed break-keep text-foreground">
              <li>만 14세 이상만 회원으로 가입할 수 있습니다.</li>
              <li>회원은 이메일과 비밀번호로 가입하며, 정확한 정보를 입력해야 합니다.</li>
              <li>회원은 자신의 계정과 비밀번호를 직접 관리해야 하며, 관리 소홀로 생긴 문제는 회원에게 책임이 있습니다.</li>
            </ol>
          </section>

          <section aria-labelledby="terms-5">
            <h2 id="terms-5" className="text-lg font-bold text-foreground">제5조 (금지 행위)</h2>
            <p className="mt-2 text-base leading-relaxed break-keep text-foreground">회원은 다음 행위를 해서는 안 됩니다.</p>
            <ul className="mt-2 flex flex-col gap-1 list-disc pl-5 text-base leading-relaxed break-keep text-foreground">
              <li>서비스를 비정상적인 방법으로 이용하거나 과도한 자동 요청으로 운영을 방해하는 행위</li>
              <li>타인의 계정을 도용하거나 정보를 부정하게 이용하는 행위</li>
              <li>서비스의 정보를 무단으로 대량 수집해 재배포하는 행위</li>
            </ul>
          </section>

          <section aria-labelledby="terms-6">
            <h2 id="terms-6" className="text-lg font-bold text-foreground">제6조 (서비스의 변경과 중단)</h2>
            <p className="mt-2 text-base leading-relaxed break-keep text-foreground">
              운영자는 서비스를 개선하거나 운영상 필요한 경우 기능을 변경하거나 일시 중단할 수 있으며, 가능한 경우 사전에 공지합니다.
            </p>
          </section>

          <section aria-labelledby="terms-7">
            <h2 id="terms-7" className="text-lg font-bold text-foreground">제7조 (책임의 제한)</h2>
            <p className="mt-2 text-base leading-relaxed break-keep text-foreground">
              운영자는 서비스가 제공하는 정보를 바탕으로 한 회원의 입찰 참여 결과와 그로 인한 손해에 대해 책임지지 않습니다. 다만 운영자의 고의 또는 중대한 과실로 인한 손해는 예외로 합니다.
            </p>
          </section>

          <section aria-labelledby="terms-8">
            <h2 id="terms-8" className="text-lg font-bold text-foreground">제8조 (회원 탈퇴)</h2>
            <p className="mt-2 text-base leading-relaxed break-keep text-foreground">
              회원은 언제든지 마이페이지에서 탈퇴할 수 있으며, 탈퇴 시 회원 정보와 이용 기록은 개인정보처리방침에 따라 삭제됩니다.
            </p>
          </section>

          <section aria-labelledby="terms-9">
            <h2 id="terms-9" className="text-lg font-bold text-foreground">제9조 (문의)</h2>
            <p className="mt-2 text-base leading-relaxed break-keep text-foreground">
              서비스 관련 문의: <span className="whitespace-nowrap">{HELP_EMAIL}</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
