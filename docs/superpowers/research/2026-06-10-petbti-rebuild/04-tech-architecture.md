# 멍BTI 리빌드 — Workers 기술 아키텍처 리서치

> 2026-06-10, 멍BTI 리빌드 리서치 4/4. Cloudflare Workers 위 Next.js로 성격 테스트를 풀스택 재구축하기 위한 아키텍처 검증. 항목별 '가능/조건부/불가' 결론 + 근거.

## 검증된 현재 스택 (lockfile 기준 실제 설치본)
| 구성요소 | 버전·설정 |
|---|---|
| Next.js | **16.2.2** 고정 · App Router |
| @opennextjs/cloudflare | **1.18.0** (`^1.18.0`) |
| wrangler | 4.81.0 · `compatibility_date 2026-04-08` · `nodejs_compat`, `global_fetch_strictly_public` |
| open-next.config.ts | `defineCloudflareConfig({})` — **incremental cache·queue 미설정** |
| D1 | 바인딩 `DB`(juo-db) · `src/lib/d1.ts` `getDb()` |
| 캡처 | Result.tsx 이미 **html-to-image** 사용. html2canvas는 미사용 잔존 |
| GA | `@next/third-parties` `<GoogleAnalytics gaId={G-WD1Q4Q5CDH}>`(사이트) + firebase analytics `G-P2G6LQGGSJ`(멍BTI) |

## ① 항목별 결론 요약표
| # | 항목 | 결론 | 한 줄 |
|---|---|---|---|
| 1 | 동적 OG (next/og ImageResponse) | **조건부** | 어댑터 e2e 검증됨. 단 Next≥16.2.3+adapter≥1.19 동반 업글, 번들 +~2MiB, 한글 폰트 서브셋. **유형 유한 → 사전 생성 정적 PNG가 최선** |
| 2 | 결과 이미지 클라 저장 | **가능** | html-to-image 유지 가능하나 iOS Safari 이슈 → **snapdom 교체 권장**(Safari 워밍업 내장) |
| 3 | 카카오 공유(sendDefault) | **가능** | 같은 앱이면 **카카오맵과 동일 JS 키 재사용**. `Kakao.init()` + 도메인 등록만 |
| 4 | GA4 firebase 없이 | **가능** | firebase analytics=gtag 래퍼 → gtag 직송으로 같은 스트림 유지. 듀얼 config 시 `send_to` 필수(미지정 시 **이중 카운트**) |
| 5 | D1 응답 저장 | **가능** | **하이브리드**: 카운터(희귀도) + raw 응답(문항 튜닝). 일 1만 응답도 무료 한도 ~20% |
| 6 | 라우트·렌더링 | **가능** | 인트로(정적)–퀴즈(클라)–결과 `[type]`(SSG 셸). 빈 config는 SSG가 매 요청 SSR → **static-assets incremental cache 한 줄** 권장(R2 불필요) |
| 7 | 퀴즈 콘텐츠 소스 | **코드(TS) 권장** | 점수 로직과 강결합·타입 안전·vitest. 가변 카피만 선택적 D1 |
| 8 | petbti_stats | **유지+확장** | admin 2곳이 `{CODE:n,…,total}`에 의존 → 형태 보존, `petbti_responses`만 추가 |

---

## 상세 근거

