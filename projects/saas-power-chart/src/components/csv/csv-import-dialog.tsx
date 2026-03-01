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
import { parseCSV, downloadCSV, type ParseResult } from "@/lib/csv-parser";
import { parseYAML, downloadYAML, YAML_TEMPLATE } from "@/lib/yaml-parser";
import { CSV_COLUMNS, CSV_COLUMN_LABELS, CSV_TEMPLATE_EXAMPLE } from "@/types/csv";
import { CsvPreviewTable } from "./csv-preview-table";
import { toast } from "sonner";
import { Upload, FileText, Download } from "lucide-react";

// 対応ファイル拡張子
const ACCEPTED_EXTENSIONS = [".csv", ".yaml", ".yml"];

function isYamlFile(filename: string): boolean {
  return filename.endsWith(".yaml") || filename.endsWith(".yml");
}

function isAcceptedFile(filename: string): boolean {
  return ACCEPTED_EXTENSIONS.some((ext) => filename.endsWith(ext));
}

interface CsvImportDialogProps {
  dealId: string;
}

export function CsvImportDialog({ dealId }: CsvImportDialogProps) {
  const open = useUiStore((s) => s.csvImportDialogOpen);
  const closeCsvImport = useUiStore((s) => s.closeCsvImport);
  const importStakeholders = useStakeholderStore((s) => s.importStakeholders);

  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

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
        setParseResult(result);
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
    importStakeholders(dealId, parseResult.valid);
    toast.success(
      `${parseResult.valid.length}件のステークホルダーをインポートしました`
    );
    handleClose();
  };

  const handleClose = () => {
    setParseResult(null);
    setDragOver(false);
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
                関係構築担当, 上位者ID, メール, 電話番号, 備考
              </p>
              <p className="font-medium text-gray-500 mt-2">YAML形式</p>
              <p>
                ツリー構造で階層関係を表現（name, title, department, children）
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
            </div>

            <CsvPreviewTable result={parseResult} />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setParseResult(null)}>
                やり直す
              </Button>
              <Button
                onClick={handleImport}
                disabled={parseResult.valid.length === 0}
              >
                {parseResult.valid.length}件をインポート
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
