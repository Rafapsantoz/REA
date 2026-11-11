@echo off
chcp 65001 > nul
cd /d "%~dp0"

:: Auto-recuperação: Se .venv não existir, instala automaticamente
if not exist ".venv\Scripts\python.exe" (
    echo [*] Ambiente virtual .venv não encontrado. Configurando automaticamente...
    call instalar.bat
    if errorlevel 1 (
        echo [ERRO] Não foi possível iniciar o ambiente.
        pause
        exit /b 1
    )
)

echo [*] Executando teste da rotina de suicídio das 3 fakes...
.venv\Scripts\python.exe main.py --test-suicide
pause
