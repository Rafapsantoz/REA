@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo [*] Executando teste da rotina de suicídio das 3 fakes...
.venv\Scripts\python main.py --test-suicide
pause
