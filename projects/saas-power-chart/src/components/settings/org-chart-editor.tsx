"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ----------------------------
// 型定義
// ----------------------------

export interface OrgNode {
  id: string;
  name: string;
  person: string;
  children: OrgNode[];
}

interface FlatRow {
  id: string;
  name: string;
  person: string;
  depth: number;
  isLast: boolean;
  parentId: string | null;
  hasChildren: boolean;
  ancestorIsLast: boolean[];
}

interface EditForm {
  /** undefined = 新規追加 */
  id?: string;
  /** null = トップレベル */
  parentId: string | null;
  name: string;
  person: string;
}

// ----------------------------
// 初期ダミーデータ
// ----------------------------

const INITIAL_ORG: OrgNode[] = [
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

// ----------------------------
// ユーティリティ関数
// ----------------------------

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function flattenTree(
  nodes: OrgNode[],
  depth = 0,
  parentId: string | null = null,
  ancestorIsLast: boolean[] = [],
  collapsedIds: Set<string>
): FlatRow[] {
  const result: FlatRow[] = [];
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

function findNode(nodes: OrgNode[], id: string): OrgNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

/** 指定ノードの全子孫IDを返す */
function getDescendantIds(nodes: OrgNode[], id: string): Set<string> {
  const node = findNode(nodes, id);
  if (!node) return new Set();
  const ids = new Set<string>();
  function collect(n: OrgNode) {
    n.children.forEach((c) => {
      ids.add(c.id);
      collect(c);
    });
  }
  collect(node);
  return ids;
}

function insertNode(
  nodes: OrgNode[],
  parentId: string | null,
  newNode: OrgNode
): OrgNode[] {
  if (parentId === null) return [...nodes, newNode];
  return nodes.map((node) => {
    if (node.id === parentId)
      return { ...node, children: [...node.children, newNode] };
    return { ...node, children: insertNode(node.children, parentId, newNode) };
  });
}

function updateNode(
  nodes: OrgNode[],
  id: string,
  updates: Partial<Pick<OrgNode, "name" | "person">>
): OrgNode[] {
  return nodes.map((node) => {
    if (node.id === id) return { ...node, ...updates };
    return { ...node, children: updateNode(node.children, id, updates) };
  });
}

function deleteNode(nodes: OrgNode[], id: string): OrgNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => ({ ...node, children: deleteNode(node.children, id) }));
}

/** 全ノードをフラット配列で返す（parentSelect 用） */
function getAllNodes(
  nodes: OrgNode[],
  depth = 0
): { id: string; name: string; depth: number }[] {
  const result: { id: string; name: string; depth: number }[] = [];
  nodes.forEach((node) => {
    result.push({ id: node.id, name: node.name, depth });
    result.push(...getAllNodes(node.children, depth + 1));
  });
  return result;
}

// ----------------------------
// レベルバッジ
// ----------------------------

function getLevelBadge(depth: number): { label: string; className: string } {
  switch (depth) {
    case 0:
      return {
        label: "役員",
        className: "bg-purple-100 text-purple-700 border-purple-200",
      };
    case 1:
      return {
        label: "本部",
        className: "bg-blue-100 text-blue-700 border-blue-200",
      };
    case 2:
      return {
        label: "部",
        className: "bg-green-100 text-green-700 border-green-200",
      };
    default:
      return {
        label: "課",
        className: "bg-orange-100 text-orange-700 border-orange-200",
      };
  }
}

// ----------------------------
// OrgChartEditor 本体
// ----------------------------

