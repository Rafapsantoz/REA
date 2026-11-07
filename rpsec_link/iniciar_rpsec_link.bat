@echo off
cd /d "%~dp0"
if exist "C:\Users\Rafael\AppData\Local\hermes\hermes-agent\venv\Scripts\pythonw.exe" (
    start "" "C:\Users\Rafael\AppData\Local\hermes\hermes-agent\venv\Scripts\pythonw.exe" host_app.py
) else (
    start "" python host_app.py
)
exit
