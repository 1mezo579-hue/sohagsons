$DesktopPath = [System.IO.Path]::Combine($env:USERPROFILE, "Desktop")
$ShortcutPath = [System.IO.Path]::Combine($DesktopPath, "ماركت أبناء سوهاج - نظام الكاشير.lnk")
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = """d:\supermarket-pos-system\ابدأ_النظام_سوبرماركت_أبناء_سوهاج.vbs"""
$Shortcut.WorkingDirectory = "d:\supermarket-pos-system"
$Shortcut.Description = "نظام كاشير سوبرماركت أبناء سوهاج"
$Shortcut.IconLocation = "shell32.dll, 25"
$Shortcut.Save()
Write-Output "Shortcut created successfully at: $ShortcutPath"
