@echo off
title Abnaa Sohag POS - Starter
echo .
echo [1/4] Cleaning memory...
taskkill /f /im node.exe >nul 2>&1
echo [2/4] Starting Sync Service (Cloud Sync)...
start /b node sync-service.js
echo [3/4] Starting POS System (Offline Mode)...
set PORT=3006
set NODE_OPTIONS=--max-old-space-size=1024
echo [4/4] Opening Browser at http://localhost:3006
start "" "http://localhost:3006"
npm run dev
pause
