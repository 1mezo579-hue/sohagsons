Set WshShell = CreateObject("WScript.Shell")

' 1. Start the POS Server (Hidden)
WshShell.Run "cmd /c npm run dev", 0, False

' 2. Start the Sync Service (Hidden)
WshShell.Run "cmd /c node sync-service.js", 0, False

' 3. Wait for the server to warm up (5 seconds)
WScript.Sleep 5000

' 4. Open Microsoft Edge in App Mode (Professional Look)
WshShell.Run "msedge --app=http://localhost:3000 --window-size=1280,800", 1, False

Set WshShell = Nothing
