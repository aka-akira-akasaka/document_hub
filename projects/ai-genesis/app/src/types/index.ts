// ユーザー
export interface User {
  id: string;
  appleId: string;
  email?: string;
  displayName?: string;
  subscriptionStatus: 'free' | 'pro';
  notificationHour: number;
  createdAt: string;
}

// 日次エントリ（録音 + AIインサイト）
export interface Entry {
  id: string;
  userId: string;
  transcription: string;       // 音声の文字起こし
  audioUrl?: string;           // Supabase Storage URL（任意）
  entryDate: string;           // YYYY-MM-DD
  insights: EntryInsights;
  createdAt: string;
}

// AIインサイト（Claude Haiku生成）
export interface EntryInsights {
  keywords: string[];          // 今日のキーワード3つ
  insights: string[];          // 気づき3つ
  question: string;            // 来明日への問い
}

// 週次Echoレター
export interface Letter {
  id: string;
  userId: string;
  content: string;             // AIが書いた手紙の本文
  weekStart: string;           // その週の月曜日（YYYY-MM-DD）
  generatedAt: string;
  isRead: boolean;
}

// ナビゲーション型
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Insight: { entryId: string };
  Paywall: { trigger: 'limit' | 'feature' };
};

export type MainTabParamList = {
  Home: undefined;
  Timeline: undefined;
  Letters: undefined;
  Settings: undefined;
};

// 録音状態
export type RecordingState = 'idle' | 'recording' | 'processing' | 'done' | 'error';

// 課金プロダクトID
export const PRODUCT_IDS = {
  MONTHLY: 'echo_pro_monthly',
  ANNUAL: 'echo_pro_annual',
} as const;
