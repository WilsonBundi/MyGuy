@echo off
echo Upgrading MyGuy Mobile to SDK 57...
echo.
cd /d C:\Projects\MyGuy\myguy-mobile
echo Installing updated packages...
npm.cmd install
echo.
echo Installation complete. Starting Expo server...
npm.cmd start
pause
