@echo off
title RPsec Task - Demand Organizer
cd /d "%~dp0"
echo ========================================================
echo   ⚡ RPsec Solucoes Inteligentes - RPsec Task
echo   Gestao de Tarefas & Demand Organizer (Momentum)
echo ========================================================
echo.
echo Abrindo navegador em http://localhost:5173 ...
timeout /t 2 /nobreak >nul
start http://localhost:5173
echo.
npm run dev
pause
