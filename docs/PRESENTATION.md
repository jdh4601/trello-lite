# FlowBoard 발표 영상 구성안 (7분)

> **총 7분** = PPT 발표 6분 + 라이브 시연 1분
> **목표**: REQUIREMENTS.md 의 6개 평가 항목을 슬라이드에서 **명시적으로** 보여주고 시연으로 마무리
>
> **평가 항목 (반드시 화면에 노출)**
> 1. GitHub Actions CI/CD 파이프라인
> 2. Dockerfile / 컨테이너 실행
> 3. Nginx 설정 + 동작
> 4. Web Storage (`localStorage`/`sessionStorage`/`IndexedDB`)
> 5. 서버 DBMS 연동 + 영속화
> 6. 공개 URL 접속 가능

---

## 전체 타임라인

| # | 구간 | 분량 | 슬라이드 | 핵심 메시지 |
|---|------|------|---------|-----------|
| 1 | 표지 / 인사 | 0:00–0:15 | 1 | 프로젝트명 + 한 줄 설명 |
| 2 | 문제 정의 | 0:15–0:45 | 2 | 왜 만들었는가 |
| 3 | 서비스 소개 | 0:45–1:15 | 3 | 무엇을 하는 서비스인가 |
| 4 | 시스템 아키텍처 | 1:15–2:00 | 4 | 6개 평가 항목이 한 그림에 |
| 5 | 기술 스택 | 2:00–2:30 | 5 | 선택 이유 한 줄씩 |
| 6 | **① CI/CD (GitHub Actions)** | 2:30–3:10 | 6 | workflow 그림 + 스크린샷 |
| 7 | **② Docker** | 3:10–3:50 | 7 | multi-stage Dockerfile |
| 8 | **③ Nginx** | 3:50–4:25 | 8 | reverse proxy + WS upgrade |
| 9 | **④ Web Storage 3종** | 4:25–5:15 | 9 | 저장소 매트릭스 |
| 10 | **⑤ PostgreSQL + Prisma** | 5:15–5:45 | 10 | ER 다이어그램 + 마이그레이션 |
| 11 | **⑥ 공개 URL + 자동 배포** | 5:45–6:00 | 11 | Vercel + Neon |
| 12 | **🎬 라이브 시연** | 6:00–7:00 | 12 (또는 화면 전환) | 회원가입 → 보드 → 카드 |

> 발표 슬라이드 = 11장 + 시연 전환용 1장. 각 슬라이드 평균 30–40초.

---

## 슬라이드별 상세 스크립트

### Slide 1 — 표지 (0:00–0:15, 15초)

**비주얼**
- 프로젝트명 **FlowBoard** (대형 로고/타이포)
- 한 줄: "실시간 협업 칸반보드"
- 본인 이름 / 학번 / 과목명 / 발표일

**스크립트 (말 그대로)**
> "안녕하세요. 웹프로그래밍 프로젝트 **FlowBoard**를 발표하겠습니다. 여러 사용자가 동시에 접속해 카드를 드래그하며 협업하는 실시간 칸반보드입니다."

---

### Slide 2 — 문제 정의 (0:15–0:45, 30초)

**비주얼**
- 좌측: "팀 프로젝트의 흔한 문제" 3 bullet
- 우측: 해결 한 줄

**내용**
- 팀원이 "지금 누가 뭐 하고 있는지" 모른다
- Trello/Jira는 무겁고 기능이 너무 많다
- **가벼우면서 실시간으로 반영되는** 보드가 필요했다

**스크립트**
> "팀 프로젝트를 하다 보면 누가 무엇을 하는지 파악하기 어렵습니다. Trello 같은 도구는 기능이 많지만 무겁죠. 가볍고 즉시 반영되는 칸반보드를 직접 만들어 보고 싶었습니다."

---

### Slide 3 — 서비스 소개 (0:45–1:15, 30초)

