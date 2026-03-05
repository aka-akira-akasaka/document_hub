"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AttitudeBadge } from "./attitude-badge";
import { useStakeholderStore } from "@/stores/stakeholder-store";
import { useOrgGroupStore } from "@/stores/org-group-store";
import { useUiStore } from "@/stores/ui-store";
import {
  ROLE_LABELS,
  ROLE_OPTIONS,
  INFLUENCE_LABELS,
  ATTITUDE_OPTIONS,
  ATTITUDE_LABELS,
} from "@/lib/constants";
import type { InfluenceLevel, RoleInDeal } from "@/types/stakeholder";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/layout/empty-state";
import { Users, ArrowUpDown, Search, Plus, Filter, X } from "lucide-react";
import type { Stakeholder } from "@/types/stakeholder";

const EMPTY: Stakeholder[] = [];
const EMPTY_GROUPS: import("@/types/org-group").OrgGroup[] = [];

interface StakeholderTableProps {
  dealId: string;
}

type SortKey = "name" | "department" | "title" | "influenceLevel" | "attitude";

export function StakeholderTable({ dealId }: StakeholderTableProps) {
  const stakeholders = useStakeholderStore((s) =>
    s.stakeholdersByDeal[dealId] ?? EMPTY
  );
  const orgGroups = useOrgGroupStore((s) => s.groupsByDeal[dealId] ?? EMPTY_GROUPS);
  const openSheet = useUiStore((s) => s.openSheet);
  const openSheetForCreate = useUiStore((s) => s.openSheetForCreate);

  // groupId → グループ名の逆引きMap（親部署表示用）
  const groupNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of orgGroups) {
      map.set(g.id, g.name);
    }
    return map;
  }, [orgGroups]);

  // groupId → 親部署名を解決（グループの parentGroupId を辿る）
  const getParentGroupName = useMemo(() => {
    return (groupId: string | null): string => {
      if (!groupId) return "";
      const group = orgGroups.find((g) => g.id === groupId);
      if (!group?.parentGroupId) return "";
      return groupNameMap.get(group.parentGroupId) ?? "";
    };
  }, [orgGroups, groupNameMap]);

  // --- フィルタ状態 ---
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterTitle, setFilterTitle] = useState<string>("all");
  const [filterInfluence, setFilterInfluence] = useState<string>("all");
  const [filterAttitude, setFilterAttitude] = useState<string>("all");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterOwner, setFilterOwner] = useState<string>("all");

  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);

  // アクティブフィルタ数
  const activeFilterCount = [
    filterDepartment, filterTitle, filterInfluence,
    filterAttitude, filterGroup, filterRole, filterOwner,
  ].filter((v) => v !== "all").length;

  // 動的候補の抽出
  const uniqueDepartments = useMemo(
    () => [...new Set(stakeholders.map((s) => s.department).filter(Boolean))].sort(),
    [stakeholders]
  );
  const uniqueTitles = useMemo(
    () => [...new Set(stakeholders.map((s) => s.title).filter(Boolean))].sort(),
    [stakeholders]
  );
  const uniqueOwners = useMemo(
    () => [...new Set(stakeholders.map((s) => s.relationshipOwner).filter(Boolean))].sort(),
    [stakeholders]
  );
  const uniqueGroups = useMemo(() => {
    const ids = new Set(stakeholders.map((s) => s.groupId).filter(Boolean));
    return orgGroups
      .filter((g) => ids.has(g.id))
      .map((g) => ({ id: g.id, name: g.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [stakeholders, orgGroups]);

  // --- フィルタ＆ソート ---
  const filtered = useMemo(() => {
    let list = [...stakeholders];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q) ||
          s.title.toLowerCase().includes(q)
      );
    }

    if (filterDepartment !== "all") {
      list = list.filter((s) => s.department === filterDepartment);
    }
    if (filterTitle !== "all") {
      list = list.filter((s) => s.title === filterTitle);
    }
    if (filterInfluence !== "all") {
      list = list.filter((s) => String(s.influenceLevel) === filterInfluence);
    }
    if (filterAttitude !== "all") {
      list = list.filter((s) => s.attitude === filterAttitude);
    }
    if (filterGroup !== "all") {
      list = list.filter((s) => s.groupId === filterGroup);
    }
    if (filterRole !== "all") {
      list = list.filter((s) => s.roleInDeal === filterRole);
    }
    if (filterOwner !== "all") {
      list = list.filter((s) => s.relationshipOwner === filterOwner);
    }

    list.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortAsc ? av - bv : bv - av;
      }
      return sortAsc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

    return list;
  }, [stakeholders, search, filterDepartment, filterTitle, filterInfluence, filterAttitude, filterGroup, filterRole, filterOwner, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const clearFilters = () => {
    setFilterDepartment("all");
    setFilterTitle("all");
    setFilterInfluence("all");
    setFilterAttitude("all");
    setFilterGroup("all");
    setFilterRole("all");
    setFilterOwner("all");
  };

  if (stakeholders.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <EmptyState
            icon={Users}
            title="ステークホルダーがいません"
            description="ステークホルダーを追加して管理を開始しましょう。"
          />
          <Button onClick={() => openSheetForCreate(null, null)}>
            <Plus className="w-4 h-4 mr-1" />
            人を追加
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-hidden flex flex-col">
      <div className="bg-white rounded-lg shadow-sm border flex flex-col min-h-0 flex-1">
        {/* ツールバー */}
        <div className="flex items-center gap-3 p-4 border-b shrink-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button
            variant={filterOpen ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <Filter className="h-4 w-4 mr-1" />
            絞り込み
            {activeFilterCount > 0 && (
              <span className="ml-1.5 bg-white text-primary text-[10px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <span className="text-sm text-muted-foreground">
            {filtered.length}件
          </span>
          <div className="ml-auto">
            <Button size="sm" onClick={() => openSheetForCreate(null, null)}>
              <Plus className="w-4 h-4 mr-1" />
              人を追加
            </Button>
          </div>
        </div>

        {/* 絞り込みフォーム（折りたたみ） */}
        {filterOpen && (
          <div className="border-b bg-gray-50/50 px-4 py-3 shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <FilterSelect
                label="部署"
                value={filterDepartment}
                onChange={setFilterDepartment}
                options={uniqueDepartments.map((d) => ({ value: d, label: d }))}
              />
              <FilterSelect
                label="役職"
                value={filterTitle}
                onChange={setFilterTitle}
                options={uniqueTitles.map((t) => ({ value: t, label: t }))}
              />
              <FilterSelect
                label="影響力"
                value={filterInfluence}
                onChange={setFilterInfluence}
                options={([1, 2, 3, 4, 5] as InfluenceLevel[]).map((l) => ({
                  value: String(l),
                  label: INFLUENCE_LABELS[l],
                }))}
              />
              <FilterSelect
                label="態度"
                value={filterAttitude}
                onChange={setFilterAttitude}
                options={ATTITUDE_OPTIONS.map((a) => ({
                  value: a,
                  label: ATTITUDE_LABELS[a],
                }))}
              />
              <FilterSelect
                label="親部署"
                value={filterGroup}
                onChange={setFilterGroup}
                options={uniqueGroups.map((g) => ({ value: g.id, label: g.name }))}
              />
              <FilterSelect
                label="役割"
                value={filterRole}
                onChange={setFilterRole}
                options={ROLE_OPTIONS.map((r) => ({
                  value: r,
                  label: ROLE_LABELS[r as RoleInDeal],
                }))}
              />
              <FilterSelect
                label="担当者"
                value={filterOwner}
                onChange={setFilterOwner}
                options={uniqueOwners.map((o) => ({ value: o, label: o }))}
              />
            </div>
            {activeFilterCount > 0 && (
              <div className="mt-2 flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground">
                  <X className="h-3 w-3 mr-1" />
                  条件をクリア
                </Button>
              </div>
            )}
          </div>
        )}

        {/* テーブル（スクロール対象） */}
        <div className="overflow-auto flex-1 min-h-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {(
                  [
                    ["name", "氏名"],
                    ["department", "部署"],
                    ["title", "役職"],
                    ["influenceLevel", "影響力"],
                    ["attitude", "態度"],
                  ] as [SortKey, string][]
                ).map(([key, label]) => (
                  <th
                    key={key}
                    className="px-4 py-2.5 text-left font-medium cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort(key)}
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      <ArrowUpDown className="h-3 w-3 text-gray-400" />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-2.5 text-left font-medium">親部署</th>
                <th className="px-4 py-2.5 text-left font-medium">役割</th>
                <th className="px-4 py-2.5 text-left font-medium">ミッション</th>
                <th className="px-4 py-2.5 text-left font-medium">担当者</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() => openSheet(s.id, "edit")}
                >
                  <td className="px-4 py-2.5 font-medium">{s.name}</td>
                  <td className="px-4 py-2.5">{s.department}</td>
                  <td className="px-4 py-2.5">{s.title}</td>
                  <td className="px-4 py-2.5">
                    {INFLUENCE_LABELS[s.influenceLevel as InfluenceLevel]}
                  </td>
                  <td className="px-4 py-2.5">
                    <AttitudeBadge attitude={s.attitude} />
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">
                    {getParentGroupName(s.groupId)}
                  </td>
                  <td className="px-4 py-2.5">
                    {ROLE_LABELS[s.roleInDeal]}
                  </td>
                  <td className="px-4 py-2.5 max-w-[200px] truncate">
                    {s.mission}
                  </td>
                  <td className="px-4 py-2.5">{s.relationshipOwner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** 個別フィルタ用セレクトコンポーネント */
function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-gray-500">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべて</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
