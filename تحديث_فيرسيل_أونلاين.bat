@echo off
chcp 65001 >nul
title تحديث أبناء سوهاج أونلاين
color 0A

echo ============================================
echo    جاري تحديث النسخة على GitHub وفيرسيل...
echo ============================================
echo.

:: 1. Switch to Postgres
echo [1/4] تحويل النظام للوضع السحابي...
powershell -Command "(Get-Content prisma/schema.prisma) -replace 'provider = \"sqlite\"', 'provider = \"postgresql\"' -replace 'url      = \"file:./dev.db\"', 'provider = \"postgresql\"`n  url       = env(\"POSTGRES_PRISMA_URL\")`n  directUrl = env(\"POSTGRES_URL_NON_POOLING\")' | Set-Content prisma/schema.prisma"

:: 2. Push to Git
echo [2/4] رفع التعديلات على السحابة...
git add .
git commit -m "Update from local shop machine: %date% %time%"
git push origin main --force

:: 3. Switch back to SQLite
echo [3/4] إعادة النظام لوضع الأوفلاين المحلي...
powershell -Command "(Get-Content prisma/schema.prisma) -replace 'provider  = \"postgresql\"', 'provider = \"sqlite\"' -replace 'url       = env\(\"POSTGRES_PRISMA_URL\"\)', 'url      = \"file:./dev.db\"' -replace 'directUrl = env\(\"POSTGRES_URL_NON_POOLING\"\)', '' | Set-Content prisma/schema.prisma"

echo [4/4] تنظيف الملفات المؤقتة...
call npx prisma generate >nul 2>&1

echo.
echo ✅ تم تحديث النسخة الأونلاين بنجاح!
echo النسخة الآن تعمل أوفلاين على هذا الجهاز كالمعتاد.
echo.
pause
