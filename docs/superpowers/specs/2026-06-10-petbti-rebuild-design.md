# 멍BTI 풀 리빌드 — 설계 스펙

- 날짜: 2026-06-10
- 상태: 설계 확정 대기(사용자 리뷰 후 writing-plans)
- 관련 리서치: `../research/2026-06-10-petbti-rebuild/{01-codebase-audit,02-canine-personality-science,03-market-viral-ux,04-tech-architecture}.md`
- 관련 메모: [[juo-platform-consolidation]], [[petfoodjuo-content-rules]], [[feedback-pet-copy-tone]], [[petcare-tourism-voucher]]

## 배경 / 목표

기존 멍BTI(강아지 성격 테스트)는 Vite SPA를 `/petbti`에 `ssr:false`로 끼워넣은 것(7문항·3축·8유형, firebase·html2canvas 제약). 이를 **소스로만 참고**해 Next 네이티브로 처음부터 다시 만든다. 결과 체계·기반 리서치를 새로 하고 firebase까지 들어낸다. 목표: **공유가 잘 되는 좋은 도구 + 자연스러운 펫푸드 퍼널**. 작업량 제약 없음.

**사용자 결정**: ① 유형 체계 = **4축 16유형**(에너지×사회성×대담함×식탐) ② 퍼널 기능 = 유형별 제품 추천(D1 편집)·궁합·스토리 인증 이벤트·희귀도 % 모두 포함(단 스토리 인증 **이벤트 운영은 나중에** — 동선·이미지 인프라만 v1) ③ 일러스트 = **주멍이 마스코트**(사용자가 작업툴로 생성, 프롬프트는 `THIS DOG CHARACTER`로 첨부 캐릭터 지칭) ④ 진단형(보호자가 강아지에 대해 답함) 유지.

## 보존 / 폐기

**보존(외부 계약)**
- GA4 이벤트명 8개: `quiz_start, quiz_complete, result_download, shop_click, dm_click, share_result, copy_link, shared_link_visit` + measurementId `G-P2G6LQGGSJ`(property 530064801). admin GA4 라우트(funnel/share/trend/traffic)가 하드코딩 참조 → 그대로 발사해야 대시보드 무수정.
- `/petbti` 경로 + 구 `?r=result1..8` 공유 링크 → 신 유형으로 **301 리다이렉트**(기배포 링크·브랜드 카드·외부 바이오 보존).
- `petbti_stats` 테이블 + `/api/petbti/stats` 응답 형태 `{CODE:n,…,total}` → admin `OverviewContent`·`QuizProjectDashboard` 호환.

**폐기/교체**
- firebase SDK(analytics) → **gtag 직송**(`send_to`로 멍BTI/사이트 스트림 분리). html2canvas(미사용)·html-to-image → **snapdom**. `ssr:false` 우회 제거.
- D1 유형 코드 **신규 16개로 리셋**(누적 집계 0부터 — 희귀도 배지는 데이터 쌓이기 전 자동 숨김). 사용자가 "갈아엎어도 된다" 승인.

**⚠️ 선행 작업(1단계, 직렬)**: Next 16.2.2 + @opennextjs/cloudflare 1.18.0 → **Next 16.2.x 최신 + adapter 1.19.x 동반 업그레이드**. adapter 1.19.2+가 Next 16.2.2를 지원 제외하고, OG·번들 패치가 1.19에 있음. 여기서 빌드 회귀를 먼저 잡고 나머지를 병렬화한다. lockfile은 npm 10.9.2로 갱신.

---

## 1. 유형 체계 (4축 16유형)

각 축 2지선다 **3문항 = 총 12문항**. 축당 홀수라 다수결(2:3)로 **동점 없음**(기존 q7 보너스 타이브레이커 폐기).

