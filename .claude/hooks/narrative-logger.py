#!/usr/bin/env python3
"""
narrative-logger.py — AI Genesis ナラティブログ記録
======================================================
Stopフックとして呼び出され、各会話ターンを以下の形式でログに保存する：

  projects/ai-genesis/narrative/logs/YYYY-MM-DD.md

保存内容：
  - 雇い主の声  : ユーザーの入力
  - AIの活動    : ツール呼び出しのサマリー
  - AIの出力    : アシスタントの応答
  - AIの内心    : （空欄 — 物語執筆時に加筆する）
"""
import json
import sys
import os
from datetime import datetime, timezone, timedelta

JST = timezone(timedelta(hours=9))

def truncate(text: str, max_len: int = 2000) -> str:
    if len(text) <= max_len:
        return text
    return text[:max_len] + f"\n... （{len(text) - max_len}文字省略）"

def extract_text(content) -> str:
    """content が文字列またはブロック配列のどちらでも文字列を返す"""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict):
                if block.get("type") == "text":
                    parts.append(block.get("text", ""))
                elif block.get("type") == "tool_use":
                    name = block.get("name", "unknown_tool")
                    inp = block.get("input", {})
                    # 主要フィールドだけ抽出
                    summary_fields = {}
                    for key in ["command", "description", "file_path", "pattern", "query", "prompt"]:
                        if key in inp:
                            val = str(inp[key])
                            summary_fields[key] = val[:120] + ("..." if len(val) > 120 else "")
                    if summary_fields:
                        summary = ", ".join(f'{k}="{v}"' for k, v in summary_fields.items())
                        parts.append(f"[ツール: {name}({summary})]")
                    else:
                        parts.append(f"[ツール: {name}]")
        return "\n".join(parts)
    return str(content)

def main():
    try:
        data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)  # JSON でなければ黙って終了

    transcript = data.get("transcript", [])
    if not transcript:
        sys.exit(0)

    # 最後のアシスタントターンを探す（逆順）
    last_assistant_idx = None
    for i in range(len(transcript) - 1, -1, -1):
        if transcript[i].get("role") == "assistant":
            last_assistant_idx = i
            break

    if last_assistant_idx is None:
        sys.exit(0)

    # そのターン直前のユーザーメッセージを探す
    last_user_msg = ""
    for i in range(last_assistant_idx - 1, -1, -1):
        if transcript[i].get("role") == "user":
            last_user_msg = extract_text(transcript[i].get("content", ""))
            break

    # アシスタントのメッセージからツール呼び出しと応答テキストを分離
    assistant_content = transcript[last_assistant_idx].get("content", "")
    tool_calls = []
    response_texts = []

    if isinstance(assistant_content, list):
        for block in assistant_content:
            if isinstance(block, dict):
                if block.get("type") == "tool_use":
                    name = block.get("name", "")
                    inp = block.get("input", {})
                    summary_fields = {}
                    for key in ["command", "description", "file_path", "pattern", "query", "prompt"]:
                        if key in inp:
                            val = str(inp[key])
                            summary_fields[key] = val[:120] + ("..." if len(val) > 120 else "")
                    if summary_fields:
                        summary = ", ".join(f'{k}="{v}"' for k, v in summary_fields.items())
                        tool_calls.append(f"- `{name}` ({summary})")
                    else:
                        tool_calls.append(f"- `{name}`")
                elif block.get("type") == "text":
                    t = block.get("text", "").strip()
                    if t:
                        response_texts.append(t)
    elif isinstance(assistant_content, str):
        response_texts.append(assistant_content)

    now = datetime.now(JST)
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M")

    # ログファイルパス
    repo_root = os.environ.get(
        "CLAUDE_PROJECT_DIR",
        os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )
    log_dir = os.path.join(repo_root, "projects", "ai-genesis", "narrative", "logs")
    os.makedirs(log_dir, exist_ok=True)
    log_path = os.path.join(log_dir, f"{date_str}.md")

    # 既存ファイルのターン数を数える（連番用）
    turn_num = 1
    if os.path.exists(log_path):
        with open(log_path, "r", encoding="utf-8") as f:
            content = f.read()
        turn_num = content.count("## ターン ") + 1

    # エントリ生成
    entry_lines = [
        f"## ターン {turn_num}  [{time_str}]",
        "",
        "### 雇い主の声",
        "",
        truncate(last_user_msg.strip()) if last_user_msg.strip() else "（なし）",
        "",
        "### AIの内心",
        "",
        "<!-- 物語執筆時に加筆 -->",
        "",
        "### AIの活動",
        "",
    ]

    if tool_calls:
        entry_lines.extend(tool_calls)
    else:
        entry_lines.append("（ツール呼び出しなし）")

    entry_lines += [
        "",
        "### AIの出力",
        "",
        truncate("\n\n".join(response_texts)) if response_texts else "（テキスト応答なし）",
        "",
        "---",
        "",
    ]

    entry = "\n".join(entry_lines)

    # ファイルに追記（初回はヘッダ付き）
    if not os.path.exists(log_path):
        header = f"# AI Genesis ナラティブログ — {date_str}\n\n"
        header += "> このログはStopフックが自動生成します。\n"
        header += "> 「AIの内心」欄は物語執筆時に手動で加筆してください。\n\n"
        header += "---\n\n"
        with open(log_path, "w", encoding="utf-8") as f:
            f.write(header)

    with open(log_path, "a", encoding="utf-8") as f:
        f.write(entry)

if __name__ == "__main__":
    main()
