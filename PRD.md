# PRD — 실시간 협업 칸반보드 (Trello-lite)

> **프로젝트 코드명**: `FlowBoard`
> **과목**: 웹프로그래밍
> **마감**: 2026-06-09 23:59:59
> **작성일**: 2026-05-27
>
> **연관 문서**: [REQUIREMENTS.md](./REQUIREMENTS.md) · [ARCHITECTURE.md](./ARCHITECTURE.md)
> - 본 PRD는 **제품·사용자·범위** 관점.
> - 기술 스택·데이터 모델·API·인프라 등 **구현 아키텍처**는 [ARCHITECTURE.md](./ARCHITECTURE.md) 참고.

---

## 1. 제품 개요 (Overview)

### 1.1. 한 줄 설명
> **여러 사용자가 동시에 접속해 카드를 드래그하며 협업하는 실시간 칸반보드.**

### 1.2. 문제 정의
- 팀 프로젝트에서 "누가 뭐 하고 있는지" 파악이 어렵다.
- Trello/Jira는 기능이 너무 많고 무겁다.
- 가벼우면서도 **실시간 반영**되는 협업 보드가 필요하다.

### 1.3. 타겟 사용자
- 학교 팀 프로젝트 그룹 (3~5명)
- 스터디·동아리 운영진
- 1인 To-do 관리도 가능

### 1.4. 핵심 가치 제안
1. **즉시 협업**: 가입 후 1분 안에 보드 생성·공유
2. **실시간**: 다른 멤버의 변경이 즉시 반영 (WebSocket)
3. **오프라인 내성**: 네트워크 끊겨도 로컬에서 작업 → 복귀 시 sync

---

## 2. 발표 시연 시나리오 (7분 영상 기준)

| 시간 | 내용 |
|------|------|
| 0:00–0:30 | 서비스 소개·문제 정의 |
| 0:30–1:30 | 회원가입 → 보드 생성 → 멤버 초대 |
| 1:30–3:30 | **두 브라우저 띄우고 실시간 동기화 시연** (드래그·카드 추가·라벨 변경) |
| 3:30–4:30 | 오프라인 모드 시연 (네트워크 OFF → 작업 → ON → sync) |
| 4:30–5:30 | localStorage 캐시·필터 시연 |
| 5:30–6:30 | 아키텍처·CI/CD·Docker·Nginx 구성 설명 |
| 6:30–7:00 | 마무리·향후 계획 |

---

## 3. 사용자 스토리 (User Stories)

### P0 (필수, MVP)
- **US-01**: 사용자로서, 이메일·비밀번호로 회원가입/로그인할 수 있다.
- **US-02**: 사용자로서, 보드를 생성하고 이름을 지정할 수 있다.
- **US-03**: 사용자로서, 보드에 리스트(컬럼)를 추가/이름변경/삭제할 수 있다.
- **US-04**: 사용자로서, 리스트에 카드를 추가/수정/삭제할 수 있다.
- **US-05**: 사용자로서, 카드를 드래그앤드롭으로 리스트 간/리스트 내에서 이동할 수 있다.
- **US-06**: 사용자로서, **다른 멤버의 변경을 새로고침 없이 실시간**으로 본다.
- **US-07**: 사용자로서, 이메일로 다른 사용자를 보드에 초대할 수 있다.

### P1 (중요)
- **US-08**: 카드에 라벨(색상 태그)을 붙일 수 있다.
- **US-09**: 카드에 마감일(due date)을 설정할 수 있다.
- **US-10**: 카드를 라벨/담당자/마감임박으로 필터링할 수 있다.
- **US-11**: 접힌 컬럼 상태·필터 설정이 **새로고침 후에도 유지**된다 (`localStorage`).
- **US-12**: 오프라인 상태에서 변경한 내용이 온라인 복귀 시 자동 sync된다.

### P2 (있으면 좋음)
- **US-13**: 카드에 댓글을 달 수 있다.
- **US-14**: 카드에 체크리스트를 추가할 수 있다.
- **US-15**: 활동 로그(누가 무엇을 바꿨는지)를 확인할 수 있다.
- **US-16**: 다크 모드 토글 (설정은 `localStorage` 저장).

---

## 4. 기능 명세 (Functional Spec)

### 4.1. 인증 (Auth)
- 이메일 + 비밀번호 로그인 (bcrypt 해싱)
- JWT 발급 → `httpOnly` 쿠키 저장
- 비밀번호 최소 8자, 영문+숫자 포함

### 4.2. 보드 (Board)
- 사용자는 N개의 보드 소유/참여 가능
- 보드는 1명의 owner + 여러 명의 member
- 보드 삭제는 owner만 가능

### 4.3. 리스트 (List / Column)
- 보드 내 순서(`position`) 보유
- 정렬: `position` 오름차순
- 리스트 간 드래그 시 `position` 재계산 (Lexorank 또는 fractional indexing)

### 4.4. 카드 (Card)
- 필드: `title`, `description`, `labels[]`, `dueDate`, `assignees[]`, `position`, `listId`
- 카드 이동 = `listId` + `position` 업데이트
- 낙관적 업데이트 (UI 즉시 반영 → 서버 응답 시 확정/롤백)

### 4.5. 실시간 동기화
- WebSocket (Socket.IO 또는 ws) 사용
- 이벤트:
  - `card:created`, `card:updated`, `card:moved`, `card:deleted`
  - `list:created`, `list:updated`, `list:deleted`
  - `member:joined`, `member:left`
