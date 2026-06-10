# 멍BTI 풀 리빌드 — 기존 코드·데이터 감사 보고서

> 2026-06-10, 멍BTI 리빌드 리서치 1/4 (코드베이스 감사 서브에이전트 산출물). 리빌드 시 보존해야 할 외부 계약과 기존 자산 인벤토리.

**감사 대상**
- 원본: `D:\a_linkinbio\pet-bti-app` (Vite SPA, github.com/topar12/Meong-BTI, 7커밋, 구 배포 meong-bti.netlify.app)
- 현행: `D:\a_linkinbio\linkinbio-web` (Next.js 16 App Router + OpenNext Cloudflare Workers, master 브랜치)
- 흡수 이력: `61c8fd2` (/petbti로 흡수) → `a71fc6b` (집계 Firestore→D1) → `39f657b` (admin 대시보드 흡수)

**핵심 요약**
- 소스·에셋·로직은 사실상 100% 포팅 완료. 두 레포의 `questions.ts`는 공백 1자 차이로 동일하고, 컴포넌트 차이는 `"use client"`/import 경로/이미지 경로(`/images/` → `/images/petbti/`)/공유 URL(`?r=` → `/petbti?r=`)뿐.
- **html2canvas는 두 레포 모두 package.json에만 있고 import가 0회인 유령 의존성** — 실제 캡처는 `html-to-image`.
- 외부 통합 지점은 3계통: ① Firebase Analytics → GA4 `G-P2G6LQGGSJ` (property **530064801**, admin 퍼널·공유 차트가 이벤트명 8개를 하드코딩 필터) ② Cloudflare D1 `petbti_stats` (+`/api/petbti/*` 2개 라우트, admin KPI·도넛·바 차트가 소비) ③ 브랜드 페이지 2곳의 `/petbti` 진입 카드(클릭 추적은 **별도** 링크인바이오 property 531741905).

---

## 1. 퀴즈 데이터 전문 (7문항, verbatim)

소스: `src\features\petbti\data\questions.ts:12-69` (원본 `pet-bti-app\src\data\questions.ts`와 동일. `\n`은 줄바꿈 표시)

| # | 질문 | 선택지 id | 선택지 텍스트 | 축 |
|---|---|---|---|---|
| q1 | 평소 우리 아이의\n산책 스타일은 어떤가요? | `E` | 더 뛰자고 난리!\n1시간을 뛰어도 지치지 않아요. | E/C (에너지) |
| | | `C` | 조금 걷다가 안아달라고 하거나,\n느긋하게 냄새만 킁킁 맡아요. | |
| q2 | 집 안에서의\n일상적인 모습은 어때요? | `E` | 우다다다!\n장난감을 물고 오거나 끊임없이 움직여요. | E/C |
| | | `C` | 방석이나 소파 위에서 뒹굴뒹굴,\n주로 누워있어요. | |
| q3 | 새로운 간식을 줬을 때\n우리 아이의 반응은? | `G` | 일단 입으로 직행!\n씹은 건지 삼킨 건지 1초 만에 순삭해요. | G/P (식탐) |
| | | `P` | 냄새부터 꼼꼼히 킁킁!\n입맛에 안 맞으면 과감히 뱉어버려요. | |
| q4 | 평소 밥(사료)을 먹는\n속도는 어느 정도인가요? | `G` | 청소기처럼 순식간에\n밥그릇을 싹 비워버려요. | G/P |
| | | `P` | 한 알씩 꼭꼭 씹어 먹거나,\n배고플 때만 조금씩 먹어요. | |
| q5 | 보호자가 외출 준비를 할 때,\n우리 아이의 행동은? | `I` | 자신의 방석에 누워있거나\n덤덤하게 바라봐요. | I/A (독립/불안) |
| | | `A` | 외출하는지 불안하게 눈치를 보며\n낑낑대거나 물건을 뜯어요. | |
| q6 | 보호자의 스킨십을\n대하는 태도는? | `I` | 내가 원할 때만!\n평소엔 조금 떨어져서 쉬는 걸 좋아해요. | I/A |
| | | `A` | 보호자 껌딱지!\n항상 몸을 기대고 만져달라고 조르는 편이에요. | |
| q7 (보너스 가중치) | 간식을 먹을 때\n가장 선호하는 방식은? | `B_BONE` | 단단한 뼈나 껌을 오랫동안 질겅질겅\n씹으며 스트레스 풀기! | 3축 전체 ±0.5 |
| | | `B_MEAT` | 부드럽고 쫀득하게,\n고기의 풍미와 건강 챙기기! | |

