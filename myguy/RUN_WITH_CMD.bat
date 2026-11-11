@echo off
REM This batch file uses cmd.exe to bypass PowerShell script restrictions
cd /d C:\Projects\MyGuy\myguy
cmd.exe /c "npm run dev"
pause
