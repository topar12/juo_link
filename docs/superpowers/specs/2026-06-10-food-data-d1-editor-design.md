# 음식 데이터 D1 편집기 — 설계 (Phase 3)

- 날짜: 2026-06-10
- 상태: 승인됨 (Approach A)
- 관련: [[juo-platform-consolidation]] — 주오 플랫폼 통합 ③단계

## 배경 / 목표

`foodSafety.json`(108개, 펫이 먹어도 되는/안 되는 음식)은 공개 사이트의 "우리 아이 먹어도 돼요?" 검색기(`FoodCheckSheet`)가 쓰는 데이터다. 지금은 정적 JSON이라 **항목 추가·수정에 코드 수정 + 재배포가 필요**하다. 데이터가 계속 늘어나므로, `/admin`(Cloudflare Access로 보호됨)에서 **코드 수정·재배포 없이** 추가·수정·삭제할 수 있게 한다.

## 비목표 (Non-goals)

- 브랜드 구조(`linkPages/*.ts`) 편집화 — `LinkPageConfig`가 렌더에 강결합되어 코드 유지.
- 매장 데이터(`storeLocations.json`) — 이번 범위 밖(향후 동일 패턴 복제 가능).
- 방문자 계정 — 불필요(기존 결정).

## 아키텍처 (Approach A: D1 단일 소스 + 공개 캐시 API)

D1을 단일 진실원으로 두고, 공개 사이트는 엣지 캐시된 읽기 API로 읽는다. "재배포 없이 편집 반영"이 목표라 공개 경로가 D1을 읽어야 의미가 있다.

```
[/admin 음식 뷰] --CRUD(게이팅)--> /admin/api/foods --> D1(foods)
                                                          ^
[공개 FoodCheckSheet] --fetch--> GET /api/foods(캐시) ----+
                         (실패 시 번들 JSON 폴백)
```

## 데이터 모델 — D1 `foods` 테이블

```sql
CREATE TABLE IF NOT EXISTS foods (
  id       TEXT PRIMARY KEY,          -- 영문 슬러그(예: "chocolate") 또는 서버생성 유니크 id
  name     TEXT NOT NULL,             -- "초콜릿"
  aliases  TEXT NOT NULL DEFAULT '[]',-- JSON 배열 문자열 ["초콜렛","choco"]
  emoji    TEXT,                       -- "🍫" (선택)
  verdict  TEXT NOT NULL,             -- 'danger' | 'caution' | 'safe'
  reason   TEXT NOT NULL,
  note     TEXT,                       -- 선택
  updated_at INTEGER NOT NULL DEFAULT 0 -- epoch ms (감사용)
);
```
> 정렬 컬럼은 두지 않는다 — 공개 검색기의 `searchFoods`가 verdict 순위 + name 으로 재정렬하므로 저장 순서는 무의미.

- 시드: 현재 `src/data/foodSafety.json` 108개를 INSERT.
- `aliases`는 D1에 JSON 문자열로 저장, 읽을 때 파싱해 `FoodSafetyItem` 형태로 복원.
- 응답 형태는 기존 `FoodSafetyItem`(`src/lib/foodSafety.ts`)과 동일하게 유지 → `searchFoods` 로직 무수정.

## API

### 공개 읽기 — `GET /api/foods`
- D1 `foods` 전체를 `FoodSafetyItem[]`로 반환(`aliases` 파싱).
- 헤더 `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` — 편집이 ~1분 내 공개 반영, 엣지 캐시로 빠름·안정.
- 게이팅 없음(공개 데이터). `/admin` 밖이라 Access 영향 없음.

### 관리 CRUD — `/admin/api/foods` (Access로 보호됨)
- `GET` — 전체 목록(관리 표용, 캐시 없음 `no-store`).
- `POST` — 신규 1건 생성.
- `PUT /admin/api/foods/[id]` — 수정.
- `DELETE /admin/api/foods/[id]` — 삭제.
- 모든 쓰기는 **검증 모듈** 통과(아래). `updated_at` 갱신.

## 공개 사이트 마이그레이션 — `FoodCheckSheet`

- 현재: `import foods from "@/data/foodSafety.json"`.
- 변경: 시트가 **열릴 때** `fetch("/api/foods")` (lazy). 로딩 상태 표시.
- **폴백**: fetch 실패 시 번들된 `foodSafety.json`(시드 사본)을 사용 → 검색기가 절대 빈 화면이 되지 않음(건강 안전 데이터라 중요).
- `searchFoods(items, …)`는 인자로 받는 순수 함수라 **무수정**.

## `/admin` 음식 뷰

- `AdminDashboard` 사이드바에 "음식 데이터" 추가(기존 상태기반 네비에 뷰 1개 추가).
- 검색 가능한 표: verdict 색배지(danger 빨강/caution 노랑/safe 초록), name, aliases, reason.
- 추가/수정: 폼(name, aliases 콤마구분, verdict 셀렉트, reason, note, emoji). id는 name에서 슬러그 자동생성(수정 시 고정).
- 삭제: 확인 다이얼로그. **`danger` 항목 삭제 시 강조 경고**(위험 경고를 실수로 제거 방지).

## 검증 & 안전 (건강 데이터)

`src/lib/foodValidation.ts`(신규)에 규칙을 모아 **write API와 데이터무결성 테스트가 공유**:
- `verdict` ∈ {danger, caution, safe} (필수)
- `name`, `reason` 비어있지 않음
- `id` 슬러그 형식·유니크
- `aliases` 각 항목 비어있지 않음(중복 제거)

기존 `foodSafety.data.test.ts`(시드 JSON 무결성)는 유지하고, 검증 모듈을 재사용하도록 정리.

## 테스트

- `foodValidation.test.ts` — 검증 규칙 단위테스트.
- 시드 JSON이 검증을 통과하는지(`foodSafety.data.test.ts` 갱신).
- `searchFoods` 기존 테스트 유지(로직 무변경 확인).
- API 라우트는 D1 의존이라 단위테스트 대신 빌드 + 라이브 스모크(공개 `/api/foods` 200, 관리 경로 302 게이팅)로 검증.

## 빌드 순서

1. `db/schema.sql`에 `foods` 테이블 + 시드 INSERT(JSON 108개). 로컬·원격 D1에 적용.
2. `src/lib/foodValidation.ts` (검증) + `foodSafety.data.test.ts` 정리.
3. 공개 읽기 `GET /api/foods` (캐시 헤더).
4. `FoodCheckSheet` fetch 전환(+ 번들 폴백 + 로딩).
5. 관리 CRUD `/admin/api/foods` (검증 적용).
6. `AdminDashboard` "음식 데이터" 뷰(표 + 폼 + 삭제 확인).
7. 검증·빌드·배포(master 푸시 → Workers Builds), 라이브 스모크.

## 롤아웃 메모

- D1 시드는 `wrangler d1 execute` 로컬 미인증 이슈 있음 → 스키마/시드 적용은 사용자 대시보드 또는 1회용 토큰 필요(Phase 4때처럼). 코드/스키마는 내가 준비, 적용 시점에 안내.
- 편집 반영 지연(캐시 60s)은 조정 가능.