**비주얼**
- 보드 스크린샷 1장 (3-4 컬럼, 카드 7-8장, 라벨 색 stripe 보이게)
- 우측 핵심 기능 4개 bullet

**핵심 기능**
- 보드 / 리스트 / 카드 CRUD + **드래그앤드롭**
- **실시간 동기화** (Pusher Channels)
- 라벨 · 마감일 · 필터
- **오프라인 작업 큐** (IndexedDB)

**스크립트**
> "주요 기능은 네 가지입니다. 드래그앤드롭으로 카드를 옮기고, 다른 멤버의 변경이 실시간 반영되고, 라벨·마감일로 필터링하고, 오프라인에서 한 작업도 온라인 복귀 시 자동으로 동기화됩니다."

---

### Slide 4 — 시스템 아키텍처 (1:15–2:00, 45초)

**비주얼: 한 장에 6개 평가 항목이 모두 보이도록**
```
   Browser                ← [Web Storage 3종 ④] ──┐
     │                                              │
     ↓ HTTPS                                       │
   Vercel Edge / Nginx ← ③                        │
     │                                              │
     ↓                                              │
   Next.js (Route Handlers + Pages)                │
     │                                              │
     ├──→ Pusher Channels (실시간)                │
     │                                              │
     └──→ PostgreSQL (Neon) ← ⑤ ───────────────────┘
            ↑
            │ prisma migrate
            │
   GitHub → GitHub Actions ① → Docker ② → Vercel ⑥
```

**스크립트**
> "전체 아키텍처입니다. 브라우저에서는 localStorage, sessionStorage, IndexedDB **세 종류 Web Storage를 모두** 사용합니다. 서버는 Next.js로 통합했고, 데이터는 PostgreSQL에, 실시간 브로드캐스트는 Pusher Channels를 거칩니다. main 브랜치에 push하면 GitHub Actions가 lint·test·build를 검증하고 Docker 이미지를 빌드한 뒤 Vercel이 자동 배포합니다. Nginx 설정은 자체 호스팅용으로 docker-compose에 포함되어 있습니다."

> **포인트**: 이 슬라이드 하나로 평가 항목 6개 모두 시각적으로 언급.

---

### Slide 5 — 기술 스택 (2:00–2:30, 30초)

**비주얼**: 3 컬럼 표

| 분야 | 선택 | 이유 |
|------|------|------|
| Frontend | Next.js 15 · TypeScript · Tailwind | App Router, 타입 안전성 |
| DnD | @dnd-kit | React 19 호환, 키보드 접근성 |
| Realtime | Pusher Channels | Vercel serverless 호환 |
| ORM | Prisma | 타입 안전 쿼리, 마이그레이션 |
| DB | PostgreSQL 16 (Neon) | 표준 RDB |
| 캐시 | Dexie (IndexedDB) | Promise 기반 오프라인 큐 |

**스크립트 (35–40초)**
> "기술 스택은 선택 이유를 크게 세 갈래로 정리했습니다.
>
> 먼저 **프론트엔드와 백엔드**입니다. Next.js 15 App Router 위에 TypeScript와 Tailwind를 얹어 한 프로젝트로 통일했고, 별도의 백엔드 서버를 두는 대신 Route Handlers로 API까지 같이 처리합니다. 덕분에 배포 단위와 타입 정의를 한 곳에서 공유할 수 있습니다. 드래그앤드롭은 React 19와 호환되고 키보드 접근성까지 챙긴 **@dnd-kit**을 사용했습니다.
>
> 다음은 **데이터 계층**입니다. PostgreSQL 16에 Prisma ORM을 얹은 구성인데, Prisma는 스키마 파일 하나가 곧 타입 정의가 되기 때문에 모델을 바꾸면 API와 컴포넌트 어디서든 컴파일러가 바로 잡아줍니다.
>
> 마지막으로 **실시간과 오프라인**입니다. Vercel serverless 환경에서는 WebSocket 커넥션을 직접 들고 있을 수 없어서, Socket.IO 대신 매니지드 서비스인 **Pusher Channels**로 실시간 브로드캐스트를 위임했습니다. IndexedDB는 raw API가 다루기 번거롭기 때문에 Promise 기반의 **Dexie**로 감싸 오프라인 큐를 관리합니다."

