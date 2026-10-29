$botToken = "8881150678:AAEM162UqJGeZiZQCXEmrkSymXMqUBqee34"
$chatId = "1969798643"
$body = @{
    chat_id = $chatId
    text = "Teste de envio de mensagem direto do servidor Localhost!"
}
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
$response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$botToken/sendMessage" -Method Post -Body ($body | ConvertTo-Json -Compress) -ContentType "application/json; charset=utf-8"
$response | ConvertTo-Json
