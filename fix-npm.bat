@echo off
chcp 65001 >nul
echo ==========================================
echo   أبناء سوهاج - إصلاح مشاكل npm
echo ==========================================
echo.

:: 1. Clear npm cache
echo [1/5] تنظيف ذاكرة npm المؤقتة...
npm cache clean --force

:: 2. Delete node_modules if exists
echo [2/5] حذف مجلد node_modules القديم...
if exist "node_modules" (
    rmdir /s /q "node_modules" 2>nul
    if exist "node_modules" (
        echo     لم يتم الحذف - جاري المحاولة بطريقة أخرى...
        takeown /f "node_modules" /r /d y >nul 2>&1
        icacls "node_modules" /grant %username%:F /t >nul 2>&1
        rmdir /s /q "node_modules" 2>nul
    )
)

:: 3. Delete package-lock
echo [3/5] حذف package-lock.json...
del /f /q package-lock.json 2>nul

:: 4. Update npm
echo [4/5] تحديث npm...
npm install -g npm@latest

:: 5. Install with legacy peer deps
echo [5/5] تثبيت الحزم...
npm install --legacy-peer-deps

echo.
echo ==========================================
if %errorlevel% == 0 (
    echo   تم الإصلاح بنجاح!
    echo   اكتب الآن: npm run dev
) else (
    echo   فشل التثبيت - جرب الحل البديل
    echo   شغل: fix-npm-alternative.bat
)
echo ==========================================
pause