---

### Slide 6 — ① GitHub Actions CI/CD (2:30–3:10, 40초)

**비주얼**
- 좌측: 파이프라인 다이어그램
  ```
  push to main
      ↓
  [lint] → [typecheck] → [test 108개] → [build] → [Docker smoke]
      ↓
  Vercel Git Integration → 자동 배포
  ```
- 우측: GitHub Actions **녹색 체크 스크린샷** (Actions 탭)

**스크립트**
> "첫 번째 평가 항목, CI/CD입니다. `.github/workflows/ci.yml`에 정의된 파이프라인이 PR과 main push마다 자동 실행됩니다. Postgres 컨테이너를 서비스로 띄워 마이그레이션까지 적용하고, ESLint, TypeScript, **테스트 108개**, Next.js 빌드, 그리고 Docker 이미지 빌드 smoke까지 5단계를 검증합니다. main에 머지되면 Vercel이 같은 커밋을 받아 자동 배포합니다."

> **녹화 팁**: GitHub Actions 탭의 녹색 ✓ 캡처를 슬라이드에 박아두면 가장 강력.

---

### Slide 7 — ② Docker (3:10–3:50, 40초)

**비주얼: 좌측 3-stage Dockerfile · 우측 docker-compose.yml · 하단 강조 바**

#### 좌측 — Dockerfile 3-stage build (왜 3 단계인가)

| Stage | 베이스 | 하는 일 | 다음 stage로 넘기는 것 |
|-------|--------|---------|------------------------|
| **1. deps** | `node:24-alpine` | `package.json` + `prisma/` 만 복사 후 `npm ci` | `node_modules` 만 |
| **2. build** | `node:24-alpine` | `prisma generate` → `next build` (Next standalone 출력) | `.next/standalone`, `.next/static`, `prisma`, `@prisma` client |
| **3. runtime** | `node:24-alpine` | non-root `app` 유저 생성, 필요한 산출물만 `COPY --chown=app:app`, `HEALTHCHECK` 등록 | 컨테이너 — `CMD ["node","server.js"]` |

**핵심 효과**
- `node_modules` 통째로가 아니라 **`.next/standalone` 출력만** 런타임에 들고 가므로 이미지가 가벼움 (~150MB)
- `package.json` 이 안 바뀌면 Stage 1 (`npm ci`) 이 캐시 히트 → 재빌드 시간 단축
- 빌드 도구 (`prisma CLI`, `next CLI`, devDeps) 는 runtime 이미지에 **없음** → 공격 표면 축소

#### 우측 — docker-compose.yml (3 services, 1 command)

| Service | 이미지 | 핵심 설정 | 역할 |
|---------|--------|----------|------|
| `db` | `postgres:16-alpine` | `healthcheck: pg_isready` | 상태 OK 되어야 다음 단계 진행 |
| `app` | 위 Dockerfile 빌드 | `depends_on: db (service_healthy)` · `expose: 3000` | 외부에 포트 직접 노출 X — Nginx 뒤로 |
| `nginx` | `nginx:1.27-alpine` | `ports: 80:80` · `volumes: ./nginx/nginx.conf:ro` · `depends_on: [app]` | 유일한 외부 진입점 |

