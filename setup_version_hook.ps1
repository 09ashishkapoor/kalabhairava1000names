# PowerShell setup script to install the version increment git hook

$HOOK_FILE = ".git/hooks/pre-commit"
$SCRIPT_FILE = "increment_version.ps1"

if (-not (Test-Path $SCRIPT_FILE)) {
    Write-Host "Error: $SCRIPT_FILE not found." -ForegroundColor Red
    exit 1
}

# Ensure .git/hooks directory exists
$hooksDir = ".git/hooks"
if (-not (Test-Path $hooksDir)) {
    New-Item -ItemType Directory -Path $hooksDir -Force | Out-Null
}

# Copy the script to git hooks directory
Copy-Item $SCRIPT_FILE $HOOK_FILE -Force

# Also create a bash version for Git Bash compatibility
$bashScript = "increment_version.sh"
if (Test-Path $bashScript) {
    Copy-Item $bashScript $HOOK_FILE -Force
}

Write-Host "Git hook installed successfully!" -ForegroundColor Green
Write-Host "The version will now auto-increment on each commit."
Write-Host ""
$currentVersion = if (Test-Path "version.txt") { (Get-Content "version.txt" -Raw).Trim() } else { "unknown" }
Write-Host "Current version: $currentVersion"

