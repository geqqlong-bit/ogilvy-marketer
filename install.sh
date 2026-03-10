#!/usr/bin/env bash
set -euo pipefail

TARGET_WORKSPACE="${1:-$HOME/.openclaw/workspace}"
TARGET_DIR="$TARGET_WORKSPACE/skills/ogilvy-marketer"
SRC_DIR="$(cd "$(dirname "$0")" && pwd)/skill/ogilvy-marketer"

mkdir -p "$TARGET_WORKSPACE/skills"
rm -rf "$TARGET_DIR"
cp -R "$SRC_DIR" "$TARGET_DIR"

echo "Installed ogilvy-marketer to: $TARGET_DIR"
echo "Next: export OGILVY_MARKETERCLAW_URL / OGILVY_LLM_BASE_URL / OGILVY_LLM_API_KEY if needed."
