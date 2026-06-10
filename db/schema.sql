-- 멍BTI 결과 유형별 집계 (Firestore stats/meong-bti 대체)
CREATE TABLE IF NOT EXISTS petbti_stats (
  type_code TEXT PRIMARY KEY,
  count     INTEGER NOT NULL DEFAULT 0
);

-- 16개 유형 시드 (없을 때만) — 4축 16유형 리빌드
INSERT OR IGNORE INTO petbti_stats (type_code, count) VALUES
  ('ESBG',0),('ESBP',0),('ESTG',0),('ESTP',0),('ERBG',0),('ERBP',0),('ERTG',0),('ERTP',0),
  ('CSBG',0),('CSBP',0),('CSTG',0),('CSTP',0),('CRBG',0),('CRBP',0),('CRTG',0),('CRTP',0);

-- 멍BTI 원시 응답 로그 (문항 분포 분석용)
CREATE TABLE IF NOT EXISTS petbti_responses (
  id          TEXT PRIMARY KEY,
  result_type TEXT NOT NULL,
  answers     TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_petbti_responses_created ON petbti_responses(created_at);
CREATE INDEX IF NOT EXISTS idx_petbti_responses_type    ON petbti_responses(result_type);

-- 유형별 추천 제품 (미설정 시 types.ts 기본값으로 폴백, /admin 에서 편집)
CREATE TABLE IF NOT EXISTS petbti_products (
  type_code    TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  image_url    TEXT,
  reason       TEXT,
  shop_url     TEXT,
  updated_at   INTEGER NOT NULL DEFAULT 0
);

-- 음식 안전 데이터 (foodSafety.json 대체 단일 소스, /admin 에서 편집)
CREATE TABLE IF NOT EXISTS foods (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  aliases    TEXT NOT NULL DEFAULT '[]',  -- JSON array string
  emoji      TEXT,
  verdict    TEXT NOT NULL,               -- 'danger' | 'caution' | 'safe'
  reason     TEXT NOT NULL,
  note       TEXT,
  updated_at INTEGER NOT NULL DEFAULT 0
);

-- 매장(제휴처) 데이터 (storeLocations.json 대체 단일 소스, /admin 에서 편집)
CREATE TABLE IF NOT EXISTS stores (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  category     TEXT NOT NULL,             -- 병원|펫샵|미용|훈련|보호소|기타
  raw_category TEXT,                      -- 원본 스크랩 라벨(선택)
  address      TEXT NOT NULL,
  lat          REAL NOT NULL,
  lng          REAL NOT NULL,
  updated_at   INTEGER NOT NULL DEFAULT 0
);
