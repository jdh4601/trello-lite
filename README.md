# FlowBoard — 실시간 협업 칸반보드 (Trello-lite)

> 웹프로그래밍 과제 프로젝트 · 마감 2026-06-09

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

## 🔗 저장소

https://github.com/jdh4601/trello-lite