export function OrgChartEditor() {
  const [orgData, setOrgData] = useState<OrgNode[]>(INITIAL_ORG);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const flatRows = flattenTree(orgData, 0, null, [], collapsedIds);
  const allNodes = getAllNodes(orgData);
  const isEditing = editForm !== null;

  // 編集中ノードの子孫を除いた選択肢（循環防止）
  const parentSelectOptions = isEditing
    ? allNodes.filter((n) => {
        if (!editForm.id) return true;
        if (n.id === editForm.id) return false;
        return !getDescendantIds(orgData, editForm.id).has(n.id);
      })
    : allNodes;

  // ----------------------------
  // イベントハンドラ
  // ----------------------------

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openAdd = (parentId: string | null) => {
    setEditForm({ parentId, name: "", person: "" });
    setDeletingId(null);
  };

  const openEdit = (row: FlatRow) => {
    const node = findNode(orgData, row.id);
    if (!node) return;
    setEditForm({ id: node.id, parentId: row.parentId, name: node.name, person: node.person });
    setDeletingId(null);
  };

  const handleSave = () => {
    if (!editForm || !editForm.name.trim()) return;

    if (editForm.id) {
      // 既存ノードの更新
      const row = flatRows.find((r) => r.id === editForm.id);
      const originalParentId = row?.parentId ?? null;

      if (originalParentId !== editForm.parentId) {
        // 親が変わった → 削除してから新しい位置に挿入（子ツリーごと移動）
        const node = findNode(orgData, editForm.id)!;
        const updatedNode: OrgNode = {
          ...node,
          name: editForm.name,
          person: editForm.person,
        };
        setOrgData((prev) =>
          insertNode(deleteNode(prev, editForm.id!), editForm.parentId, updatedNode)
        );
      } else {
        // 同じ親 → 名前・担当者だけ更新
        setOrgData((prev) =>
          updateNode(prev, editForm.id!, {
            name: editForm.name,
            person: editForm.person,
          })
        );
      }
    } else {
      // 新規追加
      const newNode: OrgNode = {
        id: generateId(),
        name: editForm.name,
        person: editForm.person,
        children: [],
      };
      setOrgData((prev) => insertNode(prev, editForm.parentId, newNode));
    }

    setEditForm(null);
  };

  const handleDelete = (id: string) => {
    setOrgData((prev) => deleteNode(prev, id));
    setDeletingId(null);
    // 編集中だった場合はフォームを閉じる
    if (editForm?.id === id) setEditForm(null);
  };

  // ----------------------------
  // レンダリング
  // ----------------------------

  return (
    <div className="flex gap-4 min-h-0">
      {/* ─── 左側: ツリーリスト ─── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-500">
            {allNodes.length} 件の部署・役職
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => openAdd(null)}
          >
            <Plus className="h-3 w-3" />
            部署を追加
          </Button>
        </div>

        {/* ツリーリスト */}
        <div className="border rounded-lg overflow-hidden divide-y divide-gray-100">
          {flatRows.length === 0 && (
            <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
              <Building2 className="h-8 w-8 opacity-30" />
              <p className="text-sm">部署が登録されていません</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-1 h-7 text-xs gap-1"
                onClick={() => openAdd(null)}
              >
                <Plus className="h-3 w-3" />
                最初の部署を追加
              </Button>
            </div>
          )}

          {flatRows.map((row) => {
            const levelBadge = getLevelBadge(row.depth);
            const isCollapsed = collapsedIds.has(row.id);
            const isDeleting = deletingId === row.id;
            const isBeingEdited = editForm?.id === row.id;

            return (
              <div key={row.id}>
                {/* 行本体 */}
                <div
                  className={`flex items-center gap-0 transition-colors group ${
                    isBeingEdited
                      ? "bg-blue-50"
                      : isDeleting
                      ? "bg-red-50"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  {/* ── インデント＋接続線エリア ── */}
                  <div
                    className="flex items-stretch shrink-0"
                    style={{ width: row.depth * 20 + 16 }}
                  >
                    {/* 先祖レベルの縦線 */}
                    {row.ancestorIsLast.map((isLast, i) => (
                      <div key={i} className="w-5 shrink-0 flex justify-center">
                        {!isLast && (
                          <div className="w-px bg-gray-200 self-stretch" />
                        )}
                      </div>
                    ))}
                    {/* 現在ノードの接続部（L字型） */}
                    {row.depth > 0 && (
                      <div className="w-5 shrink-0 relative flex justify-center">
                        <div className="absolute top-0 bottom-1/2 left-1/2 -translate-x-px w-px bg-gray-200" />
                        <div className="absolute top-1/2 left-1/2 right-0 h-px bg-gray-200" />
                        {!row.isLast && (
                          <div className="absolute top-1/2 bottom-0 left-1/2 -translate-x-px w-px bg-gray-200" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── 折りたたみトグル ── */}
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

                  {/* ── 行コンテンツ ── */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 py-2.5 pr-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 h-4 shrink-0 font-medium ${levelBadge.className}`}
                    >
                      {levelBadge.label}
                    </Badge>
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {row.name}
                    </span>
                    {row.person && (
                      <span className="text-xs text-gray-400 shrink-0">
                        {row.person}
                      </span>
                    )}
                  </div>

                  {/* ── アクションボタン（ホバー表示） ── */}
                  <div className="flex items-center gap-0.5 pr-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      title="子部署を追加"
                      onClick={() => openAdd(row.id)}
                      className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      title="編集"
                      onClick={() => openEdit(row)}
                      className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      title="削除"
                      onClick={() => {
                        setDeletingId(row.id);
                        setEditForm(null);
                      }}
                      className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* ── インライン削除確認バー ── */}
                {isDeleting && (
                  <div className="flex items-center justify-between px-4 py-2 bg-red-50 border-t border-red-100">
                    <p className="text-xs text-red-700 leading-relaxed">
                      「<span className="font-semibold">{row.name}</span>」を削除しますか？
                      {row.hasChildren && (
                        <span className="ml-1 text-red-500">
                          （配下の部署もすべて削除されます）
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs px-2"
                        onClick={() => setDeletingId(null)}
                      >
                        キャンセル
                      </Button>
                      <Button
                        size="sm"
                        className="h-6 text-xs px-2 bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => handleDelete(row.id)}
                      >
                        削除する
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* フッター補足 */}
        <p className="text-xs text-gray-400 mt-3 text-center">
          行をホバーして子部署の追加・編集・削除ができます
        </p>
      </div>

      {/* ─── 右側: 追加・編集フォームパネル ─── */}
      {isEditing && (
        <div className="w-60 shrink-0 border rounded-lg bg-gray-50 flex flex-col">
          {/* パネルヘッダー */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-white rounded-t-lg">
            <h3 className="text-sm font-semibold text-gray-800">
              {editForm.id ? "部署を編集" : "部署を追加"}
            </h3>
            <button
              onClick={() => setEditForm(null)}
              className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* フォーム本体 */}
          <div className="flex flex-col gap-4 p-4 flex-1">
            {/* 部署名 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">
                部署名・役職名
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                placeholder="例：営業本部"
                className="h-8 text-sm"
                autoFocus
              />
            </div>

            {/* 担当者名 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">
                担当者名
              </label>
              <Input
                value={editForm.person}
                onChange={(e) =>
                  setEditForm({ ...editForm, person: e.target.value })
                }
                placeholder="例：山田 太郎"
                className="h-8 text-sm"
              />
            </div>

            {/* 上位部署 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">
                上位部署
              </label>
              <Select
                value={editForm.parentId ?? "__root__"}
                onValueChange={(val) =>
                  setEditForm({
                    ...editForm,
                    parentId: val === "__root__" ? null : val,
                  })
                }
              >
                <SelectTrigger className="h-8 text-sm w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__root__">
                    <span className="text-gray-400">（トップレベル）</span>
                  </SelectItem>
                  {parentSelectOptions.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      <span>
                        {n.depth > 0 && (
                          <span className="text-gray-300 mr-1">
                            {"└".padStart(n.depth * 2, "\u00a0\u00a0")}
                          </span>
                        )}
                        {n.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editForm.id && (
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  変更すると配下の部署ごと移動します
                </p>
              )}
            </div>
          </div>

          {/* フォームフッター（ボタン） */}
          <div className="flex gap-2 px-4 py-3 border-t bg-white rounded-b-lg">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs"
              onClick={() => setEditForm(null)}
            >
              キャンセル
            </Button>
            <Button
              size="sm"
              className="flex-1 h-8 text-xs gap-1"
              onClick={handleSave}
              disabled={!editForm.name.trim()}
            >
              <Check className="h-3.5 w-3.5" />
              保存
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
