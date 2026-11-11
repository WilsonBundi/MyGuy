@echo off
echo ========================================
echo Building MyGuy Development Build
echo ========================================
echo.
echo This will build an Android APK with all native modules
echo including WebRTC for live streaming.
echo.
echo The build process takes 10-20 minutes.
echo You will receive a download link when complete.
echo.
pause

cd /d C:\Projects\MyGuy\myguy-mobile

echo Installing EAS CLI...
call npm install -g eas-cli

echo Configuring EAS...
call eas build:configure

echo Starting development build...
call eas build --platform android --profile development

echo.
echo ========================================
echo Build complete!
echo ========================================
echo.
echo Check your email for the download link.
echo Install the APK on your Android device.
echo.
pause
