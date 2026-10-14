$dataOntem = Get-Content -Raw -Path '_backups\StrategyOS_Backup_2026-08-06.json' | ConvertFrom-Json
Write-Output "Comissao Ilanna em 06/08: $($dataOntem.comissaoIlannaMensal)"
Write-Output "Caixa Secundario em 06/08: $($dataOntem.financeiro.caixaSecundario)"
Write-Output "Total Vendas em 06/08: $($dataOntem.historico.vendas.Count)"
