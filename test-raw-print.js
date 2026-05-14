const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const tempUtf8Path = path.join(os.tmpdir(), `receipt_utf8.txt`);
const tempAnsiPath = path.join(os.tmpdir(), `receipt_ansi.txt`);

const text = "تجربة طباعة مباشرة\n" +
             "ماركت أبناء سوهاج\n" +
             "--------------------------------\n" +
             "صنف تجريبي       10.00\n" +
             "--------------------------------\n" +
             "شكراً لك\n\n\n\n\n";

fs.writeFileSync(tempUtf8Path, text, "utf8");

const command = `powershell -Command "
  # 1. Convert UTF8 to Windows-1256 (Arabic ANSI)
  $utf8 = Get-Content '${tempUtf8Path.replace(/\\/g, '/')}' -Raw;
  [System.IO.File]::WriteAllText('${tempAnsiPath.replace(/\\/g, '/')}', $utf8, [System.Text.Encoding]::GetEncoding(1256));

  # 2. Find printer
  $printer = Get-Printer | Where-Object { $_.Name -like '*text*' } | Select-Object -First 1;
  
  if ($printer) {
      Write-Host 'Found Printer: ' $printer.Name;
      $sharePath = '\\\\127.0.0.1\\' + $printer.ShareName;
      
      # 3. Send raw file to share
      cmd /c \\"copy /b \\\\\\"${tempAnsiPath.replace(/\\/g, '\\\\\\\\')}\\\\\\" \\\\\\"$sharePath\\\\\\"\\";
      Write-Host 'Sent to printer.';
  } else {
      Write-Error 'Printer not found';
      exit 1;
  }
"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error("Error:", error.message);
    console.error("Stderr:", stderr);
  } else {
    console.log("Stdout:", stdout);
    console.log("تم إرسال أمر الطباعة بنجاح!");
  }
  // Cleanup
  setTimeout(() => {
    try { fs.unlinkSync(tempUtf8Path); fs.unlinkSync(tempAnsiPath); } catch(e) {}
  }, 2000);
});
