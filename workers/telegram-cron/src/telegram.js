// Envio para o Telegram (texto e documento) executado no servidor Cloudflare

export function destinatarios(env, state, apenasDono = false) {
    const cfg = (state && state.configuracoes) || {};
    const dono = cfg.telegramChatId || env.TELEGRAM_CHAT_DONO;
    const equipe = cfg.telegramChatIdEquipe !== undefined ? cfg.telegramChatIdEquipe : env.TELEGRAM_CHAT_EQUIPE;
    const lista = [dono];
    if (!apenasDono && equipe && equipe !== dono) lista.push(equipe);
    return lista.filter(Boolean);
}

export function tokenBot(env, state) {
    const cfg = (state && state.configuracoes) || {};
    return env.TELEGRAM_TOKEN || cfg.telegramBotToken;
}

export async function enviarMensagem(token, chatId, texto) {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    let resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: texto, parse_mode: 'Markdown' })
    });
    let data = await resp.json();
    if (!data.ok) {
        // Reenvia em texto puro se algum caractere quebrar o Markdown
        resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: texto.replace(/[*_`\[\]]/g, '') })
        });
        data = await resp.json();
    }
    return data;
}

export async function enviarDocumento(token, chatId, conteudo, nomeArquivo, legenda) {
    const form = new FormData();
    form.append('chat_id', String(chatId));
    form.append('caption', legenda);
    form.append('document', new Blob([conteudo], { type: 'application/json' }), nomeArquivo);
    const resp = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, { method: 'POST', body: form });
    return resp.json();
}

export async function enviarParaTodos(token, chats, texto) {
    const resultados = [];
    for (const chat of chats) {
        try {
            const r = await enviarMensagem(token, chat, texto);
            resultados.push({ chat, ok: Boolean(r.ok), erro: r.description || null });
        } catch (e) {
            resultados.push({ chat, ok: false, erro: e.message });
        }
    }
    return resultados;
}
