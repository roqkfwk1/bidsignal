# BidSignal — CLAUDE.md

> Claude Code가 프로젝트 맥락을 이해하기 위한 문서. 코드 작성 전 전체를 읽고 시작할 것.

---

## 1. 프로젝트 개요

**BidSignal**은 소규모 기업 조달 담당자를 위한 공공입찰 공고관리 · 마감 알림 플랫폼.

- 핵심: "공고를 더 많이 보여주는 것"이 아니라 "오늘 놓치면 안 되는 일"을 정리해주는 도구
- 타깃: 직원 5~30명 규모, 입찰을 겸업으로 처리하는 조달 담당자
- 데이터 소스: 나라장터 OpenAPI
- 흐름: 공고 탐색 → 저장 → 마감 관리 → 서류 준비 → 공고 이해(AI 요약)

기존 서비스(입찰나라, G-입찰 등)는 알림만 주는 수준. BidSignal은 입찰 업무 자체를 관리해주는 도구로 차별화.

---

## 2. MVP 단계

| 단계 | 핵심 기능 | 상태 |
|------|-----------|------|
| 1차 | 나라장터 공고 검색 + 관심 공고 저장 + 마감 대시보드 | 완료 |
| 2차 | 마감 임박 이메일 알림 | 완료 |
| 3차 | 입찰 서류 체크리스트 + 진행률 관리 | 완료 |
| 4차 | 공고문 AI 요약 | 완료 |

4차는 원래 "체크리스트 가이드 AI화"로 시작했으나, 기존 6종 템플릿(ChecklistTemplate)이
낙찰방법/제출방식/공고유형 조합으로 이미 rule 기반으로 촘촘히 커버하고 있어서 AI를 얹을
실익이 적었음. 그래서 AI는 공고 원문 요약 쪽으로 방향을 바꿔서 적용함. 체크리스트는 rule
기반 그대로 유지.

'실적/역량 기반 AI 공고 추천'은 학습할 실사용자 데이터가 없어서 20번 백로그로 보류.

### 알림 채널

이메일만 구현됨 (카카오 알림톡 대비 오픈율 낮지만 사업자 등록 없이 즉시 가능).
알림 로직(스케줄러, 발송 이력)은 채널과 분리해서 설계함 — 나중에 카카오 추가해도
핵심 로직 재작성 불필요.

---

## 3. 모노레포 구조

```
BidSignal/
├── frontend/          ← Next.js
├── backend/           ← Spring Boot
├── .github/workflows/ ← CI, 배포
├── README.md
├── CLAUDE.md
└── docker-compose.yml
```

---

## 4. 기술 스택

### Frontend

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js (App Router) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS |
| UI 컴포넌트 | shadcn/ui |

### Backend

| 항목 | 기술 |
|------|------|
| 언어/런타임 | Java 21 |
| 프레임워크 | Spring Boot 3.x |
| DB | PostgreSQL |
| 캐시 | Redis |
| 쿼리 | QueryDSL |
| 인증 | JWT (Access + Refresh) |
| 문서 파싱 | Apache POI, PDFBox, hwplib, hwpxlib |
| AI | Gemini API (gemini-3.1-flash-lite) |

---

## 5. 디자인 시스템

### 컬러

`frontend/app/globals.css`의 시맨틱 토큰을 Tailwind 클래스로 쓴다 (`bg-primary`, `text-muted-foreground` 등).
`gray-*`/`blue-*` 같은 팔레트 색 클래스와 `#색상코드` 하드코딩은 쓰지 않는다.

| 토큰 | 값 (라이트) | 용도 |
|------|-------------|------|
| `background` | #FBFAF8 | 페이지 배경 |
| `card` | #FFFFFF | 표·폼·목록 등 상호작용 표면 |
| `foreground` | #202824 | 본문 |
| `muted-foreground` | #687069 | 보조 정보 (기관, 공고번호, 설명) |
| `border` | #E9E9E3 | 구분선 (그림자 대신) |
| `primary` | #315B47 | 버튼·포커스·선택 상태에만 제한적으로 |
| `accent` | #EEF3EE | 옅은 강조 배경 (hover/선택) |
| `muted` | #F3F2EE | 중립 배경 |
| `destructive` / `destructive-soft` | #AD5548 / #FCF0ED | 마감 임박, 삭제, 오류 |
| `ring` | #57886E | 포커스 링 |