### 1. 동적 OG — 조건부
- **ImageResponse는 @opennextjs/cloudflare 공식 지원·테스트됨**: 어댑터 e2e `og.test.ts`가 `opengraph-image.tsx`(빌드타임)와 `/api/og`(런타임) 둘 다 Workers 배포본에서 PNG md5까지 검증. `@vercel/og` 전용 빌드 패치 존재.
- **조건1 버전 동반 업글(핵심 리스크)**: adapter 1.19.2가 "Next 16.0~16.2.2 지원 제외, **16.2.3+** 지원" 명시. 현 레포(Next 16.2.2+adapter 1.18.0)는 어댑터 올리는 순간 Next도 함께 올려야. `package.json`이 `^1.18.0`이라 lockfile 없이 재설치 시 1.19.x 깔려 빌드 깨질 수 있음 → **리빌드 착수 시 Next≥16.2.6 + adapter 최신 동반 업그레이드 선행**.
- **조건2 번들**: next/og 사용 시 `@vercel/og`~800KiB + `resvg.wasm`~1.4MiB. 1.19.4부터 미사용 시 shim 치환. Workers 한도 무료 3MiB/유료 10MiB gzip, CPU 무료 10ms/유료 30s. 현 워커 gzip 추정 ~4.2MB(러프 — `wrangler deploy` 출력으로 실측 필요). 무료면 OG 번들 부담 큼, 유료면 여유.
- **조건3 한글 폰트**: satori는 TTF/OTF/WOFF만(WOFF2 불가). Noto Sans KR 풀폰트는 수MB → **유형 OG 문구 고정**이므로 `pyftsubset --text="실제 문구"`로 수 KB까지 서브셋. Next 기본은 "OG 이미지는 빌드타임 정적 최적화"라 `generateStaticParams`(8유형)+요청 API 미사용이면 satori는 빌드 머신에서만 실행.
- **권장**:
  - **A안(권장·무위험)**: 빌드 전 스크립트로 정적 PNG 사전 생성 → `public/og/petbti/{TYPE}.png` → `generateMetadata` 참조. 워커 번들 영향 0, 플랜 무관, 슬림 번들 유지.
  - B안(Next 네이티브 `opengraph-image.tsx`+generateStaticParams): 빌드타임 생성하나 모듈이 번들에 남아 +~2MiB + 아래 6번 캐시 설정 필요. 유료+버전업 전제.
  - C안(런타임 ImageResponse): 동작 확증되나 본 케이스 불필요.

