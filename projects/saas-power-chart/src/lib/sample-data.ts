/**
 * サンプル案件: IT大企業「デモ株式会社」の組織図
 *
 * 5階層・29名の一般的なIT系大企業組織
 *
 * 代表取締役社長: 山田太郎
 * ├─ 執行役員CTO 佐藤健一 → テクノロジー本部
 * │   ├─ 開発部: 中村隆志(部長), 渡辺美咲(次長)
 * │   │   ├─ プロダクト開発課: 小林翔太(課長), 加藤恵(主任), 吉田裕也(エンジニア)
 * │   │   └─ インフラ課: 松本大輝(課長), 藤田理恵(主任)
 * │   └─ AI推進室: 井上智子(室長), 坂本陸(リサーチャー)
 * ├─ 執行役員CFO 高橋直美 → コーポレート本部
 * │   ├─ 経営企画部: 田中誠(部長), 山口千佳(課長)
 * │   ├─ 人事部: 伊藤雅人(部長), 西村沙也加(課長), 岡田凛(主任)
 * │   └─ 法務部: 上田正義(部長), 前田萌(リーガルカウンセル)
 * └─ 執行役員CSO 鈴木浩二 → ビジネス本部
 *     ├─ 営業部: 木村洋介(部長), 林真理子(次長)
 *     │   ├─ エンタープライズ営業課: 清水拓也(課長), 森下愛(主任), 石井遼(担当)
 *     │   └─ SMB営業課: 原口大地(課長), 中島彩(主任)
 *     └─ マーケティング部: 池田恵美(部長), 川口翔(マネージャー)
 */
import type { Stakeholder } from "@/types/stakeholder";
import type { Deal } from "@/types/deal";
import type { OrgGroup } from "@/types/org-group";
import type { Relationship } from "@/types/relationship";

// ========================================
// UUID定数（Supabaseのuuid型カラムに対応）
// ========================================

// Deal
const DEAL = "d0000001-0000-4000-a000-000000000000";

// OrgGroups
const G_TECH        = "a0000001-0000-4000-a000-000000000000";
const G_DEV         = "a0000002-0000-4000-a000-000000000000";
const G_PRODUCT_DEV = "a0000003-0000-4000-a000-000000000000";
const G_INFRA       = "a0000004-0000-4000-a000-000000000000";
const G_AI          = "a0000005-0000-4000-a000-000000000000";
const G_CORP        = "a0000006-0000-4000-a000-000000000000";
const G_PLANNING    = "a0000007-0000-4000-a000-000000000000";
const G_HR          = "a0000008-0000-4000-a000-000000000000";
const G_LEGAL       = "a0000009-0000-4000-a000-000000000000";
const G_BIZ         = "a000000a-0000-4000-a000-000000000000";
const G_SALES       = "a000000b-0000-4000-a000-000000000000";
const G_ENTERPRISE  = "a000000c-0000-4000-a000-000000000000";
const G_SMB         = "a000000d-0000-4000-a000-000000000000";
const G_MARKETING   = "a000000e-0000-4000-a000-000000000000";

