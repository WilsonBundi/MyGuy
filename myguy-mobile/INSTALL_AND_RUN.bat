@echo off
echo Installing MyGuy Mobile App dependencies...
echo.
cd /d C:\Projects\MyGuy\myguy-mobile
echo Installing npm packages...
npm.cmd install
echo.
echo Starting Expo development server...
npm.cmd start
pause
