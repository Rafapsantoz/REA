@echo off
chcp 65001 > nul
title Manoel Jeronimo Imoveis — BI RPsecti
cls

echo ======================================================================
echo    MANOEL JERONIMO IMOVEIS - PLATAFORMA DE INTELIGENCIA E BI (RPSECTI)
echo ======================================================================
echo.
echo [1/2] Acessando pasta do projeto rpsec_imobi...
cd /d "%~dp0rpsec_imobi"

echo [2/2] Abrindo navegador e iniciando servidor local...
start http://localhost:5173

echo.
echo ======================================================================
echo    Painel iniciado em: http://localhost:5173
echo    Pressione Ctrl+C para fechar quando terminar a apresentacao.
echo ======================================================================
echo.

call npm run dev
pause
