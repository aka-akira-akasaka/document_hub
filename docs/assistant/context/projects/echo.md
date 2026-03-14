# Echo — プロジェクトコンテキスト

> AI Genesisが自律開発する音声AIジャーナルアプリ。
> このファイルはセッションをまたいでEchoの設計判断・実装状態を保持します。

*最終更新: 2026-03-14*

---

## プロダクト概要

| 項目 | 内容 |
|---|---|
| **名前** | Echo |
| **カテゴリ** | 音声AIジャーナル（iOS） |
| **コアUX** | マイクタップ→話す→AIインサイト→週次レター |
| **ターゲット** | 25〜40代・自己成長志向・日本語話者 |
| **マネタイズ** | フリーミアム（無料 + ¥580/月 or ¥4,800/年） |

---

## 技術スタック

| レイヤー | 採用技術 | 理由 |
|---|---|---|
| フロントエンド | React Native (Expo 52) + TypeScript | クロスプラット・エコシステム |
| 認証 | Supabase Auth + Apple Sign In | プライバシー重視ユーザー向け |
| DB | Supabase PostgreSQL | RLS・コスト効率 |
| ストレージ | Supabase Storage | 音声ファイル一時保存 |
| 音声文字起こし | OpenAI Whisper API | 精度・日本語対応 |
| AIインサイト | Claude Haiku（Anthropic） | コスト$0.08/100万トークン |
| 週次レター生成 | Claude Haiku via Edge Function | 毎週日曜Cron |
| 課金管理 | RevenueCat | iOS課金の標準 |
| 状態管理 | Zustand | シンプル・軽量 |
| ナビゲーション | React Navigation v6 | スタック+タブ |

---

## 実装済みファイル一覧（Phase 2完了）

```
projects/ai-genesis/app/
├── App.tsx
├── app.json                    ← Expo設定（APIキーはextra.に設定）
├── package.json
├── tsconfig.json
├── babel.config.js
├── SETUP.md                    ← セットアップ手順書
├── .env.example
├── src/
│   ├── types/index.ts           ← User, Entry, Letter, NavParams等
│   ├── config/theme.ts          ← colors, spacing, typography
│   ├── services/
│   │   ├── supabase.ts          ← DB CRUD・認証・ストリーク計算
│   │   ├── whisper.ts           ← 音声→テキスト変換
│   │   ├── claude.ts            ← インサイト生成・週次レター生成
│   │   └── revenuecat.ts        ← 購入・復元・状態確認
│   ├── hooks/
│   │   ├── useAuth.ts           ← Zustand認証ストア
│   │   └── useRecording.ts      ← expo-av録音 + 時間フォーマット
│   ├── navigation/
│   │   └── AppNavigator.tsx     ← Stack(Auth/Main/Insight/Paywall) + BottomTab
│   ├── screens/
│   │   ├── AuthScreen.tsx       ← Apple Sign In画面
│   │   ├── HomeScreen.tsx       ← 録音メイン（ストリーク表示）
│   │   ├── InsightScreen.tsx    ← インサイト表示（キーワード・気づき・問い）
│   │   ├── TimelineScreen.tsx   ← 過去記録一覧（無料7件・Pro無制限）
│   │   ├── LetterScreen.tsx     ← 週次Echoレター（Pro限定）
│   │   ├── SettingsScreen.tsx   ← 設定・プラン・サインアウト
│   │   └── PaywallScreen.tsx    ← 課金ペイウォール（月額/年額選択）
│   └── components/
│       └── RecordButton.tsx     ← パルス/点滅アニメーション付き録音ボタン
└── supabase/
    ├── schema.sql               ← users/entries/lettersテーブル + RLS + トリガー
    └── functions/
        ├── transcribe-audio/    ← Whisper+Claude統合（クライアントから直接呼び出し）
        └── generate-weekly-letter/  ← 毎週日曜Cron（Proユーザー全員）
```

---

## データモデル

### users テーブル
```sql
id UUID (auth.users参照)
apple_id TEXT UNIQUE
email TEXT
display_name TEXT
subscription_status TEXT ('free' | 'pro')
notification_hour INT DEFAULT 8
created_at, updated_at TIMESTAMPTZ
```

### entries テーブル
```sql
id UUID
user_id UUID → users
transcription TEXT          -- 音声の文字起こし
audio_url TEXT              -- Supabase Storage URL（オプション）
insights JSONB              -- { keywords[], insights[], question }
entry_date DATE             -- UNIQUE per user（1日1エントリ）
created_at TIMESTAMPTZ
```

### letters テーブル
```sql
id UUID
user_id UUID → users
content TEXT                -- Echoレター本文
week_start DATE             -- その週の月曜日（UNIQUE per user）
generated_at TIMESTAMPTZ
is_read BOOLEAN DEFAULT false
```

---

## AIプロンプト設計

### インサイト生成（Claude Haiku）

**システムプロンプト方針:**
- 批判・評価しない、観察する
- 「すべき」は使わない
- JSON形式のみで返す: `{ keywords[], insights[], question }`

**入力:** 音声テキスト + 直近7日のキーワード（パターン検出用）

### 週次Echoレター（Claude Haiku）

**方針:**
- 800〜1200文字
- 「あなたへ」で始める
- パターン・変化を指摘（批判しない）
- 来週への1つの問いで締める

---

## 未実装（Phase 3以降）

| 機能 | フェーズ | 優先度 |
|---|---|---|
| プッシュ通知（毎日リマインダー） | Phase 3 | 高 |
| 感情トレンド分析画面 | Phase 4 | 中 |
| Apple Watch連携 | Phase 5 | 低 |
| Android版 | Phase 5 | 低 |
| オンボーディング画面 | Phase 3 | 高 |
| 通知設定UI（時刻変更） | Phase 3 | 中 |

---

## 収益モデル

| 指標 | 値 |
|---|---|
| 月額プラン | ¥580/月 |
| 年額プラン | ¥4,800/年（2ヶ月分お得） |
| 損益分岐点 | 約85人のProユーザー |
| 粗利率（100人時） | ~88% |
| 主なコスト | Supabase $25 + OpenAI $15 + Claude $8 = ~$48/月 |

---

## デザインシステム

| トークン | 値 | 用途 |
|---|---|---|
| bg | `#0A0A0A` | 背景（ほぼ黒） |
| bgCard | `#1A1A1A` | カード背景 |
| primary | `#7C3AED` | バイオレット（メイン） |
| primaryLight | `#A78BFA` | テキスト・強調 |
| recording | `#EF4444` | 録音中（赤） |
| text | `#FFFFFF` | 本文 |
| textSecondary | `#9CA3AF` | 補助テキスト |

---

## 次のアクション（Phase 3開始条件）

ユーザーが以下を準備完了したと通知したら Phase 3 を開始：

1. Supabase: プロジェクト作成 + schema.sql実行
2. APIキー: OpenAI + Anthropic
3. Apple Developer Program 登録
4. RevenueCat: アカウント作成 + 製品ID設定

Phase 3でClaudeが行うこと:
- `projects/ai-genesis/app/app.json` のprojectId設定
- EAS Build (`eas.json`) の設定
- プッシュ通知サービスの実装 (`src/services/notifications.ts`)
- App Store Connect用メタデータ作成（スクリーンショット仕様・説明文）
- プライバシーポリシーページ作成
- TestFlight配信フロー整備
