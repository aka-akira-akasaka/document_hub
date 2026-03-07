/**
 * Supabase ↔ Zustand 同期エンジン
 *
 * 責務:
 *   1. ログイン時: Supabaseから全データ取得 → 各ストアの hydrate() 呼び出し
 *   2. 操作時: Zustand subscribe() で変更検知 → デバウンス → Supabase upsert/delete
 *   3. ログアウト時: subscribe 解除 + 各ストアの reset()
 */

import { createClient } from "@/lib/supabase/client";
import { useDealStore } from "@/stores/deal-store";
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { useOrgGroupStore } from "@/stores/org-group-store";
import { useDealShareStore } from "@/stores/deal-share-store";
import {
  dbToDeal,
  dbToStakeholder,
  dbToRelationship,
  dbToOrgGroup,
  dbToOrgLevel,
  dbToTierEntry,
  dbToDealShare,
  dealToDb,
  stakeholderToDb,
  relationshipToDb,
  orgGroupToDb,
  orgLevelToDb,
  tierEntryToDb,
  dealShareToDb,
  type DbDeal,
  type DbStakeholder,
  type DbRelationship,
  type DbOrgGroup,
  type DbOrgLevelConfig,
  type DbTierConfig,
  type DbDealShare,
} from "@/lib/supabase-mappers";
import type { Deal } from "@/types/deal";
import type { ShareRole } from "@/types/deal-share";
import type { DealShare } from "@/types/deal-share";
import type { Stakeholder } from "@/types/stakeholder";
import type { Relationship } from "@/types/relationship";
import type { OrgGroup } from "@/types/org-group";
import type { OrgLevelEntry } from "@/stores/stakeholder-store";
import type { TierEntry } from "@/stores/org-group-store";
import { broadcastDataChange } from "@/hooks/use-realtime-sync";
import { toast } from "sonner";

// --- 内部状態 ---
let unsubscribers: (() => void)[] = [];
let currentUserId: string | null = null;
let currentUserEmail: string | null = null;
let syncEnabled = false;
let initPromise: Promise<void> | null = null;

// デバウンス用タイマー + 保留中の同期関数
const timers: Record<string, ReturnType<typeof setTimeout>> = {};
const pendingSyncs: Record<string, () => void | Promise<void>> = {};

function debounce(key: string, fn: () => void | Promise<void>, ms = 500) {
  clearTimeout(timers[key]);
  pendingSyncs[key] = fn;
  timers[key] = setTimeout(() => {
    delete pendingSyncs[key];
    delete timers[key];
    fn();
  }, ms);
}

/**
 * 保留中のデバウンスされた同期処理をすべて即座に実行する。
 * 案件作成・削除など、ナビゲーション前にDB永続化を保証したい場面で使う。
 *
 * RLS依存順序: deals を先に同期してから他テーブルを同期する。
 * org_groups / stakeholders は deals.id を外部キーとして参照するため、
 * deals が DB に存在しない状態で upsert すると 403 になる。
 */
export async function flushPendingSync() {
  const entries = Object.entries(pendingSyncs);
  for (const [key] of entries) {
    clearTimeout(timers[key]);
    delete timers[key];
    delete pendingSyncs[key];
  }

  // deals を先に同期（RLS の外部キー依存）
  const dealsEntry = entries.find(([key]) => key === "deals");
  const rest = entries.filter(([key]) => key !== "deals");

  if (dealsEntry) {
    await dealsEntry[1]();
  }
  if (rest.length > 0) {
    await Promise.all(rest.map(([, fn]) => fn()));
  }
}

// ============================================
// 初期化: Supabase → Zustand
// ============================================

export async function initSupabaseSync(userId: string, userEmail?: string) {
  if (userEmail) currentUserEmail = userEmail;
  // 別の初期化が進行中なら、完了を待ってから戻る（getUser と onAuthStateChange の競合回避）
  if (initPromise) {
    await initPromise;
    return;
  }
  // 同じユーザーで同期済みなら何もしない（不要な teardown によるデータ消失を防止）
  if (currentUserId === userId && syncEnabled) return;

  initPromise = performInit(userId);
  try {
    await initPromise;
  } finally {
    initPromise = null;
  }
}

