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

## 2. MVP 단계 정의

> 각 기능/화면에 MVP 단계가 표기되어 있습니다.
> **현재 구현 대상: 1차 MVP**
> 2차, 3차 이후 기능은 UI는 존재하지만 비활성화(disabled) 처리합니다.

| 단계 | 핵심 기능 |
|------|-----------|
| **1차 MVP** | 나라장터 공고 검색 + 관심 공고 저장 + 마감 대시보드 |
| **2차 MVP** | 제출 서류 체크리스트 + 진행률 관리 |
| **3차 MVP** | 조건 기반 자동 수집 + 이메일 알림 |
| **4차 MVP** | 팀 공유 + 유료화 |
| **5차 MVP** | AI 공고 분석 + 플랫폼화 |

---

## 3. 모노레포 구조

```
BidSignal/
├── frontend/          ← Next.js (이 디렉토리가 Claude Code 작업 영역)
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── data/
│   ├── types/
│   └── public/
├── backend/           ← Spring Boot (별도 작업, 여기는 건드리지 않음)
├── docs/              ← 기획서, UI 디자인 문서
├── CLAUDE.md          ← 이 파일
└── docker-compose.yml
```

---

## 4. 기술 스택 (frontend/)

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS |
| UI 컴포넌트 | shadcn/ui |
| 패키지 매니저 | npm |
| 폰트 | Noto Sans KR (Google Fonts) |

---

## 5. 디자인 시스템 (절대 임의로 변경하지 말 것)

### 컬러 토큰

```typescript
// tailwind.config.ts 또는 globals.css에 정의
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
- 주요 숫자 (건수, D-day 등): **28px 이상**
- 버튼/탭: **16px 이상**
- 테이블 행 높이: **56px 이상**

### 공고 상태 라벨 (NoticeStatusBadge) — 색상+텍스트+아이콘 항상 함께

> 나라장터 공고 자체의 상태를 나타냅니다.

| 상태 | 배경색 | 텍스트색 | 아이콘 | 라벨 |
|------|--------|----------|--------|------|
| urgent | #FEE2E2 | #991B1B | ⏰ | 마감 임박 |
| corrected | #FEF3C7 | #92400E | ✎ | 정정됨 |
| new | #D1FAE5 | #065F46 | ★ | 신규 |
| review | #EFF6FF | #1E40AF | 🔍 | 검토 필요 |

### 관심 공고 상태 라벨 (WatchlistStatusBadge)

> 사용자가 저장한 관심 공고의 진행 상태를 나타냅니다.

| 상태 | 배경색 | 텍스트색 | 라벨 | 카드 처리 |
|------|--------|----------|------|-----------|
| REVIEWING | #F3F4F6 | #374151 | 검토중 | 기본 |
| PREPARING | #EFF6FF | #1E40AF | 준비중 | 기본 |
| SUBMITTED | #D1FAE5 | #065F46 | 제출완료 | 기본 |
| DROPPED | #FEE2E2 | #991B1B | 포기 | 흐리게(opacity-50), 목록 최하단 |

### UI 원칙

- 색상만으로 상태를 구분하지 않음 (반드시 텍스트 라벨 동반)
- CTA는 파란색(Primary) / 외곽선 버튼으로 위계 구분
- 테이블은 엑셀 친숙성을 위해 유지 (카드형으로 바꾸지 말 것)
- 도움말 / 고객센터를 사이드바 하단에 항상 노출
- 메뉴명은 한국어: 홈 / 공고 찾기 / 관심 공고 / 알림 내역 / 제출 체크리스트 / 설정
- **2차 이후 기능은 메뉴에 노출하되 비활성화(disabled) 처리. 절대 제거하지 말 것**

---

## 6. 페이지 구조 (App Router)

```
frontend/app/
├── layout.tsx                    ← 최상위 레이아웃 (폰트 로드)
├── (auth)/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── onboarding/page.tsx       ← 최초 로그인 후 1회 표시되는 서비스 소개 슬라이드
└── (dashboard)/
    ├── layout.tsx                ← AppShell: Sidebar + Header
    ├── page.tsx                  ← 홈 대시보드 ("오늘 할 일")
    ├── notices/
    │   ├── page.tsx              ← 공고 찾기
    │   └── [id]/page.tsx         ← 공고 상세
    ├── watchlist/page.tsx        ← 관심 공고
    ├── alerts/page.tsx           ← 알림 내역 [3차 활성화 예정 — 현재 비활성]
    ├── checklist/page.tsx        ← 제출 체크리스트 [2차 활성화 예정 — 현재 비활성]
    └── settings/page.tsx         ← 설정
