"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/ui-store";
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { useOrgGroupStore } from "@/stores/org-group-store";
import { useHistoryStore } from "@/stores/history-store";
import { parseCSV, downloadCSV, type CsvExtendedParseResult } from "@/lib/csv-parser";
import { parseYAML, downloadYAML, YAML_TEMPLATE, type ExtendedParseResult, type ImportGroupData } from "@/lib/yaml-parser";
import { CSV_COLUMNS, CSV_COLUMN_LABELS, CSV_TEMPLATE_EXAMPLE } from "@/types/csv";
import { CsvPreviewTable } from "./csv-preview-table";
import { toast } from "sonner";
import { Upload, FileText, Download, AlertTriangle } from "lucide-react";

// 対応ファイル拡張子
const ACCEPTED_EXTENSIONS = [".csv", ".yaml", ".yml"];

function isYamlFile(filename: string): boolean {
  return filename.endsWith(".yaml") || filename.endsWith(".yml");
}

function isAcceptedFile(filename: string): boolean {
  return ACCEPTED_EXTENSIONS.some((ext) => filename.endsWith(ext));
}

type ImportMode = "append" | "overwrite";

const EMPTY_STAKEHOLDERS: import("@/types/stakeholder").Stakeholder[] = [];

interface CsvImportDialogProps {
  dealId: string;
}

/** パース結果の統合型 */
interface UnifiedParseResult {
  valid: import("@/types/stakeholder").Stakeholder[];
  errors: { row: number; message: string; data: Record<string, string> }[];
  totalRows: number;
  groups: ImportGroupData[];
  tierConfig: { tier: number; label: string }[];
  orgLevels: { level: number; label: string }[];
  groupNameRefs: Map<string, string>;
}

/** YAML/CSVパース結果をUnified形式に変換 */
function toUnified(result: ExtendedParseResult | CsvExtendedParseResult): UnifiedParseResult {
  if ("tierConfig" in result && "orgLevels" in result) {
    // YAML
    const r = result as ExtendedParseResult;
    return {
      valid: r.valid,
      errors: r.errors,
      totalRows: r.totalRows,
      groups: r.groups,
      tierConfig: r.tierConfig,
      orgLevels: r.orgLevels,
      groupNameRefs: r.groupNameRefs,
    };
  }
  // CSV
  const r = result as CsvExtendedParseResult;
  return {
    valid: r.valid,
    errors: r.errors,
    totalRows: r.totalRows,
    groups: r.groups,
    tierConfig: [],
    orgLevels: [],
    groupNameRefs: r.groupNameRefs,
  };
}

