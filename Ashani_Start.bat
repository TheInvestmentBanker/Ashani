@echo off

if "%ASHANI_MINIMIZED%" NEQ "1" (
    set "ASHANI_MINIMIZED=1"
    start "" /min cmd /c ""%~f0""
    exit /b
)

setlocal
title Ashani AI - Start

echo.
echo ==========================================
echo          ASHANI AI - STARTING
echo ==========================================
echo.

REM ==========================================
REM 1. CLOUDFLARE TUNNEL
REM ==========================================

echo [1/3] Checking Cloudflare Tunnel...

sc query cloudflared | findstr /I "RUNNING" >nul

if errorlevel 1 (
    echo [WARN] Cloudflare Tunnel is NOT running.
    echo        Start the cloudflared service from Windows Services.
) else (
    echo [OK] Cloudflare Tunnel is running.
)

echo.

REM ==========================================
REM 2. OLLAMA
REM ==========================================

echo [2/3] Checking Ollama...

curl.exe -s http://localhost:11434/api/tags >nul 2>&1

if errorlevel 1 goto START_OLLAMA

echo [OK] Ollama is already running.
goto START_BACKEND


:START_OLLAMA

echo [INFO] Ollama is not running.
echo [INFO] Starting Ollama...

start "" /min "C:\Users\RG\AppData\Local\Programs\Ollama\ollama.exe" serve

echo [INFO] Waiting for Ollama...

set /a OLLAMA_WAIT=0


:WAIT_OLLAMA

timeout /t 1 /nobreak >nul

curl.exe -s http://localhost:11434/api/tags >nul 2>&1

if not errorlevel 1 goto OLLAMA_READY

set /a OLLAMA_WAIT+=1

if %OLLAMA_WAIT% GEQ 30 goto OLLAMA_FAILED

goto WAIT_OLLAMA


:OLLAMA_READY

echo [OK] Ollama is running.
echo.


REM ==========================================
REM 3. ASHANI BACKEND
REM ==========================================

:START_BACKEND

echo [3/3] Starting Ashani backend...

netstat -ano | findstr ":5000" >nul

if not errorlevel 1 (
    echo [OK] Ashani backend is already running.
    goto ONLINE
)

echo [INFO] Launching Express backend...

start "Ashani Backend" /min cmd /k "cd /d "%~dp0backend" && npm run dev"

echo [INFO] Waiting for backend...

set /a BACKEND_WAIT=0


:WAIT_BACKEND

timeout /t 1 /nobreak >nul

curl.exe -s http://localhost:5000/api/health >nul 2>&1

if not errorlevel 1 goto BACKEND_READY

set /a BACKEND_WAIT+=1

if %BACKEND_WAIT% GEQ 30 goto BACKEND_FAILED

goto WAIT_BACKEND


:BACKEND_READY

echo [OK] Ashani backend is running.
goto ONLINE


REM ==========================================
REM ERROR STATES
REM ==========================================

:OLLAMA_FAILED

echo.
echo [ERROR] Ollama failed to start.
echo.
echo Try running this manually:
echo ollama list
echo.
pause
exit /b 1


:BACKEND_FAILED

echo.
echo [ERROR] Ashani backend failed to start.
echo.
echo Check the Ashani Backend window for the error.
echo.
pause
exit /b 1


REM ==========================================
REM ONLINE
REM ==========================================

:ONLINE

echo.
echo ==========================================
echo          ASHANI AI IS ONLINE
echo ==========================================
echo.
echo Frontend:
echo https://ashani.online
echo.
echo API:
echo https://api.ashani.online
echo.
echo ==========================================
echo.

pause