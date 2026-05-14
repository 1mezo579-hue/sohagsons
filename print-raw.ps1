
$printerName = "text only"
$text = "فحص طباعة نهائي" + [char]10 + "--------------------------------" + [char]10 + "تمت التجربة بنجاح" + [char]10 + "--------------------------------" + [char]10 + [char]10 + [char]10 + [char]10

$code = @"
using System;
using System.Runtime.InteropServices;

public class RawPrinterHelper {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }
    [DllImport(\"winspool.Drv\", EntryPoint = \"OpenPrinterA\", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);
    [DllImport(\"winspool.Drv\", EntryPoint = \"ClosePrinter\", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool ClosePrinter(IntPtr hPrinter);
    [DllImport(\"winspool.Drv\", EntryPoint = \"StartDocPrinterA\", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern uint StartDocPrinter(IntPtr hPrinter, Int32 level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);
    [DllImport(\"winspool.Drv\", EntryPoint = \"EndDocPrinter\", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);
    [DllImport(\"winspool.Drv\", EntryPoint = \"StartPagePrinter\", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);
    [DllImport(\"winspool.Drv\", EntryPoint = \"EndPagePrinter\", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);
    [DllImport(\"winspool.Drv\", EntryPoint = \"WritePrinter\", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, Int32 dwCount, out Int32 dwWritten);

    public static bool SendStringToPrinter(string szPrinterName, string szString) {
        IntPtr hPrinter = new IntPtr(0);
        DOCINFOA di = new DOCINFOA();
        Int32 dwWritten = 0;
        IntPtr pBytes;
        Int32 dwCount = szString.Length;
        // Convert the string to ANSI bytes
        pBytes = Marshal.StringToCoTaskMemAnsi(szString);
        di.pDocName = \"RAW POS Print\";
        di.pDataType = \"RAW\";

        if (OpenPrinter(szPrinterName, out hPrinter, IntPtr.Zero)) {
            if (StartDocPrinter(hPrinter, 1, di) != 0) {
                if (StartPagePrinter(hPrinter)) {
                    WritePrinter(hPrinter, pBytes, dwCount, out dwWritten);
                    EndPagePrinter(hPrinter);
                }
                EndDocPrinter(hPrinter);
            }
            ClosePrinter(hPrinter);
        }
        Marshal.FreeCoTaskMem(pBytes);
        return true;
    }
}
"@

Add-Type -TypeDefinition $code
[RawPrinterHelper]::SendStringToPrinter($printerName, $text)
