#!/bin/bash

# SURGE PROTOCOL - Git Hooks Setup Script
# Run this script to install the pre-commit hooks

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
HOOKS_SRC="$ROOT_DIR/.hooks"
HOOKS_DEST="$ROOT_DIR/.git/hooks"

echo "Setting up Git hooks for Surge Protocol..."

# Check if we're in a git repository
if [ ! -d "$ROOT_DIR/.git" ]; then
    echo "Error: Not a git repository. Run this from the project root."
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DEST"

# Install pre-commit hook
if [ -f "$HOOKS_SRC/pre-commit" ]; then
    cp "$HOOKS_SRC/pre-commit" "$HOOKS_DEST/pre-commit"
    chmod +x "$HOOKS_DEST/pre-commit"
    echo "Installed: pre-commit hook"
else
    echo "Warning: pre-commit hook not found in $HOOKS_SRC"
fi

# Configure git to use our hooks directory (alternative method)
# git config core.hooksPath .hooks

echo ""
echo "Git hooks installed successfully!"
echo ""
echo "The following hooks are now active:"
echo "  - pre-commit: Validates schema before commits"
echo ""
echo "To bypass hooks (not recommended): git commit --no-verify"
