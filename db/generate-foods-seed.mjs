// foodSafety.json → db/seed-foods.sql 생성 스크립트
// 실행: node db/generate-foods-seed.mjs
// 항목당 INSERT OR REPLACE 한 줄. 텍스트의 작은따옴표는 '' 로 이스케이프하고,
// aliases 는 JSON 문자열로, emoji/note 누락 시 NULL, updated_at 은 0 으로 둔다.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "..", "src", "data", "foodSafety.json");
const OUT = join(__dirname, "seed-foods.sql");

/** SQL 문자열 리터럴: 작은따옴표 이스케이프 후 양끝에 ' 부착 */
function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

/** 값이 있으면 SQL 문자열, 없으면 NULL */
function sqlStringOrNull(value) {
  if (value === undefined || value === null || value === "") return "NULL";
  return sqlString(value);
}

const items = JSON.parse(readFileSync(SRC, "utf8"));

const lines = [
  "-- 자동 생성 파일 — 직접 수정 금지. `node db/generate-foods-seed.mjs` 로 재생성.",
  "-- 원본: src/data/foodSafety.json",
  "",
];

for (const item of items) {
  const id = sqlString(item.id);
  const name = sqlString(item.name);
  const aliases = sqlString(JSON.stringify(Array.isArray(item.aliases) ? item.aliases : []));
  const emoji = sqlStringOrNull(item.emoji);
  const verdict = sqlString(item.verdict);
  const reason = sqlString(item.reason);
  const note = sqlStringOrNull(item.note);
  lines.push(
    `INSERT OR REPLACE INTO foods (id,name,aliases,emoji,verdict,reason,note,updated_at) VALUES (${id},${name},${aliases},${emoji},${verdict},${reason},${note},0);`
  );
}

lines.push("");
writeFileSync(OUT, lines.join("\n"), "utf8");

const insertCount = lines.filter((l) => l.startsWith("INSERT OR REPLACE")).length;
console.log(`Wrote ${OUT}`);
console.log(`INSERT count: ${insertCount}`);
