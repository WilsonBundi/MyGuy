@echo off
REM MyGuy Complete Setup Script
REM This script sets up everything needed to run MyGuy

echo ========================================
echo MyGuy Complete Setup
echo ========================================
echo.

REM Step 1: Create database
echo Step 1: Creating database 'myguy'...
echo.
echo You will be prompted for your PostgreSQL password.
echo If you don't remember it, use pgAdmin to create the database manually.
echo.

if exist "C:\Program Files\PostgreSQL\18\bin\psql.exe" (
    set PSQL_PATH=C:\Program Files\PostgreSQL\18\bin
) else if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" (
    set PSQL_PATH=C:\Program Files\PostgreSQL\16\bin
) else (
    echo ERROR: PostgreSQL not found
    pause
    exit /b 1
)

"%PSQL_PATH%\psql.exe" -U postgres -c "CREATE DATABASE myguy;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Database created successfully!
) else (
    echo Database may already exist or password was incorrect.
    echo Continuing anyway...
)

echo.
echo Step 2: Setting up environment variables...
echo.

set /p DB_USER="PostgreSQL username (usually 'postgres'): "
set /p DB_PASSWORD="PostgreSQL password: "

REM Generate secret
for /f "delims=" %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"') do set SECRET=%%i

REM Create .env file
(
echo # Database
echo DATABASE_URL="postgresql://%DB_USER%:%DB_PASSWORD%@localhost:5432/myguy?schema=public"
echo.
echo # NextAuth
echo NEXTAUTH_URL="http://localhost:3000"
echo NEXTAUTH_SECRET="%SECRET%"
echo.
echo # App
echo NEXT_PUBLIC_APP_URL="http://localhost:3000"
) > .env

echo .env file created!

echo.
echo Step 3: Running Prisma migrations...
echo.
npx prisma migrate dev --name init

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Migration failed. Check your DATABASE_URL in .env
    pause
    exit /b 1
)

echo.
echo Step 4: Generating Prisma client...
echo.
npx prisma generate

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Prisma generate failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo SETUP COMPLETE!
echo ========================================
echo.
echo To start MyGuy, run:
echo   npm run dev
echo.
echo Then open: http://localhost:3000
echo.
echo To view your database:
echo   npx prisma studio
echo.

pause
