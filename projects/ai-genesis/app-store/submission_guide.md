# App Store Connect 入稿ガイド — Echo

> EchoアプリをApp Storeに申請するための手順書。
> 初回TestFlight配信 → App Store公開まで、このガイドに沿って進めてください。

*最終更新: 2026-03-15*

---

## 前提条件チェックリスト

申請作業を始める前に、以下がすべて完了していることを確認してください。

| # | 必要なもの | 確認 |
|---|---|---|
| 1 | Apple Developer Program 登録済み（$99/年） | ☐ |
| 2 | Supabase プロジェクト作成 + schema.sql 実行済み | ☐ |
| 3 | OpenAI API キー取得済み | ☐ |
| 4 | Anthropic API キー取得済み | ☐ |
| 5 | RevenueCat アカウント作成 + iOS SDK キー取得済み | ☐ |
| 6 | EAS CLI インストール済み（`npm install -g eas-cli`） | ☐ |
| 7 | `eas login` で Expo アカウントにログイン済み | ☐ |

---

## STEP 1 — app.json のプレースホルダーを実際の値に置き換える

ファイル: `projects/ai-genesis/app/app.json`

```json
"extra": {
  "supabaseUrl": "https://xxxxxxxxxxxx.supabase.co",
  "supabaseAnonKey": "eyJhbGci...",
  "openaiApiKey": "sk-...",
  "anthropicApiKey": "sk-ant-...",
  "revenuecatApiKey": "appl_...",
  "eas": {
    "projectId": "← eas init 実行後に自動設定される"
  }
}
```

> **注意:** APIキーをGitにコミットしないこと。
> 本番ビルドでは EAS Environment Variables を使用する（STEP 3参照）。

---

## STEP 2 — EAS プロジェクト初期化

```bash
cd projects/ai-genesis/app
eas init
```

実行後、`app.json` の `extra.eas.projectId` が自動的に設定される。
この変更をコミットする：

```bash
git add app.json
git commit -m "設定: EAS projectId を設定"
```

---

## STEP 3 — EAS Environment Variables の設定

APIキーをコードに直書きせず、EAS CLIで安全に管理する。

```bash
# 本番環境用シークレットを設定
eas secret:create --scope project --name SUPABASE_URL --value "https://xxxx.supabase.co"
eas secret:create --scope project --name SUPABASE_ANON_KEY --value "eyJ..."
eas secret:create --scope project --name OPENAI_API_KEY --value "sk-..."
eas secret:create --scope project --name ANTHROPIC_API_KEY --value "sk-ant-..."
eas secret:create --scope project --name REVENUECAT_API_KEY --value "appl_..."
```

設定確認:
```bash
eas secret:list
```

---

## STEP 4 — App Store Connect でアプリを作成

