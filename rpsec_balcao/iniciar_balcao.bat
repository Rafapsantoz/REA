@echo off
title RPsec Balcao - SalgadoFacil
cd /d "%~dp0"

echo ========================================================
echo   RPsec Balcao - SalgadoFacil
echo   Iniciando versao ultra-leve para balcao...
echo ========================================================
echo.

:: 1. Tenta localizar o Node.js no PATH ou nas pastas padrao de instalacao
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    if exist "%ProgramFiles%\nodejs\node.exe" (
        set "PATH=%ProgramFiles%\nodejs;%PATH%"
    ) else if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
        set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
    ) else if exist "%LOCALAPPDATA%\Programs\node\node.exe" (
        set "PATH=%LOCALAPPDATA%\Programs\node;%PATH%"
    )
)

:: Verifica novamente o Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERRO] O Node.js nao foi localizado neste computador.
    echo.
    echo Se voce acabou de instalar o Node.js, reinicie o computador
    echo ou feche e abra novamente a pasta para atualizar o Windows.
    echo.
    echo Download do Node.js LTS: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Se a pasta dist nao existir (primeira instalacao sem pre-compilado)
if not exist "dist\index.html" (
    echo [AVISO] Pasta dist nao encontrada. Preparando o sistema...
    if not exist "node_modules" (
        echo [1/2] Baixando dependencias necessarias (npm install)...
        call npm install
        if %ERRORLEVEL% neq 0 (
            echo [ERRO] Falha ao instalar dependencias com npm install.
            pause
            exit /b 1
        )
    )
    echo [2/2] Compilando versao final de producao (npm run build)...
    call npm run build
    if %ERRORLEVEL% neq 0 (
        echo [ERRO] Falha ao compilar o sistema com npm run build.
        pause
        exit /b 1
    )
)

:: 3. Abre no navegador em Modo Aplicativo (sem abas, tela limpa para o balcao)
echo Abrindo o balcao em tela limpa...

set BROWSER_OPENED=0

:: Testa Microsoft Edge
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:5173
    set BROWSER_OPENED=1
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:5173
    set BROWSER_OPENED=1
)

:: Testa Google Chrome se o Edge nao foi aberto
if %BROWSER_OPENED% equ 0 (
    if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
        start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=http://localhost:5173
        set BROWSER_OPENED=1
    ) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
        start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app=http://localhost:5173
        set BROWSER_OPENED=1
    ) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
        start "" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" --app=http://localhost:5173
        set BROWSER_OPENED=1
    )
)

:: Se nenhum navegador especifico foi achado no caminho padrao, abre o padrao do sistema
if %BROWSER_OPENED% equ 0 (
    start http://localhost:5173
)

:: 4. Inicia o servidor leve (~15MB de RAM, carregamento instantaneo)
echo.
echo ========================================================
echo   Caixa Aberto com Sucesso!
echo   Mantenha esta janela minimizada durante o expediente.
echo ========================================================
echo.
node server.js
if %ERRORLEVEL% neq 0 (
    echo.
    echo [AVISO] O servidor foi encerrado com codigo %ERRORLEVEL%.
    pause
)
