$backupOntem = Get-Content -Raw -Path '_backups\StrategyOS_Backup_2026-08-06.json' | ConvertFrom-Json
$backupHoje = Get-Content -Raw -Path '_backups\StrategyOS_Backup_2026-08-07.json' | ConvertFrom-Json

$vendasOntem = $backupOntem.historico.vendas.Count
$vendasHoje = $backupHoje.historico.vendas.Count
$movOntem = $backupOntem.movimentacoesCaixa.Count
$movHoje = $backupHoje.movimentacoesCaixa.Count

$vendasHojeData = $backupHoje.historico.vendas | Where-Object { $_.data -match '2026-08-07' } | Measure-Object | Select-Object -ExpandProperty Count

Write-Output "--- ANALISE DE DADOS ---"
Write-Output "Vendas Ontem (Total): $vendasOntem"
Write-Output "Vendas Hoje (Total): $vendasHoje"
Write-Output "Vendas Feitas Hoje (07/08): $vendasHojeData"
Write-Output "Movimentacoes Ontem: $movOntem"
Write-Output "Movimentacoes Hoje: $movHoje"
