const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const invoice = {
  invoiceNo: "TEST-123",
  createdAt: new Date().toISOString(),
  total: 100,
  discount: 0,
  deliveryFee: 0,
  finalTotal: 100,
  items: [
    { product: { name: "صنف تجريبي" }, quantity: 1, total: 100 }
  ]
};

let receiptText = "فحص طباعة مباشرة\n";
receiptText += "--------------------------------\n";
receiptText += `رقم: ${invoice.invoiceNo}\n`;
receiptText += "--------------------------------\n";
invoice.items.forEach((item) => {
  receiptText += `${item.product.name} x ${item.quantity} = ${item.total}\n`;
});
receiptText += "--------------------------------\n";
receiptText += "النهاية\n\n\n\n";

const tempFilePath = path.join(os.tmpdir(), `test_receipt.txt`);
// For Generic Text printers, sometimes ANSI (1256) is better than UTF-8
fs.writeFileSync(tempFilePath, receiptText, { encoding: "utf8" });

const command = `powershell -Command "
  $printer = Get-Printer | Where-Object { $_.Name -like '*text*' } | Select-Object -First 1;
  if ($printer) {
      Write-Host 'Found Printer: ' $printer.Name;
      $sharePath = '\\\\127.0.0.1\\' + $printer.ShareName;
      Write-Host 'Target Share: ' $sharePath;
      
      # Use the 'print' command via cmd
      $printCmd = \\"print /D:\\\\\\"$sharePath\\\\\\" \\\\\\"${tempFilePath.replace(/\\/g, '\\\\\\\\')}\\\\\\"\\";
      cmd /c $printCmd;
      
      Write-Host 'Print command executed.';
  } else {
      Write-Error 'No suitable printer found.';
      exit 1;
  }
"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error("Error:", error.message);
    console.error("Stderr:", stderr);
  } else {
    console.log("Stdout:", stdout);
    console.log("العملية تمت بنجاح!");
  }
  // Keep the file for a bit to ensure printing finishes
  setTimeout(() => { try { fs.unlinkSync(tempFilePath); } catch(e){} }, 5000);
});
