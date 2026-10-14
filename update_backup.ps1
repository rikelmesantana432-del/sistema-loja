$json = Get-Content -Raw -Path '_backups\StrategyOS_Backup_2026-08-07.json'
$jsContent = "window.INITIAL_BACKUP_DATA = " + $json + ";"
Set-Content -Path 'js\backup-data.js' -Value $jsContent
