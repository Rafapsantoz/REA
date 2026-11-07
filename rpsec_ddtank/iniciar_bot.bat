@echo off
chcp 65001 > nul
echo ========================================================
echo   RPsec DDTank Bot - Automação Sky City (Castelo na Cidade)
echo   RPsecti Soluções Inteligentes
echo ========================================================
echo.

cd /d "%~dp0"

if not exist ".venv" (
    echo [AVISO] Ambiente virtual não encontrado. Executando instalação inicial...
    call instalar.bat
)

echo [*] Iniciando o bot com ambiente dedicado...
echo.
.venv\Scripts\python main.py
pause