| 축 | 양극(코드) | 정의 | 펫푸드 의미 |
|---|---|---|---|
| 에너지 | **E** 활발 / **C** 차분 | 활동·놀이·흥분 ↔ 느긋·휴식 | 씹기·파괴 욕구 강도 |
| 사회성 | **S** 사교 / **R** 낯가림 | 사람·외부에 다가감 ↔ 조심·집중심 | 톤·궁합 서사 |
| 대담함 | **B** 대담 / **T** 신중 | 새 자극에 접근 ↔ 경계·관찰 | 새 간식 도전성 |
| 식탐 | **G** 식탐 / **P** 까탈 | 폭풍흡입 ↔ 까탈입맛 | **추천의 핵심 동력** |

코드 = MBTI식 4글자(에너지-사회성-대담함-식탐 순). 8글자 전부 충돌 없음(E/C·S/R·B/T·G/P). **결과 화면 보조 게이지 4개 = 이 4축 점수**.

### 채점 (`src/features/petbti/lib/score.ts`)
- 문항은 `{ id, axis: 'energy'|'social'|'bold'|'appetite', options: [{label, pole}] }`. 축당 3문항.
- 각 축 = 선택된 pole 다수결. 12문항 → 4글자 코드. **`calculateResult`는 항상 16유형 중 하나 반환**(vitest로 보장).
- 응답 직렬화: `answers` = **12자 pole 문자열**(문항 순서 고정, 위치=문항 인덱스, 글자=선택 pole. 예: `EECSSRBTBGGP`). 위치별 분포로 문항 튜닝 가능, 용량도 최소.

### 16유형 테이블 (별명·추천제품·장면시드)

추천제품은 **D1 편집 가능 기본값**. 추천 로직: 식탐 G + 씹기욕구(E·B) → 큰 장기 씹기 간식 / 까탈 P → 기호성 프리미엄 / 활발·점프(E·B) → 관절 케어 / 예민(T·P) → 저알러지.

| 코드 | 별명(시드) | 핵심 성향 | 추천제품(기본) | 장면 컨셉 |
|---|---|---|---|---|
| ESBG | 인싸 먹보 모험왕 | 활발·사교·대담·식탐 | 우족 슬라이스 | 공원서 친구들과 간식 향해 돌진 |
| ESBP | 프로 인싸 미식가 | 활발·사교·대담·까탈 | 닭가슴살 육포 | 카페서 친구들과, 간식은 깐깐히 평가 |
| ESTG | 조심성 먹보 마당발 | 활발·사교·신중·식탐 | 오리 날개 | 친구 많은 자리, 새 간식엔 갸웃 |
| ESTP | 예민한 분위기메이커 | 활발·사교·신중·까탈 | 동결건조 간식 | 모임 중심이나 낯선 간식 앞 망설 |
| ERBG | 우리집 파괴왕 먹보 | 활발·낯가림·대담·식탐 | 우족 슬라이스 | 집서 쿠션 파괴하며 의기양양(구 EGA) |
| ERBP | 집에서만 용감한 까칠가이 | 활발·낯가림·대담·까탈 | 닭가슴살 육포 | 집선 대담, 평범한 간식엔 콧대 |
| ERTG | 소심한 에너지 먹보 | 활발·낯가림·신중·식탐 | 오리 도가니 | 집서 신나다 초인종에 멈칫, 간식엔 적극 |
| ERTP | 예민한 집순이 댕댕 | 활발·낯가림·신중·까탈 | 캥거루 꼬리뼈 | 방석서 경계하며 간식 의심스레 냄새 |
| CSBG | 느긋한 인싸 대식가 | 차분·사교·대담·식탐 | 양 목뼈 | 카페 소파서 느긋이 손님 환영+먹기 |
| CSBP | 여유로운 미식 신사 | 차분·사교·대담·까탈 | 수제 베이커리 | 우아하게 손님 반기며 고급 간식 음미 |
| CSTG | 온순한 먹보 친구 | 차분·사교·신중·식탐 | 돼지귀 슬라이스 | 다정히 사람들과, 새것 신중히 후 잘 먹음 |
| CSTP | 다정한 까탈 선비 | 차분·사교·신중·까탈 | 동결건조 간식 | 차분 사교적이나 간식은 깐깐히 음미 |
| CRBG | 마이웨이 먹보 대장 | 차분·낯가림·대담·식탐 | 우족 슬라이스 | 혼자 의젓하게 큰 간식 정복 |
| CRBP | 도도한 1인 미식가 | 차분·낯가림·대담·까탈 | 닭가슴살 육포 | 혼자 우아하게 프리미엄만(구 CPI) |
| CRTG | 조용한 먹보 선비 | 차분·낯가림·신중·식탐 | 양 목뼈 | 조용한 코너서 혼자 만족스레 씹기(구 CGI) |
| CRTP | 고독한 미식 황제 | 차분·낯가림·신중·까탈 | 닭가슴살 육포 | 방석 위 왕관 쓰고 최고급만(구 CPI 황제) |