// Stakeholders
const S_YAMADA      = "b0000001-0000-4000-a000-000000000000"; // 山田太郎 - 代表取締役
const S_SATO        = "b0000002-0000-4000-a000-000000000000"; // 佐藤健一 - CTO
const S_TAKAHASHI   = "b0000003-0000-4000-a000-000000000000"; // 高橋直美 - CFO
const S_SUZUKI      = "b0000004-0000-4000-a000-000000000000"; // 鈴木浩二 - CSO
const S_NAKAMURA    = "b0000005-0000-4000-a000-000000000000"; // 中村隆志 - 開発部長
const S_WATANABE    = "b0000006-0000-4000-a000-000000000000"; // 渡辺美咲 - 開発部次長
const S_KOBAYASHI   = "b0000007-0000-4000-a000-000000000000"; // 小林翔太 - プロダクト開発課長
const S_KATO        = "b0000008-0000-4000-a000-000000000000"; // 加藤恵 - 主任
const S_YOSHIDA     = "b0000009-0000-4000-a000-000000000000"; // 吉田裕也 - エンジニア
const S_MATSUMOTO   = "b000000a-0000-4000-a000-000000000000"; // 松本大輝 - インフラ課長
const S_FUJITA      = "b000000b-0000-4000-a000-000000000000"; // 藤田理恵 - 主任
const S_INOUE       = "b000000c-0000-4000-a000-000000000000"; // 井上智子 - AI推進室長
const S_SAKAMOTO    = "b000000d-0000-4000-a000-000000000000"; // 坂本陸 - リサーチャー
const S_TANAKA      = "b000000e-0000-4000-a000-000000000000"; // 田中誠 - 経営企画部長
const S_YAMAGUCHI   = "b000000f-0000-4000-a000-000000000000"; // 山口千佳 - 課長
const S_ITO         = "b0000010-0000-4000-a000-000000000000"; // 伊藤雅人 - 人事部長
const S_NISHIMURA   = "b0000011-0000-4000-a000-000000000000"; // 西村沙也加 - 課長
const S_OKADA       = "b0000012-0000-4000-a000-000000000000"; // 岡田凛 - 主任
const S_UEDA        = "b0000013-0000-4000-a000-000000000000"; // 上田正義 - 法務部長
const S_MAEDA       = "b0000014-0000-4000-a000-000000000000"; // 前田萌 - リーガルカウンセル
const S_KIMURA      = "b0000015-0000-4000-a000-000000000000"; // 木村洋介 - 営業部長
const S_HAYASHI     = "b0000016-0000-4000-a000-000000000000"; // 林真理子 - 営業部次長
const S_SHIMIZU     = "b0000017-0000-4000-a000-000000000000"; // 清水拓也 - エンプラ営業課長
const S_MORISHITA   = "b0000018-0000-4000-a000-000000000000"; // 森下愛 - 主任
const S_ISHII       = "b0000019-0000-4000-a000-000000000000"; // 石井遼 - 担当
const S_HARAGUCHI   = "b000001a-0000-4000-a000-000000000000"; // 原口大地 - SMB営業課長
const S_NAKAJIMA    = "b000001b-0000-4000-a000-000000000000"; // 中島彩 - 主任
const S_IKEDA       = "b000001c-0000-4000-a000-000000000000"; // 池田恵美 - マーケ部長
const S_KAWAGUCHI   = "b000001d-0000-4000-a000-000000000000"; // 川口翔 - マネージャー

// Relationships
const R_01 = "c0000001-0000-4000-a000-000000000000";
const R_02 = "c0000002-0000-4000-a000-000000000000";
const R_03 = "c0000003-0000-4000-a000-000000000000";
const R_04 = "c0000004-0000-4000-a000-000000000000";
const R_05 = "c0000005-0000-4000-a000-000000000000";
const R_06 = "c0000006-0000-4000-a000-000000000000";
const R_07 = "c0000007-0000-4000-a000-000000000000";
// 執行役員 → 管掌部門（グループ宛コネクタ）
const R_08 = "c0000008-0000-4000-a000-000000000000";
const R_09 = "c0000009-0000-4000-a000-000000000000";
const R_10 = "c000000a-0000-4000-a000-000000000000";

// ========================================
// エクスポート
// ========================================

export const SAMPLE_DEAL_ID = DEAL;

export const SAMPLE_DEAL: Deal = {
  id: DEAL,
  name: "[サンプル] デモ株式会社",
  clientName: "デモ株式会社",
  stage: "proposal",
  description: "IT大企業の組織図サンプル。5階層・約30名の一般的な組織構造を再現しています。部署のドラッグ&ドロップ、関係線、態度の色分けなどの機能をお試しいただけます。",
  targetAmount: 120000000,
  expectedCloseDate: "2026-12-31",
  createdAt: "2026-03-01T09:00:00.000Z",
  updatedAt: "2026-03-04T09:00:00.000Z",
};

