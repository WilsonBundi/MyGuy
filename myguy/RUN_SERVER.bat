@echo off
title MyGuy Development Server
color 0A
echo ========================================
echo   Starting MyGuy Development Server
echo ========================================
echo.
cd /d C:\Projects\MyGuy\myguy
echo Current Directory: %CD%
echo.
echo Checking for Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js found: 
node --version
echo.
echo Checking for npm...
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)
echo npm found:
npm --version
echo.
echo ========================================
echo   Starting server on http://localhost:3000
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.
npm run dev
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo   Server failed to start
    echo ========================================
    echo.
    pause
)
