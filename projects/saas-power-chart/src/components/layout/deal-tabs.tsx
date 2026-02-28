"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { GitBranch, Grid3X3, List } from "lucide-react";

interface DealTabsProps {
  dealId: string;
}

const tabs = [
  { label: "組織図", href: "", icon: GitBranch },
  { label: "マトリクス", href: "/matrix", icon: Grid3X3 },
  { label: "一覧", href: "/list", icon: List },
];

export function DealTabs({ dealId }: DealTabsProps) {
  const pathname = usePathname();
  const basePath = `/deals/${dealId}`;

  return (
    <div className="flex border-b bg-white px-6">
      {tabs.map((tab) => {
        const fullPath = basePath + tab.href;
        const isActive = pathname === fullPath;
        return (
          <Link
            key={tab.href}
            href={fullPath}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              isActive
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
