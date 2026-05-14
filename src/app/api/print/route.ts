import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export async function POST(req: Request) {
  try {
    const invoice = await req.json();

    // 1. Format the receipt text
    let receiptText = "";
    receiptText += "ماركت أبناء سوهاج\n";
    receiptText += "--------------------------------\n";
    receiptText += `رقم الفاتورة: ${invoice.invoiceNo}\n`;
    receiptText += `التاريخ: ${new Date(invoice.createdAt).toLocaleString("ar-EG")}\n`;
    if (invoice.customer) {
      receiptText += `العميل: ${invoice.customer.name}\n`;
    }
    receiptText += "--------------------------------\n";
    receiptText += "الصنف            الكمية    السعر\n";
    receiptText += "--------------------------------\n";

    invoice.items.forEach((item: any) => {
      const name = item.product.name.padEnd(16).substring(0, 16);
      const qty = item.quantity.toString().padEnd(8);
      const price = item.total.toFixed(2).toString();
      receiptText += `${name} ${qty} ${price}\n`;
    });

    receiptText += "--------------------------------\n";
    receiptText += `المجموع: ${invoice.total.toFixed(2)}\n`;
    if (invoice.deliveryFee > 0) {
      receiptText += `التوصيل: ${invoice.deliveryFee.toFixed(2)}\n`;
    }
    receiptText += `الخصم: ${invoice.discount.toFixed(2)}\n`;
    receiptText += `الإجمالي: ${invoice.finalTotal.toFixed(2)}\n`;
    receiptText += "--------------------------------\n";
    receiptText += "شكراً لتعاملكم معنا\n";
    receiptText += "\n\n\n\n\n"; // Extra space for tearing

    // 2. Save to a temporary file
    const tempFilePath = path.join(os.tmpdir(), `receipt_${invoice.invoiceNo}.txt`);
    // Use 'ucs2' or 'utf8' depending on the printer driver. 
    // Generic/Text Only usually likes CP864 or just plain ANSI for Arabic, 
    // but Windows 'Out-Printer' handles the rendering.
    fs.writeFileSync(tempFilePath, receiptText, { encoding: "utf8" });

    // 3. Print using PowerShell
    const command = `powershell -Command "
      $names = @('textonly', 'text only', 'Generic / Text Only');
      $printer = $null;
      foreach ($n in $names) {
          $printer = Get-Printer -Name $n -ErrorAction SilentlyContinue;
          if ($printer) { break; }
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

    return new Promise((resolve) => {
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
