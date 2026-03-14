# セッション状態 — 現在のプロジェクト全体像

> このファイルはセッションをまたいで状態を維持するための「記憶」です。
> 重要な決定・進捗があるたびに更新します。
> **新しいセッション開始時は必ずこのファイルを最初に読んでください。**

*最終更新: 2026-03-14*

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
| Phase 3 | App Store申請準備 | ⏳ 未着手 |
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
| 2026-03-14 | Phase 2（MVP実装）完了 | 27ファイル・3421行を実装 |
| 2026-03-14 | React Native (Expo) + TypeScript採用 | クロスプラット対応・エコシステム成熟度 |
| 2026-03-14 | Supabase採用（DB+Auth+Edge Functions） | フルスタック・OSS・コスト効率 |
| 2026-03-14 | Claude Haiku採用（インサイト生成） | コスト・速度・品質のバランス |
| 2026-03-14 | RevenueCat採用（課金） | iOS課金管理の事実上の標準 |
| 2026-03-06 | Echo（音声AIジャーナル）をプロダクトとして選定 | 市場調査の結果・差別化要因 |

---

## Phase 3 着手のための前提条件

Phase 3（App Store申請準備）を開始するには：

1. ユーザーが以下を用意する必要がある：
   - Supabaseプロジェクト作成 + schema.sql実行
   - OpenAI APIキー（Whisper用）
   - Anthropic APIキー（Claude Haiku用）
   - Apple Developer Program登録（$99/年）
   - RevenueCatアカウント設定

2. その後Claudeが担当する：
   - App Store用スクリーンショット仕様作成
   - App説明文（日本語・英語）
   - プライバシーポリシー作成
   - EAS Build設定
   - TestFlight配信設定

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
