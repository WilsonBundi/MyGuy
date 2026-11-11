@echo off
echo Starting MyGuy Mobile App...
echo.
cd /d C:\Projects\MyGuy\myguy-mobile
echo Open the QR code with the installed MyGuy development build, not Expo Go.
echo.
npm.cmd start -- --clear --lan --port 8081
pause
