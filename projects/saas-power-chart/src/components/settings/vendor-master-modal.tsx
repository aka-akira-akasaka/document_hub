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
import { Button } from "@/components/ui/button";
import {
  Building2,
  GitBranch,
  Users,
  ClipboardList,
  MapPin,
  Phone,
  Globe,
  Mail,
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
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

// 組織ノードの型定義
interface OrgNode {
  id: string;
  name: string;
  person: string;
  children: OrgNode[];
}

// フラット化された行の型
interface FlatOrgRow {
  id: string;
  name: string;
  person: string;
  depth: number;
  isLast: boolean;
  parentId: string | null;
  hasChildren: boolean;
  // 先祖ノードのisLast情報（縦線描画用）
  ancestorIsLast: boolean[];
}

const DUMMY_ORG: OrgNode[] = [
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

// 深さに応じた部署レベルバッジのスタイル
function getLevelBadge(depth: number): { label: string; className: string } {
  switch (depth) {
    case 0:
      return { label: "役員", className: "bg-purple-100 text-purple-700 border-purple-200" };
    case 1:
      return { label: "本部", className: "bg-blue-100 text-blue-700 border-blue-200" };
    case 2:
      return { label: "部", className: "bg-green-100 text-green-700 border-green-200" };
    default:
      return { label: "課", className: "bg-orange-100 text-orange-700 border-orange-200" };
  }
}

// ツリーデータをフラット配列に変換
function flattenTree(
  nodes: OrgNode[],
  depth = 0,
  parentId: string | null = null,
  ancestorIsLast: boolean[] = [],
  collapsedIds: Set<string>
): FlatOrgRow[] {
  const result: FlatOrgRow[] = [];
  nodes.forEach((node, index) => {
    const isLast = index === nodes.length - 1;
    result.push({
      id: node.id,
      name: node.name,
      person: node.person,
      depth,
      isLast,
      parentId,
      hasChildren: node.children.length > 0,
      ancestorIsLast,
    });
    // 折りたたまれていない場合のみ子ノードを展開
    if (node.children.length > 0 && !collapsedIds.has(node.id)) {
      result.push(
        ...flattenTree(
          node.children,
          depth + 1,
          node.id,
          [...ancestorIsLast, isLast],
          collapsedIds
        )
      );
    }
  });
  return result;
}

// 組織階層を行で表示するコンポーネント
function OrgHierarchyList({ nodes }: { nodes: OrgNode[] }) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const flatRows = flattenTree(nodes, 0, null, [], collapsedIds);

  return (
    <div className="flex flex-col gap-0">
      {/* ヘッダー行 */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">
          {flatRows.length} 件の部署・役職
        </p>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          部署を追加
        </Button>
      </div>

      {/* 階層リスト */}
      <div className="border rounded-lg overflow-hidden divide-y divide-gray-100">
        {flatRows.map((row) => {
          const levelBadge = getLevelBadge(row.depth);
          const isCollapsed = collapsedIds.has(row.id);

          return (
            <div
              key={row.id}
              className="flex items-center gap-0 bg-white hover:bg-gray-50 group transition-colors"
            >
              {/* インデント＋接続線エリア */}
              <div className="flex items-stretch shrink-0" style={{ width: row.depth * 20 + 16 }}>
                {/* 先祖の縦線 */}
                {row.ancestorIsLast.map((isLast, i) => (
                  <div key={i} className="w-5 shrink-0 flex justify-center">
                    {!isLast && (
                      <div className="w-px bg-gray-200 self-stretch" />
                    )}
                  </div>
                ))}
                {/* 現在ノードの接続部 */}
                {row.depth > 0 && (
                  <div className="w-5 shrink-0 relative flex justify-center">
                    {/* 縦線（上半分）*/}
                    <div className="absolute top-0 bottom-1/2 left-1/2 -translate-x-px w-px bg-gray-200" />
                    {/* 横線 */}
                    <div className="absolute top-1/2 left-1/2 right-0 h-px bg-gray-200" />
                    {/* 縦線（下半分）: 最後の子でなければ表示 */}
                    {!row.isLast && (
                      <div className="absolute top-1/2 bottom-0 left-1/2 -translate-x-px w-px bg-gray-200" />
                    )}
                  </div>
                )}
              </div>

              {/* 折りたたみトグル */}
              <div className="w-5 h-10 flex items-center justify-center shrink-0">
                {row.hasChildren ? (
                  <button
                    onClick={() => toggleCollapse(row.id)}
                    className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded transition-colors"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                ) : (
                  <div className="w-4 h-4" />
                )}
              </div>

              {/* メインコンテンツ */}
              <div className="flex items-center gap-2.5 flex-1 min-w-0 py-2.5 pr-2">
                {/* レベルバッジ */}
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 h-4 shrink-0 font-medium ${levelBadge.className}`}
                >
                  {levelBadge.label}
                </Badge>

                {/* 役職名 */}
                <span className="text-sm font-medium text-gray-800 truncate">
                  {row.name}
                </span>

                {/* 担当者名 */}
                <span className="text-xs text-gray-500 shrink-0">
                  {row.person}
                </span>
              </div>

              {/* アクションボタン（ホバー時に表示） */}
              <div className="flex items-center gap-0.5 pr-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  title="子部署を追加"
                  className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  title="編集"
                  className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  title="削除"
                  className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* パワーチャートへの誘導 */}
      <p className="text-xs text-gray-400 mt-3 text-center">
        樹形図での可視化はパワーチャートで確認できます
      </p>
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

          {/* 組織図タブ（行で階層表示） */}
          <TabsContent value="org" className="flex-1 overflow-y-auto px-6 py-5 mt-0">
            <OrgHierarchyList nodes={DUMMY_ORG} />
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