1. [App Store Connect](https://appstoreconnect.apple.com) にログイン
2. 「マイ App」→「＋」→「新規 App」
3. 以下を入力：

| 項目 | 入力値 |
|---|---|
| プラットフォーム | iOS |
| 名前 | `Echo - 音声AIジャーナル` |
| 言語（プライマリ） | 日本語 |
| バンドル ID | `com.aigenesis.echo`（要事前登録） |
| SKU | `echo-ai-journal-001`（任意の一意な文字列） |
| ユーザーアクセス | 全アクセス |

> **バンドルIDの事前登録が必要な場合:**
> [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list)
> → 「＋」→「App IDs」→ Bundle ID: `com.aigenesis.echo`

---

## STEP 5 — App 情報を入力

App Store Connect → 該当App → 「App情報」タブ

| フィールド | 入力値 | 出典 |
|---|---|---|
| 名前（日本語） | `Echo - 音声AIジャーナル` | metadata_ja.md |
| サブタイトル（日本語） | `話すだけで、自分が見えてくる。` | metadata_ja.md |
| プライマリカテゴリ | ヘルスケア/フィットネス | metadata_ja.md |
| セカンダリカテゴリ | 仕事効率化 | metadata_ja.md |
| コンテンツ権利 | 「自社コンテンツを使用していない、またはすべての権利を持っている」を選択 | — |

---

## STEP 6 — バージョン情報を入力（1.0準備）

App Store Connect → 該当App → 「1.0 準備中」

### 説明文・キーワード

| フィールド | 入力内容 | 上限 |
|---|---|---|
| 説明 | `metadata_ja.md` の「説明文」をそのまま貼付 | 4000文字 |
| プロモーションテキスト | `話すだけで自分が見える。AIジャーナルアプリEchoで、毎日の気づきを積み重ねましょう。` | 170文字 |
| キーワード | `日記,ジャーナル,音声,AI,自己成長,メンタル,振り返り,マインドフルネス,記録,習慣` | 100文字 |
| サポートURL | `https://echo-journal.app/support` | — |
| マーケティングURL | `https://echo-journal.app` | — |

### ローカライズ追加（英語 US）

「言語を追加」→ 英語（アメリカ合衆国）を選択し、`metadata_en.md` の内容を入力。

---

## STEP 7 — App 内課金を設定

「App内課金」→「＋」→「自動更新型サブスクリプション」

### サブスクリプショングループ
- グループ名: `Echo Pro`

### Echo Pro 月額

| 項目 | 値 |
|---|---|
| 参照名 | `Echo Pro 月額` |
| 製品ID | `echo_pro_monthly` |
| 価格 | ¥580（日本） / $4.99（米国） |
| 表示名（日本語） | `Echo Pro 月額プラン` |
| 説明（日本語） | `無制限録音・Echoレター・全記録閲覧が使えるプロプラン（月額）` |
| 表示名（英語） | `Echo Pro Monthly` |
| 説明（英語） | `Unlimited recordings, weekly Echo Letter, full history. Billed monthly.` |

### Echo Pro 年額

| 項目 | 値 |
|---|---|
| 参照名 | `Echo Pro 年額` |
| 製品ID | `echo_pro_annual` |
| 価格 | ¥4,800（日本） / $39.99（米国） |
| 表示名（日本語） | `Echo Pro 年額プラン` |
| 説明（日本語） | `無制限録音・Echoレター・全記録閲覧が使えるプロプラン（年額・2ヶ月分お得）` |
| 表示名（英語） | `Echo Pro Annual` |
| 説明（英語） | `Unlimited recordings, weekly Echo Letter, full history. Save 2 months vs monthly.` |

> **RevenueCat との連携:**
> RevenueCat Dashboard → Products に同じ製品IDを登録すること。
> `echo_pro_monthly` と `echo_pro_annual` の2つ。

---

## STEP 8 — App Review 情報を入力

「App Review情報」セクション

| 項目 | 入力値 |
|---|---|
| サインイン情報が必要か | はい |
| デモ用ユーザー名 | `demo@echo-journal.app`（要事前作成） |
| デモ用パスワード | `EchoDemo2026!`（任意） |
| メモ（任意） | 「このアプリは音声録音とAI分析を使用します。デモアカウントにはPro機能が有効になっています。」 |

> **デモアカウントの作成方法:**
> Supabase Dashboard → Authentication → Users → 「Add user」
> RevenueCat でそのユーザーにPro権限を付与（またはコードで `isProUser = true` に設定）

---

## STEP 9 — スクリーンショットをアップロード

必要なサイズ（必須）:
- **6.7インチ** (iPhone 15 Pro Max): 1290 × 2796 px（縦）
- **6.5インチ** (iPhone 14 Plus): 1242 × 2688 px（縦）

各画面の仕様は `screenshot_spec.md`（別途作成予定）を参照。

最低6枚が必要。推奨の内容:
1. ホーム画面（録音前）
2. 録音中
3. AIインサイト表示
4. タイムライン
5. Echoレター
6. ペイウォール（Pro機能紹介）

---

## STEP 10 — プライバシーの取り扱いを入力

「プライバシーポリシー」→ URL: `https://echo-journal.app/privacy`

「App Storeプライバシー」（データの種類を申告）:

| データの種類 | 収集するか | 用途 |
|---|---|---|
| 氏名 | いいえ | — |
| メールアドレス | はい（Apple Sign In経由） | アカウント管理 |
| 音声データ | はい（一時的） | 文字起こし後即削除 |
| ユーザーコンテンツ（テキスト） | はい | ジャーナル内容の保存 |
| 使用状況データ | はい | アプリ改善 |
| 診断データ | はい | クラッシュレポート |

> 音声データは「収集するが、デバイス外で処理後即削除」として申告。

---

## STEP 11 — TestFlight ビルドを作成・アップロード

### ビルド実行

```bash
cd projects/ai-genesis/app

# preview プロファイル = TestFlight向けビルド
eas build --platform ios --profile preview
```

ビルド完了後（10〜20分）、Expo Dashboardにビルドが表示される。

### App Store Connect への提出

EAS CLIから直接提出:
```bash
eas submit --platform ios --latest
```

または Expo Dashboard → Build → 「Submit to App Store Connect」

---

## STEP 12 — TestFlight 設定

App Store Connect → TestFlight タブ

1. **内部テスト:** 自分（Apple Developer アカウント）を追加
2. **外部テスト（オプション）:**
   - 「外部グループ」→ 新規グループ「Beta Testers」
   - メールアドレスでテスターを招待
   - Betaアプリ審査（1〜2日）が必要

---

## トラブルシューティング

| エラー | 原因 | 対処法 |
|---|---|---|
| `ITMS-90189: Duplicate CFBundleVersion` | ビルド番号が重複 | `app.json` の `ios.buildNumber` をインクリメント |
| `ITMS-90683: Missing Purpose String` | Info.plistのUsage Description不足 | `app.json` の `infoPlist` に説明を追加（現在設定済み） |
| `ITMS-90338: Non-public API` | プライベートAPIの使用 | 該当コードを確認・修正 |
| サインインボタンが表示されない | `expo-apple-authentication` 未設定 | `app.json` の `plugins` を確認 |
| RevenueCat初期化エラー | APIキーが未設定 | `app.json` の `revenuecatApiKey` を確認 |

---

## チェックリスト — 申請前最終確認

- [ ] app.json のプレースホルダーをすべて実際の値に置き換えた
- [ ] EAS projectId が設定されている
- [ ] App Store Connect でアプリが作成されている
- [ ] バンドルID `com.aigenesis.echo` が登録されている
- [ ] App内課金が2件（月額・年額）設定されている
- [ ] RevenueCat に製品IDが登録されている
- [ ] デモアカウントが作成されている
- [ ] スクリーンショットが準備されている（6.7インチ・6.5インチ各最低6枚）
- [ ] プライバシーポリシーURLがアクセス可能
- [ ] eas build が正常完了
- [ ] App Store Connect にビルドが届いている