/**
 * リアルタイム同期用: データのみ再取得してストアを更新する。
 * subscribe/teardown を触らず、hydrate のみ行う軽量版。
 */
export async function refetchDealData() {
  if (!currentUserId || !syncEnabled) return;
  const userId = currentUserId;
  const supabase = createClient();

  try {
    // syncEnabled を一時的に無効化（hydrate 時の subscribe 発火を防止）
    syncEnabled = false;

    const [dealsRes, stakeholdersRes, relationshipsRes, orgGroupsRes, orgLevelsRes, dealSharesRes] =
      await Promise.all([
        supabase.from("deals").select("*"),
        supabase.from("stakeholders").select("*"),
        supabase.from("relationships").select("*"),
        supabase.from("org_groups").select("*"),
        supabase.from("org_level_configs").select("*"),
        supabase.from("deal_shares").select("*"),
      ]);

    for (const res of [dealsRes, stakeholdersRes, relationshipsRes, orgGroupsRes, orgLevelsRes]) {
      if (res.error) throw res.error;
    }

    const dealShares = ((dealSharesRes.data ?? []) as DbDealShare[]).map(dbToDealShare);
    const sharesByDeal: Record<string, DealShare[]> = {};
    const myShareRoleByDeal = new Map<string, ShareRole>();
    for (const s of dealShares) {
      (sharesByDeal[s.dealId] ??= []).push(s);
      if (s.sharedWithUserId === userId) {
        myShareRoleByDeal.set(s.dealId, s.role as ShareRole);
      }
    }

    const rawDbDeals = dealsRes.data as DbDeal[];
    const deals = rawDbDeals.map((row) => {
      const deal = dbToDeal(row);
      if (row.user_id !== userId) {
        deal.shareRole = myShareRoleByDeal.get(row.id) ?? "viewer";
        deal.ownerEmail = row.owner_email ?? undefined;
      }
      return deal;
    });
    const stakeholders = (stakeholdersRes.data as DbStakeholder[]).map(dbToStakeholder);
    const relationships = (relationshipsRes.data as DbRelationship[]).map(dbToRelationship);
    const orgGroups = (orgGroupsRes.data as DbOrgGroup[]).map(dbToOrgGroup);
    const orgLevels = (orgLevelsRes.data as DbOrgLevelConfig[]);

    const stakeholdersByDeal: Record<string, Stakeholder[]> = {};
    const relationshipsByDeal: Record<string, Relationship[]> = {};
    const orgLevelConfigByDeal: Record<string, OrgLevelEntry[]> = {};
    const groupsByDeal: Record<string, OrgGroup[]> = {};

    for (const s of stakeholders) { (stakeholdersByDeal[s.dealId] ??= []).push(s); }
    for (const r of relationships) { (relationshipsByDeal[r.dealId] ??= []).push(r); }
    for (const row of orgLevels) { (orgLevelConfigByDeal[row.deal_id] ??= []).push(dbToOrgLevel(row)); }
    for (const g of orgGroups) { (groupsByDeal[g.dealId] ??= []).push(g); }

    useDealStore.getState().hydrate(deals);
    useStakeholderStore.getState().hydrate(stakeholdersByDeal, relationshipsByDeal, orgLevelConfigByDeal);
    useOrgGroupStore.getState().hydrate(groupsByDeal);
    useDealShareStore.getState().hydrate(sharesByDeal);
  } catch (err) {
    console.error("refetchDealData failed:", err);
  } finally {
    // hydrate 中に蓄積されたデバウンスタイマーを全クリア
    // （hydrate でストア変更 → subscribe → debounce → sync という不要な書き戻しを防止）
    for (const key of Object.keys(timers)) {
      clearTimeout(timers[key]);
      delete timers[key];
      delete pendingSyncs[key];
    }
    syncEnabled = true;
  }
}

