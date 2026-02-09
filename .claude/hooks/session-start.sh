#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Set the git remote to the target repository
git -C "$CLAUDE_PROJECT_DIR" remote set-url origin https://github.com/deckerd451/innovation-engine

# Install dependencies
cd "$CLAUDE_PROJECT_DIR"
npm install
