// ====================================
// STRATEGYOS 3.1 - UI AVALIADOR DE TROCAS (TRADE-IN OS v4.0)
// Precificação Realista de Captação (Não Anúncio) + Integração Total Estoque & Caixa
// ====================================

UI._trocaDados = {};

UI.renderTrocas = function () {
    const estoqueLoja = (window.dataManager && typeof dataManager.getEstoqueCelulares === 'function')
        ? dataManager.getEstoqueCelulares().filter(p => p.status !== 'vendido' && (p.quantidade === undefined || p.quantidade > 0))
        : [];
    const primeiroEstoque = estoqueLoja[0] || { id: 'manual', nome: 'iPhone 13', precoVenda: 2197.90, custo: 1624 };

    window._troqState = window._troqState || {
        device: 'iphone 11 128gb',
        imeiUsado: '',
        battery: 86,
        screen: 'perfeita',
        defects: new Set(),
        semCarregador: false,
        semCaixa: false,
        precoVitrineOverride: null,
        ofertaManualOverride: null,
        selectedStockId: String(primeiroEstoque.id),
        manualTargetName: '',
        manualTargetPrice: 0,
        formaPagVolta: 'pix',
        parcelasVolta: 1
    };

    const st = window._troqState;
    if (!(st.defects instanceof Set)) st.defects = new Set();

    const modelosRapidos = [
        'iphone 11 64gb', 'iphone 11 128gb', 'iphone 12 128gb', 'iphone 13 128gb',
        'iphone 13 pro 128gb', 'iphone 14 128gb', 'iphone 15 128gb',
        'samsung a54 128gb', 'redmi note 12', 'redmi note 13', 'moto g34', 'realme c55'
    ];

    let html = `
    <div style="max-width:1400px;margin:0 auto;padding:10px;">
        <style>
            :root { --tr-neon:#00FFA3; --tr-neon2:#B6FF5C; --tr-bg:#060809; }
            .tr-glass {
                background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015));
                border: 1px solid rgba(255,255,255,0.085);
                backdrop-filter: blur(20px);
                border-radius: 18px;
                padding: 18px;
                position: relative;
            }
            .tr-micro { font-family: monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #8FA79B; }
            .tr-step-num {
                font-family: monospace; font-size: 12px; font-weight: 700; color: var(--tr-neon);
                border: 1px solid rgba(0,255,163,0.3); border-radius: 8px; padding: 4px 8px;
                background: rgba(0,255,163,0.06);
            }
            .tr-pill-btn {
                display: flex; flex-direction: column; padding: 11px 13px; border-radius: 12px; cursor: pointer;
                border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.025); transition: all 0.2s;
                font-size: 13px; font-weight: 600; color: #FFF;
            }
            .tr-pill-btn.active {
                border-color: rgba(0,255,163,0.65); background: rgba(0,255,163,0.08); color: var(--tr-neon);
                box-shadow: 0 0 20px rgba(0,255,163,0.15);
            }
            .tr-def-row {
                display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 10px;
                border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); cursor: pointer; transition: all 0.2s;
            }
            .tr-def-row.active {
                border-color: #FF5A6E; background: rgba(255,90,110,0.15); color: #FFB9C1;
            }
            .tr-total-val {
                font-size: 38px; font-weight: 900; letter-spacing: -0.03em;
                background: linear-gradient(100deg, #EDFF8F 0%, #6DFFB4 50%, #00FFA3 100%);
                -webkit-background-clip: text; background-clip: text; color: transparent;
            }
        </style>

        <!-- CABEÇALHO -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px;">
            <div>
                <span class="vendedor-step-badge" style="background:#00FFA3;color:#04120B;font-weight:900;">TROQ. TRADE-IN OS v4.0 • TABELA DE CAPTAÇÃO LOJA</span>
                <h2 style="margin:4px 0 0;font-size:26px;color:#FFF;font-weight:800;">🔄 AVALIADOR & FECHAMENTO DE TROCA</h2>
                <p style="margin:4px 0 0;color:var(--text-muted);font-size:14px;">Separa automaticamente o <strong>Preço de Anúncio/Vitrine</strong> do <strong>Valor Seguro de Captação da Loja</strong> e abate custos reais de peça.</p>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <button class="btn btn-ghost btn-sm" onclick="UI._abrirModalTabelaCaptaTroca()" style="border:1px solid rgba(0,255,163,0.3);color:#00FFA3;">📊 Ver Tabela Vitrine vs Troca</button>
                <button class="btn btn-primary btn-sm" onclick="UI.modalAvaliarTroca()" style="padding:10px 16px;">📋 Checklist Clássico (3 Passos)</button>
            </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(340px, 1fr));gap:20px;">
            <!-- COLUNA ESQUERDA: AVALIAÇÃO DO USADO DO CLIENTE -->
            <div style="display:flex;flex-direction:column;gap:14px;">

                <!-- PASSO 01: APARELHO USADO -->
                <div class="tr-glass">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <span class="tr-step-num">01</span>
                            <div>
                                <h3 style="margin:0;font-size:16px;color:#FFF;font-weight:700;">Aparelho Usado do Cliente</h3>
                                <div class="tr-micro">MODELO + CAPACIDADE (GB)</div>
                            </div>
                        </div>
                        <span id="troq-badge-fonte" style="font-size:11px;padding:3px 8px;border-radius:6px;background:rgba(0,255,163,0.1);color:#00FFA3;font-weight:700;">Tabela Loja</span>
                    </div>

                    <div style="display:grid;grid-template-columns:2fr 1fr;gap:8px;">
                        <div>
                            <label class="form-label" style="font-size:12px;color:var(--text-muted);">Modelo que está entrando na troca:</label>
                            <input class="form-input" id="troq-input-dev" value="${st.device}" placeholder="Ex: iPhone 11 128GB, Samsung A54" style="font-size:15px;padding:10px;" oninput="window._troqState.precoVitrineOverride=null;window._troqState.ofertaManualOverride=null;UI._troqAtualizar();">
                        </div>
                        <div>
                            <label class="form-label" style="font-size:12px;color:var(--text-muted);">IMEI (opcional):</label>
                            <input class="form-input" id="troq-input-imei" value="${st.imeiUsado || ''}" placeholder="*#06#" maxlength="15" style="font-size:14px;padding:10px;" oninput="window._troqState.imeiUsado=this.value;">
                        </div>
                    </div>

                    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;">
                        ${modelosRapidos.map(m => `
                            <button class="btn btn-sm btn-ghost" style="font-size:11px;padding:4px 8px;border:1px solid rgba(255,255,255,0.08);" onclick="document.getElementById('troq-input-dev').value='${m}';window._troqState.precoVitrineOverride=null;window._troqState.ofertaManualOverride=null;UI._troqAtualizar();">${m.toUpperCase()}</button>
                        `).join('')}
                    </div>

                    <!-- COMPARATIVO CLARO: PREÇO DE VITRINE/ANÚNCIO VS TETO DE CAPTAÇÃO -->
                    <div id="troq-box-referencia" style="margin-top:12px;padding:10px 12px;border-radius:10px;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.08);display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    </div>
                </div>

                <!-- PASSO 02: SAÚDE DA BATERIA -->
                <div class="tr-glass">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <span class="tr-step-num">02</span>
                            <div>
                                <h3 style="margin:0;font-size:16px;color:#FFF;font-weight:700;">Saúde da Bateria (%)</h3>
                                <div class="tr-micro">ABAIXO DE 80% DESCONTA TROCA DA BATERIA</div>
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span style="font-size:28px;font-weight:900;color:var(--tr-neon);"><span id="troq-bat-val">${st.battery}</span>%</span>
                            <span id="troq-bat-tier" style="background:rgba(0,255,163,0.1);color:var(--tr-neon);border:1px solid rgba(0,255,163,0.3);padding:3px 8px;border-radius:20px;font-size:11px;font-weight:800;">BOA</span>
                        </div>
                    </div>
                    <input type="range" id="troq-bat-slider" min="50" max="100" value="${st.battery}" style="width:100%;cursor:pointer;" oninput="document.getElementById('troq-bat-val').textContent=this.value;window._troqState.ofertaManualOverride=null;UI._troqAtualizar();">
                    <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
                        ${[100, 92, 86, 81, 76, 65].map(b => `
                            <button class="btn btn-sm btn-ghost" style="font-size:11px;padding:3px 8px;" onclick="document.getElementById('troq-bat-slider').value=${b};document.getElementById('troq-bat-val').textContent=${b};window._troqState.ofertaManualOverride=null;UI._troqAtualizar();">${b}%${b < 80 ? ' (Manut.)' : ''}</button>
                        `).join('')}
                    </div>
                </div>

                <!-- PASSO 03: CONDIÇÃO DA TELA -->
                <div class="tr-glass">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                        <span class="tr-step-num">03</span>
                        <div>
                            <h3 style="margin:0;font-size:16px;color:#FFF;font-weight:700;">Condição da Tela & Estética</h3>
                            <div class="tr-micro">TELA TRINCADA DESCONTA O CUSTO REAL DA PEÇA NA ASSISTÊNCIA</div>
                        </div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div class="tr-pill-btn ${st.screen === 'perfeita' ? 'active' : ''}" onclick="UI._troqSetScreen('perfeita')">
                            ✨ Impecável / Sem Marcas <span style="font-size:10px;opacity:0.75">Sem abatimento (R$ 0)</span>
                        </div>
                        <div class="tr-pill-btn ${st.screen === 'leves' ? 'active' : ''}" onclick="UI._troqSetScreen('leves')">
                            🔍 Marcas de Uso Leves <span style="font-size:10px;opacity:0.75">Micro-riscos normais (-8%)</span>
                        </div>
                        <div class="tr-pill-btn ${st.screen === 'profundos' ? 'active' : ''}" onclick="UI._troqSetScreen('profundos')">
                            ⚠️ Arranhões Fortes / Aro <span style="font-size:10px;opacity:0.75">Marcas visíveis (-18%)</span>
                        </div>
                        <div class="tr-pill-btn ${st.screen === 'trincada' ? 'active' : ''}" onclick="UI._troqSetScreen('trincada')">
                            ⚡ Tela Trincada / Manchada <span style="font-size:10px;opacity:0.75" id="troq-lbl-custo-tela">Abate troca de tela</span>
                        </div>
                    </div>
                </div>

                <!-- PASSO 04: DEFEITOS FUNCIONAIS -->
                <div class="tr-glass">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                        <span class="tr-step-num">04</span>
                        <div>
                            <h3 style="margin:0;font-size:16px;color:#FFF;font-weight:700;">Defeitos Funcionais (Bancada)</h3>
                            <div class="tr-micro">ABATE O CUSTO REAL DO REPARO DE CADA PEÇA</div>
                        </div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;" id="troq-defeitos-grid">
                        ${[
                            { key: 'faceid', label: '🔐 Face ID / Biometria Off' },
                            { key: 'camera', label: '📷 Câmera Traseira/Frontal' },
                            { key: 'carcaca', label: '📱 Traseira / Carcaça Trincada' },
                            { key: 'carga', label: '🔌 Conector de Carga Ruim' },
                            { key: 'audio', label: '🔊 Áudio / Microfone Baixo' },
                            { key: 'botoes', label: '🔘 Botões (Power / Volume)' }
                        ].map(d => `
                            <div class="tr-def-row ${st.defects.has(d.key) ? 'active' : ''}" onclick="UI._troqToggleDefect('${d.key}')">
                                <span style="font-size:12.5px;font-weight:600;">${d.label}</span>
                                <span style="font-size:11px;font-weight:800;color:#FF5A6E;" id="troq-def-val-${d.key}">-R$</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- PASSO 05: CAIXA E CARREGADOR (SEM INFLAR PREÇO) -->
                <div class="tr-glass">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                        <span class="tr-step-num">05</span>
                        <div>
                            <h3 style="margin:0;font-size:16px;color:#FFF;font-weight:700;">Itens Faltantes (Caixa / Carregador)</h3>
                            <div class="tr-micro">NÃO INFLA O PREÇO DE ANÚNCIO; DESCONTA SE VIER SEM ACESSÓRIO</div>
                        </div>
                    </div>
                    <div style="display:flex;gap:10px;flex-wrap:wrap;">
                        <button class="btn btn-sm ${!st.semCarregador && !st.semCaixa ? 'btn-success' : 'btn-ghost'}" style="font-size:12.5px;padding:8px 12px;" onclick="window._troqState.semCarregador=false;window._troqState.semCaixa=false;window._troqState.ofertaManualOverride=null;UI.renderTrocas();">
                            ✅ Completo (Com Caixa + Carregador: R$ 0)
                        </button>
                        <button class="btn btn-sm ${st.semCarregador ? 'btn-danger' : 'btn-ghost'}" style="font-size:12.5px;padding:8px 12px;" onclick="window._troqState.semCarregador=!window._troqState.semCarregador;window._troqState.ofertaManualOverride=null;UI.renderTrocas();">
                            🔌 Sem Carregador (-R$ 30)
                        </button>
                        <button class="btn btn-sm ${st.semCaixa ? 'btn-danger' : 'btn-ghost'}" style="font-size:12.5px;padding:8px 12px;" onclick="window._troqState.semCaixa=!window._troqState.semCaixa;window._troqState.ofertaManualOverride=null;UI.renderTrocas();">
                            📦 Sem Caixa (-R$ 20)
                        </button>
                    </div>
                </div>
            </div>

            <!-- COLUNA DIREITA: SIMULAÇÃO FINANCEIRA + ESTOQUE REAL + FECHAMENTO -->
            <div class="tr-glass" style="border:1px solid rgba(0,255,163,0.35);background:rgba(13,18,16,0.96);position:sticky;top:16px;height:fit-content;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <span class="tr-micro" style="color:var(--tr-neon);font-weight:800;">🟢 PROPOSTA DE TROCA & FECHAMENTO</span>
                    <span class="tr-micro">MARGEM PROTEGIDA</span>
                </div>

                <!-- SELEÇÃO DO APARELHO DA LOJA (ESTOQUE REAL OU MANUAL) -->
                <div style="margin-bottom:12px;background:rgba(255,255,255,0.03);padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
                    <label class="form-label" style="font-size:12px;color:#00FFA3;font-weight:800;">📱 1. Qual Aparelho da Loja o Cliente Vai Levar?</label>
                    <select class="form-select" id="troq-select-stock" style="font-size:14px;padding:10px;margin-top:4px;font-weight:700;" onchange="UI._troqTrocarAparelhoLoja(this.value)">
                        ${estoqueLoja.map(p => `<option value="${p.id}" ${String(st.selectedStockId) === String(p.id) ? 'selected' : ''}>📱 ${p.nome} — Venda: ${UI.R(p.precoVenda)} (${p.condicao || 'Estoque'})</option>`).join('')}
                        <option value="manual" ${st.selectedStockId === 'manual' ? 'selected' : ''}>✏️ Digitar outro aparelho / valor manualmente...</option>
                    </select>
                    <div id="troq-manual-target-box" style="display:${st.selectedStockId === 'manual' ? 'grid' : 'none'};grid-template-columns:1.4fr 1fr;gap:8px;margin-top:8px;">
                        <input class="form-input" id="troq-target-name-manual" placeholder="Modelo (ex: iPhone 15)" value="${st.manualTargetName || ''}" oninput="window._troqState.manualTargetName=this.value;UI._troqAtualizar();">
                        <input class="form-input" id="troq-target-price-manual" type="number" placeholder="Preço R$" value="${st.manualTargetPrice || ''}" oninput="window._troqState.manualTargetPrice=parseFloat(this.value)||0;UI._troqAtualizar();">
                    </div>
                </div>

                <!-- DETALHAMENTO TRANSPARENTE -->
                <div style="display:flex;flex-direction:column;gap:7px;font-size:13px;" id="troq-breakdown-container"></div>

                <!-- AJUSTE MANUAL DA OFERTA PELO USADO -->
                <div style="margin-top:12px;padding:10px 12px;background:rgba(0,255,163,0.06);border:1px dashed rgba(0,255,163,0.35);border-radius:10px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
                        <label style="font-size:12px;color:#00FFA3;font-weight:800;">💰 Crédito Ofertado no Usado (R$):</label>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <input type="number" id="troq-oferta-manual-inp" class="form-input" style="width:125px;font-size:18px;font-weight:900;color:#00FFA3;text-align:center;padding:6px;" oninput="window._troqState.ofertaManualOverride=parseFloat(this.value)||0;UI._troqAtualizar(true);">
                            <button class="btn btn-sm btn-ghost" style="font-size:11px;padding:6px 8px;" title="Voltar ao valor calculado pela tabela" onclick="window._troqState.ofertaManualOverride=null;UI._troqAtualizar();">Auto</button>
                        </div>
                    </div>
                    <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
                        <button class="btn btn-sm btn-ghost" style="font-size:11px;padding:3px 8px;" onclick="UI._troqAjustarOfertaRapido(-100)">-R$ 100</button>
                        <button class="btn btn-sm btn-ghost" style="font-size:11px;padding:3px 8px;" onclick="UI._troqAjustarOfertaRapido(-50)">-R$ 50</button>
                        <button class="btn btn-sm btn-ghost" style="font-size:11px;padding:3px 8px;" onclick="UI._troqAjustarOfertaRapido(50)">+R$ 50</button>
                        <button class="btn btn-sm btn-ghost" style="font-size:11px;padding:3px 8px;" onclick="UI._troqAjustarOfertaRapido(100)">+R$ 100</button>
                    </div>
                </div>

                <!-- VALOR DA VOLTA (DIFERENÇA A PAGAR PELO CLIENTE) -->
                <div style="margin-top:14px;padding-top:12px;border-top:1px dashed rgba(0,255,163,0.3);text-align:center;">
                    <div style="font-size:11px;color:var(--tr-neon);font-weight:800;letter-spacing:0.08em;">VOLTA A RECEBER DO CLIENTE (DIFERENÇA):</div>
                    <div class="tr-total-val" id="troq-final-diff">R$ 0,00</div>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:2px;" id="troq-inst-info"></div>
                </div>

                <!-- FORMA DE PAGAMENTO DA VOLTA -->
                <div style="margin-top:12px;background:rgba(255,255,255,0.03);padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,0.07);">
                    <label style="font-size:11px;color:var(--text-muted);font-weight:700;display:block;margin-bottom:6px;">💳 FORMA DE PAGAMENTO DA VOLTA:</label>
                    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">
                        ${[
                            { k: 'pix', l: '📲 PIX' },
                            { k: 'dinheiro', l: '💵 Dinheiro' },
                            { k: 'debito', l: '💳 Débito' },
                            { k: 'credito', l: '💳 Crédito' }
                        ].map(fp => `
                            <button type="button" class="btn btn-sm ${st.formaPagVolta === fp.k ? 'btn-primary' : 'btn-ghost'}" style="font-size:11.5px;padding:7px 4px;" onclick="window._troqState.formaPagVolta='${fp.k}';UI.renderTrocas();">${fp.l}</button>
                        `).join('')}
                    </div>
                    <div id="troq-parcelas-box" style="display:${st.formaPagVolta === 'credito' ? 'block' : 'none'};margin-top:8px;">
                        <select class="form-select" id="troq-select-parcelas" style="font-size:13px;padding:7px;" onchange="window._troqState.parcelasVolta=parseInt(this.value)||1;UI._troqAtualizar();">
                            ${Array.from({ length: 12 }, (_, i) => i + 1).map(n => `<option value="${n}" ${st.parcelasVolta === n ? 'selected' : ''}>Parcelado em ${n}x no Cartão</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px;">
                    <button class="btn btn-lg" style="background:linear-gradient(100deg,#B6FF5C,#00FFA3);color:#04120B;font-weight:900;font-size:15px;padding:13px;" onclick="UI._troqSalvarEAprovar()">
                        ✅ Aprovar & Registrar Troca (Estoque + Caixa)
                    </button>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <button class="btn btn-ghost btn-sm" onclick="UI._troqEnviarWhatsApp()" style="font-size:12px;">📲 Enviar Proposta WhatsApp</button>
                        <button class="btn btn-sm" onclick="UI._trocaDados={modelo:window._troqState.device};UI._abrirModalAssinaturaTroca()" style="font-size:12px;background:rgba(0,255,163,0.1);color:#00FFA3;border:1px solid #00FFA3;">✍️ Termo & Assinatura Digital</button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    document.getElementById('main-content').innerHTML = html;
    setTimeout(() => UI._troqAtualizar(), 30);
};

UI._troqTrocarAparelhoLoja = function (val) {
    window._troqState.selectedStockId = val;
    const box = document.getElementById('troq-manual-target-box');
    if (box) box.style.display = val === 'manual' ? 'grid' : 'none';
    UI._troqAtualizar();
};

UI._troqAjustarOfertaRapido = function (delta) {
    const atual = window._troqState._ultimaOfertaCalculada || 500;
    window._troqState.ofertaManualOverride = Math.max(50, atual + delta);
    UI._troqAtualizar();
};

UI._troqSetScreen = function (scr) {
    window._troqState.screen = scr;
    window._troqState.ofertaManualOverride = null;
    UI.renderTrocas();
};

UI._troqToggleDefect = function (key) {
    if (window._troqState.defects.has(key)) window._troqState.defects.delete(key);
    else window._troqState.defects.add(key);
    window._troqState.ofertaManualOverride = null;
    UI.renderTrocas();
};

UI._troqAtualizar = function (skipInputSync) {
    const st = window._troqState;
    const devInput = document.getElementById('troq-input-dev')?.value?.trim() || st.device || 'iphone 11 128gb';
    const batSlider = parseInt(document.getElementById('troq-bat-slider')?.value || st.battery || 86, 10);
    st.device = devInput;
    st.battery = batSlider;

    const av = window.TrocaEngine ? TrocaEngine.buscarAvaliacaoBase(devInput) : null;
    const precoVitrineUsado = st.precoVitrineOverride > 0
        ? st.precoVitrineOverride
        : (av ? av.precoVitrine : 900);
    const fatorCap = window.TrocaEngine ? TrocaEngine.fatorCaptacaoBase(precoVitrineUsado) : 0.55;
    const tetoCaptacaoLoja = Math.round((precoVitrineUsado * fatorCap) / 10) * 10;

    const fonteEl = document.getElementById('troq-badge-fonte');
    if (fonteEl) {
        fonteEl.textContent = av ? `✅ ${av.key.toUpperCase()} (${av.gb}GB)` : '⚠️ Modelo Manual (Ajuste a Vitrine se necessário)';
    }

    const boxRef = document.getElementById('troq-box-referencia');
    if (boxRef) {
        boxRef.innerHTML = `
            <div>
                <div style="font-size:11px;color:var(--text-muted);">🏷️ Valor de Vitrine/Anúncio (Perfeito):</div>
                <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
                    <strong style="font-size:16px;color:#FFF;">${UI.R(precoVitrineUsado)}</strong>
                    <button class="btn btn-sm btn-ghost" style="font-size:10px;padding:2px 6px;" onclick="UI._troqEditarVitrineManual(${precoVitrineUsado})">✏️ Ajustar</button>
                </div>
            </div>
            <div style="border-left:1px solid rgba(255,255,255,0.1);padding-left:10px;">
                <div style="font-size:11px;color:#00FFA3;font-weight:700;">🎯 Teto Captação Loja (${Math.round(fatorCap * 100)}%):</div>
                <div style="font-size:17px;font-weight:900;color:#00FFA3;margin-top:2px;">${UI.R(tetoCaptacaoLoja)}</div>
            </div>
        `;
    }

    const custoTelaReal = window.TrocaEngine ? TrocaEngine.estimarReparo(devInput, 'tela') : 220;
    const custoBatReal = window.TrocaEngine ? TrocaEngine.estimarReparo(devInput, 'bateria') : 110;
    const lblTela = document.getElementById('troq-lbl-custo-tela');
    if (lblTela) lblTela.textContent = `Abate peça+mão de obra (-${UI.R(custoTelaReal)})`;

    const mapaDefeitosCustos = {
        faceid: Math.max(220, Math.round(tetoCaptacaoLoja * 0.25)),
        camera: window.TrocaEngine ? TrocaEngine.estimarReparo(devInput, 'camera') : 180,
        carcaca: window.TrocaEngine ? TrocaEngine.estimarReparo(devInput, 'carcaca') : 150,
        carga: window.TrocaEngine ? TrocaEngine.estimarReparo(devInput, 'carga') : 95,
        audio: window.TrocaEngine ? TrocaEngine.estimarReparo(devInput, 'audio') : 90,
        botoes: window.TrocaEngine ? TrocaEngine.estimarReparo(devInput, 'botoes') : 85
    };
    Object.entries(mapaDefeitosCustos).forEach(([k, val]) => {
        const el = document.getElementById('troq-def-val-' + k);
        if (el) el.textContent = `-${UI.R(val)}`;
    });

    let batDed = 0;
    const tierEl = document.getElementById('troq-bat-tier');
    if (batSlider < 80) {
        batDed = custoBatReal;
        if (tierEl) { tierEl.textContent = 'MANUTENÇÃO (TROCAR)'; tierEl.style.color = '#FF5A6E'; tierEl.style.borderColor = '#FF5A6E'; }
    } else if (batSlider < 88) {
        batDed = Math.round((tetoCaptacaoLoja * 0.06) / 10) * 10;
        if (tierEl) { tierEl.textContent = 'DESGASTE LEVE'; tierEl.style.color = '#FFD700'; tierEl.style.borderColor = '#FFD700'; }
    } else {
        if (tierEl) { tierEl.textContent = 'EXCELENTE'; tierEl.style.color = '#00FFA3'; tierEl.style.borderColor = 'rgba(0,255,163,0.3)'; }
    }

    let scrDed = 0;
    if (st.screen === 'leves') scrDed = Math.round((tetoCaptacaoLoja * 0.08) / 10) * 10;
    else if (st.screen === 'profundos') scrDed = Math.round((tetoCaptacaoLoja * 0.18) / 10) * 10;
    else if (st.screen === 'trincada') scrDed = custoTelaReal;

    let defDed = 0;
    st.defects.forEach(k => { defDed += (mapaDefeitosCustos[k] || 100); });

    let faltaAccDed = (st.semCarregador ? 30 : 0) + (st.semCaixa ? 20 : 0);

    const creditoCalculado = Math.max(50, Math.round((tetoCaptacaoLoja - batDed - scrDed - defDed - faltaAccDed) / 10) * 10);
    const creditoTroca = (st.ofertaManualOverride !== null && st.ofertaManualOverride > 0)
        ? Math.round(st.ofertaManualOverride)
        : creditoCalculado;
    st._ultimaOfertaCalculada = creditoTroca;

    const inpManual = document.getElementById('troq-oferta-manual-inp');
    if (inpManual && !skipInputSync) inpManual.value = creditoTroca;

    const estoqueLoja = (window.dataManager && typeof dataManager.getEstoqueCelulares === 'function')
        ? dataManager.getEstoqueCelulares().filter(p => p.status !== 'vendido' && (p.quantidade === undefined || p.quantidade > 0))
        : [];
    const prodLoja = st.selectedStockId !== 'manual'
        ? estoqueLoja.find(p => String(p.id) === String(st.selectedStockId))
        : null;

    const nomeAparelhoLoja = prodLoja ? prodLoja.nome : (st.manualTargetName || 'Aparelho da Loja');
    const precoNovo = prodLoja ? (parseFloat(prodLoja.precoVenda) || 0) : (parseFloat(st.manualTargetPrice) || 2000);
    const custoNovoEstoque = prodLoja ? (parseFloat(prodLoja.custo) || Math.round(precoNovo * 0.70)) : Math.round(precoNovo * 0.70);

    const diferencaBase = Math.max(0, precoNovo - creditoTroca);
    const custoReparoTotalUsado = (batSlider < 80 ? custoBatReal : 0) + (st.screen === 'trincada' ? custoTelaReal : 0) + defDed;
    const lucroEsperadoNoUsado = Math.max(0, precoVitrineUsado - creditoTroca - custoReparoTotalUsado);
    const lucroLiquidoOperacao = (diferencaBase - custoNovoEstoque) + (precoVitrineUsado - custoReparoTotalUsado);

    st._resumoCalculado = {
        prodLoja,
        nomeAparelhoLoja,
        precoNovo,
        custoNovoEstoque,
        precoVitrineUsado,
        tetoCaptacaoLoja,
        creditoCalculado,
        creditoTroca,
        custoReparoTotalUsado,
        diferencaBase,
        lucroLiquidoOperacao
    };

    let recomendacao = '';
    let recomendacaoCor = '#00FFA3';
    let recomendacaoBg = 'rgba(0, 255, 163, 0.12)';

    if (creditoTroca > tetoCaptacaoLoja) {
        recomendacao = `🚨 <strong>ALERTA: OFERTA ACIMA DO TETO DE CAPTAÇÃO (${UI.R(tetoCaptacaoLoja)})!</strong><br><span style="font-size:11px;">Você está pagando quase preço de anúncio no usado. Reduza a oferta para proteger a margem da loja.</span>`;
        recomendacaoCor = '#FF4D4D';
        recomendacaoBg = 'rgba(255, 77, 77, 0.15)';
    } else if (lucroLiquidoOperacao < 250 || (st.defects.has('faceid') && st.screen === 'trincada')) {
        recomendacao = `⛔ <strong>CAUTELA MÁXIMA / POUCA MARGEM (${UI.R(lucroLiquidoOperacao)})</strong><br><span style="font-size:11px;">Aparelho com alto custo de reforma ou margem combinada baixa. Só feche reduzindo a oferta do usado.</span>`;
        recomendacaoCor = '#FF4D4D';
        recomendacaoBg = 'rgba(255, 77, 77, 0.15)';
    } else if (lucroLiquidoOperacao >= 450) {
        recomendacao = `🔥 <strong>TROCA SEGURA E LUCRATIVA PARA A LOJA!</strong><br><span style="font-size:11px;">Usado entra por <strong>${UI.R(creditoTroca)}</strong> (revenda vitrine ~${UI.R(precoVitrineUsado)}). Lucro combinado estimado: <strong>${UI.R(lucroLiquidoOperacao)}</strong>.</span>`;
    } else {
        recomendacao = `⚠️ <strong>MARGEM MODERADA (Lucro Est.: ${UI.R(lucroLiquidoOperacao)})</strong><br><span style="font-size:11px;">Negócio viável, mas não dê desconto adicional no aparelho da loja.</span>`;
        recomendacaoCor = '#FFD700';
        recomendacaoBg = 'rgba(255, 215, 0, 0.14)';
    }

    const breakdownEl = document.getElementById('troq-breakdown-container');
    if (breakdownEl) {
        breakdownEl.innerHTML = `
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(0,255,163,0.2);border-radius:10px;padding:10px;margin-bottom:6px;">
                <div style="display:flex;justify-content:space-between;font-size:12px;"><span>📱 Saindo do Nosso Estoque:</span><strong style="color:#FFF;">${nomeAparelhoLoja}</strong></div>
                <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-top:2px;"><span>💰 Preço de Venda na Loja:</span><strong style="color:#00FFA3;">${UI.R(precoNovo)}</strong></div>
            </div>

            <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);">
                <span>Preço de Anúncio/Vitrine do Usado:</span><span>${UI.R(precoVitrineUsado)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-weight:700;color:#FFF;">
                <span>🎯 Teto Base de Captação Loja (${Math.round(fatorCap * 100)}%):</span><span>${UI.R(tetoCaptacaoLoja)}</span>
            </div>
            ${batDed > 0 ? `<div style="display:flex;justify-content:space-between;color:#FFB9C1;"><span>🔋 Abatimento Bateria (${batSlider}%):</span><span>-${UI.R(batDed)}</span></div>` : ''}
            ${scrDed > 0 ? `<div style="display:flex;justify-content:space-between;color:#FFB9C1;"><span>📱 Abatimento Tela/Estética (${st.screen}):</span><span>-${UI.R(scrDed)}</span></div>` : ''}
            ${defDed > 0 ? `<div style="display:flex;justify-content:space-between;color:#FFB9C1;"><span>🔧 Abatimento Defeitos (${st.defects.size}):</span><span>-${UI.R(defDed)}</span></div>` : ''}
            ${faltaAccDed > 0 ? `<div style="display:flex;justify-content:space-between;color:#FFB9C1;"><span>🔌 Sem Caixa/Carregador:</span><span>-${UI.R(faltaAccDed)}</span></div>` : ''}

            <div style="margin-top:6px;padding:9px 10px;border-radius:10px;background:${recomendacaoBg};border:1px solid ${recomendacaoCor};color:${recomendacaoCor};font-size:12px;line-height:1.35;">
                ${recomendacao}
            </div>

            <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-top:4px;">
                <span>📈 Revenda Futura do Usado / Lucro no Usado:</span>
                <strong style="color:#00FFA3;">${UI.R(precoVitrineUsado)} (+${UI.R(lucroEsperadoNoUsado)})</strong>
            </div>
        `;
    }

    const diffEl = document.getElementById('troq-final-diff');
    const instEl = document.getElementById('troq-inst-info');

    if (st.formaPagVolta === 'credito' && diferencaBase > 0 && window.Calculators) {
        const nParc = st.parcelasVolta || 1;
        const calcCartao = Calculators.calcularTaxaMaquina(diferencaBase, nParc, 'normal');
        const totalComTaxa = Math.round(diferencaBase / (1 - (calcCartao.taxa || 0) / 100));
        const valParcela = totalComTaxa / nParc;
        if (diffEl) diffEl.textContent = UI.R(diferencaBase);
        if (instEl) instEl.innerHTML = `No Cartão em <strong>${nParc}x de ${UI.R(valParcela)}</strong> (Total c/ taxa maquininha: ${UI.R(totalComTaxa)})`;
    } else {
        const calc12 = window.Calculators ? Calculators.calcularTaxaMaquina(diferencaBase, 12, 'normal') : { taxa: 12 };
        const total12 = Math.round(diferencaBase / (1 - (calc12.taxa || 12) / 100));
        if (diffEl) diffEl.textContent = UI.R(diferencaBase);
        if (instEl) instEl.textContent = `À vista no ${st.formaPagVolta.toUpperCase()} ou em até 12x de ${UI.R(total12 / 12)} no cartão`;
    }
};

UI._troqEditarVitrineManual = function (atual) {
    const novo = prompt('Informe o Preço de Vitrine/Anúncio deste modelo em estado perfeito (R$).\nO sistema calculará automaticamente o Teto de Captação seguro da loja:', atual);
    if (novo !== null && parseFloat(novo) > 0) {
        window._troqState.precoVitrineOverride = parseFloat(novo);
        window._troqState.ofertaManualOverride = null;
        UI._troqAtualizar();
    }
};

UI._abrirModalTabelaCaptaTroca = function () {
    const tab = window.TrocaEngine ? TrocaEngine.precosVitrineSeminovo : {};
    const linhas = Object.entries(tab).map(([mod, vit]) => {
        const cap = Math.round((vit * TrocaEngine.fatorCaptacaoBase(vit)) / 10) * 10;
        return `<tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
            <td style="padding:8px;font-weight:700;color:#FFF;text-transform:uppercase;">${mod}</td>
            <td style="padding:8px;color:var(--text-muted);text-align:right;">${UI.R(vit)}</td>
            <td style="padding:8px;color:#00FFA3;font-weight:800;text-align:right;">${UI.R(cap)}</td>
        </tr>`;
    }).join('');

    UI.openModal('📊 Tabela Oficial: Vitrine vs Teto de Captação na Troca', `
        <div style="padding:6px;">
            <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">
                Veja a diferença entre o <strong>Preço de Anúncio/Vitrine</strong> (por quanto o seminovo é vendido) e o <strong>Teto de Captação na Troca</strong> (o máximo que a loja paga por ele em perfeito estado antes de descontar bateria/defeitos):
            </p>
            <div style="max-height:380px;overflow-y:auto;border:1px solid rgba(255,255,255,0.1);border-radius:10px;">
                <table style="width:100%;border-collapse:collapse;font-size:13px;">
                    <thead style="position:sticky;top:0;background:#0f172a;color:#FFD700;">
                        <tr>
                            <th style="padding:10px;text-align:left;">Modelo Base</th>
                            <th style="padding:10px;text-align:right;">Preço Vitrine (Venda)</th>
                            <th style="padding:10px;text-align:right;">Teto Captação (Compra)</th>
                        </tr>
                    </thead>
                    <tbody>${linhas}</tbody>
                </table>
            </div>
            <div class="modal-footer" style="margin-top:14px;">
                <button class="btn btn-primary" onclick="UI.closeModal()">Entendi</button>
            </div>
        </div>
    `);
};

UI._troqSalvarEAprovar = function () {
    const st = window._troqState;
    const res = st._resumoCalculado;
    if (!res) { UI._troqAtualizar(); return; }

    const dev = st.device.toUpperCase();
    const target = res.nomeAparelhoLoja;
    const creditoUsado = res.creditoTroca;
    const diff = res.diferencaBase;
    const forma = st.formaPagVolta || 'pix';

    UI._identificarCliente('vender', function (cliente) {
        const nomeCli = (cliente && cliente.nome) ? cliente.nome : 'Cliente Loja';

        const descHist = `🔄 TROCA: Saiu ${target} (${UI.R(res.precoNovo)}) | Entrou ${dev} por ${UI.R(creditoUsado)}`;
        const reg = dataManager.registrarTrocaNoEstoque(
            res.prodLoja ? res.prodLoja.id : 'manual',
            res.precoNovo,
            creditoUsado,
            descHist,
            {
                permitirSemEstoque: !res.prodLoja,
                nomeProdutoManual: target,
                custoManual: res.custoNovoEstoque,
                formaPagamento: forma,
                modeloUsado: dev,
                cliente: nomeCli
            }
        );

        if (!reg.sucesso) {
            return UI.toast(reg.erro || 'Erro ao registrar saída do aparelho', 'error');
        }

        const temReparo = res.custoReparoTotalUsado > 0;
        const obsDefeitos = st.defects.size > 0 ? ` | Defeitos: ${[...st.defects].join(', ')}` : '';
        const novoId = Date.now();
        dataManager.data.estoqueCelulares.push({
            id: novoId,
            nome: `${dev} (Bat ${st.battery}%)${st.imeiUsado ? ' IMEI:' + st.imeiUsado : ''}`,
            imei: st.imeiUsado || '',
            custo: creditoUsado,
            precoVenda: res.precoVitrineUsado,
            condicao: temReparo ? 'Troca (Requer Revisão)' : 'Seminovo (Troca)',
            categoria: 'smartphone',
            quantidade: 1,
            dataCompra: dataManager.hojeLocal ? dataManager.hojeLocal() : new Date().toISOString().split('T')[0],
            status: 'disponivel',
            observacoes: `Recebido em troca de ${nomeCli}${obsDefeitos}`
        });

        dataManager.saveData();
        UI._trocaDados = { modelo: dev, cliente: nomeCli };

        UI.openModal('✅ Troca Concluída no Estoque & Caixa!', `
            <div style="text-align:center;padding:10px;">
                <div style="font-size:46px;">🎉</div>
                <h3 style="color:#00FFA3;margin:6px 0;">Troca Registrada com Sucesso!</h3>
                <p style="font-size:13px;color:var(--text-muted);">Cliente: <strong>${nomeCli}</strong></p>

                <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:14px;margin:14px 0;text-align:left;font-size:14px;display:flex;flex-direction:column;gap:6px;">
                    <div>📤 <strong>Saiu do Estoque:</strong> ${target} (${UI.R(res.precoNovo)})</div>
                    <div>📥 <strong>Entrou no Estoque:</strong> ${dev} — Custo de Entrada: <strong style="color:#FFD700;">${UI.R(creditoUsado)}</strong> (Preço Vitrine Sugerido: ${UI.R(res.precoVitrineUsado)})</div>
                    <div>💰 <strong>Volta Recebida no Caixa (${forma.toUpperCase()}):</strong> <strong style="color:#00FFA3;font-size:17px;">${UI.R(diff)}</strong></div>
                </div>

                <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:14px;">
                    <button class="btn btn-primary" onclick="UI._abrirModalAssinaturaTroca()">✍️ Gerar Termo de Procedência Assinado</button>
                    <button class="btn btn-ghost" onclick="UI._troqEnviarWhatsApp()">📲 Enviar Comprovante WhatsApp</button>
                    <button class="btn btn-success" onclick="UI.closeModal();UI.renderTrocas();">Concluir</button>
                </div>
            </div>
        `);
    });
};

UI._troqEnviarWhatsApp = function () {
    const st = window._troqState;
    const res = st._resumoCalculado || {};
    const dev = (st.device || '').toUpperCase();
    const target = (res.nomeAparelhoLoja || st.newPhone || 'Aparelho Novo').toUpperCase();
    const credito = UI.R(res.creditoTroca || 0);
    const diff = document.getElementById('troq-final-diff')?.textContent || 'R$ 0,00';
    const msg = `📱 *PROPOSTA OFICIAL DE TROCA (TRADE-IN) — CESINHA ACESSÓRIOS*\n\n` +
        `🔄 *Seu Usado Avaliado*: ${dev} (Bateria ${st.battery}%)\n` +
        `💎 *Crédito Aprovado na Troca*: ${credito}\n` +
        `✨ *Aparelho da Loja*: ${target} (${UI.R(res.precoNovo || 0)})\n` +
        `----------------------------------------\n` +
        `💰 *Diferença (Volta) a Pagar*: *${diff}*\n\n` +
        `Proposta sujeita à conferência física de bancada na loja!`;

    window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(msg), '_blank');
};

UI._troqImprimirRecibo = function () {
    const st = window._troqState;
    const res = st._resumoCalculado || {};
    const diff = document.getElementById('troq-final-diff')?.textContent || 'R$ 0,00';
    UI._gerarReciboProfissionalPDF({
        tipoTitulo: 'COMPROVANTE DE TROCA (TRADE-IN)',
        cliente: 'Cliente Loja',
        produto: `${res.nomeAparelhoLoja || 'Aparelho'} (Entrada: ${st.device} por ${UI.R(res.creditoTroca || 0)})`,
        valor: diff,
        formaPagamento: (st.formaPagVolta || 'PIX').toUpperCase(),
        vendedor: 'Cesinha Acessórios'
    });
};

// === CHECKLIST CLÁSSICO DE 3 PASSOS (SINCRONIZADO COM TROCAENGINE v4.0) ===
UI.modalAvaliarTroca = function () {
    UI._trocaDados = {};
    UI.openModal('🔍 Avaliador de Trocas — Checklist Guiado (3 Passos)', `
        <p style="color:var(--text-muted);font-size:13px;margin-bottom:14px">
            O sistema converte automaticamente o preço de vitrine para o teto seguro de captação da loja.
        </p>
        <div id="troca-step-1">
            <div class="troca-step-header">
                <span class="troca-step-badge">PASSO 1 de 3</span>
                <h4>📲 Dados do Aparelho Usado</h4>
            </div>
            <div class="form-group">
                <label class="form-label">📲 Modelo do aparelho</label>
                <input class="form-input" id="tr-modelo" placeholder="Ex: iPhone 11 64GB, Samsung A54 128GB" oninput="UI._trocaSugerirPreco()">
            </div>
            <div class="form-group">
                <label class="form-label">💾 Quantos GB?</label>
                <select class="form-select" id="tr-gb">
                    <option value="32">32GB</option><option value="64">64GB</option>
                    <option value="128" selected>128GB</option><option value="256">256GB</option>
                    <option value="512">512GB</option><option value="1024">1TB</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">🔋 Qual a saúde da bateria?</label>
                <select class="form-select" id="tr-bat-tipo" onchange="UI._trocaBateriaChange()">
                    <option value="pct">Digite a porcentagem</option>
                    <option value="boa">Boa (acima de 80%)</option>
                    <option value="media">Média (60-80%)</option>
                    <option value="ruim">Ruim (abaixo de 60%)</option>
                    <option value="naosei">Não sei</option>
                </select>
                <input class="form-input" id="tr-bat-pct" type="number" min="0" max="100" placeholder="Ex: 85" style="margin-top:6px" value="85">
                <div id="tr-bat-extra" style="display:none;margin-top:8px">
                    <label class="form-label" style="color:var(--accent-yellow)">O aparelho desliga sozinho ou dura pouco?</label>
                    <div style="display:flex;gap:10px;margin-top:4px">
                        <button class="btn btn-sm btn-danger" onclick="document.getElementById('tr-bat-resp').value='sim';this.style.opacity=1;this.nextElementSibling.style.opacity=0.4" style="opacity:0.4">Sim — Bateria ruim</button>
                        <button class="btn btn-sm btn-success" onclick="document.getElementById('tr-bat-resp').value='nao';this.style.opacity=1;this.previousElementSibling.style.opacity=0.4" style="opacity:0.4">Não — Bateria média</button>
                    </div>
                    <input type="hidden" id="tr-bat-resp" value="">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">👀 Possui marcas de uso?</label>
                <select class="form-select" id="tr-marcas">
                    <option value="nenhuma">1. Nenhuma — perfeito</option>
                    <option value="leves" selected>2. Leves — arranhões superficiais</option>
                    <option value="medias">3. Médias — marcas visíveis</option>
                    <option value="graves">4. Graves — muito arranhado/amassado</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">📦 Tem carregador e caixa?</label>
                <select class="form-select" id="tr-acessorios">
                    <option value="completo">1. Completo — caixa + carregador</option>
                    <option value="carregador">2. Só carregador</option>
                    <option value="caixa">3. Só caixa</option>
                    <option value="nada" selected>4. Nada — só o aparelho</option>
                </select>
            </div>
            <h4 style="margin:16px 0 6px;color:var(--accent-yellow);font-size:14px">⚠️ Tem algum defeito?</h4>
            <div class="troca-defeitos-grid" id="tr-defeitos-grid">
                <label class="troca-check"><input type="checkbox" class="tr-defeito" value="tela_trincada_leve" onchange="UI._trocaDefeitoChange()"><span>1. Tela trincada (leve)</span></label>
                <label class="troca-check"><input type="checkbox" class="tr-defeito" value="tela_trincada_grave" onchange="UI._trocaDefeitoChange()"><span>2. Tela trincada (grave)</span></label>
                <label class="troca-check"><input type="checkbox" class="tr-defeito" value="tela_manchada"><span>3. Tela manchada/queimada</span></label>
                <label class="troca-check" id="tr-def-faceid"><input type="checkbox" class="tr-defeito" value="face_id"><span>4. Face ID não funciona</span></label>
                <label class="troca-check"><input type="checkbox" class="tr-defeito" value="touch_id"><span>5. Biometria não funciona</span></label>
                <label class="troca-check"><input type="checkbox" class="tr-defeito" value="camera_embacada"><span>6. Câmera embaçada</span></label>
                <label class="troca-check"><input type="checkbox" class="tr-defeito" value="camera_quebrada"><span>7. Câmera quebrada</span></label>
                <label class="troca-check"><input type="checkbox" class="tr-defeito" value="botoes_travados"><span>8. Botões travados</span></label>
                <label class="troca-check"><input type="checkbox" class="tr-defeito" value="nao_liga" onchange="UI._trocaDefeitoChange()"><span>9. Não liga ⚠️</span></label>
                <label class="troca-check"><input type="checkbox" class="tr-defeito" value="nao_pega_chip"><span>10. Não pega chip/sinal</span></label>
                <label class="troca-check"><input type="checkbox" class="tr-defeito" value="alto_falante"><span>11. Alto-falante</span></label>
                <label class="troca-check"><input type="checkbox" class="tr-defeito" value="microfone"><span>12. Microfone</span></label>
                <label class="troca-check"><input type="checkbox" class="tr-defeito" value="bateria_viciada"><span>13. Bateria viciada</span></label>
                <label class="troca-check"><input type="checkbox" class="tr-defeito" value="carcaca_danificada"><span>14. Carcaça danificada</span></label>
            </div>
            <h4 style="margin:14px 0 6px;color:var(--accent-purple);font-size:14px">🔧 Peças já trocadas (paralelas):</h4>
            <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px">
                <label class="troca-check"><input type="checkbox" class="tr-peca" value="tela"><span>1. Tela trocada</span></label>
                <label class="troca-check"><input type="checkbox" class="tr-peca" value="bateria"><span>2. Bateria trocada</span></label>
                <label class="troca-check"><input type="checkbox" class="tr-peca" value="camera"><span>3. Câmera trocada</span></label>
            </div>
            <div class="form-group">
                <label class="form-label">🏷️ Preço de Vitrine/Anúncio deste modelo em estado PERFEITO (R$)</label>
                <input class="form-input" id="tr-preco-ref" type="number" step="0.01" placeholder="Preenchido automaticamente ao digitar o modelo">
                <span class="form-hint" id="tr-preco-sugestao" style="margin-top:4px;display:block"></span>
            </div>
            <div class="modal-footer">
                <button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
                <button class="btn btn-primary btn-lg" onclick="UI.trocaPasso2()">Próximo → Produto da Loja</button>
            </div>
        </div>
        <div id="troca-step-2" style="display:none"></div>
        <div id="troca-resultado" style="display:none"></div>
    `);
    setTimeout(() => UI._trocaDetectarModelo(), 100);
};

UI._trocaDetectarModelo = function () {
    const modelo = (document.getElementById('tr-modelo')?.value || '').trim();
    const faceIdEl = document.getElementById('tr-def-faceid');
    if (faceIdEl) faceIdEl.style.display = (modelo && TrocaEngine.temFaceId(modelo)) ? '' : 'none';
};

UI._trocaSugerirPreco = function () {
    const modelo = document.getElementById('tr-modelo').value;
    UI._trocaDetectarModelo();
    if (modelo.length < 3) return;
    const av = TrocaEngine.buscarAvaliacaoBase(modelo);
    const hint = document.getElementById('tr-preco-sugestao');
    const input = document.getElementById('tr-preco-ref');
    if (av) {
        hint.innerHTML = `💡 Vitrine: <strong>${UI.R(av.precoVitrine)}</strong> → Teto Captação Loja (${av.fatorCaptacaoPct}%): <strong style="color:var(--accent-green)">${UI.R(av.precoCaptacao)}</strong>`;
        input.value = av.precoVitrine;
    } else {
        hint.innerHTML = '⚠️ Modelo não tabelado. Informe o preço médio de vitrine que o sistema calculará o teto de compra.';
    }
};

UI._trocaBateriaChange = function () {
    const tipo = document.getElementById('tr-bat-tipo').value;
    const pctInput = document.getElementById('tr-bat-pct');
    const extra = document.getElementById('tr-bat-extra');
    if (tipo === 'pct') { pctInput.style.display = ''; extra.style.display = 'none'; }
    else if (tipo === 'naosei') { pctInput.style.display = 'none'; extra.style.display = ''; }
    else { pctInput.style.display = 'none'; extra.style.display = 'none'; }
};

UI._trocaDefeitoChange = function () {
    const naoLiga = document.querySelector('.tr-defeito[value="nao_liga"]');
    if (!naoLiga) return;
    const checks = document.querySelectorAll('.tr-defeito:not([value="nao_liga"])');
    checks.forEach(c => {
        if (naoLiga.checked) { c.checked = false; c.disabled = true; c.closest('label').style.opacity = '0.3'; }
        else { c.disabled = false; c.closest('label').style.opacity = '1'; }
    });
    const leve = document.querySelector('.tr-defeito[value="tela_trincada_leve"]');
    const grave = document.querySelector('.tr-defeito[value="tela_trincada_grave"]');
    if (leve && grave && leve.checked && grave.checked) leve.checked = false;
};

UI._resolverBateria = function () {
    const tipo = document.getElementById('tr-bat-tipo').value;
    if (tipo === 'pct') return parseInt(document.getElementById('tr-bat-pct').value, 10) || 80;
    if (tipo === 'boa') return 88;
    if (tipo === 'media') return 75;
    if (tipo === 'ruim') return 60;
    if (tipo === 'naosei') return document.getElementById('tr-bat-resp').value === 'sim' ? 60 : 78;
    return 80;
};

UI.trocaPasso2 = function () {
    const modelo = document.getElementById('tr-modelo').value.trim();
    const precoRef = parseFloat(document.getElementById('tr-preco-ref').value);
    if (!modelo) return UI.toast('Informe o modelo do aparelho', 'error');
    if (!precoRef || precoRef <= 0) return UI.toast('Informe o preço de vitrine/referência', 'error');
    const bateria = UI._resolverBateria();
    UI._trocaDados = {
        modelo, bateriaSaude: bateria,
        marcasUso: document.getElementById('tr-marcas').value,
        acessorios: document.getElementById('tr-acessorios').value,
        defeitos: [...document.querySelectorAll('.tr-defeito:checked')].map(c => c.value),
        pecasTrocadas: [...document.querySelectorAll('.tr-peca:checked')].map(c => c.value),
        precoRef
    };
    const analise = TrocaEngine.calcular(UI._trocaDados);
    UI._trocaDados.analise = analise;

    const desvHtml = analise.detalhes.filter(d => d.valor > 0).map(d =>
        `<div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0;color:var(--text-muted)">
            <span>• ${d.item}</span>
            <span style="color:var(--accent-red)">-${UI.R(d.valor)}</span>
        </div>`
    ).join('');

    const estoque = dataManager.getEstoqueCelulares();
    const opts = estoque.map(p => `<option value="${p.id}" data-custo="${p.custo}" data-preco="${p.precoVenda}">${p.nome} — ${UI.R(p.precoVenda)} (custo: ${UI.R(p.custo)})</option>`).join('');

    document.getElementById('troca-step-1').style.display = 'none';
    const s2 = document.getElementById('troca-step-2');
    s2.style.display = 'block';
    s2.innerHTML = `
        <div class="troca-step-header">
            <span class="troca-step-badge">PASSO 2 de 3</span>
            <h4>📊 Avaliação de Captação + Produto da Loja</h4>
        </div>
        <div class="troca-resumo-card">
            <h5 style="color:var(--accent-cyan)">📱 ${modelo}</h5>
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-top:4px;"><span>Preço de Vitrine/Anúncio:</span><span>${UI.R(analise.precoRef)}</span></div>
            <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;color:#FFD700;"><span>Teto Captação Loja (Sem defeitos):</span><span>${UI.R(analise.baseCaptacao)}</span></div>
            <div style="margin:8px 0">${desvHtml}</div>
            <hr style="border-color:var(--border-color);margin:8px 0">
            <div style="display:flex;justify-content:space-between;font-weight:800;font-size:16px;margin-top:4px">
                <span>💰 Oferta Segura de Troca:</span><span style="color:var(--accent-green)">${UI.R(analise.valorJusto)}</span>
            </div>
        </div>
        <h4 style="margin:16px 0 8px;color:var(--accent-yellow);font-size:14px">🔄 Produto da Loja que o cliente vai levar:</h4>
        <div class="form-group">
            <label class="form-label">Produto do estoque</label>
            <select class="form-select" id="tr-produto-novo" onchange="UI._trocaFillProd()">${opts}</select>
        </div>
        <div class="form-row">
            <div class="form-group"><label class="form-label">Custo (R$)</label><input class="form-input" id="tr-custo-novo" type="number" step="0.01" value="${estoque[0]?.custo || ''}"></div>
            <div class="form-group"><label class="form-label">Preço venda (R$)</label><input class="form-input" id="tr-preco-novo" type="number" step="0.01" value="${estoque[0]?.precoVenda || ''}"></div>
        </div>
        <div class="form-group">
            <label class="form-label">💸 Desconto adicional no aparelho da loja (R$)</label>
            <input class="form-input" id="tr-desconto" type="number" step="0.01" value="0" style="font-size:18px;font-weight:700">
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="UI.modalAvaliarTroca()">← Voltar</button>
            <button class="btn btn-success btn-lg" onclick="UI.trocaResultado()">📊 Gerar Análise Completa</button>
        </div>
    `;
};

UI._trocaFillProd = function () {
    const sel = document.getElementById('tr-produto-novo');
    const opt = sel.options[sel.selectedIndex];
    document.getElementById('tr-custo-novo').value = opt.dataset.custo || '';
    document.getElementById('tr-preco-novo').value = opt.dataset.preco || '';
};

UI.trocaResultado = function () {
    const custoNovo = parseFloat(document.getElementById('tr-custo-novo').value);
    const precoNovo = parseFloat(document.getElementById('tr-preco-novo').value);
    const desconto = parseFloat(document.getElementById('tr-desconto').value) || 0;
    if (!custoNovo || !precoNovo) return UI.toast('Preencha custo e preço', 'error');
    if (desconto >= precoNovo) return UI.toast('Desconto inválido!', 'error');
    UI._trocaDados.produtoNovoId = document.getElementById('tr-produto-novo').value;
    UI._trocaDados.custoNovo = custoNovo;
    UI._trocaDados.precoNovo = precoNovo;
    UI._renderResultado(desconto);
};

UI._renderResultado = function (desconto) {
    const d = UI._trocaDados;
    const analise = d.analise;
    const r = TrocaEngine.analisarTroca(analise, d.custoNovo, d.precoNovo, desconto);
    d.resultado = r;
    d.descontoAtual = desconto;
    const produto = dataManager.getEstoqueCelulares().find(p => String(p.id) === String(d.produtoNovoId));
    const prodNome = produto ? produto.nome : 'Produto';
    const voltaCliente = Math.max(0, r.precoFinal - analise.valorJusto);

    const emojiRec = r.recomendacao === 'aceitar' ? '✅' : r.recomendacao === 'cautela' ? '⚠️' : '❌';
    const corRec = r.recomendacao === 'aceitar' ? 'var(--accent-green)' : r.recomendacao === 'cautela' ? 'var(--accent-yellow)' : 'var(--accent-red)';
    const textoRec = r.recomendacao === 'aceitar' ? 'ACEITAR A TROCA' : r.recomendacao === 'cautela' ? 'ACEITAR COM CAUTELA' : 'RECUSAR TROCA';

    document.getElementById('troca-step-2').style.display = 'none';
    const res = document.getElementById('troca-resultado');
    res.style.display = 'block';
    res.innerHTML = `
        <div class="troca-relatorio">
            <div class="troca-relatorio-header">
                <span class="troca-step-badge" style="background:var(--gradient-main);color:#fff">ANÁLISE COMPLETA</span>
                <h3>📱 ${analise.modelo} → ${prodNome}</h3>
            </div>
            <div class="troca-section">
                <h5 class="troca-section-title">💰 RESUMO FINANCEIRO DA TROCA</h5>
                <div class="troca-valores-grid">
                    <div class="troca-valor-item"><span>Preço Vitrine Usado</span><strong>${UI.R(analise.precoRef)}</strong></div>
                    <div class="troca-valor-item"><span>Teto Captação Loja</span><strong>${UI.R(analise.baseCaptacao)}</strong></div>
                    <div class="troca-valor-item"><span>Crédito Ofertado no Usado</span><strong style="color:var(--accent-green)">${UI.R(analise.valorJusto)}</strong></div>
                    <div class="troca-valor-item"><span>Aparelho da Loja (c/ desc.)</span><strong>${UI.R(r.precoFinal)}</strong></div>
                    <div class="troca-valor-item"><span>VOLTA DO CLIENTE</span><strong style="color:#00FFA3;font-size:18px;">${UI.R(voltaCliente)}</strong></div>
                </div>
            </div>
            <div class="troca-recomendacao" style="border-color:${corRec}">
                <div class="troca-rec-emoji">${emojiRec}</div>
                <div class="troca-rec-texto" style="color:${corRec}">${textoRec}</div>
                <p style="font-size:13px;color:var(--text-muted)">${r.motivo}</p>
            </div>
            <div class="modal-footer" style="margin-top:20px">
                <button class="btn btn-ghost" onclick="UI.modalAvaliarTroca()">🔄 Nova</button>
                <button class="btn btn-ghost" onclick="UI.closeModal()">Fechar</button>
                <button class="btn btn-success btn-lg" onclick="UI.registrarTroca()">✅ Registrar Troca</button>
            </div>
        </div>
    `;
};

UI.trocaRecalcular = function (val) {
    UI._renderResultado(val);
};

UI.registrarTroca = function () {
    const d = UI._trocaDados;
    const r = d.resultado;
    const analise = d.analise;
    const precoFinalTroca = r.precoFinal || 0;
    const valorJustoTroca = analise.valorJusto || 0;
    const volta = Math.max(0, precoFinalTroca - valorJustoTroca);
    const descTroca = `Troca: ${d.modelo} (usado avaliado em ${UI.R(valorJustoTroca)}) — Volta do cliente: ${UI.R(volta)}`;
    const venda = dataManager.registrarTrocaNoEstoque(d.produtoNovoId, precoFinalTroca, valorJustoTroca, descTroca, {
        modeloUsado: d.modelo,
        formaPagamento: 'pix'
    });
    if (!venda.sucesso) return UI.toast(venda.erro || 'Erro ao registrar troca', 'error');

    const statusUsado = analise.custoReparo > 0 ? 'pendente_reparo' : 'disponivel';
    const precoRevenda = analise.revendaReparado || analise.precoRef;
    const novoId = Date.now();

    dataManager.data.estoqueCelulares.push({
        id: novoId,
        nome: `${d.modelo} (Troca)`,
        custo: valorJustoTroca,
        precoVenda: Math.round(precoRevenda),
        condicao: 'Seminovo (Troca)',
        categoria: 'smartphone',
        quantidade: 1,
        dataCompra: dataManager.hojeLocal ? dataManager.hojeLocal() : new Date().toISOString().split('T')[0],
        status: statusUsado
    });

    dataManager.saveData();

    UI.openModal('✅ Troca Registrada!', `
        <div style="text-align:center;padding:8px 0">
            <div style="font-size:48px">🎉</div>
            <h3 style="color:var(--accent-green)">Troca registrada com sucesso!</h3>
        </div>
        <div class="troca-section" style="margin-top:16px">
            <h5 style="color:var(--accent-red)">📱 SAIU DO ESTOQUE:</h5>
            <p>${venda.produto} — Venda: ${UI.R(precoFinalTroca)}</p>
        </div>
        <div class="troca-section">
            <h5 style="color:var(--accent-green)">📱 ENTROU NO ESTOQUE:</h5>
            <p>${d.modelo} — Custo de Entrada: <strong>${UI.R(valorJustoTroca)}</strong> | Preço Vitrine Sugerido: <strong>${UI.R(precoRevenda)}</strong></p>
        </div>
        <div class="troca-section">
            <h5 style="color:var(--accent-cyan)">💰 VOLTA RECEBIDA DO CLIENTE:</h5>
            <p style="font-size:20px;font-weight:900;color:var(--accent-green)">${UI.R(volta)}</p>
        </div>
        <div class="modal-footer" style="display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn btn-ghost" onclick="UI.closeModal(); UI.render();">Voltar</button>
            <button class="btn btn-primary btn-lg" onclick="UI._abrirModalAssinaturaTroca()">✍️ Termo & Assinatura Digital</button>
        </div>
    `);
};

UI._abrirModalAssinaturaTroca = function () {
    const d = UI._trocaDados || {};
    const aparelho = d.modelo || (window._troqState ? window._troqState.device : 'Aparelho Celular Usado');
    const clienteNome = d.cliente || 'Cliente';
    const html = `
        <div style="padding:10px;">
            <h3 style="color:#00FFA3;font-size:20px;margin:0 0 10px 0;">✍️ TERMO DE PROCEDÊNCIA & ASSINATURA DIGITAL</h3>
            <div style="background:rgba(255,255,255,0.03);border:1px dashed rgba(255,255,255,0.2);padding:12px;border-radius:10px;font-size:12px;color:var(--text-muted);margin-bottom:12px;max-height:100px;overflow-y:auto;">
                <strong>DECLARAÇÃO DE ORIGEM E LEGALIDADE:</strong><br>
                Eu, abaixo assinado(a), declaro sob as penas da lei que o aparelho <strong>${aparelho}</strong> entregue como parte de pagamento/compra à loja <strong>Cesinha Acessórios</strong> é de minha propriedade exclusiva, livre de qualquer impedimento legal, furto, roubo ou bloqueio de operadora/iCloud/Google, assumindo total responsabilidade civil e criminal sobre sua procedência.
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
                <div><label class="form-label" style="font-size:12px;">Nome do Cliente:</label><input class="form-input" id="term-nome" value="${clienteNome}" placeholder="Nome Completo"></div>
                <div><label class="form-label" style="font-size:12px;">CPF / RG:</label><input class="form-input" id="term-doc" placeholder="000.000.000-00"></div>
            </div>
            <label class="form-label" style="font-size:12px;">Assinatura Digital na Tela (Desenhe abaixo):</label>
            <div style="position:relative;background:#fff;border-radius:10px;overflow:hidden;margin-bottom:14px;touch-action:none;">
                <canvas id="canvas-assinatura" width="500" height="150" style="width:100%;height:150px;cursor:crosshair;display:block;"></canvas>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:16px;">
                <button class="btn btn-sm btn-ghost" onclick="UI._limparCanvasAssinatura()">🗑️ Limpar Assinatura</button>
                <span style="font-size:11px;color:var(--text-muted);">Assine com a ponta do dedo ou mouse</span>
            </div>
            <div style="display:flex;gap:10px;">
                <button class="btn btn-ghost" style="flex:1;" onclick="UI.closeModal();">Fechar</button>
                <button class="btn btn-success btn-lg" style="flex:2;font-weight:900;" onclick="UI._salvarEImprimirTermoAssinado('${aparelho.replace(/'/g, "\\'")}')">🖨️ IMPRIMIR / PDF COM ASSINATURA</button>
            </div>
        </div>
    `;
    UI.openModal('✍️ Termo de Procedência', html);

    setTimeout(() => {
        const canvas = document.getElementById('canvas-assinatura');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let isDrawing = false;
        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return { x: clientX - rect.left, y: clientY - rect.top };
        };
        const startDraw = (e) => { isDrawing = true; const pos = getPos(e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); };
        const draw = (e) => { if (!isDrawing) return; const pos = getPos(e); ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#000'; ctx.lineTo(pos.x, pos.y); ctx.stroke(); };
        const stopDraw = () => { isDrawing = false; };
        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDraw);
        canvas.addEventListener('touchstart', startDraw);
        canvas.addEventListener('touchmove', draw);
        canvas.addEventListener('touchend', stopDraw);
    }, 200);
};

UI._limparCanvasAssinatura = function () {
    const canvas = document.getElementById('canvas-assinatura');
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
};

UI._salvarEImprimirTermoAssinado = function (aparelho) {
    const nome = document.getElementById('term-nome')?.value || 'Cliente';
    const doc = document.getElementById('term-doc')?.value || 'Não informado';
    const canvas = document.getElementById('canvas-assinatura');
    const signatureData = canvas ? canvas.toDataURL() : '';
    const win = window.open('', '_blank');
    win.document.write(`
        <html><head><title>Recibo & Termo de Procedência — ${aparelho}</title></head>
        <body style="font-family:sans-serif;padding:30px;color:#000;">
            <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:15px;margin-bottom:20px;">
                <h1 style="margin:0;">CESINHA ACESSÓRIOS</h1>
                <p style="margin:4px 0;">Amargosa — Bahia | Recibo de Aquisição de Aparelho Usado</p>
            </div>
            <h3>TERMO DE DECLARAÇÃO DE PROCEDÊNCIA LEGAL</h3>
            <p style="font-size:14px;line-height:1.6;">
                Eu, <strong>${nome}</strong>, inscrito(a) no CPF/RG <strong>${doc}</strong>, declaro para os devidos fins de direito que o aparelho smartphone <strong>${aparelho}</strong> entregue como parte de negociação na loja Cesinha Acessórios é de minha inteira responsabilidade, atestando sua origem legal e isenção de bloqueios funcionais ou de furto/roubo.
            </p>
            <div style="margin-top:40px;display:flex;justify-content:space-between;align-items:end;">
                <div>
                    <p style="margin:0;font-size:12px;">Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</p>
                    <p style="margin:4px 0 0 0;font-size:12px;">Vendedor Responsável: Cesinha Acessórios</p>
                </div>
                <div style="text-align:center;">
                    <img src="${signatureData}" style="max-height:80px;border-bottom:1px solid #000;display:block;margin:0 auto 5px auto;">
                    <strong style="font-size:13px;">${nome}</strong><br>
                    <span style="font-size:11px;">Assinatura Digital do Vendedor/Doador</span>
                </div>
            </div>
            <script>window.print();</script>
        </body></html>
    `);
    win.document.close();
    UI.closeModal();
    UI.toast('✅ Recibo com assinatura enviado para impressão!', 'success');
};
