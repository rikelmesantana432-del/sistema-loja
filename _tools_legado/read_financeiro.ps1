$path = '_backups\StrategyOS_Backup_2026-08-06.json'
if (Test-Path $path) {
    $data = Get-Content -Raw -Path $path | ConvertFrom-Json
    $data.financeiro | ConvertTo-Json
} else {
    Write-Output "Backup not found"
}
