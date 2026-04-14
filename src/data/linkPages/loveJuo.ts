import type { LinkPageConfig } from "./types";

const rehomingHomepageUrl = "https://re-homing.org/";
const rehomingInstagramUrl = "https://www.instagram.com/lovejuo_rehome/";
const rehomingKakaoUrl = "https://pf.kakao.com/_ZUxgZX";
const petfoodHomepageUrl = "https://www.lovejuo.com/";
const petfoodInstagramUrl = "https://www.instagram.com/petfood.thejuo/";
const petfoodKakaoUrl = "http://pf.kakao.com/_xehxasn";
const hospitalHomepageUrl = "https://juohospital.imweb.me/";

export const loveJuoPage: LinkPageConfig = {
  slug: "lovejuo",
  analyticsPageId: "lovejuo",
  metadata: {
    title: "사랑해주오 | 리호밍센터 링크인바이오",
    description: "유기·파양 위기 아이들이 다시 가족을 만날 수 있도록 돕는 사랑해주오 리호밍센터입니다.",
  },
  theme: {
    accent: {
      50: "#f4f6ff",
      100: "#e7ecff",
      200: "#c4d0ff",
      300: "#91a6ff",
      400: "#4f70ff",
      500: "#002edb",
      600: "#0026b8",
      700: "#001f91",
      shadowSubtle: "rgba(0,46,219,0.16)",
      shadowSoft: "rgba(0,46,219,0.22)",
      shadowMedium: "rgba(0,46,219,0.3)",
      shadowStrong: "rgba(0,46,219,0.34)",
      shadowSolid: "rgba(0,46,219,1)",
    },
  },
  intro: {
    words: ["RESCUE.", "RE-HOMING.", "LOVE JUO."],
    accentWordIndex: 2,
    backgroundVideoSrc: "/videos/lovejuo_intro.mp4",
    videoDurationMs: 4000,
    videoStartFromEndMs: 4000,
    videoTitle: "사랑해주오\n리호밍센터",
    videoSubtitle: "다시 가족이 되는 길",
  },
  hero: {
    title: [
      { text: "다시," },
      { text: "집으로.", accent: true },
    ],
    description: [
      "가족이 되는 데 가격표는 필요 없습니다.",
    ],
    tags: ["입양 상담", "보호 아이 소식", "센터 문의"],
  },
  sections: [
    {
      id: "first-actions",
      type: "actionGrid",
      title: "무엇을 도와주고 싶나요?",
      actions: [
        {
          id: "adoption-consult",
          icon: "heart",
          eyebrow: "Adoption",
          label: "입양 상담하기",
          description: "평생 가족이 되어줄 준비가 되셨다면 상담부터 시작해주세요.",
          href: "tel:050-7959-9735",
          confirmMessage: "리호밍센터(050-7959-9735)로\n전화를 연결할까요?",
          tracking: {
            event: "lovejuo_action_click",
            params: {
              action: "adoption_consult",
            },
          },
        },
        {
          id: "news",
          icon: "blog",
          eyebrow: "News",
          label: "보호 아이 소식 보기",
          description: "입양 공고와 센터 소식을 가장 빠르게 확인해주세요.",
          href: "https://re-homing.org/adopt",
          tracking: {
            event: "lovejuo_action_click",
            params: {
              action: "news",
            },
          },
        },
        {
          id: "center-location",
          icon: "map",
          eyebrow: "Location",
          label: "센터 위치 보기",
          description: "방문 전 운영 시간과 상담 가능 여부를 확인해주세요.",
          toggleCenterMap: true,
          tracking: {
            event: "lovejuo_action_click",
            params: {
              action: "center_location",
            },
          },
        },
      ],
    },
    {
      id: "checklist",
      type: "checklist",
      title: "입양 전 꼭 확인해주세요",
      items: [
        "가족 모두가 입양에 동의했나요?",
        "매달 필요한 치료비와 생활비를 감당할 수 있나요?",
        "이사, 결혼, 출산 같은 변화에도 함께할 준비가 되었나요?",
        "하루 돌봄 시간과 산책 시간을 꾸준히 낼 수 있나요?",
      ],
    },
    {
      id: "faq",
      type: "faq",
      title: "자주 묻는 질문",
      items: [
        {
          question: "입양비용이 있나요?",
          answer: "사랑해주오 리호밍센터는 입양비용이 필요하지 않습니다. 정확한 절차와 시스템으로 준비된 보호자에게 입양의 기회를 제공하는 \"선진국형 입양센터\" 입니다.",
        },
        {
          question: "입양절차는 어떻게 되나요?",
          answer: "리호밍 센터에 방문하여 입양을 기다리는 아이들을 만나보실 수 있습니다. 교감을 거쳐 입양결정 후 입양교육, 건강검진, 방문훈련 등 다양한 절차가 있습니다.",
        },
        {
          question: "입양 자격 조건이 있나요?",
          answer: "만 19세 이상의 성인이면 누구나 신청할 수 있습니다. 입양 교육 이수, 안정적인 주거 환경, 가족 구성원 전원 동의가 필요합니다. 반려동물 양육 경험이 없어도 괜찮습니다.",
        },
        {
          question: "센터 운영시간은 어떻게 되나요?",
          answer: "리호밍센터는 연중무휴로 오전 10시부터 오후 10시까지 운영합니다. 방문 전 전화 문의를 권장드립니다.",
        },
        {
          question: "센터 방문 시 예약이 필요한가요?",
          answer: "예약 없이 방문 가능하지만, 원활한 상담을 위해 사전 예약을 권장합니다. 전화, 카카오톡, 사이트 내 채팅상담을 통해 예약하실 수 있습니다.",
        },
        {
          question: "센터 위치는 어디인가요?",
          answer: "인천점(인천광역시 남동구 논현로46번길 22, B동 1층 105호)과 광명점(경기도 광명시 금하로 464, 2층 207호) 두 곳을 운영하고 있습니다.",
        },
      ],
    },
    {
      id: "events",
      type: "featureCards",
      title: "진행중인 이벤트",
      cards: [
        {
          id: "meongbti",
          badge: "Test",
          title: "멍BTI 맞춤 간식 찾기",
          description: "몇 가지 질문만으로 우리 아이 맞춤 간식을 찾아보세요",
          imageSrc: "/images/test.webp",
          imageAlt: "멍BTI 맞춤 간식 찾기",
          href: "https://meong-bti.netlify.app/",
          tracking: {
            event: "meongbti_click",
            params: {
              location: "event_card",
            },
          },
        },
      ],
    },
    {
      id: "membership",
      type: "featureCards",
      title: "주오 멤버십",
      cards: [
        {
          id: "premium-care",
          icon: "crown",
          title: "프리미엄 토탈 케어 알아보기",
          description: "정기배송부터 예방 케어, 수술 지원까지 보호자가 반복해서 챙겨야 하는 항목을 한 흐름으로 묶었습니다.",
          notice: "안내 페이지 준비중입니다.",
        },
      ],
    },
    {
      id: "juo-company",
      type: "universe",
      title: "Juo Company",
      cards: [
        {
          id: "petfood",
          icon: "store",
          label: "펫푸드주오",
          description: "제조사",
          links: [
            { id: "homepage", icon: "house", label: "홈페이지", href: petfoodHomepageUrl },
            { id: "instagram", icon: "instagram", label: "인스타그램", href: petfoodInstagramUrl },
            { id: "kakao", icon: "kakao", label: "카카오", href: petfoodKakaoUrl },
          ],
        },
        { id: "gagga", icon: "scissors", label: "까까주오", description: "미용" },
        { id: "taxi", icon: "car", label: "태워주오", description: "펫택시" },
        {
          id: "hospital",
          icon: "firstAid",
          label: "치료해주오",
          description: "병원",
          links: [
            { id: "homepage", icon: "house", label: "홈페이지", href: hospitalHomepageUrl },
          ],
        },
        { id: "training", icon: "graduation", label: "가르쳐주오", description: "훈련" },
        {
          id: "love",
          icon: "heart",
          label: "사랑해주오",
          description: "리호밍 센터",
          links: [
            { id: "homepage", icon: "house", label: "홈페이지", href: rehomingHomepageUrl },
            { id: "instagram", icon: "instagram", label: "인스타그램", href: rehomingInstagramUrl },
            { id: "kakao", icon: "kakao", label: "카카오", href: rehomingKakaoUrl },
          ],
        },
        { id: "memory", icon: "shootingStar", label: "기억해주오", description: "장례식장(예정)" },
        { id: "travel", icon: "tent", label: "놀아주오", description: "관광" },
        { id: "total-care", icon: "shield", label: "토탈펫케어", description: "멤버십" },
        { id: "stay", icon: "house", label: "머물러주오", description: "호텔" },
      ],
    },
  ],
  centerLocations: [
    {
      name: "인천점",
      address: "인천광역시 남동구 논현로46번길 22, B동 1층 105호",
      lat: 37.4014586180252,
      lng: 126.71039968111,
      hours: "연중무휴 10:00 - 22:00",
      notice: "방문 전 사전 예약을 권장합니다",
      phone: "050-7959-9735",
    },
    {
      name: "광명점",
      address: "경기도 광명시 금하로 464, 2층 207호",
      lat: 37.4484546823205,
      lng: 126.884040346294,
      hours: "연중무휴 10:00 - 22:00",
      notice: "방문 전 사전 예약을 권장합니다",
      phone: "050-7959-9735",
    },
  ],
  storeFinder: {
    label: "가까운 직영/제휴 매장 찾기",
    trackingLocation: "footer_cta",
  },
  footer: {
    quote: "매일 현관에서 기다리는 존재가 있다는 것.",
    copyright: "2026 Love Juo Re-homing Center.",
    socials: [],
  },
};
