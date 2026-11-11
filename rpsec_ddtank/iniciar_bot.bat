@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo [*] Ambiente virtual .venv nao encontrado.
    echo [*] Configurando ambiente automaticamente pela primeira vez...
    call instalar.bat
    if errorlevel 1 (
        echo [ERRO] Nao foi possivel iniciar o ambiente.
        pause
        exit /b 1
    )
)

echo [*] Abrindo Painel de Controle RPsec DDTank...
.venv\Scripts\python.exe main.py
if errorlevel 1 (
    echo.
    echo [AVISO] O processo encerrou com codigo de erro.
    pause
)
