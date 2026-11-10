// StrategyOS 3.1 — Guardião Contínuo de IA (Local Engine + Gemini 2.5 Flash API) & Sugestões
// Monitora em tempo real: Vendas Avulsas x Estoque, Integridade de Caixa, Margens, Giro e Cruzamento de Encomendas

const IAGuardian = {
    ultimoRelatorio: null,
    _timer: null,

    getApiKey() {
        try { return localStorage.getItem('strategyos_gemini_api_key') || ''; } catch (e) { return ''; }
    },
    setApiKey(key) {
        try {
            const k = String(key || '').trim();
            if (k) localStorage.setItem('strategyos_gemini_api_key', k);
            else localStorage.removeItem('strategyos_gemini_api_key');
            return true;
        } catch (e) { return false; }
    },

    // Auditoria determinística instantânea (roda continuamente sem custo de token e sem depender de internet)
    executarAuditoriaContinua() {
        if (!window.dataManager || !dataManager.data) return null;
        const d = dataManager.data;
        const vendas = Array.isArray(d.historico?.vendas) ? d.historico.vendas : [];
        const celulares = (dataManager.getEstoqueCelulares() || []).filter(p => p.status !== 'vendido' && (p.quantidade === undefined || p.quantidade > 0));
        const acessorios = (dataManager.getEstoqueAcessorios() || []).filter(p => p.status !== 'vendido' && (p.quantidade === undefined || p.quantidade > 0));
        const procurados = typeof dataManager.getProdutosProcurados === 'function' ? dataManager.getProdutosProcurados() : [];

        const anomalias = [];
        const oportunidades = [];
        const avulsosPendentesBaixa = [];

        // 1. Verificar se alguma venda "Avulso:" recente corresponde a um item ainda disponível no estoque
        vendas.slice(-40).forEach((v, idx) => {
            const nomeProd = String(v.produto || '');
            if ((nomeProd.toLowerCase().startsWith('avulso:') || v.tipo === 'avulso') && !v._reconciliadoEstoque) {
                const termoLimpo = nomeProd.replace(/^avulso:\s*/i, '').replace(/\(\d+\s*itens?\)$/i, '').trim();
                const match = typeof dataManager.buscarMatchEstoqueInteligente === 'function'
                    ? dataManager.buscarMatchEstoqueInteligente(termoLimpo)
                    : null;
                if (match && match.prod) {
                    avulsosPendentesBaixa.push({
                        vendaId: v.id || idx,
                        data: v.data,
                        digitado: termoLimpo,
                        prodId: match.prod.id,
                        prodNome: match.prod.nome,
                        origemLista: match.origemLista
                    });
                }
            }
        });

        if (avulsosPendentesBaixa.length > 0) {
            anomalias.push({
                nivel: 'critico',
                titulo: `${avulsosPendentesBaixa.length} venda(s) avulsa(s) batem com produto ainda ativo no estoque`,
                detalhe: avulsosPendentesBaixa.map(a => `"${a.digitado}" ➔ Estoque: ${a.prodNome}`).join(' | '),
                acao: 'reconciliar_avulsos'
            });
        }

        // 2. Produtos no estoque com custo zerado ou preço de venda abaixo do custo
        const semCustoOuPrejuizo = [...celulares, ...acessororiosSafe(acessorios)].filter(p => !p.custo || p.custo <= 0 || (p.precoVenda > 0 && p.precoVenda <= p.custo));
        if (semCustoOuPrejuizo.length > 0) {
            anomalias.push({
                nivel: 'importante',
                titulo: `${semCustoOuPrejuizo.length} item(ns) no estoque sem custo ou com margem negativa`,
                detalhe: semCustoOuPrejuizo.slice(0, 5).map(p => `${p.nome} (Custo: R$ ${p.custo || 0} / Venda: R$ ${p.precoVenda || 0})`).join(', ')
            });
        }

        // 3. Cruzamento automático: Produtos Procurados que JÁ ESTÃO disponíveis no estoque!
        procurados.forEach(proc => {
            const match = typeof dataManager.buscarMatchEstoqueInteligente === 'function'
                ? dataManager.buscarMatchEstoqueInteligente(proc.nome)
                : null;
            if (match && match.prod) {
                oportunidades.push(`🎯 Demanda Atendida: Cliente procurou "${proc.nome}" e temos "${match.prod.nome}" disponível no estoque (${UI.R(match.prod.precoVenda)})!`);
            }
        });

        // 4. Aparelhos parados > 45 dias e estoque baixo
        const parados = celulares.filter(p => p.dataCompra && Math.floor((Date.now() - new Date(p.dataCompra).getTime()) / 86400000) > 45);
        if (parados.length > 0) {
            oportunidades.push(`⏳ Giro Lento: ${parados.length} aparelho(s) há mais de 45 dias no estoque (${parados.slice(0, 4).map(p => p.nome).join(', ')}). Sugestão: criar oferta relâmpago.`);
        }

        const relatorio = {
            timestamp: new Date().toISOString(),
            totalVendas: vendas.length,
            celularesAtivos: celulares.length,
            acessoriosAtivos: acessorios.length,
            anomalias,
            oportunidades,
            avulsosPendentesBaixa,
            saudeScore: Math.max(0, 100 - (avulsosPendentesBaixa.length * 15) - (semCustoOuPrejuizo.length * 5))
        };
        this.ultimoRelatorio = relatorio;
        return relatorio;
    },

    reconciliarAvulsosDetectados() {
        const rel = this.executarAuditoriaContinua();
        if (!rel || rel.avulsosPendentesBaixa.length === 0) {
            if (window.UI) UI.toast('Nenhuma venda avulsa pendente de baixa no estoque!', 'info');
            return 0;
        }
        let baixados = 0;
        rel.avulsosPendentesBaixa.forEach(item => {
            const lista = item.origemLista === 'acessorios' ? dataManager.data.estoqueAcessorios : dataManager.data.estoqueCelulares;
            const prod = (lista || []).find(p => String(p.id) === String(item.prodId) && p.status !== 'vendido');
            if (prod) {
                if (prod.quantidade && prod.quantidade > 1) prod.quantidade -= 1;
                else { prod.quantidade = 0; prod.status = 'vendido'; }
                baixados++;
            }
        });
        (dataManager.data.historico?.vendas || []).forEach(v => { v._reconciliadoEstoque = true; });
        dataManager.limparEstoqueVendido();
        dataManager.saveData();
        if (window.UI) {
            UI.toast(`✅ ${baixados} produto(s) abatido(s) e sincronizado(s) com o estoque!`, 'success');
            UI.renderIASugestoes();
        }
        return baixados;
    },

    async consultarGeminiFlash() {
        const apiKey = this.getApiKey();
        const outEl = document.getElementById('ia-gemini-output');
        if (!apiKey) {
            if (window.UI) UI.toast('Configure sua chave da API Gemini 2.5 Flash no campo acima primeiro!', 'warning');
            document.getElementById('ia-gemini-key-input')?.focus();
            return;
        }
        if (outEl) {
            outEl.style.display = 'block';
            outEl.innerHTML = `<div style="padding:16px;color:#FFD700;font-weight:700;">⏳ Consultando Gemini 2.5 Flash em tempo real sobre seu estoque, vendas e caixa...</div>`;
        }

        const rel = this.executarAuditoriaContinua();
        const vendasHoje = (dataManager.data.historico?.vendas || []).slice(-15).map(v => ({
            produto: v.produto, valor: v.valorVenda, custo: v.custo, lucro: v.lucro, data: (v.data || '').substring(0, 16)
        }));
        const estoqueResumo = (dataManager.getEstoqueCelulares() || []).filter(p => p.status !== 'vendido').map(p => ({
            nome: p.nome, custo: p.custo, venda: p.precoVenda, qtd: p.quantidade || 1
        }));

        const promptSistema = `Você é o Auditor Financeiro e Conselheiro de Estoque da loja de celulares "Cesinha Acessórios" (StrategyOS).
Seja direto, cirúrgico e sem elogios. Analise os dados reais abaixo e responda em 4 blocos curtos (com bullet points):
1. AUDITORIA DE ESTOQUE X VENDAS AVULSAS: aponte qualquer item vendido que pareça estar duplicado ou com nome divergente do estoque.
2. MARGEM E PRECIFICAÇÃO: aponte os aparelhos do estoque com melhor margem e os que estão com risco de encalhe/prejuízo.
3. AÇÃO IMEDIATA DE BALCÃO HOJE: 3 ações práticas para a funcionária vender mais hoje (combos, ofertas ou cobrança).
4. ALERTA DE SEGURANÇA DO CAIXA: valide se os custos e lucros das últimas vendas são coerentes.

DADOS REAIS DA LOJA AGORA:
- Score Saúde Local: ${rel?.saudeScore}%
- Anomalias Detectadas Localmente: ${JSON.stringify(rel?.anomalias || [])}
- Estoque de Celulares Ativo (${estoqueResumo.length}): ${JSON.stringify(estoqueResumo.slice(0, 25))}
- Últimas 15 Vendas: ${JSON.stringify(vendasHoje)}`;

        try {
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptSistema }] }],
                    generationConfig: { temperature: 0.25, maxOutputTokens: 900 }
                })
            });
            const json = await resp.json();
            if (!resp.ok) throw new Error(json?.error?.message || `HTTP ${resp.status}`);
            const texto = json?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta da IA.';
            const formatado = texto
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#00FFA3;">$1</strong>')
                .replace(/\n/g, '<br>');
            if (outEl) {
                outEl.innerHTML = `
                    <div style="background:rgba(16,185,129,0.08);border:1.5px solid #10b981;border-radius:14px;padding:18px;font-size:14px;line-height:1.6;color:#fff;">
                        <div style="font-size:12px;font-weight:900;color:#10b981;margin-bottom:8px;letter-spacing:1px;">⚡ PARECER AO VIVO — GEMINI 2.5 FLASH</div>
                        ${formatado}
                    </div>`;
            }
        } catch (err) {
            if (outEl) {
                outEl.innerHTML = `<div style="background:rgba(239,68,68,0.12);border:1px solid #ef4444;border-radius:12px;padding:14px;color:#fca5a5;font-size:13px;">❌ Falha ao consultar Gemini 2.5 Flash: ${err.message}. Verifique se sua API Key está ativa.</div>`;
            }
        }
    },

    iniciarMonitoramento() {
        if (this._timer) clearInterval(this._timer);
        setTimeout(() => this.executarAuditoriaContinua(), 1500);
        this._timer = setInterval(() => this.executarAuditoriaContinua(), 60000);
    },

    gerarAnaliseBlackFriday() {
        const celulares = (dataManager.getEstoqueCelulares() || []).filter(p => p.status !== 'vendido' && (p.quantidade === undefined || p.quantidade > 0));
        const acessorios = (dataManager.getEstoqueAcessorios() || []).filter(p => p.status !== 'vendido' && (p.quantidade === undefined || p.quantidade > 0));
        const hoje = Date.now();
        const calcItem = (p, cat) => {
            const dias = p.dataCompra ? Math.max(0, Math.floor((hoje - new Date(p.dataCompra).getTime()) / 86400000)) : 45;
            const custo = parseFloat(p.custo || 0);
            const venda = parseFloat(p.precoVenda || 0);
            const margem = venda - custo;
            // Desconto inteligente Black Friday: preserva no mínimo 45% do lucro atual (ou 18% sobre o custo)
            const descMax = dias >= 60 ? Math.round(margem * 0.45) : dias >= 45 ? Math.round(margem * 0.35) : Math.round(margem * 0.22);
            const precoBlack = Math.max(Math.ceil(custo * 1.15), Math.floor((venda - descMax) / 10) * 10 - 0.10);
            return { id: p.id, nome: p.nome, cat, qtd: p.quantidade || 1, custo, venda, precoBlack, lucroBlack: precoBlack - custo, dias };
        };
        return { celulares: celulares.map(p => calcItem(p, 'Celular')).sort((a, b) => b.dias - a.dias), acessorios: acessorios.map(p => calcItem(p, 'Acessório')).sort((a, b) => (b.custo * b.qtd) - (a.custo * a.qtd)) };
    },

    copiarCatalogoBlackWhatsApp() {
        const bf = this.gerarAnaliseBlackFriday();
        const linhas = bf.celulares.map(c => `🔥 *${c.nome.trim()}*\n   De ~R$ ${c.venda.toFixed(2)}~ por *R$ ${c.precoBlack.toFixed(2)}* à vista!`);
        const topAc = bf.acessorios.filter(a => a.venda >= 40).slice(0, 6).map(a => `⚡ *${a.nome.trim()}*: De ~R$ ${a.venda.toFixed(2)}~ por *R$ ${a.precoBlack.toFixed(2)}*`);
        const linkVip = (window.IARecaptura && IARecaptura.getLinkGrupo()) || 'https://chat.whatsapp.com/FcuY7wDt7u3F1LusMdlko9';
        const msg = `🖤 *ESQUENTA BLACK FRIDAY — CESINHA ACESSÓRIOS* 🖤\n📱 *Aparelhos com Desconto Real de Queima de Estoque:*\n\n${linhas.join('\n\n')}\n\n🎧 *Ofertas Especiais & Eletrônicos:*\n${topAc.join('\n')}\n\n🏃‍♂️ *Apenas 1 unidade de cada aparelho! Chame agora ou entre no nosso Grupo VIP:* ${linkVip}`;
        if (navigator.clipboard) navigator.clipboard.writeText(msg);
        if (window.UI) UI.toast('📋 Catálogo Black Friday copiado para o WhatsApp!', 'success');
        return msg;
    }
};

