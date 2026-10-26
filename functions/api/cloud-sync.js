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

        const raw = await kv.get('strategyos_main_state');
        if (!raw) {
            return new Response(JSON.stringify({ ok: true, empty: true, payload: null }), {
                status: 200,
                headers: CORS_HEADERS
            });
        }

        const parsed = JSON.parse(raw);
        return new Response(JSON.stringify({
            ok: true,
            empty: false,
            updated_at: parsed.updated_at,
            payload: parsed.payload
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
        const payload = body.payload || body;
        const nowIso = new Date().toISOString();
        const dateKey = nowIso.substring(0, 10);

        const record = JSON.stringify({
            updated_at: nowIso,
            payload
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
            snapshot_key: `strategyos_snapshot_${dateKey}`
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
