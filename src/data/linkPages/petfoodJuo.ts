import type { LinkPageConfig } from "./types";

const petfoodHomepageUrl = "https://www.lovejuo.com/";
const petfoodInstagramUrl = "https://www.instagram.com/petfood.thejuo/";
const petfoodKakaoUrl = "http://pf.kakao.com/_xehxasn";
const loveJuoHomepageUrl = "https://re-homing.org/";
const loveJuoInstagramUrl = "https://www.instagram.com/lovejuo_rehome/";
const loveJuoKakaoUrl = "https://pf.kakao.com/_ZUxgZX";
const hospitalHomepageUrl = "https://juohospital.imweb.me/";

export const petfoodJuoPage: LinkPageConfig = {
  slug: "petfoodjuo",
  analyticsPageId: "petfoodjuo",
  metadata: {
    title: "펫푸드주오 | 링크인바이오",
    description: "엄마의 마음으로 만드는 수제 펫푸드. 휴먼그레이드 HACCP 인증. 당일생산 익일배송.",
  },
  intro: {
    words: ["FRESH.", "HUMAN GRADE.", "PETFOOD JUO."],
    accentWordIndex: 2,
  },
  hero: {
    title: [
      { text: "Petfood" },
      { text: "Juo.", accent: true },
    ],
    description: [
      "엄마의 마음으로 만드는 수제 펫푸드.",
      "휴먼그레이드 기준을 지킵니다.",
    ],
    tags: ["HACCP", "휴먼그레이드", "당일생산"],
  },
  sections: [
    {
      id: "recommended-products",
      type: "productTabs",
      title: "추천 상품",
      tabs: [
        {
          id: "dog",
          label: "강아지",
          products: [
            {
              id: "dog-junior",
              imageSrc: "/images/dog_junior.webp",
              title: "프리미엄 강아지 사료",
              description: "수의사가 만든 안전한 펫푸드",
              backgroundClassName: "bg-orange-100",
              href: "https://www.lovejuo.com/shop/item.php?it_id=1720665366",
            },
            {
              id: "dog-adult",
              imageSrc: "/images/dog_adult.webp",
              title: "프리미엄 성견용 사료",
              description: "수의사가 만든 안전한 펫푸드",
              backgroundClassName: "bg-rose-100",
              href: "https://www.lovejuo.com/shop/item.php?it_id=1724138094",
            },
            {
              id: "chicken-dog",
              imageSrc: "/images/chicken.webp",
              title: "무항생제 닭가슴살",
              description: "깨끗하고 순수한 영양 간식",
              backgroundClassName: "bg-amber-100",
              href: "https://www.lovejuo.com/shop/item.php?it_id=1726028391",
            },
            {
              id: "pollack-dog",
              imageSrc: "/images/pollack.webp",
              title: "무염 북어스틱",
              description: "첨가제 없는 100% 국산 보양식",
              backgroundClassName: "bg-sky-100",
              href: "https://www.lovejuo.com/shop/item.php?it_id=1730970663",
            },
          ],
        },
        {
          id: "cat",
          label: "고양이",
          products: [
            {
              id: "kitten",
              imageSrc: "/images/kitten.webp",
              title: "프리미엄 키튼 사료",
              description: "수의사가 만든 안전한 펫푸드",
              backgroundClassName: "bg-indigo-100",
              href: "https://www.lovejuo.com/shop/item.php?it_id=1724137562",
            },
            {
              id: "cat",
              imageSrc: "/images/cat.webp",
              title: "프리미엄 캣 사료",
              description: "수의사가 만든 안전한 펫푸드",
              backgroundClassName: "bg-fuchsia-100",
              href: "https://www.lovejuo.com/shop/item.php?it_id=1724137787",
            },
            {
              id: "chicken-cat",
              imageSrc: "/images/chicken.webp",
              title: "무항생제 닭가슴살",
              description: "깨끗하고 순수한 영양 간식",
              backgroundClassName: "bg-amber-100",
              href: "https://www.lovejuo.com/shop/item.php?it_id=1726028391",
            },
            {
              id: "pollack-cat",
              imageSrc: "/images/pollack.webp",
              title: "무염 북어스틱",
              description: "첨가제 없는 100% 국산 보양식",
              backgroundClassName: "bg-sky-100",
              href: "https://www.lovejuo.com/shop/item.php?it_id=1730970663",
            },
          ],
        },
      ],
      cta: {
        id: "official-mall",
        icon: "cart",
        eyebrow: "Official",
        label: "주오 공식몰 바로가기",
        href: "https://www.lovejuo.com/shop/",
        tracking: {
          event: "official_mall_click",
          params: {
            location: "main_cta",
          },
        },
      },
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
            { id: "homepage", icon: "house", label: "홈페이지", href: loveJuoHomepageUrl },
            { id: "instagram", icon: "instagram", label: "인스타그램", href: loveJuoInstagramUrl },
            { id: "kakao", icon: "kakao", label: "카카오", href: loveJuoKakaoUrl },
          ],
        },
        { id: "memory", icon: "shootingStar", label: "기억해주오", description: "장례식장(예정)" },
        { id: "travel", icon: "tent", label: "놀아주오", description: "관광" },
        { id: "total-care", icon: "shield", label: "토탈펫케어", description: "멤버십" },
        { id: "stay", icon: "house", label: "머물러주오", description: "호텔" },
      ],
    },
  ],
  storeFinder: {
    label: "가까운 직영/제휴 매장 찾기",
    trackingLocation: "footer_cta",
  },
  footer: {
    quote: "사람이 먹을 수 없는 건, 주지 않습니다.",
    copyright: "2026 Petfood Juo.",
    socials: [],
  },
};
