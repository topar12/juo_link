# 주멍이 유형별 일러스트 (16종, .webp)

멍BTI 결과 카드(`ResultCard`/`StoryCard`)와 OG 이미지(`scripts/generate-og.mjs`)가
**모두 이 폴더의 `{유형코드}.webp`**를 읽는다. 파일이 없으면 유형 컬러 플레이스홀더로 자동 폴백(안 깨짐).

## 채우는 법 (작업툴 산출물 → 자동 변환)
1. 프롬프트 시트로 생성: `docs/superpowers/specs/2026-06-10-petbti-jumeong-prompts.md`
   (공통 STYLE + 유형별 SCENE + 🐱 주냥이 카메오 5컷. 주멍이 = `THIS DOG CHARACTER`로 첨부)
2. 산출물을 `{유형코드}.jpeg`(또는 png)로 저장 → **레포 부모 폴더 `D:\a_linkinbio`**에 드롭
3. 변환:
   ```
   node scripts/import-jumeong.mjs   # {코드}.jpeg → 이 폴더의 {코드}.webp (1024 cap, q82)
   npm run og                        # 주멍이 합성 OG(public/og/petbti/*.png) 재생성
   ```
   런타임 카드는 즉시 새 webp 사용(별도 빌드 불필요), OG만 위 명령으로 재생성.

## 16개 코드
```
ESBG ESBP ESTG ESTP ERBG ERBP ERTG ERTP
CSBG CSBP CSTG CSTP CRBG CRBP CRTG CRTP
```
**진행: 12/16 완료. 남은 4 = CSTP · CRBG · CRTG · CRTP** (개선판 프롬프트로 재생성 예정).
