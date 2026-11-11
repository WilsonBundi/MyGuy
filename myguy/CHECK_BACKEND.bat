@echo off
echo Checking if backend is running...
curl http://localhost:3000/api/auth/signup -X POST -H "Content-Type: application/json" -d "{\"test\":\"test\"}" 2>nul
if %errorlevel% equ 0 (
    echo Backend is running!
) else (
    echo Backend is NOT running or not accessible.
    echo Please start the backend with: npm run dev
)
pause