### 2. 결과 이미지 저장 — 가능(snapdom 권장)
- html2canvas: 유지보수 중단 → 제거. html-to-image(현행): iOS/Safari blank 고질 이슈(#361·#461·#488 "첫 호출 blank→두 번 호출" 워크어라운드). modern-screenshot: 복잡 DOM 열세.
- **snapdom 권장**: v2.12.8(2026-06), 7.8k★ MIT 활발. SVG 경유로 html2canvas 대비 수십~수백배 빠름. **Safari 대응 내장**(`safariWarmupAttempts` 기본 3). `exclude`/`filter`(현 `hide-on-capture` 패턴 이식), `scale`·`width`·`dpr`, PNG/JPG/WebP/Blob, `embedFonts`.
- **서버 생성 직접 다운로드의 한계**: 현 Result의 핵심 기능 **'내 강아지 사진으로 교체 후 저장'**(클라 보유 사진 합성)이 불가능 → 사진 업로드 API·저장소·PII 처리 신규 필요. **결과 카드 저장은 클라 캡처 유지가 맞다.**
- **듀얼 포맷(1:1/9:16)**: 캡처 DOM 두 벌 렌더(스토리용 offscreen 1080×1920) 후 각각 `snapdom.toPng`. 단일 DOM 비율만 바꾸면 줄바꿈 깨짐. iOS는 Web Share API L2(`navigator.share({files})`)로 '사진 앱 저장' 동선 보강.

### 3. 카카오 공유 — 가능
- **키 재사용**: 카카오맵 Web API도 "JavaScript 키" 사용, 공유 JS SDK `Kakao.init()`도 동일 "JavaScript 키" → **같은 카카오 앱이면 `NEXT_PUBLIC_KAKAO_MAP_APP_KEY` 그대로 재사용**. 확인 1가지: 콘솔 JavaScript 키 > JS SDK 도메인에 서비스 도메인 등록 여부(맵 쓰는 중이라 등록됐을 가능성 높음).
- SDK 로드: `t1.kakaocdn.net/kakao_js_sdk/${VER}/kakao.min.js`+integrity+crossorigin. Next는 `next/script afterInteractive` onLoad에서 `Kakao.init()`.
- **sendDefault feed**: `objectType:'feed'`, content{title,description,imageUrl}, link{mobileWebUrl,webUrl}, buttons[] — 기본 템플릿이라 **사전 등록 불필요**. 이미지 최대 5MB·최소 200×200 → 항목1 OG PNG 그대로 imageUrl.
- **OG만 충분 vs SDK**: URL 붙여넣기 경로는 OG 태그만 제대로면 충분. SDK가 나은 경우: 페이지 내 원탭 버튼, 버튼 2개("결과 보기"+"나도 테스트하기"), 공유 클릭 GA 계측. 권장: **결과 페이지 카카오 버튼(SDK) + 기타 navigator.share 폴백**, OG는 공통 기반.

### 4. GA4(firebase 제거) — 가능
- **확증**: Firebase 웹 Analytics는 내부 gtag.js. firebase 공식 문서가 같은 measurement ID로 gtag()·firebase 혼용 절차 명시. 잃는 건 Firebase 서비스 연동뿐, **gtag 직송 이벤트도 GA4 스트림엔 정상 적재**. firebase 완전 제거 케이스엔 무손실 → `gtag('config','G-P2G6LQGGSJ')`+`gtag('event','quiz_complete',{...})`로 동일 property 동일 이벤트.
- **듀얼 config 라우팅**: `G-WD1Q4Q5CDH`(사이트)+`G-P2G6LQGGSJ`(멍BTI) 공존, 이벤트는 `send_to`로 분리. **함정**: `send_to` 생략 시 페이지의 모든 config로 전송 → 현 `analytics.ts`의 `trackEvent`가 send_to 없이 호출되므로 멍BTI config 추가 순간 **사이트 이벤트가 멍BTI 스트림에도 이중 적재**. 해법: 멍BTI 이벤트엔 `send_to:'G-P2G6LQGGSJ'`, 사이트 이벤트엔 `send_to:'G-WD1Q4Q5CDH'` 명시 래퍼(`features/petbti/lib/ga.ts`).
- **단일 property 통합 대안**: send_to 문제 사라지나 기존 멍BTI 누적 연속성 끊기고 admin GA4 라우트(530064801 기반) 전부 수정 필요.

### 5. D1 스키마 — 가능(하이브리드)
- **과금**: rows_read = 쿼리가 **스캔**한 행 수(결과 행 아님). 무료 읽기 5M행/일, 쓰기 100k행/일, 저장 5GB(DB당 500MB).
- (a)카운터만: 희귀도 최적이나 문항 분포 불가. (b)raw만: 희귀도 %를 매 뷰 `COUNT(*)`로 내면 누적 전체 스캔×뷰수로 폭발(일 1만뷰×90만행=90억 read).
- **권장 하이브리드**:
```sql
petbti_stats(type_code TEXT PK, count INTEGER)  -- 유지(희귀도·admin 호환)
CREATE TABLE petbti_responses (                  -- 신규(PII 없음)
  id TEXT PRIMARY KEY,            -- crypto.randomUUID()
  result_type TEXT NOT NULL,      -- 'EGA'…
  answers TEXT NOT NULL,          -- 압축 'ECGPAI+B_BONE' 또는 JSON
  created_at INTEGER NOT NULL );
CREATE INDEX idx_petbti_responses_created ON petbti_responses(created_at);
CREATE INDEX idx_petbti_responses_type    ON petbti_responses(result_type);
```
- **비용(일 1천~1만)**: 완료당 쓰기 2행(카운터+INSERT)=2k~20k/일=무료 2~20%. 희귀도 배지는 카운터 8행+`/api/petbti/stats`에 foods식 `s-maxage=60` 엣지캐시 → D1 도달 분당 1회로 캡. 문항 분포는 admin에서만, `created_at` 인덱스로 기간 제한 스캔. 저장 ~100B×1만×365≈365MB/년 → 상시 일 1만이면 1년 내 500MB 근접(유료 전환/아카이브 메모).

### 6. 라우트·렌더링 — 가능(캐시 한 줄)
- **OpenNext 원칙**: "SSR route는 캐싱 설정 없이 동작, 캐싱은 SSG/ISR·data cache만 관여". 빈 config에서도 도는 이유. 단 프리렌더 페이지가 `.open-next/cache/` 시드로만 존재 → incremental cache 없으면 "정적" 페이지·메타 이미지 라우트가 **매 요청 워커 재렌더**(동작은 함, 캐시 이득 0).
- **권장**: ISR 불필요(8개 고정 결과)하니 R2 없이 **읽기 전용 static-assets incremental cache** 한 줄:
```ts
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";
export default defineCloudflareConfig({ incrementalCache: staticAssetsIncrementalCache });
```
캐시 적재는 `opennextjs-cloudflare deploy`의 populateCache 단계 포함. `revalidate`/`revalidateTag` 쓰면 그때 R2+DO queue 풀셋으로 승격.
- **페이지 구성**:
  - `/petbti` 인트로: 서버 컴포넌트, 정적, 기본 OG.
  - `/petbti/quiz`: 서버 셸 + `'use client'` 퀴즈. firebase 제거 + 캡처를 클릭 핸들러 내 동적 import로 한정하면 **ssr:false 트릭 불필요**.
  - `/petbti/result/[type]`: `generateStaticParams()` 8유형 + `dynamicParams=false`(외 404). 유형 콘텐츠 서버 렌더(크롤러·첫 페인트 완전 HTML), 희귀도·저장·공유는 클라 섬. **희귀도 %는 프리렌더에 굽지 말고** 클라에서 `/api/petbti/stats` fetch.
  - 완료 → `router.push('/petbti/result/EGA?from=quiz')`. `from=quiz`만 카운터 POST(sessionStorage 중복 방지), 공유 유입엔 '나도 하기' CTA 1순위.

### 7. 퀴즈 콘텐츠 소스 — 코드(TS) 권장
- foods/stores D1 패턴이 맞았던 조건은 **플랫 행 데이터 + 비개발자 잦은 편집**. 멍BTI 문항은 반대: 문항 ID·선택지 ID가 `calculateResult` 가중치(q7 ±0.5)와 **하드코딩 강결합**. D1 이전 시 문항 편집이 점수 로직과 불일치하는 사고 벡터 + 8유형×다필드 중첩이 행 CRUD에 부적합 + 변경 빈도 낮음.
- 코드 유지 실익: TS 타입 안전, vitest 무결성("모든 유형에 이미지·추천 존재", "calculateResult가 항상 8유형 반환"), git 이력.
- **절충**: 가변 카피(유형별 추천 제품명·카피·쇼핑몰 링크)만 D1 분리해 admin 편집 + 60s 캐시 GET. 문항·점수·유형 골격은 코드.

### 8. petbti_stats — 유지+확장
- 소비자: `/api/petbti/stats` 응답 `{EGA:n,…,total}`에 admin `OverviewContent`·`QuizProjectDashboard`(top/rare/avg) + 결과 희귀도 배지 의존.
- **유지·확장 정답**: 동일 `INSERT … ON CONFLICT DO UPDATE count+1` 유지 → admin **무수정 호환** + 누적 연속성 보존. `petbti_responses`는 순수 추가라 영향 없음.
- 교체(raw에서 stats 파생) 주의: 응답 JSON 키·total 1byte 바뀌면 admin 2곳+배지 동시 수정 / 과거 누적 baseline 이월 안 하면 희귀도·total 리셋 / rows_read 폭발. 이득 없음.

---

## ② 권장 스택과 리스크
| 영역 | 선택 |
|---|---|
| 프레임워크 | Next≥16.2.6 + @opennextjs/cloudflare≥1.19.11 (동반 업글, 선행) |
| OG | **사전 생성 정적 PNG**(satori Node 스크립트, 한글 글리프 서브셋) → public/og/petbti/, useOg 비활성 |
| 저장 | **snapdom**(1:1·9:16 듀얼) + html2canvas·html-to-image·firebase 제거 |
| 카카오 | JS SDK v2 sendDefault(feed) · 기존 JS 키 재사용 |
| 분석 | gtag 직송, send_to 명시 래퍼로 멍BTI/사이트 분리 |
| 데이터 | petbti_stats 유지 + petbti_responses 신규(인덱스 2) · stats GET 60s 캐시 |
| 캐싱 | static-assets incremental cache(읽기 전용, R2 불필요) |
| 콘텐츠 | 문항·로직 TS+vitest, 추천 카피만 선택적 D1 |

**리스크**: ①(높음) 버전 동반 업글 — 첫 단계에서 Next/adapter 함께 올리고 회귀 확인(미루면 `npm install`만으로 빌드 깨질 수 있음). ②(중) 워커 번들 여유 — 실제 배포 gzip 실측 후 OG 방식 확정(A안이면 소멸). ③(중) GA 이중 카운트 — 래퍼 정비 동반. ④(낮) iOS 캡처 품질 실기기 QA. ⑤(낮) D1 용량 — answers 압축. ⑥(낮) 카카오 도메인 등록 1회 확인.

## ③ 권장 아키텍처
```
Cloudflare Workers (juolinkinbio)
  Workers Assets: /og/petbti/{TYPE}.png ◀ 빌드 전 satori(한글 서브셋)
                  프리렌더 HTML (static-assets incremental cache)
  /petbti ─CTA─▶ /petbti/quiz ─완료─▶ /petbti/result/[type]
  (정적 인트로)   ('use client')        (SSG 셸 8종 + 클라 섬)
                     │ POST /api/petbti/result    │ 공유 유입(카톡 스크랩=OG만 읽음)
                     ▼                             │
       D1: petbti_stats +1, petbti_responses INSERT(raw)
       GET /api/petbti/stats (s-maxage=60) ◀ 희귀도 배지
       클라 섬: snapdom 캡처 / Kakao.Share feed / gtag send_to 분리
  GA4: G-P2G6LQGGSJ(멍BTI, 530064801) + G-WD1Q4Q5CDH(사이트), gtag.js 1회 + config 2개
```

## ④ 신규 파일 트리 초안
```
src/app/(site)/petbti/
├─ page.tsx                  # 인트로(서버·정적, 기본 OG)
├─ quiz/page.tsx             # 서버 셸 + <QuizClient/>
└─ result/[type]/page.tsx    # generateStaticParams 8유형 + dynamicParams=false
                             # generateMetadata → /og/petbti/{TYPE}.png
src/app/api/petbti/
├─ stats/route.ts            # 유지 + s-maxage=60
└─ result/route.ts           # 확장: db.batch([카운터 UPDATE, responses INSERT])
src/app/admin/api/petbti/answers/route.ts  # 신규: 문항 분포(기간, 인덱스)
src/features/petbti/
├─ data/questions.ts         # 문항·유형(코드 유지)
├─ lib/score.ts (+score.test.ts) / lib/ga.ts(send_to 고정) / lib/kakao.ts
├─ components/QuizClient.tsx / ResultCard.tsx(1:1) / StoryCard.tsx(9:16 offscreen)
│             SaveImageButton.tsx(snapdom 동적 import) / ShareButtons.tsx
src/lib/petbtiDb.ts          # responses/stats 헬퍼(foodsDb 패턴)
scripts/generate-og.ts       # 빌드 전 satori → public/og/petbti/*.png
db/schema.sql                # petbti_responses + 인덱스 2
public/og/petbti/{EGA…CPI}.png
삭제: features/petbti/firebase.ts, PetBtiClient.tsx(ssr:false 래퍼),
      package.json firebase·html2canvas·html-to-image
```

## ⑤ 출처 (대표)
- OpenNext: opennext.js.org/cloudflare(+/caching, /cli), github opennextjs-cloudflare releases(1.19.2 Next16.2.3+, 1.19.4 useOg), issues/1157·1211·1220, og.test.ts, static-assets-incremental-cache 예제
- Cloudflare: developers.cloudflare.com/workers/platform/limits, /d1/platform/{pricing,limits}, /d1/best-practices/use-indexes, /r2/pricing
- Next/satori: nextjs.org/.../opengraph-image, /guides/third-party-libraries, github vercel/satori, kvnang/workers-og, dev.to/mitsuashi(CJK 빌드타임)
- 캡처: github zumerlab/snapdom, dev.to/tinchox5 벤치, bubkoo/html-to-image issues 361·461·488
- Kakao/GA4: developers.kakao.com/.../javascript/getting-started, /kakaotalk-share/js-link, apis.map.kakao.com/web/guide, firebase.google.com/docs/analytics/web/get-started, developers.google.com/tag-platform/gtagjs/routing
