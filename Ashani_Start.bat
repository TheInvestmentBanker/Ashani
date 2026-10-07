```bat
@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ============================================================
REM                    ASHANI AI STARTUP
REM
REM Starts:
REM   1. Cloudflare Tunnel service
REM   2. SearXNG / Docker
REM   3. Ollama
REM   4. ComfyUI
REM   5. Ashani Backend
REM
REM ComfyUI is started directly.
REM The ComfyUI browser is NOT opened.
REM ============================================================

if "%ASHANI_MINIMIZED%" NEQ "1" (
    set "ASHANI_MINIMIZED=1"
    start "" /min cmd /c ""%~f0""
    exit /b
)

title Ashani AI - Start

set "PROJECT_ROOT=%~dp0"
set "BACKEND_DIR=%PROJECT_ROOT%backend"
set "SEARCH_DIR=%PROJECT_ROOT%search\searxng"

set "COMFYUI_DIR=C:\Users\RG\AI\ComfyUI"
set "COMFYUI_PYTHON=C:\Users\RG\AI\ComfyUI\venv\Scripts\python.exe"

set "OLLAMA_EXE=C:\Users\RG\AppData\Local\Programs\Ollama\ollama.exe"

set "CLOUDFLARE_SERVICE=cloudflared"

set "API_PORT=5000"
set "OLLAMA_PORT=11434"
set "COMFYUI_PORT=8188"
set "SEARXNG_PORT=8080"


echo.
echo ============================================================
echo                 ASHANI AI - STARTING
echo ============================================================
echo.


REM ============================================================
REM 1. CLOUDFLARE TUNNEL
REM ============================================================

echo [1/5] Checking Cloudflare Tunnel...

sc query "%CLOUDFLARE_SERVICE%" | findstr /I "RUNNING" >nul

if not errorlevel 1 (

    echo [ OK ] Cloudflare Tunnel is already running.

) else (

    echo [INFO] Cloudflare Tunnel is not running.
    echo [INFO] Starting Cloudflare service...

    net start "%CLOUDFLARE_SERVICE%" >nul 2>&1

    timeout /t 2 /nobreak >nul

    sc query "%CLOUDFLARE_SERVICE%" | findstr /I "RUNNING" >nul

    if errorlevel 1 goto CLOUDFLARE_FAILED

    echo [ OK ] Cloudflare Tunnel started.

)

echo.


REM ============================================================
REM 2. SEARXNG / DOCKER
REM ============================================================

echo [2/5] Checking SearXNG...

curl.exe -s "http://localhost:%SEARXNG_PORT%/search?q=test&format=json" >nul 2>&1

if not errorlevel 1 (

    echo [ OK ] SearXNG is already running.
    goto CHECK_OLLAMA

)

echo [INFO] SearXNG is not running.
echo [INFO] Starting Docker Compose...

if not exist "%SEARCH_DIR%\docker-compose.yml" goto SEARXNG_FAILED

cd /d "%SEARCH_DIR%"

docker compose up -d

if errorlevel 1 goto SEARXNG_FAILED

echo [INFO] Waiting for SearXNG...

set /a SEARXNG_WAIT=0


:WAIT_SEARXNG

timeout /t 1 /nobreak >nul

curl.exe -s "http://localhost:%SEARXNG_PORT%/search?q=test&format=json" >nul 2>&1

if not errorlevel 1 goto SEARXNG_READY

set /a SEARXNG_WAIT+=1

if %SEARXNG_WAIT% GEQ 30 goto SEARXNG_FAILED

goto WAIT_SEARXNG


:SEARXNG_READY

echo [ OK ] SearXNG is running.
echo.


REM ============================================================
REM 3. OLLAMA
REM ============================================================

:CHECK_OLLAMA

echo [3/5] Checking Ollama...

curl.exe -s http://localhost:%OLLAMA_PORT%/api/tags >nul 2>&1

if not errorlevel 1 (

    echo [ OK ] Ollama is already running.
    goto CHECK_COMFYUI

)

echo [INFO] Ollama is not running.
echo [INFO] Starting Ollama...

start "" /min "%OLLAMA_EXE%" serve

echo [INFO] Waiting for Ollama...

set /a OLLAMA_WAIT=0


:WAIT_OLLAMA

timeout /t 1 /nobreak >nul

curl.exe -s http://localhost:%OLLAMA_PORT%/api/tags >nul 2>&1

if not errorlevel 1 goto OLLAMA_READY

set /a OLLAMA_WAIT+=1

if %OLLAMA_WAIT% GEQ 30 goto OLLAMA_FAILED

goto WAIT_OLLAMA


:OLLAMA_READY

echo [ OK ] Ollama is running.
echo.


REM ============================================================
REM 4. COMFYUI
REM ============================================================

:CHECK_COMFYUI

echo [4/5] Checking ComfyUI...

curl.exe -s http://localhost:%COMFYUI_PORT%/system_stats >nul 2>&1

if not errorlevel 1 (

    echo [ OK ] ComfyUI is already running.
    goto CHECK_BACKEND

)

echo [INFO] ComfyUI is not running.
echo [INFO] Starting ComfyUI in background...
echo [INFO] Browser will NOT be opened.

if not exist "%COMFYUI_PYTHON%" goto COMFYUI_FAILED

start "Ashani ComfyUI" /min cmd /c "cd /d %COMFYUI_DIR% && %COMFYUI_PYTHON% main.py --listen 127.0.0.1 --port %COMFYUI_PORT%"

echo [INFO] Waiting for ComfyUI...

set /a COMFYUI_WAIT=0


:WAIT_COMFYUI

timeout /t 1 /nobreak >nul

curl.exe -s http://localhost:%COMFYUI_PORT%/system_stats >nul 2>&1

if not errorlevel 1 goto COMFYUI_READY

set /a COMFYUI_WAIT+=1

if %COMFYUI_WAIT% GEQ 90 goto COMFYUI_FAILED

goto WAIT_COMFYUI


:COMFYUI_READY

echo [ OK ] ComfyUI is running.
echo.


REM ============================================================
REM 5. ASHANI BACKEND
REM ============================================================

:CHECK_BACKEND

echo [5/5] Checking Ashani Backend...

curl.exe -s http://localhost:%API_PORT%/api/health >nul 2>&1

if not errorlevel 1 (

    echo [ OK ] Ashani backend is already running.
    goto ONLINE

)

echo [INFO] Ashani backend is not running.
echo [INFO] Starting npm run dev...

if not exist "%BACKEND_DIR%" goto BACKEND_FAILED

start "Ashani Backend" /min cmd /k "cd /d "%BACKEND_DIR%" && npm run dev"

echo [INFO] Waiting for Ashani backend...

set /a BACKEND_WAIT=0


:WAIT_BACKEND

timeout /t 1 /nobreak >nul

curl.exe -s http://localhost:%API_PORT%/api/health >nul 2>&1

if not errorlevel 1 goto BACKEND_READY

set /a BACKEND_WAIT+=1

if %BACKEND_WAIT% GEQ 30 goto BACKEND_FAILED

goto WAIT_BACKEND


:BACKEND_READY

echo [ OK ] Ashani backend is running.
goto ONLINE


REM ============================================================
REM ERROR STATES
REM ============================================================

:CLOUDFLARE_FAILED

echo.
echo ============================================================
echo [ERROR] CLOUDFLARE TUNNEL FAILED TO START
echo ============================================================
echo.
echo Check Windows Services for:
echo cloudflared
echo.
pause
exit /b 1


:SEARXNG_FAILED

echo.
echo ============================================================
echo [ERROR] SEARXNG FAILED TO START
echo ============================================================
echo.
echo Check Docker Desktop.
echo.
echo Expected directory:
echo %SEARCH_DIR%
echo.
echo Try:
echo cd /d "%SEARCH_DIR%"
echo docker compose ps
echo.
pause
exit /b 1


:OLLAMA_FAILED

echo.
echo ============================================================
echo [ERROR] OLLAMA FAILED TO START
echo ============================================================
echo.
echo Try:
echo ollama list
echo.
pause
exit /b 1


:COMFYUI_FAILED

echo.
echo ============================================================
echo [ERROR] COMFYUI FAILED TO START
echo ============================================================
echo.
echo Check the ComfyUI process/window.
echo.
echo Try manually:
echo cd /d "%COMFYUI_DIR%"
echo "%COMFYUI_PYTHON%" main.py --listen 127.0.0.1 --port 8188
echo.
pause
exit /b 1


:BACKEND_FAILED

echo.
echo ============================================================
echo [ERROR] ASHANI BACKEND FAILED TO START
echo ============================================================
echo.
echo Check the Ashani Backend window.
echo.
echo Try manually:
echo cd /d "%BACKEND_DIR%"
echo npm run dev
echo.
pause
exit /b 1


REM ============================================================
REM ONLINE
REM ============================================================

:ONLINE

echo.
echo ============================================================
echo                  ASHANI AI IS ONLINE
echo ============================================================
echo.
echo Local Backend:
echo http://localhost:5000
echo.
echo Public API:
echo https://api.ashani.online
echo.
echo SearXNG:
echo http://localhost:8080
echo.
echo Ollama:
echo http://localhost:11434
echo.
echo ComfyUI:
echo http://localhost:8188
echo.
echo Cloudflare:
echo RUNNING
echo.
echo ============================================================
echo.
echo Ashani startup completed successfully.
echo.
echo You may close this window.
echo ============================================================
echo.

pause
exit /b 0
```