- 보드별 room 분리 → 같은 보드 멤버에게만 브로드캐스트
- 본인이 발생시킨 이벤트는 echo 안 함 (낙관적 업데이트와 충돌 방지)

### 4.6. 오프라인/캐시 전략
| 데이터 | 저장소 | 용도 |
|--------|--------|------|
| 보드 스냅샷 | `IndexedDB` | 오프라인 진입 시 즉시 렌더 |
| 미전송 변경 큐 | `IndexedDB` | 네트워크 복귀 시 순서대로 재전송 |
| UI 상태 (접힌 컬럼, 필터, 다크모드) | `localStorage` | 새로고침 후 복원 |
| 작성 중인 카드 임시 텍스트 | `sessionStorage` | 실수로 닫아도 복구 |

---

## 5. 구현 아키텍처

> 기술 스택, 데이터 모델(ER/Prisma), API 명세, WebSocket 이벤트, 캐시·오프라인 전략, Docker/Nginx 설정, CI/CD, 보안, 비기능 목표 — **모두 [ARCHITECTURE.md](./ARCHITECTURE.md)** 에 정리.

요약:
- **Frontend**: Next.js 15 + TypeScript + Tailwind + @dnd-kit + Socket.IO Client + TanStack Query + Dexie
- **Backend**: Node.js 24 + Express + Socket.IO + Prisma + PostgreSQL 16
- **Infra**: Docker (multi-stage) + Nginx (WS upgrade) + GitHub Actions + Vercel 또는 VPS
- **Web Storage 3종 모두 활용**: `localStorage`(UI 상태) · `sessionStorage`(작성 중 텍스트) · `IndexedDB`(오프라인 큐·보드 캐시)

상세 결정 배경·트레이드오프는 ARCHITECTURE 문서 참고.

---

## 6. 마일스톤 (2026-05-27 → 2026-06-09, 약 13일)

| 단계 | 기간 | 산출물 |
|------|------|--------|
| **M1. 셋업** | Day 1–2 (5/27–5/28) | 레포 생성, Next.js + Express + Prisma + Postgres, Docker Compose, Nginx 설정, GitHub Actions 스켈레톤 |
| **M2. 인증·보드** | Day 3–4 (5/29–5/30) | 회원가입/로그인, 보드 CRUD, 보드 멤버 초대 |
| **M3. 리스트·카드** | Day 5–6 (5/31–6/1) | 리스트/카드 CRUD, position 알고리즘, 드래그앤드롭 |
| **M4. 실시간 동기화** | Day 7–8 (6/2–6/3) | Socket.IO 통합, 낙관적 업데이트, 충돌 방지 |
| **M5. 오프라인·캐시** | Day 9 (6/4) | IndexedDB 큐, localStorage UI 상태 |
| **M6. 라벨·마감일·필터** | Day 10 (6/5) | P1 기능 완성 |
| **M7. 배포·QA** | Day 11–12 (6/6–6/7) | 프로덕션 배포, 버그 수정, 성능 점검 |
| **M8. 발표 영상** | Day 13 (6/8) | 7분 시연 녹화·편집 |
| **🚀 제출** | 6/9 | 배포 URL + 영상 |

---

## 7. 리스크 & 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 실시간 동기화 충돌 (두 사용자가 같은 카드 동시 이동) | 데이터 꼬임 | 서버에서 `position` 재계산 후 브로드캐스트, 클라이언트는 서버 값 우선 |
| 드래그 중 position 정밀도 부족 | 정렬 깨짐 | fractional indexing (소수 position) 또는 주기적 재배치 |
| WebSocket 연결 끊김 | 변경 누락 | 재연결 시 `board:sync` 이벤트로 보드 전체 상태 재수신 |
| Nginx + WebSocket 프록시 설정 누락 | 실시간 안 됨 | `proxy_set_header Upgrade $http_upgrade; Connection "upgrade";` 명시 |
| 배포 환경 차이 | 로컬 OK, 프로덕션 실패 | Docker로 환경 통일, 스테이징 환경 1회 검증 |

---

## 8. 과제 요구사항 매핑 (REQUIREMENTS.md ↔ PRD ↔ ARCHITECTURE)

| 필수 요건 | 충족 방식 | 상세 위치 |
|----------|----------|----------|
| GitHub Actions CI/CD | `lint·test·build·deploy` 자동화 | ARCHITECTURE §8 |
| Docker | 멀티스테이지 Dockerfile + Compose | ARCHITECTURE §7.1 |
| Nginx | 리버스 프록시 + WebSocket upgrade | ARCHITECTURE §7.2 |
| Web Storage | `localStorage` + `sessionStorage` + `IndexedDB` **3종 모두 사용** | ARCHITECTURE §6 |
| DBMS | PostgreSQL + Prisma | ARCHITECTURE §3 |
| 공개 URL | Vercel 또는 VPS Docker 배포 | ARCHITECTURE §8 |
| 7분 발표 영상 | 시연 시나리오 | PRD §2 |

---

## 9. Out of Scope (이번 학기엔 안 함)

- 모바일 네이티브 앱
- 외부 SSO (Google, GitHub OAuth) — 시간되면 보너스
- 결제·구독 모델
- 첨부파일 업로드 (P2 이후)
- 다국어 지원
