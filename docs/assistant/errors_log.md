# アシスタント ミスパターン記録

> Self-Improvement Loop 用ファイル。
> セッション開始時に必ず読み返すこと。

---

## 記録フォーマット

```
## YYYY-MM-DD: <ミスの概要>
- **状況:** どんな状況でミスが起きたか
- **ミス内容:** 何をしてしまったか
- **再発防止策:** 次回どうするか
```

---

## ミスログ

### 2026-03-05: Zustandセレクタで `?? []` を使い無限レンダリング発生

- **状況:** 案件共有機能（DealShareDialog）を新規実装し、Zustandストアからデータを取得するセレクタを書いた
- **ミス内容:** `useDealShareStore((s) => s.sharesByDeal[dealId] ?? [])` と書いた。`sharesByDeal[dealId]` が `undefined` の場合、`?? []` が毎レンダリングで新しい空配列を生成し、Zustandの `Object.is` 比較で常に `false` → 無限再レンダリング（React error #185）が発生。本番デプロイ後にクラッシュし、原因切り分けに3回のVercelデプロイが必要になった
- **再発防止策:**
  1. **Zustandセレクタで配列/オブジェクトのフォールバックには必ずモジュールレベル定数を使う**。`const EMPTY_X: T[] = []` をファイル冒頭に定義し、`?? EMPTY_X` とする。既存コードベースでも `EMPTY_S`, `EMPTY_G`, `EMPTY_R` のパターンが確立済み
  2. 新規ストア連携コンポーネントを書く際は、既存コンポーネント（csv-export-button.tsx, use-auto-group-seed.ts 等）のセレクタパターンを確認してから実装する
  3. **インラインで `?? []`, `?? {}`, `|| []` をZustandセレクタ内に書かない**（プリミティブ値の `?? 0`, `?? ""`, `?? false` はOK）

### 2026-03-05: deal_shares の RLS に自己参照サブクエリを書いて全テーブル500エラー（2回）

- **状況:** 共有案件の共有者同士が互いの共有レコードを閲覧できるよう、`deal_shares` テーブルに SELECT ポリシーを追加した
- **ミス内容:**
  1. 1回目: `EXISTS (SELECT 1 FROM public.deal_shares ds2 WHERE ds2.deal_id = deal_shares.deal_id AND ds2.shared_with_user_id = auth.uid())` — `deal_shares` の SELECT ポリシー内で `deal_shares` 自身を参照する再帰サブクエリを書いた。PostgreSQL が無限再帰を検知し、全テーブルが500エラーに
  2. 2回目: `deals` テーブル経由に変更したが、その中でさらに `deal_shares` を `EXISTS` で参照 — 同じ再帰問題が発生
  3. どちらも本番環境で即座に全ユーザーのデータ読み込みが不能になった
- **再発防止策:**
  1. **RLS の SELECT ポリシー内で、そのテーブル自身を参照するサブクエリを絶対に書かない**。PostgreSQL は USING 句の評価時にテーブルの全行に対してポリシーを適用するため、自己参照は必ず無限再帰になる
  2. **他テーブル経由でも、最終的に同じテーブルを参照するチェーンは再帰になる**（deals → deal_shares → deals → ...）
  3. 共有者同士の可視性が必要な場合は、**RLS ではなくアプリ層（フロントエンド）で対応する**
  4. RLS ポリシーの変更は**まずステージング環境でテスト**してから本番に適用する。テスト環境がなければ、最低限 `SELECT 1 FROM テーブル LIMIT 1` で動作確認してから COMMIT する
  5. **RLS で使えるのは `auth.uid()`, `auth.jwt()`, 他テーブルへの単方向参照のみ**。自テーブルや循環参照は禁止

---

*Last updated: 2026-03-05*
