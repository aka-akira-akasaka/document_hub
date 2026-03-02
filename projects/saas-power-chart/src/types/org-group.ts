/** 組織グループの階層レベル */
export type OrgGroupLevel = "division" | "section" | "team";

/** 組織グループ（部・課・係） */
export interface OrgGroup {
  id: string;
  dealId: string;
  name: string;
  /** division=部, section=課, team=係/班 */
  level: OrgGroupLevel;
  /** ネスト: sectionはdivisionのID、teamはsectionのIDを持つ */
  parentGroupId: string | null;
  /** グループの色（オプション） */
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export const ORG_GROUP_LEVEL_LABELS: Record<OrgGroupLevel, string> = {
  division: "部",
  section: "課",
  team: "係",
};

/** グループレベルの配色 */
export const ORG_GROUP_LEVEL_COLORS: Record<
  OrgGroupLevel,
  { bg: string; border: string; header: string }
> = {
  division: {
    bg: "rgba(100, 116, 139, 0.06)",
    border: "rgba(100, 116, 139, 0.25)",
    header: "rgba(100, 116, 139, 0.12)",
  },
  section: {
    bg: "rgba(59, 130, 246, 0.04)",
    border: "rgba(59, 130, 246, 0.20)",
    header: "rgba(59, 130, 246, 0.08)",
  },
  team: {
    bg: "rgba(16, 185, 129, 0.04)",
    border: "rgba(16, 185, 129, 0.20)",
    header: "rgba(16, 185, 129, 0.08)",
  },
};
