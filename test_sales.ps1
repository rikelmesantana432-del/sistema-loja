$b1 = Get-Content -Raw -Path '_backups\StrategyOS_Backup_2026-08-06.json' | ConvertFrom-Json
$b2 = Get-Content -Raw -Path '_backups\StrategyOS_Backup_2026-08-07.json' | ConvertFrom-Json

$os1 = $b1.historico.vendas | Where-Object { $_.produto -match 'OS #' }
$os2 = $b2.historico.vendas | Where-Object { $_.produto -match 'OS #' }

Write-Output "OS Sales 06/08: $($os1.Count)"
Write-Output "OS Sales 07/08: $($os2.Count)"
