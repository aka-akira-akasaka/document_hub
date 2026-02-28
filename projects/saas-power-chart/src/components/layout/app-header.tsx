"use client";

import Link from "next/link";
import { BarChart3 } from "lucide-react";

export function AppHeader() {
  return (
    <header className="border-b bg-white">
      <div className="flex h-14 items-center px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <span className="text-lg">Power Chart</span>
        </Link>
      </div>
    </header>
  );
}
