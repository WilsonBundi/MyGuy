@echo off
cd /d C:\Projects\MyGuy\myguy-mobile
echo Installing downgraded packages with legacy peer deps...
npm.cmd install --legacy-peer-deps
pause
