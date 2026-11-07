@echo off
title RPsec Link - Acesso Remoto Ultraleve
chcp 65001 >nul
cls

echo ========================================================
echo    ⚡ RPsec Solucoes Inteligentes - RPsec Link
echo ========================================================
echo.
echo Iniciando servidor de acesso remoto...
echo.

python server.py --port 8765 --pin 1234

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] O servidor foi encerrado inesperadamente.
    pause
)
