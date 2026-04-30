@echo off
chcp 65001 >nul
echo ==========================================
echo   الحل البديل - تثبيت يدوي
echo ==========================================
echo.

echo [1] حذف مجلد node_modules يدوياً...
echo     افتح المجلد وامسح node_modules بنفسك
pause

echo [2] حذف package-lock.json...
del /f /q package-lock.json 2>nul

echo [3] تثبيت بدون peer deps...
npm install --legacy-peer-deps --no-optional

echo [4] لو فشل - جرب بـ yarn...
echo     npm install -g yarn
pause

echo ==========================================
echo   انتهى
pause
