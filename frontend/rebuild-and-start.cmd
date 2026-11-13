@echo off
title Dream Shop (Demo 4) - build and start
cd /d "%~dp0"
echo.
echo  Dream Shop (Demo 4): new build
echo  ------------------------------
echo  [1/4] Stopping the old shop server on port 3000 ...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":3000 .*LISTENING"') do taskkill /F /PID %%p >nul 2>&1
echo  [2/4] Moving app\(store)\loading.js to E:\Demo 4\_removed (it held the home page back) ...
if exist "app\(store)\loading.js" mkdir "..\_removed" 2>nul
if exist "app\(store)\loading.js" move /Y "app\(store)\loading.js" "..\_removed\store-loading.js" >nul
echo  [3/4] Building - this takes 1-3 minutes, please wait ...
call npm run build > build.log 2>&1
if errorlevel 1 goto failed
echo  [4/4] Build OK. The shop is starting on http://localhost:3000
echo        Keep this window open (closing it stops the shop).
npm start > start.log 2>&1
goto end
:failed
echo.
echo  BUILD FAILED. The details are in build.log:
type build.log
pause
:end