### 궁합 (`compatibility`)
- **찰떡**: 에너지·대담함이 반대(서로 보완), 사회성·식탐은 동일 → 균형 서사. 예: ESBG ↔ CSTG.
- **상극**: 4글자 정반대 유형(너무 다름) → 가볍게 "밀당" 프레이밍. 예: ESBG ↔ CRTP.
- 규칙으로 계산하되, 유형 데이터에 `soulmate`/`clash` **오버라이드 필드**를 둬 마케팅이 튜닝 가능.

### 콘텐츠 톤(브랜드 제약 — [[feedback-pet-copy-tone]])
유형 설명 = **장면 묘사 3(인정 포인트) → 강점 → "소심하지만 OOO"식 긍정 변환 1**. 과한 감성팔이·의인화(펫 1인칭 화자) 금지, 따뜻하되 담백 + 가벼운 유머. 디스클레이머: "재미용·수의학적 진단 아님 / 한 단면 / 견종·나이·중성화 영향".

---

## 2. 아키텍처 / 라우팅

```
/petbti            인트로(서버·정적, 기본 OG, 누적 참여수·소요시간)
  └CTA→ /petbti/quiz        12문항 클라이언트 + 로딩 연출(주멍이 2~3초)
          └완료→ /petbti/result/[type]   SSG 16종 + 클라 섬
                  ├ POST /api/petbti/result → D1(stats +1, responses INSERT)
                  ├ GET  /api/petbti/stats  → 희귀도 배지(s-maxage=60)
                  ├ snapdom 캡처(1:1 결과카드 / 9:16 스토리카드)
                  ├ 공유: 카카오 sendDefault(feed) + navigator.share 폴백
                  └ 유형별 추천 제품(D1) + lovejuo.com 스토어 CTA
정적: /og/petbti/{TYPE}.png  ← 빌드 전 스크립트로 16장 합성(주멍이 PNG + 유형명 + 4축 미니바)
호환: /petbti?r=result1..8  → 신 유형으로 301
```

- `result/[type]`: `generateStaticParams()` 16유형 + `dynamicParams=false`(외 404). 유형 콘텐츠 서버 렌더(크롤러·첫 페인트 완전 HTML), 희귀도·저장·공유는 **클라 섬**. 희귀도 %는 프리렌더에 굽지 말고 클라에서 `/api/petbti/stats` fetch.
- 완료 → `router.push('/petbti/result/ESBG?from=quiz')`. `from=quiz`만 카운터 POST(sessionStorage 중복 방지). 공유 유입(쿼리 없음)엔 '나도 하기' CTA 1순위.
- **렌더링**: firebase 제거 + snapdom·kakao를 클릭 핸들러 내 동적 import로 한정하면 `ssr:false` 트릭 불필요. `open-next.config.ts`에 **읽기 전용 static-assets incremental cache** 한 줄 추가(R2 불필요, 프리렌더 16종 캐시 적재).

