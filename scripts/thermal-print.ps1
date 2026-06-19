param(
  [Parameter(Mandatory = $true)][string]$ReceiptFile
)

$ErrorActionPreference = 'Stop'

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

$text = [System.IO.File]::ReadAllText($ReceiptFile, [System.Text.Encoding]::UTF8)
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
