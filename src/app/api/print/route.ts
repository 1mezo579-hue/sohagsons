import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

// Width for 80mm thermal paper printer (48 chars)
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

export async function POST(req: Request) {
  try {
    const invoice = await req.json();

    // ── Build receipt text ─────────────────────────────────────────
    let txt = "";
    txt += separator();
    txt += centerText("ماركت ابناء سوهاج");
    txt += centerText("سوبرماركت - دليفري");
    txt += separator();

    txt += `رقم الفاتورة: ${invoice.invoiceNo}\n`;
    txt += `التاريخ: ${new Date(invoice.createdAt).toLocaleString("ar-EG", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit"
    })}\n`;
    txt += `النوع: ${invoice.orderType === "delivery" ? "دليفري (توصيل)" : "صالة"}\n`;

    if (invoice.customer) {
      txt += separator();
      txt += `العميل: ${invoice.customer.name}\n`;
      if (invoice.customer.phone)   txt += `الهاتف: ${invoice.customer.phone}\n`;
      if (invoice.customer.address) txt += `العنوان: ${invoice.customer.address}\n`;
    }

    txt += separator();
    // Header row: name(20) qty(4) price(8) total(9) = 41 + spaces = 44
    txt += `${"الصنف".padEnd(20)} ${"ك".padEnd(4)} ${"سعر".padEnd(8)} ${"اجمالي".padEnd(9)}\n`;
    txt += separator();

    invoice.items.forEach((item: any) => {
      const name  = pad(item.product?.name || "", 20);
      const qty   = pad(String(item.quantity || 0), 4);
      const price = pad((item.price || 0).toFixed(2), 8, "right");
      const total = pad((item.total || 0).toFixed(2), 9, "right");
      txt += `${name} ${qty} ${price} ${total}\n`;
    });

    txt += separator();
    txt += leftRightLine("المجموع الفرعي:", `${(invoice.total || 0).toFixed(2)}`);
    if ((invoice.deliveryFee || 0) > 0)
      txt += leftRightLine("رسوم التوصيل:", `${invoice.deliveryFee.toFixed(2)}`);
    if ((invoice.discount || 0) > 0)
      txt += leftRightLine("الخصم:", `-${invoice.discount.toFixed(2)}`);
    txt += separator();
    txt += leftRightLine(">>> الاجمالي:", `${(invoice.finalTotal || 0).toFixed(2)} ج`);
    if ((invoice.riderChange || 0) > 0)
      txt += leftRightLine("الباقي مع الطيار:", `${invoice.riderChange.toFixed(2)} ج`);

    txt += separator();
    txt += centerText("شكرا لتعاملكم معنا");
    txt += centerText("نسعد بخدمتكم دائما");
    txt += "\n\n\n\n"; // Feed lines before cut

    // ── Write temp file ─────────────────────────────────────────────
    const tempFile = path.join(os.tmpdir(), `receipt_${Date.now()}.txt`);
    fs.writeFileSync(tempFile, txt, { encoding: "utf8" });

    const safePath = tempFile.replace(/\\/g, "\\\\");

// ── PowerShell: RAW spool via C# Win32 (no Out-Printer A4 issue) ─
    const psScript = `
$ErrorActionPreference = 'Stop'

# Find printer: default first, then POS/thermal
$printer = Get-Printer | Where-Object { $_.IsDefault } | Select-Object -First 1
if (-not $printer) {
  $printer = Get-Printer | Where-Object {
    $_.Name -match 'xprinter|xp.?80|pos.?80|thermal|receipt|text'
  } | Select-Object -First 1
}
if (-not $printer) {
  $printer = Get-Printer | Select-Object -First 1
}
if (-not $printer) { throw 'No printer found' }

$text = [System.IO.File]::ReadAllText('${safePath}', [System.Text.Encoding]::UTF8)
$bytes = [System.Text.Encoding]::GetEncoding(1256).GetBytes($text)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class RawPrint {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }
    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);
    [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool ClosePrinter(IntPtr hPrinter);
    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern uint StartDocPrinter(IntPtr hPrinter, Int32 level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);
    [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);
    [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);
    [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);
    [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, Int32 dwCount, out Int32 dwWritten);

    public static void Send(string name, byte[] data) {
        IntPtr hPrinter = new IntPtr(0);
        DOCINFOA di = new DOCINFOA();
        Int32 dwWritten = 0;
        IntPtr pBytes = Marshal.AllocCoTaskMem(data.Length);
        Marshal.Copy(data, 0, pBytes, data.Length);
        
        di.pDocName = "POS Print";
        di.pDataType = "RAW";

        if (OpenPrinter(name, out hPrinter, IntPtr.Zero)) {
            if (StartDocPrinter(hPrinter, 1, di) != 0) {
                if (StartPagePrinter(hPrinter)) {
                    WritePrinter(hPrinter, pBytes, data.Length, out dwWritten);
                    EndPagePrinter(hPrinter);
                }
                EndDocPrinter(hPrinter);
            }
            ClosePrinter(hPrinter);
        } else {
            Marshal.FreeCoTaskMem(pBytes);
            throw new Exception("OpenPrinter failed");
        }
        Marshal.FreeCoTaskMem(pBytes);
    }
}
"@

[RawPrint]::Send($printer.Name, $bytes)
Remove-Item '${safePath}' -ErrorAction SilentlyContinue
`;

    const psTempFile = path.join(os.tmpdir(), `print_${Date.now()}.ps1`);
    fs.writeFileSync(psTempFile, psScript, { encoding: "utf8" });

    const command = `powershell -ExecutionPolicy Bypass -NonInteractive -File "${psTempFile}"`;

    return new Promise<NextResponse>((resolve) => {
      exec(command, { timeout: 15000 }, (error, stdout, stderr) => {
        try { fs.unlinkSync(psTempFile); } catch {}
        try { fs.unlinkSync(tempFile); } catch {}

        if (error) {
          console.error("Print Error:", stderr || error.message);
          resolve(NextResponse.json(
            { error: "فشل في الطباعة: " + (stderr || error.message) },
            { status: 500 }
          ));
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
