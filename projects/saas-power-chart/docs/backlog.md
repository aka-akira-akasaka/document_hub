# saas-power-chart バックログ

> エンタープライズ営業支援向けパワーチャート作成ツール
> 最終更新：2026-02-28

---

## プロジェクト概要

銀行渉外・エンタープライズ営業における組織攻略を支援するSaaSツール。
営業担当者が顧客組織のステークホルダーを登録・可視化し、影響力・態度・関係性を把握することで、効果的なアプローチ戦略を立案できる。

| 項目 | 内容 |
|---|---|
| 対象ユーザー | 銀行渉外担当者・エンタープライズ営業 |
| 主な価値 | ステークホルダーの可視化・組織攻略戦略の支援 |
| 現フェーズ | フロントエンドMVP（LocalStorage永続化） |
| リポジトリ | `projects/saas-power-chart/` |

---

## 技術スタック

| カテゴリ | 技術 | バージョン |
|---|---|---|
| Framework | Next.js | 15.5.12 |
| UI | React + Tailwind CSS | 19.1.0 / v4 |
| コンポーネント | shadcn/ui | — |
| グラフ描画 | @xyflow/react（ReactFlow） | 12.10.1 |
| 自動レイアウト | @dagrejs/dagre | 2.0.4 |
| 状態管理 | Zustand + LocalStorage永続化 | 5.0.11 |
| バリデーション | Zod | — |
| CSV処理 | PapaParse | — |
| テスト | Vitest | 4.0.18 |
| 言語 | TypeScript | 5 |

---

## データモデル

### Deal（案件）

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | UUID |
| name | string | 案件名 |
| clientName | string | クライアント名 |
| stage | DealStage | 案件ステージ（7段階） |
| description | string | 概要 |
| targetAmount | number? | 目標金額 |
| expectedCloseDate | string? | 期待成約日 |

**DealStage:** `prospecting`（初期接触）→ `qualification`（条件確認）→ `proposal`（提案中）→ `negotiation`（交渉中）→ `closed_won`（成約）/ `closed_lost`（失注）/ `on_hold`（保留）

### Stakeholder（ステークホルダー）

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | UUID |
| dealId | string | 紐づく案件ID |
| name | string | 氏名 |
| department | string | 部署 |
| title | string | 役職 |
| roleInDeal | RoleInDeal | 案件上の役割（8種） |
| influenceLevel | 1〜5 | 影響力レベル |
| attitude | Attitude | 態度（5種） |
| relationshipOwner | string | 担当者 |
| parentId | string? | 上位ノードID（組織図階層） |
| email / phone / notes | string | 連絡先・メモ |
| position | {x,y}? | 組織図上の位置 |

**RoleInDeal:** 意思決定者 / 影響者 / チャンピオン / コーチ / ゲートキーパー / ユーザー / 評価者 / 不明
**Attitude:** チャンピオン / 支持者 / 中立 / 反対者 / 障害者

### Relationship（関係性）

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | UUID |
| dealId | string | 紐づく案件ID |
| sourceId / targetId | string | 関係元・先のステークホルダーID |
| type | RelationshipType | 関係種別（5種） |
| label | string? | エッジラベル |
| bidirectional | boolean | 双方向フラグ |

**RelationshipType:** 上下関係 / 影響関係 / 同盟関係 / 対立関係 / 非公式

---

## ✅ 実装済み機能

### 1. 案件（Deal）管理

- [x] 案件一覧表示（カード形式）
- [x] 案件作成ダイアログ（名前・クライアント・ステージ・概要・目標金額・期待成約日）
- [x] 案件ステージのカラーバッジ表示
- [x] 案件詳細ヘッダー（DealHeader）
- [x] 案件内タブナビゲーション（組織図 / リスト / マトリックス）
- [x] LocalStorage による永続化

### 2. ステークホルダー管理

- [x] ステークホルダー一覧（テーブル形式）
- [x] ステークホルダー作成・編集・閲覧（サイドシート）
- [x] フォーム入力（全フィールド対応）
- [x] 態度バッジ（AttitudeBadge）による視覚化
- [x] 一括追加ダイアログ（BatchAddDialog：テーブル形式入力）
- [x] LocalStorage による永続化

### 3. 組織図（Org Chart）

- [x] ReactFlow キャンバス（OrgChartCanvas）
- [x] Dagre.js による自動レイアウト（Top-Bottom方向）
- [x] ズーム・パン・ミニマップ
- [x] ノードのドラッグ操作（位置保存あり）
- [x] ステークホルダーノード（態度・役割・影響力を色で表現）
- [x] 関係性エッジ（5種の関係タイプ対応）
- [x] 組織図ツールバー（OrgChartToolbar）

### 4. Influence-Attitude Matrix

- [x] 影響力（縦軸）× 態度（横軸）の2軸マトリックス
- [x] 各ステークホルダーのプロット表示

### 5. CSV機能

- [x] CSVインポート（CsvImportDialog）
  - バリデーション（Zod スキーマ）
  - インポートプレビューテーブル
  - 行単位エラー表示
- [x] CSVエクスポート（CsvExportButton）
- [x] CSV テンプレートダウンロード
- [x] 日本語・英語カラム名のマッピング対応

### 6. UI基盤

