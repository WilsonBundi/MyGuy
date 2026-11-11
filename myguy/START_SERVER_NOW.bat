@echo off
cls
echo ========================================
echo   MYGUY DEVELOPMENT SERVER
echo ========================================
echo.
echo Location: C:\Projects\MyGuy\myguy
echo Target: http://localhost:3000
echo.
echo Starting server...
echo.

cd /d C:\Projects\MyGuy\myguy

:: Kill any process on port 3000
echo Checking port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Killing process %%a on port 3000
    taskkill /F /PID %%a >nul 2>&1
)

:: Start the server
echo.
echo Running: npm run dev
echo.
echo ========================================
echo   Server starting...
echo   Open: http://localhost:3000
echo ========================================
echo.
echo Press Ctrl+C to stop
echo.

npm run dev

pause