```

---

## 7. 컴포넌트 구조

```
frontend/components/
├── layout/
│   ├── Sidebar.tsx               ← 한국어 메뉴, 큰 클릭 영역, 현재 위치 강조
│   │                                비활성 메뉴는 disabled + "준비 중" 뱃지 표시
│   └── Header.tsx                ← 통합 검색, 알림 벨, 사용자 정보
├── common/
│   ├── DDayBadge.tsx             ← D-day 표시 (D-3 이하 빨간색, D-7 이하 주황색)
│   ├── EmptyState.tsx            ← 빈 상태 안내 컴포넌트
│   ├── ApiErrorState.tsx         ← API 오류 안내 + 재시도 버튼
│   └── SaveToast.tsx             ← 관심 공고 저장 완료 토스트
├── notices/
│   ├── NoticeTable.tsx           ← 엑셀 친화적 표, 높은 행 간격, 상태 라벨
│   ├── NoticeStatusBadge.tsx     ← 마감임박/정정됨/신규/검토필요 배지 (공고 자체 상태)
│   └── NoticeFilterBar.tsx       ← 업종/지역/발주기관/금액/마감일 필터
├── watchlist/
│   ├── WatchlistStatusBadge.tsx  ← 검토중/준비중/제출완료/포기 배지
│   ├── WatchlistStatusDropdown.tsx ← 상태 변경 드롭다운
│   └── MemoInput.tsx             ← 공고별 메모 입력 (최대 200자)
├── dashboard/
│   └── TaskSummaryCard.tsx       ← 마감임박/준비중/이번주마감 숫자 카드
└── checklist/
    └── ChecklistPanel.tsx        ← [2차 MVP] 공고별 진행률, 완료/대기 상태 관리
```

---

## 8. 데이터 레이어

### Mock 데이터 (백엔드 연동 전)

```
frontend/data/
├── mockNotices.ts               ← 나라장터 공고 목업 데이터
├── mockWatchlist.ts             ← 관심 공고(저장된 공고) 목업 데이터
├── mockDashboard.ts             ← 대시보드 요약 목업 데이터
└── mockChecklist.ts             ← [2차] 체크리스트 목업 데이터

frontend/types/
├── notice.ts                    ← 공고 + 관심 공고 관련 타입 정의
├── checklist.ts                 ← [2차] 체크리스트 타입
└── alert.ts                     ← [3차] 알림 타입
```

### API 클라이언트 (백엔드 연동 시)

```
frontend/lib/
├── api.ts                       ← fetch 기반 API 클라이언트
│                                   baseURL: process.env.NEXT_PUBLIC_API_URL
└── api/
    ├── notices.ts               ← 공고 검색/상세 API 함수
    ├── watchlist.ts             ← 관심 공고 저장/조회/상태변경/메모 API 함수
    ├── alerts.ts                ← [3차] 알림 API 함수
    └── checklist.ts             ← [2차] 체크리스트 API 함수
