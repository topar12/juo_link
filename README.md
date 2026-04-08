# 주오 링크인바이오 웹

주오 브랜드용 모바일 링크인바이오 페이지입니다.  
Next.js App Router 기반으로 구성되어 있으며, 추천 상품, 이벤트, 브랜드 네트워크, 매장 찾기 기능을 포함합니다.

## 주요 기능

- 추천 상품 카드와 공식몰 CTA
- 멍BTI 이벤트 카드
- Juo Company 계열사 카드
- 카카오맵 기반 매장 찾기 시트
- 카테고리 필터와 검색
- 직영 매장 우선 노출 및 직영 배지 표시

## 기술 스택

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Phosphor Icons

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 열면 확인할 수 있습니다.

## 환경 변수

카카오맵을 사용하려면 `.env.local` 파일에 아래 값을 설정합니다.

```env
NEXT_PUBLIC_KAKAO_MAP_APP_KEY=YOUR_KAKAO_JAVASCRIPT_KEY
```

추가로 카카오 디벨로퍼 콘솔에서 아래 도메인을 등록해야 지도가 정상 노출됩니다.

- `http://localhost:3000`
- 실제 배포 도메인

## 주요 파일 구조

```text
src/
  app/
    layout.tsx
    page.tsx
    globals.css
    icon.svg
  components/
    IntroAnimation.tsx
    StoreFinderSheet.tsx
  data/
    storeLocations.json
public/
  images/
```

## 매장 데이터 수정

매장찾기 데이터는 아래 파일 하나만 관리하면 됩니다.

- [`src/data/storeLocations.json`](./src/data/storeLocations.json)

수정 가능한 주요 값:

- `name`
- `category`
- `rawCategory`
- `address`
- `lat`
- `lng`

주의:

- `lat`, `lng`는 화면에 직접 표시되지 않고 카카오맵 핀 위치 계산에만 사용됩니다.
- `id`는 내부 식별자이므로 중간 항목을 삭제해도 다른 `id`를 다시 맞출 필요는 없습니다.

## 빌드

```bash
npm run lint
npm run build
```

## 운영 메모

- 직영 매장은 이름에 `요미독`, `요미캣`, `사랑해주오`, `치료해주오`가 포함된 경우로 판별합니다.
- 직영 매장은 리스트에서 우선 노출되며, 지도 핀도 브랜드 코랄 색상으로 유지됩니다.
- 복합 카테고리 매장은 리스트에서 여러 카테고리 배지로 표시됩니다.
