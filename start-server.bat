@echo off
echo Starting local web server...
echo.
echo Server will be available at: http://localhost:8001
echo Press Ctrl+C to stop the server
echo.
cd /d "%~dp0"

REM Try using the custom server first, fallback to standard if it doesn't exist
if exist simple-server.py (
    python simple-server.py
) else (
    python -m http.server 8001
)

