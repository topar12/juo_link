// 멍BTI 4축 16유형 — 공유 계약(콘텐츠·화면·OG·데이터·admin 이 모두 import).
// 축 순서 = 코드 글자 순서: 에너지(E/C) · 사회성(S/R) · 대담함(B/T) · 식탐(G/P).

export const AXES = [
  { key: "energy",   poles: { first: "E", second: "C" }, label: "에너지",   left: "활발", right: "차분" },
  { key: "social",   poles: { first: "S", second: "R" }, label: "사회성",   left: "사교", right: "낯가림" },
  { key: "bold",     poles: { first: "B", second: "T" }, label: "대담함",   left: "대담", right: "신중" },
  { key: "appetite", poles: { first: "G", second: "P" }, label: "식탐",     left: "식탐", right: "까탈" },
] as const;

export type AxisKey = (typeof AXES)[number]["key"];
export type Pole = "E" | "C" | "S" | "R" | "B" | "T" | "G" | "P";

export const PET_TYPE_CODES = [
  "ESBG", "ESBP", "ESTG", "ESTP", "ERBG", "ERBP", "ERTG", "ERTP",
  "CSBG", "CSBP", "CSTG", "CSTP", "CRBG", "CRBP", "CRTG", "CRTP",
] as const;
export type PetTypeCode = (typeof PET_TYPE_CODES)[number];

export interface TypeMeta {
  code: PetTypeCode;
  nickname: string;           // 별명
  catchphrase: string;        // 한 줄 캐치프레이즈
  description: string;        // 장면묘사→강점→긍정변환 (브랜드 담백 톤)
  traits: string[];           // ["활발","사교","대담","식탐"]
  color: string;              // 유형 액센트 #RRGGBB
  recommendedProduct: string; // D1 미설정 시 폴백 추천
  soulmate: PetTypeCode;      // 찰떡 = 에너지·대담함 반대
  clash: PetTypeCode;         // 상극 = 4글자 정반대
}

const FLIP: Record<Pole, Pole> = {
  E: "C", C: "E", S: "R", R: "S", B: "T", T: "B", G: "P", P: "G",
};

/** 지정 위치의 극을 뒤집어 다른 유형 코드를 만든다 (16개 조합은 모두 유효 코드). */
function flipAt(code: string, positions: number[]): PetTypeCode {
  const chars = code.split("");
  for (const p of positions) chars[p] = FLIP[chars[p] as Pole];
  return chars.join("") as PetTypeCode;
}

function traitsOf(code: string): string[] {
  return [
    code[0] === "E" ? "활발" : "차분",
    code[1] === "S" ? "사교" : "낯가림",
    code[2] === "B" ? "대담" : "신중",
    code[3] === "G" ? "식탐" : "까탈",
  ];
}

type TypeSeed = Pick<TypeMeta, "nickname" | "catchphrase" | "description" | "color" | "recommendedProduct">;