const ts = "2026-03-01T09:00:00.000Z";

// ========================================
// OrgGroups
// ========================================
export const SAMPLE_ORG_GROUPS: OrgGroup[] = [
  // ── テクノロジー本部 ──
  { id: G_TECH, dealId: DEAL, name: "テクノロジー本部", parentGroupId: null, sortOrder: 0, tier: 0, createdAt: ts, updatedAt: ts },
  { id: G_DEV, dealId: DEAL, name: "開発部", parentGroupId: G_TECH, sortOrder: 0, tier: 0, createdAt: ts, updatedAt: ts },
  { id: G_PRODUCT_DEV, dealId: DEAL, name: "プロダクト開発課", parentGroupId: G_DEV, sortOrder: 0, tier: 0, createdAt: ts, updatedAt: ts },
  { id: G_INFRA, dealId: DEAL, name: "インフラ課", parentGroupId: G_DEV, sortOrder: 1, tier: 0, createdAt: ts, updatedAt: ts },
  { id: G_AI, dealId: DEAL, name: "AI推進室", parentGroupId: G_TECH, sortOrder: 1, tier: 0, createdAt: ts, updatedAt: ts },

  // ── コーポレート本部 ──
  { id: G_CORP, dealId: DEAL, name: "コーポレート本部", parentGroupId: null, sortOrder: 1, tier: 0, createdAt: ts, updatedAt: ts },
  { id: G_PLANNING, dealId: DEAL, name: "経営企画部", parentGroupId: G_CORP, sortOrder: 0, tier: 0, createdAt: ts, updatedAt: ts },
  { id: G_HR, dealId: DEAL, name: "人事部", parentGroupId: G_CORP, sortOrder: 1, tier: 0, createdAt: ts, updatedAt: ts },
  { id: G_LEGAL, dealId: DEAL, name: "法務部", parentGroupId: G_CORP, sortOrder: 2, tier: 0, createdAt: ts, updatedAt: ts },

  // ── ビジネス本部 ──
  { id: G_BIZ, dealId: DEAL, name: "ビジネス本部", parentGroupId: null, sortOrder: 2, tier: 0, createdAt: ts, updatedAt: ts },
  { id: G_SALES, dealId: DEAL, name: "営業部", parentGroupId: G_BIZ, sortOrder: 0, tier: 0, createdAt: ts, updatedAt: ts },
  { id: G_ENTERPRISE, dealId: DEAL, name: "エンタープライズ営業課", parentGroupId: G_SALES, sortOrder: 0, tier: 0, createdAt: ts, updatedAt: ts },
  { id: G_SMB, dealId: DEAL, name: "SMB営業課", parentGroupId: G_SALES, sortOrder: 1, tier: 0, createdAt: ts, updatedAt: ts },
  { id: G_MARKETING, dealId: DEAL, name: "マーケティング部", parentGroupId: G_BIZ, sortOrder: 1, tier: 0, createdAt: ts, updatedAt: ts },
];

