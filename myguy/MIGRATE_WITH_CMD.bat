@echo off
cd /d C:\Projects\MyGuy\myguy
npx.cmd prisma migrate dev --name add-phone-unique
pause
