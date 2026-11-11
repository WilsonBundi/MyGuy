@echo off
echo ========================================
echo Start ngrok Tunnel for MyGuy
echo ========================================
echo.

echo Please enter the full path to ngrok.exe
echo Example: C:\Users\bundi\Downloads\ngrok-v3-stable-windows-amd64\ngrok.exe
echo.

set /p NGROK_PATH="Enter ngrok.exe path: "

if not exist "%NGROK_PATH%" (
    echo ERROR: ngrok.exe not found at that path
    pause
    exit /b
)

echo.
echo Found ngrok at: %NGROK_PATH%
echo.

set /p "NGROK_AUTHTOKEN=Enter your ngrok authtoken: "
"%NGROK_PATH%" config add-authtoken "%NGROK_AUTHTOKEN%"

echo.
echo ngrok configured successfully!
echo.
echo Starting ngrok tunnel on port 3000...
echo.

echo Copy the HTTPS URL (starts with https://) and share it with me
echo.

"%NGROK_PATH%" http 3000

pause
