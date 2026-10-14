$data = Get-Content -Raw -Path '_backups\StrategyOS_Backup_2026-08-07.json' | ConvertFrom-Json
Write-Output "Caixa Secundario no Backup: $($data.financeiro.caixaSecundario)"
Write-Output "Comissao Ilanna Mensal no Backup: $($data.comissaoIlannaMensal)"

$vendasHoje = $data.historico.vendas | Where-Object { $_.data -match '2026-08-07' }
Write-Output "Vendas Hoje (07/08): $($vendasHoje.Count)"
foreach ($v in $vendasHoje) {
    Write-Output "  - Venda: $($v.produto) | Valor: $($v.valorVenda) | Caixa: $($v.caixaDestino) | Forma: $($v.metodoPagamento)"
}

$movsHoje = $data.movimentacoesCaixa | Where-Object { $_.data -match '2026-08-07' }
Write-Output "Movimentacoes Hoje (07/08): $($movsHoje.Count)"
foreach ($m in $movsHoje) {
    Write-Output "  - Mov: $($m.descricao) | Valor: $($m.valor) | Tipo: $($m.tipo) | Caixa: $($m.caixa)"
}
