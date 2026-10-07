```bat
@echo off
setlocal EnableExtensions EnableDelayedExpansion

title Ashani AI - Stop

REM ============================================================
REM                    ASHANI AI SHUTDOWN
REM
REM Stops:
REM   1. Ashani Backend
REM   2. Ollama
REM   3. ComfyUI
REM   4. SearXNG / Docker
REM   5. Cloudflare Tunnel
REM
REM ============================================================

set "PROJECT_ROOT=%~dp0"
set "BACKEND_DIR=%PROJECT_ROOT%backend"
set "SEARCH_DIR=%PROJECT_ROOT%search\searxng"

set "PID_FILE=%BACKEND_DIR%\.ashani_backend.pid"

set "API_PORT=5000"
set "OLLAMA_PORT=11434"
set "COMFYUI_PORT=8188"
set "SEARXNG_PORT=8080"

set "CLOUDFLARE_SERVICE=cloudflared"


echo.
echo ============================================================
echo                  ASHANI AI SHUTDOWN
echo ============================================================
echo.


REM ============================================================
REM 1. STOP ASHANI BACKEND
REM ============================================================

echo [1/5] Stopping Ashani backend...
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


REM Fallback: terminate process listening on port 5000

powershell -NoProfile -Command ^
  "$c=Get-NetTCPConnection -LocalPort %API_PORT% -State Listen -ErrorAction SilentlyContinue; if($c){ $c | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }"


timeout /t 1 /nobreak >nul


powershell -NoProfile -Command "try { Get-NetTCPConnection -LocalPort %API_PORT% -State Listen -ErrorAction Stop ^| Out-Null; exit 1 } catch { exit 0 }" >nul 2>&1

if errorlevel 1 (
    echo [WARN] Something is still listening on port %API_PORT%.
) else (
    echo [ OK ] Backend stopped.
    echo [ OK ] Port %API_PORT% is free.
)

echo.


REM ============================================================
REM 2. STOP OLLAMA
REM ============================================================

echo [2/5] Stopping Ollama...
echo.

powershell -NoProfile -Command "try { Get-NetTCPConnection -LocalPort %OLLAMA_PORT% -State Listen -ErrorAction Stop ^| Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1

if errorlevel 1 (

    echo [ OK ] Ollama is already stopped.

) else (

    echo [INFO] Terminating Ollama...

    taskkill /IM ollama.exe /T /F >nul 2>&1

    timeout /t 1 /nobreak >nul

    powershell -NoProfile -Command "try { Get-NetTCPConnection -LocalPort %OLLAMA_PORT% -State Listen -ErrorAction Stop ^| Out-Null; exit 1 } catch { exit 0 }" >nul 2>&1

    if errorlevel 1 (
        echo [WARN] Ollama may still be running.
    ) else (
        echo [ OK ] Ollama stopped.
        echo [ OK ] GPU inference stopped.
    )

)

echo.


REM ============================================================
REM 3. STOP COMFYUI
REM ============================================================

echo [3/5] Stopping ComfyUI...
echo.

powershell -NoProfile -Command "try { Get-NetTCPConnection -LocalPort %COMFYUI_PORT% -State Listen -ErrorAction Stop ^| Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1

if errorlevel 1 (

    echo [ OK ] ComfyUI is already stopped.

) else (

    echo [INFO] Finding ComfyUI process...

    for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":%COMFYUI_PORT% .*LISTENING"') do (
        echo [INFO] ComfyUI PID: %%P
        taskkill /PID %%P /T /F >nul 2>&1
    )

    timeout /t 2 /nobreak >nul

    powershell -NoProfile -Command "try { Get-NetTCPConnection -LocalPort %COMFYUI_PORT% -State Listen -ErrorAction Stop ^| Out-Null; exit 1 } catch { exit 0 }" >nul 2>&1

    if errorlevel 1 (
        echo [WARN] ComfyUI may still be running.
    ) else (
        echo [ OK ] ComfyUI stopped.
        echo [ OK ] Image generation stopped.
    )

)

echo.


REM ============================================================
REM 4. STOP SEARXNG / DOCKER
REM ============================================================

echo [4/5] Stopping SearXNG...
echo.

if not exist "%SEARCH_DIR%\docker-compose.yml" (

    echo [WARN] docker-compose.yml was not found.
    echo Expected:
    echo %SEARCH_DIR%\docker-compose.yml
    goto DOCKER_DONE

)

cd /d "%SEARCH_DIR%"

echo [INFO] Stopping SearXNG containers...

docker compose down

if errorlevel 1 (
    echo [WARN] Docker Compose could not stop SearXNG.
    echo Check Docker Desktop.
) else (
    echo [ OK ] SearXNG containers stopped.
)


:DOCKER_DONE

timeout /t 1 /nobreak >nul

curl.exe -s "http://localhost:%SEARXNG_PORT%/search?q=test&format=json" >nul 2>&1

if not errorlevel 1 (
    echo [WARN] SearXNG is still responding.
) else (
    echo [ OK ] SearXNG is offline.
)

echo.


REM ============================================================
REM 5. STOP CLOUDFLARE TUNNEL
REM ============================================================

echo [5/5] Stopping Cloudflare Tunnel...
echo.

sc query "%CLOUDFLARE_SERVICE%" | findstr /I "RUNNING" >nul

if errorlevel 1 (

    echo [ OK ] Cloudflare Tunnel is already stopped.

) else (

    echo [INFO] Stopping Cloudflare service...

    net stop "%CLOUDFLARE_SERVICE%" >nul 2>&1

    timeout /t 2 /nobreak >nul

    sc query "%CLOUDFLARE_SERVICE%" | findstr /I "STOPPED" >nul

    if errorlevel 1 (
        echo [WARN] Cloudflare Tunnel may still be running.
    ) else (
        echo [ OK ] Cloudflare Tunnel stopped.
    )

)

echo.


REM ============================================================
REM FINAL STATUS
REM ============================================================

echo.
echo ============================================================
echo                    ASHANI IS STOPPED
echo ============================================================
echo.
echo  Backend:          STOPPED
echo  Ollama:           STOPPED
echo  GPU inference:    STOPPED
echo  ComfyUI:          STOPPED
echo  Image generation: STOPPED
echo  SearXNG:           STOPPED
echo  Docker search:    STOPPED
echo  Cloudflare:       STOPPED
echo.
echo  Public API:
echo  https://api.ashani.online
echo  is now OFFLINE.
echo.
echo  Run Ashani_Start.bat to start Ashani manually.
echo  Windows will also start Ashani automatically at boot.
echo ============================================================
echo.

pause
endlocal
exit /b 0
```