# 배포 가이드 — Vercel + Neon Postgres

> **목표**: GitHub `main` 푸시 시 자동 배포되는 공개 URL 확보.
> **시간**: 약 15분.

---

## 사전 준비

- GitHub 계정에 https://github.com/jdh4601/trello-lite 푸시 권한
- Vercel 계정 (GitHub로 로그인 가능, 무료 Hobby 플랜으로 충분)

---

## 1. Vercel 프로젝트 생성

1. https://vercel.com/new 접속
2. **Import Git Repository** → `jdh4601/trello-lite` → **Import**
3. 자동 감지된 Framework `Next.js` 확인
4. Build / Output 설정은 기본값 그대로
5. **Environment Variables**는 비워둔 채 → **Deploy** 클릭

> 첫 배포는 DB 환경변수가 없어서 **실패합니다**. 정상 — 다음 단계에서 해결.

---

## 2. Neon Postgres 추가

1. Vercel 프로젝트 대시보드 → **Storage** 탭
2. **Create Database** → **Neon Postgres** 선택
3. 리전: `Seoul (icn1)` 추천 (한국 사용자)
4. **Create** 클릭

자동으로 다음 환경변수가 모든 환경(Production/Preview/Development)에 주입됩니다:

- `DATABASE_URL` (pooled)
- `DATABASE_URL_UNPOOLED`
- 그 외 `PG*` 변수들

> 우리 Prisma는 `DATABASE_URL` 하나만 사용합니다.

---

## 3. JWT_SECRET 등록

로컬에서 시크릿 생성:

```bash
openssl rand -base64 32
```

Vercel **Settings → Environment Variables**:

| Name | Value | Environments |
|------|-------|--------------|
| `JWT_SECRET` | 위에서 생성한 값 | Production, Preview, Development |

> 길이가 32자 이상이어야 합니다. `lib/auth/jwt.ts`에서 검증.

---

## 4. (선택) 추가 환경변수

| Name | Value | 용도 |
|------|-------|------|
| `NEXT_PUBLIC_APP_URL` | `https://<프로젝트>.vercel.app` | 클라이언트에서 절대 경로 필요할 때 |
| `CORS_ORIGINS` | `https://<프로젝트>.vercel.app` | 추후 외부 API에서 호출 허용할 때 |

---

## 5. 재배포

env 추가 후 자동 재빌드되지 않으면:

- **Deployments** 탭 → 최근 배포의 **... → Redeploy**

빌드 로그에서 다음 단계가 순서대로 실행되는지 확인:

```
prisma generate
prisma migrate deploy   ← 모든 마이그레이션 적용
next build
```

---

## 6. 동작 확인

배포 완료 후:

```bash
curl https://<프로젝트>.vercel.app/api/health
```

기대 응답:
```json
{ "status": "ok", "db": true, "latencyMs": 23, "timestamp": "..." }
```

브라우저에서 회원가입 → 보드 생성 → 카드 추가 까지 동작 확인.

---

## 7. PR Preview URL 활용

이후 모든 `feat/*` 브랜치 PR마다 **Preview Deployment URL**이 자동 생성됩니다.
PR 페이지의 Vercel 봇 댓글에서 확인 가능.

---

## 트러블슈팅

### 빌드 실패: `migrate deploy` 단계에서 멈춤
- `DATABASE_URL` env 미설정 → Storage 탭에서 Neon 연결 확인
- 마이그레이션 충돌 (드물게) → Vercel Postgres 콘솔에서 `_prisma_migrations` 테이블 확인

### `/api/health` 가 `db: false` 반환
- `DATABASE_URL`이 Production 환경에 주입되었는지 확인
- Neon 데이터베이스가 sleeping 상태일 수 있음 — 첫 요청 시 cold start 1~2초

### 로그인 후 즉시 로그아웃 처리됨
- `JWT_SECRET` 길이 < 32자 → 재생성
- Production은 `SameSite=Lax` + `Secure` 쿠키. https 환경에서만 동작 (Vercel은 기본 https)

---

## 로컬 개발 환경

별도로 로컬 Docker로 전체 스택을 띄울 수 있음 (Postgres + Nginx + Next.js):

```bash
cp .env.example .env
docker compose up -d --build
curl http://localhost/api/health
```

> 과제 요구사항 시연용 (`Docker`, `Nginx`).
