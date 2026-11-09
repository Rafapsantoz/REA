@echo off
cd /d "%~dp0"
if exist "C:\Users\Rafael\AppData\Local\hermes\hermes-agent\venv\Scripts\pythonw.exe" (
    start "" "C:\Users\Rafael\AppData\Local\hermes\hermes-agent\venv\Scripts\pythonw.exe" client_app.py
) else (
    start "" python client_app.py
)
exit