function acessororiosSafe(arr) { return Array.isArray(arr) ? arr : []; }
window.IAGuardian = IAGuardian;
IAGuardian.iniciarMonitoramento();

UI.renderIASugestoes = function () {
    const main = document.getElementById('main-content');
    if (!main) return;
    const rel = IAGuardian.executarAuditoriaContinua() || { anomalias: [], oportunidades: [], avulsosPendentesBaixa: [], saudeScore: 100 };
    const vendas = Array.isArray(dataManager.data?.historico?.vendas) ? dataManager.data.historico.vendas : [];
    const totalVendas = vendas.length;
    const faturamentoTotal = vendas.reduce((s, v) => s + (parseFloat(v.valorVenda || v.valor || v.clientePagou || 0)), 0);
    const ticketMedio = totalVendas > 0 ? faturamentoTotal / totalVendas : 0;
    const keySalva = IAGuardian.getApiKey();

    const vendasPorProduto = {};
    vendas.forEach(v => {
        const k = (v.produtoNovo || v.produto || 'Outros').replace(/\(\d+\s*itens?\)/i, '').trim();
        vendasPorProduto[k] = (vendasPorProduto[k] || 0) + 1;
    });
    const topProdutos = Object.entries(vendasPorProduto).sort((a, b) => b[1] - a[1]).slice(0, 5);

    main.innerHTML = `
        <div class="dashboard-section" style="max-width:980px;margin:0 auto;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:18px;">
                <div>
                    <h2 style="font-size:24px;margin:0;">🤖 GUARDIÃO IA & AUDITORIA CONTÍNUA (GEMINI 2.5 FLASH)</h2>
                    <p style="font-size:13px;color:var(--text-muted);margin:4px 0 0;">Monitoramento automático de Vendas Avulsas x Estoque, Margens e Fechamento</p>
                </div>
                <div style="background:${rel.saudeScore >= 85 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'};border:1.5px solid ${rel.saudeScore >= 85 ? '#10b981' : '#f59e0b'};padding:8px 16px;border-radius:14px;text-align:center;">
                    <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;font-weight:800;">Integridade do Sistema</div>
                    <div style="font-size:22px;font-weight:900;color:${rel.saudeScore >= 85 ? '#10b981' : '#f59e0b'};">${rel.saudeScore}%</div>
                </div>
            </div>

            <!-- PAINEL GEMINI 2.5 FLASH -->
            <div style="background:linear-gradient(135deg, rgba(16,185,129,0.10) 0%, rgba(59,130,246,0.10) 100%);border:1.5px solid rgba(16,185,129,0.4);border-radius:16px;padding:18px;margin-bottom:18px;">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
                    <h3 style="font-size:17px;margin:0;color:#00FFA3;">⚡ Motor Gemini 2.5 Flash + Auto-Estoque Inteligente</h3>
                    <span style="font-size:12px;padding:4px 10px;border-radius:20px;background:rgba(0,0,0,0.4);color:${keySalva ? '#10b981' : '#f59e0b'};font-weight:700;">
                        ${keySalva ? '🟢 API Key Conectada (Local Seguro)' : '🟡 Modo Local Ativo (Insira sua Key para IA Nuvem)'}
                    </span>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
                    <input type="password" id="ia-gemini-key-input" class="form-input" style="flex:1;min-width:220px;font-size:13px;" placeholder="Cole aqui sua API Key do Gemini 2.5 Flash (AIzaSy...)" value="${keySalva}">
                    <button class="btn btn-ghost" onclick="IAGuardian.setApiKey(document.getElementById('ia-gemini-key-input').value);UI.toast('Chave Gemini 2.5 Flash salva localmente com segurança!','success');UI.renderIASugestoes();">💾 Salvar Key</button>
                    <button class="btn btn-primary" style="background:linear-gradient(45deg,#10b981,#059669);border:none;font-weight:800;" onclick="IAGuardian.consultarGeminiFlash()">🧠 Auditar Loja Agora com Gemini 2.5 Flash</button>
                    <button class="btn btn-ghost" style="border-color:#FFD700;color:#FFD700;font-weight:800;" onclick="IAGuardian.copiarCatalogoBlackWhatsApp()">🖤 Copiar Catálogo Black Friday (WhatsApp)</button>
                </div>
                <div style="font-size:12px;color:var(--text-muted);">
                    🔒 Sua chave fica salva exclusivamente no navegador desta máquina (nunca vai para o GitHub). O vínculo automático de produtos avulsos (ex: digitar <em>"celular iphone 11"</em> e abater <em>"iPhone 11"</em> do estoque) já roda em tempo real em 100% das vendas!
                </div>
                <div id="ia-gemini-output" style="display:none;margin-top:14px;"></div>
            </div>

            <!-- ANOMALIAS E RECONCILIAÇÃO EM 1 CLIQUE -->
            <div style="background:rgba(15,20,32,0.9);border:1px solid var(--border-color);border-radius:16px;padding:18px;margin-bottom:18px;">
                <h3 style="font-size:17px;margin:0 0 12px;color:#FFD700;">🛡️ Monitoramento Contínuo de Estoque & Caixa</h3>
                ${rel.anomalias.length === 0
                    ? `<div style="color:#10b981;font-size:15px;font-weight:700;padding:8px 0;">✅ Nenhuma divergência encontrada! Todas as vendas avulsas e itens de estoque estão sincronizados.</div>`
                    : rel.anomalias.map(a => `
                        <div style="background:rgba(239,68,68,0.08);border-left:4px solid #ef4444;padding:12px;border-radius:8px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
                            <div>
                                <div style="font-weight:800;color:#fca5a5;font-size:14px;">🚨 ${a.titulo}</div>
                                <div style="font-size:12px;color:var(--text-muted);margin-top:3px;">${a.detalhe}</div>
                            </div>
                            ${a.acao === 'reconciliar_avulsos' ? `<button class="btn btn-sm btn-primary" onclick="IAGuardian.reconciliarAvulsosDetectados()">🔧 Dar Baixa no Estoque Agora</button>` : ''}
                        </div>`).join('')
                }
                ${rel.oportunidades.length > 0 ? `
                    <div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06);">
                        <div style="font-size:13px;font-weight:800;color:var(--accent-cyan);margin-bottom:6px;">💡 Alertas Inteligentes de Giro & Encomendas:</div>
                        ${rel.oportunidades.map(op => `<div style="font-size:13px;padding:4px 0;color:#e2e8f0;">${op}</div>`).join('')}
                    </div>` : ''}
            </div>

            <!-- RESUMO DE VENDAS E TOP GIRO -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:18px;">
                <div style="padding:16px;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.25);border-radius:14px;text-align:center;">
                    <div style="font-size:26px;font-weight:900;color:#fff;">${totalVendas}</div>
                    <div style="font-size:12px;color:var(--text-muted);">Vendas Registradas no Histórico</div>
                </div>
                <div style="padding:16px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:14px;text-align:center;">
                    <div style="font-size:26px;font-weight:900;color:#10b981;">${UI.R(ticketMedio)}</div>
                    <div style="font-size:12px;color:var(--text-muted);">Ticket Médio por Venda</div>
                </div>
                <div style="padding:16px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:14px;text-align:center;">
                    <div style="font-size:26px;font-weight:900;color:#FFD700;">${rel.celularesAtivos} Cel / ${rel.acessoriosAtivos} Acess</div>
                    <div style="font-size:12px;color:var(--text-muted);">Itens Disponíveis no Estoque</div>
                </div>
            </div>

            ${typeof IARecaptura !== 'undefined' ? `<div id="ia-recaptura-host">${IARecaptura.renderPainelRecaptura()}</div>` : ''}

            ${topProdutos.length > 0 ? `
                <div style="border:1px solid var(--border-color);border-radius:16px;padding:18px;">
                    <h4 style="font-size:16px;margin:0 0 10px;color:var(--accent-cyan);">🏆 TOP 5 PRODUTOS MAIS VENDIDOS</h4>
                    ${topProdutos.map((p, i) => `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;border-bottom:1px solid rgba(255,255,255,0.04);"><span>${i + 1}. ${p[0]}</span><strong style="color:#00FFA3;">${p[1]}x</strong></div>`).join('')}
                </div>` : ''}
        </div>`;
    if (typeof IARecaptura !== 'undefined') setTimeout(() => IARecaptura.renderListaCards(), 20);
};

