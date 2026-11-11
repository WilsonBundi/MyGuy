@echo off
echo ========================================
echo MyGuy App Launcher
echo ========================================
echo.
echo Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js found
node --version
echo.
echo Checking npm...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)
echo npm found
npm --version
echo.
echo Checking if port 3000 is in use...
netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo Port 3000 is already in use. Killing process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    echo Port 3000 cleared
)
echo.
echo Starting development server...
echo.
cd /d C:\Projects\MyGuy\myguy
npm run dev
pause
