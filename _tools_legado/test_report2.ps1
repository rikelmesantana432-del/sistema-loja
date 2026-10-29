$botToken = "8881150678:AAEM162UqJGeZiZQCXEmrkSymXMqUBqee34"
$chatId = "1969798643"

$agora = Get-Date
$mesNome = $agora.ToString("MMMM 'de' yyyy", [cultureinfo]::GetCultureInfo("pt-BR")).ToUpper()

$msg = "*FECHAMENTO MENSAL DETALHADO - TESTE DE LAYOUT ($mesNome)*`n"
$msg += "*Cesinha Acessorios - StrategyOS*`n`n"
$msg += "*RESUMO FINANCEIRO:*`n"
$msg += "Receita Bruta: R$ 15500.00 (+12.5% vs mes passado)`n"
$msg += "Custo Mercadoria: -R$ 4200.00`n"
$msg += "Despesas Operacionais: -R$ 1300.00`n"
$msg += "---------------------------------------`n"
$msg += "*LUCRO LIQUIDO REAL*: *R$ 10000.00*`n`n"
$msg += "*APURACAO (CAIXA E FUNDOS):*`n"
$msg += "40% Fundo da Loja: *R$ 4000.00*`n"
$msg += "Cota da Mae (~35%): *R$ 3480.00*`n"
$msg += "Cota do Pai (~25%): *R$ 2520.00*`n`n"
$msg += "*INSIGHTS E ESTATISTICAS:*`n"
$msg += "Vendas Realizadas: 142 operacoes`n"
$msg += "Ticket Medio: R$ 109.15 por venda`n"
$msg += "Consertos Entregues: 23 OS`n`n"
$msg += "*Top Produtos Mais Vendidos:*`n"
$msg += "- 15x Pelicula 3D iPhone 13`n"
$msg += "- 12x Cabo Tipo C`n"
$msg += "- 8x Capinha Transparente A54`n`n"
$msg += "*PROJECAO ANUAL (2026):*`n"
$msg += "Se a loja mantiver a media de R$ 15500.00, o faturamento chegara a *R$ 186000.00* no ano!`n`n"
$msg += "_(Este e um teste de layout enviado via Localhost. O sistema real incluira emojis!)_"

$body = @{
    chat_id = $chatId
    text = $msg
    parse_mode = "Markdown"
}
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
$response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$botToken/sendMessage" -Method Post -Body ($body | ConvertTo-Json -Compress) -ContentType "application/json; charset=utf-8"
$response | ConvertTo-Json