async function performInit(userId: string) {
  // ユーザーが変わった場合のみ teardown（同期解除 + ストアリセット）
  if (currentUserId && currentUserId !== userId) {
    teardownSupabaseSync();
  }

  currentUserId = userId;
  const supabase = createClient();

  try {
    // コアデータを並行取得（tier_configs は遅延ロード）
    const [dealsRes, stakeholdersRes, relationshipsRes, orgGroupsRes, orgLevelsRes, dealSharesRes] =
      await Promise.all([
        supabase.from("deals").select("*"),
        supabase.from("stakeholders").select("*"),
        supabase.from("relationships").select("*"),
        supabase.from("org_groups").select("*"),
        supabase.from("org_level_configs").select("*"),
        supabase.from("deal_shares").select("*"),
      ]);

    // エラーチェック
    for (const res of [dealsRes, stakeholdersRes, relationshipsRes, orgGroupsRes, orgLevelsRes]) {
      if (res.error) throw res.error;
    }
    if (dealSharesRes.error) {
      console.warn("deal_shares テーブル未作成（スキップ）:", dealSharesRes.error.message);
    }

    // 共有情報を処理（deals の shareRole 付与に使用）
    const dealShares = ((dealSharesRes.data ?? []) as DbDealShare[]).map(dbToDealShare);
    const sharesByDeal: Record<string, DealShare[]> = {};
    // shareRole ルックアップ用 Map（O(1)）
    const myShareRoleByDeal = new Map<string, ShareRole>();
    for (const s of dealShares) {
      (sharesByDeal[s.dealId] ??= []).push(s);
      if (s.sharedWithUserId === userId) {
        myShareRoleByDeal.set(s.dealId, s.role as ShareRole);
      }
    }

    // deals に共有情報を付与（Map で O(1) ルックアップ）
    const rawDbDeals = dealsRes.data as DbDeal[];

    const deals = rawDbDeals.map((row) => {
      const deal = dbToDeal(row);
      if (row.user_id !== userId) {
        deal.shareRole = myShareRoleByDeal.get(row.id) ?? "viewer";
        // owner_email は deals テーブルに非正規化で保存されている
        deal.ownerEmail = row.owner_email ?? undefined;
      }
      return deal;
    });
    const stakeholders = (stakeholdersRes.data as DbStakeholder[]).map(dbToStakeholder);
    const relationships = (relationshipsRes.data as DbRelationship[]).map(dbToRelationship);
    const orgGroups = (orgGroupsRes.data as DbOrgGroup[]).map(dbToOrgGroup);
    const orgLevels = (orgLevelsRes.data as DbOrgLevelConfig[]);

    // localStorage からの移行チェック（データが空の場合のみ）
    if (deals.length === 0) {
      const migrated = await migrateFromLocalStorage(userId);
      if (migrated) return;
    }

    // dealId ごとにグルーピング
    const stakeholdersByDeal: Record<string, Stakeholder[]> = {};
    const relationshipsByDeal: Record<string, Relationship[]> = {};
    const orgLevelConfigByDeal: Record<string, OrgLevelEntry[]> = {};
    const groupsByDeal: Record<string, OrgGroup[]> = {};

    for (const s of stakeholders) {
      (stakeholdersByDeal[s.dealId] ??= []).push(s);
    }
    for (const r of relationships) {
      (relationshipsByDeal[r.dealId] ??= []).push(r);
    }
    for (const row of orgLevels) {
      const dealId = row.deal_id;
      (orgLevelConfigByDeal[dealId] ??= []).push(dbToOrgLevel(row));
    }
    for (const g of orgGroups) {
      (groupsByDeal[g.dealId] ??= []).push(g);
    }

    // Zustand ストアに反映
    useDealStore.getState().hydrate(deals);
    useStakeholderStore.getState().hydrate(
      stakeholdersByDeal,
      relationshipsByDeal,
      orgLevelConfigByDeal
    );
    useOrgGroupStore.getState().hydrate(groupsByDeal);
    useDealShareStore.getState().hydrate(sharesByDeal);

    // tier_configs を非ブロッキングで後追いロード（404 でもメインロードを遅延させない）
    loadTierConfigsAsync(supabase);

    // 変更監視を開始（初回のみ — 既に購読中なら重複しない）
    if (!syncEnabled) {
      setupSubscriptions(userId);
    }
    syncEnabled = true;
  } catch (err) {
    console.error("Supabase sync init failed:", err);
    toast.error("データの読み込みに失敗しました");
  }
}

// ============================================
// tier_configs 遅延ロード（メインロードをブロックしない）
// ============================================

