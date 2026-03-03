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
import {
  dbToDeal,
  dbToStakeholder,
  dbToRelationship,
  dbToOrgGroup,
  dbToOrgLevel,
  dealToDb,
  stakeholderToDb,
  relationshipToDb,
  orgGroupToDb,
  orgLevelToDb,
  type DbDeal,
  type DbStakeholder,
  type DbRelationship,
  type DbOrgGroup,
  type DbOrgLevelConfig,
} from "@/lib/supabase-mappers";
import type { Deal } from "@/types/deal";
import type { Stakeholder } from "@/types/stakeholder";
import type { Relationship } from "@/types/relationship";
import type { OrgGroup } from "@/types/org-group";
import type { OrgLevelEntry } from "@/stores/stakeholder-store";
import { toast } from "sonner";
import {
  SAMPLE_DEAL,
  SAMPLE_STAKEHOLDERS,
  SAMPLE_RELATIONSHIPS,
  SAMPLE_ORG_GROUPS,
} from "@/lib/sample-data";

// --- 内部状態 ---
let unsubscribers: (() => void)[] = [];
let currentUserId: string | null = null;
let syncEnabled = false;

// デバウンス用タイマー
const timers: Record<string, ReturnType<typeof setTimeout>> = {};

function debounce(key: string, fn: () => void, ms = 500) {
  clearTimeout(timers[key]);
  timers[key] = setTimeout(fn, ms);
}

// ============================================
// 初期化: Supabase → Zustand
// ============================================

