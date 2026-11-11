@echo off
echo Checking environment...
echo.
echo Node.js:
where node
node --version
echo.
echo NPM:
where npm
npm --version
echo.
echo Current directory:
cd
echo.
echo Project directory exists:
if exist "C:\Projects\MyGuy\myguy" (
    echo YES - C:\Projects\MyGuy\myguy
) else (
    echo NO - C:\Projects\MyGuy\myguy
)
echo.
pause
