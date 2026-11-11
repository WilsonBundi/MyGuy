@echo off
echo ========================================
echo Starting MyGuy Mobile App
echo ========================================
echo.

echo Checking if port 8081 is in use...
netstat -ano | findstr :8081 >nul
if %errorlevel% equ 0 (
    echo Port 8081 is already in use. Killing existing process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081') do taskkill /F /PID %%a
    timeout /t 2 >nul
)

echo.
echo Starting Expo development server for the MyGuy development build...
cd /d C:\Projects\MyGuy\myguy-mobile
npm start -- --clear --lan --port 8081

echo.
echo Expo server is starting...
echo Please wait 10-15 seconds for it to fully start...
echo.
echo The QR code will appear below.
echo.
echo Open it with the installed MyGuy development build, not Expo Go.
echo.
echo Or visit http://localhost:8081 in your browser.
echo.
