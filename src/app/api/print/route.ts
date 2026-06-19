import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const WIDTH = 48;

function pad(str: string, len: number, align: "left" | "right" = "left"): string {
  const s = str.substring(0, len);
  return align === "right" ? s.padStart(len) : s.padEnd(len);
}

function separator(): string {
  return "-".repeat(WIDTH) + "\n";
}

function centerText(text: string): string {
  const spaces = Math.max(0, Math.floor((WIDTH - text.length) / 2));
  return " ".repeat(spaces) + text + "\n";
}

function leftRightLine(left: string, right: string): string {
  const maxLeft = WIDTH - right.length - 1;
  const paddedLeft = left.substring(0, maxLeft).padEnd(maxLeft);
  return `${paddedLeft} ${right}\n`;
}

function buildReceiptText(invoice: any): string {
  let txt = "";
  txt += separator();
  txt += centerText("ماركت ابناء سوهاج");
  txt += centerText(
    invoice.orderType === "delivery" ? "طلب دليفري" : invoice.orderType === "return" ? "مرتجع" : "فاتورة مبيعات"
  );
  txt += separator();
  txt += `رقم الفاتورة: ${invoice.invoiceNo}\n`;
  if (invoice.isReprint) txt += `(نسخة اعادة طباعة)\n`;
  txt += `التاريخ: ${new Date(invoice.createdAt).toLocaleString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })}\n`;

  if (invoice.customer) {
    txt += separator();
    txt += `العميل: ${invoice.customer.name}\n`;
    if (invoice.customer.phone) txt += `الهاتف: ${invoice.customer.phone}\n`;
    if (invoice.customer.address) txt += `العنوان: ${invoice.customer.address}\n`;
    const pts = Math.floor(Math.abs(invoice.finalTotal || 0) / 10);
    txt += `نقاط الفاتورة: ${pts}\n`;
    if (invoice.customer.points != null) txt += `رصيد النقاط: ${invoice.customer.points}\n`;
    if ((invoice.customer.balance || 0) > 0) txt += `رصيد آجل: ${invoice.customer.balance.toFixed(2)} ج\n`;
  }

  txt += separator();
  txt += `${"الصنف".padEnd(20)} ${"ك".padEnd(4)} ${"سعر".padEnd(8)} ${"اجمالي".padEnd(9)}\n`;
  txt += separator();

  invoice.items.forEach((item: any) => {
    const name = pad(item.product?.name || "", 20);
    const qty = pad(String(item.quantity || 0), 4);
    const price = pad((item.price || 0).toFixed(2), 8, "right");
    const total = pad((item.total || 0).toFixed(2), 9, "right");
    txt += `${name} ${qty} ${price} ${total}\n`;
  });

  txt += separator();
  txt += leftRightLine("المجموع:", `${(invoice.total || 0).toFixed(2)}`);
  if ((invoice.deliveryFee || 0) > 0) txt += leftRightLine("التوصيل:", `${invoice.deliveryFee.toFixed(2)}`);
  if ((invoice.discount || 0) > 0) txt += leftRightLine("الخصم:", `-${invoice.discount.toFixed(2)}`);
  txt += separator();
  txt += leftRightLine(">>> الاجمالي:", `${(invoice.finalTotal || 0).toFixed(2)} ج`);
  if ((invoice.riderChange || 0) > 0) txt += leftRightLine("الباقي مع الطيار:", `${invoice.riderChange.toFixed(2)} ج`);
  txt += separator();
  txt += centerText("شكرا لتعاملكم معنا");
  txt += "\n\n";
  return txt;
}

export async function POST(req: Request) {
  try {
    const invoice = await req.json();
    const txt = buildReceiptText(invoice);

    const tempFile = path.join(os.tmpdir(), `receipt_${Date.now()}.txt`);
    fs.writeFileSync(tempFile, txt, { encoding: "utf8" });

    const psScript = path.join(process.cwd(), "scripts", "thermal-print.ps1");
    if (!fs.existsSync(psScript)) {
      return NextResponse.json({ error: "سكربت الطباعة غير موجود" }, { status: 500 });
    }

    const command = `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${psScript}" -ReceiptFile "${tempFile}"`;

    return new Promise<NextResponse>((resolve) => {
      exec(command, { timeout: 12000, windowsHide: true }, (error, _stdout, stderr) => {
        try {
          fs.unlinkSync(tempFile);
        } catch {}

        if (error) {
          console.error("Print Error:", stderr || error.message);
          resolve(NextResponse.json({ error: "فشل في الطباعة: " + (stderr || error.message) }, { status: 500 }));
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
