"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  CarProfile,
  Crown,
  FirstAid,
  GraduationCap,
  Heart,
  HouseLine,
  InstagramLogo,
  MapPin,
  NewspaperClipping,
  Scissors,
  ShieldStar,
  ShootingStar,
  ShoppingCart,
  Sparkle,
  Storefront,
  Tent,
} from "@phosphor-icons/react";
import clsx from "clsx";
import CenterMapSheet from "@/components/CenterMapSheet";
import IntroAnimation from "@/components/IntroAnimation";
import StoreFinderSheet from "@/components/StoreFinderSheet";
import { trackEvent, trackLinkInBioPageView } from "@/lib/analytics";
import type {
  ActionGridSection,
  FeatureCard,
  FeatureCardsSection,
  FaqSection,
  IconKey,
  LinkAction,
  LinkPageConfig,
  LinkPageSection,
  ProductItem,
  ProductTabsSection,
  ProcessSection,
  ChecklistSection,
  LinkPageAccentTheme,
  UniverseCard as UniverseCardConfig,
  UniverseCardLink,
  UniverseSection,
} from "@/data/linkPages/types";

const ICONS = {
  cart: ShoppingCart,
  crown: Crown,
  map: MapPin,
  store: Storefront,
  firstAid: FirstAid,
  scissors: Scissors,
  graduation: GraduationCap,
  car: CarProfile,
  house: HouseLine,
  heart: Heart,
  shootingStar: ShootingStar,
  tent: Tent,
  shield: ShieldStar,
  instagram: InstagramLogo,
  blog: NewspaperClipping,
  sparkle: Sparkle,
};

const DEFAULT_ACCENT_THEME: LinkPageAccentTheme = {
  50: "#fff8f2",
  100: "#fff1eb",
  200: "#ffd2d2",
  300: "#ffaaaa",
  400: "#ff8585",
  500: "#ff6b6b",
  600: "#fa5252",
  700: "#e03131",
  shadowSubtle: "rgba(255,107,107,0.16)",
  shadowSoft: "rgba(255,107,107,0.22)",
  shadowMedium: "rgba(255,107,107,0.3)",
  shadowStrong: "rgba(255,107,107,0.34)",
  shadowSolid: "rgba(250,82,82,1)",
};

type AccentStyle = React.CSSProperties & Record<string, string>;
type IconWeight = "thin" | "light" | "regular" | "bold" | "fill" | "duotone";

type LinkInBioPageProps = {
  config: LinkPageConfig;
};

function createAccentStyle(accent: LinkPageAccentTheme): AccentStyle {
  return {
    "--color-brand-coral-50": accent[50],
    "--color-brand-coral-100": accent[100],
    "--color-brand-coral-200": accent[200],
    "--color-brand-coral-300": accent[300],
    "--color-brand-coral-400": accent[400],
    "--color-brand-coral-500": accent[500],
    "--color-brand-coral-600": accent[600],
    "--color-brand-coral-700": accent[700],
    "--link-accent-shadow-subtle": accent.shadowSubtle,
    "--link-accent-shadow-soft": accent.shadowSoft,
    "--link-accent-shadow-medium": accent.shadowMedium,
    "--link-accent-shadow-strong": accent.shadowStrong,
    "--link-accent-shadow-solid": accent.shadowSolid,
  };
}