- 기준 모서리 10px (`rounded-lg` = `rounded-[10px]`, 코드에서는 `rounded-[10px]`를 직접 쓰는 곳이 많음), 본문 최대 폭 1220px (`max-w-content`)
- 컨트롤(버튼/입력/셀렉트) 높이 44px. `components/ui`의 기본값(Button·Input h-8, Select h-10)은 그대로 두고 각 화면에서 `h-11`(`controlHeight`)로 덮어쓴다
- 다크 모드 값은 globals.css의 `.dark` 참고

### 타이포그래피

- 폰트: Noto Sans KR
- 본문 16px 이상, 주요 숫자 28px 이상, 버튼/탭 16px 이상, 테이블 행 56px 이상

### 관심 공고 상태 라벨

색은 `frontend/constants/notice.ts`의 `STATUS_COLOR`(토큰 클래스), 라벨은 `frontend/types/notice.ts`의 `WATCHLIST_STATUS_LABEL`.

| 상태 | 클래스 | 라벨 | 관심 공고 화면 처리 |
|------|--------|------|---------------------|
| REVIEWING | `bg-muted text-foreground` | 검토중 | 기본 |
| PREPARING | `bg-accent text-primary` | 준비중 | 기본 |
| SUBMITTED | `bg-primary text-primary-foreground` | 제출완료 | 행을 흐리게 (글자색 `text-foreground/75`) |
| DROPPED | `bg-destructive-soft text-destructive` | 포기 | 가장 흐리게, 표는 맨 아래 행 · 모바일은 마지막 레인 |

### UI 원칙

- 색상만으로 상태 구분 금지, 텍스트 라벨 항상 동반
- 공고 찾기: lg 이상은 비교 표, lg 미만은 목록 행 (15장 참고)
- 관심 공고 (`app/(dashboard)/watchlist/page.tsx`): 위쪽 상태 칩(건수)·마감 기간·조건 요약 줄은 공통, 아래 목록만 화면 폭으로 나눈다(`hidden lg:block` / `lg:hidden`)
  - lg 이상: 하나의 표 (D-Day · 공고명+기관 · 마감일(요일) · 체크리스트 · 상태 · 메모(xl 이상) · 메뉴). 공고명만 링크, 행 약 72px.
    정렬은 검토중·준비중(마감 임박순 → 마감 지남 → 마감일 없음) → 제출완료 → 포기. 제출완료·포기 행은 흐리게(포기가 가장 흐림, 글자 대비 4.5:1 이상).
    xl 미만은 메모 열 대신 공고명 옆에 '메모 있음' 아이콘.
  - lg 미만: 검토중/준비중/제출완료/포기 상태 레인, 레인 안은 목록 행. 다른 레인에 공고가 있으면 0건 레인은 숨기고(칩으로 한 상태만 고르면 빈 상태 안내 표시), 레인 제목을 눌러 접고 펼 수 있다(기본 펼침).
- 알림 내역: 이메일함형 목록 (카드 나열 X)
- 계정 화면(마이페이지/관심 조건/알림 설정): 왼쪽 설정 메뉴 + 오른쪽 폼 2열 (`components/account/AccountLayout.tsx`)
- 도움말은 상단 메뉴 오른쪽 보조 영역

---

## 6. 상단 메뉴 (TopNav)

좌측 사이드바/별도 Header는 없앴고 `components/layout/TopNav.tsx` 하나로 통합.

```
[주요 메뉴]  홈 · 공고 찾기 · 관심 공고 · 알림 내역 · 관심 조건 설정
[오른쪽]     도움말 · 알림(읽지 않은 수) · 마이페이지 (비로그인 시 로그인)
```

- lg 이상: 한 줄(약 65px). lg 미만: 로고 줄 + 가로 스크롤 메뉴 줄 2단(약 105px)
- 토스트(Toaster) 상단 offset은 메뉴와 겹치지 않도록 120px
- 체크리스트, AI 요약 모두 별도 메뉴 없이 공고 상세 페이지 내 섹션으로 통합.
  `/checklist`는 공고 상세로 안내하는 페이지일 뿐 전체 목록 기능은 없음.

