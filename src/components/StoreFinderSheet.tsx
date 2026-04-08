"use client";

import { useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { motion } from "framer-motion";
import { Copy, CrosshairSimple, MagnifyingGlass, MapPin, Sparkle, X } from "@phosphor-icons/react";
import clsx from "clsx";
import storeLocations from "@/data/storeLocations.json";
import { trackEvent } from "@/lib/analytics";

type StoreFinderSheetProps = {
  onClose: () => void;
};

type StoreCategory = "병원" | "펫샵" | "미용" | "훈련" | "보호소" | "기타";

const STORE_CATEGORIES: StoreCategory[] = ["병원", "펫샵", "미용", "훈련", "보호소", "기타"];

type StoreLocation = {
  id: string;
  name: string;
  category: StoreCategory;
  rawCategory: string;
  address: string;
  lat: number;
  lng: number;
};

type KakaoLatLng = {
  getLat: () => number;
  getLng: () => number;
};

type KakaoMapInstance = {
  setCenter: (latlng: KakaoLatLng) => void;
  setLevel: (level: number) => void;
  setBounds: (bounds: KakaoLatLngBoundsInstance, top?: number, right?: number, bottom?: number, left?: number) => void;
  panTo: (latlng: KakaoLatLng) => void;
};

type KakaoMarkerInstance = {
  setMap: (map: KakaoMapInstance | null) => void;
};

type KakaoLatLngBoundsInstance = {
  extend: (latlng: KakaoLatLng) => void;
};

type KakaoMaps = {
  load: (callback: () => void) => void;
  Map: new (
    container: HTMLElement,
    options: {
      center: KakaoLatLng;
      level: number;
    }
  ) => KakaoMapInstance;
  Marker: new (
    options: {
      map: KakaoMapInstance;
      position: KakaoLatLng;
      image: unknown;
      title: string;
    }
  ) => KakaoMarkerInstance;
  MarkerImage: new (
    src: string,
    size: unknown,
    options: {
      offset: unknown;
    }
  ) => unknown;
  Size: new (width: number, height: number) => unknown;
  Point: new (x: number, y: number) => unknown;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  LatLngBounds: new () => KakaoLatLngBoundsInstance;
  event: {
    addListener: (
      target: KakaoMarkerInstance,
      eventName: "click",
      handler: () => void
    ) => void;
  };
};

type KakaoWindow = Window & {
  kakao?: {
    maps?: KakaoMaps;
  };
};

const ALL_CATEGORY = "전체";
const MAP_CENTER = { lat: 36.35, lng: 127.82 };
const DIRECT_STORE_KEYWORDS = ["요미독", "요미캣", "사랑해주오", "치료해주오"];
const DIRECT_MARKER_COLOR = "#FF6B6B";
const CATEGORY_MARKER_COLORS: Record<StoreCategory, string> = {
  병원: "#4F8BFF",
  펫샵: "#F59E0B",
  미용: "#EC4899",
  훈련: "#10B981",
  보호소: "#8B5CF6",
  기타: "#475569",
};
const CATEGORY_BUTTON_STYLES: Record<StoreCategory, { active: string; idle: string }> = {
  병원: {
    active: "border-blue-500 bg-blue-500 text-white shadow-[2px_2px_0px_0px_rgba(79,139,255,0.35)]",
    idle: "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-500 hover:text-blue-800",
  },
  펫샵: {
    active: "border-amber-500 bg-amber-500 text-white shadow-[2px_2px_0px_0px_rgba(245,158,11,0.35)]",
    idle: "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-500 hover:text-amber-800",
  },
  미용: {
    active: "border-pink-500 bg-pink-500 text-white shadow-[2px_2px_0px_0px_rgba(236,72,153,0.35)]",
    idle: "border-pink-200 bg-pink-50 text-pink-700 hover:border-pink-500 hover:text-pink-800",
  },
  훈련: {
    active: "border-emerald-500 bg-emerald-500 text-white shadow-[2px_2px_0px_0px_rgba(16,185,129,0.35)]",
    idle: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-500 hover:text-emerald-800",
  },
  보호소: {
    active: "border-violet-500 bg-violet-500 text-white shadow-[2px_2px_0px_0px_rgba(139,92,246,0.35)]",
    idle: "border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-500 hover:text-violet-800",
  },
  기타: {
    active: "border-slate-700 bg-slate-700 text-white shadow-[2px_2px_0px_0px_rgba(71,85,105,0.28)]",
    idle: "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-500 hover:text-slate-900",
  },
};

function normalizeStoreName(name: string) {
  return name.replace(/^#\s*/, "").trim();
}

function isDirectStore(name: string) {
  return DIRECT_STORE_KEYWORDS.some((keyword) => name.includes(keyword));
}

function parseDisplayCategories(rawCategory: string): StoreCategory[] {
  type ParsedCategory = Exclude<StoreCategory, "기타">;

  const normalized = rawCategory
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      if (item.includes("병원")) return "병원";
      if (item.includes("분양샵")) return "펫샵";
      if (item.includes("미용실")) return "미용";
      if (item.includes("훈련소")) return "훈련";
      if (item.includes("보호소")) return "보호소";
      return null;
    })
    .filter((item): item is ParsedCategory => item !== null);

  return normalized.length > 0 ? Array.from(new Set(normalized)) : ["기타"];
}

