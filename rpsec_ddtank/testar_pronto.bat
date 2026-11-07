@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo [*] Executando teste de cliques 'Pronto' nas 3 fakes...
.venv\Scripts\python main.py --test-ready
pause
