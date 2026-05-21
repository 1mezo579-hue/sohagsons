import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";

export async function GET() {
  try {
    const zip = new AdmZip();
    
    // Paths
    const rootDir = process.cwd();
    const dbPath = path.join(rootDir, "prisma", "dev.db");
    
    // Add SQLite database file
    if (fs.existsSync(dbPath)) {
      zip.addLocalFile(dbPath, "prisma"); // adds to /prisma/dev.db
    }
    
    // Add VBS startup and stop files from root
    const vbsStart = path.join(rootDir, "ابدأ_النظام_سوبرماركت_أبناء_سوهاج.vbs");
    if (fs.existsSync(vbsStart)) {
      zip.addLocalFile(vbsStart);
    }
    
    const vbsStop = path.join(rootDir, "إيقاف_النظام.vbs");
    if (fs.existsSync(vbsStop)) {
      zip.addLocalFile(vbsStop);
    }
    
    const batKill = path.join(rootDir, "إغلاق_سيرفر_البيانات.bat");
    if (fs.existsSync(batKill)) {
      zip.addLocalFile(batKill);
    }
    
    const psPrint = path.join(rootDir, "print-raw.ps1");
    if (fs.existsSync(psPrint)) {
      zip.addLocalFile(psPrint);
    }
    
    // Add a simple instructions file in Arabic
    const readmeContent = `نظام كاشير أبناء سوهاج - حزمة التشغيل والنسخ الاحتياطي الكاملة
------------------------------------------------------------
محتويات الحزمة:
1. قاعدة البيانات المحلية (dev.db) - داخل مجلد prisma.
2. ملف (ابدأ_النظام_سوبرماركت_أبناء_سوهاج.vbs) - لتشغيل السيرفر والمزامنة وشاشة الكاشير صامتاً بضغطة زر.
3. ملف (إيقاف_النظام.vbs) - لإيقاف النظام بالكامل وإغلاق العمليات في الخلفية.
4. ملف (print-raw.ps1) - سكربت الطباعة الفورية صامتة بدون متصفح.

طريقة الاستخدام ونقلها لجهاز آخر:
- قم بفك ضغط هذا الملف بالكامل في بارتشن الـ D في المسار d:\\supermarket-pos-system
- للتأكد من ربط الطابعة التلقائية، يرجى ضبط الطابعة الحرارية كطابعة افتراضية (Default Printer) في لوحة تحكم الويندوز.
- اضغط مرتين على ملف "ابدأ_النظام_سوبرماركت_أبناء_سوهاج.vbs" وسيبدأ النظام بالعمل فوراً في وضع التطبيق الاحترافي!`;
    
    zip.addFile("تعليمات التشغيل والتركيب.txt", Buffer.from(readmeContent, "utf-8"));
    
    const zipBuffer = zip.toBuffer();
    
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=SohagPOS_Backup_Package.zip",
      },
    });
  } catch (error: any) {
    console.error("خطأ حزمة النسخ الاحتياطي:", error);
    return NextResponse.json(
      { error: error.message || "فشل إنشاء حزمة النسخ الاحتياطي" },
      { status: 500 }
    );
  }
}