### 구 `?r=` → 신 유형 매핑(리다이렉트)
구 8유형은 축 의미가 달라 1:1 의미보존 매핑이 불가 → 가장 근접한 신 유형으로 라우팅(예: 구 EGA 파괴왕 → ERBG, 구 CPI 미식황제 → CRTP). 매핑표를 리다이렉트 핸들러에 상수로. 목적은 "죽은 링크 방지"이지 정밀 복원이 아님.

---

## 3. 데이터 (D1)

```sql
-- 유지(형태 보존, admin 호환) — 시드는 16유형으로 교체
CREATE TABLE IF NOT EXISTS petbti_stats (
  type_code TEXT PRIMARY KEY,
  count     INTEGER NOT NULL DEFAULT 0
);
-- 신규(PII 없음): 문항 분포 분석·튜닝
CREATE TABLE IF NOT EXISTS petbti_responses (
  id          TEXT PRIMARY KEY,   -- crypto.randomUUID()
  result_type TEXT NOT NULL,      -- 'ESBG'…
  answers     TEXT NOT NULL,      -- 12자 pole 문자열 또는 JSON
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_petbti_responses_created ON petbti_responses(created_at);
CREATE INDEX IF NOT EXISTS idx_petbti_responses_type    ON petbti_responses(result_type);
-- 신규: 유형별 추천 제품(마케팅 편집) — foods/stores 패턴
CREATE TABLE IF NOT EXISTS petbti_products (
  type_code   TEXT PRIMARY KEY,   -- 'ESBG'…
  product_name TEXT NOT NULL,
  image_url   TEXT,
  reason      TEXT,               -- 추천 카피(유형 해설의 연장)
  shop_url    TEXT,
  updated_at  INTEGER NOT NULL DEFAULT 0
);
```

- 비용: 완료당 쓰기 2~3행 → 일 1만도 무료 한도 ~20%. stats GET 60s 엣지캐시로 D1 도달 분당 1회. 저장 ~365MB/년(상시 일 1만이면 아카이브 정책 메모).
- **문항·점수·유형 골격 = 코드(TS) + vitest**(점수 로직 강결합·타입 안전). **추천 제품만 D1**(`petbti_products`) → `/admin` 편집 + 공개 `GET /api/petbti/products`(60s 캐시, 실패 시 코드 기본값 폴백).
- 시드: `db/schema.sql`에 16유형 stats·products. wrangler 미인증 → **Cloudflare D1 콘솔에 SQL 붙여넣기**(`--` 주석 줄 제거).

### API
- `GET /api/petbti/stats` — 유지 + `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`. 실패 시 200+null.
- `POST /api/petbti/result` — `{ typeCode, answers }`. 16 화이트리스트 검증. `db.batch([stats UPSERT +1, responses INSERT])`. `force-dynamic`.
- `GET /api/petbti/products` — 공개, 60s 캐시, 실패 시 500(클라 폴백).
- `/admin/api/petbti/products`(+`[type]`) — Access 보호 CRUD(검증 모듈 공유).
- `/admin/api/petbti/answers` — Access 보호, 기간 파라미터·인덱스 활용 문항 분포.

---

## 4. 분석 (gtag, firebase 제거)

- `@next/third-parties` `<GoogleAnalytics>`(gtag.js 1회 로드, 사이트 `G-WD1Q4Q5CDH`) 유지 + 멍BTI 레이아웃에서 `gtag('config','G-P2G6LQGGSJ')` 1회 추가.
- **`send_to` 분리 필수**(미지정 시 이중 카운트): 멍BTI 이벤트 래퍼 `src/features/petbti/lib/ga.ts`가 항상 `send_to:'G-P2G6LQGGSJ'`. 기존 사이트 `trackEvent`도 멍BTI config 추가에 맞춰 `send_to:'G-WD1Q4Q5CDH'` 명시(이중 적재 방지 — 같은 PR에서 정비).
- 이벤트명 8개 보존 + 파라미터(`result_type` 등) 유지. `photo_upload`·`copy_tags`는 자유.

