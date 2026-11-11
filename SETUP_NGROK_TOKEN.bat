@echo off
echo ========================================
echo Setting up ngrok with your token
echo ========================================
echo.

echo First, download ngrok from: https://ngrok.com/download
echo Extract it to: C:\ngrok
echo.
echo Press any key once ngrok is installed...
pause

echo.
echo Configuring ngrok with your authtoken...
cd /d C:\ngrok
set /p "NGROK_AUTHTOKEN=Enter your ngrok authtoken: "
ngrok.exe config add-authtoken "%NGROK_AUTHTOKEN%"

echo.
echo ngrok configured successfully!
echo.
echo Starting ngrok tunnel...
echo.

ngrok.exe http 3000

pause
