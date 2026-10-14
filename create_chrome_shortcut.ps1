$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("C:\Users\rikel\OneDrive\Desktop\Chrome (Modo IA).lnk")
$Shortcut.TargetPath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$Shortcut.Arguments = "--remote-debugging-port=9222"
$Shortcut.Description = "Chrome com Controle Remoto para IA"
$Shortcut.Save()
