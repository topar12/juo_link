'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Script from 'next/script';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  AlertTriangle,
  RefreshCw,
  X,
  MapPin,
  Loader2,
  Crosshair,
} from 'lucide-react';
import { STORE_CATEGORIES, type StoreCategory, type StoreLocation } from '@/lib/stores';

// 매장 데이터(D1) CRUD 편집기.
// 공개 매장찾기(StoreFinderSheet, 카카오맵)가 쓰는 stores 데이터를 /admin 에서
// 코드 수정·재배포 없이 관리한다. 제휴처가 계속 늘어나므로 표 + 추가/수정 모달로 다룬다.
// /admin 은 Cloudflare Access 로 보호되므로 브라우저는 이미 인증되어 있다 →
// same-origin fetch 가 세션 쿠키를 그대로 실어 보내므로 별도 인증 코드는 없다.
//
// 음식 편집기(FoodsManager)와 동일한 구조·다크 톤(bg-[#18181B] 카드 + border-[#27272A]
// + animate-shimmer)을 그대로 따르되, 좌표 입력만 카카오 지오코딩으로 보강한다.
// 매장은 음식과 달리 위험(안전) 데이터가 아니므로 삭제 시 강조 경고는 두지 않는다.

const ADMIN_STORES_ENDPOINT = '/admin/api/stores';

// ─── 카테고리 다크 테마 배지 색 ─────────────────────────────────
// 공개 시트(StoreFinderSheet)의 라이트 테마 칩 색은 재사용하지 않고,
// 여기선 다크 대시보드에 맞춘 "옅은 배경 + 또렷한 텍스트" 배지를 쓴다.
type CategoryMeta = {
  // 표 배지 + 선택된 셀렉트 강조
  badgeClassName: string;
  // 칩 앞 점 색
  dotClassName: string;
};

const CATEGORY_META: Record<StoreCategory, CategoryMeta> = {
  병원: {
    badgeClassName: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    dotClassName: 'bg-blue-400',
  },
  펫샵: {
    badgeClassName: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    dotClassName: 'bg-amber-400',
  },
  미용: {
    badgeClassName: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    dotClassName: 'bg-pink-400',
  },
  훈련: {
    badgeClassName: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    dotClassName: 'bg-emerald-400',
  },
  보호소: {
    badgeClassName: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    dotClassName: 'bg-violet-400',
  },
  기타: {
    badgeClassName: 'text-slate-300 bg-slate-500/10 border-slate-500/20',
    dotClassName: 'bg-slate-400',
  },
};

// 카테고리 필터 칩에 쓸 "전체" 항목(개별 카테고리 앞에 둔다)
const ALL_CATEGORY = '전체';

// ─── 카카오 지오코더 최소 타이핑 ────────────────────────────────
// StoreFinderSheet 의 KakaoWindow 스타일을 따르되, 여기선 주소→좌표 변환만 하므로
// maps.load 와 services.Geocoder / services.Status 만 정의한다.
type KakaoGeocoderResult = {
  // addressSearch 결과의 경위도. 카카오는 x=경도(lng), y=위도(lat)를 문자열로 준다.
  x: string;
  y: string;
};

type KakaoGeocoder = {
  addressSearch: (
    address: string,
    callback: (result: KakaoGeocoderResult[], status: string) => void
  ) => void;
};

type KakaoMapsServices = {
  Geocoder: new () => KakaoGeocoder;
  Status: { OK: string };
};

type KakaoMaps = {
  load: (callback: () => void) => void;
  services: KakaoMapsServices;
};

type KakaoWindow = Window & {
  kakao?: {
    maps?: KakaoMaps;
  };
};

// ─── 폼 상태 타입 ───────────────────────────────────────────────
// lat/lng 는 number 입력이지만 빈 값/편집 중간 상태를 표현하려고 폼에선 문자열로 다룬다.
interface StoreFormState {
  id: string;
  name: string;
  category: StoreCategory;
  rawCategory: string;
  address: string;
  lat: string;
  lng: string;
}

const EMPTY_FORM: StoreFormState = {
  id: '',
  name: '',
  category: '병원',
  rawCategory: '',
  address: '',
  lat: '',
  lng: '',
};

// 항목 → 폼 상태(수정 모드 진입 시)
function itemToForm(item: StoreLocation): StoreFormState {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    rawCategory: item.rawCategory ?? '',
    address: item.address,
    // number → 문자열. 0 도 그대로 보이게 빈 문자열 처리하지 않는다.
    lat: Number.isFinite(item.lat) ? String(item.lat) : '',
    lng: Number.isFinite(item.lng) ? String(item.lng) : '',
  };
}

