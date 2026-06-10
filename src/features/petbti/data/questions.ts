export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  question: string;
  options: Option[];
}

export const questions: Question[] = [
  {
    id: 'q1',
    question: "평소 우리 아이의\n산책 스타일은 어떤가요?",
    options: [
      { id: 'E', text: "더 뛰자고 난리!\n1시간을 뛰어도 지치지 않아요." },
      { id: 'C', text: "조금 걷다가 안아달라고 하거나,\n느긋하게 냄새만 킁킁 맡아요." }
    ]
  },
  {
    id: 'q2',
    question: "집 안에서의\n일상적인 모습은 어때요?",
    options: [
      { id: 'E', text: "우다다다!\n장난감을 물고 오거나 끊임없이 움직여요." },
      { id: 'C', text: "방석이나 소파 위에서 뒹굴뒹굴,\n주로 누워있어요." }
    ]
  },
  {
    id: 'q3',
    question: "새로운 간식을 줬을 때\n우리 아이의 반응은?",
    options: [
      { id: 'G', text: "일단 입으로 직행!\n씹은 건지 삼킨 건지 1초 만에 순삭해요." },
      { id: 'P', text: "냄새부터 꼼꼼히 킁킁!\n입맛에 안 맞으면 과감히 뱉어버려요." }
    ]
  },
  {
    id: 'q4',
    question: "평소 밥(사료)을 먹는\n속도는 어느 정도인가요?",
    options: [
      { id: 'G', text: "청소기처럼 순식간에\n밥그릇을 싹 비워버려요." },
      { id: 'P', text: "한 알씩 꼭꼭 씹어 먹거나,\n배고플 때만 조금씩 먹어요." }
    ]
  },
  {
    id: 'q5',
    question: "보호자가 외출 준비를 할 때,\n우리 아이의 행동은?",
    options: [
      { id: 'I', text: "자신의 방석에 누워있거나\n덤덤하게 바라봐요." },
      { id: 'A', text: "외출하는지 불안하게 눈치를 보며\n낑낑대거나 물건을 뜯어요." }
    ]
  },
  {
    id: 'q6',
    question: "보호자의 스킨십을\n대하는 태도는?",
    options: [
      { id: 'I', text: "내가 원할 때만!\n평소엔 조금 떨어져서 쉬는 걸 좋아해요." },
      { id: 'A', text: "보호자 껌딱지!\n항상 몸을 기대고 만져달라고 조르는 편이에요." }
    ]
  },
  {
    id: 'q7', // Bonus Weight Question
    question: "간식을 먹을 때\n가장 선호하는 방식은?",
    options: [
      { id: 'B_BONE', text: "단단한 뼈나 껌을 오랫동안 질겅질겅\n씹으며 스트레스 풀기!" },
      { id: 'B_MEAT', text: "부드럽고 쫀득하게,\n고기의 풍미와 건강 챙기기!" }
    ]
  }
];

export const calculateResult = (answers: Record<string, string>): string => {
  // Score mapping + bonus weight
  const eScore = (answers.q1 === 'E' ? 1 : 0) + (answers.q2 === 'E' ? 1 : 0) + (answers.q7 === 'B_BONE' ? 0.5 : -0.5);
  const gScore = (answers.q3 === 'G' ? 1 : 0) + (answers.q4 === 'G' ? 1 : 0) + (answers.q7 === 'B_BONE' ? 0.5 : -0.5);
  const aScore = (answers.q5 === 'A' ? 1 : 0) + (answers.q6 === 'A' ? 1 : 0) + (answers.q7 === 'B_BONE' ? 0.5 : -0.5);

  const traitE = eScore > 1 ? 'E' : 'C'; // E >= 1.5 defaults to Energetic
  const traitG = gScore > 1 ? 'G' : 'P';
  const traitA = aScore > 1 ? 'A' : 'I';

  const combo = `${traitE}${traitG}${traitA}`;

  if (combo === 'EGA') return 'result1'; // 우족 슬라이스
  if (combo === 'EGI') return 'result2'; // 오리 도가니
  if (combo === 'EPI') return 'result3'; // 캥거루 꼬리뼈 (독립)
  if (combo === 'EPA') return 'result8'; // 캥거루 꼬리뼈 (불안)
  if (combo === 'CGA') return 'result4'; // 돼지귀 슬라이스
  if (combo === 'CGI') return 'result5'; // 양 목뼈
  if (combo === 'CPA') return 'result6'; // 오리 날개
  if (combo === 'CPI') return 'result7'; // 닭가슴살 육포

  return 'result7';
};

