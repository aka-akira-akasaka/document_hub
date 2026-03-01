"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  GitBranch,
  Users,
  ClipboardList,
  MapPin,
  Phone,
  Globe,
  Mail,
} from "lucide-react";

interface VendorMasterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ダミーデータ（実際の実装ではストアやAPIから取得）
const DUMMY_VENDOR = {
  name: "株式会社サンプル商事",
  industry: "製造業",
  size: "大手（1000名以上）",
  address: "東京都千代田区大手町1-1-1",
  phone: "03-1234-5678",
  website: "https://example.co.jp",
  email: "info@example.co.jp",
  status: "取引中",
};

const DUMMY_ORG = [
  {
    id: "1",
    name: "代表取締役社長",
    person: "山田 太郎",
    children: [
      {
        id: "2",
        name: "営業本部長",
        person: "鈴木 一郎",
        children: [
          { id: "4", name: "営業一部長", person: "佐藤 花子", children: [] },
          { id: "5", name: "営業二部長", person: "田中 次郎", children: [] },
        ],
      },
      {
        id: "3",
        name: "技術本部長",
        person: "高橋 三郎",
        children: [
          { id: "6", name: "開発部長", person: "伊藤 四郎", children: [] },
        ],
      },
    ],
  },
];

const DUMMY_CONTACTS = [
  { name: "鈴木 一郎", role: "営業本部長", email: "suzuki@example.co.jp", attitude: "推進者" },
  { name: "佐藤 花子", role: "営業一部長", email: "sato@example.co.jp", attitude: "中立" },
  { name: "田中 次郎", role: "営業二部長", email: "tanaka@example.co.jp", attitude: "懸念者" },
];

const DUMMY_HISTORY = [
  { date: "2026-02-15", type: "商談", summary: "初回提案ミーティング実施。概ね好意的な反応。" },
  { date: "2026-01-28", type: "メール", summary: "資料送付・フォローアップ。" },
  { date: "2026-01-10", type: "電話", summary: "担当者との初接触。アポイント取得。" },
];

// 組織図ノードを再帰的に描画
function OrgNode({
  node,
  depth = 0,
}: {
  node: (typeof DUMMY_ORG)[number];
  depth?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* ノードカード */}
      <div
        className="bg-white border rounded-lg px-4 py-2 text-sm shadow-sm min-w-[120px] text-center"
        style={{ marginLeft: depth * 8 }}
      >
        <p className="font-medium text-gray-800">{node.person}</p>
        <p className="text-xs text-gray-500 mt-0.5">{node.name}</p>
      </div>
      {/* 子ノード */}
      {node.children.length > 0 && (
        <div className="flex gap-4 relative">
          {/* 縦線 */}
          <div className="absolute top-0 left-1/2 -translate-x-px w-px h-3 bg-gray-300" />
          {node.children.map((child) => (
            <div key={child.id} className="flex flex-col items-center gap-1 pt-3">
              <div className="w-px h-3 bg-gray-300" />
              <OrgNode node={child} depth={0} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function VendorMasterModal({ open, onOpenChange }: VendorMasterModalProps) {
  const [activeTab, setActiveTab] = useState("detail");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">{DUMMY_VENDOR.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">{DUMMY_VENDOR.industry}</Badge>
                <Badge className="text-xs bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                  {DUMMY_VENDOR.status}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-6 mt-4 mb-0 w-fit">
            <TabsTrigger value="detail" className="flex items-center gap-1.5 text-sm">
              <ClipboardList className="h-3.5 w-3.5" />
              基本情報
            </TabsTrigger>
            <TabsTrigger value="org" className="flex items-center gap-1.5 text-sm">
              <GitBranch className="h-3.5 w-3.5" />
              組織図
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-1.5 text-sm">
              <Users className="h-3.5 w-3.5" />
              担当者
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1.5 text-sm">
              <ClipboardList className="h-3.5 w-3.5" />
              取引履歴
            </TabsTrigger>
          </TabsList>

          {/* 基本情報タブ */}
          <TabsContent value="detail" className="flex-1 overflow-y-auto px-6 py-5 mt-0">
            <div className="grid grid-cols-2 gap-4">
              <InfoItem icon={MapPin} label="所在地" value={DUMMY_VENDOR.address} />
              <InfoItem icon={Phone} label="電話番号" value={DUMMY_VENDOR.phone} />
              <InfoItem icon={Globe} label="Webサイト" value={DUMMY_VENDOR.website} />
              <InfoItem icon={Mail} label="メール" value={DUMMY_VENDOR.email} />
              <InfoItem icon={Building2} label="企業規模" value={DUMMY_VENDOR.size} />
            </div>
          </TabsContent>

          {/* 組織図タブ */}
          <TabsContent value="org" className="flex-1 overflow-auto px-6 py-5 mt-0">
            <div className="flex justify-center pt-4 pb-6">
              {DUMMY_ORG.map((node) => (
                <OrgNode key={node.id} node={node} />
              ))}
            </div>
          </TabsContent>

          {/* 担当者タブ */}
          <TabsContent value="contacts" className="flex-1 overflow-y-auto px-6 py-5 mt-0">
            <div className="space-y-3">
              {DUMMY_CONTACTS.map((contact, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                      {contact.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{contact.name}</p>
                      <p className="text-xs text-gray-500">{contact.role}</p>
                      <p className="text-xs text-gray-400">{contact.email}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      contact.attitude === "推進者"
                        ? "text-green-700 border-green-300 bg-green-50"
                        : contact.attitude === "懸念者"
                        ? "text-red-700 border-red-300 bg-red-50"
                        : "text-gray-600 border-gray-300"
                    }
                  >
                    {contact.attitude}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* 取引履歴タブ */}
          <TabsContent value="history" className="flex-1 overflow-y-auto px-6 py-5 mt-0">
            <div className="space-y-4">
              {DUMMY_HISTORY.map((h, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5" />
                    {i < DUMMY_HISTORY.length - 1 && (
                      <div className="w-px flex-1 bg-gray-200 mt-1" />
                    )}
                  </div>
                  <div className="pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400">{h.date}</span>
                      <Badge variant="outline" className="text-xs">{h.type}</Badge>
                    </div>
                    <p className="text-sm text-gray-700">{h.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// 情報アイテム表示用ヘルパー
function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <Icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-sm text-gray-800">{value}</p>
      </div>
    </div>
  );
}
