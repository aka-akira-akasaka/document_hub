import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SideNav } from "@/components/layout/side-nav";
import { AuthProvider } from "@/components/auth/auth-provider";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Power Chart - 組織図・パワーチャート作成ツール",
  description: "組織図・パワーチャート作成ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.variable} font-sans antialiased`}>
        <AuthProvider>
          <TooltipProvider>
            {/* サイドバー + メインコンテンツ の横並びレイアウト */}
            <div className="flex min-h-screen">
              <SideNav />
              <div className="flex-1 flex flex-col min-w-0">{children}</div>
            </div>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
