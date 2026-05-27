# ARCHITECTURE — FlowBoard (실시간 협업 칸반보드)

> **연관 문서**: [PRD.md](./PRD.md) · [REQUIREMENTS.md](./REQUIREMENTS.md)
> **작성일**: 2026-05-27

---

## 1. 시스템 개요

### 1.1. 아키텍처 한눈에 보기

```
                       ┌─────────────────────────────────────┐
                       │           Browser (Client)          │
                       │  ┌──────────────────────────────┐   │
                       │  │  Next.js App (React 19)      │   │
                       │  │  - @dnd-kit (DnD)            │   │
                       │  │  - Socket.IO Client          │   │
                       │  │  - TanStack Query            │   │
                       │  │  - Zustand (UI state)        │   │
                       │  │  - Dexie (IndexedDB)         │   │
                       │  └──────────────────────────────┘   │
                       └────────────┬────────────────────────┘
                                    │ HTTPS / WSS
                                    ▼
                       ┌─────────────────────────────────────┐
                       │         Nginx (Reverse Proxy)       │
                       │  - TLS 종료                          │
                       │  - /        → Next.js               │
                       │  - /api     → Express               │
                       │  - /socket  → Socket.IO (WS upgrade)│
                       │  - 정적 자산 캐싱                     │
                       └────────────┬────────────────────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  ▼                 ▼                 ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │ Next.js SSR  │  │ Express API  │  │ Socket.IO    │
        │ (Node 24)    │  │ (Node 24)    │  │ (Node 24)    │
        └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
               │                 │                 │
               └─────────────────┼─────────────────┘
                                 ▼
                       ┌──────────────────┐
                       │   PostgreSQL 16  │
                       │   (Prisma ORM)   │
                       └──────────────────┘
```

### 1.2. 컴포넌트 책임 분리

| 컴포넌트 | 책임 |
|---------|------|
| **Next.js** | UI 렌더링, 페이지 라우팅, SSR, 정적 자산 |
| **Express API** | REST 비즈니스 로직, 인증, DB 접근 |
| **Socket.IO** | 실시간 이벤트 브로드캐스트, 보드 room 관리 |
| **Nginx** | 단일 도메인 진입점, 경로별 라우팅, TLS |
| **PostgreSQL** | 영속 데이터 (유저·보드·리스트·카드) |

> **설계 결정**: Express와 Socket.IO를 같은 Node 프로세스에서 실행 (`server.ts`에서 `http.createServer()` 공유). 별도 서비스로 분리하면 인증/세션 공유가 복잡해지고, 과제 규모에선 오버엔지니어링.

---

## 2. 기술 스택

### 2.1. Frontend

| 분야 | 선택 | 이유 |
|------|------|------|
| Framework | Next.js 15 (App Router) | SSR + 파일 기반 라우팅, Vercel 배포 친화 |
| Language | TypeScript 5 | 타입 안정성 (`strict: true`) |
| Styling | Tailwind CSS 4 + shadcn/ui | 빠른 프로토타이핑 + 일관된 디자인 |
| Drag & Drop | **@dnd-kit/core** | React 19 호환, react-beautiful-dnd는 deprecated |
| 실시간 | Socket.IO Client 4 | 자동 재연결, fallback 지원 |
| Server State | TanStack Query 5 | 캐시, 낙관적 업데이트, 무효화 |
| Client State | Zustand 4 | 보일러플레이트 적음, 셀렉터 기반 |
| IndexedDB | Dexie.js 4 | Promise 기반, 마이그레이션 지원 |
| 폼 | React Hook Form + Zod | 검증 일원화 |

### 2.2. Backend

| 분야 | 선택 | 이유 |
|------|------|------|
| Runtime | Node.js 24 LTS | 기본 권장 버전 |
| API | Express 4 | 가볍고 학습 곡선 낮음 |
| WebSocket | Socket.IO 4 | room 기능 내장 |
| ORM | Prisma 5 | 타입 안전 쿼리, 마이그레이션 |
| DB | PostgreSQL 16 | 트랜잭션·인덱스 표준 |
| Auth | bcrypt + jsonwebtoken | 표준, 검증된 라이브러리 |
| 보안 | helmet, cors, express-rate-limit | OWASP 기본 |
| 검증 | Zod | 클라이언트와 스키마 공유 |
| 로깅 | pino | 구조화 JSON 로그 |

