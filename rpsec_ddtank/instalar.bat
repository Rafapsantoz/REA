@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo ========================================================
echo   RPsec DDTank Bot - Configuração do Ambiente
echo   RPsecti Soluções Inteligentes
echo ========================================================
echo.

:: 1. Detecta Python no sistema (testa 'python' e depois 'py')
set PYTHON_CMD=
python --version >nul 2>&1
if not errorlevel 1 (
    set PYTHON_CMD=python
) else (
    py --version >nul 2>&1
    if not errorlevel 1 (
        set PYTHON_CMD=py
    )
)

if "%PYTHON_CMD%"=="" (
    echo [ERRO CRÍTICO] Python não foi localizado no PATH do Windows!
    echo.
    echo Para corrigir:
    echo 1. Baixe o instalador oficial em: https://www.python.org/downloads/
    echo 2. Execute o instalador e marque a caixinha: "Add Python to PATH"
    echo 3. Abra este arquivo novamente após concluir.
    echo.
    pause
    exit /b 1
)

echo [*] Python detectado com sucesso (%PYTHON_CMD%).

:: 2. Criação do Ambiente Virtual Isolado
if not exist ".venv\Scripts\python.exe" (
    echo [*] Criando ambiente virtual dedicado (.venv)...
    %PYTHON_CMD% -m venv .venv
    if errorlevel 1 (
        echo [ERRO] Falha ao criar o diretório .venv.
        pause
        exit /b 1
    )
) else (
    echo [*] Ambiente virtual .venv já existente.
)

:: 3. Instalação de dependências essenciais
echo [*] Instalando/atualizando dependências (mss, numpy, pillow)...
.venv\Scripts\python.exe -m pip install --quiet --upgrade pip
.venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 (
    echo [ERRO] Falha ao baixar as bibliotecas via pip.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo [SUCESSO] Instalação e verificação concluídas com sucesso!
echo ========================================================
echo.
