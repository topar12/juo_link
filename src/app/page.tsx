"use client";

import React, { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import IntroAnimation from "@/components/IntroAnimation";
import StoreFinderSheet from "@/components/StoreFinderSheet";
import { trackEvent } from "@/lib/analytics";
import { 
  ShoppingCart, 
  Crown, 
  MapPin,
  Storefront,
  FirstAid,
  Scissors,
  GraduationCap,
  CarProfile,
  HouseLine,
  Heart,
  ShootingStar,
  Tent,
  ShieldStar,
  InstagramLogo,
  ChatCircleText,
  NewspaperClipping,
  Sparkle,
} from "@phosphor-icons/react";
import clsx from "clsx";

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const [productTab, setProductTab] = useState<"dog" | "cat">("dog");
  const [showStoreFinder, setShowStoreFinder] = useState(false);

  const handleStoreFinderOpen = () => {
    trackEvent("store_finder_open", {
      location: "footer_cta",
    });
    setShowStoreFinder(true);
  };

  const handleSocialClick = (channel: "instagram" | "kakao" | "blog") => {
    trackEvent("social_click", {
      channel,
      location: "footer",
    });

    if (channel === "blog") {
      alert("준비중입니다.");
    }
  };

  return (
    <>
      <AnimatePresence>
        {showIntro && (
          <IntroAnimation key="intro" onComplete={() => setShowIntro(false)} />
        )}
      </AnimatePresence>
      
      {!showIntro && (
        <motion.div 
          key="main"
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10 w-full h-full overflow-y-auto no-scrollbar flex flex-col px-5 py-10 pb-16 gap-10 bg-slate-50"
        >
          
          {/* 1. Header & Profile */}
          <section className="flex flex-col mt-4 sm:mt-8">
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase leading-none">
              Petfood<br/>
              <span className="text-brand-coral-500">Juo.</span>
            </h1>
            <p className="text-sm text-slate-600 font-medium mt-4 max-w-[85%] leading-snug">
              엄마의 마음으로 만드는 수제 펫푸드.<br/>휴먼그레이드 기준을 지킵니다.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-5">
              <Tag label="HACCP" />
              <Tag label="휴먼그레이드" />
              <Tag label="당일생산" />
            </div>
          </section>

          {/* 2. Recommended Products */}
          <section className="flex flex-col gap-3 w-full mt-4">
            <div className="flex items-center justify-between mb-1">
              <SectionHeader title="추천 상품" />
              <div className="flex gap-1 bg-slate-200/50 p-1 rounded-lg ml-3 shrink-0">
                <button
                  onClick={() => setProductTab("dog")}
                  className={clsx(
                    "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                    productTab === "dog" ? "bg-white text-slate-800 shadow-[2px_2px_0px_0px_rgba(30,41,59,0.1)]" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  강아지
                </button>
                <button
                  onClick={() => setProductTab("cat")}
                  className={clsx(
                    "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                    productTab === "cat" ? "bg-white text-slate-800 shadow-[2px_2px_0px_0px_rgba(30,41,59,0.1)]" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  고양이
                </button>
              </div>
            </div>

            {productTab === "dog" ? (
              <motion.div 
                key="dog-products"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-2 gap-3"
              >
                <ProductCard 
                  imageSrc="/images/dog_junior.webp" 
                  title="프리미엄 강아지 사료" 
                  desc="수의사가 만든 안전한 펫푸드" 
 
                  bgColor="bg-orange-100"
                  href="https://www.lovejuo.com/shop/item.php?it_id=1720665366"
                />
                <ProductCard 
                  imageSrc="/images/dog_adult.webp" 
                  title="프리미엄 성견용 사료" 
                  desc="수의사가 만든 안전한 펫푸드" 
                  bgColor="bg-rose-100"
                  href="https://www.lovejuo.com/shop/item.php?it_id=1724138094"
                />
                <ProductCard 
                  imageSrc="/images/chicken.webp" 
                  title="무항생제 닭가슴살" 
                  desc="깨끗하고 순수한 영양 간식" 
 
                  bgColor="bg-amber-100"
                  href="https://www.lovejuo.com/shop/item.php?it_id=1726028391"
                />
                <ProductCard 
                  imageSrc="/images/pollack.webp" 
                  title="무염 북어스틱" 
                  desc="첨가제 없는 100% 국산 보양식" 

                  bgColor="bg-sky-100"
                  href="https://www.lovejuo.com/shop/item.php?it_id=1730970663"
                />
              </motion.div>
            ) : (
              <motion.div 
                key="cat-products"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-2 gap-3"
              >
                <ProductCard 
                  imageSrc="/images/kitten.webp" 
                  title="프리미엄 키튼 사료" 
                  desc="수의사가 만든 안전한 펫푸드" 
 
                  bgColor="bg-indigo-100"
                  href="https://www.lovejuo.com/shop/item.php?it_id=1724137562"
                />
                <ProductCard 
                  imageSrc="/images/cat.webp" 
                  title="프리미엄 캣 사료" 
                  desc="수의사가 만든 안전한 펫푸드" 
                  bgColor="bg-fuchsia-100"
                  href="https://www.lovejuo.com/shop/item.php?it_id=1724137787"
                />
                <ProductCard 
                  imageSrc="/images/chicken.webp" 
                  title="무항생제 닭가슴살" 
                  desc="깨끗하고 순수한 영양 간식" 
 
                  bgColor="bg-amber-100"
                  href="https://www.lovejuo.com/shop/item.php?it_id=1726028391"
                />
                <ProductCard 
                  imageSrc="/images/pollack.webp" 
                  title="무염 북어스틱" 
                  desc="첨가제 없는 100% 국산 보양식" 

                  bgColor="bg-sky-100"
                  href="https://www.lovejuo.com/shop/item.php?it_id=1730970663"
                />
              </motion.div>
            )}
            
            <ActionButton 
              icon={<ShoppingCart weight="bold" className="text-xl" />} 
              label="주오 공식몰 바로가기" 
              href="https://www.lovejuo.com/shop/"
              onClick={() =>
                trackEvent("official_mall_click", {
                  location: "main_cta",
                })
              }
              primary 
            />
          </section>

          {/* 3. Event */}
          <section className="flex flex-col gap-3 w-full mt-4">
            <SectionHeader title="진행중인 이벤트" />
            <div className="grid grid-cols-1 gap-3">
              <EventCard
                badge="Test"
                title="멍BTI 맞춤 간식 찾기"
                desc="몇 가지 질문만으로 우리 아이 맞춤 간식을 찾아보세요"
                imageSrc="/images/test.webp"
                href="https://meong-bti.netlify.app/"
                onClick={() =>
                  trackEvent("meongbti_click", {
                    location: "event_card",
                  })
                }
              />
            </div>
          </section>

          {/* 4. Membership */}
          <section className="flex flex-col gap-3 w-full mt-4">
            <SectionHeader title="주오 멤버십" />
            <button 
              onClick={() => alert('안내 페이지 준비중입니다.')}
              className="flex flex-col items-start justify-center gap-2 p-5 bg-white border-2 border-slate-200 rounded-xl hover:border-slate-800 shadow-[4px_4px_0px_0px_rgba(30,41,59,0.1)] hover:shadow-[4px_4px_0px_0px_rgba(30,41,59,0.15)] hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] text-left group"
            >
              <div className="flex items-center gap-2 w-full">
                <div className="text-xl text-amber-400 group-hover:text-brand-coral-500 transition-colors">
                  <Crown weight="fill" />
                </div>
                <span className="text-sm font-bold text-slate-800">프리미엄 토탈 케어 알아보기</span>
                <div className="ml-auto text-slate-400 group-hover:text-slate-800">&rsaquo;</div>
              </div>
              <p className="text-[11px] font-medium text-slate-500 leading-relaxed mt-1">
                정기배송부터 예방 케어, 수술 지원까지.<br/>
                보호자가 반복해서 챙겨야 하는 항목을 한 흐름으로 묶었습니다.
              </p>
            </button>
          </section>

          {/* 5. Juo Company (Grid) */}
          <section className="flex flex-col gap-4 w-full mt-4">
            <SectionHeader title="Juo Company" />
            <div className="grid grid-cols-2 gap-3 w-full">
              <UniverseCard icon={<Storefront weight="duotone"/>} label="펫푸드주오" desc="제조사" href="https://www.lovejuo.com/" />
              <UniverseCard icon={<Scissors weight="duotone"/>} label="까까주오" desc="미용" />
              <UniverseCard icon={<CarProfile weight="duotone"/>} label="태워주오" desc="펫택시" />
              <UniverseCard icon={<FirstAid weight="duotone"/>} label="치료해주오" desc="병원" href="https://juohospital.imweb.me/" />
              <UniverseCard icon={<GraduationCap weight="duotone"/>} label="가르쳐주오" desc="훈련" />
              <UniverseCard icon={<Heart weight="duotone"/>} label="사랑해주오" desc="리호밍 센터" href="https://re-homing.org/" />
              <UniverseCard icon={<ShootingStar weight="duotone"/>} label="기억해주오" desc="장례식장(예정)" />
              <UniverseCard icon={<Tent weight="duotone"/>} label="놀아주오" desc="관광" />
              <UniverseCard icon={<ShieldStar weight="duotone"/>} label="토탈펫케어" desc="멤버십" />
              <UniverseCard icon={<HouseLine weight="duotone"/>} label="머물러주오" desc="호텔" />
            </div>
          </section>

          {/* 6. Footer */}
          <footer className="mt-6 pt-12 flex flex-col items-start gap-6 w-full">
            <ActionButton 
              icon={<MapPin weight="bold" className="text-xl" />} 
              label="가까운 직영/제휴 매장 찾기" 
              onClick={handleStoreFinderOpen}
            />
            
            <div className="flex gap-3">
              <SocialButton
                icon={<InstagramLogo weight="bold" />}
                href="https://www.instagram.com/petfood.thejuo/"
                variant="instagram"
                label="Insta"
                onClick={() => handleSocialClick("instagram")}
              />
              <SocialButton
                icon={<ChatCircleText weight="bold" />}
                href="http://pf.kakao.com/_xehxasn"
                variant="kakao"
                label="Kakao"
                onClick={() => handleSocialClick("kakao")}
              />
              <SocialButton
                icon={<NewspaperClipping weight="bold" />}
                variant="blog"
                label="Blog"
                onClick={() => handleSocialClick("blog")}
              />
            </div>
            
            <div className="flex flex-col items-start gap-1">
              <p className="text-xs font-bold text-slate-800 tracking-tight">
                &ldquo;사람이 먹을 수 없는 건, 주지 않습니다.&rdquo;
              </p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">
                &copy;&nbsp;2026 Petfood Juo.
              </p>
            </div>
          </footer>
        </motion.div>
      )}
      <AnimatePresence>
        {showStoreFinder ? (
          <StoreFinderSheet onClose={() => setShowStoreFinder(false)} />
        ) : null}
      </AnimatePresence>
    </>
  );
}

// Subcomponents

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">
        {title}
      </h2>
      <div className="h-[1px] flex-1 bg-slate-200"></div>
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="text-[11px] font-bold text-slate-600 border-2 border-slate-200 px-3 py-1 rounded-full bg-white/60 backdrop-blur-md">
      {label}
    </span>
  );
}

function ActionButton({ icon, label, primary = false, href, onClick }: { icon: React.ReactNode, label: string, primary?: boolean, href?: string, onClick?: () => void }) {
  const content = primary ? (
    <>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-coral-500 text-white shadow-[2px_2px_0px_0px_rgba(30,41,59,0.16)]">
          {icon}
        </div>
        <div className="flex flex-col items-start">
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-coral-500">
            Official
          </span>
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
    "relative w-full flex items-center justify-between overflow-hidden px-5 py-4 font-bold text-sm transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-coral-300 focus-visible:ring-offset-2",
    "border-2 rounded-xl",
    primary 
      ? "group min-h-[72px] bg-white text-slate-900 border-brand-coral-500 shadow-[4px_4px_0px_0px_rgba(255,107,107,0.22)] hover:bg-brand-coral-50/40 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(255,107,107,0.3)]" 
      : "bg-white text-slate-800 border-slate-200 shadow-[4px_4px_0px_0px_rgba(30,41,59,0.05)] hover:border-slate-800 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(30,41,59,0.15)]"
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function ProductCard({ imageSrc, title, desc, bgColor, href }: { imageSrc: string, title: string, desc: string, bgColor: string, href?: string }) {
  const content = (
    <>
      {/* Thumbnail Area */}
      <div className={clsx("relative w-full aspect-square rounded-lg mb-3 overflow-hidden flex items-center justify-center border-2 border-transparent group-hover:border-slate-800 transition-colors", bgColor)}>
        <Image 
          src={imageSrc} 
          alt={title}
          fill
          className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 430px) 50vw, 200px"
        />
      </div>
      
      {/* Content */}
      <div className="flex flex-col items-start px-1">
        <span className="text-sm font-bold text-slate-800 leading-tight">
          {title}
        </span>
        <span className="text-[10px] font-semibold text-slate-500 leading-tight mt-1 line-clamp-2">
          {desc}
        </span>
      </div>
    </>
  );

  const className = "relative flex flex-col p-3 bg-white border-2 border-slate-200 rounded-xl hover:border-slate-800 hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(30,41,59,0.05)] hover:shadow-[4px_4px_0px_0px_rgba(30,41,59,0.15)] transition-all duration-200 active:scale-95 text-left group";

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <button className={className}>
      {content}
    </button>
  );
}

function EventCard({ badge, title, desc, imageSrc, href, onClick }: { badge: string, title: string, desc: string, imageSrc?: string, href?: string, onClick?: () => void }) {
  const content = (
    <>
      <div className="relative w-full aspect-[16/9] overflow-hidden rounded-[18px] border border-slate-200 bg-slate-900">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, 420px"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_58%,#334155_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,107,107,0.34),transparent_34%)]" />
            <div className="absolute inset-x-0 top-0 h-16 bg-white/5" />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-sm">
                <Sparkle weight="duotone" className="text-2xl text-brand-coral-400" />
                <span className="text-xs font-semibold tracking-[0.16em] text-white/80 uppercase">
                  Image Slot
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col items-start gap-2">
          <span className="inline-flex items-center rounded-full bg-brand-coral-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
            {badge}
          </span>
          <div className="flex flex-col items-start gap-1">
            <span className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {title}
            </span>
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 leading-relaxed">
              {desc}
            </span>
          </div>
        </div>
        <div className="mt-0.5 flex h-10 min-w-[44px] items-center justify-center rounded-xl border border-brand-coral-200 bg-brand-coral-50 px-3 text-brand-coral-500 transition-all duration-200 group-hover:translate-x-1 group-hover:border-brand-coral-500 group-hover:bg-brand-coral-500 group-hover:text-white">
          <span className="text-base leading-none">&rarr;</span>
        </div>
      </div>
    </>
  );

  const className = "relative flex w-full flex-col gap-4 rounded-2xl border-2 border-slate-200 bg-white p-4 text-left transition-all duration-200 active:scale-[0.98] group hover:-translate-y-0.5 hover:border-slate-900 hover:shadow-[4px_4px_0px_0px_rgba(30,41,59,0.12)]";

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function UniverseCard({ icon, label, desc, href, onClick }: { icon: React.ReactNode, label: string, desc: string, href?: string, onClick?: () => void }) {
  const content = (
    <>
      <div className={clsx("text-2xl transition-colors mb-1", href ? "text-brand-coral-500" : "text-slate-400 group-hover:text-brand-coral-500")}>
        {icon}
      </div>
      <span className="text-sm font-bold text-slate-800">
        {label}
      </span>
      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
        {desc}
      </span>
    </>
  );

  const className = clsx(
    "flex flex-col items-start justify-center gap-1 p-4 backdrop-blur-sm border-2 rounded-xl transition-all duration-200 active:scale-95 text-left group",
    href 
      ? "bg-white border-brand-coral-500 shadow-[4px_4px_0px_0px_rgba(250,82,82,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(250,82,82,1)]" 
      : "bg-white/80 border-slate-200 hover:border-slate-800 hover:shadow-[4px_4px_0px_0px_rgba(30,41,59,0.1)] hover:-translate-y-0.5"
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function SocialButton({ icon, href, onClick, variant = "default", label }: { icon: React.ReactNode, href?: string, onClick?: () => void, variant?: "default" | "instagram" | "kakao" | "blog", label?: string }) {
  const className = clsx(
    "transition-all duration-200 border-2 active:scale-[0.98]",
    variant === "instagram" && "h-11 min-w-[72px] rounded-2xl flex items-center justify-center gap-1.5 bg-rose-50 text-rose-600 border-rose-200 px-3 hover:border-rose-500 hover:bg-rose-500 hover:text-white hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(244,63,94,0.12)] hover:shadow-[4px_4px_0px_0px_rgba(244,63,94,0.18)]",
    variant === "kakao" && "h-11 min-w-[76px] rounded-2xl flex items-center justify-center gap-1.5 bg-amber-100 text-amber-950 border-amber-200 px-3 hover:border-amber-400 hover:bg-amber-300 hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(245,158,11,0.12)] hover:shadow-[4px_4px_0px_0px_rgba(245,158,11,0.18)]",
    variant === "blog" && "h-11 min-w-[68px] rounded-2xl flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 px-3 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(5,150,105,0.12)] hover:shadow-[4px_4px_0px_0px_rgba(5,150,105,0.18)]",
    variant === "default" && "w-11 h-11 rounded-full flex items-center justify-center bg-white text-lg text-slate-800 border-slate-200 hover:border-slate-800 hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(30,41,59,0.05)] hover:shadow-[4px_4px_0px_0px_rgba(30,41,59,0.1)]"
  );

  const content = variant !== "default" ? (
    <>
      <span className="text-base leading-none">{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-[0.18em]">{label}</span>
    </>
  ) : (
    icon
  );
  
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}
