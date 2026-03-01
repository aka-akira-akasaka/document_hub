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
import { useUiStore } from "@/stores/ui-store";
import {
  ROLE_LABELS,
  INFLUENCE_LABELS,
  ATTITUDE_OPTIONS,
  ATTITUDE_LABELS,
} from "@/lib/constants";
import type { InfluenceLevel } from "@/types/stakeholder";
import { EmptyState } from "@/components/layout/empty-state";
import { Users, ArrowUpDown, Search } from "lucide-react";
import type { Stakeholder } from "@/types/stakeholder";

const EMPTY: Stakeholder[] = [];

interface StakeholderTableProps {
  dealId: string;
}

type SortKey = "name" | "department" | "title" | "influenceLevel" | "attitude";

export function StakeholderTable({ dealId }: StakeholderTableProps) {
  const stakeholders = useStakeholderStore((s) =>
    s.stakeholdersByDeal[dealId] ?? EMPTY
  );
  const openSheet = useUiStore((s) => s.openSheet);

  const [search, setSearch] = useState("");
  const [filterAttitude, setFilterAttitude] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);

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

    if (filterAttitude !== "all") {
      list = list.filter((s) => s.attitude === filterAttitude);
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
  }, [stakeholders, search, filterAttitude, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  if (stakeholders.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={Users}
          title="ステークホルダーがいません"
          description="組織図ビューからステークホルダーを追加してください。"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="flex items-center gap-3 p-4 border-b">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filterAttitude} onValueChange={setFilterAttitude}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="態度で絞り込み" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              {ATTITUDE_OPTIONS.map((a) => (
                <SelectItem key={a} value={a}>
                  {ATTITUDE_LABELS[a]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {filtered.length}件
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
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
                  onClick={() => openSheet(s.id, "view")}
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