---

## 5. 비주얼 / OG (주멍이 합성)

- **일러스트 = 주멍이 16장**(사용자 작업툴 생성). 결과카드·OG·스토리카드는 이 PNG를 슬롯에 합성.
- **OG 16장 = 빌드타임 합성**: `scripts/generate-og.mjs`가 주멍이 PNG + 유형명·별명·4축 미니바를 1200×630으로 합성(satori `<img>` 임베드 또는 sharp 컴포지트) → `public/og/petbti/{TYPE}.png`. `generateMetadata`가 참조. 워커 번들 영향 0.
- 결과카드(1:1)·스토리카드(9:16)는 런타임 DOM(주멍이 `<img>` + 텍스트 오버레이) → snapdom 캡처. 스토리카드는 화면 밖 1080×1920 별도 DOM.
- 유형 컬러: 16유형 팔레트 상수(`src/features/petbti/data/types.ts`). 로딩 연출 = 주멍이가 결과지 굽는 2~3초.

### 주멍이 16유형 이미지 생성 프롬프트

**공통 규칙(사용자 작업툴에서 주멍이 레퍼런스를 `THIS DOG CHARACTER`로 첨부 후, 각 프롬프트 앞에 프리픽스로 사용)**:
> `STYLE: soft pastel watercolor and colored-pencil children's-book illustration, warm and cozy, gentle linework, bright airy lighting, cute but not saccharine. Square 1:1 composition, THIS DOG CHARACTER centered occupying ~60%, generous soft pastel background extending to all edges with empty negative space at top and sides for later text overlay and cropping. Keep THIS DOG CHARACTER perfectly on-model and consistent. No text, no letters, no words, no logos in the image.`

각 유형 = 위 STYLE 프리픽스 + 아래 SCENE:

1. **ESBG** — `SCENE: THIS DOG CHARACTER bounding joyfully across a sunny park toward a treat, ears flying, big bright open-mouth smile, happy puppies and people softly blurred behind, a scattered trail of kibble, dynamic energetic leaping pose. CAMEO: THIS CAT CHARACTER cheering from the side as a small background cameo.`
2. **ESBP** — `SCENE: THIS DOG CHARACTER at a chic pet cafe surrounded by friends, sitting upright with a confident charming smile, one paw raised, carefully sniffing a single gourmet biscuit with a slightly discerning look, social yet picky. CAMEO: THIS CAT CHARACTER lounging nearby among the friends as a small cameo.`
3. **ESTG** — `SCENE: THIS DOG CHARACTER at a lively gathering of dog friends, tail wagging excitedly, pausing with a curious tilted head to cautiously sniff one new unfamiliar treat, lots of snacks around, friendly but careful.`
4. **ESTP** — `SCENE: THIS DOG CHARACTER as the cheerful center of a friendly little party, surrounded by pals, but hesitating in front of a strange-looking snack with a delicately skeptical raised eyebrow, dainty refined posture.`
5. **ERBG** — `SCENE: THIS DOG CHARACTER indoors in a cozy pastel living room gleefully tearing apart a cushion with soft stuffing flying everywhere, wearing a cute knit sweater, mischievous triumphant grin, bold and bursting with energy at home.`
6. **ERBP** — `SCENE: THIS DOG CHARACTER ruling its home turf, standing boldly on a sofa over a pile of toys, turning its nose up at an ordinary offered snack with an aloof picky expression, cozy indoor pastel room.`
7. **ERTG** — `SCENE: THIS DOG CHARACTER playing energetically in a corner of its home, freezing mid-play to glance nervously toward the front door at a sound, yet still eagerly eyeing a treat bowl, shy outside but hungry, warm interior.`
8. **ERTP** — `SCENE: THIS DOG CHARACTER curled cautiously on its bed in a quiet home, peeking warily, delicately sniffing a premium treat with suspicious sensitivity, soft muted pastels, sensitive homebody.`
9. **CSBG** — `SCENE: THIS DOG CHARACTER lounging relaxed on a cafe sofa, calmly and warmly greeting visitors with a gentle smile while happily munching a big chew bone, easygoing big eater, sunny cozy cafe. CAMEO: THIS CAT CHARACTER curled up beside it as a gentle cameo.`
10. **CSBP** — `SCENE: THIS DOG CHARACTER sitting elegantly like a little gentleman, calmly welcoming a guest, savoring a single fancy bakery treat on a small plate with refined poise, soft luxurious pastel interior. CAMEO: THIS CAT CHARACTER sitting elegantly nearby as a small cameo guest.`
11. **CSTG** — `SCENE: THIS DOG CHARACTER sitting gently among friendly people, calm and sweet, thoughtfully sniffing a new treat before contentedly eating it, warm cozy domestic scene. CAMEO: THIS CAT CHARACTER resting among the friendly group as a small cameo.`
12. **CSTP** — `SCENE: THIS DOG CHARACTER as a gentle scholarly little dog, calmly sociable but carefully examining a gourmet morsel with a discerning thoughtful expression, tidy serene pastel setting.`
13. **CRBG** — `SCENE: THIS DOG CHARACTER alone and self-assured, confidently conquering a large chew bone all by itself on a rug, independent and content, relaxed solo pose, cozy quiet room.`
14. **CRBP** — `SCENE: THIS DOG CHARACTER alone and dignified like royalty, elegantly savoring a premium jerky treat with refined pickiness, poised solo pose, soft regal pastel interior.`
15. **CRTG** — `SCENE: THIS DOG CHARACTER quietly and contentedly enjoying a chew by itself in a serene corner, composed and scholarly, peaceful solo moment, gentle warm light.`
16. **CRTP** — `SCENE: THIS DOG CHARACTER as a solitary gourmet emperor on a plush cushion wearing a tiny delicate crown, calmly accepting only the finest single treat with a refined discerning look, elegant pastel room.`

**주냥이 카메오(확정)**: 사교(S) 유형 중 손님맞이·친구 장면이 자연스러운 5컷(ESBG·ESBP·CSBG·CSBP·CSTG)에 주냥이를 곁들인다. 작업툴에서 주냥이 레퍼런스를 `THIS CAT CHARACTER`로 함께 첨부하고 해당 SCENE의 카메오 지시를 따른다. 주냥이는 **배경 보조(주멍이가 주연)**, 향후 냥BTI 확장 포석.

---

## 6. 공유 / 캡처

- **카카오 sendDefault(feed)**: 기존 `NEXT_PUBLIC_KAKAO_MAP_APP_KEY`(JavaScript 키) 재사용(카카오맵과 동일 앱). `next/script`로 SDK 로드 → `Kakao.init()`. 버튼 2개("결과 보기" + "나도 테스트하기"), `imageUrl`=유형 OG PNG. 도메인 등록 1회 확인.
- **navigator.share** 폴백(미지원 시 클립보드 복사).
- **snapdom**: 결과카드 1:1·스토리카드 9:16 듀얼 캡처(`exclude`로 `hide-on-capture` 노드 제외, `scale`/`dpr`). iOS는 `safariWarmupAttempts` 내장 + Web Share API L2(`navigator.share({files})`)로 '사진 앱 저장' 동선.
- **강아지 사진 업로드** 유지(결과카드에 합성 — 서버 생성 대신 클라 캡처를 쓰는 이유).
- 스토리 인증: 9:16 저장 + 해시태그/캡션 한 번 복사. **이벤트 박스 카피는 토글/플레이스홀더**(추첨 운영 나중).