### 2.3. Infra & Tooling

| 분야 | 선택 |
|------|------|
| Container | Docker (multi-stage build) |
| Orchestration | Docker Compose (개발 + 단일 VPS 배포 시) |
| Reverse Proxy | Nginx 1.27 |
| CI/CD | GitHub Actions |
| 배포 | Vercel (Next.js) + Railway/Render (API + Postgres) **또는** 단일 VPS Docker Compose |
| 테스트 | Vitest (단위), Playwright (E2E, 선택) |
| Lint/Format | ESLint + Prettier |

---

## 3. 데이터 모델

### 3.1. ER 다이어그램

```
┌──────────┐      ┌─────────────┐      ┌──────────┐
│   User   │──┬──<│ BoardMember │>──┬──│  Board   │
└──────────┘  │   └─────────────┘   │  └────┬─────┘
              │                     │       │
              │                     │       │ 1:N
              │                     │       ▼
              │                     │  ┌──────────┐
              │                     │  │   List   │
              │                     │  └────┬─────┘
              │                     │       │ 1:N
              │                     │       ▼
              │   ┌──────────────┐  │  ┌──────────┐
              └──<│ CardAssignee │>─┼──│   Card   │
                  └──────────────┘  │  └────┬─────┘
                                    │       │ N:M
                                    │       ▼
                                    │  ┌──────────┐
                                    └─<│  Label   │
                                       └──────────┘
```

### 3.2. Prisma 스키마 (요약)

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  createdAt    DateTime @default(now())

  ownedBoards  Board[]        @relation("BoardOwner")
  memberships  BoardMember[]
  assignments  CardAssignee[]
}

model Board {
  id        String   @id @default(cuid())
  name      String
  ownerId   String
  owner     User     @relation("BoardOwner", fields: [ownerId], references: [id])
  createdAt DateTime @default(now())

  members BoardMember[]
  lists   List[]
  labels  Label[]
}

model BoardMember {
  boardId String
  userId  String
  role    Role   @default(MEMBER)
  board   Board  @relation(fields: [boardId], references: [id], onDelete: Cascade)
  user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([boardId, userId])
}

enum Role {
  OWNER
  MEMBER
}

model List {
  id       String  @id @default(cuid())
  boardId  String
  name     String
  position Float
  board    Board   @relation(fields: [boardId], references: [id], onDelete: Cascade)
  cards    Card[]

  @@index([boardId, position])
}

model Card {
  id          String         @id @default(cuid())
  listId      String
  title       String
  description String?        @db.Text
  position    Float
  dueDate     DateTime?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  list        List           @relation(fields: [listId], references: [id], onDelete: Cascade)
  labels      Label[]        @relation("CardLabels")
  assignees   CardAssignee[]

  @@index([listId, position])
}

model Label {
  id      String @id @default(cuid())
  boardId String
  name    String
  color   String
  board   Board  @relation(fields: [boardId], references: [id], onDelete: Cascade)
  cards   Card[] @relation("CardLabels")
}