async function loadTierConfigsAsync(supabase: ReturnType<typeof createClient>) {
  try {
    const { data, error } = await supabase.from("tier_configs").select("*");
    if (error) {
      console.warn("tier_configs テーブル未作成（スキップ）:", error.message);
      return;
    }
    const tierConfigs = (data as DbTierConfig[]);
    const tierConfigByDeal: Record<string, TierEntry[]> = {};
    for (const row of tierConfigs) {
      const dealId = row.deal_id;
      (tierConfigByDeal[dealId] ??= []).push(dbToTierEntry(row));
    }
    // 既存の groupsByDeal を維持しつつ tierConfigByDeal のみ更新
    const currentGroups = useOrgGroupStore.getState().groupsByDeal;
    useOrgGroupStore.getState().hydrate(currentGroups, tierConfigByDeal);
  } catch {
    // エラーは静かに無視
  }
}

// ============================================
// 終了: unsubscribe + reset
// ============================================

export function teardownSupabaseSync() {
  syncEnabled = false;
  currentUserId = null;
  for (const unsub of unsubscribers) unsub();
  unsubscribers = [];
  for (const key of Object.keys(timers)) clearTimeout(timers[key]);

  useDealStore.getState().reset();
  useStakeholderStore.getState().reset();
  useOrgGroupStore.getState().reset();
  useDealShareStore.getState().reset();
}

// ============================================
// 変更監視 + デバウンス同期
// ============================================

function setupSubscriptions(userId: string) {
  // Deals の監視
  unsubscribers.push(
    useDealStore.subscribe(
      (state) => state.deals,
      (deals) => {
        if (!syncEnabled) return;
        debounce("deals", () => syncDeals(deals, userId));
      }
    )
  );

  // Stakeholders の監視
  unsubscribers.push(
    useStakeholderStore.subscribe(
      (state) => state.stakeholdersByDeal,
      (byDeal) => {
        if (!syncEnabled) return;
        debounce("stakeholders", () => syncStakeholders(byDeal));
      }
    )
  );

  // Relationships の監視
  unsubscribers.push(
    useStakeholderStore.subscribe(
      (state) => state.relationshipsByDeal,
      (byDeal) => {
        if (!syncEnabled) return;
        debounce("relationships", () => syncRelationships(byDeal));
      }
    )
  );

  // OrgLevelConfig の監視
  unsubscribers.push(
    useStakeholderStore.subscribe(
      (state) => state.orgLevelConfigByDeal,
      (byDeal) => {
        if (!syncEnabled) return;
        debounce("orgLevels", () => syncOrgLevels(byDeal));
      }
    )
  );

  // OrgGroups の監視
  unsubscribers.push(
    useOrgGroupStore.subscribe(
      (state) => state.groupsByDeal,
      (byDeal) => {
        if (!syncEnabled) return;
        debounce("orgGroups", () => syncOrgGroups(byDeal));
      }
    )
  );

  // TierConfig の監視
  unsubscribers.push(
    useOrgGroupStore.subscribe(
      (state) => state.tierConfigByDeal,
      (byDeal) => {
        if (!syncEnabled) return;
        debounce("tierConfigs", () => syncTierConfigs(byDeal));
      }
    )
  );

  // DealShares の監視
  unsubscribers.push(
    useDealShareStore.subscribe(
      (state) => state.sharesByDeal,
      (byDeal) => {
        if (!syncEnabled) return;
        debounce("dealShares", () => syncDealShares(byDeal, userId));
      }
    )
  );
}

// ============================================
// ヘルパー: 書き込み可能な案件IDセットを取得
// ============================================

/** 自分がオーナー OR editor の案件ID（子テーブル同期用） */
function getWritableDealIds(): Set<string> {
  return new Set(
    useDealStore.getState().deals
      .filter((d) => !d.shareRole || d.shareRole === "editor")
      .map((d) => d.id)
  );
}

// ============================================
// 同期関数: Zustand → Supabase
// ============================================

