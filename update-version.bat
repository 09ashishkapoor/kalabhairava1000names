@echo off
REM Double-click this .bat to run the PowerShell update script with bypassed ExecutionPolicy
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0local_update_version.ps1"
if errorlevel 1 (
    echo.
    echo Script execution failed with error code %errorlevel%
    echo.
)
pause
endlocal
