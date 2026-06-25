# BidSignal — CLAUDE.md

> 이 파일은 Claude Code가 프로젝트 전체 맥락을 이해하기 위한 프로젝트 바이블입니다.
> 코드 작성 전 반드시 이 파일 전체를 읽고 시작하세요.

---

## 1. 프로젝트 개요

**BidSignal**은 소규모 기업 조달 담당자를 위한 공공입찰 공고관리 · 마감 알림 플랫폼입니다.

- **핵심 한 줄**: "공고를 더 많이 보여주는 것"이 아니라, "오늘 놓치면 안 되는 일"을 분명하게 정리해주는 입찰 업무 도우미
- **타깃 사용자**: 소규모 기업(직원 5~30명)에서 입찰을 겸업으로 처리하는 조달 담당자
- **데이터 소스**: 나라장터 OpenAPI (공개 데이터 기반)
- **포지션**: 공고 탐색 → 저장 → 마감 관리 → 서류 준비의 흐름을 한 플랫폼에서 끊기지 않게 지원

---

## 2. 사업 방향 및 시장 포지셔닝

### 시장 현황

- 나라장터 연간 조달 규모: 약 170조원
- 등록 공급업체: 200만개 이상 (소규모 기업 수십만 곳이 실제 입찰 참여)
- 기존 경쟁자(입찰나라, G-입찰 등): UI/UX 낙후, 모바일 경험 부재, 단순 알림에서 끝남

### BidSignal의 차별점

기존 서비스가 "알림을 주는 서비스"에 머무는 반면,
BidSignal은 **"입찰 업무 자체를 관리해주는 SaaS"** 로 포지셔닝합니다.

- 1~3차: 핵심 업무 흐름(검색 → 저장 → 알림 → 서류관리) 완성
- 4차: AI 연동 — 체크리스트 준비 가이드를 AI 기반으로 정교화
  (이미 수집된 낙찰방법/평가비율 등의 구조화 데이터를 활용해 더
  자연스러운 준비 안내 제공). 원래 구상했던 '실적/역량 기반 AI 공고
  추천'은 추천 모델이 의미 있게 학습할 실사용자 데이터가 아직
  충분하지 않아 19번 백로그로 이동, 데이터 축적 후 재검토.
- 5차: 팀 공유 + 구독 유료화 → SaaS 수익화

### 수익화 목표

- 개인/소규모 기업: 월 1~3만원 구독
- 중견기업 팀 플랜: 월 10~30만원
- 구독자 1만명 → 월 2억원 ARR → 투자 유치 가능 규모

---

## 3. MVP 단계 정의

> **현재 상태: 3차 MVP 완료 ✅ / 4차 MVP 시작 예정**

| 단계 | 핵심 기능 | 사업적 의미 |
|------|-----------|------------|
| **1차 MVP** ✅ | 나라장터 공고 검색 + 관심 공고 저장 + 마감 대시보드 | 사용자 유입 |
| **2차 MVP** ✅ | 마감 임박 이메일 알림 → 이후 카카오 알림톡 추가 | 리텐션 확보 |
| **3차 MVP** ✅ | 입찰 서류 체크리스트 + 진행률 관리 | 이탈 방지, 도구화 |
| **4차 MVP** | 체크리스트 가이드 AI화 | 차별화된 준비 지원 강화 |
| **5차 MVP** | 팀 공유 + 유료화 | 수익화 |

### 알림 채널 전략 (2차 MVP)

한국 사용자 특성상 이메일 오픈율(10~20%)이 카카오 알림톡(70~80%)보다 현저히 낮음.
단계적으로 접근합니다.

1. **이메일 알림 먼저 구현** (2차 MVP): 사업자 등록 없이 즉시 구현 가능, 알림 로직 검증
2. **카카오 알림톡 추가** (2차 MVP 이후 별도 업데이트): 사업자 등록 + 카카오 채널 개설 후 적용
3. **SMS**: 카카오 알림톡의 폴백 용도로만 사용

> 알림 로직(스케줄러, 발송 이력)은 채널과 분리해서 설계할 것.
> 이메일 → 카카오 전환 시 핵심 로직을 재작성하지 않아도 되도록.

---

## 4. 모노레포 구조

