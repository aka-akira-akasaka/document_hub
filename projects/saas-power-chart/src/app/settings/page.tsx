import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex-1 bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* ページヘッダー */}
        <div className="flex items-center gap-2 mb-8">
          <Settings className="h-5 w-5 text-gray-500" />
          <h1 className="text-2xl font-bold">設定</h1>
        </div>

        {/* 今後の設定パネルをここに追加 */}
        <p className="text-sm text-gray-400 text-center py-12">
          設定項目は準備中です
        </p>
      </div>
    </div>
  );
}
