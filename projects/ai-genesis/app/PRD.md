# Echo - AIジャーナル: プロダクト要件定義書（PRD）

**バージョン**: 1.0
**作成者**: AI Genesis CPO (Claude)
**作成日**: 2026-03-14
**ステータス**: 承認済（CEOが自律承認）

---

## 概要

### プロダクトビジョン
「書く習慣」を持たない人が、AIとの静かな対話を通じて自己理解を深める。

### 一言説明
毎日1問に答えるだけ。週に一度、AIがあなたの変化を手紙にして届ける。

---

## ユーザーストーリー

### コアジャーニー
```
[月〜土] 毎朝8:00、プッシュ通知「今日の問い」が届く
    ↓
アプリを開く → 今日の質問が表示される
例：「今週、予想外に時間を取られたことは？」
    ↓
テキストで回答（目安: 1〜3文、30〜150文字）
    ↓
保存される（タイムラインに追加）

[日曜] 毎週日曜 9:00、「Echoレター」が届く
    ↓
AIが7日分の回答を分析
「あなたの今週のパターン」「見えてきた傾向」「来週への問い」を生成
    ↓
プッシュ通知 → アプリ内でレターを読む
```

---

## 機能要件

### Phase 1（MVP: 必須）

#### 認証
- [ ] Apple Sign In（App Store要件）
- [ ] ゲストモード（7日間試用）→ アカウント移行

#### ホーム画面
- [ ] 今日の質問を大きく表示
- [ ] 回答テキストフィールド（最大300文字）
- [ ] 送信ボタン（「今日の声を届ける」）
- [ ] 回答済み状態の表示（チェックマーク）
- [ ] 連続回答日数（ストリーク）表示

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
- [ ] 月額プラン: ¥480/月
- [ ] 年額プラン: ¥4,800/年（2ヶ月分お得）
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

## AI仕様（Claude Haiku）

### デイリープロンプト生成
```
System: あなたは自己理解を深める日次ジャーナリングコーチです。
毎日1つの問いを生成してください。

制約:
- 1文で完結すること
- Yes/Noで答えられない open question
- 過去の回答履歴を参考に（初回は除く）
- 季節・曜日を考慮する
- 日本語で、自然な口語表現

過去の回答（直近7日）: {past_answers}
今日の日付: {date}
曜日: {weekday}
```

### 週次レター生成
```
System: あなたは温かく知的な観察者として、ユーザーの週次振り返りレターを書きます。

形式:
- 800〜1200文字の日本語文章
- 「あなたへ」で始める
- パターン・傾向・変化を指摘する（批判しない）
- 来週への1つの問いで締める
- 主観的な解釈を避け、事実に基づく観察を主とする

今週の回答:
{weekly_entries}
```

---

## 技術アーキテクチャ

```
[iOS App (React Native/Expo)]
    │
    ├─ Supabase (PostgreSQL)
    │   ├─ users テーブル
    │   ├─ entries テーブル（回答データ）
    │   ├─ prompts テーブル（生成済みプロンプトキャッシュ）
    │   └─ letters テーブル（週次レター）
    │
    ├─ Supabase Edge Functions
    │   ├─ generate-daily-prompt（毎朝6:00 Cron）
    │   └─ generate-weekly-letter（毎週日曜 7:00 Cron）
    │       └─ Claude Haiku API 呼び出し
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