```
BidSignal/
├── frontend/          ← Next.js (Claude Code 작업 영역)
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── types/
│   └── public/
├── backend/           ← Spring Boot (Claude Code에서 절대 수정 금지)
├── docs/
├── CLAUDE.md
└── docker-compose.yml
```

---

## 5. 기술 스택

### Frontend (frontend/)

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js (App Router) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS |
| UI 컴포넌트 | shadcn/ui |
| 패키지 매니저 | npm |

### Backend (backend/) — 참조용, Claude Code에서 수정 금지

| 항목 | 기술 |
|------|------|
| 언어/런타임 | Java 21 |
| 프레임워크 | Spring Boot 3.x |
| DB | PostgreSQL |
| 캐시 | Redis |
| 쿼리 | QueryDSL |
| 인증 | JWT (Access Token + Refresh Token) |

---

## 6. 디자인 시스템 (절대 임의로 변경하지 말 것)

### 컬러 토큰

```typescript
const colors = {
  primary: '#1560E7',    // Primary Blue — CTA, 선택 상태
  deadline: '#E53935',   // Red — 마감 임박
  corrected: '#F58025',  // Orange — 정정됨
  new: '#13A05F',        // Green — 신규, 완료
  waiting: '#667085',    // Gray — 대기, 비활성
}
```

### 타이포그래피

- 폰트: `Noto Sans KR`
- 본문: **16px 이상** (절대 미만 금지)
- 주요 숫자(건수, D-day 등): **28px 이상**
- 버튼/탭: **16px 이상**
- 테이블 행 높이: **56px 이상**

### 관심 공고 상태 라벨 (WatchlistStatusBadge)

| 상태 | 배경색 | 텍스트색 | 라벨 | 카드 처리 |
|------|--------|----------|------|-----------|
| REVIEWING | #F3F4F6 | #374151 | 검토중 | 기본 |
| PREPARING | #EFF6FF | #1E40AF | 준비중 | 기본 |
| SUBMITTED | #D1FAE5 | #065F46 | 제출완료 | 기본 |
| DROPPED | #FEE2E2 | #991B1B | 포기 | 흐리게(opacity-50), 목록 최하단 |

### UI 원칙

- 색상만으로 상태를 구분하지 않음 (반드시 텍스트 라벨 동반)
- CTA는 파란색(Primary) / 외곽선 버튼으로 위계 구분
- 공고 찾기: 리스트형 유지 (카드형으로 바꾸지 말 것)
- 관심 공고: 카드형 유지 (1차 MVP 기준, 2차에서 리스트 전환 고려 가능)
- 도움말은 사이드바 하단에 유지

---

## 7. 현재 사이드바 메뉴 구조

```
홈
공고 찾기
관심 공고
알림 내역
관심 조건 설정
마이페이지
도움말
```

> **중요**: 알림 내역 메뉴는 2차 MVP에서 추가됨.
> 체크리스트는 별도 사이드바 메뉴 없이 공고 상세 페이지 내 섹션으로 통합 구현됨 (3차 MVP).
> 4차 MVP 이후 메뉴 추가 시 이 목록을 업데이트할 것.

---

## 8. 페이지 구조 (App Router)

```
frontend/app/
├── layout.tsx
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
└── (dashboard)/
    ├── layout.tsx                ← AppShell: Sidebar + Header
    ├── page.tsx                  ← 홈 대시보드
    ├── notices/
    │   ├── page.tsx              ← 공고 찾기
    │   └── [id]/page.tsx         ← 공고 상세
    ├── watchlist/page.tsx        ← 관심 공고
    ├── settings/
    │   └── conditions/page.tsx   ← 관심 조건 설정
    ├── mypage/page.tsx           ← 마이페이지
    └── help/page.tsx             ← 도움말
```

### 인증 정책

- `GET /api/notices/**`: 비로그인 사용자도 접근 가능 (백엔드 `permitAll` 설정됨)
- 공개 페이지 (비로그인 접근 가능): 홈, 공고 찾기
- 보호 페이지 (로그인 필요): 관심 공고, 관심 조건 설정, 마이페이지
- 프론트엔드 라우팅 가드에서 공개/보호 페이지를 분리해서 처리
- 비로그인 상태에서 ★(관심공고 저장) 등 인증 필요 동작 시도 시 → 로그인 유도

---

## 9. 백엔드 API 연동 현황

