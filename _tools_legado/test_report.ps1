$dbPath = "C:\Users\rikel\OneDrive\Desktop\StrategyOS_Sistema_Loja\db.json"
if (Test-Path $dbPath) {
    $db = Get-Content $dbPath | ConvertFrom-Json
} else {
    Write-Host "db.json nao encontrado"
    exit
}

$botToken = "8881150678:AAEM162UqJGeZiZQCXEmrkSymXMqUBqee34"
$chatId = "1969798643"

# Pegando data atual
$agora = Get-Date
$mesNome = $agora.ToString("MMMM 'de' yyyy", [cultureinfo]::GetCultureInfo("pt-BR")).ToUpper()

$vendas = 0
$custo = 0
$despesas = 0
$qtdVendas = 0

if ($db.historico -and $db.historico.vendas) {
    foreach ($m in $db.historico.vendas) {
        # Simulando dados fictícios ou calculando básico
        # Para este teste, vamos colocar valores de demonstração se estiver vazio
    }
}

# Como é só um TESTE VISUAL pro cliente, vamos enviar com valores fictícios/exemplo bonitos
$msg = "🗓️ *FECHAMENTO MENSAL DETALHADO — TESTE DE LAYOUT ($mesNome)*`n"
$msg += "🏪 *Cesinha Acessórios — StrategyOS*`n`n"
$msg += "📊 *RESUMO FINANCEIRO:*`n"
$msg += "💰 Receita Bruta: R$ 15500.00 (📈 +12.5% vs mês passado)`n"
$msg += "📦 Custo Mercadoria: -R$ 4200.00`n"
$msg += "💸 Despesas Operacionais: -R$ 1300.00`n"
$msg += "---------------------------------------`n"
$msg += "💎 *LUCRO LÍQUIDO REAL*: *R$ 10000.00*`n`n"
$msg += "⚖️ *APURAÇÃO (CAIXA / FUNDOS):*`n"
$msg += "🏪 40% Fundo da Loja: *R$ 4000.00*`n"
$msg += "💜 Cota da Mãe (~35%): *R$ 3480.00*`n"
$msg += "👨‍🦳 Cota do Pai (~25%): *R$ 2520.00*`n`n"
$msg += "🎯 *INSIGHTS E ESTATÍSTICAS:*`n"
$msg += "🛒 Vendas Realizadas: 142 operações`n"
$msg += "🎫 Ticket Médio: R$ 109.15 por venda`n"
$msg += "🔧 Consertos Entregues: 23 OS`n`n"
$msg += "🏆 *Top Produtos Mais Vendidos:*`n"
$msg += "• 15x Película 3D iPhone 13`n"
$msg += "• 12x Cabo Tipo C`n"
$msg += "• 8x Capinha Transparente A54`n`n"
$msg += "🔮 *PROJEÇÃO ANUAL (2026):*`n"
$msg += "Se a loja mantiver a média de R$ 15500.00, o faturamento chegará a *R$ 186000.00* no ano!`n`n"
$msg += "💾 _(Este é um teste de formato. No envio real, o Backup Mensal irá anexado!)_"

$body = @{
    chat_id = $chatId
    text = $msg
    parse_mode = "Markdown"
}
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
$response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$botToken/sendMessage" -Method Post -Body ($body | ConvertTo-Json -Compress) -ContentType "application/json; charset=utf-8"
$response | ConvertTo-Json