// ========================================
// Stakeholders (29名)
// ========================================
export const SAMPLE_STAKEHOLDERS: Stakeholder[] = [
  // ── 経営トップ（フリーフローティング: 上段中央） ──
  {
    id: S_YAMADA, dealId: DEAL, name: "山田 太郎", department: "経営", title: "代表取締役社長",
    roleInDeal: "decision_maker", influenceLevel: 5, attitude: "promoter",
    mission: "会社全体の経営方針決定", relationshipOwner: "赤坂", parentId: null,
    email: "yamada@demo.co.jp", phone: "03-6000-0001",
    notes: "DX推進を経営の最重要テーマとして掲げる。決裁者",
    groupId: null, orgLevel: 1, createdAt: ts, updatedAt: ts,
  },

  // ── 執行役員（フリーフローティング: 山田の下に3名横並び） ──
  {
    id: S_SATO, dealId: DEAL, name: "佐藤 健一", department: "テクノロジー本部", title: "執行役員 CTO",
    roleInDeal: "approver", influenceLevel: 5, attitude: "promoter",
    mission: "技術戦略の立案・実行", relationshipOwner: "赤坂", parentId: S_YAMADA,
    email: "sato@demo.co.jp", phone: "03-6000-0002",
    notes: "最新技術への投資に積極的。AI・クラウドの導入を推進",
    groupId: null, orgLevel: 1, createdAt: ts, updatedAt: ts,
  },
  {
    id: S_TAKAHASHI, dealId: DEAL, name: "高橋 直美", department: "コーポレート本部", title: "執行役員 CFO",
    roleInDeal: "gatekeeper", influenceLevel: 5, attitude: "cautious",
    mission: "財務統制・投資判断", relationshipOwner: "", parentId: S_YAMADA,
    email: "takahashi@demo.co.jp", phone: "03-6000-0003",
    notes: "ROIを厳密に評価。コスト削減効果が見えないと承認しない",
    groupId: null, orgLevel: 1, createdAt: ts, updatedAt: ts,
  },
  {
    id: S_SUZUKI, dealId: DEAL, name: "鈴木 浩二", department: "ビジネス本部", title: "執行役員 CSO",
    roleInDeal: "approver", influenceLevel: 5, attitude: "supportive",
    mission: "売上・事業拡大の統括", relationshipOwner: "赤坂", parentId: S_YAMADA,
    email: "suzuki@demo.co.jp", phone: "03-6000-0004",
    notes: "営業現場の効率化ツールに関心が高い。パートナー連携に前向き",
    groupId: null, orgLevel: 1, createdAt: ts, updatedAt: ts,
  },

  // ── テクノロジー本部 > 開発部 ──
  {
    id: S_NAKAMURA, dealId: DEAL, name: "中村 隆志", department: "開発部", title: "部長",
    roleInDeal: "evaluator", influenceLevel: 4, attitude: "supportive",
    mission: "プロダクト開発の品質管理・リソース配分", relationshipOwner: "", parentId: S_SATO,
    email: "nakamura@demo.co.jp", phone: "03-6000-1001",
    notes: "技術選定の最終判断者。アーキテクチャに強いこだわり",
    groupId: G_DEV, orgLevel: 2, createdAt: ts, updatedAt: ts,
  },
  {
    id: S_WATANABE, dealId: DEAL, name: "渡辺 美咲", department: "開発部", title: "次長",
    roleInDeal: "evaluator", influenceLevel: 3, attitude: "neutral",
    mission: "開発プロセスの最適化", relationshipOwner: "", parentId: S_NAKAMURA,
    email: "watanabe@demo.co.jp", phone: "",
    notes: "アジャイル推進担当。ツール導入に中立的だが合理性があれば賛同",
    groupId: G_DEV, orgLevel: 3, createdAt: ts, updatedAt: ts,
  },

  // ── テクノロジー本部 > 開発部 > プロダクト開発課 ──
  {
    id: S_KOBAYASHI, dealId: DEAL, name: "小林 翔太", department: "プロダクト開発課", title: "課長",
    roleInDeal: "initiator", influenceLevel: 3, attitude: "promoter",
    mission: "新機能開発のリード", relationshipOwner: "", parentId: S_WATANABE,
    email: "kobayashi@demo.co.jp", phone: "",
    notes: "導入推進のキーパーソン。技術的な検証を自ら行う",
    groupId: G_PRODUCT_DEV, orgLevel: 4, createdAt: ts, updatedAt: ts,
  },
  {
    id: S_KATO, dealId: DEAL, name: "加藤 恵", department: "プロダクト開発課", title: "主任",
    roleInDeal: "user", influenceLevel: 2, attitude: "supportive",
    mission: "フロントエンド開発", relationshipOwner: "", parentId: S_KOBAYASHI,
    email: "kato@demo.co.jp", phone: "",
    notes: "UIに詳しい。ユーザビリティ評価を担当",
    groupId: G_PRODUCT_DEV, orgLevel: 5, createdAt: ts, updatedAt: ts,
  },
  {
    id: S_YOSHIDA, dealId: DEAL, name: "吉田 裕也", department: "プロダクト開発課", title: "エンジニア",
    roleInDeal: "user", influenceLevel: 1, attitude: "neutral",
    mission: "バックエンド開発", relationshipOwner: "", parentId: S_KOBAYASHI,
    email: "yoshida@demo.co.jp", phone: "",
    notes: "API設計・バックエンド実装担当",
    groupId: G_PRODUCT_DEV, orgLevel: 5, createdAt: ts, updatedAt: ts,
  },

  // ── テクノロジー本部 > 開発部 > インフラ課 ──
  {
    id: S_MATSUMOTO, dealId: DEAL, name: "松本 大輝", department: "インフラ課", title: "課長",
    roleInDeal: "evaluator", influenceLevel: 3, attitude: "cautious",
    mission: "インフラ設計・運用管理", relationshipOwner: "", parentId: S_WATANABE,
    email: "matsumoto@demo.co.jp", phone: "",
    notes: "セキュリティ基準に厳しい。SaaS導入にはセキュリティレビューを要求",
    groupId: G_INFRA, orgLevel: 4, createdAt: ts, updatedAt: ts,
  },
  {
    id: S_FUJITA, dealId: DEAL, name: "藤田 理恵", department: "インフラ課", title: "主任",
    roleInDeal: "user", influenceLevel: 2, attitude: "neutral",
    mission: "クラウドインフラの運用", relationshipOwner: "", parentId: S_MATSUMOTO,
    email: "fujita@demo.co.jp", phone: "",
    notes: "AWS/GCP運用のスペシャリスト",
    groupId: G_INFRA, orgLevel: 5, createdAt: ts, updatedAt: ts,
  },

  // ── テクノロジー本部 > AI推進室 ──
  {
    id: S_INOUE, dealId: DEAL, name: "井上 智子", department: "AI推進室", title: "室長",
    roleInDeal: "initiator", influenceLevel: 4, attitude: "promoter",
    mission: "AI活用戦略の立案・推進", relationshipOwner: "", parentId: S_SATO,
    email: "inoue@demo.co.jp", phone: "03-6000-1010",
    notes: "LLM・生成AI活用の第一人者。新ツール導入に非常に積極的",
    groupId: G_AI, orgLevel: 3, createdAt: ts, updatedAt: ts,
  },
  {
    id: S_SAKAMOTO, dealId: DEAL, name: "坂本 陸", department: "AI推進室", title: "リサーチャー",
    roleInDeal: "user", influenceLevel: 2, attitude: "promoter",
    mission: "AI技術のリサーチ・PoC実施", relationshipOwner: "", parentId: S_INOUE,
    email: "sakamoto@demo.co.jp", phone: "",
    notes: "技術検証を担当。PoCの実施・レポート作成が早い",
    groupId: G_AI, orgLevel: 5, createdAt: ts, updatedAt: ts,
  },

  // ── コーポレート本部 > 経営企画部 ──
  {
    id: S_TANAKA, dealId: DEAL, name: "田中 誠", department: "経営企画部", title: "部長",
    roleInDeal: "gatekeeper", influenceLevel: 4, attitude: "neutral",
    mission: "中期経営計画・投資管理", relationshipOwner: "", parentId: S_TAKAHASHI,
    email: "tanaka@demo.co.jp", phone: "03-6000-2001",
    notes: "投資判断の実務リーダー。数字に基づいた判断を重視",
    groupId: G_PLANNING, orgLevel: 2, createdAt: ts, updatedAt: ts,
  },
  {
    id: S_YAMAGUCHI, dealId: DEAL, name: "山口 千佳", department: "経営企画部", title: "課長",
    roleInDeal: "evaluator", influenceLevel: 3, attitude: "neutral",
    mission: "事業計画のレビュー・分析", relationshipOwner: "", parentId: S_TANAKA,
    email: "yamaguchi@demo.co.jp", phone: "",
    notes: "Excel/スプレッドシートでの分析が得意。定量評価を担当",
    groupId: G_PLANNING, orgLevel: 4, createdAt: ts, updatedAt: ts,
  },

  // ── コーポレート本部 > 人事部 ──
  {
    id: S_ITO, dealId: DEAL, name: "伊藤 雅人", department: "人事部", title: "部長",
    roleInDeal: "user", influenceLevel: 3, attitude: "supportive",
    mission: "人材戦略・組織開発", relationshipOwner: "", parentId: S_TAKAHASHI,
    email: "ito@demo.co.jp", phone: "03-6000-2010",
    notes: "組織可視化ツールに関心あり。タレントマネジメントとの連携を期待",
    groupId: G_HR, orgLevel: 2, createdAt: ts, updatedAt: ts,
  },
  {
    id: S_NISHIMURA, dealId: DEAL, name: "西村 沙也加", department: "人事部", title: "課長",
    roleInDeal: "user", influenceLevel: 2, attitude: "supportive",
    mission: "採用・教育研修", relationshipOwner: "", parentId: S_ITO,
    email: "nishimura@demo.co.jp", phone: "",
    notes: "組織図データの活用で採用プロセス改善を検討中",
    groupId: G_HR, orgLevel: 4, createdAt: ts, updatedAt: ts,
  },
  {
    id: S_OKADA, dealId: DEAL, name: "岡田 凛", department: "人事部", title: "主任",
    roleInDeal: "user", influenceLevel: 1, attitude: "neutral",
    mission: "採用事務・研修運営", relationshipOwner: "", parentId: S_NISHIMURA,
    email: "okada@demo.co.jp", phone: "",
    notes: "日常的にHRツールを利用。使い勝手のフィードバックが期待できる",
    groupId: G_HR, orgLevel: 5, createdAt: ts, updatedAt: ts,
  },

  // ── コーポレート本部 > 法務部 ──
  {
    id: S_UEDA, dealId: DEAL, name: "上田 正義", department: "法務部", title: "部長",
    roleInDeal: "gatekeeper", influenceLevel: 4, attitude: "opposed",
    mission: "契約審査・コンプライアンス管理", relationshipOwner: "", parentId: S_TAKAHASHI,
    email: "ueda@demo.co.jp", phone: "03-6000-2020",
    notes: "外部SaaS利用の規約チェックが厳しい。個人情報保護に敏感",
    groupId: G_LEGAL, orgLevel: 2, createdAt: ts, updatedAt: ts,
  },
  {
    id: S_MAEDA, dealId: DEAL, name: "前田 萌", department: "法務部", title: "リーガルカウンセル",
    roleInDeal: "evaluator", influenceLevel: 3, attitude: "cautious",
    mission: "契約書レビュー・法的リスク評価", relationshipOwner: "", parentId: S_UEDA,
    email: "maeda@demo.co.jp", phone: "",
    notes: "SaaS利用規約の詳細レビューを担当。データ所在地に関する質問が多い",
    groupId: G_LEGAL, orgLevel: 4, createdAt: ts, updatedAt: ts,
  },

  // ── ビジネス本部 > 営業部 ──
  {
    id: S_KIMURA, dealId: DEAL, name: "木村 洋介", department: "営業部", title: "部長",
    roleInDeal: "approver", influenceLevel: 4, attitude: "promoter",
    mission: "営業戦略の立案・実行", relationshipOwner: "赤坂", parentId: S_SUZUKI,
    email: "kimura@demo.co.jp", phone: "03-6000-3001",
    notes: "営業効率化に強い関心。ツール導入で成約率向上を目指す",
    groupId: G_SALES, orgLevel: 2, createdAt: ts, updatedAt: ts,
  },
  {
    id: S_HAYASHI, dealId: DEAL, name: "林 真理子", department: "営業部", title: "次長",
    roleInDeal: "evaluator", influenceLevel: 3, attitude: "supportive",
    mission: "営業チームのマネジメント", relationshipOwner: "", parentId: S_KIMURA,
    email: "hayashi@demo.co.jp", phone: "",
    notes: "現場との橋渡し役。ツール定着の鍵を握る人物",
    groupId: G_SALES, orgLevel: 3, createdAt: ts, updatedAt: ts,
  },

  // ── ビジネス本部 > 営業部 > エンタープライズ営業課 ──
  {
    id: S_SHIMIZU, dealId: DEAL, name: "清水 拓也", department: "エンタープライズ営業課", title: "課長",
    roleInDeal: "user", influenceLevel: 3, attitude: "supportive",
    mission: "大手企業向け営業の統括", relationshipOwner: "", parentId: S_HAYASHI,
    email: "shimizu@demo.co.jp", phone: "",
    notes: "大手SIer・金融機関を担当。組織図把握のニーズが最も高い",
    groupId: G_ENTERPRISE, orgLevel: 4, createdAt: ts, updatedAt: ts,
  },
  {
    id: S_MORISHITA, dealId: DEAL, name: "森下 愛", department: "エンタープライズ営業課", title: "主任",
    roleInDeal: "user", influenceLevel: 2, attitude: "promoter",
    mission: "エンタープライズ顧客のアカウント管理", relationshipOwner: "", parentId: S_SHIMIZU,
    email: "morishita@demo.co.jp", phone: "",
    notes: "現在Excelで組織図を管理中。ツール化を強く希望",
    groupId: G_ENTERPRISE, orgLevel: 5, createdAt: ts, updatedAt: ts,
  },
  {
    id: S_ISHII, dealId: DEAL, name: "石井 遼", department: "エンタープライズ営業課", title: "担当",
    roleInDeal: "user", influenceLevel: 1, attitude: "neutral",
    mission: "新規顧客開拓", relationshipOwner: "", parentId: S_SHIMIZU,
    email: "ishii@demo.co.jp", phone: "",
    notes: "入社2年目。顧客組織の理解に苦労しており可視化ツールに興味",
    groupId: G_ENTERPRISE, orgLevel: 5, createdAt: ts, updatedAt: ts,
  },

  // ── ビジネス本部 > 営業部 > SMB営業課 ──
  {
    id: S_HARAGUCHI, dealId: DEAL, name: "原口 大地", department: "SMB営業課", title: "課長",
    roleInDeal: "user", influenceLevel: 3, attitude: "neutral",
    mission: "中小企業向け営業の統括", relationshipOwner: "", parentId: S_HAYASHI,
    email: "haraguchi@demo.co.jp", phone: "",
    notes: "SMBはスピード重視。ツールのシンプルさを求める",
    groupId: G_SMB, orgLevel: 4, createdAt: ts, updatedAt: ts,
  },
  {
    id: S_NAKAJIMA, dealId: DEAL, name: "中島 彩", department: "SMB営業課", title: "主任",
    roleInDeal: "user", influenceLevel: 2, attitude: "supportive",
    mission: "中小企業のアカウント管理", relationshipOwner: "", parentId: S_HARAGUCHI,
    email: "nakajima@demo.co.jp", phone: "",
    notes: "既存のCRMツールとの連携を期待。データ入力の手間を減らしたい",
    groupId: G_SMB, orgLevel: 5, createdAt: ts, updatedAt: ts,
  },

  // ── ビジネス本部 > マーケティング部 ──
  {
    id: S_IKEDA, dealId: DEAL, name: "池田 恵美", department: "マーケティング部", title: "部長",
    roleInDeal: "user", influenceLevel: 3, attitude: "supportive",
    mission: "マーケティング戦略・ブランド管理", relationshipOwner: "", parentId: S_SUZUKI,
    email: "ikeda@demo.co.jp", phone: "03-6000-3020",
    notes: "顧客インサイトの可視化に関心。ABMとの連携を検討中",
    groupId: G_MARKETING, orgLevel: 2, createdAt: ts, updatedAt: ts,
  },
  {
    id: S_KAWAGUCHI, dealId: DEAL, name: "川口 翔", department: "マーケティング部", title: "マネージャー",
    roleInDeal: "user", influenceLevel: 2, attitude: "neutral",
    mission: "デジタルマーケティング・リード獲得", relationshipOwner: "", parentId: S_IKEDA,
    email: "kawaguchi@demo.co.jp", phone: "",
    notes: "MA/CRMツールに精通。データ連携の技術面を理解している",
    groupId: G_MARKETING, orgLevel: 4, createdAt: ts, updatedAt: ts,
  },
];

