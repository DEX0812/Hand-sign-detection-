@echo off
setlocal enabledelayedexpansion

echo ======================================================
echo    STARTING SIGNVISION AI
echo ======================================================

:: 0. Clean up old processes
echo [0] Cleaning up old sessions...
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM node.exe /T 2>nul
taskkill /F /FI "WINDOWTITLE eq SignVision-*" /T 2>nul
timeout /t 2 /nobreak >nul

:: Get project root
set PROJECT_ROOT=%~dp0

:: 1. Start Backend in a new window 
echo [1/2] Starting Python Backend...
start "SignVision-Backend" cmd /c "cd /d %PROJECT_ROOT% && python src\web\api.py"

:: Wait for backend
echo Waiting for backend to initialize...
ping -n 6 127.0.0.1 >nul

:: 2. Start Frontend in a new window
echo [2/2] Starting Frontend (Vite)...
start "SignVision-Frontend" cmd /c "cd /d %PROJECT_ROOT%\src\web\ui && npm.cmd run dev"

:: Wait for Vite
echo Waiting for Vite to stabilize...
ping -n 6 127.0.0.1 >nul

:: 3. Open Browser
echo Opening browser...
start http://localhost:5173

echo.
echo ======================================================
echo    SYSTEM RUNNING
echo ======================================================
echo.
echo Close the newly opened windows or run scripts\STOP_APP.bat to stop.
:: Removing pause to avoid issues in non-interactive environments.
@rem pause
