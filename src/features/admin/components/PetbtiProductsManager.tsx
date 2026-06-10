'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pencil,
  Search,
  AlertTriangle,
  RefreshCw,
  X,
  Dog,
  Loader2,
  ExternalLink,
  ImageIcon,
} from 'lucide-react';
import {
  PET_TYPE_CODES,
  PET_TYPES,
  type PetTypeCode,
} from '@/features/petbti/data/types';

// 멍BTI 추천제품(D1 `petbti_products`) 편집기.
// 결과 페이지가 쓰는 유형별 추천제품을 /admin 에서 코드 수정·재배포 없이 관리한다.
// /admin 은 Cloudflare Access 로 보호되므로 브라우저는 이미 인증되어 있다 →
// same-origin fetch 가 세션 쿠키를 그대로 실어 보내므로 별도 인증 코드는 없다.
//
// 음식·매장 편집기(FoodsManager·StoresManager)와 동일한 다크 톤
// (bg-[#18181B] 카드 + border-[#27272A] + animate-shimmer)을 그대로 따른다.
// 단, 멍BTI 추천은 16유형 고정 행이라 추가/삭제가 없다:
//   - GET /admin/api/petbti/products 가 항상 16개를 돌려준다(미설정 유형은 types.ts 기본값 폴백).
//   - 저장은 PUT /admin/api/petbti/products/[type] 로 해당 유형만 upsert.
//   - 빈 값이면 서버/공개 API 가 다시 기본값으로 폴백하므로 "삭제" 개념·경고가 불필요하다.
//
// API 라우트(/admin/api/petbti/products[/type])는 워크스트림 D 가 생성 중 —
// 여기서는 응답 형태(PetbtiProduct: typeCode/productName/imageUrl/reason/shopUrl)와
// fetch 경로만 계약으로 맞춘다.

const ADMIN_PETBTI_PRODUCTS_ENDPOINT = '/admin/api/petbti/products';

// ─── API 응답/요청 형태 ─────────────────────────────────────────
// petbtiDb.PetbtiProduct 와 동일(워크스트림 D 공유 계약). 선택 필드는 미설정 시 생략될 수 있다.
interface PetbtiProduct {
  typeCode: PetTypeCode;
  productName: string;
  imageUrl?: string;
  reason?: string;
  shopUrl?: string;
}

// ─── 폼 상태 타입 ───────────────────────────────────────────────
// 모든 칸을 문자열로 다루고(빈 값 허용), 저장 시 trim → 빈 값은 보내지 않는다.
interface ProductFormState {
  productName: string;
  imageUrl: string;
  reason: string;
  shopUrl: string;
}

function itemToForm(item: PetbtiProduct): ProductFormState {
  return {
    productName: item.productName ?? '',
    imageUrl: item.imageUrl ?? '',
    reason: item.reason ?? '',
    shopUrl: item.shopUrl ?? '',
  };
}

// 코드 → 유형 메타(별명·컬러·기본 추천). types.ts 가 16유형을 보장하므로 항상 존재.
function metaOf(code: PetTypeCode) {
  return PET_TYPES[code];
}

