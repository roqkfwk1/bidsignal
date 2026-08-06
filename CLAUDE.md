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
├── docs/
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

```typescript
const colors = {
  primary: '#1560E7',
  deadline: '#E53935',
  corrected: '#F58025',
  new: '#13A05F',
  waiting: '#667085',
}
```

### 타이포그래피

- 폰트: Noto Sans KR
- 본문 16px 이상, 주요 숫자 28px 이상, 버튼/탭 16px 이상, 테이블 행 56px 이상

### 관심 공고 상태 라벨

| 상태 | 배경색 | 텍스트색 | 라벨 | 카드 처리 |
|------|--------|----------|------|-----------|
| REVIEWING | #F3F4F6 | #374151 | 검토중 | 기본 |
| PREPARING | #EFF6FF | #1E40AF | 준비중 | 기본 |
| SUBMITTED | #D1FAE5 | #065F46 | 제출완료 | 기본 |
| DROPPED | #FEE2E2 | #991B1B | 포기 | 흐리게, 최하단 |

### UI 원칙

- 색상만으로 상태 구분 금지, 텍스트 라벨 항상 동반
- 공고 찾기: 리스트형 유지
- 관심 공고: 카드형 유지
- 도움말은 사이드바 하단

---

## 6. 사이드바 메뉴

```
홈
공고 찾기
관심 공고
알림 내역
관심 조건 설정
마이페이지
도움말
```

체크리스트, AI 요약 모두 별도 메뉴 없이 공고 상세 페이지 내 섹션으로 통합.

---

## 7. 페이지 구조

```
frontend/app/
├── layout.tsx
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
└── (dashboard)/
    ├── layout.tsx
    ├── page.tsx                  ← 홈 대시보드
    ├── notices/
    │   ├── page.tsx              ← 공고 찾기
    │   └── [id]/page.tsx         ← 공고 상세 (체크리스트, AI 요약 포함)
    ├── watchlist/page.tsx
    ├── settings/conditions/page.tsx
    ├── mypage/page.tsx
    └── help/page.tsx
```

### 인증 정책

- `GET /api/notices/**`: 비로그인 접근 가능
- 공개 페이지: 홈, 공고 찾기
- 보호 페이지: 관심 공고, 관심 조건 설정, 마이페이지
- 비로그인 상태에서 관심공고 저장 시도 → 로그인 유도

---

## 8. 백엔드 API

```
[공고]
GET  /api/notices                  공고 검색
GET  /api/notices/{id}             공고 상세 (aiSummary 포함)
POST /api/notices/sync             나라장터 수동 동기화

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
LocalDateTime todayStart = LocalDate.now().atStartOfDay();
LocalDateTime urgentEnd = todayStart.plusDays(4).minusNanos(1);  // D-Day~D-3
LocalDateTime weeklyStart = todayStart.plusDays(4);               // D-4 시작
LocalDateTime weeklyEnd = todayStart.plusDays(8).minusNanos(1);   // D-7 끝
```

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

### 오늘 할 일 (파란 카드, 항상 표시, X 버튼 없음)

| 항목 | 값 출처 | 라벨 |
|------|---------|------|
| 마감 임박 공고 확인 | urgentCount | D-3 이내 |
| 곧 마감될 공고 | weeklyCount | D-4~D-7 |

두 항목은 서로 안 겹침.

### 나의 현황

관심 공고 수 / 준비중 공고 수 / 읽지 않은 알림 수

### 최근 저장한 공고

watchlist 최근 3건. D-Day 지난 공고는 "마감"으로 표시.

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
개선 의견은 이메일로 보내주시면 적극 반영합니다.
```

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
- NoticeSummaryScheduler가 15초 간격(fixedDelay)으로 요약 없는 공고를 하나씩 순차 처리
- 간격은 Gemini 무료 티어 RPM보다 RPD(일일 요청 한도)를 기준으로 정함

### 실패 처리

- 요약 실패(URL 없음/파싱 실패/AI 호출 실패) 시 aiSummary에 빈 문자열 저장
  → 안 하면 같은 공고가 계속 "요약 없음" 조건에 걸려서 스케줄러가 반복 시도함
- 프론트는 aiSummary가 비어있으면 "요약 준비 중" 문구로 처리 (null/빈문자열 구분 안 함)

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
- 공고 찾기를 카드 그리드로 임의 변경 금지
- 백엔드 코드 수정 금지 (Claude Code 작업 범위는 프론트엔드만)
- 고객센터 연락처는 bidsignal.help@gmail.com 고정. 전화번호/다른 이메일/버전 정보 임의로 만들지 않기
- 백엔드가 실제로 안 주는 필드를 프론트에서 추측 표시하지 않기 (참가지역, 자격요건 등)
- 비밀번호 찾기/아이디 찾기 정식 기능은 20번 백로그. 도움말 이메일 문의 안내 유지

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

## 17. 프로젝트 컨텍스트

- 작성자: 이성준 (Backend Developer, 경력 2년차)
- 공공 SI 나라장터 운영 경험 기반으로 기획한 도메인 프로젝트
- Backend: Java 21 / Spring Boot / PostgreSQL / Redis / QueryDSL / JWT
- Frontend: Next.js / TypeScript / Tailwind CSS / shadcn/ui

---

## 18. 백로그

- 자격요건 정식 연동 — 면허제한정보 API 검증 필요 (코드/이름 같이 오는지, 공사 외 유형도 값 있는지 Postman으로 먼저 확인)
- 이메일 인증(가입 시) + 비밀번호 찾기 — 같은 뼈대(토큰 발급 → Redis 저장 → 메일 발송 → 클릭 시 확인) 공유하니 같이 진행
- 아이디 찾기 정식 기능 — 휴대폰 인증 도입과 함께 별도 진행
- AI 기반 맞춤 공고 추천 — 실사용자 데이터 쌓이면 재검토
- 카카오 알림톡 채널 추가