function createMarkerImage(kakao: KakaoMaps, markerColor: string, isActive: boolean) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44" fill="none">
      <path d="M22 3C14.28 3 8 9.135 8 16.675C8 27.525 20.35 38.2 20.875 38.65C21.2 38.925 21.6 39.062 22 39.062C22.4 39.062 22.8 38.925 23.125 38.65C23.65 38.2 36 27.525 36 16.675C36 9.135 29.72 3 22 3Z" fill="${markerColor}"/>
      <circle cx="22" cy="16.5" r="6.5" fill="#FFF8F2"/>
      <circle cx="22" cy="16.5" r="2.6" fill="${markerColor}"/>
      ${isActive ? '<circle cx="22" cy="16.5" r="11.5" stroke="#FFF8F2" stroke-width="2.4"/>' : ""}
    </svg>
  `;

  return new kakao.MarkerImage(
    `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    new kakao.Size(isActive ? 40 : 34, isActive ? 40 : 34),
    {
      offset: new kakao.Point(isActive ? 20 : 17, isActive ? 38 : 32),
    }
  );
}

export default function StoreFinderSheet({ onClose }: StoreFinderSheetProps) {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;
  const storeLocationItems = storeLocations as StoreLocation[];
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const markersRef = useRef<KakaoMarkerInstance[]>([]);
  const currentLocationMarkerRef = useRef<KakaoMarkerInstance | null>(null);
  const mapSectionRef = useRef<HTMLDivElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const storeCardRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lastFilterSignatureRef = useRef("");
  const lastSearchSignatureRef = useRef("");

  const [mapReady, setMapReady] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<StoreCategory | typeof ALL_CATEGORY>(ALL_CATEGORY);
  const [showDirectOnly, setShowDirectOnly] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [copiedStoreId, setCopiedStoreId] = useState<string | null>(null);

  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const categoryOptions: Array<StoreCategory | typeof ALL_CATEGORY> = [ALL_CATEGORY, ...STORE_CATEGORIES];
  const preparedStores = storeLocationItems.map((store, index) => ({
    ...store,
    displayName: normalizeStoreName(store.name),
    displayCategories: parseDisplayCategories(store.rawCategory),
    isDirect: isDirectStore(store.name),
    listOrder: index,
  }));

  const filteredStores = preparedStores.filter((store) => {
    const matchesCategory =
      activeCategory === ALL_CATEGORY || store.displayCategories.includes(activeCategory);
    const matchesDirectOnly = !showDirectOnly || store.isDirect;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      store.displayName.toLowerCase().includes(normalizedQuery) ||
      store.address.toLowerCase().includes(normalizedQuery) ||
      store.displayCategories.some((category) => category.toLowerCase().includes(normalizedQuery)) ||
      store.rawCategory.toLowerCase().includes(normalizedQuery);

    return matchesCategory && matchesDirectOnly && matchesQuery;
  }).sort((left, right) => {
    if (left.isDirect !== right.isDirect) {
      return Number(right.isDirect) - Number(left.isDirect);
    }

    return left.listOrder - right.listOrder;
  });

  const effectiveSelectedStoreId = filteredStores.some((store) => store.id === selectedStoreId)
    ? selectedStoreId
    : null;

  const selectedStore =
    filteredStores.find((store) => store.id === effectiveSelectedStoreId) ?? null;

  const handleStoreSelect = useCallback((
    store: (typeof preparedStores)[number],
    source: "map_pin" | "list_card"
  ) => {
    setSelectedStoreId(store.id);

    if (source === "list_card") {
      mapSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    trackEvent("store_select", {
      source,
      store_name: store.displayName,
      store_category: store.category,
      store_categories: store.displayCategories.join(","),
      is_direct: store.isDirect ? "true" : "false",
    });
  }, []);

  useEffect(() => {
    if (!appKey || !scriptReady || !mapContainerRef.current || mapRef.current) {
      return;
    }

    const kakao = (window as KakaoWindow).kakao;
    const maps = kakao?.maps;
    if (!maps) {
      return;
    }

    maps.load(() => {
      if (!mapContainerRef.current) {
        return;
      }

      mapRef.current = new maps.Map(mapContainerRef.current, {
        center: new maps.LatLng(MAP_CENTER.lat, MAP_CENTER.lng),
        level: 13,
      });
      setScriptError(null);
      setMapReady(true);
    });
  }, [appKey, scriptReady]);

  useEffect(() => {
    const kakao = (window as KakaoWindow).kakao;
    const maps = kakao?.maps;
    const map = mapRef.current;

    if (!mapReady || !maps || !map) {
      return;
    }

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (filteredStores.length === 0) {
      return;
    }

    const bounds = new maps.LatLngBounds();
    const filterSignature = `${activeCategory}|${showDirectOnly}|${normalizedQuery}|${filteredStores
      .map((store) => store.id)
      .join(",")}`;
    const filtersChanged = lastFilterSignatureRef.current !== filterSignature;
    lastFilterSignatureRef.current = filterSignature;

    filteredStores.forEach((store) => {
      const position = new maps.LatLng(store.lat, store.lng);
      const markerColor = store.isDirect
        ? DIRECT_MARKER_COLOR
        : CATEGORY_MARKER_COLORS[store.category];
      const marker = new maps.Marker({
        map,
        position,
        image: createMarkerImage(maps, markerColor, store.id === selectedStore?.id),
        title: store.displayName,
      });

      maps.event.addListener(marker, "click", () => {
        handleStoreSelect(store, "map_pin");
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    if (filtersChanged) {
      if (filteredStores.length === 1) {
        map.setCenter(new maps.LatLng(filteredStores[0].lat, filteredStores[0].lng));
        map.setLevel(4);
      } else {
        map.setBounds(bounds, 56, 56, 56, 56);
      }
      return;
    }

    if (selectedStore) {
      map.panTo(new maps.LatLng(selectedStore.lat, selectedStore.lng));
    }
  }, [activeCategory, mapReady, normalizedQuery, filteredStores, selectedStore, handleStoreSelect, showDirectOnly]);

  useEffect(() => {
    if (normalizedQuery.length === 0) {
      return;
    }

    const signature = `${normalizedQuery}|${activeCategory}|${showDirectOnly}|${filteredStores.length}`;
    if (lastSearchSignatureRef.current === signature) {
      return;
    }

    const timeout = window.setTimeout(() => {
      lastSearchSignatureRef.current = signature;
      trackEvent("store_search", {
        active_category: activeCategory,
        direct_only: showDirectOnly ? 'true' : 'false',
        query_length: normalizedQuery.length,
        result_count: filteredStores.length,
        has_result: filteredStores.length > 0 ? "true" : "false",
      });
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [activeCategory, filteredStores.length, normalizedQuery, showDirectOnly]);

  const handleLocateMe = () => {
    trackEvent("locate_me_click", {
      source: "store_finder_map",
    });

    if (!navigator.geolocation) {
      setLocationError("현재 브라우저에서는 위치 기능을 사용할 수 없어요.");
      return;
    }

    const kakao = (window as KakaoWindow).kakao;
    const maps = kakao?.maps;
    const map = mapRef.current;

    if (!maps || !mapReady || !map) {
      setLocationError("지도가 준비되면 내 위치를 확인할 수 있어요.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLatLng = new maps.LatLng(position.coords.latitude, position.coords.longitude);
        currentLocationMarkerRef.current?.setMap(null);
        currentLocationMarkerRef.current = new maps.Marker({
          map,
          position: currentLatLng,
          image: createMarkerImage(maps, "#1E293B", true),
          title: "내 위치",
        });
        map.setCenter(currentLatLng);
        map.setLevel(4);
        setIsLocating(false);
      },
      () => {
        setLocationError("위치 권한을 허용하면 현재 위치로 이동할 수 있어요.");
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  const handleCopyAddress = async (storeId: string, address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedStoreId(storeId);
      trackEvent("store_address_copy", {
        store_id: storeId,
      });
      window.setTimeout(() => {
        setCopiedStoreId((current) => (current === storeId ? null : current));
      }, 1600);
    } catch {
      setLocationError("주소 복사에 실패했어요. 다시 시도해주세요.");
    }
  };

  return (
    <>
      {appKey ? (
        <Script
          id="kakao-map-sdk"
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`}
          strategy="afterInteractive"
          onReady={() => setScriptReady(true)}
          onError={() => setScriptError("카카오맵 스크립트를 불러오지 못했어요.")}
        />
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="absolute inset-0 z-40 bg-slate-50"
      >
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="sticky top-0 z-10 border-b-2 border-slate-200 bg-slate-50/95 px-5 pb-4 pt-5 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col items-start gap-2">
                <span className="inline-flex items-center rounded-full bg-brand-coral-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                  Store Finder
                </span>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900">
                    가까운 직영/제휴 매장 찾기
                  </h2>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    업체명, 주소, 카테고리로 빠르게 찾아보세요.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-900 hover:text-slate-900"
                aria-label="매장 찾기 닫기"
              >
                <X weight="bold" className="text-lg" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 px-5 py-4 pb-6">
            <div className="relative">
              <MagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="업체명 또는 지역을 검색해보세요"
                className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-white pl-12 pr-4 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-coral-500"
              />
            </div>
            {locationError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
                {locationError}
              </div>
            ) : null}

            <div
              ref={mapSectionRef}
              className="relative min-h-[240px] scroll-mt-24 overflow-hidden rounded-[24px] border-2 border-slate-200 bg-white shadow-[4px_4px_0px_0px_rgba(30,41,59,0.08)]"
            >
              {appKey ? (
                <>
                  <div ref={mapContainerRef} className="h-[34vh] min-h-[240px] w-full bg-slate-100" />
                  <button
                    type="button"
                    onClick={handleLocateMe}
                    className="absolute bottom-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-slate-700 shadow-[2px_2px_0px_0px_rgba(30,41,59,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-900 hover:text-slate-900"
                    aria-label="내 위치로 이동"
                  >
                    <CrosshairSimple weight="bold" className={clsx("text-lg", isLocating && "animate-pulse")} />
                  </button>
                  {scriptError ? (
                    <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
                      {scriptError}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="flex h-[34vh] min-h-[240px] w-full flex-col items-start justify-center gap-2 bg-[linear-gradient(135deg,#fff8f2_0%,#fff1eb_100%)] px-5">
                  <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-brand-coral-500">
                    Kakao Map
                  </span>
                  <strong className="text-base font-black tracking-tight text-slate-900">
                    지도 영역은 바로 준비돼 있어요
                  </strong>
                  <p className="max-w-[280px] text-xs font-medium leading-relaxed text-slate-500">
                    <code className="rounded bg-white px-1.5 py-0.5 font-bold text-slate-700">
                      NEXT_PUBLIC_KAKAO_MAP_APP_KEY
                    </code>{" "}
                    를 연결하면 이 영역에 카카오맵이 표시됩니다.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center px-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                <MapPin weight="fill" className="text-brand-coral-500" />
                <span>{filteredStores.length}개 제휴처</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextValue = !showDirectOnly;
                    setShowDirectOnly(nextValue);
                    trackEvent("store_filter_select", {
                      category: nextValue ? "직영만" : "전체",
                    });
                  }}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-black tracking-[0.12em] shadow-[2px_2px_0px_0px_rgba(30,41,59,0.08)] transition-all duration-200 hover:-translate-y-0.5",
                    showDirectOnly
                      ? "border-brand-coral-500 bg-[linear-gradient(135deg,#ff7f7f_0%,#ff6b6b_100%)] text-white shadow-[3px_3px_0px_0px_rgba(255,107,107,0.22)]"
                      : "border-brand-coral-200 bg-white text-brand-coral-600 hover:border-brand-coral-500 hover:bg-brand-coral-50 hover:text-brand-coral-700"
                  )}
                >
                  <Sparkle weight="fill" className="text-[11px]" />
                  직영만 보기
                </button>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categoryOptions.map((category) => {
                const isActive = activeCategory === category;
                const style =
                  category === ALL_CATEGORY
                    ? null
                    : CATEGORY_BUTTON_STYLES[category];
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      setActiveCategory(category);
                      trackEvent("store_filter_select", {
                        category,
                      });
                    }}
                    className={clsx(
                      "shrink-0 rounded-full border-2 px-4 py-2 text-xs font-bold tracking-tight transition-all duration-200",
                      category === ALL_CATEGORY &&
                        (isActive
                          ? "border-slate-900 bg-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(255,107,107,0.65)]"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"),
                      category !== ALL_CATEGORY && (isActive ? style?.active : style?.idle)
                    )}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            {selectedStore ? (
              <div
                className={clsx(
                  "relative overflow-hidden rounded-2xl border-2 p-4 shadow-[4px_4px_0px_0px_rgba(30,41,59,0.08)]",
                  selectedStore.isDirect
                    ? "border-brand-coral-500 bg-[linear-gradient(135deg,#1f2937_0%,#111827_68%,#0f172a_100%)] text-white shadow-[4px_4px_0px_0px_rgba(255,107,107,0.38)]"
                    : "border-slate-900 bg-slate-900 text-white"
                )}
              >
                {selectedStore.isDirect ? (
                  <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-brand-coral-500/20 blur-3xl" />
                ) : null}
                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-col gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-coral-200">
                      Selected Store
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedStore.displayCategories.map((category) => (
                        <span
                          key={`selected-${selectedStore.id}-${category}`}
                          className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-900"
                        >
                          {category}
                        </span>
                      ))}
                      {selectedStore.isDirect ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                          <Sparkle weight="fill" className="text-[11px]" />
                          직영
                        </span>
                      ) : null}
                    </div>
                    <strong className="text-base font-black tracking-tight">{selectedStore.displayName}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStoreId(null)}
                    className="relative z-10 inline-flex shrink-0 items-center gap-1 rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition-all duration-200 hover:bg-white/14"
                  >
                    <X className="text-[10px]" weight="bold" />
                    해제
                  </button>
                </div>

                <div className="relative mt-3 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/8 px-3 py-3">
                  <MapPin weight="fill" className="mt-0.5 shrink-0 text-sm text-brand-coral-200" />
                  <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                    <p className="text-xs font-medium leading-relaxed text-slate-200">
                      {selectedStore.address}
                    </p>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleCopyAddress(selectedStore.id, selectedStore.address);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          handleCopyAddress(selectedStore.id, selectedStore.address);
                        }
                      }}
                      className={clsx(
                        "mt-0.5 inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold transition-all duration-200",
                        copiedStoreId === selectedStore.id
                          ? "border-white/20 bg-white/14 text-white"
                          : "border-white/10 bg-white/6 text-slate-100 hover:bg-white/12"
                      )}
                      aria-label={`${selectedStore.displayName} 주소 복사`}
                    >
                      <Copy className="text-[10px]" weight="bold" />
                      {copiedStoreId === selectedStore.id ? "복사됨" : "복사"}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 pb-2">
              {filteredStores.length > 0 ? (
                filteredStores.map((store) => {
                  const isSelected = store.id === selectedStore?.id;
                  return (
                    <button
                      key={store.id}
                      ref={(node) => {
                        storeCardRefs.current[store.id] = node;
                      }}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => handleStoreSelect(store, "list_card")}
                      className={clsx(
                        "relative flex w-full scroll-mt-4 flex-col items-start gap-3 overflow-hidden rounded-2xl border-2 p-4 text-left transition-all duration-200 active:scale-[0.98]",
                        store.isDirect
                          ? "border-brand-coral-200 bg-[linear-gradient(135deg,#fff8f2_0%,#ffffff_68%)] text-slate-900 shadow-[3px_3px_0px_0px_rgba(255,107,107,0.16)] hover:-translate-y-0.5 hover:border-brand-coral-500 hover:shadow-[5px_5px_0px_0px_rgba(255,107,107,0.22)]"
                          : "border-slate-200 bg-white text-slate-900 hover:-translate-y-0.5 hover:border-slate-900 hover:shadow-[4px_4px_0px_0px_rgba(30,41,59,0.12)]"
                      )}
                    >
                      {store.isDirect ? (
                        <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-brand-coral-200/45 blur-2xl" />
                      ) : null}
                      <div className="flex w-full items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {store.displayCategories.map((category) => (
                              <span
                                key={`${store.id}-${category}`}
                                className={clsx(
                                  "inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
                                  CATEGORY_BUTTON_STYLES[category].idle
                                )}
                              >
                                {category}
                              </span>
                            ))}
                            {store.isDirect ? (
                              <span
                                className="inline-flex items-center gap-1 rounded-full border border-brand-coral-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-brand-coral-600"
                              >
                                <Sparkle weight="fill" className="text-[11px]" />
                                직영
                              </span>
                            ) : null}
                          </div>
                          <strong className="text-sm font-black tracking-tight">
                            {store.displayName}
                          </strong>
                        </div>
                        <div
                          className={clsx(
                            "flex h-10 min-w-[44px] items-center justify-center rounded-xl border px-3 transition-all duration-200",
                            store.isDirect
                              ? "border-brand-coral-200 bg-white text-brand-coral-500"
                              : "border-slate-200 bg-slate-50 text-slate-700"
                          )}
                        >
                          <MapPin weight="fill" className="text-base" />
                        </div>
                      </div>

                      <div
                        className={clsx(
                          "flex w-full items-start gap-3 rounded-2xl border px-3 py-3",
                          store.isDirect
                            ? "border-brand-coral-100 bg-brand-coral-50/55"
                            : "border-slate-100 bg-slate-50"
                        )}
                      >
                        <MapPin
                          weight="fill"
                          className={clsx(
                            "mt-0.5 shrink-0 text-sm",
                            store.isDirect ? "text-brand-coral-400" : "text-slate-400"
                          )}
                        />
                        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                          <p
                            className="text-xs font-medium leading-relaxed text-slate-500"
                          >
                            {store.address}
                          </p>
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleCopyAddress(store.id, store.address);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                event.stopPropagation();
                                handleCopyAddress(store.id, store.address);
                              }
                            }}
                            className={clsx(
                              "mt-0.5 inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold transition-all duration-200",
                              copiedStoreId === store.id
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-800"
                            )}
                            aria-label={`${store.displayName} 주소 복사`}
                          >
                            <Copy className="text-[10px]" weight="bold" />
                            {copiedStoreId === store.id ? "복사됨" : "복사"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-5 py-8 text-center">
                  <p className="text-sm font-bold text-slate-800">검색 결과가 없어요</p>
                  <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500">
                    다른 지역명이나 업체명으로 다시 찾아보세요.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
