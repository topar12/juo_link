// 주멍이 유형별 일러스트 import — 소스 폴더의 {CODE}.{jpeg,jpg,png,webp} 를
// public/images/petbti/jumeong/{CODE}.webp 로 최적화 변환(공유 도구라 용량 최소화).
//
// 사용:  node scripts/import-jumeong.mjs [소스폴더]
//   소스폴더 기본값 = 레포 부모(D:\a_linkinbio). 작업툴 산출물을 거기 두면 됨.
// 변환 후:  npm run og   (주멍이 합성 OG 재생성)

import sharp from "sharp";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPT_DIR, "..");
const SRC = process.argv[2] ?? join(ROOT, ".."); // 기본: 레포 부모 폴더
const OUT = join(ROOT, "public", "images", "petbti", "jumeong");

const CODES = [
  "ESBG", "ESBP", "ESTG", "ESTP", "ERBG", "ERBP", "ERTG", "ERTP",
  "CSBG", "CSBP", "CSTG", "CSTP", "CRBG", "CRBP", "CRTG", "CRTP",
];
const EXTS = [".jpeg", ".jpg", ".png", ".webp", ".JPEG", ".JPG", ".PNG"];

await mkdir(OUT, { recursive: true });

let done = 0;
const missing = [];
for (const code of CODES) {
  const src = EXTS.map((e) => join(SRC, code + e)).find((p) => existsSync(p));
  if (!src) {
    missing.push(code);
    continue;
  }
  await sharp(src)
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(join(OUT, `${code}.webp`));
  done++;
  console.log(`jumeong: ${code}  <-  ${basename(src)}`);
}

console.log(
  `\n✓ ${done}/16 변환 → public/images/petbti/jumeong/*.webp` +
    (missing.length ? `  (미보유 ${missing.length}: ${missing.join(", ")})` : "  (전부 완료)")
);
