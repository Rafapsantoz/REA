Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

venvPythonw = "C:\Users\Rafael\AppData\Local\hermes\hermes-agent\venv\Scripts\pythonw.exe"
Set fso = CreateObject("Scripting.FileSystemObject")

If fso.FileExists(venvPythonw) Then
    WshShell.Run """" & venvPythonw & """ client_app.py", 0, False
Else
    WshShell.Run "pythonw client_app.py", 0, False
End If