---

## 7. 페이지 구조

```
frontend/app/
├── layout.tsx
├── (auth)/
│   ├── layout.tsx                ← 로고 머리글 + 가운데 정렬 (TopNav 없음)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── onboarding/page.tsx       ← 3단계 사용 안내 (localStorage: bidsignal_onboarding_done)
└── (dashboard)/
    ├── layout.tsx                ← TopNav + main
    ├── page.tsx                  ← 홈 대시보드
    ├── notices/
    │   ├── page.tsx              ← 공고 찾기
    │   └── [id]/
    │       ├── page.tsx
    │       └── NoticeDetailClient.tsx  ← 공고 상세 (체크리스트, AI 요약 포함)
    ├── watchlist/page.tsx
    ├── alerts/page.tsx           ← 알림 내역
    ├── checklist/page.tsx        ← 안내 페이지 (체크리스트는 공고 상세에서 관리, 전체 목록 기능 없음)
    ├── settings/conditions/page.tsx
    ├── mypage/
    │   ├── page.tsx
    │   └── notifications/page.tsx  ← 알림 설정 (이메일 / D-3 / D-1)
    └── help/page.tsx
```

온보딩으로 자동 이동시키는 링크나 리다이렉트는 현재 없음 (`/onboarding` 직접 접근만 가능).

공고 상세 본문 순서: AI 요약(내용이 있을 때만) → 정보 탭(공고 정보 / 첨부파일 / 자격요건) → 체크리스트(저장한 공고만).
저장 여부와 관계없이 정보 탭의 위치는 같다. 오른쪽 패널(마감, 금액, 저장, 원문, 진행 상태, 메모, 준비 진행률)은 모바일에서 제목 바로 아래에 온다.

### 인증 정책

- `GET /api/notices/**`: 비로그인 접근 가능
- 공개 페이지: 홈, 공고 찾기, 공고 상세, 도움말, 체크리스트 안내
- 보호 페이지(`useRequireAuth`): 관심 공고, 알림 내역, 관심 조건 설정, 마이페이지, 알림 설정
- 비로그인 상태에서 관심공고 저장 시도 → 로그인 유도

---

## 8. 백엔드 API

```
[공고]
GET  /api/notices                  공고 검색
GET  /api/notices/{id}             공고 상세 (aiSummary 포함)
POST /api/notices/sync             나라장터 수동 동기화 (local 프로파일에서만 등록, 운영 서버에는 없음)

[관심 공고]
GET    /api/watchlist
POST   /api/watchlist/{noticeId}
DELETE /api/watchlist/{noticeId}
PATCH  /api/watchlist/{noticeId}/status
PATCH  /api/watchlist/{noticeId}/memo

[대시보드]
GET  /api/dashboard/summary

[인증]
POST /api/users/signup
POST /api/users/login
POST /api/users/reissue

[알림]
GET   /api/notification-settings/me
PUT   /api/notification-settings/me
GET   /api/notification-histories
PATCH /api/notification-histories/{id}/read
GET   /api/notification-histories/unread-count

[체크리스트]
GET   /api/watchlist/{noticeId}/checklist
POST  /api/watchlist/{noticeId}/checklist/items
PATCH /api/watchlist/{noticeId}/checklist/items/{itemId}
```

```
[상태 확인 (공개, 상세 정보는 숨김)]
GET  /actuator/health
GET  /actuator/health/jobs         공고 수집 성공 여부 (3시간 넘게 성공이 없으면 DOWN, 503)
```

외부 모니터링: UptimeRobot이 5분마다 `/actuator/health`를 확인하고 이상 시 메일로 알린다.
공고 수집(notice-sync)이 5개 공고유형을 모두 에러 없이 조회했을 때만 성공 시각을 기록한다(메모리 저장, 재시작 시 초기화).

GET /api/watchlist 응답에 체크리스트 진행률이 배치 조회로 같이 옴 (N+1 방지).
GET /api/notices/{id} 응답에 낙찰방법, 평가비율, 첨부파일 목록, aiSummary 포함.

참가지역(prtcptLmtRgnNm)은 나라장터 API가 안 줘서 관련 필드/조건 전면 제거함.

---

## 9. 주요 API 스펙

### 공고 검색 파라미터

