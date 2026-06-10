# 매장 데이터 D1 편집기 — 설계 (Phase 3.5)

- 날짜: 2026-06-10
- 상태: 승인됨 (음식 편집기 패턴 복제 + 카카오 주소→좌표 지오코딩)
- 관련: [[juo-platform-consolidation]], 음식 편집기 스펙 `2026-06-10-food-data-d1-editor-design.md`(동일 아키텍처)

## 배경 / 목표

`storeLocations.json`(115개 제휴 매장)은 공개 사이트의 매장찾기(`StoreFinderSheet`, 카카오맵)가 쓰는 데이터다. 지금은 정적 JSON이라 매장 추가·수정에 코드 수정 + 재배포가 필요하다. 제휴처가 계속 늘어나므로 `/admin`(Access 보호)에서 **코드 수정·재배포 없이** 관리하게 한다. **음식 편집기와 동일한 아키텍처**를 복제하되, 좌표 입력만 카카오 지오코딩으로 보강한다.

## 데이터 shape (현재)

```ts
{ id, name, category, rawCategory, address, lat, lng }
// category: "병원"|"펫샵"|"미용"|"훈련"|"보호소"|"기타" (6종, StoreFinderSheet 정의)
// rawCategory: 원본 스크랩 라벨(분양샵, 훈련소 …) — 공개 필터는 category만 사용
```
현재 `StoreLocation`/`StoreCategory`/`STORE_CATEGORIES` 타입은 `StoreFinderSheet.tsx` 안에 인라인 정의. → `src/lib/stores.ts`로 추출해 공개 컴포넌트·API·편집기가 공유.

## 아키텍처 (음식과 동일: D1 단일소스 + 공개 캐시 API)

```
[/admin 매장 뷰] --CRUD(게이팅)--> /admin/api/stores --> D1(stores)
                                                          ^
[공개 StoreFinderSheet] --fetch--> GET /api/stores(캐시) --+
                          (실패 시 번들 JSON 폴백)
```

## 데이터 모델 — D1 `stores`

```sql
CREATE TABLE IF NOT EXISTS stores (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  category     TEXT NOT NULL,          -- 병원|펫샵|미용|훈련|보호소|기타
  raw_category TEXT,                   -- 원본 라벨(선택)
  address      TEXT NOT NULL,
  lat          REAL NOT NULL,
  lng          REAL NOT NULL,
  updated_at   INTEGER NOT NULL DEFAULT 0
);
```

- 시드: 현재 `storeLocations.json` 115개 INSERT.
- 응답은 `StoreLocation` 형태(`raw_category`→`rawCategory` 매핑)로 복원 → 매장찾기/카카오맵 무수정.

## API

### 공개 읽기 — `GET /api/stores`
- D1 `stores` 전체를 `StoreLocation[]`로 반환.
- `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`.
- D1 오류 시 500(공개 클라이언트가 번들 폴백하도록 — `[]` 반환 금지). 게이팅 없음.

### 관리 CRUD — `/admin/api/stores` (Access 보호)
- `GET`(목록, no-store), `POST`(생성), `PUT /admin/api/stores/[id]`(수정), `DELETE /admin/api/stores/[id]`.
- 모든 쓰기는 검증 모듈 통과. `updated_at` 갱신.

## 공개 사이트 마이그레이션 — `StoreFinderSheet`

- 현재: `import storeLocations from "@/data/storeLocations.json"`.
- 변경: 시트가 **열릴 때** `fetch("/api/stores")`(lazy), 로딩 상태, 실패 시 번들 폴백(절대 빈 지도 안 되게). 카카오맵 마커 렌더·카테고리 필터·검색·내 위치 로직 전부 무수정.
- `StoreLocation`/`StoreCategory`/`STORE_CATEGORIES`는 `@/lib/stores`에서 import(인라인 정의 제거).

## `/admin` 매장 뷰 + 카카오 지오코딩

- `AdminDashboard` 사이드바 "데이터" 그룹에 "매장 데이터" 추가(음식 뷰 옆).
- 검색·카테고리 필터 표: name, category(색배지), address(truncate), lat/lng, 수정/삭제.
- 추가/수정 폼: name, category(셀렉트 6종), rawCategory(선택), address, lat, lng, id(선택).
- **카카오 지오코딩(핵심)**: 폼에 "좌표 찾기" 버튼 → 카카오 JS SDK `services` 라이브러리의 `Geocoder.addressSearch(address)`로 lat/lng 자동 채움(수동 override 가능). 지도 미리보기는 비범위(향후).
  - SDK 로드: `//dapi.kakao.com/v2/maps/sdk.js?appkey=<NEXT_PUBLIC_KAKAO_MAP_APP_KEY>&autoload=false&libraries=services` (클라이언트). 키는 도메인 제한 — admin이 `*.주오.info`에서 서빙되므로 동작(로컬 dev는 localhost 등록 필요).
- 삭제: 확인 다이얼로그(음식과 달리 안전경고 불필요 — 매장은 위험 데이터 아님).

## 검증 & 안전

`src/lib/storeValidation.ts`(write API·테스트 공유):
- `name`, `address` 비어있지 않음.
- `category` ∈ 6종 enum.
- `lat`/`lng` 유한 숫자 + 한국 대략 범위(lat 33~39, lng 124~132) 밖이면 거부(오타·잘못된 지오코딩 방지).
- `rawCategory` 선택(비우면 category로 기본).
- `id` 슬러그면 사용, 없으면 서버 생성 — **`store-<짧은난수>` 프리픽스**(음식의 `slugifyOrGenerate`를 prefix 파라미터화하거나 stores 전용 헬퍼; `food-` 프리픽스 재사용 금지).

## 테스트

- `storeValidation.test.ts` 단위테스트.
- 시드 JSON 115개가 검증 통과(데이터 무결성).
- API는 D1 의존 → 빌드 + 라이브 스모크(`/api/stores` 200·115, `/admin/api/stores` 302).

## 빌드 순서

1. `src/lib/stores.ts`(공유 타입) + `db/schema.sql` `stores` + 시드 생성기·`db/seed-stores.sql`.
2. `storeValidation.ts` + 테스트.
3. 공개 `GET /api/stores`.
4. `StoreFinderSheet` import→fetch(+폴백, 공유 타입).
5. 관리 CRUD `/admin/api/stores`(+`[id]`).
6. `StoresManager` + AdminDashboard·Sidebar 배선 + 카카오 지오코딩 버튼.
7. 빌드·배포·D1 콘솔 시드·라이브 스모크.

## 롤아웃 메모

- 음식과 동일: wrangler 미인증 → 스키마+시드는 Cloudflare D1 콘솔에 SQL 붙여넣어 실행(`--` 주석 줄 제거 — 줄바꿈 뭉개지면 뒤 INSERT 주석처리됨). 시드 SQL은 클립보드로 전달.
- 카카오 지오코딩 도메인 제한: 라이브(`*.주오.info`)는 동작, 로컬 테스트는 Kakao 콘솔에 localhost 등록 필요(이미 돼있을 수 있음).
