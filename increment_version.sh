#!/bin/sh
# Auto-increment version number script
# Can be used as a git hook or run manually

VERSION_FILE="version.txt"

# Check if version.txt exists
if [ ! -f "$VERSION_FILE" ]; then
    echo "Error: version.txt not found."
    exit 1
fi

# Read current version and remove any whitespace
CURRENT_VERSION=$(cat "$VERSION_FILE" | tr -d '\n\r ')

# Extract version number (e.g., "v1.11" -> "1.11")
VERSION_NUM=$(echo "$CURRENT_VERSION" | sed 's/^v//')

# Check if version format is valid (e.g., "1.11" or "1.11.0")
if ! echo "$VERSION_NUM" | grep -qE '^[0-9]+\.[0-9]+(\.[0-9]+)?$'; then
    echo "Error: Invalid version format '$CURRENT_VERSION'. Expected format: vX.Y or vX.Y.Z"
    exit 1
fi

# Split version into parts
MAJOR=$(echo "$VERSION_NUM" | cut -d. -f1)
MINOR=$(echo "$VERSION_NUM" | cut -d. -f2)
PATCH=$(echo "$VERSION_NUM" | cut -d. -f3)

# Increment patch version (or minor if no patch)
if [ -z "$PATCH" ] || [ "$PATCH" = "$VERSION_NUM" ]; then
    # Format: v1.11 -> v1.12 (no patch version)
    NEW_MINOR=$((MINOR + 1))
    NEW_VERSION="v${MAJOR}.${NEW_MINOR}"
else
    # Format: v1.11.0 -> v1.11.1 (has patch version)
    NEW_PATCH=$((PATCH + 1))
    NEW_VERSION="v${MAJOR}.${MINOR}.${NEW_PATCH}"
fi

# Write new version to file
echo "$NEW_VERSION" > "$VERSION_FILE"

# If running as git hook, stage the file
if [ -n "$GIT_DIR" ] || git rev-parse --git-dir > /dev/null 2>&1; then
    git add "$VERSION_FILE" 2>/dev/null || true
fi

echo "Version incremented: $CURRENT_VERSION -> $NEW_VERSION"

exit 0

