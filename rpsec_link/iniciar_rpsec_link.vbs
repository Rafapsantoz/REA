Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
pythonwPath = "C:\Users\Rafael\AppData\Local\hermes\hermes-agent\venv\Scripts\pythonw.exe"

If fso.FileExists(pythonwPath) Then
    WshShell.CurrentDirectory = scriptDir
    WshShell.Run """" & pythonwPath & """ host_app.py", 0, False
Else
    WshShell.CurrentDirectory = scriptDir
    WshShell.Run "python host_app.py", 0, False
End If