축의 공식 의미(결과 화면 `Result.tsx:166-189`의 안내 패널, "C-BARQ, MCPQ Framework" 표기):
- **E/C** = ENERGY 활동 에너지 (활동적 ↔ 차분함)
- **G/P** = GASTRONOMY 식탐 수준 (폭풍흡입 ↔ 까탈입맛)
- **I/A** = INDEPENDENCE 독립성 (독립적 ↔ 불안/껌딱지)

### 채점 로직 (`questions.ts:71-93` `calculateResult`)

```
eScore = (q1==='E'?1:0) + (q2==='E'?1:0) + (q7==='B_BONE'? +0.5 : -0.5)
gScore = (q3==='G'?1:0) + (q4==='G'?1:0) + (q7==='B_BONE'? +0.5 : -0.5)
aScore = (q5==='A'?1:0) + (q6==='A'?1:0) + (q7==='B_BONE'? +0.5 : -0.5)

traitE = eScore > 1 ? 'E' : 'C'   // 주석: "E >= 1.5 defaults to Energetic"
traitG = gScore > 1 ? 'G' : 'P'
traitA = aScore > 1 ? 'A' : 'I'
```

**동점 처리**: 각 축은 본문항 2개라 1:1 동점(1점)이 가능한데, 이때 q7이 유일한 타이브레이커다. `B_BONE`이면 1.5(>1)로 **모든 동점 축이 E/G/A 쪽**, `B_MEAT`이면 0.5로 **모든 동점 축이 C/P/I 쪽**으로 일괄 기운다. 본문항 2개가 같은 쪽이면(0점 또는 2점) q7은 결과를 못 뒤집는다(2-0.5=1.5>1, 0+0.5=0.5≤1). 즉 q7은 "뼈 선호 → 활동적·식탐·불안 방향, 고기 선호 → 차분·까탈·독립 방향"의 전역 편향 가중치.

**combo → resultId 매핑** (`questions.ts:83-92`): EGA→result1, EGI→result2, EPI→result3, EPA→result8, CGA→result4, CGI→result5, CPA→result6, CPI→result7. **default(fallthrough)는 result7**. 역매핑 테이블은 `Result.tsx:12-15`(`resultToTypeCode`)에 별도 존재, fallback `'CPI'`.

---

## 2. 8개 유형 결과 콘텐츠

### 필드 구조 (`questions.ts:95` `resultsData`)

```ts
Record<string, {
  title: string;              // 유형명(캐치프레이즈)
  behaviorAnalysis: string;   // 행동 분석 본문
  recommendedProduct: string; // 추천 간식 제품명
  productReason: string;      // 추천 사유 본문 (세일즈 카피)
  bgColor: string;            // 유형 액센트 컬러 (카드 배지·그림자·포인트에 사용)
  type: string;               // "E - G - A 형" 표기 문자열 (이미지 파일명 유도에도 사용)
}>
```

**주의: "궁합" 필드는 존재하지 않는다.** 결과 데이터는 위 6개 필드가 전부이며, 궁합·추천 친구 유형 같은 콘텐츠는 원본·포팅본 어디에도 없다(리빌드 시 신규 기획 영역).

### 유형별 제목·추천 제품·컬러 전체

