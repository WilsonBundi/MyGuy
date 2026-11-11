@echo off
cd /d C:\Projects\MyGuy\myguy-mobile
echo Fixing React Native version and reinstalling...
npm.cmd install
echo.
echo Starting Expo server...
npm.cmd start
pause
