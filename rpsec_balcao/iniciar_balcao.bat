@echo off
title RPsec Balcao - SalgadoFacil
cd /d "%~dp0"

echo ========================================================
echo   RPsec Balcao - SalgadoFacil
echo   Iniciando versao ultra-leve para balcao...
echo ========================================================
echo.

:: 1. Localizacao do Node.js
where node >nul 2>nul
if %ERRORLEVEL% equ 0 goto node_ok

if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
if exist "%LOCALAPPDATA%\Programs\node\node.exe" set "PATH=%LOCALAPPDATA%\Programs\node;%PATH%"

where node >nul 2>nul
if %ERRORLEVEL% equ 0 goto node_ok

echo [ERRO] O Node.js nao foi localizado neste computador.
echo.
echo Por favor, instale o Node.js LTS (https://nodejs.org/)
echo e reinicie o computador.
echo.
pause
exit /b 1

:node_ok
echo [OK] Node.js detectado com sucesso.

:: 2. Verifica se a pasta dist existe
if exist "dist\index.html" goto dist_ok

echo [AVISO] Pasta dist nao encontrada. Compilando o sistema...
if not exist "node_modules" call npm install
call npm run build

:dist_ok
echo [OK] Arquivos do balcao prontos.

:: 3. Abertura do Navegador
echo Abrindo navegador...

if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:5173 & goto server_start
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:5173 & goto server_start
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=http://localhost:5173 & goto server_start
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app=http://localhost:5173 & goto server_start
if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" start "" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" --app=http://localhost:5173 & goto server_start

start http://localhost:5173

:server_start
echo.
echo ========================================================
echo   Caixa Pronto!
echo   Mantenha esta janela minimizada durante o expediente.
echo ========================================================
echo.
node server.js
if %ERRORLEVEL% neq 0 (
    echo.
    echo [AVISO] O servidor parou com codigo %ERRORLEVEL%.
    pause
)
