Write-Host "Starting local web server..." -ForegroundColor Green
Write-Host ""
Write-Host "Server will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Change to the script directory
Set-Location $PSScriptRoot

# Try using the custom server first, fallback to standard if it doesn't exist
if (Test-Path "simple-server.py") {
    python simple-server.py
} else {
    python -m http.server 8000
}

