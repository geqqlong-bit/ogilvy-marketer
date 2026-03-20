#!/usr/bin/env bash
# MarketerClaw installer
# Usage:
#   ./install.sh               → installs to ~/.openclaw/skills/
#   ./install.sh /path/to/ws   → installs to /path/to/ws/skills/
#   ./install.sh --local       → installs to ./skills/ (current workspace)

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_SRC="$REPO_DIR/skills"

# Resolve target
if [[ "${1:-}" == "--local" ]]; then
  TARGET_DIR="$(pwd)/skills"
elif [[ -n "${1:-}" ]]; then
  TARGET_DIR="${1}/skills"
else
  TARGET_DIR="$HOME/.openclaw/skills"
fi

# Skills to install (all mc-* by default, or pass skill names as extra args)
if [[ $# -gt 1 ]]; then
  SKILLS=("${@:2}")
else
  SKILLS=($(ls "$SKILLS_SRC"))
fi

echo ""
echo "  MarketerClaw Installer"
echo "  ─────────────────────────────────────"
echo "  Source : $SKILLS_SRC"
echo "  Target : $TARGET_DIR"
echo "  Skills : ${SKILLS[*]}"
echo "  ─────────────────────────────────────"
echo ""

mkdir -p "$TARGET_DIR"

installed=0
for skill in "${SKILLS[@]}"; do
  src="$SKILLS_SRC/$skill"
  dst="$TARGET_DIR/$skill"

  if [[ ! -d "$src" ]]; then
    echo "  ⚠  Skipping '$skill' (not found in $SKILLS_SRC)"
    continue
  fi

  rm -rf "$dst"
  cp -R "$src" "$dst"
  echo "  ✅ $skill → $dst"
  ((installed++))
done

echo ""
echo "  Installed $installed skill(s) to $TARGET_DIR"
echo ""
echo "  Usage in OpenClaw:"
echo "    新品上市，产品是轻养零糖茶，目标人群 25-35 岁都市白领..."
echo "    We're launching a DTC skincare brand in the US market..."
echo ""
