Set WshShell = CreateObject("WScript.Shell")

' Kill all node processes related to the system
WshShell.Run "taskkill /F /IM node.exe /T", 0, True

' Kill the Edge app window if needed (optional)
' WshShell.Run "taskkill /F /IM msedge.exe", 0, True

MsgBox "تم إغلاق نظام أبناء سوهاج بنجاح.", 64, "تأكيد الإغلاق"

Set WshShell = Nothing
