import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export async function POST(req: Request) {
  try {
    const invoice = await req.json();

    // 1. Format the receipt text for 80mm (approx 42-48 columns wide)
    let receiptText = "";
    receiptText += "==========================================\n";
    receiptText += "            ماركت أبناء سوهاج             \n";
    receiptText += "==========================================\n";
    receiptText += `رقم الفاتورة: ${invoice.invoiceNo}\n`;
    receiptText += `التاريخ: ${new Date(invoice.createdAt).toLocaleString("ar-EG")}\n`;
    receiptText += `نوع الطلب: ${invoice.orderType === "delivery" ? "دليفري (توصيل)" : "صالة"}\n`;

    if (invoice.customer) {
      receiptText += "==========================================\n";
      receiptText += `العميل: ${invoice.customer.name}\n`;
      if (invoice.customer.phone) {
        receiptText += `الهاتف: ${invoice.customer.phone}\n`;
      }
      if (invoice.customer.address) {
        receiptText += `العنوان: ${invoice.customer.address}\n`;
      }
    }

    receiptText += "==========================================\n";
    receiptText += "الصنف                 الكمية   السعر  الإجمالي\n";
    receiptText += "==========================================\n";

    invoice.items.forEach((item: any) => {
      // Pad and align columns beautifully
      const name = (item.product.name || "").padEnd(20).substring(0, 20);
      const qty = (item.quantity || 0).toString().padStart(6);
      const price = (item.price || 0).toFixed(2).toString().padStart(7);
      const total = (item.total || 0).toFixed(2).toString().padStart(9);
      receiptText += `${name} ${qty} ${price} ${total}\n`;
    });

    receiptText += "==========================================\n";
    receiptText += `المجموع الفرعي:   ${(invoice.total || 0).toFixed(2).padStart(24)}\n`;
    if (invoice.deliveryFee > 0) {
      receiptText += `رسوم التوصيل:     ${(invoice.deliveryFee || 0).toFixed(2).padStart(24)}\n`;
    }
    if (invoice.discount > 0) {
      receiptText += `الخصم:            ${(invoice.discount || 0).toFixed(2).padStart(24)}\n`;
    }
    receiptText += "==========================================\n";
    receiptText += `الإجمالي المطلوب: ${(invoice.finalTotal || 0).toFixed(2).padStart(24)}\n`;

    if (invoice.riderChange !== undefined && invoice.riderChange !== null && invoice.riderChange > 0) {
      receiptText += `الباقي مع الطيار: ${(invoice.riderChange || 0).toFixed(2).padStart(24)}\n`;
    }

    receiptText += "==========================================\n";
    receiptText += "شكراً لتعاملكم معنا! نسعد بخدمتكم دائماً\n";
    receiptText += "\n\n\n\n\n"; // Extra space for tearing

    // 2. Save to a temporary file
    const tempFilePath = path.join(os.tmpdir(), `receipt_${invoice.invoiceNo}.txt`);
    fs.writeFileSync(tempFilePath, receiptText, { encoding: "utf8" });

    // 3. Print using PowerShell with smart printer detection (prioritizing default Windows printer)
    const command = `powershell -Command "
      $printer = Get-Printer | Where-Object { $_.IsDefault -eq $true } | Select-Object -First 1;

      if (!$printer) {
          $printer = Get-Printer | Where-Object { 
              $_.Name -like '*xprinter*' -or 
              $_.Name -like '*xp-80*' -or 
              $_.Name -like '*xp80*' -or 
              $_.Name -like '*x printer*' -or 
              $_.Name -like '*80c*' -or 
              $_.Name -like '*80 c*' -or 
              $_.Name -like '*xp 80*' -or
              $_.Name -like '*pos-80*' -or
              $_.Name -like '*pos80*' -or
              $_.Name -like '*thermal*' -or
              $_.Name -like '*receipt*' -or
              $_.Name -like '*pos*'
          } | Select-Object -First 1;
      }

      if (!$printer) {
          $printer = Get-Printer | Where-Object { $_.Name -like '*text*' } | Select-Object -First 1;
      }

      if ($printer) {
          [System.IO.File]::ReadAllText('${tempFilePath.replace(/\\/g, '/')}', [System.Text.Encoding]::UTF8) | Out-Printer -Name $printer.Name;
      } else {
          throw 'Printer not found';
      }
    "`;

    return new Promise<NextResponse>((resolve) => {
      exec(command, (error, stdout, stderr) => {
        // Delete temp file
        try { fs.unlinkSync(tempFilePath); } catch (e) {}

        if (error) {
          console.error("Print Error:", error);
          resolve(NextResponse.json({ error: "فشل في الطباعة: " + error.message }, { status: 500 }));
        } else {
          resolve(NextResponse.json({ success: true }));
        }
      });
    });

  } catch (error: any) {
    console.error("API Print Error:", error);
    return NextResponse.json({ error: "خطأ في السيرفر" }, { status: 500 });
  }
}
