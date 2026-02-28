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
import { CSV_COLUMNS } from "@/types/csv";
import { CsvPreviewTable } from "./csv-preview-table";
import { toast } from "sonner";
import { Upload, FileText, Download } from "lucide-react";

interface CsvImportDialogProps {
  dealId: string;
}

export function CsvImportDialog({ dealId }: CsvImportDialogProps) {
  const open = useUiStore((s) => s.csvImportDialogOpen);
  const closeCsvImport = useUiStore((s) => s.closeCsvImport);
  const importStakeholders = useStakeholderStore((s) => s.importStakeholders);

  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDownloadTemplate = useCallback(() => {
    const headerOnly = CSV_COLUMNS.join(",");
    downloadCSV(headerOnly, "stakeholders_template.csv");
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const result = parseCSV(text, dealId);
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
      if (file && file.name.endsWith(".csv")) {
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
          <DialogTitle>CSVインポート</DialogTitle>
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
              CSVファイルをドラッグ&ドロップ
            </p>
            <p className="text-xs text-gray-400 mb-4">または</p>
            <label>
              <input
                type="file"
                accept=".csv"
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
            <p className="text-xs text-gray-400 mt-4">
              カラム: id, name, department, title, role_in_deal,
              influence_level, attitude, relationship_owner, parent_id,
              email, phone, notes
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs text-blue-500 hover:text-blue-700"
              onClick={handleDownloadTemplate}
            >
              <Download className="h-3 w-3 mr-1" />
              テンプレートCSVをダウンロード
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <span>
                合計: <strong>{parseResult.totalRows}</strong>行
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