export default function LinkInBioPage({ config }: LinkInBioPageProps) {
  const [showIntro, setShowIntro] = useState(true);
  const [activeProductTabs, setActiveProductTabs] = useState<Record<string, string>>({});
  const [showStoreFinder, setShowStoreFinder] = useState(false);
  const [showCenterMap, setShowCenterMap] = useState(false);
  const pageViewTrackedRef = useRef(false);
  const accentTheme = config.theme?.accent ?? DEFAULT_ACCENT_THEME;

  useEffect(() => {
    if (pageViewTrackedRef.current) {
      return;
    }

    pageViewTrackedRef.current = true;
    trackLinkInBioPageView({
      page: config.analyticsPageId,
      brand_page: config.analyticsPageId,
      slug: config.slug,
      page_title: config.metadata.title,
    });
  }, [config.analyticsPageId, config.metadata.title, config.slug]);

  const handleTrackedClick = (
    item:
      | Pick<LinkAction, "id" | "label" | "notice" | "tracking">
      | Pick<FeatureCard, "id" | "title" | "notice" | "tracking">,
    fallbackEvent: string,
    fallbackParams: Record<string, string | number> = {}
  ) => {
    const tracking = item.tracking;

    trackEvent(tracking?.event ?? fallbackEvent, {
      page: config.analyticsPageId,
      brand_page: config.analyticsPageId,
      ...fallbackParams,
      ...tracking?.params,
    });

    if (item.notice) {
      alert(item.notice);
    }
  };

  const handleStoreFinderOpen = () => {
    if (!config.storeFinder) {
      return;
    }

    trackEvent("store_finder_open", {
      page: config.analyticsPageId,
      brand_page: config.analyticsPageId,
      location: config.storeFinder.trackingLocation,
    });
    setShowStoreFinder(true);
  };

  const handleUniverseCardClick = (card: UniverseCardConfig) => {
    trackEvent("juo_company_click", {
      page: config.analyticsPageId,
      brand_page: config.analyticsPageId,
      company_id: card.id,
      company_label: card.label,
    });

    if (card.notice) {
      alert(card.notice);
    }
  };

  const handleUniverseCardLinkClick = (
    card: UniverseCardConfig,
    link: UniverseCardLink
  ) => {
    trackEvent(link.tracking?.event ?? "juo_company_link_click", {
      page: config.analyticsPageId,
      brand_page: config.analyticsPageId,
      company_id: card.id,
      company_label: card.label,
      link_id: link.id,
      link_label: link.label,
      ...link.tracking?.params,
    });
  };

  return (
    <div className="relative h-full w-full" style={createAccentStyle(accentTheme)}>
      <AnimatePresence>
        {showIntro && (
          <IntroAnimation
            key="intro"
            words={config.intro.words}
            accentWordIndex={config.intro.accentWordIndex}
            variant={config.intro.variant}
            backgroundVideoSrc={config.intro.backgroundVideoSrc}
            videoDurationMs={config.intro.videoDurationMs}
            videoStartFromEndMs={config.intro.videoStartFromEndMs}
            videoTitle={config.intro.videoTitle}
            videoSubtitle={config.intro.videoSubtitle}
            onComplete={() => setShowIntro(false)}
          />
        )}
      </AnimatePresence>

      {!showIntro && (
        <motion.div
          key="main"
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10 flex h-full w-full flex-col gap-10 overflow-y-auto bg-slate-50 px-5 py-10 pb-16 no-scrollbar"
        >
          <HeroSection config={config} />

          {config.sections.map((section) =>
            renderSection({
              section,
              activeProductTabs,
              setActiveProductTabs,
              handleTrackedClick,
              handleUniverseCardClick,
              handleUniverseCardLinkClick,
              onCenterMapToggle: config.centerLocations?.length ? () => setShowCenterMap(true) : undefined,
              analyticsPageId: config.analyticsPageId,
            })
          )}

          <footer className="mt-6 flex w-full flex-col items-start gap-6 pt-12">
            {config.storeFinder ? (
              <ActionButton
                icon={<IconGlyph icon="map" weight="bold" className="text-xl" />}
                label={config.storeFinder.label}
                onClick={handleStoreFinderOpen}
              />
            ) : null}

            <div className="flex flex-col items-start gap-1">
              <p className="text-xs font-bold tracking-tight text-slate-800">
                &ldquo;{config.footer.quote}&rdquo;
              </p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                &copy;&nbsp;{config.footer.copyright}
              </p>
            </div>
          </footer>
        </motion.div>
      )}

      <AnimatePresence>
        {showStoreFinder ? (
          <StoreFinderSheet
            accentColor={accentTheme[500]}
            analyticsPageId={config.analyticsPageId}
            onClose={() => setShowStoreFinder(false)}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showCenterMap && config.centerLocations?.length ? (
          <CenterMapSheet
            locations={config.centerLocations}
            onClose={() => setShowCenterMap(false)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function renderSection({
  section,
  activeProductTabs,
  setActiveProductTabs,
  handleTrackedClick,
  handleUniverseCardClick,
  handleUniverseCardLinkClick,
  onCenterMapToggle,
  analyticsPageId,
}: {
  section: LinkPageSection;
  activeProductTabs: Record<string, string>;
  setActiveProductTabs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleTrackedClick: (
    item:
      | Pick<LinkAction, "id" | "label" | "notice" | "tracking">
      | Pick<FeatureCard, "id" | "title" | "notice" | "tracking">,
    fallbackEvent: string,
    fallbackParams?: Record<string, string | number>
  ) => void;
  handleUniverseCardClick: (card: UniverseCardConfig) => void;
  handleUniverseCardLinkClick: (card: UniverseCardConfig, link: UniverseCardLink) => void;
  onCenterMapToggle?: () => void;
  analyticsPageId: string;
}) {
  switch (section.type) {
    case "productTabs":
      return (
        <ProductTabs
          key={section.id}
          section={section}
          activeProductTabs={activeProductTabs}
          setActiveProductTabs={setActiveProductTabs}
          handleTrackedClick={handleTrackedClick}
          analyticsPageId={analyticsPageId}
        />
      );
    case "featureCards":
      return (
        <FeatureCards
          key={section.id}
          section={section}
          handleTrackedClick={handleTrackedClick}
        />
      );
    case "actionGrid":
      return (
        <ActionGrid
          key={section.id}
          section={section}
          handleTrackedClick={handleTrackedClick}
          onCenterMapToggle={onCenterMapToggle}
        />
      );
    case "process":
      return <ProcessSteps key={section.id} section={section} />;
    case "checklist":
      return <Checklist key={section.id} section={section} />;
    case "faq":
      return <Faq key={section.id} section={section} />;
    case "universe":
      return (
        <Universe
          key={section.id}
          section={section}
          onCardClick={handleUniverseCardClick}
          onCardLinkClick={handleUniverseCardLinkClick}
        />
      );
  }
}

function HeroSection({ config }: { config: LinkPageConfig }) {
  return (
    <section className="mt-4 flex flex-col sm:mt-8">
      <h1 className="text-5xl font-black uppercase leading-none tracking-tighter text-slate-900">
        {config.hero.title.map((line) => (
          <React.Fragment key={line.text}>
            <span className={line.accent ? "text-brand-coral-500" : undefined}>
              {line.text}
            </span>
            <br />
          </React.Fragment>
        ))}
      </h1>
      <p className="mt-4 max-w-[88%] text-sm font-medium leading-snug text-slate-600">
        {config.hero.description.map((line) => (
          <React.Fragment key={line}>
            {line}
            <br />
          </React.Fragment>
        ))}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {config.hero.tags.map((tag) => (
          <Tag key={tag} label={tag} />
        ))}
      </div>
    </section>
  );
}

function ProductTabs({
  section,
  activeProductTabs,
  setActiveProductTabs,
  handleTrackedClick,
  analyticsPageId,
}: {
  section: ProductTabsSection;
  activeProductTabs: Record<string, string>;
  setActiveProductTabs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleTrackedClick: (
    item: Pick<LinkAction, "id" | "label" | "notice" | "tracking">,
    fallbackEvent: string,
    fallbackParams?: Record<string, string | number>
  ) => void;
  analyticsPageId: string;
}) {
  const activeTabId = activeProductTabs[section.id] ?? section.tabs[0]?.id;
  const activeTab = section.tabs.find((tab) => tab.id === activeTabId) ?? section.tabs[0];

  return (
    <section className="mt-4 flex w-full flex-col gap-3">
      <div className="mb-1 flex items-center justify-between">
        <SectionHeader title={section.title} />
        <div className="ml-3 flex shrink-0 gap-1 rounded-lg bg-slate-200/50 p-1">
          {section.tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveProductTabs((current) => ({
                  ...current,
                  [section.id]: tab.id,
                }));
                trackEvent("product_tab_change", {
                  page: analyticsPageId,
                  brand_page: analyticsPageId,
                  tab_id: tab.id,
                  tab_label: tab.label,
                });
              }}
              className={clsx(
                "rounded-md px-4 py-1.5 text-xs font-bold transition-all",
                activeTab?.id === tab.id
                  ? "bg-white text-slate-800 shadow-[2px_2px_0px_0px_rgba(30,41,59,0.1)]"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={activeTab?.id}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="grid grid-cols-2 gap-3"
      >
        {activeTab?.products.map((product) => (
          <ProductCard key={product.id} product={product} analyticsPageId={analyticsPageId} tabId={activeTab.id} />
        ))}
      </motion.div>

      <ActionButton
        icon={<IconGlyph icon={section.cta.icon} weight="bold" className="text-xl" />}
        eyebrow={section.cta.eyebrow}
        label={section.cta.label}
        href={section.cta.href}
        onClick={() =>
          handleTrackedClick(section.cta, "link_click", {
            link_id: section.cta.id,
          })
        }
        primary
      />
    </section>
  );
}

function FeatureCards({
  section,
  handleTrackedClick,
}: {
  section: FeatureCardsSection;
  handleTrackedClick: (
    item: Pick<FeatureCard, "id" | "title" | "notice" | "tracking">,
    fallbackEvent: string,
    fallbackParams?: Record<string, string | number>
  ) => void;
}) {
  return (
    <section className="mt-4 flex w-full flex-col gap-3">
      <SectionHeader title={section.title} />
      <div className="grid grid-cols-1 gap-3">
        {section.cards.map((card) => (
          <FeatureCardButton
            key={card.id}
            card={card}
            onClick={() =>
              handleTrackedClick(card, "feature_card_click", {
                card_id: card.id,
              })
            }
          />
        ))}
      </div>
    </section>
  );
}

function ActionGrid({
  section,
  handleTrackedClick,
  onCenterMapToggle,
}: {
  section: ActionGridSection;
  handleTrackedClick: (
    item: Pick<LinkAction, "id" | "label" | "notice" | "tracking">,
    fallbackEvent: string,
    fallbackParams?: Record<string, string | number>
  ) => void;
  onCenterMapToggle?: () => void;
}) {
  return (
    <section className="mt-4 flex w-full flex-col gap-3">
      <SectionHeader title={section.title} />
      <div className="grid grid-cols-1 gap-3">
        {section.actions.map((action, index) => (
          <IntentAction
            key={action.id}
            action={action}
            primary={index === 0}
            onClick={() => {
              handleTrackedClick(action, "action_click", { action_id: action.id });
              if (action.toggleCenterMap) onCenterMapToggle?.();
            }}
          />
        ))}
      </div>
    </section>
  );
}

function ProcessSteps({ section }: { section: ProcessSection }) {
  return (
    <section className="mt-4 flex w-full flex-col gap-3">
      <SectionHeader title={section.title} />
      <div className="grid grid-cols-1 gap-3">
        {section.steps.map((step, index) => (
          <div
            key={step.title}
            className="flex items-start gap-4 rounded-xl border-2 border-slate-200 bg-white p-4 shadow-[3px_3px_0px_0px_rgba(30,41,59,0.06)]"
          >
            <div className="flex h-10 min-w-10 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-white">
              {index + 1}
            </div>
            <div className="flex flex-col gap-1">
              <strong className="text-sm font-black tracking-tight text-slate-900">
                {step.title}
              </strong>
              <p className="text-xs font-medium leading-relaxed text-slate-500">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Checklist({ section }: { section: ChecklistSection }) {
  return (
    <section className="mt-4 flex w-full flex-col gap-3">
      <SectionHeader title={section.title} />
      <div className="rounded-xl border-2 border-slate-200 bg-white p-4 shadow-[3px_3px_0px_0px_rgba(30,41,59,0.06)]">
        <ul className="flex flex-col gap-3">
          {section.items.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-coral-500 text-[10px] font-black text-white">
                ✓
              </span>
              <span className="text-xs font-semibold leading-relaxed text-slate-700">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Faq({ section }: { section: FaqSection }) {
  return (
    <section className="mt-4 flex w-full flex-col gap-3">
      <SectionHeader title={section.title} />
      <div className="flex flex-col gap-3">
        {section.items.map((item) => (
          <details
            key={item.question}
            className="group rounded-xl border-2 border-slate-200 bg-white px-4 py-3 shadow-[3px_3px_0px_0px_rgba(30,41,59,0.06)]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black tracking-tight text-slate-900">
              {item.question}
              <span className="text-brand-coral-500 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-xs font-medium leading-relaxed text-slate-500">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Universe({
  section,
  onCardClick,
  onCardLinkClick,
}: {
  section: UniverseSection;
  onCardClick: (card: UniverseCardConfig) => void;
  onCardLinkClick: (card: UniverseCardConfig, link: UniverseCardLink) => void;
}) {
  return (
    <section className="mt-4 flex w-full flex-col gap-4">
      <SectionHeader title={section.title} />
      <div className="grid w-full grid-cols-2 gap-3">
        {section.cards.map((card) => (
          <UniverseCard
            key={card.id}
            card={card}
            onClick={
              card.href || card.notice ? () => onCardClick(card) : undefined
            }
            onLinkClick={(link) => onCardLinkClick(card, link)}
          />
        ))}
      </div>
    </section>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex flex-1 items-center gap-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
        {title}
      </h2>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="rounded-full border-2 border-slate-200 bg-white/60 px-3 py-1 text-[11px] font-bold text-slate-600 backdrop-blur-md">
      {label}
    </span>
  );
}

function ActionButton({
  icon,
  label,
  eyebrow,
  primary = false,
  href,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  eyebrow?: string;
  primary?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const content = primary ? (
    <>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-coral-500 text-white shadow-[2px_2px_0px_0px_rgba(30,41,59,0.16)]">
          {icon}
        </div>
        <div className="flex flex-col items-start">
          {eyebrow ? (
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-coral-500">
              {eyebrow}
            </span>
          ) : null}
          <span className="text-sm font-bold tracking-tight text-slate-900">
            {label}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-8 w-px bg-slate-200" />
        <div className="flex h-10 min-w-[44px] items-center justify-center rounded-xl border border-brand-coral-200 bg-brand-coral-50 px-3 text-brand-coral-500 transition-all duration-200 group-hover:translate-x-1 group-hover:border-brand-coral-500 group-hover:bg-brand-coral-500 group-hover:text-white">
          <span className="text-base leading-none">&rarr;</span>
        </div>
      </div>
    </>
  ) : (
    <>
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-lg leading-none">&rsaquo;</div>
    </>
  );

  const className = clsx(
    "relative flex w-full items-center justify-between overflow-hidden rounded-xl border-2 px-5 py-4 text-sm font-bold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-coral-300 focus-visible:ring-offset-2",
    primary
      ? "group min-h-[72px] border-brand-coral-500 bg-white text-slate-900 shadow-[4px_4px_0px_0px_var(--link-accent-shadow-soft)] hover:-translate-y-0.5 hover:bg-brand-coral-50/40 hover:shadow-[6px_6px_0px_0px_var(--link-accent-shadow-medium)]"
      : "border-slate-200 bg-white text-slate-800 shadow-[4px_4px_0px_0px_rgba(30,41,59,0.05)] hover:-translate-y-0.5 hover:border-slate-800 hover:shadow-[4px_4px_0px_0px_rgba(30,41,59,0.15)]"
  );

  return <SmartLink href={href} className={className} onClick={onClick}>{content}</SmartLink>;
}

function ProductCard({ product, analyticsPageId, tabId }: { product: ProductItem; analyticsPageId: string; tabId: string }) {
  return (
    <a
      href={product.href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        trackEvent("product_click", {
          page: analyticsPageId,
          brand_page: analyticsPageId,
          product_id: product.id,
          product_title: product.title,
          tab_id: tabId,
        })
      }
      className="group relative flex flex-col rounded-xl border-2 border-slate-200 bg-white p-3 text-left shadow-[2px_2px_0px_0px_rgba(30,41,59,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-800 hover:shadow-[4px_4px_0px_0px_rgba(30,41,59,0.15)] active:scale-95"
    >
      <div
        className={clsx(
          "relative mb-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border-2 border-transparent transition-colors group-hover:border-slate-800",
          product.backgroundClassName
        )}
      >
        <Image
          src={product.imageSrc}
          alt={product.title}
          fill
          className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 430px) 50vw, 200px"
        />
      </div>

      <div className="flex flex-col items-start px-1">
        <span className="text-sm font-bold leading-tight text-slate-800">
          {product.title}
        </span>
        <span className="mt-1 line-clamp-2 text-[10px] font-semibold leading-tight text-slate-500">
          {product.description}
        </span>
      </div>
    </a>
  );
}

function FeatureCardButton({
  card,
  onClick,
}: {
  card: FeatureCard;
  onClick: () => void;
}) {
  const content = (
    <>
      {card.imageSrc ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[18px] border border-slate-200 bg-slate-900">
          <Image
            src={card.imageSrc}
            alt={card.imageAlt ?? card.title}
            fill
            className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, 420px"
          />
        </div>
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-brand-coral-200 bg-brand-coral-50 text-2xl text-brand-coral-500">
          <IconGlyph icon={card.icon ?? "sparkle"} weight="duotone" />
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col items-start gap-2">
          {card.badge ? (
            <span className="inline-flex items-center rounded-full bg-brand-coral-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
              {card.badge}
            </span>
          ) : null}
          <div className="flex flex-col items-start gap-1">
            <span className="text-base font-bold leading-tight text-slate-900 sm:text-lg">
              {card.title}
            </span>
            <span className="text-[11px] font-medium leading-relaxed text-slate-500 sm:text-xs">
              {card.description}
            </span>
          </div>
        </div>
        <div className="mt-0.5 flex h-10 min-w-[44px] items-center justify-center rounded-xl border border-brand-coral-200 bg-brand-coral-50 px-3 text-brand-coral-500 transition-all duration-200 group-hover:translate-x-1 group-hover:border-brand-coral-500 group-hover:bg-brand-coral-500 group-hover:text-white">
          <span className="text-base leading-none">&rarr;</span>
        </div>
      </div>
    </>
  );

  const className =
    "group relative flex w-full flex-col gap-4 rounded-2xl border-2 border-slate-200 bg-white p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-900 hover:shadow-[4px_4px_0px_0px_rgba(30,41,59,0.12)] active:scale-[0.98]";

  return <SmartLink href={card.href} className={className} onClick={onClick}>{content}</SmartLink>;
}

function IntentAction({
  action,
  primary,
  onClick,
}: {
  action: LinkAction;
  primary: boolean;
  onClick: () => void;
}) {
  const className = clsx(
    "group relative flex w-full items-start gap-4 overflow-hidden rounded-xl border-2 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]",
    primary
      ? "border-brand-coral-500 bg-slate-900 text-white shadow-[5px_5px_0px_0px_var(--link-accent-shadow-strong)]"
      : "border-slate-200 bg-white text-slate-900 shadow-[3px_3px_0px_0px_rgba(30,41,59,0.06)] hover:border-slate-900 hover:shadow-[4px_4px_0px_0px_rgba(30,41,59,0.12)]"
  );

  return (
    <SmartLink href={action.href} className={className} onClick={onClick}>
      <div
        className={clsx(
          "flex h-12 min-w-12 items-center justify-center rounded-xl border-2 text-2xl transition-colors",
          primary
            ? "border-white/10 bg-white/10 text-brand-coral-200"
            : "border-brand-coral-200 bg-brand-coral-50 text-brand-coral-500"
        )}
      >
        <IconGlyph icon={action.icon} weight="duotone" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {action.eyebrow ? (
          <span
            className={clsx(
              "text-[10px] font-black uppercase tracking-[0.18em]",
              primary ? "text-brand-coral-200" : "text-brand-coral-500"
            )}
          >
            {action.eyebrow}
          </span>
        ) : null}
        <span className={clsx("text-sm font-black tracking-tight", primary ? "text-white" : "text-slate-900")}>
          {action.label}
        </span>
        {action.description ? (
          <span className={clsx("text-xs font-medium leading-relaxed", primary ? "text-slate-200" : "text-slate-500")}>
            {action.description}
          </span>
        ) : null}
      </div>
      <div
        className={clsx(
          "mt-1 flex h-9 min-w-10 items-center justify-center rounded-lg border px-3 transition-all duration-200 group-hover:translate-x-1",
          primary
            ? "border-white/10 bg-white/10 text-white"
            : "border-slate-200 bg-slate-50 text-slate-700"
        )}
      >
        <span className="text-base leading-none">&rarr;</span>
      </div>
    </SmartLink>
  );
}

function UniverseCard({
  card,
  onClick,
  onLinkClick,
}: {
  card: UniverseCardConfig;
  onClick?: () => void;
  onLinkClick: (link: UniverseCardLink) => void;
}) {
  const content = (
    <>
      <div
        className={clsx(
          "mb-1 text-2xl transition-colors",
          card.href || card.links?.length ? "text-brand-coral-500" : "text-slate-400 group-hover:text-brand-coral-500"
        )}
      >
        <IconGlyph icon={card.icon} weight="duotone" />
      </div>
      <span className="text-sm font-bold text-slate-800">{card.label}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {card.description}
      </span>
      {card.links?.length ? (
        <div className="mt-3 flex items-center gap-1.5">
          {card.links.map((link) => (
            <a
              key={`${card.id}-${link.id}`}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
              onClick={() => onLinkClick(link)}
              className={getUniverseLinkClassName(link.id)}
              aria-label={`${card.label} ${link.label}`}
            >
              <IconGlyph icon={link.icon} weight="bold" className="text-sm" />
            </a>
          ))}
        </div>
      ) : null}
    </>
  );

  const className = clsx(
    "group flex flex-col items-start justify-center gap-1 rounded-xl border-2 p-4 text-left backdrop-blur-sm transition-all duration-200",
    card.href || card.links?.length
      ? "border-brand-coral-500 bg-white shadow-[4px_4px_0px_0px_var(--link-accent-shadow-solid)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_var(--link-accent-shadow-solid)]"
      : "border-slate-200 bg-white/80 hover:-translate-y-0.5 hover:border-slate-800 hover:shadow-[4px_4px_0px_0px_rgba(30,41,59,0.1)]"
  );

  if (card.links?.length) {
    return <div className={className}>{content}</div>;
  }

  return <SmartLink href={card.href} className={className} onClick={onClick}>{content}</SmartLink>;
}

function SmartLink({
  href,
  className,
  onClick,
  children,
}: {
  href?: string;
  className: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  if (href) {
    const isExternal = href.startsWith("http");
    return (
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className={className}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }

  if (!onClick) {
    return <div className={className}>{children}</div>;
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {children}
    </button>
  );
}

function IconGlyph({
  icon,
  className,
  weight = "bold",
}: {
  icon: IconKey;
  className?: string;
  weight?: IconWeight;
}) {
  if (icon === "kakao") {
    return <KakaoTalkIcon className={className} />;
  }

  const Icon = ICONS[icon];
  return <Icon weight={weight} className={className} />;
}

function getUniverseLinkClassName(id: UniverseCardLink["id"]) {
  return clsx(
    "flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-coral-300",
    id === "homepage" &&
      "border-slate-200 bg-slate-50 text-slate-600 hover:border-brand-coral-500 hover:bg-brand-coral-50 hover:text-brand-coral-500",
    id === "instagram" &&
      "border-rose-200 bg-rose-50 text-rose-600 shadow-[2px_2px_0px_0px_rgba(244,63,94,0.12)] hover:border-rose-500 hover:bg-rose-500 hover:text-white",
    id === "kakao" &&
      "border-[#FEE500] bg-[#FEE500] text-[#191600] shadow-[2px_2px_0px_0px_rgba(25,22,0,0.12)] hover:border-[#191600] hover:bg-[#FEE500]"
  );
}

function KakaoTalkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M12 4.25c-4.45 0-8.05 2.82-8.05 6.3 0 2.22 1.48 4.17 3.7 5.29l-.62 2.28c-.08.31.27.56.54.38l2.74-1.82c.54.1 1.1.16 1.69.16 4.45 0 8.05-2.82 8.05-6.29 0-3.48-3.6-6.3-8.05-6.3Z"
        fill="currentColor"
      />
      <path
        d="M8.1 9.28h7.8M8.1 11.12h6.25M8.1 12.96h4.7"
        stroke="#FEE500"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
    </svg>
  );
}