export async function initSupabaseSync(userId: string) {
  // 二重初期化防止
  if (currentUserId === userId && syncEnabled) return;
  teardownSupabaseSync();

  currentUserId = userId;
  const supabase = createClient();

  try {
    // 全データを並行取得
    const [dealsRes, stakeholdersRes, relationshipsRes, orgGroupsRes, orgLevelsRes] =
      await Promise.all([
        supabase.from("deals").select("*"),
        supabase.from("stakeholders").select("*"),
        supabase.from("relationships").select("*"),
        supabase.from("org_groups").select("*"),
        supabase.from("org_level_configs").select("*"),
      ]);

    // エラーチェック
    for (const res of [dealsRes, stakeholdersRes, relationshipsRes, orgGroupsRes, orgLevelsRes]) {
      if (res.error) throw res.error;
    }

    const deals = (dealsRes.data as DbDeal[]).map(dbToDeal);
    const stakeholders = (stakeholdersRes.data as DbStakeholder[]).map(dbToStakeholder);
    const relationships = (relationshipsRes.data as DbRelationship[]).map(dbToRelationship);
    const orgGroups = (orgGroupsRes.data as DbOrgGroup[]).map(dbToOrgGroup);
    const orgLevels = (orgLevelsRes.data as DbOrgLevelConfig[]);

    // localStorage からの移行チェック
    if (deals.length === 0) {
      const migrated = await migrateFromLocalStorage(userId);
      if (migrated) return; // 移行完了時は再度 initSupabaseSync が呼ばれる

      // 初回ユーザー: サンプル案件をプリセット
      await seedSampleDeal(userId);
      await initSupabaseSync(userId);
      return;
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

    // 変更監視を開始
    setupSubscriptions(userId);
    syncEnabled = true;
  } catch (err) {
    console.error("Supabase sync init failed:", err);
    toast.error("データの読み込みに失敗しました");
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
}

// ============================================
// 同期関数: Zustand → Supabase
// ============================================

async function syncDeals(deals: Deal[], userId: string) {
  const supabase = createClient();
  try {
    // Upsert
    if (deals.length > 0) {
      const { error } = await supabase
        .from("deals")
        .upsert(deals.map((d) => dealToDb(d, userId)), { onConflict: "id" });
      if (error) throw error;
    }

    // 削除: ローカルにないIDをDBから削除
    const localIds = deals.map((d) => d.id);
    const { data: remoteDeals } = await supabase
      .from("deals")
      .select("id");
    const remoteIds = (remoteDeals ?? []).map((d: { id: string }) => d.id);
    const toDelete = remoteIds.filter((id: string) => !localIds.includes(id));
    if (toDelete.length > 0) {
      await supabase.from("deals").delete().in("id", toDelete);
    }
  } catch (err) {
    console.error("deals sync failed:", err);
    toast.error("案件データの保存に失敗しました");
  }
}

async function syncStakeholders(byDeal: Record<string, Stakeholder[]>) {
  const supabase = createClient();
  try {
    const all = Object.values(byDeal).flat();
    if (all.length > 0) {
      const { error } = await supabase
        .from("stakeholders")
        .upsert(all.map(stakeholderToDb), { onConflict: "id" });
      if (error) throw error;
    }

    // 削除検出
    const localIds = new Set(all.map((s) => s.id));
    const { data: remote } = await supabase.from("stakeholders").select("id");
    const toDelete = (remote ?? [])
      .map((r: { id: string }) => r.id)
      .filter((id: string) => !localIds.has(id));
    if (toDelete.length > 0) {
      await supabase.from("stakeholders").delete().in("id", toDelete);
    }
  } catch (err) {
    console.error("stakeholders sync failed:", err);
    toast.error("人物データの保存に失敗しました");
  }
}

async function syncRelationships(byDeal: Record<string, Relationship[]>) {
  const supabase = createClient();
  try {
    const all = Object.values(byDeal).flat();
    if (all.length > 0) {
      const { error } = await supabase
        .from("relationships")
        .upsert(all.map(relationshipToDb), { onConflict: "id" });
      if (error) throw error;
    }

    const localIds = new Set(all.map((r) => r.id));
    const { data: remote } = await supabase.from("relationships").select("id");
    const toDelete = (remote ?? [])
      .map((r: { id: string }) => r.id)
      .filter((id: string) => !localIds.has(id));
    if (toDelete.length > 0) {
      await supabase.from("relationships").delete().in("id", toDelete);
    }
  } catch (err) {
    console.error("relationships sync failed:", err);
    toast.error("関係線データの保存に失敗しました");
  }
}

async function syncOrgGroups(byDeal: Record<string, OrgGroup[]>) {
  const supabase = createClient();
  try {
    const all = Object.values(byDeal).flat();
    if (all.length > 0) {
      const { error } = await supabase
        .from("org_groups")
        .upsert(all.map(orgGroupToDb), { onConflict: "id" });
      if (error) throw error;
    }

    const localIds = new Set(all.map((g) => g.id));
    const { data: remote } = await supabase.from("org_groups").select("id");
    const toDelete = (remote ?? [])
      .map((r: { id: string }) => r.id)
      .filter((id: string) => !localIds.has(id));
    if (toDelete.length > 0) {
      await supabase.from("org_groups").delete().in("id", toDelete);
    }
  } catch (err) {
    console.error("org_groups sync failed:", err);
    toast.error("部署データの保存に失敗しました");
  }
}

async function syncOrgLevels(byDeal: Record<string, OrgLevelEntry[]>) {
  const supabase = createClient();
  try {
    // OrgLevelConfig は deal_id + level がユニーク制約
    // 全件削除して再挿入が最もシンプル
    for (const [dealId, entries] of Object.entries(byDeal)) {
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

// ============================================
// サンプルデータのプリセット
// ============================================

async function seedSampleDeal(userId: string): Promise<void> {
  const supabase = createClient();
  try {
    // Deal
    const { error: dealErr } = await supabase
      .from("deals")
      .insert([dealToDb(SAMPLE_DEAL, userId)]);
    if (dealErr) throw dealErr;

    // OrgGroups
    const { error: groupErr } = await supabase
      .from("org_groups")
      .insert(SAMPLE_ORG_GROUPS.map(orgGroupToDb));
    if (groupErr) throw groupErr;

    // Stakeholders
    const { error: sErr } = await supabase
      .from("stakeholders")
      .insert(SAMPLE_STAKEHOLDERS.map(stakeholderToDb));
    if (sErr) throw sErr;

    // Relationships
    if (SAMPLE_RELATIONSHIPS.length > 0) {
      const { error: rErr } = await supabase
        .from("relationships")
        .insert(SAMPLE_RELATIONSHIPS.map(relationshipToDb));
      if (rErr) throw rErr;
    }
  } catch (err) {
    console.error("sample deal seeding failed:", err);
    // サンプル投入失敗は致命的ではないのでtoastは出さない
  }
}
