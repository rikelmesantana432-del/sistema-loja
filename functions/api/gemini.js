// ============================================================================
// STRATEGYOS 3.1 — PROXY SEGURO GOOGLE GEMINI 2.5 FLASH (CLOUDFLARE PAGES)
// Endpoint: /api/gemini
// A chave GEMINI_API_KEY permanece criptografada nos Secrets do Cloudflare.
// ============================================================================

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8'
};

const ALLOWED_MODELS = new Set([
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash'
]);

const DEFAULT_MODEL = 'gemini-2.5-flash';

function jsonResponse(payload, status = 200) {
    return new Response(JSON.stringify(payload), { status, headers: CORS_HEADERS });
}

export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
    const hasKey = Boolean(context.env && context.env.GEMINI_API_KEY);
    return jsonResponse({
        ok: true,
        configured: hasKey,
        model: DEFAULT_MODEL
    }, 200);
}

export async function onRequestPost(context) {
    try {
        const apiKey = context.env && context.env.GEMINI_API_KEY;
        if (!apiKey) {
            return jsonResponse({ ok: false, error: 'GEMINI_API_KEY não configurada no servidor Cloudflare.' }, 503);
        }

        let body = {};
        try {
            body = await context.request.json();
        } catch (e) {
            return jsonResponse({ ok: false, error: 'JSON inválido na requisição.' }, 400);
        }

        const requestedModel = String(body.model || DEFAULT_MODEL).trim();
        const model = ALLOWED_MODELS.has(requestedModel) ? requestedModel : DEFAULT_MODEL;

        let contents = Array.isArray(body.contents) ? body.contents : null;
        if (!contents) {
            const prompt = String(body.prompt || '').trim();
            if (!prompt) {
                return jsonResponse({ ok: false, error: 'Campo "prompt" obrigatório.' }, 400);
            }
            if (prompt.length > 24000) {
                return jsonResponse({ ok: false, error: 'Prompt excede o limite de segurança (24.000 caracteres).' }, 400);
            }
            contents = [{ role: 'user', parts: [{ text: prompt }] }];
        }

        const rawGen = body.generationConfig || {};
        const tempNum = Number(body.temperature ?? rawGen.temperature ?? 0.45);
        const maxTok = Number(body.maxOutputTokens ?? rawGen.maxOutputTokens ?? 600);
        const generationConfig = {
            temperature: Number.isFinite(tempNum) ? Math.min(Math.max(tempNum, 0), 1.5) : 0.45,
            maxOutputTokens: Number.isFinite(maxTok) ? Math.min(Math.max(Math.round(maxTok), 32), 2048) : 600
        };

        const upstream = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                body: JSON.stringify({ contents, generationConfig })
            }
        );

        const upstreamJson = await upstream.json().catch(() => ({}));
        if (!upstream.ok) {
            const errMsg = upstreamJson?.error?.message || `Erro HTTP ${upstream.status} da API Gemini.`;
            return jsonResponse({ ok: false, error: errMsg }, upstream.status);
        }

        const text = upstreamJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const finishReason = upstreamJson?.candidates?.[0]?.finishReason || '';
        return jsonResponse({
            ok: true,
            model,
            text,
            finishReason
        }, 200);
    } catch (err) {
        return jsonResponse({ ok: false, error: err?.message || 'Erro interno ao consultar Gemini.' }, 500);
    }
}
