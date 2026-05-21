Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

DesktopPath = WshShell.SpecialFolders("Desktop")
projectDir = "d:\supermarket-pos-system"

' Find the VBS launcher file
Dim vbsFile
Set folder = fso.GetFolder(projectDir)
For Each f In folder.Files
    If LCase(fso.GetExtensionName(f.Name)) = "vbs" And Len(f.Name) > 20 Then
        vbsFile = f.Path
        Exit For
    End If
Next

' Temp english shortcut path
TempLnk = DesktopPath & "\SohagPOSTemp.lnk"

' Delete it if it exists
On Error Resume Next
fso.DeleteFile TempLnk, True
On Error GoTo 0

Set Shortcut = WshShell.CreateShortcut(TempLnk)
Shortcut.TargetPath = "wscript.exe"
Shortcut.Arguments = Chr(34) & vbsFile & Chr(34)
Shortcut.WorkingDirectory = projectDir
Shortcut.Description = "SohagPOS System"
Shortcut.IconLocation = "shell32.dll, 25"
Shortcut.Save

' Construct Arabic Name: "ماركت أبناء سوهاج - نظام الكاشير.lnk"
ArabicName = ChrW(1605) & ChrW(1575) & ChrW(1585) & ChrW(1603) & ChrW(1578) & " " & _
             ChrW(1571) & ChrW(1576) & ChrW(1606) & ChrW(1575) & ChrW(1569) & " " & _
             ChrW(1587) & ChrW(1608) & ChrW(1607) & ChrW(1575) & ChrW(1580) & " - " & _
             ChrW(1606) & ChrW(1592) & ChrW(1575) & ChrW(1605) & " " & _
             ChrW(1575) & ChrW(1604) & ChrW(1603) & ChrW(1575) & ChrW(1588) & ChrW(1610) & ChrW(1585) & ".lnk"

DestLnk = DesktopPath & "\" & ArabicName

' Delete destination if it exists
On Error Resume Next
fso.DeleteFile DestLnk, True
On Error GoTo 0

' Rename
fso.MoveFile TempLnk, DestLnk

WScript.Echo "Shortcut created and renamed to Arabic successfully!"
