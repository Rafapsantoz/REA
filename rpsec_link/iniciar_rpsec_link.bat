@echo off
title RPsec Link — Host Agent
chcp 65001 >nul
cls

echo ========================================================
echo    ⚡ RPsec Solucoes Inteligentes - RPsec Link Host
echo ========================================================
echo.
echo Iniciando Agente Host com Interface Grafica...
echo.

python host_app.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Tentando iniciar em modo terminal...
    python server.py --port 8765 --pin 1234
    pause
)
