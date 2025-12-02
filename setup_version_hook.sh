#!/bin/sh
# Setup script to install the version increment git hook

HOOK_FILE=".git/hooks/pre-commit"
SCRIPT_FILE="increment_version.sh"

if [ ! -f "$SCRIPT_FILE" ]; then
    echo "Error: $SCRIPT_FILE not found."
    exit 1
fi

# Copy the script to git hooks directory
cp "$SCRIPT_FILE" "$HOOK_FILE"
chmod +x "$HOOK_FILE"

echo "Git hook installed successfully!"
echo "The version will now auto-increment on each commit."
echo ""
echo "Current version: $(cat version.txt 2>/dev/null || echo 'unknown')"

