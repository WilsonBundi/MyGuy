@echo off
echo ========================================
echo Setting up ngrok for MyGuy Mobile App
echo ========================================
echo.
echo Step 1: Create ngrok account
echo Visit: https://ngrok.com/signup
echo.
echo Step 2: Get your authtoken
echo Visit: https://dashboard.ngrok.com/get-started/your-authtoken
echo.
echo Step 3: Install ngrok
echo Download from: https://ngrok.com/download
echo.
echo Step 4: Authenticate ngrok
echo Run: ngrok config add-authtoken YOUR_TOKEN
echo.
echo Step 5: Start ngrok tunnel
echo Run: ngrok http 3000
echo.
echo Step 6: Copy the HTTPS URL from ngrok
echo It will look like: https://xxxx-xx-xx-xx-xx.ngrok-free.app
echo.
echo Step 7: Update mobile app API URL
echo I will update it once you have the ngrok URL
echo.
pause
