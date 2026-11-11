@echo off
REM MyGuy Database Setup Script
REM This script helps you set up PostgreSQL for MyGuy

echo ========================================
echo MyGuy Database Setup
echo ========================================
echo.

REM Check if PostgreSQL is installed
if exist "C:\Program Files\PostgreSQL\18\bin\psql.exe" (
    echo PostgreSQL 18 found at C:\Program Files\PostgreSQL\18
    set PSQL_PATH=C:\Program Files\PostgreSQL\18\bin
) else if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" (
    echo PostgreSQL 16 found at C:\Program Files\PostgreSQL\16
    set PSQL_PATH=C:\Program Files\PostgreSQL\16\bin
) else if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" (
    echo PostgreSQL 15 found at C:\Program Files\PostgreSQL\15
    set PSQL_PATH=C:\Program Files\PostgreSQL\15\bin
) else (
    echo ERROR: PostgreSQL not found in standard locations
    echo Please install PostgreSQL from https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

echo.
echo Step 1: Creating database 'myguy'
echo.
echo You will be prompted for your PostgreSQL password (usually set during installation)
echo If you don't remember it, you can reset it or use pgAdmin
echo.

"%PSQL_PATH%\psql.exe" -U postgres -c "CREATE DATABASE myguy;"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS: Database 'myguy' created!
    echo.
) else (
    echo.
    echo ERROR: Failed to create database
    echo.
    echo Alternative method: Use pgAdmin
    echo 1. Open pgAdmin
    echo 2. Right-click on 'Databases' and select 'Create' -> 'Database'
    echo 3. Name it 'myguy' and click Save
    echo.
)

pause
