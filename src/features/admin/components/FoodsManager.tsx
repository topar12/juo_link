'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FoodSafetyItem, FoodVerdict } from '@/lib/foodSafety';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  AlertTriangle,
  RefreshCw,
  X,
  Apple,
  Loader2,
} from 'lucide-react';

// 음식 데이터(D1) CRUD 편집기.
// 공개 검색기(FoodCheckSheet)가 쓰는 foods 데이터를 /admin 에서 코드 수정·재배포 없이 관리한다.
// /admin 은 Cloudflare Access 로 보호되므로 브라우저는 이미 인증되어 있다 →
// same-origin fetch 가 세션 쿠키를 그대로 실어 보내므로 별도 인증 코드는 없다.
//
// 호스트 다크 대시보드 톤(bg-[#18181B] 카드 + border-[#27272A] + animate-shimmer)을 따르고,
// VERDICT_META(라이트 테마)는 재사용하지 않고 아래 다크 전용 색을 쓴다.

// ─── 판정(verdict) 다크 테마 메타 ───────────────────────────────
// foodSafety.ts 의 VERDICT_META 는 공개(라이트) 시트용이라 여기선 쓰지 않는다.
type DarkVerdictMeta = {
  label: string;
  // 표 배지: 옅은 배경 + 또렷한 텍스트
  badgeClassName: string;
  // 셀렉트/라디오 칩 강조용 점 색
  dotClassName: string;
};

const VERDICT_META_DARK: Record<FoodVerdict, DarkVerdictMeta> = {
  danger: {
    label: '안 돼요',
    badgeClassName: 'text-red-400 bg-red-500/10 border-red-500/20',
    dotClassName: 'bg-red-400',
  },
  caution: {
    label: '조심해요',
    badgeClassName: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    dotClassName: 'bg-amber-400',
  },
  safe: {
    label: '먹어도 돼요',
    badgeClassName: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    dotClassName: 'bg-emerald-400',
  },
};

const VERDICT_ORDER: FoodVerdict[] = ['danger', 'caution', 'safe'];

// 표시 순서: 위험한 것부터 → 같은 판정이면 이름순(공개 검색기 searchFoods 와 동일 규칙)
const VERDICT_SORT_RANK: Record<FoodVerdict, number> = {
  danger: 0,
  caution: 1,
  safe: 2,
};

const ADMIN_FOODS_ENDPOINT = '/admin/api/foods';

// ─── 폼 상태 타입 ───────────────────────────────────────────────
// aliases 는 폼에선 콤마 구분 문자열로 다루고, 제출 시 string[] 로 변환한다.
interface FoodFormState {
  id: string;
  name: string;
  aliasesText: string;
  emoji: string;
  verdict: FoodVerdict;
  reason: string;
  note: string;
}

const EMPTY_FORM: FoodFormState = {
  id: '',
  name: '',
  aliasesText: '',
  emoji: '',
  verdict: 'caution',
  reason: '',
  note: '',
};

// 항목 → 폼 상태(수정 모드 진입 시)
function itemToForm(item: FoodSafetyItem): FoodFormState {
  return {
    id: item.id,
    name: item.name,
    aliasesText: item.aliases.join(', '),
    emoji: item.emoji ?? '',
    verdict: item.verdict,
    reason: item.reason,
    note: item.note ?? '',
  };
}

// 콤마 구분 문자열 → 별칭 배열(공백 제거 + 빈 항목/중복 제거)
function parseAliases(text: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of text.split(',')) {
    const alias = raw.trim();
    if (alias.length === 0 || seen.has(alias)) continue;
    seen.add(alias);
    result.push(alias);
  }
  return result;
}