---

## 7. admin

- 추천 제품 D1 편집기(`petbti_products`) — foods/stores 패턴(`/admin` '멍BTI 추천' 뷰 + CRUD + 검증).
- 문항 분포 패널(`/admin/api/petbti/answers`) — 튜닝용.
- `src/features/admin/lib/constants.ts` 정합화: 구 Netlify URL → `/petbti`, 축 설명 불일치 수정, `firestoreCollection/firestoreDoc` 레거시 게이팅 정리.

---

## 8. 병렬 실행 분해

**1단계(직렬, 기반)**: 버전 업그레이드(Next/adapter) + `open-next.config` 캐시 + firebase/html2canvas/html-to-image 제거 + 빌드 안정화 + 유형 코드/타입 스캐폴드(`data/types.ts` 16유형 상수, `score.ts` 시그니처). → 유형 코드가 하위로 흘러가므로 여기서 고정.

**2단계(병렬 5워크스트림, 파일 소유 분리)**:
- **A 콘텐츠·로직**: `data/questions.ts`(12문항·16유형 카피·궁합·추천 기본값) + `lib/score.ts` + `score.test.ts` + 무결성 테스트.
- **B 화면**: `QuizClient`(인트로·문항·진행바·로딩연출) + `ResultCard`(1:1) + `StoryCard`(9:16 offscreen) + `SaveImageButton`(snapdom) + `ShareButtons`(kakao+native) + 희귀도 배지.
- **C OG·비주얼**: `scripts/generate-og.mjs`(주멍이 PNG 합성 16장) + 유형 컬러 시스템 + 로딩 연출 에셋. (주멍이 PNG는 사용자 제공 — 미제공 시 플레이스홀더로 파이프라인 검증.)
- **D 데이터·API·호환**: `db/schema.sql`(3테이블) + `/api/petbti/{stats,result,products}` + `lib/petbtiDb.ts` + `lib/ga.ts`(send_to) + `?r=` 리다이렉트.
- **E admin**: `petbti_products` 편집기 + `answers` 패널 + `constants.ts` 정합화.

**3단계(직렬, 통합)**: 라우트 배선(`/petbti`·`quiz`·`result/[type]`) + 브랜드 카드 연결 + 클린 빌드(`opennextjs-cloudflare build`) + 배포 + D1 콘솔 시드 + 라이브 스모크(`/api/petbti/*`, `/petbti/result/ESBG` 200, OG 200, admin 302).

---

## 9. 테스트 / 검증

- `score.test.ts`: 모든 응답 조합 → 16유형 중 하나, 동점 없음, 각 축 다수결 정확.
- 무결성: 16유형 전부 별명·캐치프레이즈·추천 기본값·컬러·OG 파일 존재.
- `petbtiProductValidation.test.ts`.
- 빌드: 깨끗한 `opennextjs-cloudflare build`만 신뢰(증분 진단 불신). `.next` 정리 후 클린 빌드.
- 라이브 스모크: 위 3단계.

## 10. 리스크

1. **(높음) 버전 동반 업그레이드** — 1단계에서 Next/adapter 함께 올리고 전체 회귀. 미루면 `^1.18.0` semver로 어느 날 빌드 깨짐.
2. (중) 워커 번들 — 배포 gzip 실측(`wrangler deploy` 출력). OG는 빌드타임 합성이라 런타임 번들 영향 0(리스크 완화).
3. (중) GA 이중 카운트 — `send_to` 래퍼 정비 동반.
4. (중) **주멍이 16장(+ 주냥이 카메오 5컷) 에셋 의존** — 사용자 생성. 미제공분은 플레이스홀더로 진행, 도착 시 슬롯 교체(시스템은 무수정).
5. (낮) iOS 캡처 품질 실기기 QA. (낮) D1 용량 — answers 압축 문자열.
6. (낮) 카카오 JS SDK 도메인 등록 확인.