export default function StoresManager() {
  const [items, setItems] = useState<StoreLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  // 카테고리 필터 칩: '전체' 또는 6종 중 하나
  const [categoryFilter, setCategoryFilter] = useState<StoreCategory | typeof ALL_CATEGORY>(
    ALL_CATEGORY
  );

  // 폼(모달) 상태: null=닫힘, 'create'=신규, StoreLocation=해당 항목 수정
  const [editorTarget, setEditorTarget] = useState<'create' | StoreLocation | null>(null);
  // 삭제 확인 대상
  const [deleteTarget, setDeleteTarget] = useState<StoreLocation | null>(null);

  // ─── 목록 조회 ────────────────────────────────────────────────
  const fetchStores = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(ADMIN_STORES_ENDPOINT, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`목록을 불러오지 못했어요 (HTTP ${res.status})`);
      }
      const data = (await res.json()) as StoreLocation[];
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('stores fetch error:', error);
      setLoadError(
        error instanceof Error ? error.message : '목록을 불러오는 중 오류가 발생했어요.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // ─── 클라이언트 검색(이름/주소) + 카테고리 필터 + 정렬 ─────────
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items
      .filter((item) => {
        if (categoryFilter !== ALL_CATEGORY && item.category !== categoryFilter) {
          return false;
        }
        if (normalized.length === 0) return true;
        return [item.name, item.address].some((token) =>
          token.toLowerCase().includes(normalized)
        );
      })
      // 이름순(한글 우선) — 공개 시트의 listOrder 와 달리 관리 표는 찾기 쉽게 가나다순.
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [items, query, categoryFilter]);

  // 카테고리별 개수(필터 칩 옆 카운트용)
  const counts = useMemo(() => {
    const base: Record<StoreCategory, number> = {
      병원: 0,
      펫샵: 0,
      미용: 0,
      훈련: 0,
      보호소: 0,
      기타: 0,
    };
    for (const item of items) {
      if (item.category in base) base[item.category] += 1;
    }
    return base;
  }, [items]);

  // 저장/삭제 성공 후 목록 갱신 + 패널 닫기
  const handleSaved = useCallback(() => {
    setEditorTarget(null);
    fetchStores();
  }, [fetchStores]);

  const handleDeleted = useCallback(() => {
    setDeleteTarget(null);
    fetchStores();
  }, [fetchStores]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#09090B]/80 backdrop-blur-xl border-b border-[#1e1e23]">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-[24px]">📍</span>
            <div>
              <h1 className="text-[18px] font-bold text-white tracking-tight">매장 데이터</h1>
              <p className="text-[12px] text-[#52525B] mt-0.5">
                공개 매장찾기(카카오맵)에 쓰이는 직영·제휴 매장 데이터
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchStores}
              className="w-8 h-8 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-center text-[#52525B] hover:text-white hover:border-[#3f3f46] transition-all duration-200 active:scale-95"
              title="새로고침"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={() => setEditorTarget('create')}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#6366F1] text-white text-[13px] font-semibold hover:bg-[#5457E5] transition-all duration-200 active:scale-95 shadow-lg shadow-indigo-500/20"
            >
              <Plus size={15} />
              매장 추가
            </button>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* 카테고리 필터 칩 + 검색 */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {/* 전체 칩 */}
            <button
              type="button"
              onClick={() => setCategoryFilter(ALL_CATEGORY)}
              className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                categoryFilter === ALL_CATEGORY
                  ? 'text-white bg-[#6366F1]/15 border-[#6366F1]/30'
                  : 'text-[#71717A] border-[#27272A] hover:text-[#A1A1AA] hover:border-[#3f3f46]'
              }`}
            >
              전체
              <span className="text-[#71717A] font-semibold tabular-nums">{items.length}</span>
            </button>
            {/* 카테고리별 칩 */}
            {STORE_CATEGORIES.map((category) => {
              const meta = CATEGORY_META[category];
              const active = categoryFilter === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setCategoryFilter(category)}
                  className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                    active
                      ? meta.badgeClassName
                      : 'text-[#71717A] border-[#27272A] hover:text-[#A1A1AA] hover:border-[#3f3f46]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClassName}`} />
                  {category}
                  <span className="text-[#71717A] font-semibold tabular-nums">
                    {counts[category]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-72">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B] pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="매장명·주소로 검색"
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#18181B] border border-[#27272A] text-[13px] text-white placeholder:text-[#52525B] outline-none focus:border-[#6366F1]/50 transition-colors"
            />
          </div>
        </div>

        {/* 로딩: 다크 시머 */}
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-14 bg-[#18181B] rounded-xl border border-[#27272A] animate-shimmer"
              />
            ))}
          </div>
        )}

        {/* 에러 */}
        {!loading && loadError && (
          <div className="bg-[#18181B] rounded-2xl border border-red-500/20 p-6 flex flex-col items-center text-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-400" />
            </div>
            <p className="text-[14px] font-semibold text-white">{loadError}</p>
            <button
              type="button"
              onClick={fetchStores}
              className="mt-1 flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#27272A] text-[#A1A1AA] text-[13px] font-medium hover:text-white transition-colors"
            >
              <RefreshCw size={14} />
              다시 시도
            </button>
          </div>
        )}

        {/* 표 */}
        {!loading && !loadError && (
          <StoresTable
            items={filtered}
            totalCount={items.length}
            onEdit={(item) => setEditorTarget(item)}
            onDelete={(item) => setDeleteTarget(item)}
          />
        )}
      </main>

      {/* 추가/수정 모달 */}
      {editorTarget && (
        <StoreEditorModal
          target={editorTarget}
          onClose={() => setEditorTarget(null)}
          onSaved={handleSaved}
        />
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <DeleteConfirmModal
          item={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 표
// ─────────────────────────────────────────────────────────────────
interface StoresTableProps {
  items: StoreLocation[];
  totalCount: number;
  onEdit: (item: StoreLocation) => void;
  onDelete: (item: StoreLocation) => void;
}

function StoresTable({ items, totalCount, onEdit, onDelete }: StoresTableProps) {
  // 결과가 비었을 때(전체가 0개인지, 검색·필터에 안 걸린 건지 구분)
  if (items.length === 0) {
    return (
      <div className="bg-[#18181B] rounded-2xl border border-[#27272A] p-12 flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#27272A] flex items-center justify-center">
          <MapPin size={22} className="text-[#52525B]" />
        </div>
        <p className="text-[14px] font-semibold text-white">
          {totalCount === 0 ? '아직 등록된 매장이 없어요' : '검색 결과가 없어요'}
        </p>
        <p className="text-[12px] text-[#52525B]">
          {totalCount === 0
            ? '오른쪽 위 “매장 추가”로 첫 매장을 등록해 보세요.'
            : '다른 매장명·주소로 검색하거나 카테고리 필터를 바꿔 보세요.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#18181B] rounded-2xl border border-[#27272A] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#27272A]">
              <th className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider px-4 py-3">
                매장
              </th>
              <th className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider px-4 py-3">
                카테고리
              </th>
              <th className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                주소
              </th>
              <th className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                좌표
              </th>
              <th className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider px-4 py-3 text-right">
                관리
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const meta = CATEGORY_META[item.category];
              return (
                <tr
                  key={item.id}
                  className="border-b border-[#1e1e23] last:border-b-0 hover:bg-[#1c1c22]/60 transition-colors"
                >
                  {/* 이름 (+ 슬러그 id) */}
                  <td className="px-4 py-3 align-middle">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-white truncate max-w-[200px]">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-[#52525B] font-mono truncate max-w-[200px]">
                        {item.id}
                      </p>
                    </div>
                  </td>

                  {/* 카테고리 배지 */}
                  <td className="px-4 py-3 align-middle">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-lg border whitespace-nowrap ${meta.badgeClassName}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClassName}`} />
                      {item.category}
                    </span>
                  </td>

                  {/* 주소(잘림) */}
                  <td className="px-4 py-3 align-middle hidden md:table-cell">
                    <p className="text-[12px] text-[#A1A1AA] max-w-[280px] truncate">
                      {item.address}
                    </p>
                  </td>

                  {/* 좌표(모노, 작게) */}
                  <td className="px-4 py-3 align-middle hidden lg:table-cell">
                    <p className="text-[11px] text-[#71717A] font-mono whitespace-nowrap tabular-nums">
                      {item.lat.toFixed(5)}, {item.lng.toFixed(5)}
                    </p>
                  </td>

                  {/* 행 액션 */}
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-[#27272A] text-[#A1A1AA] text-[12px] font-medium hover:text-white hover:bg-[#323238] transition-colors"
                      >
                        <Pencil size={13} />
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-[#27272A] text-[#A1A1AA] text-[12px] font-medium hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={13} />
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 추가/수정 모달 (+ 카카오 주소→좌표 지오코딩)
// ─────────────────────────────────────────────────────────────────
interface StoreEditorModalProps {
  target: 'create' | StoreLocation;
  onClose: () => void;
  onSaved: () => void;
}

function StoreEditorModal({ target, onClose, onSaved }: StoreEditorModalProps) {
  const isEdit = target !== 'create';
  const [form, setForm] = useState<StoreFormState>(isEdit ? itemToForm(target) : EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  // 서버 검증 에러(400/404/409 의 { error }) 또는 네트워크 에러 메시지
  const [serverError, setServerError] = useState<string | null>(null);

  // ─ 카카오 지오코더 상태 ─
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;
  // SDK + services 라이브러리 로드 완료 여부(maps.load 콜백에서 true).
  const [geocoderReady, setGeocoderReady] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  // 지오코딩 안내(주소 못 찾음 등) — 서버 에러와 구분해 좌표 옆에 노출.
  const [geocodeHint, setGeocodeHint] = useState<string | null>(null);

  const update = <K extends keyof StoreFormState>(key: K, value: StoreFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // 카카오 SDK 스크립트 onReady → maps.load 로 services 까지 준비되면 버튼 활성화.
  const handleScriptReady = useCallback(() => {
    const maps = (window as KakaoWindow).kakao?.maps;
    if (!maps) return;
    maps.load(() => setGeocoderReady(true));
  }, []);

  // "좌표 찾기": 입력된 주소 → 카카오 지오코딩 → lat/lng 채움.
  // 결과가 있으면 폼 좌표를 덮어쓰되, 사용자가 다시 수동 수정할 수 있다(override 가능).
  const handleGeocode = useCallback(() => {
    const address = form.address.trim();
    if (!address || !geocoderReady) return;

    setGeocodeHint(null);
    setGeocoding(true);

    const maps = (window as KakaoWindow).kakao?.maps;
    if (!maps) {
      setGeocoding(false);
      setGeocodeHint('지도 SDK가 아직 준비되지 않았어요. 잠시 후 다시 시도하거나 직접 입력하세요.');
      return;
    }

    const geocoder = new maps.services.Geocoder();
    geocoder.addressSearch(address, (result, status) => {
      setGeocoding(false);
      if (status === maps.services.Status.OK && result[0]) {
        // 카카오: x=경도(lng), y=위도(lat). 문자열이라 parseFloat 로 변환.
        setForm((prev) => ({
          ...prev,
          lat: String(parseFloat(result[0].y)),
          lng: String(parseFloat(result[0].x)),
        }));
      } else {
        setGeocodeHint('주소를 찾을 수 없어요 — 직접 입력하세요.');
      }
    });
  }, [form.address, geocoderReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // 가벼운 클라이언트 사전 검증(서버 검증 모듈이 최종 진실원 — 여기선 UX 보조용)
    if (form.name.trim().length === 0) {
      setServerError('매장명을 입력해 주세요.');
      return;
    }
    if (form.address.trim().length === 0) {
      setServerError('주소를 입력해 주세요.');
      return;
    }
    const lat = Number(form.lat);
    const lng = Number(form.lng);
    if (form.lat.trim().length === 0 || form.lng.trim().length === 0 || Number.isNaN(lat) || Number.isNaN(lng)) {
      setServerError('좌표(위도·경도)를 입력해 주세요. “좌표 찾기”로 자동 입력할 수 있어요.');
      return;
    }

    // 폼 → API 바디. rawCategory 는 비어있으면 보내지 않는다(서버가 category 로 기본).
    const payload: {
      name: string;
      category: StoreCategory;
      address: string;
      lat: number;
      lng: number;
      rawCategory?: string;
      id?: string;
    } = {
      name: form.name.trim(),
      category: form.category,
      address: form.address.trim(),
      lat,
      lng,
    };
    const rawCategory = form.rawCategory.trim();
    if (rawCategory) payload.rawCategory = rawCategory;
    // 신규일 때만 id 를 (있으면) 보낸다. 수정은 경로 파라미터로 식별하므로 바디 id 불필요.
    if (!isEdit) {
      const id = form.id.trim();
      if (id) payload.id = id;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        isEdit
          ? `${ADMIN_STORES_ENDPOINT}/${encodeURIComponent(target.id)}`
          : ADMIN_STORES_ENDPOINT,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const json = (await res.json().catch(() => null)) as
        | { ok: true; item: StoreLocation }
        | { ok: false; error: string }
        | null;

      if (!res.ok || !json || json.ok === false) {
        // 서버 검증 에러를 폼에 그대로 노출
        const message =
          json && 'error' in json && json.error
            ? json.error
            : `저장에 실패했어요 (HTTP ${res.status})`;
        setServerError(message);
        return;
      }

      onSaved();
    } catch (error) {
      console.error('store save error:', error);
      setServerError('네트워크 오류로 저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const addressEmpty = form.address.trim().length === 0;

  return (
    <ModalShell
      onClose={onClose}
      title={isEdit ? '매장 수정' : '매장 추가'}
      subtitle={
        isEdit
          ? '카테고리·주소·좌표를 수정하면 공개 매장찾기에 반영돼요.'
          : '새 매장을 등록하면 공개 매장찾기 지도에 표시돼요.'
      }
    >
      {/* 카카오 지도 SDK(+services 라이브러리) — 모달이 열려 있는 동안만 로드.
          autoload=false + maps.load 콜백으로 services.Geocoder 준비를 보장한다.
          appkey 는 도메인 제한(*.주오.info) — 라이브 /admin 에서 동작, 로컬은 콘솔 등록 필요.
          미설정/로컬 실패 시에도 좌표 수동 입력으로 저장은 가능. */}
      {appKey ? (
        <Script
          id="kakao-geocoder-sdk"
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`}
          strategy="afterInteractive"
          onReady={handleScriptReady}
          onError={() =>
            setGeocodeHint('카카오 지도 SDK를 불러오지 못했어요. 좌표는 직접 입력하세요.')
          }
        />
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 매장명 */}
        <Field label="매장명" required>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="예: 사랑해주오 동물병원"
            className={inputClass}
            autoFocus
          />
        </Field>

        {/* 카테고리 셀렉트 */}
        <Field label="카테고리" required>
          <select
            value={form.category}
            onChange={(e) => update('category', e.target.value as StoreCategory)}
            className={selectClass}
          >
            {STORE_CATEGORIES.map((category) => (
              <option key={category} value={category} className="bg-[#18181B]">
                {category}
              </option>
            ))}
          </select>
        </Field>

        {/* 원본 카테고리(선택) */}
        <Field label="원본 카테고리" hint="선택 — 스크랩 원본 라벨(예: 분양샵, 훈련소). 비우면 카테고리로 기본">
          <input
            type="text"
            value={form.rawCategory}
            onChange={(e) => update('rawCategory', e.target.value)}
            placeholder="분양샵, 미용실"
            className={inputClass}
          />
        </Field>

        {/* 주소 + 좌표 찾기 버튼 */}
        <Field label="주소" required hint="“좌표 찾기”로 위도·경도를 자동 입력할 수 있어요">
          <div className="flex gap-2">
            <input
              type="text"
              value={form.address}
              onChange={(e) => {
                update('address', e.target.value);
                // 주소를 다시 만지면 이전 지오코딩 안내는 의미가 없어지므로 지운다.
                if (geocodeHint) setGeocodeHint(null);
              }}
              placeholder="예: 대전 유성구 대학로 99"
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={handleGeocode}
              disabled={!geocoderReady || addressEmpty || geocoding}
              title={
                !appKey
                  ? '카카오 키가 설정되지 않았어요'
                  : !geocoderReady
                    ? '지도 SDK 로딩 중…'
                    : addressEmpty
                      ? '주소를 먼저 입력하세요'
                      : '입력한 주소로 좌표 찾기'
              }
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#27272A] text-[#A1A1AA] text-[12px] font-semibold whitespace-nowrap hover:text-white hover:bg-[#323238] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {geocoding ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Crosshair size={14} />
              )}
              좌표 찾기
            </button>
          </div>
        </Field>

        {/* 좌표(위도/경도) — 지오코딩으로 채워지지만 항상 수동 수정 가능 */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="위도 (lat)" required>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={form.lat}
              onChange={(e) => update('lat', e.target.value)}
              placeholder="36.35"
              className={`${inputClass} font-mono`}
            />
          </Field>
          <Field label="경도 (lng)" required>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={form.lng}
              onChange={(e) => update('lng', e.target.value)}
              placeholder="127.82"
              className={`${inputClass} font-mono`}
            />
          </Field>
        </div>

        {/* 지오코딩 안내(주소 못 찾음·SDK 실패 등) */}
        {geocodeHint && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
            <AlertTriangle size={15} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-[12px] text-amber-300 leading-relaxed">{geocodeHint}</p>
          </div>
        )}

        {/* id 슬러그 */}
        <Field
          label="ID (슬러그)"
          hint={
            isEdit
              ? '수정 시에는 변경할 수 없어요.'
              : '선택 — 영문 슬러그. 비우면 서버가 자동 생성해요.'
          }
        >
          <input
            type="text"
            value={form.id}
            onChange={(e) => update('id', e.target.value)}
            placeholder="saranghae-juo"
            disabled={isEdit}
            className={`${inputClass} font-mono ${
              isEdit ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          />
        </Field>

        {/* 서버 검증 에러 */}
        {serverError && (
          <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5">
            <AlertTriangle size={15} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-[12px] text-red-300 leading-relaxed">{serverError}</p>
          </div>
        )}

        {/* 액션 */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-9 px-4 rounded-lg text-[13px] font-medium text-[#A1A1AA] hover:text-white hover:bg-[#27272A] transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#6366F1] text-white text-[13px] font-semibold hover:bg-[#5457E5] transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? '변경 저장' : '추가'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────────────
// 삭제 확인 모달 (매장은 위험 데이터가 아니므로 단순 확인만 — 강조 경고 없음)
// ─────────────────────────────────────────────────────────────────
interface DeleteConfirmModalProps {
  item: StoreLocation;
  onClose: () => void;
  onDeleted: () => void;
}

function DeleteConfirmModal({ item, onClose, onDeleted }: DeleteConfirmModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${ADMIN_STORES_ENDPOINT}/${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(json?.error ?? `삭제에 실패했어요 (HTTP ${res.status})`);
        return;
      }
      onDeleted();
    } catch (err) {
      console.error('store delete error:', err);
      setError('네트워크 오류로 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const meta = CATEGORY_META[item.category];

  return (
    <ModalShell onClose={onClose} title="매장 삭제" subtitle={`“${item.name}” 매장을 삭제할까요?`}>
      <div className="space-y-4">
        {/* 삭제 대상 요약 */}
        <div className="flex items-center gap-2.5 rounded-xl bg-[#0e0e10] border border-[#27272A] px-3.5 py-3">
          <MapPin size={18} className="text-[#52525B] shrink-0" />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">{item.name}</p>
            <p className="text-[11px] text-[#52525B] truncate">{item.address}</p>
          </div>
          <span
            className={`ml-auto inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-lg border whitespace-nowrap ${meta.badgeClassName}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClassName}`} />
            {item.category}
          </span>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5">
            <AlertTriangle size={15} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-[12px] text-red-300 leading-relaxed">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-9 px-4 rounded-lg text-[13px] font-medium text-[#A1A1AA] hover:text-white hover:bg-[#27272A] transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-red-500/90 text-white text-[13px] font-semibold hover:bg-red-500 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            삭제
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────────────
// 공통 서브컴포넌트(모달 셸 · 폼 필드) — FoodsManager 와 동일한 룩앤필
// ─────────────────────────────────────────────────────────────────
interface ModalShellProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

function ModalShell({ title, subtitle, onClose, children }: ModalShellProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg my-auto bg-[#18181B] rounded-2xl border border-[#27272A] shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#27272A]">
          <div>
            <h2 className="text-[15px] font-bold text-white tracking-tight">{title}</h2>
            {subtitle && <p className="text-[12px] text-[#52525B] mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#52525B] hover:text-white hover:bg-[#27272A] transition-colors shrink-0"
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, required, hint, children }: FieldProps) {
  return (
    <label className="block">
      <div className="flex items-baseline gap-1.5 mb-1.5">
        <span className="text-[12px] font-semibold text-[#A1A1AA]">{label}</span>
        {required && <span className="text-[12px] text-red-400">*</span>}
        {hint && <span className="text-[11px] text-[#52525B] font-normal">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

// 입력 공통 클래스(다크 폼)
const inputClass =
  'w-full h-9 px-3 rounded-lg bg-[#0e0e10] border border-[#27272A] text-[13px] text-white placeholder:text-[#52525B] outline-none focus:border-[#6366F1]/50 transition-colors';

// 셀렉트: 입력과 같은 높이/배경 + 네이티브 화살표 유지
const selectClass =
  'w-full h-9 px-3 rounded-lg bg-[#0e0e10] border border-[#27272A] text-[13px] text-white outline-none focus:border-[#6366F1]/50 transition-colors appearance-none cursor-pointer';
