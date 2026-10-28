// ============================================================================
// STRATEGYOS — AGENDADOR DO TELEGRAM NO SERVIDOR (Cloudflare Worker + Cron)
// • Fechamento de caixa automático todo dia às 18:00 (horário da Bahia)
// • Resumo do ciclo mensal todo dia 6 às 08:00 (Caixa Principal, Gaveta e Meta)
// Cada envio é registrado no KV para nunca duplicar (fim das mensagens fantasmas).
// ============================================================================
import { hojeLocal, diaSemanaLocal, DIA_ZERAMENTO } from './datas.js';
import { montarFechamentoDiario, montarResumoCiclo } from './relatorios.js';
import { destinatarios, tokenBot, enviarParaTodos, enviarDocumento } from './telegram.js';

const CHAVE_ESTADO = 'strategyos_main_state';

async function lerEstado(env) {
    const raw = await env.STRATEGYOS_DB.get(CHAVE_ESTADO);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { state: parsed.payload || {}, raw: JSON.stringify(parsed.payload || {}) };
}

async function executarFechamento(env, { force = false, dry = false, apenasDono = false } = {}) {
    const ymd = hojeLocal();
    const chaveEnvio = `tg_fechamento_${ymd}`;
    if (!force && await env.STRATEGYOS_DB.get(chaveEnvio)) return { ignorado: 'já enviado hoje', ymd };

    const dados = await lerEstado(env);
    if (!dados) return { erro: 'estado não encontrado no KV' };
    const { state, raw } = dados;
    if (state.configuracoes && state.configuracoes.telegramAutoFechamento === false && !force) {
        return { ignorado: 'fechamento automático desativado nas configurações' };
    }

    const rel = montarFechamentoDiario(state, ymd);
    // Domingo sem vendas: não envia nada
    if (!force && diaSemanaLocal() === 0 && rel.qtdVendas === 0) return { ignorado: 'domingo sem vendas' };
    if (dry) return { dry: true, ymd, texto: rel.texto };

    const token = tokenBot(env, state);
    const resultados = await enviarParaTodos(token, destinatarios(env, state, apenasDono), rel.texto);
    const dono = destinatarios(env, state, true)[0];
    const doc = await enviarDocumento(token, dono, raw, `StrategyOS_Backup_Cesinha_${ymd}.json`, `💾 BACKUP AUTOMÁTICO STRATEGYOS — ${ymd}`);

    const algumOk = resultados.some(r => r.ok);
    if (algumOk && !force) {
        await env.STRATEGYOS_DB.put(chaveEnvio, new Date().toISOString(), { expirationTtl: 40 * 24 * 3600 });
    }
    return { ymd, resultados, backup: Boolean(doc.ok) };
}

async function executarResumoCiclo(env, { force = false, dry = false, apenasDono = false } = {}) {
    const ymd = hojeLocal();
    const dia = parseInt(ymd.substring(8, 10), 10);
    if (!force && dia !== DIA_ZERAMENTO) return { ignorado: `hoje não é dia ${DIA_ZERAMENTO}` };

    const chaveEnvio = `tg_ciclo_${ymd.substring(0, 7)}`;
    if (!force && await env.STRATEGYOS_DB.get(chaveEnvio)) return { ignorado: 'resumo do ciclo já enviado' };

    const dados = await lerEstado(env);
    if (!dados) return { erro: 'estado não encontrado no KV' };
    const rel = montarResumoCiclo(dados.state, ymd);
    if (dry) return { dry: true, ymd, texto: rel.texto };

    const token = tokenBot(env, dados.state);
    const resultados = await enviarParaTodos(token, destinatarios(env, dados.state, apenasDono), rel.texto);
    if (resultados.some(r => r.ok) && !force) {
        await env.STRATEGYOS_DB.put(chaveEnvio, new Date().toISOString(), { expirationTtl: 400 * 24 * 3600 });
    }
    return { ymd, resultados };
}

export default {
    async scheduled(event, env, ctx) {
        // 11:00 UTC = 08:00 Bahia (resumo do ciclo do dia 6)
        // 21:00 UTC = 18:00 Bahia (fechamento diário) | 23:00 UTC = nova tentativa caso falhe
        if (event.cron === '0 11 * * *') {
            ctx.waitUntil(executarResumoCiclo(env));
        } else {
            ctx.waitUntil(executarFechamento(env));
        }
    },

    async fetch(request, env) {
        const url = new URL(request.url);
        if (!env.CHAVE_ADMIN || url.searchParams.get('key') !== env.CHAVE_ADMIN) {
            return new Response(JSON.stringify({ ok: false, erro: 'não autorizado' }), { status: 401 });
        }
        const opcoes = {
            force: url.searchParams.get('force') === '1',
            dry: url.searchParams.get('dry') === '1',
            apenasDono: url.searchParams.get('dono') === '1'
        };
        const tipo = url.searchParams.get('tipo') || 'fechamento';
        const resultado = tipo === 'ciclo' ? await executarResumoCiclo(env, opcoes) : await executarFechamento(env, opcoes);
        return new Response(JSON.stringify({ ok: true, tipo, resultado }, null, 2), {
            headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
    }
};
