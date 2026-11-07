@echo off
title RPsec Balcao - SalgadoFacil
cd /d "%~dp0"
echo ========================================================
echo   Iniciando RPsec Balcao (SalgadoFacil)...
echo ========================================================
echo.
echo Abrindo navegador em http://localhost:5173 ...
timeout /t 2 /nobreak >nul
start http://localhost:5173
echo.
npm run dev
pause