async function syncDeals(deals: Deal[], userId: string) {
  const supabase = createClient();
  try {
    // 自分がオーナーの案件のみ同期（共有案件は除外）
    const ownedDeals = deals.filter((d) => !d.shareRole);

    // Upsert
    if (ownedDeals.length > 0) {
      const rows = ownedDeals.map((d) => dealToDb(d, userId));
      const { error } = await supabase
        .from("deals")
        .upsert(rows, { onConflict: "id" });
      if (error) {
        // カラム未追加の場合: trashed_at を除外してリトライ
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const rowsCompat = rows.map(({ trashed_at: _t, shared_emails: _se, owner_email: _oe, ...rest }) => rest);
        const { error: retryErr } = await supabase
          .from("deals")
          .upsert(rowsCompat, { onConflict: "id" });
        if (retryErr) throw retryErr;
      }
    }

    // 削除: 自分がオーナーの案件のみ対象（共有案件を誤削除しない）
    const localOwnedIds = ownedDeals.map((d) => d.id);
    const { data: remoteDeals } = await supabase
      .from("deals")
      .select("id, user_id");
    const remoteOwnedIds = (remoteDeals ?? [])
      .filter((d: { id: string; user_id: string }) => d.user_id === userId)
      .map((d: { id: string; user_id: string }) => d.id);
    const toDelete = remoteOwnedIds.filter((id: string) => !localOwnedIds.includes(id));
    if (toDelete.length > 0) {
      await supabase.from("deals").delete().in("id", toDelete);
    }
  } catch (err) {
    console.error("deals sync failed:", err);
    toast.error("組織図データの保存に失敗しました");
  }
}

async function syncStakeholders(byDeal: Record<string, Stakeholder[]>) {
  const supabase = createClient();
  try {
    // 書き込み可能な案件（オーナー + editor）のデータを同期
    const writableDealIds = getWritableDealIds();
    const writableEntries = Object.entries(byDeal).filter(([dealId]) => writableDealIds.has(dealId));
    const all = writableEntries.flatMap(([, list]) => list);

    if (all.length > 0) {
      const rows = all.map(stakeholderToDb);
      const { error } = await supabase
        .from("stakeholders")
        .upsert(rows, { onConflict: "id" });
      if (error) {
        // sort_order カラム未追加の場合: sort_order を除外してリトライ
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const rowsCompat = rows.map(({ sort_order: _so, ...rest }) => rest);
        const { error: retryErr } = await supabase
          .from("stakeholders")
          .upsert(rowsCompat, { onConflict: "id" });
        if (retryErr) throw retryErr;
      }
    }

    // 削除検出: 書き込み可能な案件（オーナー + editor）に属するレコードを対象
    const writableAll = writableEntries.flatMap(([, list]) => list);
    const localIds = new Set(writableAll.map((s) => s.id));
    const { data: remote } = await supabase.from("stakeholders").select("id, deal_id");
    const toDelete = (remote ?? [])
      .filter((r: { id: string; deal_id: string }) => writableDealIds.has(r.deal_id))
      .map((r: { id: string; deal_id: string }) => r.id)
      .filter((id: string) => !localIds.has(id));
    if (toDelete.length > 0) {
      await supabase.from("stakeholders").delete().in("id", toDelete);
    }
    // 変更を他ユーザーに通知
    for (const dealId of writableDealIds) {
      broadcastDataChange(dealId, "stakeholders", currentUserId ?? "");
    }
  } catch (err) {
    console.error("stakeholders sync failed:", err);
    toast.error("人物データの保存に失敗しました");
  }
}

async function syncRelationships(byDeal: Record<string, Relationship[]>) {
  const supabase = createClient();
  try {
    const writableDealIds = getWritableDealIds();
    const writableEntries = Object.entries(byDeal).filter(([dealId]) => writableDealIds.has(dealId));
    const all = writableEntries.flatMap(([, list]) => list);

    if (all.length > 0) {
      const rows = all.map(relationshipToDb);
      const { error } = await supabase
        .from("relationships")
        .upsert(rows, { onConflict: "id" });
      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const rowsCompat = rows.map(({
          direction: _d, color: _c, source_type: _st, target_type: _tt, ...rest
        }) => rest);
        const { error: retryErr } = await supabase
          .from("relationships")
          .upsert(rowsCompat, { onConflict: "id" });
        if (retryErr) throw retryErr;
      }
    }

    const writableAll = writableEntries.flatMap(([, list]) => list);
    const localIds = new Set(writableAll.map((r) => r.id));
    const { data: remote } = await supabase.from("relationships").select("id, deal_id");
    const toDelete = (remote ?? [])
      .filter((r: { id: string; deal_id: string }) => writableDealIds.has(r.deal_id))
      .map((r: { id: string; deal_id: string }) => r.id)
      .filter((id: string) => !localIds.has(id));
    if (toDelete.length > 0) {
      await supabase.from("relationships").delete().in("id", toDelete);
    }
    for (const dealId of writableDealIds) {
      broadcastDataChange(dealId, "relationships", currentUserId ?? "");
    }
  } catch (err) {
    console.error("relationships sync failed:", err);
    toast.error("関係線データの保存に失敗しました");
  }
}