export const resultsData: Record<string, {title: string, behaviorAnalysis: string, recommendedProduct: string, productReason: string, bgColor: string, type: string}> = {
  result1: {
    title: '극대노 파괴왕 불도저',
    behaviorAnalysis: '넘치는 에너지와 강한 식탐! 보호자가 없을 땐 집안 물건을 잘근잘근 뜯어놓을 위험이 있는 매우 높은 활동성 및 약간의 불안도를 가진 아이군요. 무언가를 오랫동안 파괴하고 씹는 원초적인 행위를 통해 스트레스를 강력하게 해소해야만 하는 본능적인 터프가이 기질입니다.',
    recommendedProduct: '우족 슬라이스',
    productReason: '입에 쏙 들어가는 어설픈 크기의 간식은 덩어리째 통삼킬 위험이 있습니다. 며칠 동안 안전하게 붙잡고 강력하게 씹으면서 파괴 에너지를 완벽히 타파할 수 있는 초거대, 초강력 뼈대 "우족 슬라이스" 솔루션이 시급합니다!',
    bgColor: '#D94833', // Crimson/Terracotta
    type: 'E - G - A 형'
  },
  result2: {
    title: '무한점프 관절 브레이커',
    behaviorAnalysis: '소파를 쉴 새 없이 오르내리고 뛰어다니는 초긍정 에너자이저! 무한 긍정의 밝은 성격이라 좋지만, 과도한 점프와 활동량 탓에 보이지 않는 곳에서 슬개골과 뼈관절이 매일 혹사당하고 있을 확률이 매우 높은 편입니다.',
    recommendedProduct: '오리 도가니',
    productReason: '선천적인 관절 약화나 후천적 탈구를 예방하기 위해 콜라겐과 천연 콘드로이친 충전이 꼭 필요합니다. 쫀득쫀득 오랫동안 씹으며 연골 보약을 그대로 흡수할 수 있는 "오리 도가니"로 소중한 다리를 지켜주세요.',
    bgColor: '#E07A5F', // Warm Coral
    type: 'E - G - I 형'
  },
  result3: {
    title: '자기관리 끝판왕 헬스견',
    behaviorAnalysis: '날렵하고 활동량이 많아 고단백 식단이 필요하면서도, 알러지 반응이나 음식에 예민한 "초예민 보스" 철저한 자기관리형 강아지입니다. 혼자만의 시간을 가질 줄 아는 무던한 독립적인 성향까지 겸비했습니다.',
    recommendedProduct: '캥거루 꼬리뼈',
    productReason: '극강의 저지방 헬스 식단이면서도 멍멍이계의 낯선 식재료라 알러지 유발 확률이 현저히 낮은 청정 "캥거루 꼬리뼈" 고단백 코스 요리가 정답입니다. 날렵한 근육 천재를 위한 완벽한 치팅데이를 선물해 보세요.',
    bgColor: '#60795D', // Deep Sage
    type: 'E - P - I 형'
  },
  result4: {
    title: '보호자 껌딱지 방구석 요정',
    behaviorAnalysis: '야외에서 뛰는 산책보다는 따뜻한 집 방구석, 그중에서도 "보호자 무릎 위"가 세상에서 제일 좋은 집순이 요정! 활동량이 낮아 살이 찌기 쉬운데 약간의 분리불안까지 더해져 입을 오물거리며 보호자의 체취와 위안을 얻으려는 경향이 짙습니다.',
    recommendedProduct: '돼지귀 슬라이스',
    productReason: '위험하고 거대한 뼈보다는, 입안에서 부드럽고 쫀득하게 오래오래 불려서 씹을 수 있는 100% 콜라겐 덩어리 "돼지귀 슬라이스"가 최고의 위안템입니다. 체중 부담은 줄이고 꿀피부와 부드러운 모질까지 챙기세요!',
    bgColor: '#C88295', // Dusty Rose
    type: 'C - G - A 형'
  },
  result5: {
    title: '고독을 즐기는 선비견',
    behaviorAnalysis: '조용하고 의젓하게 스스로의 공간을 즐길 줄 아는 젠틀맨 강아지. 보호자를 극도로 귀찮게 하는 분리불안도 거의 없고, 평소 특별히 가리는 음식 없이 주는 대로 꼬박꼬박 맛있게 잘 먹는 타고난 우등생 타입입니다.',
    recommendedProduct: '양 목뼈',
    productReason: '거칠게 파괴해야 하는 거대한 통뼈 간식은 우아한 젠틀맨의 품격에 맞지 않습니다. 홈 덴탈 스파를 하듯 평온하게 자기 자리에 엎드려 살살 치석을 갉아먹기 딱 좋은 "양 목뼈"로 맛있는 매일 양치 시간을 만들어주세요.',
    bgColor: '#8B8C81', // Warm Olive/Taupe
    type: 'C - G - I 형'
  },
  result6: {
    title: '호기심 만렙 참견쟁이',
    behaviorAnalysis: '작은 소리나 바스락거림에도 귀를 쫑긋! 예민하고 궁금한 게 많아 눈동자가 바쁘게 돌아가는 깍쟁이 참견쟁이 타입입니다. 평범한 식감의 간식은 금방 싫증을 내기 쉬워 촉각과 미각 등을 동시에 자극하는 것이 중요합니다.',
    recommendedProduct: '오리 날개',
    productReason: '이런 아이에겐 밋밋한 살코기보단 "강아지용 ASMR"을 듣는 것처럼 씹을 때마다 뼈가 바삭바삭 부서지는 특별한 텍스처가 필요합니다. 억세지 않아 소형견도 부담 없이 재밌게 부숴 먹을 수 있는 "오리 날개"를 강력 추천합니다.',
    bgColor: '#D1AC00', // Ochre/Mustard
    type: 'C - P - A 형'
  },
  result7: {
    title: '대쪽같은 미식 황제',
    behaviorAnalysis: '"아무거나 먹지 않개!" 음식에 대한 고집과 기준이 대기권을 뚫어버리는 콧대 높은 1티어 미식가 황제마마! 거칠고 낯선 식감의 뼈나 이물감이 드는 저퀄리티 간식은 냄새만 맡고 과감하게 뱉어버리는 확고한 미식가입니다.',
    recommendedProduct: '닭가슴살 육포',
    productReason: '이런 오죽한 황제마마가 유일하게 허락하는 것은 오직 순수 육즙이 폭발하는 직관적인 고기 맛뿐입니다. 호불호가 절대 갈리지 않는 기호성 만점의 주오컴퍼니 넘버원 베스트셀러, 부드러운 무항생제 "닭가슴살 육포"를 즉시 대령하세요.',
    bgColor: '#5D7A8C', // Steel Blue
    type: 'C - P - I 형'
  },
  result8: {
    title: '에너제틱 프로 예민러',
    behaviorAnalysis: '활동 에너지가 넘치면서도 입맛은 까다롭고, 보호자와 잠시라도 떨어지면 낑낑대거나 불안해하는 호기심 많은 예민보스! 스트레스를 받으면 무언가를 끈질기게 씹으며 위안을 얻고자 하는 가장 세심한 맞춤 관리가 필요한 타입입니다.',
    recommendedProduct: '캥거루 꼬리뼈',
    productReason: '기존의 흔한 육포나 껌으로는 까다로운 입맛과 분리불안 스트레스를 동시에 잡을 수 없습니다. 피부 알러지 걱정 없는 깨끗한 특수 원육이자, 불안할 때 오랫동안 집요하게 씹을 수 있는 탄탄한 천연껌 "캥거루 꼬리뼈"가 유일한 해답입니다!',
    bgColor: '#B06A42', // Burnt Sienna
    type: 'E - P - A 형'
  }
};