```
[공고]
GET  /api/notices                  공고 검색 (쿼리파라미터로 검색조건 전달, 나라장터 API 연동)
GET  /api/notices/{id}             공고 상세

[관심 공고]
GET    /api/watchlist                      관심 공고 목록 (체크리스트 진행률 배치 조회 포함)
POST   /api/watchlist/{noticeId}           관심 공고 저장
DELETE /api/watchlist/{noticeId}           관심 공고 삭제
PATCH  /api/watchlist/{noticeId}/status    상태 변경
PATCH  /api/watchlist/{noticeId}/memo      메모 저장

[대시보드]
GET  /api/dashboard/summary            요약 (urgentCount, weeklyCount, preparingCount)

[인증]
POST /api/users/signup
POST /api/users/login
POST /api/users/reissue

[2차 MVP 완료 — 마감 임박 알림]
GET   /api/notification-settings/me              알림 설정 조회
PUT   /api/notification-settings/me              알림 설정 수정
GET   /api/notification-histories                알림 내역 조회, 페이지네이션
PATCH /api/notification-histories/{id}/read      알림 읽음 처리
GET   /api/notification-histories/unread-count   안 읽은 알림 개수
POST  /api/notices/sync                          나라장터 공고 수동 동기화, 관리자용

[3차 MVP 완료 — 체크리스트]
GET    /api/watchlist/{noticeId}/checklist                  체크리스트 조회 (진행률 포함)
POST   /api/watchlist/{noticeId}/checklist/items             체크리스트 항목 추가
PATCH  /api/watchlist/{noticeId}/checklist/items/{itemId}    체크/해제
비고: GET /api/watchlist 응답에도 공고별 체크리스트 진행률
     (checklistTotalCount/CheckedCount/ProgressRate)이 배치 조회로 포함됨 (N+1 방지)

[3차 MVP 완료 — 공고 부가정보]
GET /api/notices/{id} 응답에 sucsfbidMthdNm(낙찰방법),
    techAbltEvlRt/bidPrceEvlRt(평가비율), attachments(첨부파일 목록) 포함됨
비고: prtcptLmtRgnNm(참가지역)은 나라장터 API 응답에 포함되지 않는 것으로 확인되어
     관련 필드/검색조건 전면 제거됨
```

---

## 10. 주요 API 스펙 결정사항

### 공고 검색 파라미터 (NoticeSearchRequest)

- `bidTypes`: `List<BidType>` — 다중 선택. 쿼리스트링: `?bidTypes=공사&bidTypes=물품`
- `bidTypes`가 null이거나 빈 리스트면 "전체 조회"로 처리 (IN 절 조건 미적용)
- `includeExpired`: 마감된 공고 포함 여부 (기본값: false = 마감 공고 제외)
- `minAmt`, `maxAmt`: 금액 범위 필터
- `bidClseDateFrom`, `bidClseDateTo`: 마감일 범위 필터

### 대시보드 카운트 경계 조건 (중요)

반드시 날짜 경계(자정 기준)로 계산할 것.
시각(`LocalDateTime.now()`) 기준으로 비교하면 D-Day 공고가 누락되는 버그 발생.

```java
// 올바른 구현
LocalDateTime todayStart = LocalDate.now().atStartOfDay();
LocalDateTime urgentEnd = todayStart.plusDays(4).minusNanos(1);  // D-Day~D-3
LocalDateTime weeklyStart = todayStart.plusDays(4);               // D-4 시작
LocalDateTime weeklyEnd = todayStart.plusDays(8).minusNanos(1);   // D-7 끝
```

- `urgentCount`: D-Day~D-3 (오늘 자정 ~ D+3 끝)
- `weeklyCount`: D-4~D-7 (urgentCount와 겹치지 않음)

### 금액 필터 프리셋 (데이터 분포 기반 확정)

| 라벨 | minAmt | maxAmt |
|------|--------|--------|
| 전체 | - | - |
| 5천만 미만 | - | 49,999,999 |
| 5천만~1억 | 50,000,000 | 99,999,999 |
| 1억~5억 | 100,000,000 | 499,999,999 |
| 5억 이상 | 500,000,000 | - |

> 실제 DB 데이터 분포를 쿼리해서 결정한 구간. 임의로 변경 금지.

