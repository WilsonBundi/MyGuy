@echo off
REM MyGuy Environment Setup Script
REM This script helps you set up the .env file

echo ========================================
echo MyGuy Environment Setup
echo ========================================
echo.

REM Check if .env exists
if exist .env (
    echo .env file already exists.
    echo.
    set /p OVERWRITE="Do you want to overwrite it? (y/n): "
    if /i not "%OVERWRITE%"=="y" (
        echo Setup cancelled.
        pause
        exit /b 0
    )
)

echo.
echo Please enter your PostgreSQL connection details:
echo.

set /p DB_USER="PostgreSQL username (usually 'postgres'): "
set /p DB_PASSWORD="PostgreSQL password: "
set /p DB_HOST="Host (usually 'localhost'): "
set /p DB_PORT="Port (usually '5432'): "

echo.
echo Generating NEXTAUTH_SECRET...
echo.

REM Generate secret using Node.js
for /f "delims=" %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"') do set SECRET=%%i

echo.
echo Creating .env file...
echo.

(
echo # Database
echo DATABASE_URL="postgresql://%DB_USER%:%DB_PASSWORD%@%DB_HOST%:%DB_PORT%/myguy?schema=public"
echo.
echo # NextAuth
echo NEXTAUTH_URL="http://localhost:3000"
echo NEXTAUTH_SECRET="%SECRET%"
echo.
echo # App
echo NEXT_PUBLIC_APP_URL="http://localhost:3000"
) > .env

echo.
echo SUCCESS: .env file created!
echo.
echo Your DATABASE_URL is:
echo postgresql://%DB_USER%:***@%DB_HOST%:%DB_PORT%/myguy?schema=public
echo.
echo Next steps:
echo 1. Run: npx prisma migrate dev --name init
echo 2. Run: npx prisma generate
echo 3. Run: npm run dev
echo.

pause
