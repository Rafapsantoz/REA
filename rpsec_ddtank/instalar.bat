@echo off
setlocal
cd /d "%~dp0"

echo ========================================================
echo   RPsec DDTank Bot - Configuracao do Ambiente
echo   RPsecti Solucoes Inteligentes
echo ========================================================
echo.

set PYTHON_CMD=
python --version >nul 2>&1
if not errorlevel 1 (
    set PYTHON_CMD=python
    goto :PYTHON_FOUND
)

py --version >nul 2>&1
if not errorlevel 1 (
    set PYTHON_CMD=py
    goto :PYTHON_FOUND
)

echo [ERRO CRITICO] Python nao foi localizado no PATH do Windows!
echo.
echo Para corrigir:
echo 1. Baixe o instalador oficial em: https://www.python.org/downloads/
echo 2. Execute o instalador e MARQUE a caixinha: Add Python to PATH
echo 3. Abra este arquivo novamente apos concluir.
echo.
pause
exit /b 1

:PYTHON_FOUND
echo [*] Python detectado com sucesso: %PYTHON_CMD%
echo.

if not exist ".venv\Scripts\python.exe" (
    echo [*] Criando ambiente virtual dedicado .venv...
    %PYTHON_CMD% -m venv .venv
    if errorlevel 1 (
        echo [ERRO] Falha ao criar o diretorio .venv.
        pause
        exit /b 1
    )
    echo [*] Ambiente virtual criado com sucesso!
) else (
    echo [*] Ambiente virtual .venv ja existe.
)

echo [*] Instalando dependencias: mss, numpy, pillow...
.venv\Scripts\python.exe -m pip install --quiet --upgrade pip
.venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias via pip.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo [SUCESSO] Instalacao e verificacao concluidas com sucesso!
echo ========================================================
echo.
