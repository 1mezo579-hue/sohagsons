@echo off
chcp 65001 >nul
title تشغيل النظام - ماركت أبناء سوهاج
cd /d "%~dp0"
echo جاري تشغيل النظام...
start "" "http://localhost:3000"
npx next start -p 3000