export default function FoodsManager() {
  const [items, setItems] = useState<FoodSafetyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState('');

  // 폼(모달) 상태: null=닫힘, 'create'=신규, FoodSafetyItem=해당 항목 수정
  const [editorTarget, setEditorTarget] = useState<'create' | FoodSafetyItem | null>(null);
  // 삭제 확인 대상
  const [deleteTarget, setDeleteTarget] = useState<FoodSafetyItem | null>(null);

  // ─── 목록 조회 ────────────────────────────────────────────────
  const fetchFoods = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(ADMIN_FOODS_ENDPOINT, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`목록을 불러오지 못했어요 (HTTP ${res.status})`);
      }
      const data = (await res.json()) as FoodSafetyItem[];
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('foods fetch error:', error);
      setLoadError(
        error instanceof Error ? error.message : '목록을 불러오는 중 오류가 발생했어요.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  // ─── 클라이언트 검색 + 정렬(이름/별칭) ─────────────────────────
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items
      .filter((item) => {
        if (normalized.length === 0) return true;
        return [item.name, ...item.aliases].some((token) =>
          token.toLowerCase().includes(normalized)
        );
      })
      .sort((a, b) => {
        if (a.verdict !== b.verdict) {
          return VERDICT_SORT_RANK[a.verdict] - VERDICT_SORT_RANK[b.verdict];
        }
        return a.name.localeCompare(b.name, 'ko');
      });
  }, [items, query]);

  // 판정별 개수(헤더 통계용)
  const counts = useMemo(() => {
    const base: Record<FoodVerdict, number> = { danger: 0, caution: 0, safe: 0 };
    for (const item of items) base[item.verdict] += 1;
    return base;
  }, [items]);

  // 저장/삭제 성공 후 목록 갱신 + 패널 닫기
  const handleSaved = useCallback(() => {
    setEditorTarget(null);
    fetchFoods();
  }, [fetchFoods]);

  const handleDeleted = useCallback(() => {
    setDeleteTarget(null);
    fetchFoods();
  }, [fetchFoods]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#09090B]/80 backdrop-blur-xl border-b border-[#1e1e23]">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-[24px]">🍽️</span>
            <div>
              <h1 className="text-[18px] font-bold text-white tracking-tight">음식 데이터</h1>
              <p className="text-[12px] text-[#52525B] mt-0.5">
                공개 검색기 “우리 아이 먹어도 돼요?”에 쓰이는 음식 안전 데이터
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchFoods}
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
              항목 추가
            </button>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* 판정별 통계 + 검색 */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {VERDICT_ORDER.map((verdict) => (
              <span
                key={verdict}
                className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-lg border ${VERDICT_META_DARK[verdict].badgeClassName}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${VERDICT_META_DARK[verdict].dotClassName}`} />
                {VERDICT_META_DARK[verdict].label}
                <span className="text-[#71717A] font-semibold tabular-nums">{counts[verdict]}</span>
              </span>
            ))}
            <span className="text-[12px] text-[#52525B] font-medium px-1">
              총 <span className="text-[#A1A1AA] font-semibold tabular-nums">{items.length}</span>개
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
              placeholder="이름·별칭으로 검색"
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
              onClick={fetchFoods}
              className="mt-1 flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#27272A] text-[#A1A1AA] text-[13px] font-medium hover:text-white transition-colors"
            >
              <RefreshCw size={14} />
              다시 시도
            </button>
          </div>
        )}

        {/* 표 */}
        {!loading && !loadError && (
          <FoodsTable
            items={filtered}
            totalCount={items.length}
            onEdit={(item) => setEditorTarget(item)}
            onDelete={(item) => setDeleteTarget(item)}
          />
        )}
      </main>

      {/* 추가/수정 모달 */}
      {editorTarget && (
        <FoodEditorModal
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
interface FoodsTableProps {
  items: FoodSafetyItem[];
  totalCount: number;
  onEdit: (item: FoodSafetyItem) => void;
  onDelete: (item: FoodSafetyItem) => void;
}

function FoodsTable({ items, totalCount, onEdit, onDelete }: FoodsTableProps) {
  // 검색 결과가 비었을 때(전체가 0개인지, 검색에 안 걸린 건지 구분)
  if (items.length === 0) {
    return (
      <div className="bg-[#18181B] rounded-2xl border border-[#27272A] p-12 flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#27272A] flex items-center justify-center">
          <Apple size={22} className="text-[#52525B]" />
        </div>
        <p className="text-[14px] font-semibold text-white">
          {totalCount === 0 ? '아직 등록된 음식이 없어요' : '검색 결과가 없어요'}
        </p>
        <p className="text-[12px] text-[#52525B]">
          {totalCount === 0
            ? '오른쪽 위 “항목 추가”로 첫 음식을 등록해 보세요.'
            : '다른 이름이나 별칭으로 검색해 보세요.'}
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
                음식
              </th>
              <th className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider px-4 py-3">
                판정
              </th>
              <th className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                별칭
              </th>
              <th className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                이유
              </th>
              <th className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider px-4 py-3 text-right">
                관리
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const meta = VERDICT_META_DARK[item.verdict];
              return (
                <tr
                  key={item.id}
                  className="border-b border-[#1e1e23] last:border-b-0 hover:bg-[#1c1c22]/60 transition-colors"
                >
                  {/* 이모지 + 이름 (+ 슬러그 id) */}
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[18px] w-6 text-center shrink-0">
                        {item.emoji ?? '🍽️'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-white truncate">{item.name}</p>
                        <p className="text-[11px] text-[#52525B] font-mono truncate">{item.id}</p>
                      </div>
                    </div>
                  </td>

                  {/* 판정 배지 */}
                  <td className="px-4 py-3 align-middle">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-lg border whitespace-nowrap ${meta.badgeClassName}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClassName}`} />
                      {meta.label}
                    </span>
                  </td>

                  {/* 별칭(콤마 결합, 잘림) */}
                  <td className="px-4 py-3 align-middle hidden md:table-cell">
                    <p className="text-[12px] text-[#A1A1AA] max-w-[180px] truncate">
                      {item.aliases.length > 0 ? item.aliases.join(', ') : '—'}
                    </p>
                  </td>

                  {/* 이유(잘림) */}
                  <td className="px-4 py-3 align-middle hidden lg:table-cell">
                    <p className="text-[12px] text-[#A1A1AA] max-w-[280px] truncate">{item.reason}</p>
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
// 추가/수정 모달
// ─────────────────────────────────────────────────────────────────
interface FoodEditorModalProps {
  target: 'create' | FoodSafetyItem;
  onClose: () => void;
  onSaved: () => void;
}

function FoodEditorModal({ target, onClose, onSaved }: FoodEditorModalProps) {
  const isEdit = target !== 'create';
  const [form, setForm] = useState<FoodFormState>(
    isEdit ? itemToForm(target) : EMPTY_FORM
  );
  const [submitting, setSubmitting] = useState(false);
  // 서버 검증 에러(400/409 의 { error }) 또는 네트워크 에러 메시지
  const [serverError, setServerError] = useState<string | null>(null);

  const update = <K extends keyof FoodFormState>(key: K, value: FoodFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // 가벼운 클라이언트 사전 검증(서버 검증 모듈이 최종 진실원 — 여기선 UX 보조용)
    if (form.name.trim().length === 0) {
      setServerError('이름을 입력해 주세요.');
      return;
    }
    if (form.reason.trim().length === 0) {
      setServerError('이유를 입력해 주세요.');
      return;
    }

    // 폼 → API 바디. 선택 항목(emoji/note/id)은 비어있으면 보내지 않는다.
    const payload: {
      name: string;
      aliases: string[];
      verdict: FoodVerdict;
      reason: string;
      emoji?: string;
      note?: string;
      id?: string;
    } = {
      name: form.name.trim(),
      aliases: parseAliases(form.aliasesText),
      verdict: form.verdict,
      reason: form.reason.trim(),
    };
    const emoji = form.emoji.trim();
    if (emoji) payload.emoji = emoji;
    const note = form.note.trim();
    if (note) payload.note = note;
    // 신규일 때만 id 를 (있으면) 보낸다. 수정은 경로 파라미터로 식별하므로 바디 id 불필요.
    if (!isEdit) {
      const id = form.id.trim();
      if (id) payload.id = id;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        isEdit ? `${ADMIN_FOODS_ENDPOINT}/${encodeURIComponent(target.id)}` : ADMIN_FOODS_ENDPOINT,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const json = (await res.json().catch(() => null)) as
        | { ok: true; item: FoodSafetyItem }
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
      console.error('food save error:', error);
      setServerError('네트워크 오류로 저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      onClose={onClose}
      title={isEdit ? '음식 수정' : '음식 추가'}
      subtitle={
        isEdit
          ? '판정·이유 등을 수정하면 공개 검색기에 반영돼요.'
          : '새 음식을 등록하면 공개 검색기에서 검색돼요.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 이름 + 이모지 */}
        <div className="grid grid-cols-[1fr_88px] gap-3">
          <Field label="이름" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="예: 초콜릿"
              className={inputClass}
              autoFocus
            />
          </Field>
          <Field label="이모지">
            <input
              type="text"
              value={form.emoji}
              onChange={(e) => update('emoji', e.target.value)}
              placeholder="🍫"
              className={`${inputClass} text-center`}
            />
          </Field>
        </div>

        {/* 별칭 */}
        <Field label="별칭" hint="콤마(,)로 구분 — 예: 초콜렛, choco">
          <input
            type="text"
            value={form.aliasesText}
            onChange={(e) => update('aliasesText', e.target.value)}
            placeholder="초콜렛, choco"
            className={inputClass}
          />
        </Field>

        {/* 판정 — 라디오 칩 */}
        <Field label="판정" required>
          <div className="grid grid-cols-3 gap-2">
            {VERDICT_ORDER.map((verdict) => {
              const meta = VERDICT_META_DARK[verdict];
              const active = form.verdict === verdict;
              return (
                <button
                  key={verdict}
                  type="button"
                  onClick={() => update('verdict', verdict)}
                  className={`flex items-center justify-center gap-1.5 h-9 rounded-lg border text-[13px] font-medium transition-all ${
                    active
                      ? meta.badgeClassName
                      : 'border-[#27272A] text-[#71717A] hover:text-[#A1A1AA] hover:border-[#3f3f46]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClassName}`} />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </Field>

        {/* 이유 */}
        <Field label="이유" required>
          <textarea
            value={form.reason}
            onChange={(e) => update('reason', e.target.value)}
            placeholder="왜 안 되는지/조심해야 하는지/괜찮은지 설명"
            rows={2}
            className={textareaClass}
          />
        </Field>

        {/* 비고(선택) */}
        <Field label="비고" hint="선택 — 양 조절·예외 등 보충 설명">
          <textarea
            value={form.note}
            onChange={(e) => update('note', e.target.value)}
            placeholder="예: 소량은 괜찮지만 과다 섭취 주의"
            rows={2}
            className={textareaClass}
          />
        </Field>

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
            placeholder="chocolate"
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
// 삭제 확인 모달
// ─────────────────────────────────────────────────────────────────
interface DeleteConfirmModalProps {
  item: FoodSafetyItem;
  onClose: () => void;
  onDeleted: () => void;
}

function DeleteConfirmModal({ item, onClose, onDeleted }: DeleteConfirmModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 위험 경고 항목을 지우면 공개 검색기에서 "안 돼요" 경고가 사라진다 → 실수 방지용 강조 경고.
  const isDanger = item.verdict === 'danger';

  const handleDelete = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${ADMIN_FOODS_ENDPOINT}/${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(json?.error ?? `삭제에 실패했어요 (HTTP ${res.status})`);
        return;
      }
      onDeleted();
    } catch (err) {
      console.error('food delete error:', err);
      setError('네트워크 오류로 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title="음식 삭제" subtitle={`“${item.name}” 항목을 삭제할까요?`}>
      <div className="space-y-4">
        {/* danger 항목: 강조 경고 */}
        {isDanger && (
          <div className="flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/30 px-3.5 py-3">
            <AlertTriangle size={18} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[13px] font-bold text-red-300">위험 경고 항목입니다</p>
              <p className="text-[12px] text-red-300/80 leading-relaxed mt-0.5">
                삭제 시 공개 검색기에서 이 경고가 사라집니다. 반려동물이 먹으면 안 되는 음식 정보가
                노출되지 않으니 정말 삭제할지 다시 한 번 확인해 주세요.
              </p>
            </div>
          </div>
        )}

        {/* 삭제 대상 요약 */}
        <div className="flex items-center gap-2.5 rounded-xl bg-[#0e0e10] border border-[#27272A] px-3.5 py-3">
          <span className="text-[20px] w-7 text-center shrink-0">{item.emoji ?? '🍽️'}</span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">{item.name}</p>
            <p className="text-[11px] text-[#52525B] font-mono truncate">{item.id}</p>
          </div>
          <span
            className={`ml-auto inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-lg border whitespace-nowrap ${VERDICT_META_DARK[item.verdict].badgeClassName}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${VERDICT_META_DARK[item.verdict].dotClassName}`} />
            {VERDICT_META_DARK[item.verdict].label}
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
// 공통 서브컴포넌트(모달 셸 · 폼 필드)
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

// 여러 줄 입력: 고정 높이(h-9) 대신 세로 패딩 + min-height + 사용자 리사이즈
const textareaClass =
  'w-full px-3 py-2 rounded-lg bg-[#0e0e10] border border-[#27272A] text-[13px] text-white placeholder:text-[#52525B] outline-none focus:border-[#6366F1]/50 transition-colors resize-y leading-relaxed min-h-[64px]';
