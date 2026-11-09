@echo off
title RPsec Task - Demand Organizer
cd /d "%~dp0"
echo ========================================================
echo   ⚡ RPsec Solucoes Inteligentes - RPsec Task
echo   Gestao de Demandas, Prioridades & Trello Inteligente
echo ========================================================
echo.

if not exist node_modules (
    echo [Instalando dependencias necessarias...]
    call npm install
)

echo Iniciando servidor Vite em http://localhost:5173 ...
start "" http://localhost:5173
call npm run dev -- --host 0.0.0.0 --port 5173
pause
