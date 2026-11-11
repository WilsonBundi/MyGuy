@echo off
echo Stopping any running Next.js servers...
taskkill /F /IM node.exe 2>nul

echo Starting MyGuy web backend...
cd /d C:\Projects\MyGuy\myguy
npm run dev

pause
