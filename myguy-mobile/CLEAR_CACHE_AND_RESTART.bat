@echo off
echo ========================================
echo Clearing Cache and Restarting
echo ========================================
echo.

cd /d C:\Projects\MyGuy\myguy-mobile

echo Clearing Metro bundler cache...
rmdir /s /q .expo 2>nul
rmdir /s /q node_modules\.cache 2>nul

echo Clearing watchman...
watchman watch-del-all 2>nul

echo Restarting Expo...
npx expo start --clear

echo.
echo ========================================
echo Cache cleared and Expo restarting
echo ========================================
echo.
pause