**언급 포인트 (보이스오버에서 짚을 키워드)**
- **Multi-stage**: 최종 이미지에 빌드 도구 미포함 (Stage 2 산출물만 Stage 3 로)
- **Non-root user** `USER app` — root 권한 escalation 차단
- **HEALTHCHECK**: `wget /api/health` 30초 주기 — DB 연결 끊기면 컨테이너 자체가 unhealthy
- **`depends_on` chain**: `db (healthy)` → `app` → `nginx` — 시작 순서가 코드로 보장
- **서비스 디스커버리**: 같은 compose 네트워크 안에서 `db:5432`, `app:3000` 처럼 **호스트명으로** 서로 호출 (포트 매핑 불필요)
- **단일 외부 포트**: 외부엔 80번만 열고 `app:3000`, `db:5432`는 컨테이너 내부망에만 노출
- **재현성**: `docker compose up` 한 줄이면 노트북·CI·평가자 PC 어디서나 동일 환경 기동

#### 하단 강조 바

> `docker compose up` 한 번으로 **app + Postgres + Nginx** 동시 기동.
> `depends_on` 체인 (`db` healthy → `app` → `nginx`) 으로 시작 순서가 보장되고, 같은 네트워크에서 `db:5432` · `app:3000` 으로 서로를 호스트명으로 호출.

#### 스크립트 (40초)

> "두 번째, Docker입니다. Dockerfile은 deps · build · runtime의 **3-stage** 구조입니다.
>
> Stage 1 `deps`는 `package.json` 만 복사해서 `npm ci`로 의존성을 받습니다 — 락 파일이 안 바뀌면 캐시 히트가 나서 재빌드가 빨라집니다.
>
> Stage 2 `build`는 `prisma generate` 와 `next build`로 **Next.js standalone** 출력을 만들고,
>
> Stage 3 `runtime`은 그 산출물만 받아 **non-root `app` 유저**로 실행합니다. `HEALTHCHECK`로 30초마다 `/api/health`를 찔러서 컨테이너 자체의 healthy 여부를 컨테이너 런타임이 판단하게 했습니다.
>
> 오른쪽 `docker-compose.yml`은 `db`, `app`, `nginx` **세 서비스**를 묶습니다. `depends_on` 체인으로 Postgres가 `pg_isready` 통과한 뒤에야 앱이 뜨고, 그 다음에 Nginx가 올라옵니다. 외부엔 80번 한 포트만 열려있고 `app:3000`, `db:5432`는 같은 compose 네트워크 안에서 호스트명으로만 접근됩니다.
>
> 결과적으로 평가자 PC든 CI든 `docker compose up` 한 줄로 동일한 3-tier가 재현됩니다. CI에서도 `docker build`로 smoke 테스트를 돌려 모든 PR 에서 Dockerfile이 깨지지 않았는지 확인합니다."

> **녹화 팁**: 슬라이드 위 손가락(또는 커서)으로 좌측 STAGE 1 → 2 → 3 을 차례로, 그다음 우측 `db` → `app` → `nginx` 를 차례로 짚어주면 시청자가 "단방향 빌드 + 단방향 기동" 흐름을 한 번에 잡는다.

---

### Slide 8 — ③ Nginx (3:50–4:25, 35초)

**비주얼**
- `nginx/nginx.conf` 핵심 4 블록 강조
  - `upstream app { server app:3000; }`
  - `location /_next/static/` — 정적 자산 1년 캐싱
  - `location /socket.io/` — **WebSocket upgrade** 헤더
  - `location /` — API + 페이지 프록시
- 우측: 로컬에서 `curl http://localhost/api/health` 결과 스크린샷

**스크립트**
> "세 번째, Nginx입니다. 단일 도메인으로 들어온 요청을 정적 자산, WebSocket, 일반 API로 분기해 Next.js로 리버스 프록시합니다. 정적 자산은 1년 immutable 캐싱, WebSocket 경로는 `Upgrade`/`Connection` 헤더를 명시해 실시간 연결이 끊기지 않게 했습니다."

> **녹화 팁**: 발표 직전 `docker compose up`을 미리 띄워두고, 슬라이드에 터미널 캡처를 넣으면 "실제로 작동한다"가 증명됨.

---

### Slide 9 — ④ Web Storage 3종 (4:25–5:15, 50초) ★ 가장 어필되는 슬라이드

