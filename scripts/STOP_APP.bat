@echo off
echo ======================================================
echo    STOPPING SIGNVISION AI PROCESSES
echo ======================================================

echo [1/2] Stopping Python Backend...
taskkill /F /IM python.exe /T 2>nul
taskkill /F /FI "WINDOWTITLE eq SignVision-Backend*" /T 2>nul

echo [2/2] Stopping Node/NPM Frontend...
taskkill /F /IM node.exe /T 2>nul
taskkill /F /FI "WINDOWTITLE eq SignVision-Frontend*" /T 2>nul

echo.
echo SignVision AI has been stopped.
timeout /t 2 >nul
exit
