# Echo - AIジャーナル: プロダクト要件定義書（PRD）

**バージョン**: 1.1
**作成者**: AI Genesis CPO (Claude)
**作成日**: 2026-03-14
**v1.1更新**: 2026-03-14（音声ファーストUXに変更）
**ステータス**: 承認済（CEOが自律承認）

---

## 概要

### プロダクトビジョン
「書く習慣」を持たない人が、**話すだけで**AIとの対話を通じて自己理解を深める。

### 一言説明
話すだけで、自分が見えてくる。マイクをタップして1〜3分話す。AIが聴いて、返す。

---

## ユーザーストーリー

### コアジャーニー
```
[毎日] 好きなタイミングにアプリを開く
    ↓
マイクボタンをタップ → 「今日どうだった？」
→ 1〜3分、自由に話す（日本語）
    ↓
Whisper APIが文字起こし → Claude Haikuが分析
→「3つの気づき」と「1つの問いかけ」を30秒以内に表示
例：「今日のキーワード: 締め切り・達成感・疲労
     気づき: 疲れているのに充実感がある。何が違った？」
    ↓
保存（音声ファイル + テキスト + インサイト）

[日曜] 毎週日曜 9:00、「Echoレター」が届く（Pro機能）
    ↓
AIが7日分の音声ログを振り返り
「パターン」「変化」「来週への問い」を生成・表示
```

---

## 機能要件

### Phase 1（MVP: 必須）

#### 認証
- [ ] Apple Sign In（App Store要件）
- [ ] ゲストモード（7日間試用）→ アカウント移行

#### ホーム画面
- [ ] 大きなマイクボタン（中央配置）
- [ ] 録音中ビジュアル（波形アニメーション）
- [ ] 録音完了 → 自動でインサイト生成・表示
- [ ] テキスト入力オプション（音声が使えない場面向け）
- [ ] 今日の処理済み状態の表示（チェックマーク）
- [ ] 連続記録日数（ストリーク）表示

#### タイムライン
- [ ] 過去の質問・回答一覧（逆時系列）
- [ ] 日付・曜日表示
- [ ] 無料ユーザーは直近7日のみ表示
- [ ] Proユーザーは全期間表示

#### Echoレター（Pro機能）
- [ ] 毎週日曜に生成・プッシュ通知
- [ ] レター一覧画面
- [ ] レター詳細画面（AIが書いた文章）
- [ ] 無料ユーザーへのプレビュー（最初の1文のみ + アップグレード誘導）

#### サブスクリプション
- [ ] RevenueCatによる課金管理
- [ ] 月額プラン: ¥580/月
- [ ] 年額プラン: ¥4,800/年（2ヶ月分お得、実質¥400/月）
- [ ] 7日間無料トライアル（年額のみ）
- [ ] 決済失敗時の graceful degradation

#### プッシュ通知
- [ ] 毎朝8:00「今日の問いが届いた」（時間はユーザー設定可）
- [ ] 日曜9:00「今週のEchoレター」
- [ ] 4日未回答で「久しぶりに声を聴かせて」（リテンション）

#### 設定画面
- [ ] 通知時間のカスタマイズ
- [ ] アカウント情報
- [ ] サブスクリプション管理（RevenueCat管理画面へ）
- [ ] プライバシーポリシー・利用規約
- [ ] アカウント削除

### Phase 2（v1.1以降）
- 音声入力（Whisper API）
- カスタムテーマ（ダークモード含む）
- Android対応
- Apple Watchアプリ
- エクスポート機能（PDF）

---

## 非機能要件

### パフォーマンス
- 起動時間: 2秒以内
- 回答送信〜保存: 500ms以内
- AIレター生成: バックグラウンド処理（通知から最大30秒）

### セキュリティ
- すべての通信: HTTPS/TLS
- ユーザーデータ: Supabase Row Level Security（RLS）
- APIキー: 環境変数管理、フロントエンドに露出しない
- Apple Sign Inのみ（パスワード不要）

### プライバシー
- ジャーナルデータはユーザー本人のみアクセス可能
- AIへのデータ送信: Claude API（Anthropic）のプライバシーポリシーに準拠
- データ削除リクエストに72時間以内に対応

---

## 画面設計（ワイヤーフレーム仕様）

### ホーム画面
```
┌─────────────────────┐
│                     │
│  2026年3月14日 土曜  │
│                     │
│  ────────────────   │
│  今日の問い          │
│                     │
│  「今日、一番         │
│   エネルギーを使った  │
│   ことは何でしたか？」│
│                     │
│  ────────────────   │
│                     │
│  [テキスト入力欄]    │
│   最大300文字        │
│                     │
│  [今日の声を届ける ▶] │
│                     │
│  🔥 12日連続         │
│                     │
└─────────────────────┘
```