**비주얼: 3 컬럼 매트릭스**

| Storage | 데이터 | 키 / 용도 | 코드 위치 |
|---------|--------|----------|----------|
| **localStorage** | UI 상태 | `ui:theme`, `ui:filters:{boardId}`, `ui:collapsed-lists:{boardId}` | `lib/storage/web-storage.ts` |
| **sessionStorage** | 작성 중 텍스트 | `draft:card:{cardId}` | `components/board/CardModal.tsx` |
| **IndexedDB** (Dexie) | 오프라인 큐 | `pendingOps` 테이블 (id, type, payload, retries) | `lib/offline/db.ts` |

**스크립트**
> "네 번째이자 가장 강조하고 싶은 부분입니다. 요건은 셋 중 **하나 이상**이었지만, 셋을 모두 다른 목적으로 활용했습니다.
> - **localStorage**는 새로고침 후에도 유지되어야 하는 UI 상태 — 다크모드 테마, 보드별 필터, 접힌 컬럼 — 를 저장합니다.
> - **sessionStorage**는 카드 모달에서 작성 중인 설명을 자동 저장해, 실수로 탭을 닫아도 다시 열면 '이전 작성 내용을 복구했습니다' 알림과 함께 복원됩니다.
> - **IndexedDB**는 Dexie 라이브러리로 오프라인 변경을 큐에 적재합니다. 네트워크가 끊긴 상태에서 카드를 추가/이동하면 IndexedDB에 쌓이고, 온라인 복귀 시 순서대로 서버에 자동 재전송됩니다."

> **시연 슬라이드(12)에서 IndexedDB 큐가 실제로 동작하는 장면을 보여주면 점수 만점.**

---

### Slide 10 — ⑤ PostgreSQL + Prisma (5:15–5:45, 30초)

**비주얼: ER 다이어그램 (한 장으로 데이터 모델 전체 설명)**

```
User ──1:N── Board ──1:N── List ──1:N── Card
  │            │                          │
  │            └─1:N─ Label ──N:M─────────┘
  │                                       │
  └──── BoardMember (JOIN · N:M) ─────────┤
                                          │
        CardAssignee (JOIN · N:M) ────────┘
```

**엔티티 4개 (실선 = 1:N 계층)**
- `User` — `id (PK, cuid)`, `email (UNIQUE)`, `passwordHash`, `name`, `createdAt`
- `Board` — `ownerId → User (FK)`, `name`, `createdAt`
- `List` — `boardId → Board (FK)`, `name`, `position (Float)`
- `Card` — `listId → List (FK)`, `title`, `position`, `dueDate?`, `description?`

**조인 테이블 / N:M 관계 (점선 박스)**
- `BoardMember` — `(boardId, userId)` 복합 PK + `role ∈ {OWNER, MEMBER}` → 멤버십·권한
- `Label` — `boardId`별로 정의되고 `Card ↔ Label`은 Prisma 암묵적 N:M 조인 테이블
- `CardAssignee` — 한 카드에 여러 담당자, 한 사용자가 여러 카드 (다이어그램에 추가된 확장 모델)

**키·인덱스 표기 (다이어그램 범례)**
- ● Primary Key, ◆ Foreign Key, ★ Unique
- 모든 FK는 **`onDelete: Cascade`** — 보드 삭제 시 list / card / member / label까지 한 트랜잭션에 정리
- 정렬 컬럼 `position`은 **복합 인덱스** (`[boardId, position]`, `[listId, position]`)로 칸반 정렬 쿼리 O(log n)
- ID는 **cuid()** — DB 라운드트립 없이 클라이언트에서 생성 가능 → 오프라인 큐와 궁합

**마이그레이션 파일 6개** (슬라이스별 커밋)
```
20260527010412_init_user
20260527011556_add_board
20260527011746_add_list
20260527011934_add_card
20260527061826_add_board_member
20260527062133_add_label
```

