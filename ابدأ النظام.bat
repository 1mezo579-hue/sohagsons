@echo off
cd /d "%~dp0"
chcp 65001 >nul
title أبناء سوهاج - السوبر ماركت الذكي
color 0B

echo ==========================================
echo    Abnaa Sohag - Supermarket System
echo ==========================================
echo.
echo [1/2] جاري تجهيز السيرفر...
call npx prisma generate >nul 2>&1

echo [2/2] تشغيل نافذة النظام...
echo.
echo يرجى الانتظار، سيفتح البرنامج تلقائياً...
echo لا تغلق هذه النافذة السوداء أثناء العمل.

:: Wait 6 seconds for the server to boot up, then open Edge in App Mode
start "" cmd /c "timeout /t 6 /nobreak >nul && start msedge --app=http://localhost:3000 --window-size=1200,800"

:: Start Next.js server
call npx next dev -p 3000
