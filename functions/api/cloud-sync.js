// ============================================================================
// STRATEGYOS 3.0 — CLOUDFLARE KV CLOUD DATABASE SYNC & REDUNDANCY VAULT
// Endpoint: /api/cloud-sync
// ============================================================================

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json; charset=utf-8'
};

export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
    try {
        const kv = context.env.STRATEGYOS_DB;
        if (!kv) {
            return new Response(JSON.stringify({ ok: false, error: 'KV binding STRATEGYOS_DB not found' }), {
                status: 500,
                headers: CORS_HEADERS
            });
        }

        const url = new URL(context.request.url);
        if (url.searchParams.get('list') === '1') {
            const listResult = await kv.list({ limit: 1000 });
            return new Response(JSON.stringify({
                ok: true,
                keys: listResult.keys || []
            }), {
                status: 200,
                headers: CORS_HEADERS
            });
        }

        const customKey = url.searchParams.get('key') || 'strategyos_main_state';
        const raw = await kv.get(customKey);
        if (!raw) {
            return new Response(JSON.stringify({ ok: true, empty: true, key: customKey, payload: null }), {
                status: 200,
                headers: CORS_HEADERS
            });
        }

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (e) {
            return new Response(JSON.stringify({ ok: true, key: customKey, raw }), {
                status: 200,
                headers: CORS_HEADERS
            });
        }

        return new Response(JSON.stringify({
            ok: true,
            empty: false,
            key: customKey,
            updated_at: parsed.updated_at,
            payload: parsed.payload !== undefined ? parsed.payload : parsed
        }), {
            status: 200,
            headers: CORS_HEADERS
        });
    } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), {
            status: 500,
            headers: CORS_HEADERS
        });
    }
}

function mesclarArraysUnicos(arrAntigo = [], arrNovo = [], getKey, idsRemovidos = new Set()) {
    const mapa = new Map();
    (Array.isArray(arrAntigo) ? arrAntigo : []).forEach(item => {
        if (!item) return;
        const k = getKey(item);
        if (k && !idsRemovidos.has(String(item.id || k))) mapa.set(k, item);
    });
    (Array.isArray(arrNovo) ? arrNovo : []).forEach(item => {
        if (!item) return;
        const k = getKey(item);
        if (k && !idsRemovidos.has(String(item.id || k))) mapa.set(k, item);
    });
    return Array.from(mapa.values());
}

export async function onRequestPost(context) {
    try {
        const kv = context.env.STRATEGYOS_DB;
        if (!kv) {
            return new Response(JSON.stringify({ ok: false, error: 'KV binding STRATEGYOS_DB not found' }), {
                status: 500,
                headers: CORS_HEADERS
            });
        }

        const body = await context.request.json();
        const incomingPayload = body.payload || body;
        const forceOverwrite = Boolean(body.forceOverwrite);
        const nowIso = new Date().toISOString();
        const dateKey = nowIso.substring(0, 10);

        let finalPayload = incomingPayload;

        // Proteção Server-Side Anti-Perda de Vendas: mesclar com o estado atual da nuvem
        if (!forceOverwrite && incomingPayload && typeof incomingPayload === 'object') {
            try {
                const existingRaw = await kv.get('strategyos_main_state');
                if (existingRaw) {
                    const existingParsed = JSON.parse(existingRaw);
                    const oldP = existingParsed && existingParsed.payload;
                    if (oldP && typeof oldP === 'object') {
                        const removidos = new Set([
                            ...(Array.isArray(oldP._idsEstornados) ? oldP._idsEstornados.map(String) : []),
                            ...(Array.isArray(incomingPayload._idsEstornados) ? incomingPayload._idsEstornados.map(String) : [])
                        ]);
                        finalPayload._idsEstornados = Array.from(removidos);

                        // 1. União de histórico de vendas
                        if (!finalPayload.historico) finalPayload.historico = { vendas: [], compras: [], movimentacoes: [] };
                        finalPayload.historico.vendas = mesclarArraysUnicos(
                            oldP.historico?.vendas,
                            incomingPayload.historico?.vendas,
                            v => String(v.id || `${(v.data || '').substring(0, 16)}_${v.produto || ''}_${v.valorVenda || v.valorBruto || v.liquido || v.valor || 0}`),
                            removidos
                        );

                        // 2. União de movimentações de caixa
                        finalPayload.movimentacoesCaixa = mesclarArraysUnicos(
                            oldP.movimentacoesCaixa,
                            incomingPayload.movimentacoesCaixa,
                            m => String(m.id || `${(m.data || '').substring(0, 16)}_${m.tipo || ''}_${m.valor || 0}_${(m.descricao || '').substring(0, 25)}`),
                            removidos
                        );

                        // 3. União de Ordens de Serviço
                        if (!finalPayload.assistencia) finalPayload.assistencia = { ordensServico: [], proximoNumero: 1 };
                        finalPayload.assistencia.ordensServico = mesclarArraysUnicos(
                            oldP.assistencia?.ordensServico,
                            incomingPayload.assistencia?.ordensServico,
                            o => 'OS_' + String(o.numero || o.id || ''),
                            removidos
                        ).sort((a, b) => (b.numero || 0) - (a.numero || 0));

                        const maxOS = finalPayload.assistencia.ordensServico.reduce((m, o) => Math.max(m, Number(o.numero) || 0), 0);
                        finalPayload.assistencia.proximoNumero = Math.max(
                            Number(oldP.assistencia?.proximoNumero) || 1,
                            Number(incomingPayload.assistencia?.proximoNumero) || 1,
                            maxOS + 1
                        );

                        // 4. União de Clientes
                        finalPayload.clientes = mesclarArraysUnicos(
                            oldP.clientes,
                            incomingPayload.clientes,
                            c => (c.nome || '').toLowerCase().trim()
                        );
                    }
                }
            } catch (eMerge) {
                // Em caso de falha no parse antigo, segue com incomingPayload
            }
        }

        const record = JSON.stringify({
            updated_at: nowIso,
            payload: finalPayload
        });

        // 1. Salvar estado principal em tempo real
        await kv.put('strategyos_main_state', record);

        // 2. Salvar snapshot diário redundante na nuvem (retenção de 90 dias)
        await kv.put(`strategyos_snapshot_${dateKey}`, record, {
            expirationTtl: 90 * 24 * 3600
        });

        return new Response(JSON.stringify({
            ok: true,
            updated_at: nowIso,
            snapshot_key: `strategyos_snapshot_${dateKey}`,
            vendas_count: finalPayload?.historico?.vendas?.length || 0,
            movs_count: finalPayload?.movimentacoesCaixa?.length || 0
        }), {
            status: 200,
            headers: CORS_HEADERS
        });
    } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), {
            status: 500,
            headers: CORS_HEADERS
        });
    }
}