- `bidTypes`: 다중 선택, null/빈 리스트면 전체 조회
- `includeExpired`: 기본 false (마감 공고 제외)
- `minAmt`, `maxAmt`, `bidClseDateFrom`, `bidClseDateTo`

### 대시보드 카운트

날짜 경계(자정 기준)로 계산. 시각 기준으로 하면 D-Day 공고 누락됨.

```java
LocalDateTime todayStart = LocalDate.now(ZoneId.of("Asia/Seoul")).atStartOfDay();
LocalDateTime urgentEnd = todayStart.plusDays(4).minusNanos(1);  // D-Day~D-3
LocalDateTime weeklyStart = todayStart.plusDays(4);               // D-4 시작
LocalDateTime weeklyEnd = todayStart.plusDays(8).minusNanos(1);   // D-7 끝
```

서버와 컨테이너가 UTC라서 현재 시각을 구할 때는 항상 `Asia/Seoul`을 명시한다(`LocalDateTime.now()` 단독 사용 금지).
docker-compose의 앱 컨테이너에도 `TZ: Asia/Seoul`을 설정했다.

### 금액 필터 프리셋

| 라벨 | minAmt | maxAmt |
|------|--------|--------|
| 전체 | - | - |
| 5천만 미만 | - | 49,999,999 |
| 5천만~1억 | 50,000,000 | 99,999,999 |
| 1억~5억 | 100,000,000 | 499,999,999 |
| 5억 이상 | 500,000,000 | - |

실제 DB 데이터 분포 보고 정한 구간, 임의 변경 금지.

### 백엔드 설계 메모

- `notices` 테이블: bid_type, bid_clse_dt, bid_ntce_dt, (ai_summary+std_ntce_doc_url 복합) 인덱스
- 마감 공고 정렬: includeExpired=true일 때 CaseBuilder로 만료 플래그를 1차 정렬 기준에 추가
- search() 메서드에서 now는 한 번만 만들어서 WHERE/ORDER BY에 동일하게 씀

---

## 10. 홈 대시보드

로그인 전용(비로그인은 공고 찾기로 이동). lg 이상 2열: 왼쪽은 오늘 할 일 + 우선 확인 공고, 오른쪽은 나의 현황.
lg 미만은 1열(오늘 할 일 → 우선 확인 공고 → 나의 현황).
오늘 할 일과 나의 현황은 둘 다 제목이 박스 안에 있고 안쪽 여백이 같아서 윗선이 맞는다.

### 오늘 할 일 (연한 녹색 카드, 항상 표시, X 버튼 없음)

| 항목 | 값 출처 | 라벨 |
|------|---------|------|
| 마감 임박 공고 확인 | urgentCount | D-3 이내 |
| 곧 마감될 공고 | weeklyCount | D-4~D-7 |

두 항목은 서로 안 겹침.
링크는 건수와 같은 범위와 상태로 관심 공고를 연다 (`/watchlist?status=all&dueFrom=0&dueWithin=3&active=1`,
`/watchlist?status=all&dueFrom=4&dueWithin=7&active=1`).

### 우선 확인 공고

검토중·준비중이면서 마감 전(dDay >= 0)인 관심 공고를 마감이 가까운 순으로 최대 5건. "관심 공고 전체 보기"로 관심 공고 화면 연결.
lg 미만에서는 공고명을 전체 폭 2줄로 보여주고, 아래 줄에 D-Day · 상태 · 체크리스트 진행을 놓는다.

### 나의 현황

관심 공고 수 / 준비중 공고 수 / 읽지 않은 알림 수. 불러오기 실패한 값은 0이 아니라 "-"로 표시.

---

## 11. 알림 로직 구조 (2차 MVP)

```java
NotificationService        // 채널 무관한 핵심 로직 (대상 조회, 이력 관리)
├── EmailNotificationSender
└── KakaoNotificationSender   // 나중에 추가할 경우
```

패키지/클래스 네이밍은 `alert`가 아니라 `notification`으로 통일.

---

## 12. 도움말 페이지 안내 문구

```
마감 임박 알림, 입찰 서류 준비 체크리스트, 공고문 AI 요약을 제공하고 있습니다.
개선 의견은 이메일로 보내주세요.
```

