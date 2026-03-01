"use client";

import { useState } from "react";
import { Building2, ChevronRight, Settings } from "lucide-react";
import { VendorMasterModal } from "@/components/settings/vendor-master-modal";

// 設定パネルの定義（今後追加しやすいように配列管理）
const SETTING_PANELS = [
  {
    id: "vendor-master",
    icon: Building2,
    title: "取引先マスタ",
    description: "取引先企業の情報・組織図・担当者・取引履歴を管理します",
    color: "bg-blue-100 text-blue-600",
  },
];

export default function SettingsPage() {
  const [vendorModalOpen, setVendorModalOpen] = useState(false);

  return (
    <div className="flex-1 bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* ページヘッダー */}
        <div className="flex items-center gap-2 mb-8">
          <Settings className="h-5 w-5 text-gray-500" />
          <h1 className="text-2xl font-bold">設定</h1>
        </div>

        {/* マスタ管理セクション */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            マスタ管理
          </h2>
          <div className="space-y-3">
            {SETTING_PANELS.map((panel) => (
              <button
                key={panel.id}
                onClick={() => {
                  if (panel.id === "vendor-master") setVendorModalOpen(true);
                }}
                className="w-full flex items-center gap-4 p-5 bg-white rounded-xl border shadow-sm hover:shadow-md hover:border-blue-200 transition-all group text-left"
              >
                {/* アイコン */}
                <div
                  className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${panel.color}`}
                >
                  <panel.icon className="h-5 w-5" />
                </div>

                {/* テキスト */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{panel.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {panel.description}
                  </p>
                </div>

                {/* 矢印 */}
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* 取引先マスタ モーダル */}
      <VendorMasterModal
        open={vendorModalOpen}
        onOpenChange={setVendorModalOpen}
      />
    </div>
  );
}