| resultId | 코드 | title (캐치프레이즈) | recommendedProduct | bgColor | 한 줄 요약 (behaviorAnalysis) |
|---|---|---|---|---|---|
| result1 | EGA | 극대노 파괴왕 불도저 | 우족 슬라이스 | #D94833 | (아래 verbatim) |
| result2 | EGI | 무한점프 관절 브레이커 | 오리 도가니 | #E07A5F | 점프·활동량 과다로 슬개골/관절 혹사 위험이 큰 초긍정 에너자이저 → 콜라겐·콘드로이친 충전용 도가니 추천 |
| result3 | EPI | 자기관리 끝판왕 헬스견 | 캥거루 꼬리뼈 | #60795D | 고단백 필요 + 알러지 예민 + 독립적인 자기관리형 → 저지방·저알러지 캥거루 꼬리뼈 |
| result4 | CGA | 보호자 껌딱지 방구석 요정 | 돼지귀 슬라이스 | #C88295 | 저활동·집순이 + 약한 분리불안, 비만 경향 → 부드럽게 오래 씹는 콜라겐 돼지귀 |
| result5 | CGI | 고독을 즐기는 선비견 | 양 목뼈 | #8B8C81 | 조용·의젓·분리불안 없음·잘 먹는 우등생 → 홈 덴탈 스파용 양 목뼈 |
| result6 | CPA | 호기심 만렙 참견쟁이 | 오리 날개 | #D1AC00 | 소리에 예민, 싫증 잘 내는 참견쟁이 → 바삭 부서지는 텍스처("강아지용 ASMR") 오리 날개 |
| result7 | CPI | 대쪽같은 미식 황제 | 닭가슴살 육포 | #5D7A8C | (아래 verbatim) |
| result8 | EPA | 에너제틱 프로 예민러 | 캥거루 꼬리뼈 | #B06A42 | 에너지 과다 + 까탈 입맛 + 분리불안 → 씹기 좋은 저알러지 천연껌 캥거루 꼬리뼈 |

### 대표 verbatim 2종

**result1 (EGA) — 극대노 파괴왕 불도저** (`questions.ts:96-103`)
> behaviorAnalysis: "넘치는 에너지와 강한 식탐! 보호자가 없을 땐 집안 물건을 잘근잘근 뜯어놓을 위험이 있는 매우 높은 활동성 및 약간의 불안도를 가진 아이군요. 무언가를 오랫동안 파괴하고 씹는 원초적인 행위를 통해 스트레스를 강력하게 해소해야만 하는 본능적인 터프가이 기질입니다."
>
> productReason: "입에 쏙 들어가는 어설픈 크기의 간식은 덩어리째 통삼킬 위험이 있습니다. 며칠 동안 안전하게 붙잡고 강력하게 씹으면서 파괴 에너지를 완벽히 타파할 수 있는 초거대, 초강력 뼈대 "우족 슬라이스" 솔루션이 시급합니다!"

**result7 (CPI) — 대쪽같은 미식 황제** (`questions.ts:144-151`, default 유형)
> behaviorAnalysis: ""아무거나 먹지 않개!" 음식에 대한 고집과 기준이 대기권을 뚫어버리는 콧대 높은 1티어 미식가 황제마마! 거칠고 낯선 식감의 뼈나 이물감이 드는 저퀄리티 간식은 냄새만 맡고 과감하게 뱉어버리는 확고한 미식가입니다."
>
> productReason: "이런 오죽한 황제마마가 유일하게 허락하는 것은 오직 순수 육즙이 폭발하는 직관적인 고기 맛뿐입니다. 호불호가 절대 갈리지 않는 기호성 만점의 주오컴퍼니 넘버원 베스트셀러, 부드러운 무항생제 "닭가슴살 육포"를 즉시 대령하세요."

### 결과 화면의 부속 콘텐츠 (resultsData 외부, `Result.tsx`)
- 실시간 통계 배지: "전체 N명 중 X.X%만 이 유형!" (`Result.tsx:259-266`, D1 stats 기반)
- 쇼핑몰 CTA: `https://www.lovejuo.com/shop/` "수의사가 직접 만든 프리미엄 수제간식 / 공식몰에서 최저가 혜택받기" (`Result.tsx:350`)
- 인스타 바이럴 4단계: 이미지 저장 → `@petfood.thejuo` 팔로우 → 스토리 공유 → DM 참여 (`Result.tsx:381-419`)
- 복사용 해시태그: `#멍BTI #펫푸드주오 #강아지성향테스트 #강아지mbti #강아지수제간식` (`Result.tsx:58`)
- 인트로 카피: "우리 아이의 진짜 속마음 / 멍-BTI 행동학 테스트", 배지 "🐾 100% 휴먼그레이드 지원 / 💡 기질 분석 데이터 기반", CTA "우리 아이 진짜 성향 알아보기" (`PetBtiApp.tsx:89-113`)