**스크립트 (35초 — 5초만 추가됨)**
> "다섯 번째, PostgreSQL 16 + Prisma ORM입니다. 데이터 모델은 **User → Board → List → Card** 의 1:N 단방향 계층을 뼈대로, 멤버십·라벨·담당자처럼 본질적으로 다대다인 관계는 **별도 조인 테이블** 로 분리했습니다.
>
> 예를 들어 `BoardMember`는 `(boardId, userId)` 를 복합 PK로 가지고 `role` 컬럼 하나로 OWNER/MEMBER 권한을 구분합니다. Label은 보드 단위로 정의되고 Card와는 N:M으로 연결되어 한 카드에 여러 라벨이 붙을 수 있습니다.
>
> 키 측면에서는 모든 외래키에 **`onDelete: Cascade`** 를 걸어 보드 하나를 지우면 그 아래 리스트·카드·멤버·라벨까지 한 트랜잭션에 정리되도록 했고, 카드 정렬 컬럼 `position`에는 `(listId, position)` 복합 인덱스를 걸어 드래그앤드롭 쿼리가 빠르게 동작합니다. ID는 cuid를 써서 클라이언트에서 미리 생성할 수 있게 만들었는데, 이게 오프라인 큐의 'optimistic insert' 와 자연스럽게 맞물립니다.
>
> 스키마 변경은 슬라이스별로 마이그레이션 6개로 쪼개 커밋했고, 어떤 환경에서도 `prisma migrate deploy` 한 번이면 동일한 스키마가 재현됩니다. 프로덕션 DB는 Vercel Marketplace의 Neon Postgres를 연동했습니다."

> **녹화 팁**: ERD에서 손가락(또는 커서)으로 `User → Board → List → Card` 화살표를 차례로 짚어주면 시청자가 단방향 계층을 한눈에 잡는다. 점선 박스(BoardMember / CardAssignee)는 "여기가 N:M" 이라고 명시적으로 짚어줄 것.

---

### Slide 11 — ⑥ 공개 URL + 자동 배포 (5:45–6:00, 15초)

**비주얼**
- 큰 글씨로 URL: **https://trello-lite-ecru.vercel.app**
- QR 코드 (선택)
- 우측: `curl /api/health` 응답 `{"status":"ok","db":true,"latencyMs":9}`

**스크립트**
> "여섯 번째, 공개 URL입니다. **trello-lite-ecru.vercel.app**에서 누구나 접속 가능하고, `/api/health`로 DB 연결까지 한 번에 확인할 수 있습니다. 그럼 직접 사용하는 모습을 보여드리겠습니다."

> 이 슬라이드에서 발표 화면 → **시연 화면으로 전환**.

---

### Slide 12 — 🎬 라이브 시연 (6:00–7:00, 60초)

> 화면 녹화 + 보이스오버. 슬라이드는 필요 없고 브라우저 풀스크린.

**시연 시나리오 (60초 안에)**

| 시간 | 동작 | 보이스오버 |
|------|------|----------|
| 0:00–0:10 | 메인 → **회원가입** (test@example.com / pw1234) | "이메일 회원가입 후 자동으로 보드 목록으로 이동합니다." |
| 0:10–0:15 | **+ 새 보드** → "데모 보드" | "보드를 만들고…" |
| 0:15–0:25 | + 리스트 3개 (To do / Doing / Done) + 카드 2–3개 | "리스트와 카드를 추가합니다. 모두 PostgreSQL에 저장됩니다." |
| 0:25–0:35 | 카드 **드래그앤드롭** (To do → Doing → Done) | "카드는 드래그앤드롭으로 컬럼 사이를 이동하고, position은 fractional indexing으로 단일 UPDATE만 발생합니다." |
| 0:35–0:45 | 라벨 만들기 → 카드에 색 부여 → **필터 토글** | "라벨을 만들어 카드에 붙이고 상단 필터로 즉시 좁힐 수 있습니다. 필터 상태는 localStorage에 저장돼 새로고침해도 유지됩니다." |
| 0:45–0:55 | **DevTools → Network → Offline 체크** → 카드 추가 → Offline 해제 → 자동 동기화 | "네트워크를 끊고 카드를 추가하면 IndexedDB 큐에 들어갑니다. 다시 연결하면 자동으로 서버에 전송됩니다." |
| 0:55–1:00 | 우측 상단 **녹색 '온라인' 뱃지**, 헤더 카드 반영 확인 | "감사합니다." |

