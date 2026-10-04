@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Ashani AI - Stop

REM ============================================================
REM  ASHANI AI SERVER STOPPER
REM
REM  Stops:
REM    1. Ashani Node/Express backend process tree
REM    2. Ollama server
REM
REM  The Cloudflare Tunnel is intentionally NOT stopped because
REM  it is installed as a Windows service and is lightweight when
REM  the local origin is offline.
REM ============================================================

set "PROJECT_ROOT=C:\Users\RG\Aritraa"
set "BACKEND_DIR=%PROJECT_ROOT%\backend"
set "PID_FILE=%BACKEND_DIR%\.ashani_backend.pid"
set "API_PORT=5000"
set "OLLAMA_PORT=11434"

echo.
echo ============================================================
echo                     ASHANI AI SHUTDOWN
echo ============================================================
echo.

echo [1/2] Stopping Ashani backend...

if exist "%PID_FILE%" (
    set "BACKEND_PID="
    set /p BACKEND_PID=<"%PID_FILE%"

    if defined BACKEND_PID (
        echo [INFO] Backend launcher PID: !BACKEND_PID!
        taskkill /PID !BACKEND_PID! /T /F >nul 2>&1
        if errorlevel 1 (
            echo [INFO] Recorded process was already stopped.
        ) else (
            echo [ OK ] Backend process tree stopped.
        )
    )

    del /q "%PID_FILE%" >nul 2>&1
)

REM Fallback: terminate any remaining process owning port 5000.
powershell -NoProfile -Command ^
  "$c=Get-NetTCPConnection -LocalPort %API_PORT% -State Listen -ErrorAction SilentlyContinue; if($c){ $c | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }"

timeout /t 1 /nobreak >nul

powershell -NoProfile -Command "try { Get-NetTCPConnection -LocalPort %API_PORT% -State Listen -ErrorAction Stop ^| Out-Null; exit 1 } catch { exit 0 }" >nul 2>&1

if errorlevel 1 (
    echo [WARN] Something is still listening on port %API_PORT%.
    echo       Check Task Manager if Ashani Backend remains active.
) else (
    echo [ OK ] Port %API_PORT% is free.
)

echo.
echo [2/2] Stopping Ollama...

powershell -NoProfile -Command "try { Get-NetTCPConnection -LocalPort %OLLAMA_PORT% -State Listen -ErrorAction Stop ^| Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1

if errorlevel 1 (
    echo [ OK ] Ollama is not currently listening on port %OLLAMA_PORT%.
    goto DONE
)

taskkill /IM ollama.exe /T /F >nul 2>&1

timeout /t 1 /nobreak >nul

powershell -NoProfile -Command "try { Get-NetTCPConnection -LocalPort %OLLAMA_PORT% -State Listen -ErrorAction Stop ^| Out-Null; exit 1 } catch { exit 0 }" >nul 2>&1

if errorlevel 1 (
    echo [WARN] Ollama may still be running.
    echo       If the Ollama desktop application is active, it may
    echo       automatically restart its server.
) else (
    echo [ OK ] Ollama stopped. GPU inference is no longer active.
)

:DONE
echo.
echo ============================================================
echo                    ASHANI IS STOPPED
echo ============================================================
echo.
echo  Backend:       STOPPED
echo  Ollama:        STOPPED/IDLE
echo  GPU inference: STOPPED
echo  Cloudflare:    Still running as a Windows service
echo.
echo  Run Ashani_Start.bat when you want Ashani online.
echo ============================================================
echo.
pause
endlocal
