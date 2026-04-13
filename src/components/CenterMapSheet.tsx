"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { motion } from "framer-motion";
import { Clock, MapPin, Phone, SealWarning, X } from "@phosphor-icons/react";
import clsx from "clsx";
import type { CenterLocationConfig } from "@/data/linkPages/types";

type KakaoLatLng = object;

type KakaoLatLngBounds = {
  extend: (latlng: KakaoLatLng) => void;
};

type KakaoMapInstance = {
  panTo: (latlng: KakaoLatLng) => void;
  setLevel: (level: number) => void;
  setBounds: (
    bounds: KakaoLatLngBounds,
    top?: number,
    right?: number,
    bottom?: number,
    left?: number
  ) => void;
};

type KakaoCenterMaps = {
  load: (callback: () => void) => void;
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level: number }
  ) => KakaoMapInstance;
  Marker: new (options: {
    map: KakaoMapInstance;
    position: KakaoLatLng;
    title?: string;
  }) => void;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  LatLngBounds: new () => KakaoLatLngBounds;
};

type KakaoWindow = Window & { kakao?: { maps?: KakaoCenterMaps } };

type CenterMapSheetProps = {
  locations: CenterLocationConfig[];
  onClose: () => void;
};

export default function CenterMapSheet({ locations, onClose }: CenterMapSheetProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const kakao = (window as KakaoWindow).kakao;
    if (kakao?.maps) setScriptReady(true);
  }, []);

  useEffect(() => {
    if (!scriptReady || !mapContainerRef.current) return;
    const kakao = (window as KakaoWindow).kakao;
    if (!kakao?.maps) return;

    const maps = kakao.maps;
    maps.load(() => {
      if (!mapContainerRef.current) return;

      const first = locations[0];
      const map = new maps.Map(mapContainerRef.current, {
        center: new maps.LatLng(first.lat, first.lng),
        level: 9,
      });

      locations.forEach((loc) => {
        new maps.Marker({
          map,
          position: new maps.LatLng(loc.lat, loc.lng),
          title: loc.name,
        });
      });

      if (locations.length > 1) {
        const bounds = new maps.LatLngBounds();
        locations.forEach((loc) => bounds.extend(new maps.LatLng(loc.lat, loc.lng)));
        map.setBounds(bounds, 60, 60, 100, 60);
      }

      mapRef.current = map;
    });
  }, [scriptReady, locations]);

  function handleSelectLocation(index: number) {
    setSelectedIndex(index);
    const loc = locations[index];
    if (!mapRef.current || !loc) return;
    const kakao = (window as KakaoWindow).kakao;
    if (!kakao?.maps) return;
    mapRef.current.panTo(new kakao.maps.LatLng(loc.lat, loc.lng));
    mapRef.current.setLevel(4);
  }

  const selected = locations[selectedIndex];

  return (
    <>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY}&autoload=false`}
        onLoad={() => setScriptReady(true)}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-[430px] -translate-x-1/2 flex-col overflow-hidden rounded-t-2xl bg-white"
        style={{ maxHeight: "80dvh" }}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-coral-500">
              Location
            </p>
            <h2 className="text-base font-black tracking-tight text-slate-900">
              사랑해주오 리호밍센터
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-slate-200 text-slate-600 transition-colors hover:border-slate-900"
          >
            <X weight="bold" />
          </button>
        </div>

        <div ref={mapContainerRef} className="h-52 w-full shrink-0 bg-slate-100" />

        {locations.length > 1 && (
          <div className="flex gap-2 border-b border-slate-100 px-5 py-3">
            {locations.map((loc, i) => (
              <button
                key={i}
                onClick={() => handleSelectLocation(i)}
                className={clsx(
                  "rounded-lg border-2 px-4 py-1.5 text-sm font-black tracking-tight transition-all",
                  i === selectedIndex
                    ? "border-brand-coral-500 bg-brand-coral-500 text-white shadow-[3px_3px_0px_0px_var(--link-accent-shadow-strong)]"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-900"
                )}
              >
                {loc.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 overflow-y-auto p-5">
          <div className="flex items-start gap-3">
            <MapPin weight="bold" className="mt-0.5 shrink-0 text-brand-coral-500" />
            <span className="text-sm font-medium leading-snug text-slate-700">
              {selected.address}
            </span>
          </div>
          {selected.hours ? (
            <div className="flex items-start gap-3">
              <Clock weight="bold" className="mt-0.5 shrink-0 text-brand-coral-500" />
              <span className="text-sm font-medium text-slate-700">{selected.hours}</span>
            </div>
          ) : null}
          {selected.notice ? (
            <div className="flex items-start gap-3">
              <SealWarning weight="bold" className="mt-0.5 shrink-0 text-amber-500" />
              <span className="text-sm font-medium text-slate-500">{selected.notice}</span>
            </div>
          ) : null}
          {selected.phone ? (
            <div className="flex items-start gap-3">
              <Phone weight="bold" className="mt-0.5 shrink-0 text-brand-coral-500" />
              <a
                href={`tel:${selected.phone}`}
                className="text-sm font-medium text-slate-700 underline"
              >
                {selected.phone}
              </a>
            </div>
          ) : null}
        </div>
      </motion.div>
    </>
  );
}