- [x] shadcn/ui コンポーネント群（Button, Dialog, Sheet, Table 等）
- [x] AppHeader / DealTabs / EmptyState レイアウト
- [x] Sonner による Toast 通知
- [x] Noto Sans JP フォント（日本語最適化）
- [x] レスポンシブ対応（基本レベル）

---

## 📋 バックログ

優先度：**P0**（必須）→ **P1**（高）→ **P2**（中）→ **P3**（低）

### P0 — クリティカル（リリース必須）

| # | 機能 | 概要 | 備考 |
|---|---|---|---|
| B-01 | バックエンドAPI / データベース | LocalStorage脱却。PostgreSQL + REST or tRPC | Prisma検討 |
| B-02 | ユーザー認証・認可 | ログイン・セッション管理 | NextAuth.js or Clerk |
| B-03 | テストスイート整備 | Vitest導入済みだがテスト未作成。主要ロジックのユニットテスト | csv-parser, layout-engine優先 |
| B-04 | 案件削除機能 | 案件と紐づくステークホルダー・関係性の連鎖削除 | 確認ダイアログ必須 |

### P1 — 高優先度

| # | 機能 | 概要 | 備考 |
|---|---|---|---|
| B-05 | 関係性管理UI | 関係性の作成・編集・削除UI（現在はCSV経由のみ） | エッジクリックで編集 |
| B-06 | 組織図エクスポート | PNG / PDF で出力 | html-to-image 等 |
| B-07 | Vercel デプロイ設定 | CI/CD + 環境変数管理 | GitHub Actions連携 |
| B-08 | 案件編集機能 | 作成後の案件情報の編集 | 現在は作成のみ |
| B-09 | ステークホルダー削除 | 単体・複数選択削除 | 確認ダイアログ必須 |
| B-10 | マトリックスのインタラクション | マトリックス上のノードクリックで詳細表示・編集 | — |

### P2 — 中優先度

| # | 機能 | 概要 | 備考 |
|---|---|---|---|
| B-11 | マルチテナント対応 | 組織単位のデータ分離 | DB設計に影響 |
| B-12 | URL共有・パーリンク | 案件・組織図のURL共有 | 認証と連動 |
| B-13 | 変更履歴・監査ログ | ステークホルダー情報の更新履歴 | — |
| B-14 | 組織図レイアウト切り替え | LR（左右）・ TB（上下）等の方向切り替え | Dagreオプション拡張 |
| B-15 | ステークホルダー検索・フィルタ | テーブル・組織図でのフィルタリング | 態度・役割・部署 |
| B-16 | ダッシュボード | 全案件の概況・KPI集計 | ステージ別件数・態度分布 |
| B-17 | 印刷最適化 | 組織図・マトリックスの印刷対応 | CSS @media print |
| B-18 | コメント・メモ機能強化 | ステークホルダーへのタイムライン式コメント | — |

### P3 — 低優先度（将来検討）

| # | 機能 | 概要 | 備考 |
|---|---|---|---|
| B-19 | チームコラボレーション | 複数担当者によるリアルタイム編集 | Yjs / Liveblocks |
| B-20 | Slack / Teams 通知 | 案件ステージ変更等のイベント通知 | Webhook対応 |
| B-21 | CRM連携 | Salesforce / HubSpot インポート | API連携 |
| B-22 | AI支援機能 | ステークホルダーの関係性・攻略戦略のAI提案 | Claude API活用 |
| B-23 | モバイル最適化 | スマートフォン対応UI | ReactFlowのタッチ操作 |
| B-24 | テンプレート機能 | 業種・案件タイプ別のステークホルダーテンプレート | — |

---

## リリース計画（案）

```
v0.1（現在）
  フロントエンドMVP
  LocalStorage永続化
  Deal管理 / Stakeholder管理 / 組織図 / Matrix / CSV

v0.2 — バックエンド基盤
  B-01: データベース + API
  B-02: ユーザー認証
  B-04: 案件削除
  B-08: 案件編集
  B-09: ステークホルダー削除
  B-07: Vercelデプロイ

v0.3 — 機能補完
  B-03: テストスイート
  B-05: 関係性管理UI
  B-06: 組織図エクスポート
  B-10: マトリックスインタラクション
  B-15: 検索・フィルタ

v0.4 — 拡張
  B-11: マルチテナント
  B-12: URL共有
  B-14: レイアウト切り替え
  B-16: ダッシュボード
  B-18: コメント機能

v1.0 — GA
  品質・セキュリティ・パフォーマンス最終確認
  ドキュメント整備
  カスタマーサポート体制

将来版
  B-19〜B-24: コラボ・外部連携・AI機能
```

---

## 既知の課題・技術的負債

| # | 内容 | 影響 |
|---|---|---|
| D-01 | LocalStorageのみ → データ消失リスク | 高 |
| D-02 | テスト未整備（Vitest導入済みだが0件） | 中 |
| D-03 | Relationship作成UIなし（CSVかコード経由のみ） | 中 |
| D-04 | 案件・ステークホルダーの削除UIが一部未実装 | 中 |
| D-05 | マトリックスはRead-Onlyで編集操作なし | 低 |
| D-06 | 組織図のエッジラベル表示が未活用 | 低 |

---

*このドキュメントは実装・計画変更に応じて随時更新する。*
