@echo off
REM This batch file bypasses PowerShell script restrictions
cd /d C:\Projects\MyGuy\myguy
powershell -Command "Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; npm run dev"
pause
