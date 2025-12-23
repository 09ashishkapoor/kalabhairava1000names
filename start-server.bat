@echo off
echo ========================================
echo Kalabhairava Sahasranama - Local Server
echo ========================================
echo.
echo Starting local web server...
cd /d "%~dp0"

REM Set the port
set PORT=8100

REM Check if simple-server.py exists
if exist simple-server.py (
    echo Using custom Python server on port %PORT%
    echo.
    echo Server URL: http://localhost:%PORT%
    echo.
    echo Opening browser in 2 seconds...
    echo Press Ctrl+C to stop the server
    echo ========================================
    echo.
    
    REM Open browser after a short delay
    start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:%PORT%"
    
    REM Start the server
    python simple-server.py
) else (
    echo Using standard Python HTTP server on port %PORT%
    echo.
    echo Server URL: http://localhost:%PORT%
    echo.
    echo Opening browser in 2 seconds...
    echo Press Ctrl+C to stop the server
    echo ========================================
    echo.
    
    REM Open browser after a short delay
    start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:%PORT%"
    
    REM Start the server
    python -m http.server %PORT%
)