**녹화 준비물 (사전 체크리스트)**
- [ ] 테스트 계정 1개 미리 생성 (cold start 회피)
- [ ] DevTools 미리 열어두고 Network 탭 고정
- [ ] 다른 브라우저 탭/알림 모두 끄기
- [ ] 마이크 음량 테스트
- [ ] 화면 해상도 1920×1080 권장
- [ ] 발표 직전 `curl /api/health`로 Neon 깨우기

---

## 🎙 녹화·편집 팁

### 음성
- 보이스오버는 슬라이드 녹화 후 **별도 트랙으로 더빙**하면 NG 시 재녹음이 쉬움
- macOS: QuickTime + AirPods, 또는 OBS Studio 무료 사용

### 화면
- 슬라이드 16:9, 1920×1080, PDF→영상이면 Keynote로 직접 export 가능
- 시연 부분만 화면 캡처 (Cmd+Shift+5 → "선택 영역 기록")

### 편집
- 7분 **엄수** (초과 시 감점). 슬라이드별 분량을 30초 단위로 미리 측정
- 컷 편집 도구: **CapCut** (무료) / **DaVinci Resolve** (무료) / iMovie
- 시작·끝 5초씩 검은 화면 fade in/out

### 자막 (선택, 권장)
- 한국어 자막을 넣으면 시청 환경(음소거)에서 평가에 유리
- CapCut의 자동 자막 → 수동 수정 추천

---

## 📋 최종 제출 직전 체크리스트

**기술**
- [ ] https://trello-lite-ecru.vercel.app `/api/health` 200 OK
- [ ] 회원가입 → 보드 생성 → 카드 추가 풀 플로우 동작
- [ ] GitHub Actions Actions 탭에 최근 ✓ 녹색 build
- [ ] (선택) Vercel에 `PUSHER_*` 환경변수 설정 → 두 브라우저 실시간 시연 가능
- [ ] (선택) `docker compose up` 으로 로컬 Nginx 동작 1회 확인 후 캡처

**영상**
- [ ] 길이 7분 0초 이하
- [ ] 슬라이드 1–11 + 시연 1분이 빠짐없이 포함
- [ ] REQUIREMENTS.md의 6개 항목이 슬라이드 5–11에 **명시적으로 라벨링**되어 등장 (①②③④⑤⑥)
- [ ] 보이스오버 음성 클리핑/노이즈 점검
- [ ] mp4 1080p 100MB 이하 권장

**제출 패키지**
- [ ] 공개 URL: `https://trello-lite-ecru.vercel.app`
- [ ] 발표 영상: `flowboard_presentation.mp4`
- [ ] (선택) GitHub 저장소 링크: `https://github.com/jdh4601/trello-lite`

---

## 🔁 분량 압축 옵션 (7분 초과 시)

분량 초과 위험 시 다음 순서로 컷:
1. Slide 2 (문제 정의) 30초 → 15초로 축약 — bullet 3개만 띄우고 한 줄로 마무리
2. Slide 5 (기술 스택) 30초 → **삭제** — Slide 4 아키텍처에서 이미 언급
3. Slide 7 (Docker) 40초 → 25초 — multi-stage 그림 한 장에 집중, HEALTHCHECK 생략

반대로 시간 남으면: Slide 9 (Web Storage)에 IndexedDB 쪽 코드 한 줄 더 띄워 어필 강화.
