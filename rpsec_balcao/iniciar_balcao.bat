@echo off
title RPsec Balcao - SalgadoFacil
cd /d "%~dp0"

echo ========================================================
echo   RPsec Balcao - SalgadoFacil
echo   Iniciando versao ultra-leve para balcao...
echo ========================================================
echo.

:: 1. Verifica se o Node.js esta instalado no computador
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERRO] O Node.js nao foi encontrado neste computador!
    echo.
    echo Para rodar o RPsec Balcao, instale o Node.js LTS (gratuito):
    echo 1. Baixe o instalador em: https://nodejs.org/
    echo 2. Instale clicando em 'Next' ate concluir.
    echo 3. Depois, execute este arquivo novamente.
    echo.
    pause
    exit /b 1
)

:: 2. Se a pasta dist nao existir, gera a versao compilada
if not exist "dist" (
    echo [AVISO] Primeira execucao detectada. Compilando o sistema...
    call npm run build
)

:: 3. Abre no navegador em Modo Aplicativo (sem abas, sem barra de endereco)
echo Abrindo o balcao em tela limpa...
start "" msedge --app=http://localhost:5173 2>nul || start "" chrome --app=http://localhost:5173 2>nul || start http://localhost:5173

:: 4. Inicia o servidor leve (~15MB de RAM, carregamento instantaneo)
echo.
echo ========================================================
echo   Caixa Pronto!
echo   Mantenha esta janela minimizada durante o expediente.
echo ========================================================
echo.
node server.js
pause