export function CsvImportDialog({ dealId }: CsvImportDialogProps) {
  const open = useUiStore((s) => s.csvImportDialogOpen);
  const closeCsvImport = useUiStore((s) => s.closeCsvImport);
  const importStakeholders = useStakeholderStore((s) => s.importStakeholders);
  const setOrgLevels = useStakeholderStore((s) => s.setOrgLevels);
  const stakeholders = useStakeholderStore((s) => s.stakeholdersByDeal[dealId] ?? EMPTY_STAKEHOLDERS);
  const addGroup = useOrgGroupStore((s) => s.addGroup);
  const setTierConfig = useOrgGroupStore((s) => s.setTierConfig);
  const clearOrgGroupData = useOrgGroupStore((s) => s.clearDealData);
  const captureSnapshot = useHistoryStore((s) => s.captureSnapshot);

  const [parseResult, setParseResult] = useState<UnifiedParseResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>("append");
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);

  const handleDownloadCsvTemplate = useCallback(() => {
    const headers = CSV_COLUMNS.map((col) => CSV_COLUMN_LABELS[col]);
    const example = CSV_COLUMNS.map((col) => CSV_TEMPLATE_EXAMPLE[col]);
    const csv = [headers.join(","), example.join(",")].join("\n");
    downloadCSV(csv, "stakeholders_template.csv");
  }, []);

  const handleDownloadYamlTemplate = useCallback(() => {
    downloadYAML(YAML_TEMPLATE, "stakeholders_template.yaml");
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const result = isYamlFile(file.name)
          ? parseYAML(text, dealId)
          : parseCSV(text, dealId);
        setParseResult(toUnified(result));
        setShowOverwriteConfirm(false);
      };
      reader.readAsText(file);
    },
    [dealId]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && isAcceptedFile(file.name)) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleImport = () => {
    if (!parseResult) return;

    // 上書きモードで未確認 → 確認ステップを表示
    if (importMode === "overwrite" && !showOverwriteConfirm) {
      setShowOverwriteConfirm(true);
      return;
    }

    captureSnapshot();

    // --- 上書きモード: 既存グループ・tierConfigをクリア ---
    if (importMode === "overwrite") {
      clearOrgGroupData(dealId);
    }

    // --- tierConfig の適用 ---
    if (parseResult.tierConfig.length > 0) {
      setTierConfig(dealId, parseResult.tierConfig);
    }

    // --- orgLevels の適用 ---
    if (parseResult.orgLevels.length > 0) {
      setOrgLevels(dealId, parseResult.orgLevels);
    }

    // --- グループの作成（親→子の順序で） ---
    const groupNameToId = new Map<string, string>();
    if (parseResult.groups.length > 0) {
      const pending = [...parseResult.groups];
      const maxIter = pending.length * 2;
      let iter = 0;
      while (pending.length > 0 && iter < maxIter) {
        iter++;
        const item = pending.shift()!;
        // 親がまだ作成されていない場合は後回し
        if (item.parentName && !groupNameToId.has(item.parentName)) {
          pending.push(item);
          continue;
        }
        const created = addGroup({
          dealId,
          name: item.name,
          parentGroupId: item.parentName ? groupNameToId.get(item.parentName) ?? null : null,
          color: item.color,
          tier: item.tier,
        });
        groupNameToId.set(item.name, created.id);
      }
    }

    // --- Stakeholderのgroup名参照をIDに解決 ---
    const resolvedStakeholders = parseResult.valid.map((s) => {
      const groupName = parseResult.groupNameRefs.get(s.id);
      if (groupName && groupNameToId.has(groupName)) {
        return { ...s, groupId: groupNameToId.get(groupName)! };
      }
      return s;
    });

    importStakeholders(dealId, resolvedStakeholders, importMode);

    const modeLabel = importMode === "overwrite" ? "上書きインポート" : "追加インポート";
    const groupMsg = groupNameToId.size > 0 ? `（${groupNameToId.size}グループ含む）` : "";
    toast.success(`${parseResult.valid.length}件を${modeLabel}しました${groupMsg}`);
    handleClose();
  };

  const handleClose = () => {
    setParseResult(null);
    setDragOver(false);
    setImportMode("append");
    setShowOverwriteConfirm(false);
    closeCsvImport();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>データインポート</DialogTitle>
        </DialogHeader>

        {!parseResult ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-2">
              CSV / YAML ファイルをドラッグ&ドロップ
            </p>
            <p className="text-xs text-gray-400 mb-4">または</p>
            <label>
              <input
                type="file"
                accept=".csv,.yaml,.yml"
                className="hidden"
                onChange={handleFileInput}
              />
              <Button variant="outline" asChild>
                <span>
                  <FileText className="h-4 w-4 mr-2" />
                  ファイルを選択
                </span>
              </Button>
            </label>
            <div className="text-xs text-gray-400 mt-4 space-y-1">
              <p className="font-medium text-gray-500">CSV形式</p>
              <p>
                カラム: ID, 氏名, 部署, 役職, 案件での役割, 影響力, 態度,
                関係構築担当, 上位者ID, メール, 電話番号, 備考, 所属グループ名, グループ種別
              </p>
              <p className="font-medium text-gray-500 mt-2">YAML形式（推奨）</p>
              <p>
                組織種別・役職階層・グループ構造をすべて保存。エクスポート→インポートで完全再現
              </p>
              <div className="text-left inline-block space-y-0.5 mt-1">
                <p>
                  <span className="text-gray-500 font-medium">影響力:</span>{" "}
                  1（低）〜 5（高）
                </p>
                <p>
                  <span className="text-gray-500 font-medium">態度:</span>{" "}
                  promoter / supportive / neutral / cautious / opposed
                </p>
                <p>
                  <span className="text-gray-500 font-medium">案件での役割:</span>{" "}
                  decision_maker / approver / initiator / evaluator / user / gatekeeper
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-blue-500 hover:text-blue-700"
                onClick={handleDownloadCsvTemplate}
              >
                <Download className="h-3 w-3 mr-1" />
                CSVテンプレート
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-blue-500 hover:text-blue-700"
                onClick={handleDownloadYamlTemplate}
              >
                <Download className="h-3 w-3 mr-1" />
                YAMLテンプレート
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <span>
                合計: <strong>{parseResult.totalRows}</strong>件
              </span>
              <span className="text-green-600">
                有効: <strong>{parseResult.valid.length}</strong>件
              </span>
              {parseResult.errors.length > 0 && (
                <span className="text-red-600">
                  エラー: <strong>{parseResult.errors.length}</strong>件
                </span>
              )}
              {parseResult.groups.length > 0 && (
                <span className="text-blue-600">
                  グループ: <strong>{parseResult.groups.length}</strong>件
                </span>
              )}
            </div>

            <CsvPreviewTable result={parseResult} />

            {/* インポートモード選択 */}
            <div className="border rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">インポート方法</p>
              <div className="flex gap-4">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === "append"}
                    onChange={() => { setImportMode("append"); setShowOverwriteConfirm(false); }}
                    className="accent-blue-600 mt-1"
                  />
                  <div>
                    <span className="text-sm font-medium">追加</span>
                    <p className="text-xs text-muted-foreground">既存データに追加します</p>
                  </div>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="overwrite"
                    checked={importMode === "overwrite"}
                    onChange={() => { setImportMode("overwrite"); setShowOverwriteConfirm(false); }}
                    className="accent-red-600 mt-1"
                  />
                  <div>
                    <span className="text-sm font-medium text-red-600">上書き</span>
                    <p className="text-xs text-muted-foreground">既存データを全て置き換えます</p>
                  </div>
                </label>
              </div>

              {/* 上書き確認メッセージ */}
              {showOverwriteConfirm && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-md p-3 mt-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm text-red-700">
                      現在の組織図（{stakeholders.length}名）を上書きしますがよろしいですか？
                    </p>
                    <p className="text-xs text-red-500">
                      既存のステークホルダーと関係線は全て削除され、インポートデータに置き換わります。この操作は元に戻す（Undo）ことができます。
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleImport}
                      >
                        上書きインポートを実行
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowOverwriteConfirm(false)}
                      >
                        キャンセル
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setParseResult(null); setShowOverwriteConfirm(false); }}>
                やり直す
              </Button>
              {!showOverwriteConfirm && (
                <Button
                  onClick={handleImport}
                  disabled={parseResult.valid.length === 0}
                  variant={importMode === "overwrite" ? "destructive" : "default"}
                >
                  {parseResult.valid.length}件を{importMode === "overwrite" ? "上書き" : ""}インポート
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