// ========================================
// Relationships（関係線）
// ========================================
export const SAMPLE_RELATIONSHIPS: Relationship[] = [
  // CTO ↔ CSO: 技術×営業の連携
  { id: R_01, dealId: DEAL, sourceId: S_SATO, targetId: S_SUZUKI, type: "alliance", label: "プロダクト戦略で密に連携", bidirectional: true, createdAt: ts },
  // CFO ↔ 法務部長: 慎重派の連携
  { id: R_02, dealId: DEAL, sourceId: S_TAKAHASHI, targetId: S_UEDA, type: "alliance", label: "リスク管理で連携", bidirectional: true, createdAt: ts },
  // CTO → CFO: スピード vs コスト
  { id: R_03, dealId: DEAL, sourceId: S_SATO, targetId: S_TAKAHASHI, type: "rivalry", label: "投資スピードで意見対立", bidirectional: true, createdAt: ts },
  // AI推進室長 → プロダクト開発課長: 技術連携
  { id: R_04, dealId: DEAL, sourceId: S_INOUE, targetId: S_KOBAYASHI, type: "influence", label: "AI機能のプロダクト統合を推進", bidirectional: false, createdAt: ts },
  // 営業部長 → 経営企画部長: 予算確保の働きかけ
  { id: R_05, dealId: DEAL, sourceId: S_KIMURA, targetId: S_TANAKA, type: "influence", label: "営業ツール予算の確保を要請", bidirectional: false, createdAt: ts },
  // エンプラ営業課長 ↔ マーケ部長: ABM連携
  { id: R_06, dealId: DEAL, sourceId: S_SHIMIZU, targetId: S_IKEDA, type: "alliance", label: "ABM施策で協業", bidirectional: true, createdAt: ts },
  // インフラ課長 → 法務部長: セキュリティ審査の協力
  { id: R_07, dealId: DEAL, sourceId: S_MATSUMOTO, targetId: S_UEDA, type: "informal", label: "SaaS導入のセキュリティ審査で連携", bidirectional: false, createdAt: ts },

  // ── 執行役員 → 管掌部門（グループ宛コネクタ） ──
  { id: R_08, dealId: DEAL, sourceId: S_SATO, targetId: G_TECH, type: "oversight", label: "管掌", bidirectional: false, targetType: "group", createdAt: ts },
  { id: R_09, dealId: DEAL, sourceId: S_TAKAHASHI, targetId: G_CORP, type: "oversight", label: "管掌", bidirectional: false, targetType: "group", createdAt: ts },
  { id: R_10, dealId: DEAL, sourceId: S_SUZUKI, targetId: G_BIZ, type: "oversight", label: "管掌", bidirectional: false, targetType: "group", createdAt: ts },
];