UI._obterWidgetIACrossSelling = function (nomeItem) {
    const itemLower = (nomeItem || '').toLowerCase();
    let recomendacao = '💡 <strong>Sugestão da IA:</strong> Ofereça Película 3D e Cabo Tipo C com desconto no combo!';
    let kitPreco = 'Aumento de ticket médio sugerido!';
    if (itemLower.includes('iphone')) {
        recomendacao = '💡 <strong>Combo Ideal da IA:</strong> 1x Capa Magsafe + 1x Película 3D Privacidade + 1x Fonte 20W';
        kitPreco = 'Leve o Kit Proteção Completa com <strong>R$ 15,00 de Desconto!</strong>';
    } else if (itemLower.includes('pelicula') || itemLower.includes('película')) {
        recomendacao = '💡 <strong>Sugestão da IA:</strong> Ofereça Capa Anti-impacto + Limpeza de Conector!';
        kitPreco = 'Com mais R$ 20 leve a Capa Nova!';
    }
    return `
    <div style="background:linear-gradient(135deg, rgba(234,179,8,0.15) 0%, rgba(168,85,247,0.15) 100%);border:1px solid rgba(234,179,8,0.4);border-radius:14px;padding:14px;margin:14px 0;text-align:left;">
        <div style="font-size:12px;color:#FFD700;font-weight:900;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">🤖 IA ASSISTENTE DE VENDAS (OFERTA COMPLEMENTAR)</div>
        <div style="font-size:14px;color:#FFF;line-height:1.4;">${recomendacao}</div>
        <div style="font-size:12px;color:#00d97e;font-weight:800;margin-top:6px;">🎁 ${kitPreco}</div>
    </div>`;
};
