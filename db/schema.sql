-- 멍BTI 결과 유형별 집계 (Firestore stats/meong-bti 대체)
CREATE TABLE IF NOT EXISTS petbti_stats (
  type_code TEXT PRIMARY KEY,
  count     INTEGER NOT NULL DEFAULT 0
);

-- 8개 유형 시드 (없을 때만)
INSERT OR IGNORE INTO petbti_stats (type_code, count) VALUES
  ('EGA', 0), ('EGI', 0), ('EPI', 0), ('EPA', 0),
  ('CGA', 0), ('CGI', 0), ('CPA', 0), ('CPI', 0);

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