**불일치 경고**: admin 쪽 `src/features/admin/lib/constants.ts:42-49`의 유형 설명("E-G-A형: 외향적·사교적·활동적" 등)은 **실제 앱의 축 의미(G=식탐, A=불안)와 다르게 적혀 있다**. admin 차트 라벨용으로만 쓰이지만 리빌드 시 정합화 대상.

---

## 3. 공유 메커니즘

| 항목 | 내용 | 근거 |
|---|---|---|
| **이미지 캡처** | `html-to-image`의 `toPng()`. **html2canvas는 사용 안 함**(두 레포 모두 import 0회, package.json에만 잔존) | `Result.tsx:6,72-83` |
| 캡처 옵션 | `pixelRatio: 2`, `backgroundColor: '#FDFCF8'`, `filter`로 `.hide-on-capture` 클래스 노드 제외, `style: { transform: 'scale(1)' }` | `Result.tsx:72-83` |
| 캡처 대상 | `ticketRef` div(결과 카드 블록 — 노이즈 텍스처 배경 + 유형 이미지 + 타이틀 + 분석문). 사용자가 업로드한 강아지 사진(`FileReader` dataURL)이 있으면 그걸로 캡처됨 | `Result.tsx:199-274` |
| 다운로드 파일명 | `멍BTI_결과_{EGA}.png` (`data.type.replace(/[^A-Za-z]/g, '')`) | `Result.tsx:86` |
| **카카오 공유** | **없음.** Kakao SDK 부재. `navigator.share`(Web Share API) → 미지원 브라우저는 `navigator.clipboard.writeText` 폴백 + alert | `Result.tsx:97-121` |
| 공유 텍스트 | title "멍-BTI 성향 테스트" / text "🐶 우리 아이는 [E - G - A 형] {title} 유형이에요!\n너네 댕댕이의 기질에 맞는 맞춤 간식도 추천받아보세요! 👇" | `Result.tsx:100-102` |
| **결과 URL 구조** | **쿼리스트링 방식, 유형별 path permalink 없음**: `{origin}/petbti?r=result1&utm_source=share_link&utm_medium=social&utm_campaign=meong_bti_share` (원본 SPA는 `{origin}?r=...`) | `Result.tsx:98` |
| 새로고침 유지 | **공유 링크로 진입한 경우만** 유지: 마운트 시 `useSearchParams`로 `r` 검증(8개 화이트리스트) 후 결과 화면 복원. **자체 완료 직후에는 URL을 안 바꾸므로 새로고침하면 인트로로 리셋.** `utm_source=share_link`이면 `shared_link_visit` 이벤트 발사. 다시하기 시 `replaceState`로 쿼리 제거 | `PetBtiApp.tsx:21-33,52-59` |
| **OG 태그** | `/petbti` 정적 메타만: title "멍-BTI 행동학 테스트 \| 펫푸드 주오" + description. **og:image 없음, 유형별 OG 분기 없음**(클라이언트 쿼리스트링 구조라 불가). `opengraph-image.*` 파일 부재. 원본 `index.html:7-8`도 title/description만 | `src/app/(site)/petbti/page.tsx:4-8` |

리빌드 참고: 유형별 OG 미리보기를 원하면 `/petbti/result/[type]` 같은 서버 라우트화가 필요(현 구조의 공유 링크 `?r=` 호환 리다이렉트 유지 권장).

---

## 4. Firebase 사용처 전부

### 설정값 (두 레포 동일 — `linkinbio-web\src\features\petbti\firebase.ts:11-19`, `pet-bti-app\src\firebase.ts:5-13`)

