@echo off
chcp 65001 > nul
echo ========================================================
echo   RPsec DDTank Bot - Instalação de Dependências
echo   RPsecti Soluções Inteligentes
echo ========================================================
echo.

cd /d "%~dp0"

if not exist ".venv" (
    echo [*] Criando ambiente virtual isolado (.venv)...
    python -m venv .venv
    if errorlevel 1 (
        echo [ERRO] Python não foi encontrado no PATH do sistema.
        echo Por favor, instale o Python 3.10 ou superior e marque 'Add Python to PATH'.
        pause
        exit /b 1
    )
)

echo [*] Instalando dependências (mss, numpy, pillow)...
.venv\Scripts\pip install -r requirements.txt
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependências.
    pause
    exit /b 1
)

echo.
echo [SUCESSO] Instalação concluída com sucesso!
echo Para rodar o bot, dê dois cliques em 'iniciar_bot.bat'.
echo.
pause