```

**구현 원칙**: 각 페이지는 `data/mock*.ts`를 import해서 사용하다가,
백엔드 연동 시 `lib/api/*.ts` 함수로 교체만 하면 되도록 인터페이스를 동일하게 유지.

---

## 9. 핵심 화면별 요구사항

### 9-1. 온보딩 슬라이드 (`app/(auth)/onboarding/page.tsx`) [1차]

- 최초 로그인 후 1회만 표시 (로컬 스토리지로 관리)
- 슬라이드 3장:
  1. "나라장터 공고를 한 곳에서" — 키워드/지역/업종으로 공고 검색
  2. "관심 공고를 저장하고 관리하세요" — 마감일 D-day 확인, 준비 상태 기록
  3. "마감을 절대 놓치지 마세요" — 마감 임박 공고 대시보드 확인
- 마지막 슬라이드에 "시작하기" 버튼 (홈으로 이동)
- "건너뛰기" 버튼 (모든 슬라이드에서 표시)

---

### 9-2. 홈 대시보드 (`app/(dashboard)/page.tsx`) [1차]

**상단 요약 카드 3개** (1차 활성):

| 카드 | 색상 | 클릭 시 이동 |
|------|------|-------------|
| 마감 임박 공고 N건 (D-3 이내) | Red #E53935 | 관심 공고 → 마감임박 탭 |
| 준비 중인 공고 N건 | Blue #1560E7 | 관심 공고 → 준비중 탭 |
| 이번 주 마감 공고 N건 (D-7 이내) | Orange #F58025 | 관심 공고 → 마감임박 탭 |

> **[2차 활성 예정]** 확인할 체크리스트 N건 카드 — 현재 비활성화(disabled, 흐리게)

**오늘 바로 확인하세요 (관심 공고 테이블)**:
- 마감 임박 관심 공고 최대 5건
- 컬럼: 공고명 / 기관명 / 마감일+D-day / 상태(WatchlistStatus) / 바로가기
- 행 높이 56px 이상
- 클릭 시 공고 상세로 이동

**최근 저장한 공고 섹션**:
- 가장 최근에 저장한 공고 3건 미리보기 (제목, 기관, D-day)
- "더보기" 클릭 시 관심 공고 페이지로 이동
- 저장한 공고 없으면 EmptyState: "아직 저장한 공고가 없어요 / 공고를 찾아서 저장해보세요 / [공고 찾기]"

> **[3차 활성 예정]** 맞춤 추천 공고 섹션

---

### 9-3. 공고 찾기 (`app/(dashboard)/notices/page.tsx`) [1차]

**검색 영역**:
- 검색 입력창 (공고명/기관명/키워드) + 검색하기 버튼
- 필터 드롭다운: 업종 / 지역 / 발주기관 / 금액 / 마감일
- Enter 키 입력 시 검색 동작

**검색 결과 테이블**:
- 컬럼: 공고명(공고번호 서브텍스트) / 기관명 / 마감일+DDayBadge / 금액 / 상태(NoticeStatusBadge) / 관심공고 저장(★)
- 정렬 드롭다운 (마감일순 기본)
- 페이지네이션

**★ 저장 버튼 동작**:
- 미저장: ★ outline → 클릭 시 저장 → ★ filled(노란색) + SaveToast 표시
- 저장됨: ★ filled → 클릭 시 저장 취소 → ★ outline

**상태 처리**:
- 로딩: Skeleton UI
- 결과 없음: EmptyState "검색 결과가 없어요 / 다른 키워드나 조건으로 검색해보세요"
- API 오류: ApiErrorState + 재시도 버튼

---

### 9-4. 공고 상세 (`app/(dashboard)/notices/[id]/page.tsx`) [1차]

**상단 공고 헤더**:
- 공고명 + NoticeStatusBadge
- 메타정보: 발주기관, 공고번호, 계약유형, 지역, 예정금액
- CTA 버튼:
  - **[1차]** 관심 공고 저장 / 공고 원문 보기
  - **[3차 비활성]** 알림 받기 버튼 — disabled + "준비 중" 표시

**핵심 지표 카드**:
- 마감일까지: D-N + 마감 날짜 (DDayBadge)
- 예정 금액: 억원 단위
- 수정 여부: 수정 없음 / 수정 있음

**관심 공고 액션 영역** (저장된 공고일 때만 표시):
- 상태 변경: WatchlistStatusDropdown
- 메모 입력: textarea (최대 200자) + 저장 버튼

**미저장 공고일 때**:
- "+ 관심 공고에 추가" 버튼 (primary)

**탭**: 상세내용 / 자격요건 / 첨부파일

---

### 9-5. 관심 공고 (`app/(dashboard)/watchlist/page.tsx`) [1차]

**탭**: 전체 / 마감임박(D-7 이내) / 준비중 / 제출완료

**공고 카드 구성**:
- 공고명 + NoticeStatusBadge
- 기관명 + DDayBadge
- WatchlistStatusBadge + WatchlistStatusDropdown
- 메모 미리보기 (없으면 "메모 추가" 연하게)
- 카드 우측 상단: "..." 메뉴 → 관심 공고 삭제

**정렬**: 마감일 임박순(기본) / 최근 저장순 / 상태순

**DROPPED 상태**: opacity-50, 목록 최하단

**빈 상태**: EmptyState "저장한 공고가 없어요 / [공고 찾기]"

---

### 9-6. 알림 내역 (`app/(dashboard)/alerts/page.tsx`) [3차 활성 예정]

- 사이드바 메뉴: disabled, 흐리게, "준비 중" 뱃지
- 페이지: EmptyState "알림 서비스를 준비 중이에요"

---

### 9-7. 제출 체크리스트 (`app/(dashboard)/checklist/page.tsx`) [2차 활성 예정]

- 사이드바 메뉴: disabled, 흐리게, "준비 중" 뱃지
- 페이지: EmptyState "체크리스트 기능을 준비 중이에요"

---

### 9-8. 설정 (`app/(dashboard)/settings/page.tsx`) [1차]

**1차 활성**: 가입 정보 / 비밀번호 변경 / 관심 조건 설정 / 로그아웃

**비활성** (disabled, "준비 중" 뱃지): 알림 설정 [3차] / 간편 모드 설정

**관심 조건 설정**:
- 지역, 공고 유형, 업종/분류, 공고 금액, 키워드 설정
- 설명: "설정한 조건은 공고 찾기에서 기본 필터로 적용돼요."
- 알림 토글: disabled + "3차 업데이트 예정"

---

## 10. Mock 데이터 구조

```typescript
// types/notice.ts

export type NoticeStatus = 'urgent' | 'corrected' | 'new' | 'review';

export type WatchlistStatus = 'REVIEWING' | 'PREPARING' | 'SUBMITTED' | 'DROPPED';

export const WATCHLIST_STATUS_LABEL: Record<WatchlistStatus, string> = {
  REVIEWING: '검토중',
  PREPARING: '준비중',
  SUBMITTED: '제출완료',
  DROPPED: '포기',
};

export interface Notice {
  id: number;
  name: string;
  agency: string;
  bidNo: string;
  deadline: string;       // YYYY-MM-DD
  deadlineTime: string;   // "오늘 18:00"
  dDay: number;
  status: NoticeStatus;
  amount: number;         // 억원
  contractType: string;
  region: string;
  isModified: boolean;
}

export interface SavedNotice extends Notice {
  watchlistStatus: WatchlistStatus;
  memo: string;
  savedAt: string;        // ISO 형식
}
```

---

## 11. 환경 변수

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# frontend/.env.local.example (커밋용)
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

---

## 12. 현재 구현 상태

```
[완료]
✅ 공통 레이아웃 (Sidebar, Header, AppShell)
✅ 타입 정의 + Mock 데이터
✅ 공통 컴포넌트 (DDayBadge, StatusBadge, EmptyState 등)
✅ 홈 대시보드
✅ 공고 찾기
✅ 공고 상세
✅ 관심 공고
✅ 설정
✅ 알림내역/체크리스트 비활성 처리
✅ 온보딩 슬라이드
✅ API 레이어 준비 (lib/api/*.ts — mock 데이터 반환)

[진행 예정]
⬜ 백엔드 API 구현 (Spring Boot)
⬜ 프론트-백엔드 연동 (lib/api/*.ts → 실제 API 호출로 교체)
⬜ 2차 MVP: 체크리스트 기능 활성화
⬜ 3차 MVP: 알림 기능 활성화
```

---

## 13. shadcn/ui 설치 컴포넌트

```bash
npx shadcn@latest add button card badge table dialog input select \
  checkbox tabs toast dropdown-menu progress separator textarea skeleton
```

---

## 14. 절대 하지 말아야 할 것

**코드 품질**:
- `any` 타입 사용 금지
- 메뉴/버튼에 영어 사용 금지 (한국어로)
- 폰트 크기 16px 미만 사용 금지
- 상태를 색상만으로 구분 금지 (텍스트 라벨 항상 동반)
- 테이블을 카드 그리드로 임의 변경 금지
- `lib/api.ts` 경로 변경 금지 (백엔드 연동 포인트)
- 목데이터를 페이지 컴포넌트 내부에 인라인으로 작성 금지

**MVP 범위 준수**:
- 2차 이후 기능을 1차에서 실제 구현 금지 (UI만 비활성화로 존재)
- 알림 발송(이메일/카카오) 기능 1차에서 구현 금지
- 조건 기반 자동 수집 스케줄러 1차에서 구현 금지
- AI/LLM 관련 기능 구현 금지
- 결제 기능 구현 금지
- 팀 공유 기능 구현 금지
- 비활성 기능을 완전히 제거 금지 (숨김/disabled 처리만 할 것)

---

## 15. 백엔드 연동 계획

```
[1차 MVP]
GET    /api/notices                    공고 검색 (나라장터 Open API 프록시)
GET    /api/notices/{id}               공고 상세
GET    /api/watchlist                  관심 공고 목록
POST   /api/watchlist/{bidNo}          관심 공고 저장
DELETE /api/watchlist/{bidNo}          관심 공고 삭제
PATCH  /api/watchlist/{bidNo}/status   관심 공고 상태 변경
PATCH  /api/watchlist/{bidNo}/memo     관심 공고 메모 저장
GET    /api/dashboard/summary          대시보드 요약

[2차 MVP 예정]
GET    /api/checklist/{bidNo}
POST   /api/checklist/{bidNo}/items
PATCH  /api/checklist/{bidNo}/items/{itemId}

[3차 MVP 예정]
GET    /api/alerts
POST   /api/settings/conditions
```

---

## 16. 프로젝트 컨텍스트

- 작성자: 이성준 (Backend Developer, 경력 약 1.5년)
- 공공 SI 나라장터 운영 경험 기반으로 기획된 도메인 프로젝트
- 포트폴리오 + 실 운영 + 수익화 목표
- Backend: Java 17 / Spring Boot / PostgreSQL / Redis
- Frontend: Next.js / TypeScript / Tailwind CSS / shadcn/ui