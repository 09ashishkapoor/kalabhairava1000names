Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Kalabhairava Sahasranama - Local Server" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting local web server..." -ForegroundColor Green

# Change to the script directory
Set-Location $PSScriptRoot

# Set the port
$PORT = 8000

# Try using the custom server first, fallback to standard if it doesn't exist
if (Test-Path "simple-server.py") {
    Write-Host "Using custom Python server on port $PORT" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Server URL: http://localhost:$PORT" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Opening browser in 2 seconds..." -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Open browser after a short delay in background
    Start-Job -ScriptBlock {
        Start-Sleep -Seconds 2
        Start-Process "http://localhost:$using:PORT"
    } | Out-Null
    
    # Start the server
    python simple-server.py
} else {
    Write-Host "Using standard Python HTTP server on port $PORT" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Server URL: http://localhost:$PORT" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Opening browser in 2 seconds..." -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Open browser after a short delay in background
    Start-Job -ScriptBlock {
        Start-Sleep -Seconds 2
        Start-Process "http://localhost:$using:PORT"
    } | Out-Null
    
    # Start the server
    python -m http.server $PORT
}
