# 주멍이 유형별 일러스트 (16종)

멍BTI 결과 카드(`ResultCard`/`StoryCard`)와 OG 이미지(`scripts/generate-og.mjs`)가
**모두 이 폴더**에서 주멍이 일러스트를 읽는다. 여기 한 곳에만 넣으면 된다.

## 파일명 규칙
`{유형코드}.png` — 16개:

```
ESBG ESBP ESTG ESTP ERBG ERBP ERTG ERTP
CSBG CSBP CSTG CSTP CRBG CRBP CRTG CRTP
```

- 권장: 정사각(예: 1024×1024) PNG, 배경 투명 또는 파스텔. 카드는 `object-cover`, OG는 `contain` 합성.
- 파일이 없으면 카드·OG 모두 유형 컬러 플레이스홀더로 자동 폴백(안 깨짐).

## 생성 방법
**프롬프트 시트(첨부용)**: `docs/superpowers/specs/2026-06-10-petbti-jumeong-prompts.md`
— 공통 STYLE 프리픽스 + 유형별 SCENE 16개 + 🐱 주냥이 카메오 마킹(ESBG·ESBP·CSBG·CSBP·CSTG).
작업툴에 주멍이를 `THIS DOG CHARACTER`로(카메오 컷은 주냥이를 `THIS CAT CHARACTER`로도) 첨부해 사용.

## 드롭 후
```
npm run og    # 주멍이를 합성해 public/og/petbti/*.png 재생성
```
그리고 커밋. (런타임 카드는 즉시 새 PNG를 사용 — 별도 빌드 불필요)
