export type BrandSlug = "petfoodjuo" | "lovejuo";

export type IconKey =
  | "cart"
  | "crown"
  | "map"
  | "store"
  | "firstAid"
  | "scissors"
  | "graduation"
  | "car"
  | "house"
  | "heart"
  | "shootingStar"
  | "tent"
  | "shield"
  | "instagram"
  | "kakao"
  | "blog"
  | "sparkle";

export type TrackingConfig = {
  event: string;
  params?: Record<string, string | number>;
};

export type CenterLocationConfig = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  hours?: string;
  notice?: string;
  phone?: string;
};

export type LinkAction = {
  id: string;
  label: string;
  eyebrow?: string;
  description?: string;
  icon: IconKey;
  href?: string;
  notice?: string;
  confirmMessage?: string;
  toggleCenterMap?: true;
  tracking?: TrackingConfig;
};

export type LinkPageMetadata = {
  title: string;
  description: string;
};

export type LinkPageAccentTheme = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  shadowSubtle: string;
  shadowSoft: string;
  shadowMedium: string;
  shadowStrong: string;
  shadowSolid: string;
};

export type LinkPageTheme = {
  accent: LinkPageAccentTheme;
};

export type LinkPageHero = {
  title: Array<{
    text: string;
    accent?: boolean;
  }>;
  description: string[];
  tags: string[];
};

export type ProductItem = {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  backgroundClassName: string;
  href: string;
};

export type ProductTab = {
  id: string;
  label: string;
  products: ProductItem[];
};

export type ProductTabsSection = {
  id: string;
  type: "productTabs";
  title: string;
  tabs: ProductTab[];
  cta: LinkAction;
};

export type FeatureCard = {
  id: string;
  badge?: string;
  title: string;
  description: string;
  imageSrc?: string;
  imageAlt?: string;
  icon?: IconKey;
  href?: string;
  notice?: string;
  tracking?: TrackingConfig;
};

export type FeatureCardsSection = {
  id: string;
  type: "featureCards";
  title: string;
  cards: FeatureCard[];
};

export type ActionGridSection = {
  id: string;
  type: "actionGrid";
  title: string;
  actions: LinkAction[];
};

export type ProcessSection = {
  id: string;
  type: "process";
  title: string;
  steps: Array<{
    title: string;
    description: string;
  }>;
};

export type ChecklistSection = {
  id: string;
  type: "checklist";
  title: string;
  items: string[];
};

export type FaqSection = {
  id: string;
  type: "faq";
  title: string;
  items: Array<{
    question: string;
    answer: string;
  }>;
};

export type UniverseCard = {
  id: string;
  icon: IconKey;
  label: string;
  description: string;
  href?: string;
  notice?: string;
  links?: UniverseCardLink[];
};

export type UniverseCardLink = {
  id: "homepage" | "instagram" | "kakao";
  label: string;
  icon: IconKey;
  href: string;
  tracking?: TrackingConfig;
};

export type UniverseSection = {
  id: string;
  type: "universe";
  title: string;
  cards: UniverseCard[];
};

export type LinkPageSection =
  | ProductTabsSection
  | FeatureCardsSection
  | ActionGridSection
  | ProcessSection
  | ChecklistSection
  | FaqSection
  | UniverseSection;

export type SocialLink = {
  id: "instagram" | "kakao" | "blog";
  label: string;
  icon: IconKey;
  href?: string;
  notice?: string;
  tracking?: TrackingConfig;
};

export type StoreFinderConfig = {
  label: string;
  trackingLocation: string;
};

export type LinkPageConfig = {
  slug: BrandSlug;
  analyticsPageId: string;
  metadata: LinkPageMetadata;
  theme?: LinkPageTheme;
  intro: {
    words: string[];
    accentWordIndex: number;
    variant?: "wordRise" | "signalLine" | "stamp" | "careSteps";
    backgroundVideoSrc?: string;
    videoDurationMs?: number;
    videoStartFromEndMs?: number;
    videoTitle?: string;
    videoSubtitle?: string;
  };
  hero: LinkPageHero;
  sections: LinkPageSection[];
  storeFinder?: StoreFinderConfig;
  centerLocations?: CenterLocationConfig[];
  footer: {
    quote: string;
    copyright: string;
    socials: SocialLink[];
  };
};
