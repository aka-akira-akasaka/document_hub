# セッション状態 — 現在のプロジェクト全体像

> このファイルはセッションをまたいで状態を維持するための「記憶」です。
> 重要な決定・進捗があるたびに更新します。
> **新しいセッション開始時は必ずこのファイルを最初に読んでください。**

*最終更新: 2026-03-14（Phase 3進行中）*

---

## 組織概要

| 項目 | 内容 |
|---|---|
| **組織名** | document_hub |
| **目的** | ビジネスアシスタント + SaaS開発（DevHQ）の統合組織 |
| **オーナー** | aka-akira-akasaka |
| **リポジトリ** | `git@github.com:aka-akira-akasaka/document_hub` |
| **Gitブランチ規則** | `claude/` で始まりセッションIDで終わる |

---

## アクティブプロジェクト

### 🚀 AI Genesis（最優先・進行中）

| 項目 | 内容 |
|---|---|
| **概要** | AIが自律的に設計・開発するSaaSプロダクト実証プロジェクト |
| **プロダクト** | Echo — 音声AIジャーナルアプリ（iOS） |
| **ディレクトリ** | `projects/ai-genesis/` |
| **詳細コンテキスト** | `docs/assistant/context/projects/echo.md` |

**フェーズ進捗:**

| フェーズ | 内容 | 状態 |
|---|---|---|
| Phase 1 | 市場調査・PRD・ナラティブ | ✅ 完了 |
| Phase 2 | MVPアプリ実装（React Native + Expo） | ✅ 完了 |
| Phase 3 | App Store申請準備 | 🔄 進行中 |
| Phase 4 | マーケティング・ローンチ | ⏳ 未着手 |

---

### 📊 SaaS Power Chart（保留中）

| 項目 | 内容 |
|---|---|
| **概要** | SaaS指標ダッシュボード |
| **ディレクトリ** | `projects/saas-power-chart/` |
| **状態** | AI Genesisを優先し、一時保留 |

---

## 直近の意思決定ログ

| 日付 | 決定内容 | 理由 |
|---|---|---|
| 2026-03-14 | Phase 3開始 — オンボーディング・通知・App Storeメタデータ | Phase 2完了を受けて申請準備へ |
| 2026-03-14 | Phase 2（MVP実装）完了 | 27ファイル・3421行を実装 |
| 2026-03-14 | React Native (Expo) + TypeScript採用 | クロスプラット対応・エコシステム成熟度 |
| 2026-03-14 | Supabase採用（DB+Auth+Edge Functions） | フルスタック・OSS・コスト効率 |
| 2026-03-14 | Claude Haiku採用（インサイト生成） | コスト・速度・品質のバランス |
| 2026-03-14 | RevenueCat採用（課金） | iOS課金管理の事実上の標準 |
| 2026-03-06 | Echo（音声AIジャーナル）をプロダクトとして選定 | 市場調査の結果・差別化要因 |

---

## Phase 3 進捗（App Store申請準備）

### ✅ 完了
- `eas.json` — EAS Buildプロファイル設定（development/preview/production）
- `src/services/notifications.ts` — プッシュ通知サービス実装
- `src/screens/OnboardingScreen.tsx` — 4枚スライド + Apple Sign In + 通知許可
- `src/screens/SettingsScreen.tsx` — 通知ON/OFF + 時刻選択UIを追加
- `src/navigation/AppNavigator.tsx` — 初回起動時オンボーディング表示
- `app-store/metadata_ja.md` — App Store説明文・キーワード（日本語）
- `app-store/metadata_en.md` — App Store説明文・キーワード（英語）
- `app-store/privacy_policy.md` — プライバシーポリシー（日英）

### ⏳ 残タスク（TestFlight配信のために必要）
1. **ユーザーアクション（外部）:**
   - Supabaseプロジェクト作成 + schema.sql実行
   - Apple Developer Program登録（$99/年）
   - App Store ConnectでApp ID作成
   - EAS CLIで `eas init` 実行 → projectIdを `app.json` に設定
   - RevenueCatアカウント + 製品ID設定

2. **Claudeが次に行うこと（上記完了後）:**
   - TestFlight用ビルド検証
   - App Store Connectへのメタデータ入稿ガイド
   - スクリーンショット制作仕様の詳細化

---

## ファイル構造マップ

```
document_hub/
├── CLAUDE.md                           ← 行動規範（必読）
├── docs/assistant/
│   ├── context/
│   │   ├── session_state.md            ← このファイル（必読）
│   │   └── projects/
│   │       └── echo.md                 ← Echoアプリ詳細
│   ├── errors_log.md                   ← ミス記録
│   └── guidelines.md
└── projects/
    ├── ai-genesis/
    │   ├── app/                        ← MVPコード（Phase 2成果物）
    │   ├── market-research/            ← 市場調査資料
    │   ├── narrative/                  ← PRD・ナラティブ
    │   └── org/                        ← 組織設計
    └── saas-power-chart/               ← 別PJ（保留中）
```