const SEEDS: Record<PetTypeCode, TypeSeed> = {
  ESBG: {
    nickname: "인싸 먹보 모험왕",
    catchphrase: "어디서든 신나는, 못 먹는 게 없는 에너지 폭발 모험가",
    description:
      "공원에 도착하면 친구든 간식이든 일단 돌진! 활동량도 식탐도 만렙이라 한시도 가만있질 않아요. 넘치는 에너지를 든든하게 씹을 거리로 풀어주면, 세상 행복한 인싸가 됩니다.",
    color: "#E8552E",
    recommendedProduct: "우족 슬라이스",
  },
  ESBP: {
    nickname: "프로 인싸 미식가",
    catchphrase: "사람은 다 좋지만 입맛만은 깐깐한 사교계 미식가",
    description:
      "친구들과 어울리는 건 세상 좋아하면서도, 간식 앞에선 냄새부터 꼼꼼히 평가하는 반전 매력. 까다로운 게 아니라 좋은 걸 알아보는 거예요. 기호성 좋은 한 입이면 단번에 마음을 엽니다.",
    color: "#E08A3C",
    recommendedProduct: "닭가슴살 육포",
  },
  ESTG: {
    nickname: "조심성 먹보 마당발",
    catchphrase: "친구는 많지만 새것 앞에선 신중한, 잘 먹는 마당발",
    description:
      "사람 많은 자리를 좋아하고 뭐든 잘 먹지만, 처음 보는 간식은 고개를 갸웃하며 살펴봐요. 신중함은 똑똑함의 다른 말이에요. 익숙해지면 누구보다 맛있게, 복스럽게 즐깁니다.",
    color: "#6FA85B",
    recommendedProduct: "오리 날개",
  },
  ESTP: {
    nickname: "예민한 분위기메이커",
    catchphrase: "모임의 중심이지만 섬세한 입맛을 가진 까칠 매력러",
    description:
      "어딜 가나 분위기를 띄우는 사교왕이면서, 낯선 간식엔 눈썹부터 찡긋. 예민함은 그만큼 섬세하다는 뜻이에요. 취향만 맞으면 가장 신나게 즐기는 반전 매력의 소유자예요.",
    color: "#4FA3A0",
    recommendedProduct: "동결건조 간식",
  },
  ERBG: {
    nickname: "우리집 파괴왕 먹보",
    catchphrase: "밖에선 새침, 집에선 폭발하는 에너지 파괴왕",
    description:
      "보호자가 없을 때 쿠션을 잘근잘근 — 넘치는 에너지와 식탐을 '오래 씹기'로 풀어야 직성이 풀리는 터프가이예요. 낯선 사람 앞에선 의외로 새침. 파괴는 못된 게 아니라 에너지가 갈 곳을 찾는 신호라, 든든히 씹을 거리만 있으면 천사가 돼요.",
    color: "#D94833",
    recommendedProduct: "우족 슬라이스",
  },
  ERBP: {
    nickname: "집에서만 용감한 까칠가이",
    catchphrase: "집에선 대장, 밖에선 새침, 입맛까지 까다로운 반전왕",
    description:
      "내 영역에선 장난감도 소파도 다 정복하는 대담함을 뽐내지만, 손님이 오면 슬쩍 거리를 둬요. 평범한 간식엔 콧대를 세우는 미식가. 마음에 드는 한 입을 찾아주면 누구보다 든든한 내 편이 됩니다.",
    color: "#C05A4D",
    recommendedProduct: "닭가슴살 육포",
  },
  ERTG: {
    nickname: "소심한 에너지 먹보",
    catchphrase: "집에선 우다다, 새 자극엔 멈칫하는 사랑스러운 겁쟁이 먹보",
    description:
      "집에서는 누구보다 활발하게 뛰놀다가도 초인종 소리에 잠깐 멈칫. 그래도 간식 앞에서는 다시 적극적이에요. 조심성은 자기를 지키는 지혜예요. 안전하다고 느끼면 에너지가 폭발합니다.",
    color: "#7E9A57",
    recommendedProduct: "오리 도가니",
  },
  ERTP: {
    nickname: "예민한 집순이 댕댕",
    catchphrase: "낯선 건 다 조심스러운, 섬세하고 사랑스러운 집순이",
    description:
      "방석 위가 제일 편한 집순이. 활발하면서도 낯선 사람·소리·간식엔 늘 신중하게 살펴요. 예민함은 그만큼 마음이 깊다는 것. 익숙한 환경과 저자극 간식이면 가장 편안해집니다.",
    color: "#8E7CC3",
    recommendedProduct: "캥거루 꼬리뼈",
  },
  CSBG: {
    nickname: "느긋한 인싸 대식가",
    catchphrase: "서두르지 않아도 다 친구, 뭐든 잘 먹는 여유로운 대식가",
    description:
      "카페 소파에 느긋하게 앉아 오는 사람마다 반기는 여유만점 인싸. 활동은 차분해도 식탐만은 일등이에요. 서두르지 않는 성격이라 오래 씹는 간식 하나면 한참을 행복하게 보냅니다.",
    color: "#E0A35E",
    recommendedProduct: "양 목뼈",
  },
  CSBP: {
    nickname: "여유로운 미식 신사",
    catchphrase: "우아하게 손님을 맞고, 좋은 것만 음미하는 신사",
    description:
      "느긋하고 다정하게 손님을 반기면서도, 간식은 좋은 것만 골라 음미하는 품격파. 까다로움은 안목의 다른 이름이에요. 특별한 한 조각을 차려주면 신사답게 천천히 즐깁니다.",
    color: "#D98BA0",
    recommendedProduct: "수제 베이커리",
  },
  CSTG: {
    nickname: "온순한 먹보 친구",
    catchphrase: "다정하고 차분한, 새것엔 신중하지만 잘 먹는 순둥이",
    description:
      "사람 곁에서 차분하게 머무는 다정한 순둥이. 처음 보는 건 신중하게 살핀 뒤 잘 먹어요. 느긋함과 식탐이 만나 누구와도 편안하게 지내는, 같이 있으면 마음이 놓이는 친구예요.",
    color: "#9DB17C",
    recommendedProduct: "돼지귀 슬라이스",
  },
  CSTP: {
    nickname: "다정한 까탈 선비",
    catchphrase: "차분하고 사교적이지만 입맛만은 선비인 깐깐 다정러",
    description:
      "곁을 잘 내주는 다정한 성격이면서도, 간식만은 꼼꼼히 음미하는 선비 기질. 까탈은 섬세한 취향의 증거예요. 마음에 드는 한 입을 만나면 조용히, 그러나 확실하게 만족합니다.",
    color: "#7AA0B8",
    recommendedProduct: "동결건조 간식",
  },
  CRBG: {
    nickname: "마이웨이 먹보 대장",
    catchphrase: "혼자서도 당당한, 큰 간식도 거뜬한 독립 대장",
    description:
      "누가 없어도 의젓하게 자기 시간을 즐기는 독립견. 대담하고 식탐도 좋아서 큰 간식도 혼자 거뜬히 정복해요. 마이웨이는 자신감의 표현이에요. 든든한 씹을 거리 하나면 더없이 만족합니다.",
    color: "#B5743F",
    recommendedProduct: "우족 슬라이스",
  },
  CRBP: {
    nickname: "도도한 1인 미식가",
    catchphrase: "혼자가 편하고, 좋은 것만 아는 도도한 미식가",
    description:
      "혼자만의 시간을 우아하게 즐기는 도도파. 대담하게 자기 취향을 지키며 좋은 간식만 골라 먹어요. 까다로움은 품격이에요. 기호성 좋은 한 입이면 도도한 마음도 사르르 풀립니다.",
    color: "#B0728E",
    recommendedProduct: "닭가슴살 육포",
  },
  CRTG: {
    nickname: "조용한 먹보 선비",
    catchphrase: "조용한 코너에서 혼자, 그러나 복스럽게 즐기는 선비",
    description:
      "시끌벅적함보다 조용한 자리를 좋아하는 의젓한 선비. 낯선 건 신중히 살피지만 익숙해지면 복스럽게 잘 먹어요. 차분함은 깊이의 증거예요. 오래 음미할 간식 하나면 평온하게 만족합니다.",
    color: "#8B8C81",
    recommendedProduct: "양 목뼈",
  },
  CRTP: {
    nickname: "고독한 미식 황제",
    catchphrase: "아무거나 먹지 않개, 최고만 허락하는 1인 미식 황제",
    description:
      "방석 위에서 느긋하게, 혼자만의 시간을 즐기는 황제마마. 낯선 식감엔 냄새만 맡고 돌아서는 확고한 기준이 있어요. 까다로운 게 아니라 좋은 걸 알아보는 거예요 — 순수 육즙의 기호성 만점 간식이면 단번에 마음을 엽니다.",
    color: "#5D7A8C",
    recommendedProduct: "닭가슴살 육포",
  },
};

export const PET_TYPES: Record<PetTypeCode, TypeMeta> = Object.fromEntries(
  PET_TYPE_CODES.map((code) => {
    const seed = SEEDS[code];
    const meta: TypeMeta = {
      code,
      ...seed,
      traits: traitsOf(code),
      soulmate: flipAt(code, [0, 2]),
      clash: flipAt(code, [0, 1, 2, 3]),
    };
    return [code, meta];
  })
) as Record<PetTypeCode, TypeMeta>;
