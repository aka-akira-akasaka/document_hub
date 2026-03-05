"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DealHeader } from "@/components/deals/deal-header";
import type { SharedUserInfo } from "@/components/deals/deal-header";
import { DealTabs } from "@/components/layout/deal-tabs";
import { StakeholderSheet } from "@/components/stakeholders/stakeholder-sheet";
import { CsvImportDialog } from "@/components/csv/csv-import-dialog";
import { DealShareDialog } from "@/components/deals/deal-share-dialog";
import { useCsvExport } from "@/components/csv/csv-export-button";
import { useDealStore } from "@/stores/deal-store";
import { useUiStore } from "@/stores/ui-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { useIsOwner, useIsReadOnly } from "@/hooks/use-is-read-only";
import { useDealShareStore } from "@/stores/deal-share-store";
import { duplicateDeal } from "@/lib/deal-duplicator";
import { useRealtimePresence } from "@/hooks/use-realtime-presence";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const EMPTY_SHARE_ARR: import("@/types/deal-share").DealShare[] = [];

/**
 * Hydrationガードラッパー
 * Zustand persist の hydration 完了までストア依存UIをマウントしない。
 */
export default function DealLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hydrated = useHydrated();

  if (!hydrated) return null;

  return <DealLayoutContent>{children}</DealLayoutContent>;
}

/** Zustand ストア依存の実コンテンツ（Hydration完了後にのみマウントされる） */
function DealLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const dealId = params.dealId as string;
  const deal = useDealStore((s) => s.deals.find((d) => d.id === dealId));
  const isActive = !!deal && !deal.trashedAt;
  const isOwner = useIsOwner(dealId);
  const isReadOnly = useIsReadOnly(dealId);
  const { onlineUsers } = useRealtimePresence(dealId);
  useRealtimeSync(dealId);
  const openCsvImport = useUiStore((s) => s.openCsvImport);
  const requestPdfExport = useUiStore((s) => s.requestPdfExport);
  const isPdfExporting = useUiStore((s) => s.isPdfExporting);
  const { handleExport, handleYamlExport } = useCsvExport({
    dealId,
    dealName: deal?.name ?? "export",
  });
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  // 共有案件の場合、既存 share レコードからオーナーIDを取得
  const dealShares = useDealShareStore(
    (s) => s.sharesByDeal[dealId] ?? EMPTY_SHARE_ARR
  );
  const dealOwnerId = dealShares[0]?.ownerId;

  // 共有ユーザーのプロフィール情報を取得（ヘッダーのアバター + 共有ダイアログ表示用）
  // deal.sharedEmails（非正規化）をベースに全共有者を取得（RLS制約回避）
  const sharedEmailsList = deal?.sharedEmails ?? [];
  const [sharedUsers, setSharedUsers] = useState<SharedUserInfo[]>([]);
  const fetchSharedUsers = useCallback(async () => {
    if (sharedEmailsList.length === 0) { setSharedUsers([]); return; }
    try {
      const supabase = createClient();
      const emails = sharedEmailsList.map((e) => e.email);
      const { data } = await supabase
        .from("profiles")
        .select("email, full_name, avatar_url")
        .in("email", emails);
      const profileMap = new Map(
        (data ?? []).map((p: { email: string; full_name: string; avatar_url: string | null }) => [p.email.toLowerCase(), p])
      );
      setSharedUsers(
        sharedEmailsList.map((e) => {
          const p = profileMap.get(e.email.toLowerCase());
          return {
            email: e.email,
            fullName: p?.full_name ?? "",
            avatarUrl: p?.avatar_url ?? null,
            role: e.role,
          };
        })
      );
    } catch {
      // profiles 未作成時など
    }
  }, [sharedEmailsList]);

  useEffect(() => { fetchSharedUsers(); }, [fetchSharedUsers]);

  const handleDuplicate = async () => {
    try {
      const newId = await duplicateDeal(dealId);
      router.push(`/deals/${newId}`);
      toast.success("案件をコピーしました");
    } catch {
      toast.error("案件のコピーに失敗しました");
    }
  };

  useEffect(() => {
    if (!isActive) {
      router.push("/");
    }
  }, [isActive, router]);

  if (!isActive) return null;

  return (
    <div className="flex-1 bg-gray-50 flex flex-col">
      <DealHeader
        deal={deal}
        isOwner={isOwner}
        onImportClick={openCsvImport}
        onCsvExportClick={handleExport}
        onYamlExportClick={handleYamlExport}
        onPdfExportClick={requestPdfExport}
        onShareClick={() => setShareDialogOpen(true)}
        onDuplicateClick={handleDuplicate}
        isPdfExporting={isPdfExporting}
        sharedUsers={sharedUsers}
        onlineUsers={onlineUsers}
      />
      {isReadOnly && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-sm text-amber-700">
          この案件は閲覧のみの共有です
        </div>
      )}
      <DealTabs dealId={dealId} />
      <div className="flex-1 flex flex-col">{children}</div>
      <StakeholderSheet dealId={dealId} />
      <CsvImportDialog dealId={dealId} />
      {(isOwner || deal.shareRole === "editor") && (
        <DealShareDialog
          dealId={dealId}
          dealOwnerId={dealOwnerId}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
        />
      )}
    </div>
  );
}