### 백엔드 주요 설계 결정사항

- **인덱스**: `notices` 테이블의 `bid_type`, `bid_clse_dt`, `bid_ntce_dt` 컬럼에 인덱스 추가됨
- **마감 공고 정렬**: `includeExpired=true`일 때 CaseBuilder로 만료 플래그를 1차 정렬 기준으로 추가
- **now 단일화**: `search()` 메서드에서 `LocalDateTime now`를 한 번만 생성해서 WHERE/ORDER BY에 동일하게 사용

---

## 11. 홈 대시보드 구조 (1차 MVP 확정)

### 오늘 할 일 (파란색 카드, X 버튼 없음 — 항상 표시)

| 항목 | 값 출처 | 라벨 |
|------|---------|------|
| 마감 임박 공고 확인 | `urgentCount` | D-3 이내 |
| 곧 마감될 공고 | `weeklyCount` | D-4~D-7 |

> 두 항목은 서로 겹치지 않는 순수 시간 축 분류.

### 나의 현황 (우측 박스)

| 항목 | 값 출처 |
|------|---------|
| 관심 공고 | watchlist 응답 건수 |
| 준비중 공고 | `preparingCount` |
| 읽지 않은 알림 | notification-histories/unread-count |

### 최근 저장한 공고

- watchlist 최근 3건 표시
- D-Day가 지난 공고는 "마감"으로 표시

---

## 12. 현재 구현 상태

```
[1차 MVP 완료 ✅]
✅ 프론트-백엔드 연동 완료
✅ JWT 인증 (로그인/회원가입/토큰 재발급)
✅ 나라장터 공고 검색 (멀티 필터, 다중 공고유형, 페이지네이션)
✅ 공고 상세 (낙찰방법·평가비율·첨부파일 포함)
✅ 관심 공고 저장/삭제/상태변경/메모
✅ 홈 대시보드 (오늘 할 일, 나의 현황, 최근 저장 공고)
✅ 관심 공고 탭/필터
✅ 관심 조건 설정 (지역/공고유형/키워드)
✅ 마이페이지
✅ 도움말
✅ 비로그인 사용자 공고 조회 허용

[2차 MVP 완료 ✅ — 마감 임박 알림]
✅ 나라장터 공고 자동 수집 스케줄러
✅ 알림 설정 API (조회/수정)
✅ 알림 발송 이력 테이블
✅ 이메일 알림 발송 스케줄러 (D-3, D-1)
✅ 알림 설정 UI (마이페이지, 채널/시점 그룹 분리)
✅ 알림 내역 페이지 (/alerts, 읽음 처리·전체 읽음)
✅ 사이드바 "알림 내역" 메뉴
✅ 나의 현황 "읽지 않은 알림" 카운트
⬜ (이후) 카카오 알림톡 채널 추가

[3차 MVP 완료 ✅ — 서류 체크리스트]
✅ ChecklistItem 엔티티 (WatchlistItem 1:N)
✅ 낙찰방법 기반 6종 템플릿 자동 분류 및 기본 항목 생성
✅ 체크리스트 조회 API (진행률 포함)
✅ 체크리스트 항목 추가 API
✅ 체크리스트 항목 체크/해제 API
✅ 공고 상세 페이지 내 체크리스트 섹션 (별도 메뉴/페이지 없이 통합)
✅ 관심 공고 목록에 체크리스트 진행률 배치 조회 (N+1 방지)

[4차 MVP 예정 — 체크리스트 가이드 AI화]
⬜ 낙찰방법/평가비율 등 구조화 데이터 기반 AI 준비 가이드
⬜ 템플릿 품질 개선 및 AI 기반 항목 자동 보완

[5차 MVP 예정 — 팀 공유 + 유료화]
⬜ 팀 공유 기능
⬜ 구독 요금제 (개인/팀 플랜)
```

---

## 13. 2차 MVP 구현 가이드 (알림 기능)

### 백엔드 예상 작업

