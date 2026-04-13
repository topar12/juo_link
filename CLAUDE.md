# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — run ESLint
- `npm run deploy` — build and deploy to Cloudflare Workers (via OpenNext)
- `npm run preview` — local preview of Cloudflare build
- No test framework is configured

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_KAKAO_MAP_APP_KEY` — Kakao Maps SDK key (store finder)
- `NEXT_PUBLIC_GA_ID` — Google Analytics measurement ID

## Architecture

This is a **multi-brand mobile link-in-bio site** for the Juo pet food family (펫푸드주오). Built with Next.js 16, React 19, Tailwind CSS v4, TypeScript, and deployed to **Cloudflare Workers** via `@opennextjs/cloudflare`. Currently two brands: `petfoodjuo` and `lovejuo`.

**Layout pattern:** `src/app/layout.tsx` wraps the page in a phone-frame mockup (max-width 430px with rounded border on desktop). GA script injected here via `@next/third-parties/google`.

**Routing:**
- `src/app/page.tsx` — redirects to `/petfoodjuo`
- `src/app/[brand]/page.tsx` — SSG route via `generateStaticParams()`; resolves slug aliases (e.g. `petfood-juo` → `petfoodjuo`) and renders `<LinkInBioPage />`
- `src/app/intro-preview/` — dev-only tool for comparing 4 intro animation variants

**Core rendering** (`src/features/linkinbio/LinkInBioPage.tsx`):
- Shows `<IntroAnimation />` (3.2s) on first load, then replaces with main content
- All UI sub-components (`SectionHeader`, `Tag`, `ActionButton`, `ProductCard`, `FeaturedCard`, `StepCard`, `ChecklistItem`, `FaqItem`, `UniverseCard`, `SocialButton`) are defined **inline** in this file — do not create separate component files for them
- Sections are config-driven: rendered based on `type` field (`productTabs`, `featureCards`, `actionGrid`, `process`, `checklist`, `faq`, `universe`)

**Brand config** (`src/data/linkPages/`):
- `types.ts` — all TypeScript types (`LinkPageConfig`, section types, `LinkPageAccentTheme`)
- `petfoodJuo.ts` / `loveJuo.ts` — full brand configs (hero, sections, social links, theme)
- `index.ts` — exports `LINK_PAGES` array and slug alias resolution
- lovejuo uses a blue accent theme and a video intro (`public/videos/lovejuo_intro.mp4`); petfoodjuo uses the default coral Remotion animation

**Key libraries:**
- **Remotion** (`@remotion/player`) — 3.2s intro animation (`src/components/IntroAnimation.tsx`); 4 variants in `src/features/linkinbio/intro/IntroComposition.tsx`
- **Framer Motion** — page transitions and tab animations
- **@phosphor-icons/react** — all icons
- **clsx + tailwind-merge** — conditional class composition
- **Kakao Maps** — store finder in `src/components/StoreFinderSheet.tsx`; script loaded dynamically, retries until `window.kakao.maps` is available

**Styling:** Tailwind v4 with custom brand colors defined via `@theme` in `globals.css` (e.g., `brand-coral-500: #ff6b6b`). The design uses a neobrutalist style with hard box-shadows (`shadow-[4px_4px_0px_...]`) and thick borders.

**Language:** UI text is in Korean. The site targets Korean users.
