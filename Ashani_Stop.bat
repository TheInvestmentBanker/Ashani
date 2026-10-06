@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Ashani AI - Stop

REM ============================================================
REM  ASHANI AI SERVER STOPPER
REM
REM  Stops:
REM    1. Ashani Node/Express backend
REM    2. Ollama server
REM    3. SearXNG + Valkey Docker containers
REM
REM  The Cloudflare Tunnel is intentionally NOT stopped because
REM  it is installed as a Windows service.
REM ============================================================

set "PROJECT_ROOT=%~dp0"
set "BACKEND_DIR=%PROJECT_ROOT%backend"
set "SEARCH_DIR=%PROJECT_ROOT%search\searxng"

set "PID_FILE=%BACKEND_DIR%\.ashani_backend.pid"
set "API_PORT=5000"
set "OLLAMA_PORT=11434"
set "SEARXNG_PORT=8080"


echo.
echo ============================================================
echo                     ASHANI AI SHUTDOWN
echo ============================================================
echo.


REM ============================================================
REM 1. STOP ASHANI BACKEND
REM ============================================================

echo [1/3] Stopping Ashani backend...
echo.

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


REM ------------------------------------------------------------
REM Fallback: terminate any remaining process owning port 5000
REM ------------------------------------------------------------

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


REM ============================================================
REM 2. STOP OLLAMA
REM ============================================================

echo [2/3] Stopping Ollama...
echo.


powershell -NoProfile -Command "try { Get-NetTCPConnection -LocalPort %OLLAMA_PORT% -State Listen -ErrorAction Stop ^| Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1

if errorlevel 1 (

    echo [ OK ] Ollama is not currently listening on port %OLLAMA_PORT%.

) else (

    taskkill /IM ollama.exe /T /F >nul 2>&1

    timeout /t 1 /nobreak >nul

    powershell -NoProfile -Command "try { Get-NetTCPConnection -LocalPort %OLLAMA_PORT% -State Listen -ErrorAction Stop ^| Out-Null; exit 1 } catch { exit 0 }" >nul 2>&1

    if errorlevel 1 (
        echo [WARN] Ollama may still be running.
        echo       If the Ollama desktop application is active, it may
        echo       automatically restart its server.
    ) else (
        echo [ OK ] Ollama stopped.
        echo [ OK ] GPU inference is no longer active.
    )

)


echo.


REM ============================================================
REM 3. STOP SEARXNG / DOCKER
REM ============================================================

echo [3/3] Stopping SearXNG...
echo.


if not exist "%SEARCH_DIR%\docker-compose.yml" (

    echo [WARN] SearXNG docker-compose.yml was not found.
    echo       Expected:
    echo       %SEARCH_DIR%\docker-compose.yml
    goto DOCKER_DONE

)


cd /d "%SEARCH_DIR%"


echo [INFO] Stopping SearXNG containers...

docker compose down

if errorlevel 1 (

    echo [WARN] Docker Compose could not stop SearXNG.
    echo       Check Docker Desktop.

) else (

    echo [ OK ] SearXNG containers stopped.

)


:DOCKER_DONE


REM ============================================================
REM VERIFY SEARXNG
REM ============================================================

timeout /t 1 /nobreak >nul


curl.exe -s http://localhost:%SEARXNG_PORT%/search?q=test^&format=json >nul 2>&1

if not errorlevel 1 (

    echo [WARN] SearXNG is still responding on port %SEARXNG_PORT%.

) else (

    echo [ OK ] SearXNG is offline.

)


REM ============================================================
REM FINAL STATUS
REM ============================================================

echo.
echo ============================================================
echo                    ASHANI IS STOPPED
echo ============================================================
echo.
echo  Backend:       STOPPED
echo  Ollama:        STOPPED/IDLE
echo  GPU inference: STOPPED
echo  SearXNG:       STOPPED
echo  Docker search: STOPPED
echo  Cloudflare:    Still running as a Windows service
echo.
echo  Run Ashani_Start.bat when you want Ashani online.
echo ============================================================
echo.

pause
endlocal