```
[스케줄러]
- 매일 오전 9시 실행 (@Scheduled 또는 Quartz)
- 관심 공고 중 D-3, D-1인 공고 조회 (REVIEWING, PREPARING 상태만)
- 해당 사용자에게 이메일 발송 (JavaMailSender + 템플릿)
- 발송 이력 저장 (중복 발송 방지)

[DB 추가]
- notification_settings 테이블 (userId, emailNotificationEnabled, d3Enabled, d1Enabled) — 완료
- notification_histories 테이블 (userId, noticeId, alertType, channel, status, isRead, sentAt) — 완료

[API 추가]
GET   /api/notification-settings/me              알림 설정 조회 (완료)
PUT   /api/notification-settings/me              알림 설정 수정 (완료)
GET   /api/notification-histories                알림 내역 조회, 페이지네이션 (완료)
PATCH /api/notification-histories/{id}/read      알림 읽음 처리 (완료)
GET   /api/notification-histories/unread-count   안 읽은 알림 개수 (완료)
```

> 패키지/클래스 네이밍은 `alert`가 아니라 `notification`으로 통일 (예: `NotificationSetting`, `NotificationLog`).

### 프론트엔드 구현 완료 내역

```
✅ 사이드바에 "알림 내역" 메뉴 추가됨
✅ /alerts 페이지 구현됨 (알림 목록, 읽음/안읽음 처리)
✅ 마이페이지에 "알림 설정" 섹션 추가됨
✅ 관심 조건 설정에 "마감 임박 알림 받기" 토글 추가됨
✅ 나의 현황에 "읽지 않은 알림" 카운트 추가됨
✅ 상단 벨 아이콘 클릭 시 알림 내역으로 이동됨
```

### 알림 로직 설계 원칙

> 채널(이메일/카카오)과 발송 로직을 분리해서 설계할 것.
> 나중에 카카오 알림톡 추가 시 핵심 로직(대상 조회, 이력 저장)을 재작성하지 않아도 되도록.

```java
// 권장 구조
NotificationService        // 채널 무관한 핵심 로직 (대상 조회, 이력 관리)
├── EmailNotificationSender   // 이메일 발송
└── KakaoNotificationSender   // 카카오 알림톡 발송 (2차 이후 추가)
```

---

## 14. 도움말 페이지 서비스 안내 문구 (확정)

```
마감 임박 알림과 입찰 서류 준비 체크리스트를 제공하고 있습니다.
개선 의견은 이메일로 보내주시면 적극 반영합니다.
```

> 이 문구를 임의로 변경하지 말 것.
> 이 문구는 3차 MVP(체크리스트) 완료를 반영한 최종 문구다. 4차 MVP가 출시되어 더 안내할 내용이 생기면 그때 다시 업데이트할 것.

---

## 15. 3차 MVP 구현 가이드 (체크리스트) — 완료

### 구현된 설계
- ChecklistItem 엔티티: watchlistItemId(FK), title, checked, sortOrder, defaultItem, checkedAt
- 관심공고 등록 시 ChecklistTemplate이 공고의 낙찰방법(sucsfbidMthdNm/AppStd)과 계약방법(cntrctCnclsMthdNm)을 키워드 매칭하여 6종 템플릿(GENERAL/SMALL_PRIVATE_CONTRACT/QUALIFICATION_REVIEW/NEGOTIATION/SPEC_PRICE_EVALUATION/COMPREHENSIVE_EVALUATION) 중 하나로 분류하고, 템플릿별 기본 항목을 자동 생성
- 공통 항목(모든 템플릿 공유) + 템플릿별 특화 항목 + 공고 조건 기반 보조 항목(지역제한/제출방식/평가비율 등)으로 구성
- WatchlistItem 삭제 시 ChecklistItem도 명시적으로 cascade 삭제 (NotificationHistory와 동일한 패턴 — Service 레이어에서 명시적 delete 호출)
- 목록(GET /api/watchlist) 조회 시 N+1 없이 진행률을 배치로 함께 조회 (IN 쿼리 1회)

### 주의사항
> 참가지역(prtcptLmtRgnNm)은 나라장터 API 응답에 포함되지 않는 것으로 확인되어 체크리스트 분류/항목 생성 로직에서 사용하지 않는다.

---

## 16. 절대 하지 말아야 할 것