### Echoレター
```
┌─────────────────────┐
│  ← 戻る    Echo     │
│                     │
│  2026年3月14日の    │
│  あなたへ           │
│                     │
│  今週、あなたが最も  │
│  多く言及したのは    │
│  「時間」という言葉  │
│  でした。           │
│                     │
│  月曜から土曜にかけ  │
│  て、「予想外」「想  │
│  定外」という表現が  │
│  3回登場しています。│
│                     │
│  これは不満ではなく、│
│  変化への反応かも   │
│  しれません。       │
│  ...              │
│                     │
└─────────────────────┘
```

---

## AI仕様（v1.1: 音声ファースト対応）

### 音声処理フロー
```
1. expo-avで音声録音（m4a形式）
2. Supabase Storageに一時保存
3. Supabase Edge Function → OpenAI Whisper API
   → 日本語テキストに変換
4. Claude Haiku APIでインサイト生成（JSON）
5. Supabase DBに保存（テキスト + インサイト）
6. 音声ファイルは30日後に自動削除（ストレージコスト管理）
```

### インサイト生成（Claude Haiku）
```
System: あなたはユーザーの音声日記を聴いて、温かく知的な観察を返すコーチです。

以下をJSON形式で生成:
{
  "keywords": ["名詞3つ"],
  "insights": ["気づき1", "気づき2", "気づき3"],
  "question": "来明日への1つの問い"
}

制約:
- 批判・評価しない。観察する。
- 「すべき」「もっと〜すれば」を使わない
- 日本語で、自然な話し言葉

音声テキスト: {transcription}
過去7日のキーワード: {past_keywords}
```

### 週次レター生成（Claude Haiku）
```
System: あなたは温かく知的な観察者として、ユーザーの週次振り返りレターを書きます。

形式:
- 800〜1200文字の日本語文章
- 「あなたへ」で始める
- パターン・傾向・変化を指摘する（批判しない）
- 来週への1つの問いで締める
- 主観的な解釈を避け、事実に基づく観察を主とする

今週の音声ログ（文字起こし済み）:
{weekly_transcriptions}
```

---

## 技術アーキテクチャ

```
[iOS App (React Native/Expo)]
    │
    ├─ Supabase (PostgreSQL)
    │   ├─ users テーブル
    │   ├─ entries テーブル（音声テキスト + インサイト）
    │   └─ letters テーブル（週次レター）
    │
    ├─ Supabase Storage
    │   └─ audio/ （音声ファイル、30日で自動削除）
    │
    ├─ Supabase Edge Functions
    │   ├─ transcribe-audio（音声→Whisper API）
    │   ├─ generate-insight（テキスト→Claude Haiku）
    │   └─ generate-weekly-letter（毎週日曜 7:00 Cron）
    │       └─ Claude Haiku API 呼び出し
    │
    ├─ OpenAI Whisper API
    │   └─ 日本語音声→テキスト変換
    │
    └─ RevenueCat
        └─ iOS課金管理・Webhook
```

---

## データモデル

```sql
-- ユーザー
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apple_id TEXT UNIQUE NOT NULL,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  subscription_status TEXT DEFAULT 'free', -- 'free' | 'pro'
  notification_hour INT DEFAULT 8 -- 通知時刻（時）
);

-- 日次回答
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  entry_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

-- 週次レター
CREATE TABLE letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  week_start DATE NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);
```

---

## リリース計画

| マイルストーン | 期限 | 担当 |
|---|---|---|
| 技術環境セットアップ（Expo + Supabase） | Week 1 Day 1-2 | CTO/Dev |
| 認証・データモデル実装 | Week 1 Day 3-5 | Dev |
| ホーム画面・回答機能 | Week 2 Day 1-3 | Dev |
| タイムライン・設定画面 | Week 2 Day 4-5 | Dev |
| Claude AI統合（プロンプト生成） | Week 3 Day 1-3 | Dev |
| 週次レター生成・RevenueCat統合 | Week 3 Day 4-5 | Dev |
| App Store準備（スクショ・説明文） | Week 4 Day 1-2 | CMO |
| QA・バグ修正 | Week 4 Day 3-4 | Dev |
| 申請提出 | Week 4 Day 5 | 人間のアクション |

---

*このPRDはAIが自律的に作成した。人間のレビューは受けていない。*
*作成: AI Genesis CPO, 2026-03-14*
