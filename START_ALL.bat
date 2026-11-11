@echo off
echo ========================================
echo Starting MyGuy Backend and Mobile App
echo ========================================
echo.

echo [1/3] Starting Backend...
start "MyGuy Backend" cmd /k "cd /d C:\Projects\MyGuy\myguy && npm run dev"
echo Backend starting in new window...
timeout /t 3 /nobreak >nul

echo [2/3] Starting ngrok...
start "ngrok" cmd /k "ngrok http 3000"
echo ngrok starting in new window...
timeout /t 3 /nobreak >nul

echo [3/3] Starting Mobile App...
start "MyGuy Mobile" cmd /k "cd /d C:\Projects\MyGuy\myguy-mobile && npm start -- --clear --lan --port 8081"
echo Mobile app starting in new window...

echo.
echo ========================================
echo All services starting...
echo ========================================
echo.
echo Backend: http://localhost:3000
echo Mobile: http://localhost:8081
echo.
echo Open the QR code with the installed MyGuy development build, not Expo Go.
echo.
echo Press any key to close this window (services will continue running)...
pause
