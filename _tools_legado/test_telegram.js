const token = "8881150678:AAEM162UqJGeZiZQCXEmrkSymXMqUBqee34";
const chatId = "1969798643";
const msg = "🚀 Teste de envio de mensagem direto do servidor Node.js!";

fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: msg })
})
.then(res => res.json())
.then(data => console.log("Resposta Telegram:", data))
.catch(err => console.error("Erro:", err));