async function syncOrgGroups(byDeal: Record<string, OrgGroup[]>) {
  const supabase = createClient();
  try {
    const writableDealIds = getWritableDealIds();
    const writableEntries = Object.entries(byDeal).filter(([dealId]) => writableDealIds.has(dealId));
    const all = writableEntries.flatMap(([, list]) => list);

    if (all.length > 0) {
      const rows = all.map(orgGroupToDb);
      const { error } = await supabase
        .from("org_groups")
        .upsert(rows, { onConflict: "id" });
      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const rowsWithoutTier = rows.map(({ tier: _, ...rest }) => rest);
        const { error: retryErr } = await supabase
          .from("org_groups")
          .upsert(rowsWithoutTier, { onConflict: "id" });
        if (retryErr) throw retryErr;
      }
    }

    const writableAll = writableEntries.flatMap(([, list]) => list);
    const localIds = new Set(writableAll.map((g) => g.id));
    const { data: remote } = await supabase.from("org_groups").select("id, deal_id");
    const toDelete = (remote ?? [])
      .filter((r: { id: string; deal_id: string }) => writableDealIds.has(r.deal_id))
      .map((r: { id: string; deal_id: string }) => r.id)
      .filter((id: string) => !localIds.has(id));
    if (toDelete.length > 0) {
      await supabase.from("org_groups").delete().in("id", toDelete);
    }
    for (const dealId of writableDealIds) {
      broadcastDataChange(dealId, "org_groups", currentUserId ?? "");
    }
  } catch (err) {
    console.error("org_groups sync failed:", err);
    toast.error("部署データの保存に失敗しました");
  }
}

async function syncOrgLevels(byDeal: Record<string, OrgLevelEntry[]>) {
  const supabase = createClient();
  try {
    const writableDealIds = getWritableDealIds();
    for (const [dealId, entries] of Object.entries(byDeal)) {
      if (!writableDealIds.has(dealId)) continue;
      await supabase.from("org_level_configs").delete().eq("deal_id", dealId);
      if (entries.length > 0) {
        const { error } = await supabase
          .from("org_level_configs")
          .insert(entries.map((e) => orgLevelToDb(e, dealId)));
        if (error) throw error;
      }
    }
  } catch (err) {
    console.error("org_level_configs sync failed:", err);
    toast.error("階層設定の保存に失敗しました");
  }
}

async function syncTierConfigs(byDeal: Record<string, TierEntry[]>) {
  const supabase = createClient();
  try {
    // テーブル存在チェック（未作成なら静かにスキップ）
    const probe = await supabase.from("tier_configs").select("id").limit(0);
    if (probe.error) return;

    const writableDealIds = getWritableDealIds();
    // tier_configs は deal_id + tier がユニーク制約
    // 全件削除して再挿入が最もシンプル（書き込み可能な案件のみ）
    for (const [dealId, entries] of Object.entries(byDeal)) {
      if (!writableDealIds.has(dealId)) continue;
      await supabase.from("tier_configs").delete().eq("deal_id", dealId);
      if (entries.length > 0) {
        const { error } = await supabase
          .from("tier_configs")
          .insert(entries.map((e) => tierEntryToDb(e, dealId)));
        if (error) throw error;
      }
    }
  } catch (err) {
    console.error("tier_configs sync failed:", err);
    toast.error("部署種別設定の保存に失敗しました");
  }
}

