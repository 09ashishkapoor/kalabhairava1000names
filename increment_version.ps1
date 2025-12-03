# PowerShell version for Windows
# Auto-increment version number script
# Can be used as a git hook or run manually

param(
    [switch]$SkipGitAdd
)

$VERSION_FILE = "version.txt"
$LAST_UPDATED_FILE = "last-updated.txt"

# Check if version.txt exists
if (-not (Test-Path $VERSION_FILE)) {
    Write-Host "Error: version.txt not found." -ForegroundColor Red
    exit 1
}

# Read current version
$CURRENT_VERSION = (Get-Content $VERSION_FILE -Raw).Trim()

# Extract version number (e.g., "v1.11" -> "1.11")
$VERSION_NUM = $CURRENT_VERSION -replace '^v', ''

# Check if version format is valid (e.g., "1.11" or "1.11.0")
if ($VERSION_NUM -notmatch '^\d+\.\d+(\.\d+)?$') {
    Write-Host "Error: Invalid version format '$CURRENT_VERSION'. Expected format: vX.Y or vX.Y.Z" -ForegroundColor Red
    exit 1
}

# Split version into parts
$VERSION_PARTS = $VERSION_NUM -split '\.'
$MAJOR = [int]$VERSION_PARTS[0]
$MINOR = [int]$VERSION_PARTS[1]
$PATCH = if ($VERSION_PARTS.Length -gt 2) { [int]$VERSION_PARTS[2] } else { $null }

# Increment patch version (or minor if no patch)
if ($null -eq $PATCH) {
    # Format: v1.11 -> v1.12
    $NEW_MINOR = $MINOR + 1
    $NEW_VERSION = "v${MAJOR}.${NEW_MINOR}"
} else {
    # Format: v1.11.0 -> v1.11.1
    $NEW_PATCH = $PATCH + 1
    $NEW_VERSION = "v${MAJOR}.${MINOR}.${NEW_PATCH}"
}

# Write new version to file
Set-Content -Path $VERSION_FILE -Value $NEW_VERSION -NoNewline

# Update last updated date to today
$TODAY_DATE = Get-Date -Format "yyyy-MM-dd"
Set-Content -Path $LAST_UPDATED_FILE -Value $TODAY_DATE -NoNewline

# Update sitemap.xml lastmod date
$SITEMAP_FILE = "sitemap.xml"
if (Test-Path $SITEMAP_FILE) {
    $sitemapContent = Get-Content $SITEMAP_FILE -Raw
    $sitemapContent = $sitemapContent -replace '<lastmod>\d{4}-\d{2}-\d{2}</lastmod>', "<lastmod>$TODAY_DATE</lastmod>"
    Set-Content -Path $SITEMAP_FILE -Value $sitemapContent -NoNewline
}

# If running as git hook, stage the files
if (-not $SkipGitAdd) {
    try {
        $gitDir = git rev-parse --git-dir 2>$null
        if ($gitDir) {
            git add $VERSION_FILE 2>$null
            git add $LAST_UPDATED_FILE 2>$null
            if (Test-Path $SITEMAP_FILE) {
                git add $SITEMAP_FILE 2>$null
            }
        }
    } catch {
        # Ignore errors if not in a git repo
    }
}

Write-Host "Version incremented: $CURRENT_VERSION -> $NEW_VERSION" -ForegroundColor Green
Write-Host "Last updated date set to: $TODAY_DATE" -ForegroundColor Green
if (Test-Path $SITEMAP_FILE) {
    Write-Host "Sitemap.xml updated with new lastmod date" -ForegroundColor Green
}

exit 0

