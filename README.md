# FlowBoard — 실시간 협업 칸반보드 (Trello-lite)

> 웹프로그래밍 과제 프로젝트 · 마감 2026-06-09
>
> **Live**: https://trello-lite-ecru.vercel.app

여러 사용자가 동시에 접속해 카드를 드래그하며 협업하는 실시간 칸반보드.

## ✨ 주요 기능

- 보드 / 리스트 / 카드 CRUD + 드래그앤드롭
- WebSocket 기반 실시간 동기화 (다른 멤버의 변경이 즉시 반영)
- 라벨 · 마감일 · 필터
- 오프라인 작업 → 온라인 복귀 시 자동 sync (IndexedDB 큐)
- UI 상태 영속화 (접힌 컬럼·필터·테마)

## 🧱 기술 스택

| 분야 | 사용 기술 |
|------|---------|
| Frontend | Next.js 15 · TypeScript · Tailwind · @dnd-kit · Socket.IO Client · TanStack Query · Dexie |
| Backend | Node.js 24 · Express · Socket.IO · Prisma · PostgreSQL 16 |
| Infra | Docker · Nginx · GitHub Actions · Vercel/VPS |

## 📚 문서

| 문서 | 내용 |
|------|------|
| [REQUIREMENTS.md](./REQUIREMENTS.md) | 과제 필수 요구 조건 · 평가 체크리스트 |
| [PRD.md](./PRD.md) | 제품 명세 · 사용자 스토리 · 마일스톤 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 시스템 설계 · 데이터 모델 · API · 인프라 |

## 🗓 일정

13일 (2026-05-27 → 2026-06-09), 12개 트레이서 불릿 슬라이스로 분할. 진행 상황은 Linear 프로젝트에서 추적.

## 🧪 테스트 (배포된 사이트에서 동작 확인)

### 빠른 헬스 체크
```bash
curl https://trello-lite-ecru.vercel.app/api/health
```
기대: `{"status":"ok","db":true,...}`

### 브라우저로 직접 사용해보기

1. https://trello-lite-ecru.vercel.app 접속
2. **회원가입** 클릭
3. 다음 정보로 가입:

   | 항목 | 예시 | 규칙 |
   |------|------|------|
   | 이름 | 홍길동 | 1~50자 |
   | 이메일 | test@example.com | 이메일 형식 |
   | 비밀번호 | `mypw1234` | **8자 이상, 영문 + 숫자 포함** |

4. 가입 성공 → `/boards`로 자동 이동
5. **+ 새 보드** → 이름 입력 → 생성
6. 보드 안에서:
   - **+ 리스트 추가** → 컬럼 생성
   - 컬럼 안 **+ 카드 추가** → 카드 생성
   - 카드 클릭 → 모달에서 제목·설명 수정 / 삭제
   - 컬럼 헤더 클릭 → 이름 변경
7. 우측 상단 **로그아웃**

### CLI로 API 테스트 (curl)

```bash
# 1. 회원가입 (쿠키 저장)
curl -X POST https://trello-lite-ecru.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","name":"You","password":"mypw1234"}' \
  -c cookies.txt

# 2. 로그인 상태 확인
curl https://trello-lite-ecru.vercel.app/api/auth/me -b cookies.txt

# 3. 보드 생성
curl -X POST https://trello-lite-ecru.vercel.app/api/boards \
  -H "Content-Type: application/json" \
  -d '{"name":"내 첫 보드"}' \
  -b cookies.txt

# 4. 내 보드 목록 조회
curl https://trello-lite-ecru.vercel.app/api/boards -b cookies.txt

# 5. 로그아웃
curl -X POST https://trello-lite-ecru.vercel.app/api/auth/logout -b cookies.txt
```

### 로컬 풀스택 (Docker + Nginx + Postgres)

과제 시연 영상에서 Docker/Nginx 동작을 보여줄 때:

```bash
cp .env.example .env
docker compose up -d --build
curl http://localhost/api/health     # Nginx → Next.js → Postgres
```

브라우저에서 http://localhost 접속 → 회원가입 → 동일 시나리오 가능.

### 시연 시 주의사항

- **Rate limit**: `/api/auth/*` 분당 5회. 영상 녹화 중 같은 IP로 너무 빠르게 반복 로그인 시 429 발생.
- **Cold start**: Neon Postgres가 5분 이상 idle하면 첫 요청에 1~2초 지연. 시연 시작 전 `/api/health` 한 번 쳐서 깨워두기.
- **시크릿 모드 / 다른 브라우저**: 실시간 동기화 시연(TRE-7) 시 두 개 띄울 때 사용.

---

## 🚀 배포 (Vercel + Neon)

자세한 단계는 [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) 참고.

요약:
1. **Vercel** — https://vercel.com/new 에서 `jdh4601/trello-lite` import
2. **Storage** 탭 → **Neon Postgres** 추가 (`DATABASE_URL` 자동 주입)
3. **Settings → Environment Variables** 에 `JWT_SECRET` 추가 (`openssl rand -base64 32`)
4. push to `main` → 자동 배포 + 마이그레이션 자동 적용

## 🔗 저장소

https://github.com/jdh4601/trello-lite