```
projectId:         juo-company
appId:             1:1063207314132:web:8fbaf2125e28d8fa175141
measurementId:     G-P2G6LQGGSJ   ← 멍BTI GA4 웹 스트림 (property 530064801)
```
(apiKey 등 나머지 필드는 firebase.ts 참조 — 공개 웹 설정값)

### 구현 차이
- **linkinbio-web** (`firebase.ts:21-48`): `firebase/app` + `firebase/analytics`만. SSR 보호를 위해 `isSupported()` 확인 후 lazy init(`resolveAnalytics`), `logEvent(eventName, params)` 래퍼만 export. **Firestore 없음**(주석: "결과 집계는 Cloudflare D1로 이관됨").
- **pet-bti-app 원본** (`firebase.ts:3,18-78`): 추가로 `firebase/firestore` 사용 — `stats/meong-bti` 문서에 `incrementResultCount`(8유형+total 필드 increment, sessionStorage 중복방지), `getResultStats`. **이 Firestore 데이터는 D1로 대체됐으나 Firestore에 과거 누적분이 남아있을 수 있음**(마이그레이션 여부는 코드만으로 확인 불가).
- 원본 `index.html:10-17`에는 **gtag.js 직접 로드 스니펫**(`G-P2G6LQGGSJ`)도 있었음 — Firebase Analytics와 이중 계측. 포팅본은 firebase SDK 단일 경로(의도적 정리로 보임). 참고로 linkinbio-web 루트 레이아웃의 `<GoogleAnalytics gaId={NEXT_PUBLIC_GA_ID}>`는 **다른 property**(G-WD1Q4Q5CDH)다(`src/app/layout.tsx:15,25`).

### logEvent 호출 지점 전체 (linkinbio-web 기준, 총 10개 이벤트)

| 이벤트명 | 파라미터 | 트리거 | 위치 |
|---|---|---|---|
| `quiz_start` | (없음) | 인트로 CTA 클릭 | `PetBtiApp.tsx:108` |
| `shared_link_visit` | `shared_result_type: result1..8` | `?r=` + `utm_source=share_link` 진입 | `PetBtiApp.tsx:28` |
| `quiz_complete` | `result_type: EGA..`, `result_title: 유형명` | 결과 화면 마운트 | `Result.tsx:43` |
| `photo_upload` | `result_type` | 강아지 사진 교체 업로드 | `Result.tsx:54` |
| `copy_tags` | (없음) | 해시태그 복사 | `Result.tsx:61` |
| `result_download` | `result_type` | 이미지 저장 버튼 | `Result.tsx:67` |
| `share_result` | `result_type` | `navigator.share` 성공 | `Result.tsx:108` |
| `copy_link` | `result_type` | 공유 폴백(클립보드 복사) | `Result.tsx:116` |
| `shop_click` | `result_type` | lovejuo.com/shop CTA | `Result.tsx:353` |
| `dm_click` | `result_type` | 인스타 DM 버튼 | `Result.tsx:410` |

---

## 5. admin GA4 라우트가 의존하는 이벤트명/디멘션 (property 530064801)

GA4 접근: `src/features/admin/lib/ga4.ts:3-4` — 서비스 계정 `ga4-dashboard@juo-company-491405.iam.gserviceaccount.com`, `DEFAULT_PROPERTY_ID = "530064801"` (env `GA4_PROPERTY_ID`로 오버라이드, `wrangler.jsonc:14`에도 동일 값). Data API v1beta `runReport` 직접 호출(JWT 서명 자체 구현).