반영이나 답변 시한을 약속하는 표현(적극 반영, 1~2 영업일 등)은 쓰지 않는다. 혼자 운영하는 서비스라 지킬 수 있는 범위만 안내한다.

---

## 13. 체크리스트 설계 (3차 MVP)

- ChecklistItem: watchlistItemId(FK), title, checked, sortOrder, defaultItem, checkedAt
- 관심공고 등록 시 ChecklistTemplate이 낙찰방법(sucsfbidMthdNm/AppStd) + 계약방법(cntrctCnclsMthdNm)을
  키워드 매칭해서 6종(GENERAL/SMALL_PRIVATE_CONTRACT/QUALIFICATION_REVIEW/NEGOTIATION/
  SPEC_PRICE_EVALUATION/COMPREHENSIVE_EVALUATION) 중 하나로 분류, 기본 항목 자동 생성
- 공통 항목 + 템플릿별 특화 항목 + 공고 조건 기반 보조 항목(지역제한/제출방식/평가비율 등)
- WatchlistItem 삭제 시 ChecklistItem도 Service 레이어에서 명시적으로 cascade 삭제
- 목록 조회 시 N+1 없이 진행률 배치 조회 (IN 쿼리 1회)

---

## 14. 공고문 AI 요약 설계 (4차 MVP)

### 문서 파싱

- 나라장터 첨부파일은 HWP가 제일 많고 HWPX/PDF도 섞여 있음
- API 응답에 문서구분 필드가 없어서 파일 시그니처(매직넘버)로 형식 직접 판별
  - HWP: `D0 CF 11 E0` (OLE2), HWPX/ZIP: `PK`, PDF: `%PDF`
- HWP는 hwplib, HWPX는 hwpxlib, PDF는 PDFBox로 전체 본문 추출
- ZIP인데 HWPX가 아니면 내부 파일 중 HWP/PDF를 1단계까지 탐색해서 처리 (재귀 아님)
- stdNtceDocUrl(표준공고서URL) 기준으로 추출, 없으면 요약 스킵

### 스케줄러

- 공고 수집 스케줄러(매시간)와 별도로 분리. 수집 루프 안에 요약을 넣으면 배치가 느려지고
  텀을 두기 어려워짐
- NoticeSummaryScheduler가 3분 간격(fixedDelay)으로 마감 전 공고를 마감 임박순으로 하나씩 순차 처리 (`findSummaryTargets`)
- Gemini 무료 티어 하루 500건(RPD, 태평양 시간 자정 초기화 = 한국 시각 16~17시경)이 신규 공고 수(2026.10 기준 하루 약 천 건)보다 적다.
  그래서 마감이 가까운 공고에 한도를 쓰고, 간격은 한도를 하루에 고르게 쓰도록 정함
- 한도 초과(429)는 1시간, 서버 오류(503)는 5분 동안 쉼. 이때 해당 공고는 `NULL`로 남겨 다음 시도에서 이어서 처리 (`GeminiTemporaryException`)

### 실패 처리

- 영구 실패(URL 없음/본문 추출 실패/응답 처리 실패 등) 시 aiSummary에 빈 문자열 저장
  → 안 하면 같은 공고가 계속 "요약 없음" 조건에 걸려서 스케줄러가 반복 시도함
- 한도 초과(429)와 서버 오류(503)는 영구 실패가 아니므로 빈 문자열로 확정하지 않음
- 프론트는 aiSummary가 null이거나 공백뿐이면 AI 요약 섹션 자체를 표시하지 않음
  (null/빈문자열 구분 안 함, "요약 준비 중" 같은 대체 문구 없음)

### 프롬프트

- 낙찰방법/평가비율처럼 이미 화면에 구조화 데이터로 나오는 정보는 요약에서 제외
- 청렴계약/뇌물금지 등 대부분 공고에 공통으로 들어가는 표준 조항도 제외
- 원문에 없는 내용 추측 금지 명시
- 서두 문구, 마크다운 문법 쓰지 말라고 명시 (프론트가 plain text로 렌더링)

---

## 15. 절대 하지 말아야 할 것

