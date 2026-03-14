#!/bin/bash
# ============================================================
# document_hub — SessionStart Hook
# 役割:
#   1. プロジェクトコンテキストを stdout に出力（Claude が記憶を復元）
#   2. saas-power-chart の依存関係をインストール（lint が動く状態にする）
# ============================================================
set -euo pipefail

REPO_ROOT="${CLAUDE_PROJECT_DIR:-$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || pwd)}"

# ── コンテキストファイルを表示 ──────────────────────────────
echo "========================================================"
echo "  document_hub — セッション開始コンテキスト"
echo "  $(date '+%Y-%m-%d %H:%M JST')"
echo "========================================================"
echo ""

SESSION_STATE="$REPO_ROOT/docs/assistant/context/session_state.md"
if [ -f "$SESSION_STATE" ]; then
  echo "📋 [session_state.md]"
  echo "----------------------------------------"
  cat "$SESSION_STATE"
  echo ""
fi

ECHO_CTX="$REPO_ROOT/docs/assistant/context/projects/echo.md"
if [ -f "$ECHO_CTX" ]; then
  echo "🚀 [projects/echo.md]"
  echo "----------------------------------------"
  # 長いのでフェーズ進捗・未実装・次アクションのセクションだけ抜粋
  awk '
    /^## (実装済みファイル一覧|データモデル|AIプロンプト設計|デザインシステム)/ { skip=1 }
    /^## / && !/^## (実装済みファイル一覧|データモデル|AIプロンプト設計|デザインシステム)/ { skip=0 }
    !skip { print }
  ' "$ECHO_CTX"
  echo ""
fi

ERRORS_LOG="$REPO_ROOT/docs/assistant/errors_log.md"
if [ -f "$ERRORS_LOG" ]; then
  LINE_COUNT=$(wc -l < "$ERRORS_LOG")
  if [ "$LINE_COUNT" -gt 3 ]; then
    echo "⚠️  [errors_log.md] — 直近のエラーログ"
    echo "----------------------------------------"
    tail -30 "$ERRORS_LOG"
    echo ""
  fi
fi

echo "========================================================"
echo "  コンテキスト読み込み完了 — 開発を再開できます"
echo "========================================================"
echo ""

# ── saas-power-chart の依存関係インストール ─────────────────
SAAS_DIR="$REPO_ROOT/projects/saas-power-chart"
if [ -f "$SAAS_DIR/package.json" ] && [ "${CLAUDE_CODE_REMOTE:-}" = "true" ]; then
  echo "📦 saas-power-chart: npm install 実行中..."
  cd "$SAAS_DIR"
  npm install --prefer-offline --no-audit --no-fund 2>&1 | tail -5
  echo "✅ saas-power-chart: 依存関係インストール完了"
  cd "$REPO_ROOT"
fi