| 라우트 | 디멘션 | 메트릭 | **하드코딩 이벤트 필터** | 대시보드 표시 |
|---|---|---|---|---|
| `src/app/admin/api/ga4/funnel/route.ts:12-18,63-69` | `eventName` | `eventCount` | `quiz_start, quiz_complete, result_download, shop_click, dm_click` | 퍼널 5단계 |
| `src/app/admin/api/ga4/share/route.ts:10-14,56-60` | `eventName` | `eventCount` | `share_result, copy_link, shared_link_visit` | 공유 채널 분해 |
| `src/app/admin/api/ga4/trend/route.ts:18-30` | `date` | `activeUsers`, `eventCount` | (필터 없음 — property 전체) | 일별 추이 |
| `src/app/admin/api/ga4/traffic/route.ts:18-37,46-51` | `sessionDefaultChannelGroup` | `activeUsers` | (필터 없음, limit 5) | 채널별 유입 |

**리빌드 판단 근거**:
- **반드시 유지해야 할 이벤트명 8개**: `quiz_start`, `quiz_complete`, `result_download`, `shop_click`, `dm_click`, `share_result`, `copy_link`, `shared_link_visit` — admin 쿼리에 문자열로 박혀 있어 바꾸면 대시보드가 0으로 나온다(또는 admin도 동시 수정).
- `photo_upload`, `copy_tags`는 GA4로 전송만 되고 대시보드 쿼리에는 없음 — 이름 변경 자유도 있음.
- 이벤트 **파라미터**(`result_type` 등)는 멍BTI admin 라우트에서 디멘션으로 조회하지 않는다(`customEvent:*` 커스텀 디멘션 조회는 링크인바이오 라우트 전용). 파라미터는 GA4 탐색용이므로 보존 권장이지만 대시보드 깨짐과는 무관.
- trend/traffic은 property 단위 무필터 — **같은 measurementId(G-P2G6LQGGSJ)로 쏘기만 하면** 자동 호환. 단 property 전체 집계이므로 동일 property에 다른 서비스를 섞으면 오염된다.

---

## 6. D1 통계 계통

### 스키마 (`db\schema.sql:1-10`)
```sql
CREATE TABLE IF NOT EXISTS petbti_stats (
  type_code TEXT PRIMARY KEY,
  count     INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO petbti_stats (type_code, count) VALUES
  ('EGA',0),('EGI',0),('EPI',0),('EPA',0),('CGA',0),('CGI',0),('CPA',0),('CPI',0);
```
바인딩: `wrangler.jsonc:30-36` — D1 `juo-db`, binding `DB`. 접근 헬퍼 `src/lib/d1.ts:19-26` `getDb()`.

### API 라우트
- **POST `/api/petbti/result`**: 입력 `{ typeCode: "EGA" }` — 8개 화이트리스트 검증, `INSERT ... ON CONFLICT(type_code) DO UPDATE SET count = count + 1`. 출력 `{ok:true}` / 400 / 500. `force-dynamic`.
- **GET `/api/petbti/stats`**: 전 행 SELECT 후 `{ EGA:n, EGI:n, ..., total:n }` 평탄 객체 반환(`total` 합산 계산). **실패 시 200 + `null`** (배지만 숨기는 무해 실패 설계).

### 클라이언트 소비 (`src/features/petbti/stats.ts`)
- `incrementResultCount`: sessionStorage 키 `meong-bti-counted-{typeCode}`로 세션당 1회 제한 → POST 성공 시 키 기록. (키 이름은 Firestore 시절 그대로)
- `getResultStats`: `cache: "no-store"` GET → 결과 화면 "전체 N명 중 X%" 배지 계산(소수 1자리 반올림).

### admin 소비
- `QuizProjectDashboard.tsx:44` — `/api/petbti/stats` 1회성 fetch. KPI 4종(전체 참여자/인기 1위/희귀 유형/유형별 평균) + TypeDonutChart·TypeBarChart + GA4 차트 4종(days 필터 1·7·14·30·90).
- `OverviewContent.tsx:38` — 같은 API로 프로젝트 카드 요약. 조회 게이팅이 `project.firestoreCollection/firestoreDoc` 존재 여부로 걸린 **레거시 네이밍** — 리빌드 시 정리 대상.

---

## 7. /petbti 내부 진입점 전체 (URL 보존 판단용)

진입 링크는 브랜드 페이지 2곳뿐:

| 위치 | 내용 |
|---|---|
| `src/data/linkPages/loveJuo.ts:159` | "진행중인 이벤트" featureCards, 카드 id `meongbti`, badge "Test", title "멍BTI 맞춤 간식 찾기", 이미지 `/images/test.webp`, **`href: "/petbti"`**, tracking `meongbti_click {location: "event_card"}` |
| `src/data/linkPages/petfoodJuo.ts:157` | 동일 구성 |

렌더 경로: `LinkInBioPage.tsx:339` → `FeatureCards` → `FeatureCardButton` → `SmartLink` — 내부 경로는 일반 `<a href="/petbti">`(풀 페이지 로드). 클릭 추적 `meongbti_click`은 `src/lib/analytics.ts:32-39` `trackEvent` → **링크인바이오 GA4 `G-WD1Q4Q5CDH` (property 531741905)**. 즉 **진입 클릭과 퀴즈 내부 행동이 서로 다른 property에 기록**된다.

그 외 결합 지점:
- `Result.tsx:98` — 공유 URL이 `/petbti` 경로 하드코딩
- `src/features/admin/lib/linkinbio.ts:63,77` + `summary/route.ts:66` — `meongbti_click` 집계(`meongbtiClicks`)
- `src/features/admin/lib/constants.ts:36` — 멍BTI 프로젝트 url이 **아직 구 Netlify `https://meong-bti.netlify.app/`** (갱신 대상)
- `src/app/globals.css:5-13` — 멍BTI 팔레트 변수, `(site)/layout.tsx` — 폰 프레임

**결론**: `/petbti` 경로는 ① 브랜드 카드 2곳 ② 기배포 공유 링크(`/petbti?r=...`) ③ 외부 유입이 걸려 있으므로 **경로와 `?r=resultN` 쿼리 호환은 보존(최소한 리다이렉트)** 필요.

---

## 8. pet-bti-app 원본에만 있고 포팅 안 된 것

### 에셋 인벤토리

| 파일 | 해상도/크기 | 코드 참조 | 포팅 |
|---|---|---|---|
| `images/EGA·EGI·EPA·EPI·CGA·CGI·CPA·CPI.jpg` (유형 캐릭터 8종) | **1024x1024 JPG, 696KB~1,009KB** | Result.tsx 유형 이미지 | ✅ `public/images/petbti/`에 복사됨 |
| `images/우족.jpg, 오리 도가니.jpg, 캥거루 꼬리뼈.jpg, 돼지귀 슬라이스.jpg, 양 목뼈.jpg, 오리 날개.jpg, 닭가슴살 육포.jpg` (제품 7종, 한글 파일명) | 750~751px 정방형, 289~847KB | **양쪽 모두 코드 참조 0회** | ✅ 복사됐으나 미사용 — "추천 간식 실물 사진" 잠재 자산 |
| `favicon.svg` | 512 viewBox, 2.3KB (강아지 얼굴+점선 타겟 로고) | 인트로 로고 | ✅ 복사됨 |
| `icons.svg`, `src/assets/*`, `App.css`, `.ticket-edge` | — | 참조 0회 | ❌ 미포팅(무손실) |

### 코드/문서
- **README.md** — Vite 템플릿 기본문뿐. **기획 메모·디자인 문서는 양쪽 레포 어디에도 없음.** 결과 화면의 "C-BARQ, MCPQ Framework" 표기가 유일한 기획 근거 텍스트.
- `dist/` — 구 Netlify 배포 산출물. **meong-bti.netlify.app가 살아있다면 구버전(Firestore 직접 쓰기 + `?r=` 루트 공유 URL)이 병행 운영 중일 수 있음** — 폐기/리다이렉트 결정 필요.
- 이미지 최적화 부재: 캐릭터 JPG 8장 합계 약 6.7MB가 `<img>` 태그(Next/Image 미사용)로 서빙됨 — WebP/AVIF + 사이즈 다운 권장.

---

## 9. 의존성 감사

### linkinbio-web — petbti 관점 분류

