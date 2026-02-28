"use client";

import type { ParseResult } from "@/lib/csv-parser";
import { ATTITUDE_LABELS, ROLE_LABELS } from "@/lib/constants";
import type { Attitude, RoleInDeal } from "@/types/stakeholder";

interface CsvPreviewTableProps {
  result: ParseResult;
}

export function CsvPreviewTable({ result }: CsvPreviewTableProps) {
  return (
    <div className="border rounded-lg overflow-x-auto max-h-[400px] overflow-y-auto">
      <table className="w-full text-xs">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-2 py-1.5 text-left font-medium">#</th>
            <th className="px-2 py-1.5 text-left font-medium">氏名</th>
            <th className="px-2 py-1.5 text-left font-medium">部署</th>
            <th className="px-2 py-1.5 text-left font-medium">役職</th>
            <th className="px-2 py-1.5 text-left font-medium">役割</th>
            <th className="px-2 py-1.5 text-left font-medium">影響力</th>
            <th className="px-2 py-1.5 text-left font-medium">態度</th>
            <th className="px-2 py-1.5 text-left font-medium">状態</th>
          </tr>
        </thead>
        <tbody>
          {result.valid.map((s, i) => (
            <tr key={s.id} className="border-t">
              <td className="px-2 py-1">{i + 1}</td>
              <td className="px-2 py-1 font-medium">{s.name}</td>
              <td className="px-2 py-1">{s.department}</td>
              <td className="px-2 py-1">{s.title}</td>
              <td className="px-2 py-1">
                {ROLE_LABELS[s.roleInDeal as RoleInDeal]}
              </td>
              <td className="px-2 py-1">{s.influenceLevel}</td>
              <td className="px-2 py-1">
                {ATTITUDE_LABELS[s.attitude as Attitude]}
              </td>
              <td className="px-2 py-1 text-green-600">OK</td>
            </tr>
          ))}
          {result.errors.map((err) => (
            <tr key={`err-${err.row}`} className="border-t bg-red-50">
              <td className="px-2 py-1">{err.row}</td>
              <td className="px-2 py-1" colSpan={6}>
                {err.data.name || "(名前なし)"}
              </td>
              <td className="px-2 py-1 text-red-600 text-xs">
                {err.message}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
