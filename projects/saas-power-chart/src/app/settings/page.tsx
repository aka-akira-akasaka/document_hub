"use client";

import { useState } from "react";
import { Settings, FileStack, LayoutGrid } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { TemplateManagement } from "@/components/settings/template-management";
import { NodeSettings } from "@/components/settings/node-settings";

interface SettingsCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const SETTINGS_CARDS: SettingsCard[] = [
  {
    id: "templates",
    title: "テンプレート管理",
    description: "案件作成時に使用するテンプレートを管理",
    icon: FileStack,
  },
  {
    id: "node-settings",
    title: "ノード設定",
    description: "組織図のレイアウトや表示に関する設定",
    icon: LayoutGrid,
  },
];

export default function SettingsPage() {
  const [activeCard, setActiveCard] = useState<string | null>(null);

  return (
    <div className="flex-1 bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* ページヘッダー */}
        <div className="flex items-center gap-2 mb-8">
          <Settings className="h-5 w-5 text-gray-500" />
          <h1 className="text-2xl font-bold">設定</h1>
        </div>

        {/* カード一覧 */}
        <div className="grid gap-4 sm:grid-cols-2">
          {SETTINGS_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.id}
                className="cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                onClick={() => setActiveCard(card.id)}
              >
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{card.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {card.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>

      {/* テンプレート管理モーダル */}
      <TemplateManagement
        open={activeCard === "templates"}
        onOpenChange={(isOpen) => {
          if (!isOpen) setActiveCard(null);
        }}
      />

      {/* ノード設定モーダル */}
      <NodeSettings
        open={activeCard === "node-settings"}
        onOpenChange={(isOpen) => {
          if (!isOpen) setActiveCard(null);
        }}
      />
    </div>
  );
}
