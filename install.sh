#!/usr/bin/env bash
# MarketerClaw installer  v1.1
# Usage:
#   ./install.sh               → installs to ~/.openclaw/skills/ + ~/.openclaw/scripts/
#   ./install.sh /path/to/ws   → installs to /path/to/ws/skills/ + /path/to/ws/scripts/
#   ./install.sh --local       → installs to ./skills/ + ./scripts/ (current workspace)

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_SRC="$REPO_DIR/skills"
SCRIPTS_SRC="$REPO_DIR/scripts"

# Resolve target
if [[ "${1:-}" == "--local" ]]; then
  BASE_DIR="$(pwd)"
elif [[ -n "${1:-}" ]]; then
  BASE_DIR="${1}"
else
  BASE_DIR="$HOME/.openclaw"
fi

TARGET_DIR="$BASE_DIR/skills"
SCRIPTS_DST="$BASE_DIR/scripts"

# Skills to install (all mc-* by default, or pass skill names as extra args)
if [[ $# -gt 1 ]]; then
  SKILLS=("${@:2}")
else
  SKILLS=($(ls "$SKILLS_SRC"))
fi

echo ""
echo "  MarketerClaw Installer v1.1"
echo "  ─────────────────────────────────────"
echo "  Source skills  : $SKILLS_SRC"
echo "  Source scripts : $SCRIPTS_SRC"
echo "  Target skills  : $TARGET_DIR"
echo "  Target scripts : $SCRIPTS_DST"
echo "  Skills         : ${SKILLS[*]}"
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

# Install scripts/ alongside skills/ so mc-dispatch can find them
if [[ -d "$SCRIPTS_SRC" ]]; then
  mkdir -p "$SCRIPTS_DST"
  cp -R "$SCRIPTS_SRC/." "$SCRIPTS_DST/"
  echo "  ✅ scripts → $SCRIPTS_DST"
else
  echo "  ⚠  scripts/ not found in repo — skipping (mc-dispatch may not work)"
fi

echo ""
echo "  Installed $installed skill(s) to $TARGET_DIR"
echo "  Scripts installed to $SCRIPTS_DST"
echo ""
echo "  Usage in OpenClaw:"
echo "    新品上市，产品是轻养零糖茶，目标人群 25-35 岁都市白领..."
echo "    We're launching a DTC skincare brand in the US market..."
echo ""
