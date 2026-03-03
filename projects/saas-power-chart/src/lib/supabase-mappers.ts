/**
 * Supabase DB (snake_case) ↔ TypeScript (camelCase) 変換ユーティリティ
 */

import type { Deal, DealStage } from "@/types/deal";
import type { Stakeholder, RoleInDeal, InfluenceLevel, Attitude } from "@/types/stakeholder";
import type { Relationship, RelationshipType, RelationshipDirection, RelationshipTargetType } from "@/types/relationship";
import type { OrgGroup } from "@/types/org-group";
import type { OrgLevelEntry } from "@/stores/stakeholder-store";

// ============================================
// DB 行の型定義
// ============================================

export interface DbDeal {
  id: string;
  user_id: string;
  name: string;
  client_name: string;
  stage: string;
  description: string;
  target_amount: number | null;
  expected_close_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbStakeholder {
  id: string;
  deal_id: string;
  name: string;
  department: string;
  title: string;
  role_in_deal: string;
  influence_level: number;
  attitude: string;
  mission: string;
  relationship_owner: string;
  parent_id: string | null;
  email: string;
  phone: string;
  notes: string;
  org_level: number;
  group_id: string | null;
  position_x: number | null;
  position_y: number | null;
  created_at: string;
  updated_at: string;
}

export interface DbRelationship {
  id: string;
  deal_id: string;
  source_id: string;
  target_id: string;
  type: string;
  label: string | null;
  bidirectional: boolean;
  direction: string | null;
  color: string | null;
  target_type: string | null;
  source_handle: string | null;
  target_handle: string | null;
  created_at: string;
}

export interface DbOrgGroup {
  id: string;
  deal_id: string;
  name: string;
  parent_group_id: string | null;
  color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbOrgLevelConfig {
  id: string;
  deal_id: string;
  level: number;
  label: string;
}

// ============================================
// DB → TypeScript 変換
// ============================================

export function dbToDeal(row: DbDeal): Deal {
  return {
    id: row.id,
    name: row.name,
    clientName: row.client_name,
    stage: row.stage as DealStage,
    description: row.description,
    targetAmount: row.target_amount ?? undefined,
    expectedCloseDate: row.expected_close_date ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function dbToStakeholder(row: DbStakeholder): Stakeholder {
  return {
    id: row.id,
    dealId: row.deal_id,
    name: row.name,
    department: row.department,
    title: row.title,
    roleInDeal: row.role_in_deal as RoleInDeal,
    influenceLevel: row.influence_level as InfluenceLevel,
    attitude: row.attitude as Attitude,
    mission: row.mission,
    relationshipOwner: row.relationship_owner,
    parentId: row.parent_id,
    email: row.email,
    phone: row.phone,
    notes: row.notes,
    orgLevel: row.org_level,
    groupId: row.group_id,
    position:
      row.position_x != null && row.position_y != null
        ? { x: row.position_x, y: row.position_y }
        : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function dbToRelationship(row: DbRelationship): Relationship {
  return {
    id: row.id,
    dealId: row.deal_id,
    sourceId: row.source_id,
    targetId: row.target_id,
    type: row.type as RelationshipType,
    label: row.label ?? undefined,
    bidirectional: row.bidirectional,
    direction: (row.direction as RelationshipDirection) ?? undefined,
    color: row.color ?? undefined,
    targetType: (row.target_type as RelationshipTargetType) ?? undefined,
    sourceHandle: row.source_handle ?? undefined,
    targetHandle: row.target_handle ?? undefined,
    createdAt: row.created_at,
  };
}

export function dbToOrgGroup(row: DbOrgGroup): OrgGroup {
  return {
    id: row.id,
    dealId: row.deal_id,
    name: row.name,
    parentGroupId: row.parent_group_id,
    color: row.color ?? undefined,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function dbToOrgLevel(row: DbOrgLevelConfig): OrgLevelEntry {
  return {
    level: row.level,
    label: row.label,
  };
}

// ============================================
// TypeScript → DB 変換
// ============================================

export function dealToDb(deal: Deal, userId: string): DbDeal {
  return {
    id: deal.id,
    user_id: userId,
    name: deal.name,
    client_name: deal.clientName,
    stage: deal.stage,
    description: deal.description,
    target_amount: deal.targetAmount ?? null,
    expected_close_date: deal.expectedCloseDate ?? null,
    created_at: deal.createdAt,
    updated_at: deal.updatedAt,
  };
}

export function stakeholderToDb(s: Stakeholder): Omit<DbStakeholder, "created_at" | "updated_at"> & { created_at: string; updated_at: string } {
  return {
    id: s.id,
    deal_id: s.dealId,
    name: s.name,
    department: s.department,
    title: s.title,
    role_in_deal: s.roleInDeal,
    influence_level: s.influenceLevel,
    attitude: s.attitude,
    mission: s.mission,
    relationship_owner: s.relationshipOwner,
    parent_id: s.parentId,
    email: s.email,
    phone: s.phone,
    notes: s.notes,
    org_level: s.orgLevel,
    group_id: s.groupId,
    position_x: s.position?.x ?? null,
    position_y: s.position?.y ?? null,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  };
}

export function relationshipToDb(r: Relationship): DbRelationship {
  return {
    id: r.id,
    deal_id: r.dealId,
    source_id: r.sourceId,
    target_id: r.targetId,
    type: r.type,
    label: r.label ?? null,
    bidirectional: r.bidirectional,
    direction: r.direction ?? null,
    color: r.color ?? null,
    target_type: r.targetType ?? null,
    source_handle: r.sourceHandle ?? null,
    target_handle: r.targetHandle ?? null,
    created_at: r.createdAt,
  };
}

export function orgGroupToDb(g: OrgGroup): DbOrgGroup {
  return {
    id: g.id,
    deal_id: g.dealId,
    name: g.name,
    parent_group_id: g.parentGroupId,
    color: g.color ?? null,
    sort_order: g.sortOrder,
    created_at: g.createdAt,
    updated_at: g.updatedAt,
  };
}

export function orgLevelToDb(
  entry: OrgLevelEntry,
  dealId: string
): Omit<DbOrgLevelConfig, "id"> {
  return {
    deal_id: dealId,
    level: entry.level,
    label: entry.label,
  };
}