model CardAssignee {
  cardId String
  userId String
  card   Card   @relation(fields: [cardId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([cardId, userId])
}
```

### 3.3. 핵심 인덱스 / 쿼리 패턴

| 쿼리 | 인덱스 |
|------|--------|
| 보드의 리스트를 순서대로 조회 | `List(boardId, position)` |
| 리스트의 카드를 순서대로 조회 | `Card(listId, position)` |
| 사용자의 보드 멤버십 확인 | `BoardMember(userId, boardId)` PK |

### 3.4. Position 알고리즘 (Fractional Indexing)

- `position`은 `Float` (예: 1.0, 2.0, 3.0)
- A와 B 사이로 이동: `newPosition = (A.position + B.position) / 2`
- 맨 앞: `firstCard.position - 1`
- 맨 뒤: `lastCard.position + 1`
- **재배치 임계점**: 두 카드의 position 차이 < `1e-6`이면 해당 리스트의 모든 카드 position을 `1, 2, 3, ...`으로 정수 재할당 (트랜잭션)
- **장점**: 카드 1개 이동 시 1개 row만 UPDATE (O(1))
- **트레이드오프**: 정밀도 손실 가능 → 위 재배치 로직으로 보완

---

## 4. API 명세

### 4.1. 인증

| Method | Path | Body | 응답 |
|--------|------|------|------|
| POST | `/api/auth/signup` | `{ email, password, name }` | `{ user }` + Set-Cookie |
| POST | `/api/auth/login` | `{ email, password }` | `{ user }` + Set-Cookie |
| POST | `/api/auth/logout` | — | 204 |
| GET | `/api/auth/me` | — | `{ user }` |

- JWT를 `httpOnly`, `Secure`, `SameSite=Lax` 쿠키에 저장
- 토큰 만료: 7일

### 4.2. 보드

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| GET | `/api/boards` | 인증 | 내 보드 목록 |
| POST | `/api/boards` | 인증 | 보드 생성 (owner = 본인) |
| GET | `/api/boards/:id` | 멤버 | 보드 + lists + cards 풀로딩 |
| PATCH | `/api/boards/:id` | owner | 이름 변경 |
| DELETE | `/api/boards/:id` | owner | 삭제 (cascade) |
| POST | `/api/boards/:id/invite` | owner | `{ email }` 멤버 추가 |
| DELETE | `/api/boards/:id/members/:userId` | owner | 멤버 추방 |

### 4.3. 리스트 / 카드

| Method | Path | Body |
|--------|------|------|
| POST | `/api/lists` | `{ boardId, name, position }` |
| PATCH | `/api/lists/:id` | `{ name?, position? }` |
| DELETE | `/api/lists/:id` | — |
| POST | `/api/cards` | `{ listId, title, position }` |
| PATCH | `/api/cards/:id` | `{ title?, description?, listId?, position?, dueDate?, labelIds?, assigneeIds? }` |
| DELETE | `/api/cards/:id` | — |

### 4.4. 공통 응답

```json
// 성공
{ "data": { ... } }

// 에러
{ "error": { "code": "BOARD_NOT_FOUND", "message": "..." } }
```

- HTTP 상태 코드는 표준 준수 (`200`, `201`, `400`, `401`, `403`, `404`, `409`, `500`)

---

## 5. 실시간 동기화 (Socket.IO)

### 5.1. 연결 흐름

```
1. Client: 페이지 진입 → io.connect() (쿠키로 인증)
2. Server: 쿠키 JWT 검증 → socket.userId 부여
3. Client: emit("board:join", { boardId })
4. Server: 멤버 권한 확인 → socket.join(`board:${boardId}`)
5. Client: emit("board:leave") 또는 disconnect 시 자동 leave
```

### 5.2. 이벤트 카탈로그

#### Client → Server
| Event | Payload | 설명 |
|-------|---------|------|
| `board:join` | `{ boardId }` | 보드 room 참가 |
| `board:leave` | `{ boardId }` | 명시적 나가기 |
| `board:sync` | `{ boardId }` | 재연결 시 전체 상태 재요청 |

#### Server → Client (브로드캐스트)
| Event | Payload | 트리거 |
|-------|---------|--------|
| `list:created` | `{ list }` | POST /api/lists |
| `list:updated` | `{ list }` | PATCH /api/lists/:id |
| `list:deleted` | `{ listId }` | DELETE /api/lists/:id |
| `card:created` | `{ card }` | POST /api/cards |
| `card:updated` | `{ card }` | PATCH /api/cards/:id (title/desc 등) |
| `card:moved` | `{ cardId, fromListId, toListId, position }` | PATCH /api/cards/:id (listId/position) |
| `card:deleted` | `{ cardId, listId }` | DELETE /api/cards/:id |
| `member:joined` | `{ user }` | 초대 수락 |
| `presence:update` | `{ userId, cursor? }` | 선택: 커서 표시 |

### 5.3. 낙관적 업데이트 + Echo 방지

```ts
// 클라이언트
mutation.mutate(payload, {
  onMutate: () => optimisticUpdate(payload),
  onError: () => rollback(),
})

// REST 응답에 X-Socket-Id 헤더로 본인 소켓 ID 동봉
// 서버는 io.to(room).except(socketId).emit(...) 로 본인 제외 브로드캐스트
```

### 5.4. 충돌 해결 전략

- **단일 카드 동시 수정**: 마지막 쓰기 승리 (last-write-wins) — `updatedAt`으로 stale 응답 무시
- **동시 이동**: 서버가 트랜잭션으로 position 재계산 후 결과를 모두에게 브로드캐스트 → 클라이언트는 서버 응답을 진실로 간주
- **재연결**: `board:sync` 시 클라이언트의 IndexedDB 큐 flush → 서버 전체 상태 수신 → 로컬 덮어쓰기

---

## 6. 클라이언트 캐시 & 오프라인

### 6.1. 저장소 매트릭스

| 저장소 | 데이터 | 키 / 스키마 |
|--------|-------|------------|
| `localStorage` | UI 상태 | `ui:collapsed-lists`, `ui:filters`, `ui:theme` |
| `sessionStorage` | 작성 중 텍스트 | `draft:card:<cardId>` |
| `IndexedDB` (Dexie) | 보드 스냅샷, 미전송 큐 | tables: `boards`, `lists`, `cards`, `pendingOps` |

### 6.2. 오프라인 큐 처리

```ts
// pendingOps 테이블
{
  id: autoincrement,
  type: 'card:update' | 'card:move' | 'card:create' | ...,
  payload: { ... },
  createdAt: timestamp,
  retries: number
}
```

흐름:
1. 네트워크 OFF 감지 (`navigator.onLine === false` + fetch 실패)
2. 변경 → IndexedDB 즉시 반영 + `pendingOps`에 append
3. 네트워크 복귀 → `pendingOps` 순서대로 재전송
4. 서버 성공 응답 → 큐에서 제거
5. 충돌 (409) → 사용자에게 알림 + 큐 제거 + `board:sync`

### 6.3. TanStack Query 캐시 키

```ts
['board', boardId]              // 보드 전체 (lists + cards)
['boards']                       // 내 보드 목록
['user']                         // 현재 유저
```

WebSocket 이벤트 수신 시 해당 캐시를 `queryClient.setQueryData`로 패치 (재요청 없이 즉시 반영).

---

## 7. 인프라 구성

### 7.1. Docker

**`Dockerfile`** (multi-stage):
```dockerfile
# Stage 1: deps
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: build
FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# Stage 3: runtime
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/prisma ./prisma
EXPOSE 3000
CMD ["node", "server.js"]
```

**`docker-compose.yml`** (개발 또는 단일 VPS 배포):
```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: flowboard
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: flowboard
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U flowboard"]
      interval: 5s

  app:
    build: .
    environment:
      DATABASE_URL: postgresql://flowboard:${DB_PASSWORD}@db:5432/flowboard
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      db:
        condition: service_healthy
    expose:
      - "3000"

  nginx:
    image: nginx:1.27-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/certs:/etc/nginx/certs:ro
    depends_on:
      - app

volumes:
  db-data:
```

### 7.2. Nginx 설정 핵심

```nginx
upstream app {
  server app:3000;
}

server {
  listen 443 ssl http2;
  server_name flowboard.example.com;

  ssl_certificate     /etc/nginx/certs/fullchain.pem;
  ssl_certificate_key /etc/nginx/certs/privkey.pem;

  # 정적 자산 캐싱
  location /_next/static/ {
    proxy_pass http://app;
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # Socket.IO (WebSocket upgrade 필수)
  location /socket.io/ {
    proxy_pass http://app;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
  }

  # API + Next.js
  location / {
    proxy_pass http://app;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

server {
  listen 80;
  server_name flowboard.example.com;
  return 301 https://$host$request_uri;
}
```

> **함정 주의**: WebSocket은 `Upgrade`/`Connection` 헤더 없으면 동작 안 함. 과제 시연 직전 가장 잘 깨지는 부분.

### 7.3. 환경 변수

| 변수 | 용도 |
|------|------|
| `DATABASE_URL` | Postgres 연결 |
| `JWT_SECRET` | JWT 서명 키 (32자+) |
| `NODE_ENV` | `production` / `development` |
| `NEXT_PUBLIC_SOCKET_URL` | 클라이언트가 접속할 WS URL |
| `CORS_ORIGINS` | 허용 도메인 (쉼표 구분) |

`.env.example` 커밋, `.env`는 `.gitignore`.

---

## 8. CI/CD

### 8.1. GitHub Actions 워크플로우

**`.github/workflows/ci.yml`** (PR/푸시 검증)
```yaml
on: [pull_request, push]
jobs:
  ci:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: test }
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24 }
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

**`.github/workflows/deploy.yml`** (main 푸시 시 배포)
```yaml
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # 옵션 A: Vercel
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
      # 옵션 B: VPS Docker (대안)
      # - uses: appleboy/ssh-action@v1
      #   with:
      #     host: ${{ secrets.VPS_HOST }}
      #     ...
      #     script: cd /srv/flowboard && git pull && docker compose up -d --build
```

### 8.2. 파이프라인 단계

```
PR 생성/푸시
    │
    ├── lint (ESLint)
    ├── typecheck (tsc --noEmit)
    ├── test (Vitest)
    └── build (next build)
        │
        └── main 머지 시
            └── deploy (Vercel 또는 VPS)
```

---

## 9. 보안

| 영역 | 대책 |
|------|------|
| 비밀번호 | bcrypt (cost factor 12) |
| 세션 | JWT httpOnly + Secure + SameSite=Lax |
| CSRF | SameSite 쿠키 + 상태 변경 API에 Origin 검증 |
| XSS | React 자동 이스케이프 + dangerouslySetInnerHTML 금지 |
| SQL Injection | Prisma 파라미터 바인딩 (raw query 금지) |
| Rate Limit | `/api/auth/*` 분당 5회, 그 외 분당 60회 |
| CORS | 화이트리스트, wildcard 금지 |
| HTTP 헤더 | helmet (CSP, HSTS, X-Frame-Options 등) |
| 의존성 | Dependabot weekly + `npm audit` CI 체크 |

---

## 10. 비기능 요구사항

| 항목 | 목표 | 측정 방법 |
|------|------|----------|
| 실시간 반영 지연 | < 500ms (동일 보드 멤버 간) | 두 브라우저 시연 + 콘솔 타임스탬프 |
| 카드 이동 UI 응답 | < 50ms (낙관적 업데이트) | Chrome DevTools Performance |
| 보드 카드 500개 시 드래그 | 60fps 유지 | DevTools FPS 미터 |
| 첫 페이지 로드 (LCP) | < 2.5s | Lighthouse |
| 가용성 | 시연 기간 100% | UptimeRobot (선택) |
| 접근성 | 키보드만으로 카드 이동 가능 | @dnd-kit Sortable 키보드 핸들러 |

---

## 11. 디렉터리 구조 (계획)

```
web-project/
├── REQUIREMENTS.md
├── PRD.md
├── ARCHITECTURE.md          ← 본 문서
├── README.md
├── docker-compose.yml
├── Dockerfile
├── nginx/
│   └── nginx.conf
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── apps/
│   └── web/                 ← Next.js
│       ├── app/
│       ├── components/
│       ├── lib/
│       │   ├── socket.ts
│       │   ├── db/          ← Dexie 정의
│       │   └── queries/     ← TanStack Query 훅
│       └── server.ts        ← Next + Express + Socket.IO 통합
├── packages/
│   └── shared/              ← Zod 스키마, 타입 공유
└── tests/
    ├── unit/
    └── e2e/
```

> 모노레포가 부담스러우면 `apps/`, `packages/` 없이 루트에 두는 단일 패키지 구조로 시작해도 무방.

---

## 12. 향후 확장 여지 (참고)

- Redis adapter로 Socket.IO 수평 확장
- CRDT (Yjs) 도입으로 충돌 해결 자동화
- OAuth (Google, GitHub) 추가
- 파일 첨부 (S3 또는 Vercel Blob)
- 활동 로그·알림 시스템
