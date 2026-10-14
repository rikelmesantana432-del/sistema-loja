$data = Get-Content -Raw -Path '_backups\StrategyOS_Backup_2026-08-07.json' | ConvertFrom-Json

# 1. Encontrar o último fechamento ou zeramento do caixa secundário
$movs = $data.movimentacoesCaixa | Sort-Object data
$ultimoFechamentoIdx = -1
for ($i = $movs.Count - 1; $i -ge 0; $i--) {
    $m = $movs[$i]
    if ($m.tipo -eq 'fechamento_diario' -or $m.tipo -eq 'zerado' -or ($m.descricao -match 'Fechamento' -and $m.caixaDestino -eq 'caixaSecundario')) {
        $ultimoFechamentoIdx = $i
        break
    }
}

if ($ultimoFechamentoIdx -ne -1) {
    $refMov = $movs[$ultimoFechamentoIdx]
    Write-Output "Último fechamento encontrado em: $($refMov.data) | Descrição: $($refMov.descricao) | Valor registrado: $($refMov.valor)"
    # Se o fechamento definiu o saldo de abertura:
    $valRef = 0
    if ($refMov.valor) { $valRef = [double]$refMov.valor }
    $saldoCalculado = $valRef
    # As movimentações após o fechamento
    $movsPos = $movs | Where-Object { [DateTime]$_.data -gt [DateTime]$refMov.data }
} else {
    Write-Output "Nenhum fechamento anterior encontrado. Auditando todo o histórico..."
    $saldoCalculado = 0
    $movsPos = $movs
}

Write-Output "`nMovimentações após o último fechamento:"

foreach ($m in $movsPos) {
    if ($m.caixa -eq 'caixaSecundario' -or $m.caixaDestino -eq 'caixaSecundario' -or $m.caixaOrigem -eq 'caixaSecundario') {
        $val = 0
        if ($m.valor) { $val = [double]$m.valor }
        # Se for transferência saindo do secundário
        if ($m.caixaOrigem -eq 'caixaSecundario') {
            $saldoCalculado -= $val
            Write-Output "  - Transferência saída: -$val | Desc: $($m.descricao) | Data: $($m.data)"
        } elseif ($m.caixaDestino -eq 'caixaSecundario' -or $m.caixa -eq 'caixaSecundario') {
            if ($m.tipo -eq 'saida' -or $m.tipo -eq 'despesa') {
                $saldoCalculado -= [Math]::Abs($val)
                Write-Output "  - Saída/Despesa: -$([Math]::Abs($val)) | Desc: $($m.descricao) | Data: $($m.data)"
            } else {
                $saldoCalculado += $val
                Write-Output "  - Entrada/Venda: +$val | Desc: $($m.descricao) | Data: $($m.data)"
            }
        }
    }
}

Write-Output "`nSaldo calculado final: $saldoCalculado"
Write-Output "Saldo atual gravado no financeiro: $($data.financeiro.caixaSecundario)"