| 패키지 | 버전 | petbti 사용 | petbti 외 사용 | 리빌드 시 제거 가능? |
|---|---|---|---|---|
| `firebase` | ^12.14.0 | firebase.ts (analytics만) | **없음** | ⭕ gtag 직송으로 바꾸면 통째 제거(번들 절감 큼) |
| `html-to-image` | ^1.11.13 | Result.tsx 캡처 | **없음** | ⭕ petbti 전용 |
| `html2canvas` | ^1.4.1 | **import 0회** | **import 0회** | ⭕ **즉시 제거 가능한 유령 의존성** |
| `framer-motion` | ^12.38.0 | 전 컴포넌트 | 공용(StoreFinderSheet 등) | ❌ |
| `@phosphor-icons/react` | ^2.1.10 | Result/Loading | 공용 | ❌ |

---

## 10. 현재 라우트 파일 위치와 레이아웃

- `/petbti`는 **`(site)` 그룹 아래** — `src\app\(site)\petbti\page.tsx`.
- 렌더 체인: `page.tsx`(서버, metadata만) → `PetBtiClient.tsx`(클라) → `dynamic(() => import PetBtiApp, { ssr:false })` + `<Suspense fallback={null}>` — Workers 번들에서 firebase/html-to-image 평가 시 런타임 500 → ssr:false 필수라는 주석. `useSearchParams` 사용으로 Suspense 필수.
- 폰 프레임: `(site)/layout.tsx:10-18` — 모바일(<sm) 100dvh 풀블리드, sm+ 높이 850px(max 90vh) 폰 목업. **멍BTI는 데스크톱에서도 항상 430px 폰 프레임 안**.
- 이중 폭 제한: 프레임 안에서 `PetBtiApp.tsx:82-83`이 다시 `max-w-[400px] min-h-[100dvh]` 자체 컬럼(원본 SPA 잔재) — 리빌드 시 일원화 가능.
- 스타일: `globals.css:1`(Pretendard CDN), `:5-13`(멍BTI 팔레트 `--color-sage/rose/charcoal/offwhite/butter`, `--font-display/body`).

---

## 부록: 리빌드 시 보존 / 마이그레이션 / 제거 체크리스트

**반드시 보존 (외부 계약)**
1. GA4 이벤트명 8개: `quiz_start, quiz_complete, result_download, shop_click, dm_click, share_result, copy_link, shared_link_visit` + measurementId `G-P2G6LQGGSJ`(property 530064801) — admin 4개 라우트 직결.
2. `/petbti` 경로 + `?r=result1..8` 공유 쿼리 호환(기배포 공유 링크·브랜드 카드 2곳·외부 바이오 링크).
3. D1 `petbti_stats` 누적 카운트와 `/api/petbti/result`(POST `{typeCode}`)·`/api/petbti/stats`(GET 평탄 객체) 입출력 shape — admin 2개 컴포넌트 소비. 유형 코드 8개가 D1 PK라 변경 시 마이그레이션 필요.
4. 브랜드 카드의 `meongbti_click`(property 531741905) — 멍BTI 본체와 별개 계통.

**의도적 마이그레이션 후보**
- firebase SDK → gtag 직송(이벤트명만 지키면 admin 무영향, firebase 의존성 제거).
- 유형별 OG 이미지 → 서버 라우트화(+구 `?r=` 리다이렉트).
- 캐릭터 JPG 8종 WebP화 + Next/Image 전환.
- admin `constants.ts:36` 구 Netlify URL, `firestoreCollection/firestoreDoc` 레거시 게이팅, 축 설명 불일치(`constants.ts:42-49`) 정리. 구 Netlify 배포 폐기/리다이렉트 결정.

**즉시 제거 가능**
- `html2canvas`(양 레포 미사용), linkinbio-web 한정 `firebase`·`html-to-image`(petbti 전용).

**누락 주의**
- "궁합" 데이터는 원래 없음(신규 기획 필요). 기획 문서·README 부재 — 본 보고서의 verbatim 데이터가 사실상 유일한 콘텐츠 원본이며, 전체 콘텐츠 원문은 `src\features\petbti\data\questions.ts` 1파일에 집약돼 있다.