**코드 품질**:
- `any` 타입 사용 금지
- 메뉴/버튼에 영어 사용 금지
- 폰트 크기 16px 미만 금지
- 상태를 색상만으로 구분 금지
- 공고 찾기를 카드 그리드로 임의 변경 금지. 현재 구조(`components/notices/NoticeResults.tsx`):
  lg 이상은 비교 표(공고명(칸 안에 공고 유형 태그와 공고번호 포함) · 수요기관 · 낙찰방법 · 게시일(xl 이상) · 마감 · 금액 · 관심 공고),
  lg 미만은 목록 행(공고명 · 공고 유형 · 수요기관 · 마감 · 금액 · 관심 공고)으로 표시
- 백엔드 코드 수정 금지 (Claude Code 작업 범위는 프론트엔드만)
- 고객센터 연락처는 bidsignal.help@gmail.com 고정(코드에서는 HELP_EMAIL 상수 사용, 이메일은 줄바꿈 없이 한 덩어리로 표시). 전화번호/다른 이메일/버전 정보 임의로 만들지 않기
- 백엔드가 실제로 안 주는 필드를 프론트에서 추측 표시하지 않기 (참가지역, 자격요건 등)
- 비밀번호 찾기/아이디 찾기 정식 기능은 18장 백로그. 도움말 이메일 문의 안내 유지

**확정 사항 변경 금지**:
- 도움말 서비스 안내 문구
- 금액 필터 구간
- "오늘 할 일" 위젯에 X 버튼 추가 금지, 라벨 고정

---

## 16. 커밋 컨벤션

- conventional commit 한글 (feat/fix/refactor/chore/docs/perf)
- 간결하게 한 줄로
- 프론트 커밋: Claude Code 작업 후 본인이 직접 모아서 커밋
- 백엔드 커밋: 본인이 직접 작성하고 커밋
- 같은 원인의 여러 파일 변경은 하나로 묶어도 되지만, 원인이 다르거나 프론트/백엔드에 걸치면 항상 나눠서 커밋

---

## 17. 도메인 메모

- 나라장터 공고는 (공고번호, 차수)로 구분한다. 첫 공고는 차수 000, 정정은 같은 공고번호의 더 높은 차수(001, 002 …)로 새 행이 들어온다.
- 공고종류명(`ntceKindNm`)은 등록공고 / 재공고 / 변경공고 / 취소공고를 운영 DB에서 확인했다(이 밖의 값이 있을 수 있음).
- 재공고도 차수 000으로 들어온다. (공고번호, 차수)가 유일하므로 원 공고와는 다른 공고번호다.
- 관심 공고는 공고 한 행(`notice_id`)에 붙는다. 같은 공고번호의 변경·취소 공고를 관심 공고와 연결하는 기능은 아직 없다(18장 백로그).

---

## 18. 백로그

- 자격요건 정식 연동 — 면허제한정보 API 검증 필요 (코드/이름 같이 오는지, 공사 외 유형도 값 있는지 Postman으로 먼저 확인)
- 이메일 인증(가입 시) + 비밀번호 찾기 — 같은 뼈대(토큰 발급 → Redis 저장 → 메일 발송 → 클릭 시 확인) 공유하니 같이 진행
- 아이디 찾기 정식 기능 — 휴대폰 인증 도입과 함께 별도 진행
- AI 기반 맞춤 공고 추천 — 실사용자 데이터 쌓이면 재검토
- 공고 변경·취소 알림 — 관심 공고를 저장한 사용자에게 같은 공고번호의 변경공고와 취소공고를 알림
- 공고 검색 정렬 동점 보정(`id desc`), 관심 공고 목록 정렬(`ORDER BY`)
- 공고 없음 응답을 메시지 문자열이 아니라 상태 코드로 구분
- 홈 요약 쿼리의 하한을 현재 시각으로, 끝 경계를 `<`로
- 이용약관과 개인정보 안내 정적 페이지
- 로그인 상태 구독 코드를 `lib/hooks/useIsLoggedIn.ts`로 통일 (현재 watchlist, notices, TopNav에 같은 코드가 따로 있음)
- 이미 로그인한 사용자가 로그인/회원가입 화면에 들어가면 홈으로 이동
- 토큰 저장 방식 검토 (현재 localStorage, XSS가 생기면 노출될 수 있음 → httpOnly 쿠키 등)
- 카카오 알림톡 채널 추가