# local_update_version.ps1
# Double-clickable PowerShell script to increment version, update last-updated, and inject values into index.html
# Usage: double-click the accompanying update-version.bat or run this script in PowerShell

# Determine script directory
$scriptPath = $MyInvocation.MyCommand.Definition
if ([string]::IsNullOrEmpty($scriptPath)) { $scriptDir = Get-Location } else { $scriptDir = Split-Path -Parent $scriptPath }
Set-Location $scriptDir

$versionFile = Join-Path $scriptDir 'version.txt'
$lastFile = Join-Path $scriptDir 'last-updated.txt'
$indexFile = Join-Path $scriptDir 'index.html'

# Ensure version.txt exists
if (-not (Test-Path $versionFile)) {
    Set-Content -Path $versionFile -Value 'v1.0' -NoNewline
}

# Read and parse current version
$current = (Get-Content $versionFile -Raw).Trim()
$verNum = $current -replace '^v', ''
if ($verNum -notmatch '^[0-9]+\.[0-9]+(\.[0-9]+)?$') {
    Write-Host "Invalid version format in ${versionFile}: '$current'" -ForegroundColor Yellow
    Write-Host "Expected: vX.Y or vX.Y.Z. Resetting to v1.0"
    $new = 'v1.0'
} else {
    $parts = $verNum -split '\.'
    $major = [int]$parts[0]
    $minor = [int]$parts[1]
    $patch = $null
    if ($parts.Length -gt 2) { $patch = [int]$parts[2] }

    if ($null -eq $patch) {
        # increment minor
        $minor = $minor + 1
        $new = "v${major}.${minor}"
    } else {
        # increment patch
        $patch = $patch + 1
        $new = "v${major}.${minor}.${patch}"
    }
}

# Write new version and last updated date
Set-Content -Path $versionFile -Value $new -NoNewline
$todayIso = Get-Date -Format 'yyyy-MM-dd'
Set-Content -Path $lastFile -Value $todayIso -NoNewline

# Update index.html in-place (make backup first)
if (Test-Path $indexFile) {
    $bak = "$indexFile.bak"
    Copy-Item -Path $indexFile -Destination $bak -Force
    $html = Get-Content $indexFile -Raw

    # Replace content inside <small class="site-version">...</small>
    try {
        $pat1 = '(?s)(<small\s+class=["\x27]site-version["\x27]\s*>).*?(</small>)'
        $repl1 = "`$1$new`$2"
        $html = [regex]::Replace($html, $pat1, $repl1)
    } catch {
        Write-Host "Failed to update site-version in index.html: $_" -ForegroundColor Yellow
    }

    # Replace content inside <span id="last-updated-date">...</span>
    $formatted = (Get-Date).ToString('MMMM d, yyyy')
    try {
        $pat2 = '(?s)(<span\s+id=["\x27]last-updated-date["\x27]\s*>).*?(</span>)'
        $repl2 = "`$1$formatted`$2"
        $html = [regex]::Replace($html, $pat2, $repl2)
    } catch {
        Write-Host "Failed to update last-updated span in index.html: $_" -ForegroundColor Yellow
    }

    # Write updated HTML back
    Set-Content -Path $indexFile -Value $html -NoNewline
    Write-Host "index.html updated (backup at $bak)" -ForegroundColor Green
} else {
    Write-Host "index.html not found; only updated version.txt and last-updated.txt" -ForegroundColor Yellow
}

Write-Host "Version updated to $new" -ForegroundColor Green
Write-Host "Last updated set to $todayIso" -ForegroundColor Green

# Optionally open index.html in default browser to verify
# Start-Process "$indexFile"

exit 0
