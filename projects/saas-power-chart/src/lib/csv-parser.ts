import Papa from "papaparse";
import { z } from "zod";
import type { Stakeholder } from "@/types/stakeholder";
import { CSV_COLUMNS, CSV_LABEL_TO_COLUMN, type CsvRow } from "@/types/csv";

const VALID_ROLES = [
  "decision_maker",
  "approver",
  "initiator",
  "evaluator",
  "user",
  "gatekeeper",
  "unknown",
] as const;

const VALID_ATTITUDES = [
  "promoter",
  "supportive",
  "neutral",
  "cautious",
  "opposed",
] as const;

const csvRowSchema = z.object({
  id: z.string().optional().default(""),
  name: z.string().min(1, "氏名は必須です"),
  department: z.string().optional().default(""),
  title: z.string().optional().default(""),
  role_in_deal: z
    .enum(VALID_ROLES)
    .optional()
    .default("unknown"),
  influence_level: z
    .string()
    .optional()
    .default("3")
    .transform(Number)
    .pipe(z.number().min(1).max(5)),
  attitude: z
    .enum(VALID_ATTITUDES)
    .optional()
    .default("neutral"),
  mission: z.string().optional().default(""),
  relationship_owner: z.string().optional().default(""),
  parent_id: z.string().optional().default(""),
  email: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  is_unknown: z.string().optional().default(""),
  org_level: z.string().optional().default(""),
});

export interface ParseError {
  row: number;
  message: string;
  data: Record<string, string>;
}

export interface ParseResult {
  valid: Stakeholder[];
  errors: ParseError[];
  totalRows: number;
}

export function parseCSV(csvText: string, dealId: string): ParseResult {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => {
      const trimmed = h.trim().toLowerCase();
      return CSV_LABEL_TO_COLUMN[trimmed] ?? trimmed;
    },
  });

  const valid: Stakeholder[] = [];
  const errors: ParseError[] = [];

  for (let i = 0; i < result.data.length; i++) {
    const raw = result.data[i];
    const parsed = csvRowSchema.safeParse(raw);

    if (!parsed.success) {
      errors.push({
        row: i + 1,
        message: parsed.error.issues.map((e) => e.message).join(", "),
        data: raw,
      });
      continue;
    }

    const d = parsed.data;
    const stakeholder: Stakeholder = {
      id: d.id || crypto.randomUUID(),
      dealId,
      name: d.name,
      department: d.department ?? "",
      title: d.title ?? "",
      roleInDeal: d.role_in_deal,
      influenceLevel: d.influence_level as 1 | 2 | 3 | 4 | 5,
      attitude: d.attitude,
      mission: d.mission ?? "",
      relationshipOwner: d.relationship_owner ?? "",
      parentId: d.parent_id || null,
      email: d.email ?? "",
      phone: d.phone ?? "",
      notes: d.notes ?? "",
      isUnknown: d.is_unknown === "true" || d.is_unknown === "1" || undefined,
      orgLevel: d.org_level ? Number(d.org_level) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    valid.push(stakeholder);
  }

  return { valid, errors, totalRows: result.data.length };
}

export function stakeholderToCsvRow(s: Stakeholder): CsvRow {
  return {
    id: s.id,
    name: s.name,
    department: s.department,
    title: s.title,
    role_in_deal: s.roleInDeal,
    influence_level: String(s.influenceLevel),
    attitude: s.attitude,
    mission: s.mission,
    relationship_owner: s.relationshipOwner,
    parent_id: s.parentId ?? "",
    email: s.email,
    phone: s.phone,
    notes: s.notes,
    is_unknown: s.isUnknown ? "true" : "",
    org_level: s.orgLevel ? String(s.orgLevel) : "",
  };
}

export function exportCSV(stakeholders: Stakeholder[]): string {
  const rows = stakeholders.map(stakeholderToCsvRow);
  return Papa.unparse(rows, { columns: CSV_COLUMNS });
}

export function downloadCSV(csvString: string, filename: string): void {
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvString], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
