// storeLocations.json → db/seed-stores.sql 생성 스크립트
// 실행: node db/generate-stores-seed.mjs
// 항목당 INSERT OR REPLACE 한 줄. 텍스트의 작은따옴표는 '' 로 이스케이프하고,
// lat/lng 는 숫자라 따옴표 없이 그대로 넣으며, raw_category 누락 시 NULL, updated_at 은 0 으로 둔다.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "..", "src", "data", "storeLocations.json");
const OUT = join(__dirname, "seed-stores.sql");

/** SQL 문자열 리터럴: 작은따옴표 이스케이프 후 양끝에 ' 부착 */
function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

/** 값이 있으면 SQL 문자열, 없으면 NULL */
function sqlStringOrNull(value) {
  if (value === undefined || value === null || value === "") return "NULL";
  return sqlString(value);
}

/** 숫자 리터럴: 유한 숫자면 따옴표 없이 그대로, 아니면 던진다(시드 무결성 보장) */
function sqlNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`숫자가 아닌 좌표: ${JSON.stringify(value)}`);
  }
  return String(num);
}

const items = JSON.parse(readFileSync(SRC, "utf8"));

const lines = [
  "-- 자동 생성 파일 — 직접 수정 금지. `node db/generate-stores-seed.mjs` 로 재생성.",
  "-- 원본: src/data/storeLocations.json",
  "",
];

for (const item of items) {
  const id = sqlString(item.id);
  const name = sqlString(item.name);
  const category = sqlString(item.category);
  const rawCategory = sqlStringOrNull(item.rawCategory);
  const address = sqlString(item.address);
  const lat = sqlNumber(item.lat); // 숫자 — 따옴표 없이
  const lng = sqlNumber(item.lng); // 숫자 — 따옴표 없이
  lines.push(
    `INSERT OR REPLACE INTO stores (id,name,category,raw_category,address,lat,lng,updated_at) VALUES (${id},${name},${category},${rawCategory},${address},${lat},${lng},0);`
  );
}

lines.push("");
writeFileSync(OUT, lines.join("\n"), "utf8");

const insertCount = lines.filter((l) => l.startsWith("INSERT OR REPLACE")).length;
console.log(`Wrote ${OUT}`);
console.log(`INSERT count: ${insertCount}`);
