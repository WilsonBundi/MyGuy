@echo off
echo Running Prisma migration to add isOnline and lastActiveAt columns...
cd /d C:\Projects\MyGuy\myguy
npx.cmd prisma migrate dev --name add-online-status
pause