export default function PetbtiProductsManager() {
  const [items, setItems] = useState<PetbtiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState('');

  // 편집 모달 대상(유형). null=닫힘. 멍BTI 는 16유형 고정이라 수정만 — 추가/삭제 없음.
  const [editTarget, setEditTarget] = useState<PetbtiProduct | null>(null);

  // ─── 목록 조회 ────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(ADMIN_PETBTI_PRODUCTS_ENDPOINT, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`목록을 불러오지 못했어요 (HTTP ${res.status})`);
      }
      const data = (await res.json()) as PetbtiProduct[];
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('petbti products fetch error:', error);
      setLoadError(
        error instanceof Error ? error.message : '목록을 불러오는 중 오류가 발생했어요.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ─── 16유형 고정 순서 정렬 + 클라이언트 검색 ────────────────────
  // API 가 항상 16개를 주지만, 순서를 PET_TYPE_CODES 기준으로 안정화한다.
  // (서버가 코드순으로 줘도 무방하지만, 누락/추가 방어 + 검색 필터를 위해 코드 기준으로 재구성.)
  const ordered = useMemo(() => {
    const byCode = new Map<string, PetbtiProduct>(items.map((it) => [it.typeCode, it]));
    return PET_TYPE_CODES.map((code) => {
      const found = byCode.get(code);
      // 혹시 API 가 어떤 유형을 빠뜨렸으면 기본값으로 채워 16행을 보장한다.
      return (
        found ?? {
          typeCode: code,
          productName: PET_TYPES[code].recommendedProduct,
        }
      );
    });
  }, [items]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length === 0) return ordered;
    return ordered.filter((item) => {
      const meta = metaOf(item.typeCode);
      return [item.typeCode, meta.nickname, item.productName].some((token) =>
        token.toLowerCase().includes(normalized)
      );
    });
  }, [ordered, query]);

  // 사용자 지정(D1 설정)된 유형 수 — 나머지는 types.ts 기본 추천 폴백.
  // 기본 추천 문자열과 다르거나, 부가 필드(이미지/카피/스토어)가 채워졌으면 "설정됨"으로 본다.
  const customizedCount = useMemo(() => {
    let count = 0;
    for (const item of items) {
      const meta = PET_TYPES[item.typeCode as PetTypeCode];
      if (!meta) continue;
      const hasExtras = Boolean(item.imageUrl || item.reason || item.shopUrl);
      const nameChanged = item.productName !== meta.recommendedProduct;
      if (hasExtras || nameChanged) count += 1;
    }
    return count;
  }, [items]);

  const handleSaved = useCallback(() => {
    setEditTarget(null);
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#09090B]/80 backdrop-blur-xl border-b border-[#1e1e23]">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-[24px]">🐶</span>
            <div>
              <h1 className="text-[18px] font-bold text-white tracking-tight">멍BTI 추천</h1>
              <p className="text-[12px] text-[#52525B] mt-0.5">
                결과 페이지 16유형별 추천제품 · 추천카피 · 스토어 링크
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchProducts}
              className="w-8 h-8 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-center text-[#52525B] hover:text-white hover:border-[#3f3f46] transition-all duration-200 active:scale-95"
              title="새로고침"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* 통계 + 검색 */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-lg border text-indigo-300 bg-indigo-500/10 border-indigo-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              직접 설정
              <span className="text-[#71717A] font-semibold tabular-nums">{customizedCount}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-lg border text-[#71717A] border-[#27272A]">
              기본값 폴백
              <span className="text-[#A1A1AA] font-semibold tabular-nums">
                {Math.max(0, PET_TYPE_CODES.length - customizedCount)}
              </span>
            </span>
            <span className="text-[12px] text-[#52525B] font-medium px-1">
              총 <span className="text-[#A1A1AA] font-semibold tabular-nums">16</span>유형
            </span>
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
              placeholder="유형코드·별명·제품명으로 검색"
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#18181B] border border-[#27272A] text-[13px] text-white placeholder:text-[#52525B] outline-none focus:border-[#6366F1]/50 transition-colors"
            />
          </div>
        </div>

        {/* 로딩: 다크 시머 (16행) */}
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 16 }).map((_, i) => (
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
              onClick={fetchProducts}
              className="mt-1 flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#27272A] text-[#A1A1AA] text-[13px] font-medium hover:text-white transition-colors"
            >
              <RefreshCw size={14} />
              다시 시도
            </button>
          </div>
        )}

        {/* 표 */}
        {!loading && !loadError && (
          <ProductsTable items={filtered} onEdit={(item) => setEditTarget(item)} />
        )}
      </main>

      {/* 수정 모달 */}
      {editTarget && (
        <ProductEditorModal
          item={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 표
// ─────────────────────────────────────────────────────────────────
interface ProductsTableProps {
  items: PetbtiProduct[];
  onEdit: (item: PetbtiProduct) => void;
}

function ProductsTable({ items, onEdit }: ProductsTableProps) {
  // 16유형 고정이라 "비었음"은 검색 미스 한 가지뿐(전체 0 상태는 없음).
  if (items.length === 0) {
    return (
      <div className="bg-[#18181B] rounded-2xl border border-[#27272A] p-12 flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#27272A] flex items-center justify-center">
          <Dog size={22} className="text-[#52525B]" />
        </div>
        <p className="text-[14px] font-semibold text-white">검색 결과가 없어요</p>
        <p className="text-[12px] text-[#52525B]">다른 유형코드·별명·제품명으로 검색해 보세요.</p>
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
                유형
              </th>
              <th className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider px-4 py-3">
                추천제품
              </th>
              <th className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                추천카피
              </th>
              <th className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider px-4 py-3 hidden md:table-cell text-center">
                이미지·링크
              </th>
              <th className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider px-4 py-3 text-right">
                관리
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const meta = metaOf(item.typeCode);
              return (
                <tr
                  key={item.typeCode}
                  className="border-b border-[#1e1e23] last:border-b-0 hover:bg-[#1c1c22]/60 transition-colors"
                >
                  {/* 유형 컬러 점 + 별명 (+ 코드) */}
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: meta.color }}
                      />
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-white truncate max-w-[160px]">
                          {meta.nickname}
                        </p>
                        <p className="text-[11px] text-[#52525B] font-mono truncate">
                          {item.typeCode}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* 추천제품명 */}
                  <td className="px-4 py-3 align-middle">
                    <p className="text-[13px] text-white max-w-[200px] truncate">
                      {item.productName}
                    </p>
                  </td>

                  {/* 추천카피(잘림) */}
                  <td className="px-4 py-3 align-middle hidden lg:table-cell">
                    <p className="text-[12px] text-[#A1A1AA] max-w-[280px] truncate">
                      {item.reason ? item.reason : '—'}
                    </p>
                  </td>

                  {/* 이미지/스토어 보유 표시(아이콘) */}
                  <td className="px-4 py-3 align-middle hidden md:table-cell">
                    <div className="flex items-center justify-center gap-2">
                      <ImageIcon
                        size={15}
                        className={item.imageUrl ? 'text-emerald-400' : 'text-[#3f3f46]'}
                        aria-label={item.imageUrl ? '이미지 있음' : '이미지 없음'}
                      />
                      <ExternalLink
                        size={15}
                        className={item.shopUrl ? 'text-emerald-400' : 'text-[#3f3f46]'}
                        aria-label={item.shopUrl ? '스토어 링크 있음' : '스토어 링크 없음'}
                      />
                    </div>
                  </td>

                  {/* 행 액션 — 수정만 */}
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-[#27272A] text-[#A1A1AA] text-[12px] font-medium hover:text-white hover:bg-[#323238] transition-colors"
                      >
                        <Pencil size={13} />
                        수정
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
// 수정 모달 (유형 고정 — typeCode 는 경로 파라미터, 변경 불가)
// ─────────────────────────────────────────────────────────────────
interface ProductEditorModalProps {
  item: PetbtiProduct;
  onClose: () => void;
  onSaved: () => void;
}

function ProductEditorModal({ item, onClose, onSaved }: ProductEditorModalProps) {
  const meta = metaOf(item.typeCode);
  const [form, setForm] = useState<ProductFormState>(itemToForm(item));
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const update = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // 가벼운 클라이언트 사전 검증(서버 검증 모듈이 최종 진실원 — 여기선 UX 보조용).
    if (form.productName.trim().length === 0) {
      setServerError('추천제품명을 입력해 주세요. (비우려면 기본값으로 두세요)');
      return;
    }

    // 폼 → API 바디. typeCode 는 경로 파라미터로 식별하므로 바디엔 넣지 않는다.
    // 선택 필드(imageUrl/reason/shopUrl)는 비어있으면 보내지 않는다 → 서버가 해제(폴백)로 처리.
    const payload: {
      productName: string;
      imageUrl?: string;
      reason?: string;
      shopUrl?: string;
    } = {
      productName: form.productName.trim(),
    };
    const imageUrl = form.imageUrl.trim();
    if (imageUrl) payload.imageUrl = imageUrl;
    const reason = form.reason.trim();
    if (reason) payload.reason = reason;
    const shopUrl = form.shopUrl.trim();
    if (shopUrl) payload.shopUrl = shopUrl;

    setSubmitting(true);
    try {
      const res = await fetch(
        `${ADMIN_PETBTI_PRODUCTS_ENDPOINT}/${encodeURIComponent(item.typeCode)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const json = (await res.json().catch(() => null)) as
        | { ok: true }
        | { ok?: false; error?: string }
        | null;

      if (!res.ok || !json || (json as { ok?: boolean }).ok === false) {
        const message =
          json && 'error' in json && json.error
            ? json.error
            : `저장에 실패했어요 (HTTP ${res.status})`;
        setServerError(message);
        return;
      }

      onSaved();
    } catch (error) {
      console.error('petbti product save error:', error);
      setServerError('네트워크 오류로 저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      onClose={onClose}
      title={`${meta.nickname} 추천 수정`}
      subtitle="추천제품·카피·스토어 링크를 바꾸면 결과 페이지에 반영돼요."
    >
      {/* 유형 헤더(컬러·코드·캐치프레이즈) — 수정 불가, 어떤 유형인지 맥락 제공 */}
      <div
        className="flex items-center gap-2.5 rounded-xl border px-3.5 py-3 mb-4"
        style={{ backgroundColor: `${meta.color}14`, borderColor: `${meta.color}33` }}
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: meta.color }}
        />
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-white truncate">
            {meta.nickname}
            <span className="ml-2 text-[11px] font-mono font-normal text-[#A1A1AA]">
              {item.typeCode}
            </span>
          </p>
          <p className="text-[11px] text-[#A1A1AA] truncate">{meta.catchphrase}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 추천제품명 */}
        <Field label="추천제품명" required hint={`기본값: ${meta.recommendedProduct}`}>
          <input
            type="text"
            value={form.productName}
            onChange={(e) => update('productName', e.target.value)}
            placeholder={meta.recommendedProduct}
            className={inputClass}
            autoFocus
          />
        </Field>

        {/* 이미지 URL */}
        <Field label="이미지 URL" hint="선택 — 결과 페이지 추천 카드 썸네일">
          <input
            type="url"
            value={form.imageUrl}
            onChange={(e) => update('imageUrl', e.target.value)}
            placeholder="https://…/product.png"
            className={`${inputClass} font-mono`}
          />
        </Field>

        {/* 추천 카피 */}
        <Field label="추천카피" hint="선택 — 이 유형에게 왜 좋은지 한두 문장">
          <textarea
            value={form.reason}
            onChange={(e) => update('reason', e.target.value)}
            placeholder="예: 오래 씹으며 에너지를 풀기 좋은 든든한 간식이에요."
            rows={2}
            className={textareaClass}
          />
        </Field>

        {/* 스토어(shop) URL */}
        <Field label="스토어 링크" hint="선택 — 구매 페이지(shopURL)">
          <input
            type="url"
            value={form.shopUrl}
            onChange={(e) => update('shopUrl', e.target.value)}
            placeholder="https://smartstore.naver.com/…"
            className={`${inputClass} font-mono`}
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
            변경 저장
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────────────
// 공통 서브컴포넌트(모달 셸 · 폼 필드) — FoodsManager·StoresManager 와 동일한 룩앤필
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
        {hint && <span className="text-[11px] text-[#52525B] font-normal truncate">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

// 입력 공통 클래스(다크 폼)
const inputClass =
  'w-full h-9 px-3 rounded-lg bg-[#0e0e10] border border-[#27272A] text-[13px] text-white placeholder:text-[#52525B] outline-none focus:border-[#6366F1]/50 transition-colors';

// 여러 줄 입력
const textareaClass =
  'w-full px-3 py-2 rounded-lg bg-[#0e0e10] border border-[#27272A] text-[13px] text-white placeholder:text-[#52525B] outline-none focus:border-[#6366F1]/50 transition-colors resize-y leading-relaxed min-h-[64px]';
