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

**스크립트**
> "기술 스택은 Next.js 15 풀스택 구조로 통일했습니다. 실시간은 Vercel serverless 환경에서 작동하도록 Socket.IO 대신 **Pusher Channels**를 사용했고, 오프라인 큐는 Dexie로 IndexedDB를 다룹니다."

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

**비주얼**
- 좌측: 3-stage 빌드 그림
  ```
  Stage 1: deps    (node_modules 캐시)
       ↓
  Stage 2: build   (prisma generate + next build)
       ↓
  Stage 3: runtime (non-root, ~150MB)
  ```
- 우측: `Dockerfile` 코드 일부 (스크린샷)

**언급 포인트**
- **Multi-stage**: 최종 이미지에 빌드 도구 미포함
- **Non-root user** (`USER app`)
- **HEALTHCHECK**: `/api/health`로 컨테이너 헬스 검증
- `docker-compose.yml`: app + postgres + nginx 한 번에 실행

**스크립트**
> "두 번째, Docker입니다. Dockerfile은 deps, build, runtime의 3-stage 구조로 최종 이미지를 가볍게 유지하고 non-root 사용자로 실행합니다. `docker-compose up`만 입력하면 앱·Postgres·Nginx가 한 번에 뜹니다. CI에서도 `docker build`로 smoke 테스트를 돌려 Dockerfile이 깨지지 않았는지 확인합니다."

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

**비주얼**
- ER 다이어그램 (간소화)
  ```
  User ──< BoardMember >── Board ──< List ──< Card >── Label
                              │
                              owner
  ```
- 마이그레이션 파일 6개 목록
  ```
  20260527010412_init_user
  20260527011556_add_board
  20260527011746_add_list
  20260527011934_add_card
  20260527061826_add_board_member
  20260527062133_add_label
  ```

**스크립트**
> "다섯 번째, 서버 DBMS입니다. PostgreSQL 16에 Prisma ORM을 얹어 타입 안전한 쿼리와 자동 마이그레이션을 사용했습니다. 마이그레이션 파일 6개가 슬라이스별로 코드와 함께 커밋되어, 어떤 환경에서도 `prisma migrate deploy` 한 번이면 동일한 스키마가 만들어집니다. 프로덕션 DB는 Vercel Marketplace의 Neon Postgres를 연동했습니다."

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
