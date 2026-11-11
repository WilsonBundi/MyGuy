@echo off
cd /d C:\Projects\MyGuy\myguy
npx prisma migrate dev --name add-phone-unique
pause