async function syncDealShares(byDeal: Record<string, DealShare[]>, userId: string) {
  const supabase = createClient();
  try {
    // 自分がオーナーの共有レコードのみ同期
    const ownedShares = Object.values(byDeal)
      .flat()
      .filter((s) => s.ownerId === userId);

    if (ownedShares.length > 0) {
      const { error } = await supabase
        .from("deal_shares")
        .upsert(ownedShares.map(dealShareToDb), { onConflict: "id" });
      if (error) throw error;
    }

    // 削除検出: 自分がオーナーの共有レコードのみ
    const localIds = new Set(ownedShares.map((s) => s.id));
    const { data: remote } = await supabase
      .from("deal_shares")
      .select("id")
      .eq("owner_id", userId);
    const toDelete = (remote ?? [])
      .map((r: { id: string }) => r.id)
      .filter((id: string) => !localIds.has(id));
    if (toDelete.length > 0) {
      await supabase.from("deal_shares").delete().in("id", toDelete);
    }

    // deals.shared_emails を非正規化で更新（全共有者が参照可能にするため）
    // 注意: updated_at は更新しない（syncDeals の差分検知ループを防止）
    const dealIds = new Set(ownedShares.map((s) => s.dealId));
    for (const dealId of dealIds) {
      const dealShareList = byDeal[dealId] ?? [];
      const sharedEmails = dealShareList.map((s) => ({
        email: s.sharedWithEmail,
        role: s.role,
      }));
      const updatePayload: Record<string, unknown> = { shared_emails: sharedEmails };
      if (currentUserEmail) updatePayload.owner_email = currentUserEmail;
      await supabase
        .from("deals")
        .update(updatePayload)
        .eq("id", dealId);
    }
  } catch (err) {
    console.error("deal_shares sync failed:", err);
    toast.error("共有設定の保存に失敗しました");
  }
}

// ============================================
// localStorage → Supabase 移行
// ============================================

async function migrateFromLocalStorage(userId: string): Promise<boolean> {
  try {
    const dealsRaw = localStorage.getItem("power-chart-deals");
    if (!dealsRaw) return false;

    const parsed = JSON.parse(dealsRaw);
    const deals: Deal[] = parsed?.state?.deals ?? [];
    if (deals.length === 0) return false;

    const supabase = createClient();

    // Deals を挿入
    const { error: dealErr } = await supabase
      .from("deals")
      .insert(deals.map((d) => dealToDb(d, userId)));
    if (dealErr) throw dealErr;

    // Stakeholders + Relationships
    const stakeholderRaw = localStorage.getItem("power-chart-stakeholders");
    if (stakeholderRaw) {
      const sParsed = JSON.parse(stakeholderRaw);
      const sByDeal: Record<string, Stakeholder[]> = sParsed?.state?.stakeholdersByDeal ?? {};
      const rByDeal: Record<string, Relationship[]> = sParsed?.state?.relationshipsByDeal ?? {};
      const lByDeal: Record<string, OrgLevelEntry[]> = sParsed?.state?.orgLevelConfigByDeal ?? {};

      const allS = Object.values(sByDeal).flat();
      if (allS.length > 0) {
        await supabase.from("stakeholders").insert(allS.map(stakeholderToDb));
      }

      const allR = Object.values(rByDeal).flat();
      if (allR.length > 0) {
        await supabase.from("relationships").insert(allR.map(relationshipToDb));
      }

      for (const [dealId, entries] of Object.entries(lByDeal)) {
        if (entries.length > 0) {
          await supabase
            .from("org_level_configs")
            .insert(entries.map((e) => orgLevelToDb(e, dealId)));
        }
      }
    }

    // OrgGroups
    const groupRaw = localStorage.getItem("power-chart-org-groups");
    if (groupRaw) {
      const gParsed = JSON.parse(groupRaw);
      const gByDeal: Record<string, OrgGroup[]> = gParsed?.state?.groupsByDeal ?? {};
      const allG = Object.values(gByDeal).flat();
      if (allG.length > 0) {
        await supabase.from("org_groups").insert(allG.map(orgGroupToDb));
      }
    }

    // localStorage クリア
    localStorage.removeItem("power-chart-deals");
    localStorage.removeItem("power-chart-stakeholders");
    localStorage.removeItem("power-chart-org-groups");

    toast.success("ローカルデータをクラウドに移行しました");

    // 移行後に再読み込み
    await initSupabaseSync(userId);
    return true;
  } catch (err) {
    console.error("localStorage migration failed:", err);
    toast.error("ローカルデータの移行に失敗しました");
    return false;
  }
}

