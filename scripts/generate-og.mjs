// 멍BTI OG 이미지 빌드타임 합성 (워크스트림 C / Task C1)
//
// 유형별 1200×630 OG 이미지 16장을 public/og/petbti/{CODE}.png 로 생성한다.
// sharp 는 빌드 머신에서만 실행 — Cloudflare 워커 번들과 무관(devDependency).
//
// 레이아웃:
//   - 배경 #FDFCF8
//   - 좌측 14px 유형 컬러 바
//   - 좌측 440×440 비주얼 슬롯:
//       · public/images/petbti/jumeong/{CODE}.png 가 있으면 contain 합성 (주멍이 일러스트)
//       · 없으면 유형 컬러 + "33" 알파 색블록(플레이스홀더)
//   - 우측 텍스트: 유형 CODE + 영문 브랜드마크
//
// ⚠️ 한글 폰트 주의 ─────────────────────────────────────────────────────────
//   sharp 가 SVG <text> 를 래스터화할 때 시스템에 설치된 한글 폰트가 없으면
//   글자가 통째로 누락(빈칸)된다. 빌드 환경(CI/로컬)마다 한글 폰트 유무가
//   달라 결과가 불안정하므로, 플레이스홀더 단계에서는 ASCII(유형 CODE +
//   영문 브랜드마크)만 렌더한다.
//   한글 nickname 은 og-data.json 에 보관만 하고, 실제 주멍이 에셋이 도착해
//   폰트 임베드(@font-face 로 Noto Sans KR 서브셋 인라인 또는 satori 전환)가
//   확실해지는 단계에서 우측 텍스트에 추가한다. ↓ "한글 nickname 추가 지점"
//   주석 참고.
// ───────────────────────────────────────────────────────────────────────────

import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPT_DIR, "..");

const CODES = [
  "ESBG", "ESBP", "ESTG", "ESTP", "ERBG", "ERBP", "ERTG", "ERTP",
  "CSBG", "CSBP", "CSTG", "CSTP", "CRBG", "CRBP", "CRTG", "CRTP",
];

const META = JSON.parse(
  await readFile(join(SCRIPT_DIR, "og-data.json"), "utf8"),
);

const W = 1200;
const H = 630;
const BG = "#FDFCF8";
const BAR_W = 14;
const SLOT = 440; // 비주얼 슬롯 한 변
const SLOT_TOP = (H - SLOT) / 2; // 95 → 세로 중앙
const SLOT_LEFT = 70;
const TEXT_X = SLOT_LEFT + SLOT + 50; // 우측 텍스트 기준선

const outDir = join(ROOT, "public", "og", "petbti");
await mkdir(outDir, { recursive: true });

let composited = 0;
let placeholders = 0;

for (const code of CODES) {
  const entry = META[code];
  if (!entry) {
    throw new Error(`og-data.json 에 ${code} 항목이 없습니다.`);
  }
  const { color } = entry;

  // 런타임 카드(ResultCard/StoryCard)와 동일 경로 — 주멍이 PNG 드롭 위치를 한 곳으로 통일.
  const dogPath = join(ROOT, "public", "images", "petbti", "jumeong", `${code}.png`);
  const hasDog = existsSync(dogPath);

  const slot = hasDog
    ? await sharp(dogPath)
        .resize(SLOT, SLOT, { fit: "contain", background: "#ffffff00" })
        .png()
        .toBuffer()
    : await sharp({
        create: {
          width: SLOT,
          height: SLOT,
          channels: 4,
          background: color + "33", // 유형 컬러 + 알파(플레이스홀더 색블록)
        },
      })
        .png()
        .toBuffer();

  // ASCII 전용 텍스트 레이어. 한글은 폰트 미보장으로 의도적으로 제외.
  // 한글 nickname 추가 지점: 실제 주멍이 에셋 + 폰트 임베드 단계에서
  //   <text x="${TEXT_X}" y="..." ...>${escapeXml(META[code].nickname)}</text>
  // 를 아래 <text> 들 사이에 삽입(폰트는 @font-face 로 인라인 임베드).
  const svg = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${W}" height="${H}" fill="${BG}"/>
      <rect x="0" y="0" width="${BAR_W}" height="${H}" fill="${color}"/>
      <text x="${TEXT_X}" y="300" font-family="Arial, Helvetica, sans-serif" font-size="120" font-weight="800" letter-spacing="6" fill="${color}">${escapeXml(code)}</text>
      <text x="${TEXT_X}" y="370" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" letter-spacing="2" fill="#2B2B2B">MEONG-BTI</text>
      <text x="${TEXT_X}" y="412" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="500" letter-spacing="1" fill="#888888">MEONG-BTI &#183; PETFOOD JUO</text>
    </svg>`,
  );

  await sharp({
    create: { width: W, height: H, channels: 4, background: BG },
  })
    .composite([
      { input: slot, top: Math.round(SLOT_TOP), left: SLOT_LEFT },
      { input: svg, top: 0, left: 0 },
    ])
    .png()
    .toFile(join(outDir, `${code}.png`));

  if (hasDog) composited++;
  else placeholders++;
  console.log(`og: ${code} ${hasDog ? "(주멍이 합성)" : "(placeholder)"}`);
}

console.log(
  `\n✓ OG ${CODES.length}장 생성 완료 → public/og/petbti/  (주멍이 ${composited} · placeholder ${placeholders})`,
);

/** SVG 텍스트 노드에 안전하게 넣기 위한 최소 XML 이스케이프. */
function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
