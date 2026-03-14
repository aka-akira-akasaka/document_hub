# Echo - セットアップガイド

> このアプリはAI Genesisが自律的に開発しました。

---

## 必要なもの

| ツール | 説明 |
|---|---|
| Node.js 20+ | JavaScript実行環境 |
| Expo CLI | `npm install -g expo-cli` |
| EAS CLI | `npm install -g eas-cli` |
| Apple Developer Account | App Store配布用（年$99） |
| Supabaseアカウント | DB・Auth（無料プランあり） |
| OpenAIアカウント | Whisper API |
| Anthropicアカウント | Claude Haiku API |
| RevenueCatアカウント | 課金管理（無料プランあり） |

---

## Step 1: Supabaseプロジェクトの作成

1. [supabase.com](https://supabase.com) でプロジェクト作成
2. SQL Editorで `supabase/schema.sql` を実行
3. Authentication → Providers → Apple を有効化
4. Edge Functionsに環境変数を設定:
   ```
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   ```

---

## Step 2: Supabase Edge Functionsのデプロイ

```bash
# Supabase CLIをインストール
npm install -g supabase

# ログイン
supabase login

# Edge Functionsをデプロイ
supabase functions deploy transcribe-audio
supabase functions deploy generate-weekly-letter

# 週次レターのCronジョブを設定（毎週日曜 22:00 UTC = 日本時間 07:00）
# Supabase Dashboardの Integrations → pg_cron から設定
# SELECT cron.schedule('weekly-letters', '0 22 * * 0', 'SELECT net.http_post(...)');
```

---

## Step 3: RevenueCatの設定

1. [revenuecat.com](https://www.revenuecat.com) でアプリを作成
2. 製品IDを設定:
   - `echo_pro_monthly` — ¥580/月
   - `echo_pro_annual` — ¥4,800/年
3. エンタイトルメント `pro` を両製品に設定
4. iOS APIキーを取得

---

## Step 4: app.jsonの設定

`app.json` の `extra` セクションに実際の値を設定:

```json
{
  "extra": {
    "supabaseUrl": "https://xxxx.supabase.co",
    "supabaseAnonKey": "eyJhbGci...",
    "openaiApiKey": "sk-...",
    "anthropicApiKey": "sk-ant-...",
    "revenuecatApiKey": "appl_...",
    "eas": {
      "projectId": "your-eas-project-id"
    }
  }
}
```

> ⚠️ `app.json`に直接APIキーを書く場合は、`.gitignore`に追加すること

---

## Step 5: 開発環境での起動

```bash
cd projects/ai-genesis/app
npm install
npx expo start
```

Expo GoアプリでQRコードを読み込んで動作確認。

---

## Step 6: App Storeへの提出

```bash
# EASにログイン
eas login

# プロジェクトを初期化
eas init

# ビルド（App Store用）
eas build --platform ios --profile production

# 提出
eas submit --platform ios
```

---

## 環境変数の管理（本番）

本番では `app.json` に直接キーを書かず、EASのシークレットを使う:

```bash
eas secret:create --scope project --name SUPABASE_URL --value "https://..."
eas secret:create --scope project --name OPENAI_API_KEY --value "sk-..."
# ...
```

---

## コスト見積もり（月100人のProユーザー想定）

| サービス | 月額コスト |
|---|---|
| Supabase Pro | $25 |
| OpenAI Whisper | ~$15（100人×30分/月） |
| Anthropic Claude Haiku | ~$8（インサイト生成） |
| RevenueCat | 無料（$2,500/月MRRまで） |
| **合計** | **~$48** |
| **収益（100人×¥580）** | **¥58,000（~$400）** |
| **粗利** | **~88%** |

---

*AI Genesis, 2026*
