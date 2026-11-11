@echo off
cd /d C:\Projects\MyGuy\myguy-mobile
echo Deleting node_modules...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
echo.
echo Reinstalling with stable versions...
npm.cmd install --legacy-peer-deps
pause
