@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Ashani AI - Start

REM ============================================================
REM  ASHANI AI SERVER STARTER
REM  Project: C:\Users\RG\Aritraa
REM
REM  Starts:
REM    1. Ollama (only if port 11434 is not already active)
REM    2. Node/Express backend (npm run dev)
REM
REM  Cloudflare Tunnel is installed as a Windows service and
REM  therefore starts automatically with Windows.
REM ============================================================

set "PROJECT_ROOT=C:\Users\RG\Aritraa"
set "BACKEND_DIR=%PROJECT_ROOT%\backend"
set "PID_FILE=%BACKEND_DIR%\.ashani_backend.pid"
set "OLLAMA_PORT=11434"
set "API_PORT=5000"
set "HEALTH_URL=http://localhost:%API_PORT%/api/health"

echo.
echo ============================================================
echo                     ASHANI AI SERVER
echo ============================================================
echo.

if not exist "%BACKEND_DIR%\package.json" (
    echo [ERROR] Backend folder not found:
    echo         %BACKEND_DIR%
    echo.
    pause
    exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js was not found in PATH.
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm was not found in PATH.
    pause
    exit /b 1
)

echo [1/3] Checking Cloudflare Tunnel...

sc query cloudflared >nul 2>&1
if errorlevel 1 (
    echo [WARN] cloudflared Windows service was not found.
    echo       The permanent tunnel may not be available.
) else (
    set "CF_STATE="
    for /f "tokens=3" %%S in ('sc query cloudflared ^| findstr /I "STATE"') do set "CF_STATE=%%S"
    if /I "!CF_STATE!"=="RUNNING" (
        echo [ OK ] Cloudflare Tunnel service is RUNNING.
    ) else (
        echo [INFO] Cloudflare Tunnel service is not running.
        echo       Attempting to start it...
        net start cloudflared >nul 2>&1
        if errorlevel 1 (
            echo [WARN] Could not start cloudflared automatically.
            echo       Administrator privileges may be required.
        ) else (
            echo [ OK ] Cloudflare Tunnel service started.
        )
    )
)

echo.
echo [2/3] Checking Ollama...

powershell -NoProfile -Command "try { Get-NetTCPConnection -LocalPort %OLLAMA_PORT% -State Listen -ErrorAction Stop ^| Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1

if not errorlevel 1 (
    echo [ OK ] Ollama is already listening on port %OLLAMA_PORT%.
) else (
    where ollama >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Ollama was not found in PATH.
        echo       Start Ollama manually, then run this script again.
        pause
        exit /b 1
    )

    echo [INFO] Ollama is not running. Starting Ollama...
    start "Ashani Ollama" /min cmd /c "ollama serve"

    echo [INFO] Waiting for Ollama...
    set /a OLLAMA_ATTEMPTS=0

    :WAIT_OLLAMA
    timeout /t 1 /nobreak >nul
    powershell -NoProfile -Command "try { Get-NetTCPConnection -LocalPort %OLLAMA_PORT% -State Listen -ErrorAction Stop ^| Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
    if not errorlevel 1 goto OLLAMA_READY

    set /a OLLAMA_ATTEMPTS+=1
    if !OLLAMA_ATTEMPTS! GEQ 20 (
        echo [ERROR] Ollama did not start within 20 seconds.
        pause
        exit /b 1
    )
    goto WAIT_OLLAMA

    :OLLAMA_READY
    echo [ OK ] Ollama is listening on port %OLLAMA_PORT%.
)

echo.
echo [3/3] Checking Ashani backend...

powershell -NoProfile -Command "try { Get-NetTCPConnection -LocalPort %API_PORT% -State Listen -ErrorAction Stop ^| Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1

if not errorlevel 1 (
    echo [ OK ] Ashani backend is already listening on port %API_PORT%.
    goto VERIFY
)

echo [INFO] Starting Ashani backend...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$p=Start-Process -FilePath 'cmd.exe' -ArgumentList '/k','cd /d ""%BACKEND_DIR%"" ^&^& npm run dev' -WorkingDirectory '%BACKEND_DIR%' -PassThru; Set-Content -Path '%PID_FILE%' -Value $p.Id"

if errorlevel 1 (
    echo [ERROR] Failed to launch the backend.
    pause
    exit /b 1
)

echo [ OK ] Backend launch command sent.
echo [INFO] Waiting for Express on port %API_PORT%...

set /a API_ATTEMPTS=0

:WAIT_API
timeout /t 1 /nobreak >nul
powershell -NoProfile -Command "try { Get-NetTCPConnection -LocalPort %API_PORT% -State Listen -ErrorAction Stop ^| Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 goto API_READY

set /a API_ATTEMPTS+=1
if !API_ATTEMPTS! GEQ 30 (
    echo [WARN] Backend did not open port %API_PORT% within 30 seconds.
    echo       Check the Ashani Backend window for the actual error.
    pause
    exit /b 1
)
goto WAIT_API

:API_READY
echo [ OK ] Express is listening on port %API_PORT%.

:VERIFY
echo.
echo Verifying Ashani health endpoint...
powershell -NoProfile -Command ^
  "try { $r=Invoke-RestMethod -Uri '%HEALTH_URL%' -TimeoutSec 5; if ($r.status -eq 'healthy') { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1

if errorlevel 1 (
    echo [WARN] Backend port is open, but /api/health did not report healthy.
    echo       Check the Ashani Backend window.
) else (
    echo [ OK ] Ashani backend health check passed.
)

echo.
echo ============================================================
echo                    ASHANI IS READY
echo ============================================================
echo.
echo  Frontend:  https://ashani.online
echo  API:       https://api.ashani.online
echo  Backend:   http://localhost:%API_PORT%
echo  Ollama:    http://localhost:%OLLAMA_PORT%
echo.
echo  Cloudflare Tunnel: Windows service
echo  GPU inference:     Ollama / RTX 3060
echo.
echo  Run Ashani_Stop.bat when you are finished.
echo ============================================================
echo.
pause
endlocal
