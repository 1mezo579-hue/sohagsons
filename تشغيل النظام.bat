@echo off
title 2M Store POS System
echo ==============================================
echo  2M Store POS System - Starting...
echo ==============================================
echo.

:: Check if node_modules exists, if not, run npm install
IF NOT EXIST "node_modules" (
    echo [1/3] Installing dependencies... This may take a minute.
    npm install
) ELSE (
    echo [1/3] Dependencies found.
)

:: Run Prisma generation just in case
echo [2/3] Updating database connection...
call npx prisma generate

:: Start the server
echo [3/3] Starting the local server...
echo.
echo ==============================================
echo  The POS System will open in your browser automatically!
echo  DO NOT CLOSE THIS BLACK WINDOW!
echo ==============================================
echo.

:: Open browser
start http://localhost:3000

:: Run next dev
npm run dev