**코드 품질**:
- `any` 타입 사용 금지
- 메뉴/버튼에 영어 사용 금지 (한국어로)
- 폰트 크기 16px 미만 사용 금지
- 상태를 색상만으로 구분 금지 (텍스트 라벨 항상 동반)
- 공고 찾기 테이블을 카드 그리드로 임의 변경 금지
- 백엔드 코드 수정 금지 (Claude Code 작업 범위는 프론트엔드만)
- 고객센터/연락처 정보는 bidsignal.help@gmail.com 으로 고정한다. 전화번호, 다른 이메일 주소, 버전 정보(예: '1차 MVP 운영 중') 등을 임의로 새로 만들어내지 않는다.
- 백엔드 응답에 실제로 내려오지 않는 필드를 프론트에서 추측해서 표시하지 않는다 (예: 참가지역은 나라장터 API가 응답으로 주지 않음이 확인됨. 자격요건도 검증된 API 연동 전까지는 구체적 내용 대신 안내 문구로만 처리).
- 비밀번호 찾기(이메일 인증과 함께) / 아이디 찾기(휴대폰 인증과 함께) 정식 기능은 19번 백로그 항목이다. 임의로 구현하지 말고, 도움말 페이지의 이메일 문의 안내를 유지한다. 회원 탈퇴는 백로그가 아니라 현재 구현 대상이다.

**MVP 범위 준수**:
- 현재 단계보다 앞선 MVP 기능 구현 금지
- 카카오 알림톡을 2차 MVP 이메일 구현 전에 먼저 구현 금지
- AI 기능을 4차 MVP 전에 구현 금지
- 결제/유료화 기능을 5차 MVP 전에 구현 금지

**확정 사항 변경 금지**:
- 도움말 서비스 안내 문구 임의 변경 금지
- 금액 필터 구간 임의 변경 금지
- "오늘 할 일" 위젯에 X 버튼 추가 금지 (항상 표시)
- "오늘 할 일" 위젯 라벨: "마감 임박 공고 확인 (D-3 이내)", "곧 마감될 공고 (D-4~D-7)" 고정

---

## 17. 커밋 컨벤션

- conventional commit 한글 (feat/fix/refactor/chore/docs/perf)
- 간결하게 한 줄로
- 프론트 커밋: Claude Code 작업 후 본인이 직접 모아서 커밋 (Claude Code에서 커밋 금지)
- 백엔드 커밋: 본인이 직접 작성하고 커밋
- 같은 원인에서 나온 여러 파일 변경은 하나의 커밋으로 묶어도 되나, 서로 독립적인 원인이거나 다른 레이어(프론트/백엔드)에 걸친 변경은 항상 나눠서 커밋한다.

---

## 18. 프로젝트 컨텍스트

- 작성자: 이성준 (Backend Developer, 경력 약 1.5년)
- 공공 SI 나라장터 운영 경험 기반으로 기획된 도메인 프로젝트
- 포트폴리오 + 실 운영 + 수익화 목표
- Backend: Java 21 / Spring Boot / PostgreSQL / Redis / QueryDSL / JWT
- Frontend: Next.js / TypeScript / Tailwind CSS / shadcn/ui

---

## 19. 할 일 / 백로그 (MVP 아님)

> MVP는 "검증할 가설이 있는 새 기능 묶음"에만 번호를 붙인다.
> 아래는 가설 검증이 목적이 아닌 일반 개선/보완 작업이라 MVP 번호를
> 붙이지 않는다. 4차 MVP 진행 중 또는 별도 시점에 처리한다.

- 자격요건 정식 연동 — 면허제한정보 API (getBidPblancListInfoLicenseLimit) 검증 필요. 코드만 오는지/이름도 같이 오는지, 공사 외 유형에도 값이 있는지 Postman으로 먼저 확인 후 진행.
- 이메일 인증(가입 시) + 비밀번호 찾기 — 같은 작업으로 묶어서 진행 (토큰 발급 → Redis 저장(TTL) → 메일 발송 → 클릭 시 토큰 확인, 동일한 뼈대를 공유하므로 함께 구현). 현재 도움말 페이지 이메일 문의로 임시 대응 중.
- 아이디 찾기 정식 기능 — 휴대폰 인증 도입과 함께 별도 작업으로 진행 (로그인 식별자가 이메일이라, 이메일 인증만으로는 "이메일 자체를 잊은" 상황을 해결할 수 없음). 현재 도움말 페이지 이메일 문의로 임시 대응 중.
- AI 기반 맞춤 공고 추천 — 실사용자 데이터가 충분히 쌓인 후 재검토
