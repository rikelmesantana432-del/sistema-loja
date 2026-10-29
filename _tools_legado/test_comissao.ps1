$data = Get-Content -Raw -Path '_backups\StrategyOS_Backup_2026-08-07.json' | ConvertFrom-Json
$novaComissao = 0
$vendasAgosto = $data.historico.vendas | Where-Object { $_.data -match '^2026-08' }

foreach ($v in $vendasAgosto) {
    $tipo = if ($null -ne $v.tipo) { $v.tipo.ToLower() } else { "" }
    $produto = if ($null -ne $v.produto) { $v.produto.ToLower() } else { "" }
    
    $isCelular = ($tipo -match 'celular') -or ($produto -ne "" -and -not ($produto -match 'acess'))
    $isFogos = $v.caixaDestino -eq 'caixaFogos'
    $isConserto = $tipo -match 'conserto'
    
    if (-not $isFogos -and -not $isConserto) {
        $lucro = if ($null -ne $v.lucro) { [math]::Round([double]$v.lucro, 2) } else { 0 }
        if ($isCelular) {
            if ($lucro -gt 100) { $novaComissao += ($lucro - 100) }
        } else {
            $novaComissao += $lucro
        }
    }
}
Write-Output "Nova Comissao Calculada: $novaComissao"
