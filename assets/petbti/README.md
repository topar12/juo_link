# 멍BTI 주멍이 일러스트 에셋

빌드타임 OG 이미지(`public/og/petbti/{CODE}.png`, 1200×630)의 좌측 비주얼 슬롯에
합성되는 유형별 주멍이 일러스트를 보관하는 디렉토리.

## 파일명 규칙

```
assets/petbti/jumeong/{CODE}.png
```

- `{CODE}` = 4글자 유형 코드 (16종):

  ```
  ESBG  ESBP  ESTG  ESTP
  ERBG  ERBP  ERTG  ERTP
  CSBG  CSBP  CSTG  CSTP
  CRBG  CRBP  CRTG  CRTP
  ```

- 포맷: PNG, 투명 배경 권장(슬롯에 `fit: contain` + 투명 배경으로 합성됨).
- 권장 해상도: 한 변 ≥ 440px 정사각(슬롯이 440×440). 더 크면 빌드 시 contain 축소됨.

## 파이프라인

- 생성 스크립트: `scripts/generate-og.mjs` (npm 스크립트 `npm run og`).
- 에셋이 **있으면** 좌측 440×440 슬롯에 contain 합성.
- 에셋이 **없으면** 유형 컬러(+알파) 플레이스홀더 색블록으로 폴백 →
  에셋 도착 전에도 16장 OG 가 정상 생성된다.

## 이미지 프롬프트

각 유형의 주멍이 일러스트 생성 프롬프트는 승인 스펙 **§5 (16개 이미지 프롬프트)** 참조:
`docs/superpowers/specs/2026-06-10-petbti-rebuild-design.md`

> 주냥이(고양이 마스코트) 카메오도 동일하게 이 슬롯 규칙(`{CODE}.png`)으로 처리한다.

## 한글 폰트 메모

현재 `generate-og.mjs` 는 OG 우측 텍스트를 ASCII(유형 코드 + 영문 브랜드마크)로만
렌더한다. 한글 nickname(`scripts/og-data.json` 에 보관)은 sharp 의 SVG 텍스트가
시스템 한글 폰트 없이는 깨지므로, 주멍이 에셋 + 폰트 임베드 단계에서 추가한다.
