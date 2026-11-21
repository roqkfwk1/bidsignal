import type { Metadata } from 'next';
import { HELP_EMAIL } from '@/components/auth/AuthForm';

export const metadata: Metadata = {
  title: '개인정보처리방침 | BidSignal',
  description: 'BidSignal이 회원의 개인정보를 어떻게 수집, 이용, 보관하는지 안내합니다.',
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-foreground lg:text-[32px]">개인정보처리방침</h1>
        <p className="mt-1 text-base text-muted-foreground">시행일: 2026년 11월 21일</p>
      </div>

      <div className="max-w-3xl rounded-[10px] border border-border bg-card px-5 py-6 sm:px-8 sm:py-8">
        <p className="text-base leading-relaxed break-keep text-foreground">
          BidSignal(이하 &quot;서비스&quot;)은 회원의 개인정보를 소중히 다루며, 개인정보 보호법에 따라 아래와 같이 처리합니다.
        </p>

        <div className="mt-8 flex flex-col gap-8">
          <section aria-labelledby="privacy-1">
            <h2 id="privacy-1" className="text-lg font-bold text-foreground">1. 수집하는 개인정보 항목</h2>
            <ul className="mt-2 flex flex-col gap-1 list-disc pl-5 text-base leading-relaxed break-keep text-foreground">
              <li>회원가입 시: 이름, 이메일, 비밀번호</li>
              <li>서비스 이용 과정에서 저장되는 정보: 관심 공고, 메모, 체크리스트, 알림 설정, 알림 발송 내역</li>
              <li>서버 운영 중 자동으로 생성되는 접속 기록(IP 주소, 접속 시각, 요청 주소 등)</li>
            </ul>
          </section>

          <section aria-labelledby="privacy-2">
            <h2 id="privacy-2" className="text-lg font-bold text-foreground">2. 수집 및 이용 목적</h2>
            <ul className="mt-2 flex flex-col gap-1 list-disc pl-5 text-base leading-relaxed break-keep text-foreground">
              <li>회원 식별과 로그인</li>
              <li>관심 공고 관리와 마감 임박 알림 메일 발송</li>
              <li>서비스 안정 운영, 장애 확인, 문의 응대</li>
            </ul>
          </section>

          <section aria-labelledby="privacy-3">
            <h2 id="privacy-3" className="text-lg font-bold text-foreground">3. 보유 및 이용 기간</h2>
            <ul className="mt-2 flex flex-col gap-1 list-disc pl-5 text-base leading-relaxed break-keep text-foreground">
              <li>회원 정보와 이용 기록은 회원 탈퇴 시까지 보유하고, 탈퇴하면 지체 없이 삭제합니다.</li>
              <li>서버 접속 기록은 약 14일간 보관한 뒤 자동으로 삭제됩니다.</li>
            </ul>
          </section>

          <section aria-labelledby="privacy-4">
            <h2 id="privacy-4" className="text-lg font-bold text-foreground">4. 파기 절차 및 방법</h2>
            <p className="mt-2 text-base leading-relaxed break-keep text-foreground">
              회원이 탈퇴하면 회원 정보, 관심 공고, 체크리스트, 알림 설정, 알림 발송 내역, 로그인 토큰을 데이터베이스에서 삭제합니다. 접속 기록은 보관 기간이 지나면 서버에서 삭제됩니다.
            </p>
          </section>

          <section aria-labelledby="privacy-5">
            <h2 id="privacy-5" className="text-lg font-bold text-foreground">5. 개인정보의 제3자 제공</h2>
            <p className="mt-2 text-base leading-relaxed break-keep text-foreground">
              회원의 개인정보를 제3자에게 제공하지 않습니다.
            </p>
          </section>

          <section aria-labelledby="privacy-6">
            <h2 id="privacy-6" className="text-lg font-bold text-foreground">6. 개인정보 처리 위탁 및 국외 이전</h2>
            <ul className="mt-2 flex flex-col gap-1 list-disc pl-5 text-base leading-relaxed break-keep text-foreground">
              <li>서버 운영: Amazon Web Services (서울 리전, 국내 저장)</li>
              <li>웹 화면 제공: Vercel (화면 제공 과정에서 접속 정보가 처리될 수 있습니다)</li>
              <li>
                알림 메일 발송: Google LLC (미국). 알림 메일 발송 시 회원의 이메일 주소가 Gmail 메일 서버로 전달됩니다.
                이전 항목은 이메일 주소와 메일 내용이며, 목적은 알림 메일 발송입니다. 회원은 알림 설정에서 메일 알림을 끄거나
                탈퇴하여 이전을 거부할 수 있으며, 이 경우 알림 메일을 받을 수 없습니다.
              </li>
            </ul>
          </section>

          <section aria-labelledby="privacy-7">
            <h2 id="privacy-7" className="text-lg font-bold text-foreground">7. 개인정보의 안전성 확보 조치</h2>
            <ul className="mt-2 flex flex-col gap-1 list-disc pl-5 text-base leading-relaxed break-keep text-foreground">
              <li>비밀번호는 암호화(해시)하여 저장하며, 운영자도 원문을 알 수 없습니다.</li>
              <li>통신 구간은 HTTPS로 암호화합니다.</li>
              <li>데이터베이스와 캐시 서버는 서버 외부에서 직접 접속할 수 없도록 제한합니다.</li>
              <li>서버와 데이터베이스 접근은 운영자만 할 수 있습니다.</li>
            </ul>
          </section>

          <section aria-labelledby="privacy-8">
            <h2 id="privacy-8" className="text-lg font-bold text-foreground">8. 쿠키 및 브라우저 저장소</h2>
            <p className="mt-2 text-base leading-relaxed break-keep text-foreground">
              서비스는 쿠키를 사용하지 않습니다. 로그인 상태 유지를 위해 브라우저 저장소(localStorage)에 인증 정보를 저장하며, 로그아웃하면 삭제됩니다. 별도의 방문 분석 도구는 사용하지 않습니다.
            </p>
          </section>

          <section aria-labelledby="privacy-9">
            <h2 id="privacy-9" className="text-lg font-bold text-foreground">9. 회원의 권리</h2>
            <p className="mt-2 text-base leading-relaxed break-keep text-foreground">
              회원은 언제든지 마이페이지에서 회원 탈퇴를 할 수 있고, 개인정보 열람, 정정, 삭제, 처리정지는 아래 문의처로 요청할 수 있습니다.
            </p>
          </section>

          <section aria-labelledby="privacy-10">
            <h2 id="privacy-10" className="text-lg font-bold text-foreground">10. 개인정보 보호책임자</h2>
            <p className="mt-2 text-base leading-relaxed break-keep text-foreground">
              성명: 이성준
              <br />
              이메일: <span className="whitespace-nowrap">{HELP_EMAIL}</span>
              <br />
              개인정보 관련 문의, 불만, 피해 구제 요청은 위 이메일로 접수해 주시면 지체 없이 답변드리겠습니다.
            </p>
          </section>

          <section aria-labelledby="privacy-11">
            <h2 id="privacy-11" className="text-lg font-bold text-foreground">11. 아동의 개인정보</h2>
            <p className="mt-2 text-base leading-relaxed break-keep text-foreground">
              서비스는 만 14세 미만 아동의 가입을 받지 않습니다.
            </p>
          </section>

          <section aria-labelledby="privacy-12">
            <h2 id="privacy-12" className="text-lg font-bold text-foreground">12. 방침 변경</h2>
            <p className="mt-2 text-base leading-relaxed break-keep text-foreground">
              이 방침이 변경되는 경우 시행일과 함께 이 페이지에 공지합니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
