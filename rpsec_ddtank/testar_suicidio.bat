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

echo [*] Executando teste da rotina de suicidio das 3 fakes...
.venv\Scripts\python.exe main.py --test-suicide
pause
