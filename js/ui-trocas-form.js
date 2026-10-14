// ====================================
// STRATEGYOS 3.0 - UI AVALIADOR DE TROCAS
// Interface com template exato de perguntas
// ====================================

UI._trocaDados = {};

// === PÁGINA PRINCIPAL DE TROCAS — TROQ TRADE-IN OS v2.4 ===
UI.renderTrocas = function () {
    const hist = (dataManager.data.historico.movimentacoes || []).filter(m => m.tipo === 'troca');

    // Estado da avaliação atual
    window._troqState = window._troqState || {
        device: 'iphone 13 128gb',
        battery: 88,
        screen: 'leves',
        defects: new Set(),
        accessories: new Set(['box', 'cable']),
        newPhone: 'iphone 15 pro'
    };

    let html = `
    <div style="max-width:1400px;margin:0 auto;padding:10px;">
        <!-- CSS ESTILO FUTURISTA GLASS NEON (DO DESIGN TROQ) -->
        <style>
            :root { --tr-neon:#00FFA3; --tr-neon2:#B6FF5C; --tr-bg:#060809; }
            .tr-glass {
                background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015));
                border: 1px solid rgba(255,255,255,0.085);
                backdrop-filter: blur(20px);
                border-radius: 18px;
                padding: 20px;
                position: relative;
            }
            .tr-micro { font-family: monospace; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #8FA79B; }
            .tr-step-num {
                font-family: monospace; font-size: 12px; font-weight: 700; color: var(--tr-neon);
                border: 1px solid rgba(0,255,163,0.3); border-radius: 8px; padding: 4px 8px;
                background: rgba(0,255,163,0.06);
            }
            .tr-pill-btn {
                display: flex; flex-direction: column; padding: 12px 14px; border-radius: 12px; cursor: pointer;
                border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.025); transition: all 0.2s;
                font-size: 13px; font-weight: 600; color: #FFF;
            }
            .tr-pill-btn.active {
                border-color: rgba(0,255,163,0.65); background: rgba(0,255,163,0.08); color: var(--tr-neon);
                box-shadow: 0 0 20px rgba(0,255,163,0.15);
            }
            .tr-def-row {
                display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: 10px;
                border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); cursor: pointer; transition: all 0.2s;
            }
            .tr-def-row.active {
                border-color: #FF5A6E; background: rgba(255,90,110,0.12); color: #FFB9C1;
            }
            .tr-total-val {
                font-size: 42px; font-weight: 900; letter-spacing: -0.03em;
                background: linear-gradient(100deg, #EDFF8F 0%, #6DFFB4 50%, #00FFA3 100%);
                -webkit-background-clip: text; background-clip: text; color: transparent;
                text-shadow: 0 0 24px rgba(0,255,163,0.3);
            }
        </style>

        <!-- CABEÇALHO DA TELA -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
            <div>
                <span class="vendedor-step-badge" style="background:#00FFA3;color:#04120B;font-weight:900;">TROQ. TRADE-IN OS v2.4</span>
                <h2 style="margin:4px 0 0;font-size:28px;color:#FFF;font-weight:800;">🔄 AVALIAÇÃO DE TROCA PROFISSIONAL</h2>
                <p style="margin:4px 0 0;color:var(--text-muted);font-size:15px;">Checklist em tempo real de desvalorização, saúde da bateria, defeitos e acessórios</p>
            </div>
            <div style="display:flex;gap:10px;">
                <button class="btn btn-primary" onclick="UI.modalAvaliarTroca()" style="font-size:14px;padding:10px 18px;">📋 Checklist Clássico</button>
            </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr;gap:24px;" class="grid-troq-container">
            <!-- PAINEL PRINCIPAL DE AVALIAÇÃO -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:24px;">
                <!-- ESQUERDA: PERGUNTAS E CHECKLIST -->
                <div style="display:flex;flex-direction:column;gap:16px;">
                    
                    <!-- PASSO 01: APARELHO USADO -->
                    <div class="tr-glass">
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                            <span class="tr-step-num">01</span>
                            <div>
                                <h3 style="margin:0;font-size:16px;color:#FFF;font-weight:700;">Aparelho Usado do Cliente</h3>
                                <div class="tr-micro">MODELO EM AVALIAÇÃO</div>
                            </div>
                        </div>
                        <label class="form-label" style="font-size:13px;color:var(--text-muted);">Digite o modelo ou selecione da lista:</label>
                        <input class="form-input" id="troq-input-dev" value="${window._troqState.device}" placeholder="Ex: iPhone 13 128GB ou Galaxy S23" style="font-size:16px;padding:10px;" oninput="UI._troqAtualizar();">
                        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
                            ${['iphone 11 64gb', 'iphone 12 128gb', 'iphone 13 128gb', 'iphone 14 128gb', 'samsung a54 128gb', 'samsung s23 128gb'].map(m => `
                                <button class="btn btn-sm btn-ghost" style="font-size:11px;padding:4px 8px;" onclick="document.getElementById('troq-input-dev').value='${m}';UI._troqAtualizar();">${m.toUpperCase()}</button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- PASSO 02: BATERIA -->
                    <div class="tr-glass">
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                            <span class="tr-step-num">02</span>
                            <div>
                                <h3 style="margin:0;font-size:16px;color:#FFF;font-weight:700;">Saúde da Bateria (%)</h3>
                                <div class="tr-micro">CAPACIDADE MÁXIMA NOS AJUSTES</div>
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:14px;margin-bottom:10px;">
                            <div style="font-size:36px;font-weight:900;color:var(--tr-neon);"><span id="troq-bat-val">${window._troqState.battery}</span>%</div>
                            <span id="troq-bat-tier" style="background:rgba(0,255,163,0.1);color:var(--tr-neon);border:1px solid rgba(0,255,163,0.3);padding:4px 10px;border-radius:20px;font-size:12px;font-weight:800;">BOA</span>
                        </div>
                        <input type="range" id="troq-bat-slider" min="50" max="100" value="${window._troqState.battery}" style="width:100%;cursor:pointer;" oninput="document.getElementById('troq-bat-val').textContent=this.value;UI._troqAtualizar();">
                        <div style="display:flex;justify-space-between;font-size:11px;color:var(--text-muted);margin-top:4px;">
                            <span>50% (Troca Recomendada)</span>
                            <span>100% (Perfeita)</span>
                        </div>
                    </div>

                    <!-- PASSO 03: TELA -->
                    <div class="tr-glass">
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                            <span class="tr-step-num">03</span>
                            <div>
                                <h3 style="margin:0;font-size:16px;color:#FFF;font-weight:700;">Condição da Tela</h3>
                                <div class="tr-micro">ESTADO FÍSICO DO DISPLAY</div>
                            </div>
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                            <div class="tr-pill-btn ${window._troqState.screen === 'perfeita' ? 'active' : ''}" onclick="UI._troqSetScreen('perfeita')">
                                ✨ Perfeita <span style="font-size:10px;opacity:0.7">Sem marcas (-0%)</span>
                            </div>
                            <div class="tr-pill-btn ${window._troqState.screen === 'leves' ? 'active' : ''}" onclick="UI._troqSetScreen('leves')">
                                🔍 Riscos Leves <span style="font-size:10px;opacity:0.7">Arranhões finos (-10%)</span>
                            </div>
                            <div class="tr-pill-btn ${window._troqState.screen === 'profundos' ? 'active' : ''}" onclick="UI._troqSetScreen('profundos')">
                                ⚠️ Riscos Profundos <span style="font-size:10px;opacity:0.7">Marcas visíveis (-26%)</span>
                            </div>
                            <div class="tr-pill-btn ${window._troqState.screen === 'trincada' ? 'active' : ''}" onclick="UI._troqSetScreen('trincada')">
                                ⚡ Trincada / Quebrada <span style="font-size:10px;opacity:0.7">Requer troca de vidro (-52%)</span>
                            </div>
                        </div>
                    </div>

                    <!-- PASSO 04: DEFEITOS -->
                    <div class="tr-glass">
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                            <span class="tr-step-num">04</span>
                            <div>
                                <h3 style="margin:0;font-size:16px;color:#FFF;font-weight:700;">Defeitos Funcionais</h3>
                                <div class="tr-micro">MARQUE O QUE NÃO FUNCIONA</div>
                            </div>
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                            ${[
                                { key: 'faceid', label: 'Face ID / Biometria', desc: '-R$ 280' },
                                { key: 'camera', label: 'Câmeras', desc: '-R$ 320' },
                                { key: 'botoes', label: 'Botões Físicos', desc: '-R$ 130' },
                                { key: 'audio', label: 'Áudio / Microfone', desc: '-R$ 160' },
                                { key: 'carga', label: 'Conector Carga', desc: '-R$ 210' },
                                { key: 'carcaca', label: 'Carcaça / Traseira', desc: '-R$ 250' }
                            ].map(d => `
                                <div class="tr-def-row ${window._troqState.defects.has(d.key) ? 'active' : ''}" onclick="UI._troqToggleDefect('${d.key}')">
                                    <span style="font-size:13px;font-weight:600;">${d.label}</span>
                                    <span style="font-size:11px;font-weight:700;">${d.desc}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- PASSO 05: ACESSÓRIOS -->
                    <div class="tr-glass">
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                            <span class="tr-step-num">05</span>
                            <div>
                                <h3 style="margin:0;font-size:16px;color:#FFF;font-weight:700;">Acessórios Inclusos</h3>
                                <div class="tr-micro">GERAM CRÉDITO EXTRA NA TROCA</div>
                            </div>
                        </div>
                        <div style="display:flex;gap:10px;flex-wrap:wrap;">
                            ${[
                                { key: 'box', label: '📦 Caixa Original', bonus: '+R$ 80' },
                                { key: 'charger', label: '⚡ Carregador', bonus: '+R$ 70' },
                                { key: 'cable', label: '🔌 Cabo', bonus: '+R$ 40' },
                                { key: 'invoice', label: '📄 Nota Fiscal', bonus: '+R$ 120' }
                            ].map(a => `
                                <button class="btn btn-sm ${window._troqState.accessories.has(a.key) ? 'btn-success' : 'btn-ghost'}" style="font-size:13px;padding:8px 14px;" onclick="UI._troqToggleAcc('${a.key}')">
                                    ${a.label} (${a.bonus})
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- DIREITA: CARD RESUMO EM TEMPO REAL DO TROQ -->
                <div class="tr-glass" style="border:1px solid rgba(0,255,163,0.3);background:rgba(13,18,16,0.95);position:sticky;top:20px;height:fit-content;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                        <span class="tr-micro" style="color:var(--tr-neon);">🟢 RESUMO DA AVALIAÇÃO DA TROCA</span>
                        <span class="tr-micro">ESTIMATIVA OFICIAL</span>
                    </div>

                    <div style="margin-bottom:16px;">
                        <label class="form-label" style="font-size:12px;color:var(--text-muted);">Aparelho Novo Desejado na Loja:</label>
                        <input class="form-input" id="troq-target-phone" value="${window._troqState.newPhone}" placeholder="Ex: iPhone 14 128GB ou R$ 3500" style="font-size:15px;padding:8px;" oninput="UI._troqAtualizar();">
                    </div>

                    <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:14px;display:flex;flex-direction:column;gap:8px;font-size:13px;" id="troq-breakdown-container">
                        <!-- Renderizado dinamicamente via UI._troqAtualizar() -->
                    </div>

                    <div style="margin-top:20px;padding-top:16px;border-top:1px dashed rgba(0,255,163,0.3);text-align:center;">
                        <div style="font-size:12px;color:var(--tr-neon);font-weight:800;letter-spacing:0.1em;">DIFERENÇA A PAGAR PELO CLIENTE:</div>
                        <div class="tr-total-val" id="troq-final-diff">R$ 0</div>
                        <div style="font-size:12px;color:var(--text-muted);margin-top:4px;" id="troq-inst-info">12x no cartão de crédito via Tuoli</div>
                    </div>

                    <div style="display:flex;flex-direction:column;gap:10px;margin-top:20px;">
                        <button class="btn btn-lg" style="background:linear-gradient(100deg,#B6FF5C,#00FFA3);color:#04120B;font-weight:900;font-size:16px;padding:14px;" onclick="UI._troqSalvarEAprovar()">
                            ✅ Aprovar & Registrar Troca no Caixa
                        </button>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                            <button class="btn btn-ghost btn-sm" onclick="UI._troqEnviarWhatsApp()" style="font-size:12px;">📱 Enviar WhatsApp</button>
                            <a href="recibos.html" target="_blank" class="btn btn-sm" style="font-size:12px;background:rgba(0,255,163,0.1);color:#00FFA3;border:1px solid #00FFA3;text-decoration:none;display:flex;align-items:center;justify-content:center;">✍️ Assinatura Digital</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    document.getElementById('main-content').innerHTML = html;
    setTimeout(() => UI._troqAtualizar(), 50);
};

// HELPER METHOD DE ATUALIZAÇÃO DO TROQ
UI._troqSetScreen = function (scr) {
    window._troqState.screen = scr;
    UI.renderTrocas();
};

UI._troqToggleDefect = function (key) {
    if (window._troqState.defects.has(key)) window._troqState.defects.delete(key);
    else window._troqState.defects.add(key);
    UI.renderTrocas();
};

UI._troqToggleAcc = function (key) {
    if (window._troqState.accessories.has(key)) window._troqState.accessories.delete(key);
    else window._troqState.accessories.add(key);
    UI.renderTrocas();
};

UI._troqAtualizar = function () {
    const devInput = document.getElementById('troq-input-dev')?.value?.trim() || 'iphone 13 128gb';
    const batSlider = parseInt(document.getElementById('troq-bat-slider')?.value || 88);
    const targetPhoneInput = document.getElementById('troq-target-phone')?.value?.trim() || 'iphone 15 pro';

    window._troqState.device = devInput;
    window._troqState.battery = batSlider;
    window._troqState.newPhone = targetPhoneInput;

    // 1. Preço base de mercado do seminovo em estado perfeito
    let baseUsado = 2500;
    const devLower = devInput.toLowerCase();
    
    if (window.dataManager && dataManager.data.precosReferenciaUsados && dataManager.data.precosReferenciaUsados[devLower]) {
        baseUsado = dataManager.data.precosReferenciaUsados[devLower];
    } else {
        const busca = window.TrocaEngine ? TrocaEngine.buscarPreco(devInput) : null;
        if (busca) baseUsado = busca.preco;
    }

    // 2. Preço de compra ALVO da loja (50% do valor de mercado)
    // Exemplo real: comprar por R$ 550 um iPhone de R$ 1.100 para revender e ter margem real
    const valorCompraAlvo = Math.round(baseUsado * 0.50);

    // 3. Abatimentos proporcionais ao valor de mercado do aparelho
    let batDed = 0;
    if (batSlider < 80) batDed = Math.round(baseUsado * 0.12);
    else if (batSlider < 90) batDed = Math.round(baseUsado * 0.05);

    let scrDed = 0;
    if (window._troqState.screen === 'leves') scrDed = Math.round(baseUsado * 0.10);
    else if (window._troqState.screen === 'profundos') scrDed = Math.round(baseUsado * 0.25);
    else if (window._troqState.screen === 'trincada') scrDed = Math.round(baseUsado * 0.50);

    let defDed = 0;
    if (window._troqState.defects.has('faceid')) defDed += Math.round(baseUsado * 0.15);
    if (window._troqState.defects.has('camera')) defDed += Math.round(baseUsado * 0.12);
    if (window._troqState.defects.has('botoes')) defDed += Math.round(baseUsado * 0.05);
    if (window._troqState.defects.has('audio')) defDed += Math.round(baseUsado * 0.06);
    if (window._troqState.defects.has('carga')) defDed += Math.round(baseUsado * 0.08);
    if (window._troqState.defects.has('carcaca')) defDed += Math.round(baseUsado * 0.10);

    let accAdd = 0;
    if (window._troqState.accessories.has('box')) accAdd += 80;
    if (window._troqState.accessories.has('charger')) accAdd += 70;
    if (window._troqState.accessories.has('cable')) accAdd += 40;
    if (window._troqState.accessories.has('invoice')) accAdd += 120;

    // 4. Crédito de troca oferecido ao cliente
    let creditoTroca = Math.max(50, Math.round(valorCompraAlvo - batDed - scrDed - defDed + accAdd));

    // Trava de segurança: Crédito não pode ultrapassar 60% do valor de mercado
    const maxCredit = Math.round(baseUsado * 0.60);
    if (creditoTroca > maxCredit) creditoTroca = maxCredit;

    // 5. Métricas de lucratividade da loja
    const revendaEstimada = baseUsado; // Preço estimado de venda seminovo na loja
    const lucroEstimado = Math.max(0, revendaEstimada - creditoTroca); // Lucro na revenda
    const markupLoja = creditoTroca > 0 ? Math.round((lucroEstimado / creditoTroca) * 100) : 0; // ROI

    // 6. Classificação e orientação visual para a vendedora
    let recomendacao = '';
    let recomendacaoCor = '';
    let recomendacaoBg = '';

    const temMuitosDefeitos = window._troqState.defects.size >= 2 || window._troqState.screen === 'trincada';
    const celularBaixoValor = baseUsado <= 400;

    if (lucroEstimado < 250 || markupLoja < 40 || (celularBaixoValor && temMuitosDefeitos)) {
        recomendacao = `⛔ <strong>RECUSAR TROCA / POUCO LUCRO OU DINHEIRO PARADO</strong><br><span style="font-size:11px;opacity:0.9;">Lucro estimado baixo (${UI.R(lucroEstimado)} | +${markupLoja}% ROI). Alto risco de dinheiro parado no estoque e dor de cabeça para vender!</span>`;
        recomendacaoCor = '#FF4D4D';
        recomendacaoBg = 'rgba(255, 77, 77, 0.15)';
    } else if (lucroEstimado >= 450 && markupLoja >= 70) {
        recomendacao = `🔥 <strong>EXCELENTE OPORTUNIDADE (CELULAR BOM PARA A LOJA)!</strong><br><span style="font-size:11px;opacity:0.9;">Alta procura e excelente margem de revenda (Lucro est.: ${UI.R(lucroEstimado)} | +${markupLoja}% ROI). Pode fechar o negócio com confiança!</span>`;
        recomendacaoCor = '#00FFA3';
        recomendacaoBg = 'rgba(0, 255, 163, 0.15)';
    } else {
        recomendacao = `⚠️ <strong>OPÇÃO ACEITÁVEL (MARGEM MODERADA)</strong><br><span style="font-size:11px;opacity:0.9;">Lucro estimado em ${UI.R(lucroEstimado)} (+${markupLoja}% ROI). Não conceda descontos adicionais no produto novo.</span>`;
        recomendacaoCor = '#FFD700';
        recomendacaoBg = 'rgba(255, 215, 0, 0.15)';
    }

    // 7. Sincronização do Aparelho Desejado com o Estoque Real da Loja
    const estoqueLoja = window.dataManager ? dataManager.getEstoqueCelulares() : [];
    const itemEstoqueMatch = estoqueLoja.find(p => p.nome.toLowerCase().includes(targetPhoneInput.toLowerCase()) || targetPhoneInput.toLowerCase().includes(p.nome.toLowerCase()));

    let precoNovo = 4500;
    let custoNovoEstoque = 3000;

    if (itemEstoqueMatch) {
        precoNovo = itemEstoqueMatch.precoVenda || 4500;
        custoNovoEstoque = itemEstoqueMatch.custo || Math.round(precoNovo * 0.70);
    } else {
        const buscaNovo = window.TrocaEngine ? TrocaEngine.buscarPreco(targetPhoneInput) : null;
        if (buscaNovo) {
            precoNovo = buscaNovo.preco > 1000 ? buscaNovo.preco : buscaNovo.preco + 1200;
            custoNovoEstoque = Math.round(precoNovo * 0.70);
        }
    }

    const diferencaPagar = Math.max(0, precoNovo - creditoTroca);
    const lucroLiquidoOperacao = (diferencaPagar - custoNovoEstoque) + (baseUsado - creditoTroca);
    const parc12 = window.Calculators ? Calculators.calcularTaxaMaquina(diferencaPagar, 12) : { valorParcela: diferencaPagar / 12 };

    const breakdownEl = document.getElementById('troq-breakdown-container');
    if (breakdownEl) {
        breakdownEl.innerHTML = `
            <!-- TABELA REFERENCIAL (CUSTO LOJA VS ENTRADA CLIENTE) -->
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(0,255,163,0.2);border-radius:10px;padding:10px;margin-bottom:10px;">
                <div style="font-size:11px;color:#00FFA3;font-weight:800;letter-spacing:0.05em;margin-bottom:6px;">📊 TABELA REFERENCIAL ESTOQUE VS ENTRADA:</div>
                <div style="display:flex;justify-content:space-between;font-size:12px;"><span>📱 Nosso Celular em Estoque:</span><strong style="color:#FFF;">${itemEstoqueMatch ? itemEstoqueMatch.nome : targetPhoneInput}</strong></div>
                <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);"><span>🏷️ Custo Real no Estoque:</span><span style="color:#f59e0b;font-weight:700;">${UI.R(custoNovoEstoque)}</span></div>
                <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);"><span>💰 Preço de Venda da Loja:</span><span style="color:#00FFA3;font-weight:700;">${UI.R(precoNovo)}</span></div>
            </div>

            <div style="display:flex;justify-content:space-between;"><span>Preço de Mercado Usado (${devInput}):</span><strong>${UI.R(baseUsado)}</strong></div>
            <div style="display:flex;justify-content:space-between;color:var(--text-muted);font-size:12px;margin-bottom:6px;">
                <span>Meta de Compra Barata (50%):</span><span>${UI.R(valorCompraAlvo)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;color:#FFB9C1;"><span>Desconto Bateria (${batSlider}%):</span><span>-${UI.R(batDed)}</span></div>
            <div style="display:flex;justify-content:space-between;color:#FFB9C1;"><span>Desconto Tela (${window._troqState.screen}):</span><span>-${UI.R(scrDed)}</span></div>
            <div style="display:flex;justify-content:space-between;color:#FFB9C1;"><span>Defeitos (${window._troqState.defects.size}):</span><span>-${UI.R(defDed)}</span></div>
            <div style="display:flex;justify-content:space-between;color:#00FFA3;"><span>Acessórios (${window._troqState.accessories.size}):</span><span>+${UI.R(accAdd)}</span></div>
            
            <div style="margin-top:12px;padding:10px;border-radius:10px;background:${recomendacaoBg};border:1px solid ${recomendacaoCor};color:${recomendacaoCor};font-size:13px;line-height:1.4;">
                ${recomendacao}
            </div>

            <div style="display:flex;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.1);padding-top:10px;margin-top:10px;font-size:14px;color:#00FFA3;font-weight:bold;">
                <span>💰 CRÉDITO AVALIADO (OFERTA):</span><strong>${UI.R(creditoTroca)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-top:4px;">
                <span>📊 LUCRO COMBINADO DA OPERAÇÃO:</span><strong style="color:${lucroLiquidoOperacao >= 400 ? '#00FFA3' : '#FFD700'};">${UI.R(lucroLiquidoOperacao)}</strong>
            </div>
            
            <div style="display:flex;justify-content:space-between;color:var(--text-muted);margin-top:12px;"><span>Aparelho Novo (${targetPhoneInput}):</span><span>${UI.R(precoNovo)}</span></div>
        `;
    }

    const diffEl = document.getElementById('troq-final-diff');
    if (diffEl) diffEl.textContent = UI.R(diferencaPagar);

    const instEl = document.getElementById('troq-inst-info');
    if (instEl) instEl.textContent = `Ou 12x de ${UI.R(parc12.valorParcela || diferencaPagar / 12)} no cartão de crédito`;
};

UI._troqSalvarEAprovar = function () {
    const dev = window._troqState.device;
    const target = window._troqState.newPhone;
    const diff = parseFloat((document.getElementById('troq-final-diff')?.textContent || '0').replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || 0);

    UI._identificarCliente('vender', function(cliente) {
        dataManager.registrarLogHistorico({
            tipo: 'troca',
            cliente: cliente.nome,
            descricao: `🔄 AVALIAÇÃO DE TROCA APROVADA: Recebido ${dev.toUpperCase()} de entrada -> Entregando ${target.toUpperCase()} (Diferença no Caixa: ${UI.R(diff)})`,
            valor: diff,
            caixa: 'caixaSecundario'
        });

        UI.toast('🎉 Avaliação de troca aprovada e registrada no histórico!', 'success');
        UI.renderTrocas();
    });
};

UI._troqEnviarWhatsApp = function () {
    const dev = window._troqState.device;
    const target = window._troqState.newPhone;
    const diff = document.getElementById('troq-final-diff')?.textContent || 'R$ 0,00';
    const msg = `📱 *PROPOSTA OFICIAL DE TROCA (TRADE-IN) — CESINHA ACESSÓRIOS*\n\n` +
        `🔄 *Seu Usado Avaliado*: ${dev.toUpperCase()}\n` +
        `🔋 Saúde Bateria: ${window._troqState.battery}%\n` +
        `✨ Aparelho Novo: ${target.toUpperCase()}\n` +
        `----------------------------------------\n` +
        `💰 *Você Paga Apenas*: ${diff} (à vista no PIX ou em 12x no cartão)\n\n` +
        `Válido para hoje na loja! Venha conferir!`;

    window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(msg), '_blank');
};

UI._troqImprimirRecibo = function () {
    const dev = window._troqState.device;
    const target = window._troqState.newPhone;
    const diff = document.getElementById('troq-final-diff')?.textContent || 'R$ 0,00';
    UI._gerarReciboProfissionalPDF({
        tipoTitulo: 'AVALIAÇÃO DE TROCA (TRADE-IN)',
        cliente: 'Cliente Loja',
        produto: `${target} (Recebendo ${dev})`,
        valor: diff,
        formaPagamento: 'Diferença de Troca',
        vendedor: 'Atendente / Loja'
    });
};

// === PASSO 1: Formulário principal ===
UI.modalAvaliarTroca = function () {
    UI._trocaDados = {};
    UI.openModal('🔍 Avaliador de Trocas — Análise Profunda', `
        <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">
            Responda com a maior precisão possível para uma análise correta.
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
                    <option value="32">32GB</option>
                    <option value="64">64GB</option>
                    <option value="128" selected>128GB</option>
                    <option value="256">256GB</option>
                    <option value="512">512GB</option>
                    <option value="1024">1TB</option>
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
                <input class="form-input" id="tr-bat-pct" type="number" min="0" max="100" placeholder="Ex: 85" style="margin-top:6px" value="">
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
                    <option value="nenhuma">1. Nenhuma — perfeito, sem nenhum arranhão</option>
                    <option value="leves" selected>2. Leves — arranhões superficiais só visíveis com luz</option>
                    <option value="medias">3. Médias — arranhões visíveis, pequenos amassados</option>
                    <option value="graves">4. Graves — muito arranhado, amassado ou quebrado</option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">📦 Tem carregador original e caixa?</label>
                <select class="form-select" id="tr-acessorios">
                    <option value="completo">1. Completo — caixa + carregador + fone</option>
                    <option value="carregador">2. Só carregador</option>
                    <option value="caixa">3. Só caixa</option>
                    <option value="nada" selected>4. Nada — só o aparelho</option>
                </select>
            </div>

            <h4 style="margin:20px 0 6px;color:var(--accent-yellow);font-size:14px">⚠️ Tem algum defeito? <span style="font-weight:400;font-size:12px;color:var(--text-muted)">(Marque todos que existem)</span></h4>
            <div class="troca-defeitos-grid" id="tr-defeitos-grid">
                <label class="troca-check"><input type="checkbox" class="tr-defeito" value="tela_trincada_leve" onchange="UI._trocaDefeitoChange()"><span>1. Tela trincada (leve)</span></label>
                <label class="troca-check"><input type="checkbox" class="tr-defeito" value="tela_trincada_grave" onchange="UI._trocaDefeitoChange()"><span>2. Tela trincada (grave)</span></label>
                <label class="troca-check"><input type="checkbox" class="tr-defeito" value="tela_manchada"><span>3. Tela manchada/queimada</span></label>
                <label class="troca-check" id="tr-def-faceid" style="display:none"><input type="checkbox" class="tr-defeito" value="face_id"><span>4. Face ID não funciona</span></label>
                <label class="troca-check"><input type="checkbox" class="tr-defeito" value="touch_id"><span>5. Touch ID não funciona</span></label>
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

            <h4 style="margin:16px 0 6px;color:var(--accent-purple);font-size:14px">🔧 Peças já trocadas (não oficiais):</h4>
            <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px">
                <label class="troca-check"><input type="checkbox" class="tr-peca" value="tela"><span>1. Tela trocada</span></label>
                <label class="troca-check"><input type="checkbox" class="tr-peca" value="bateria"><span>2. Bateria trocada</span></label>
                <label class="troca-check"><input type="checkbox" class="tr-peca" value="camera"><span>3. Câmera trocada</span></label>
            </div>

            <div class="form-group">
                <label class="form-label">💰 Preço de mercado em estado PERFEITO (R$)</label>
                <input class="form-input" id="tr-preco-ref" type="number" step="0.01" placeholder="OLX / Mercado Livre">
                <span class="form-hint" id="tr-preco-sugestao" style="margin-top:4px;display:block"></span>
            </div>

            <div class="modal-footer">
                <button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
                <button class="btn btn-primary btn-lg" onclick="UI.trocaPasso2()">Próximo → Produto Novo</button>
            </div>
        </div>
        <div id="troca-step-2" style="display:none"></div>
        <div id="troca-resultado" style="display:none"></div>
    `);
    // Auto-detectar Face ID
    setTimeout(() => UI._trocaDetectarModelo(), 100);
};

// Detectar modelo para Face ID / preço
UI._trocaDetectarModelo = function () {
    const modelo = (document.getElementById('tr-modelo')?.value || '').trim();
    const faceIdEl = document.getElementById('tr-def-faceid');
    if (faceIdEl) {
        faceIdEl.style.display = (modelo && TrocaEngine.temFaceId(modelo)) ? '' : 'none';
    }
};

// Sugerir preço da memória
UI._trocaSugerirPreco = function () {
    const modelo = document.getElementById('tr-modelo').value;
    UI._trocaDetectarModelo();
    if (modelo.length < 3) return;
    const mem = TrocaEngine.buscarPreco(modelo);
    const hint = document.getElementById('tr-preco-sugestao');
    const input = document.getElementById('tr-preco-ref');
    if (mem) {
        const fonte = mem.fonte === 'banco' ? '(banco interno)' : mem.fonte === 'parcial' ? '(aproximado)' : `(salvo ${mem.data})`;
        hint.innerHTML = `💡 Sugestão: <strong style="color:var(--accent-green)">${UI.R(mem.preco)}</strong> ${fonte}`;
        if (!input.value) input.value = mem.preco;
    } else {
        hint.innerHTML = '⚠️ Modelo não encontrado. Consulte OLX/ML e informe o preço.';
        input.value = '';
    }
};

// Bateria "Não sei" toggle
UI._trocaBateriaChange = function () {
    const tipo = document.getElementById('tr-bat-tipo').value;
    const pctInput = document.getElementById('tr-bat-pct');
    const extra = document.getElementById('tr-bat-extra');
    if (tipo === 'pct') { pctInput.style.display = ''; extra.style.display = 'none'; }
    else if (tipo === 'naosei') { pctInput.style.display = 'none'; extra.style.display = ''; }
    else { pctInput.style.display = 'none'; extra.style.display = 'none'; }
};

// Inteligência: "não liga" desabilita outros defeitos
UI._trocaDefeitoChange = function () {
    const naoLiga = document.querySelector('.tr-defeito[value="nao_liga"]');
    if (!naoLiga) return;
    const checks = document.querySelectorAll('.tr-defeito:not([value="nao_liga"])');
    if (naoLiga.checked) {
        checks.forEach(c => { c.checked = false; c.disabled = true; c.closest('label').style.opacity = '0.3'; });
    } else {
        checks.forEach(c => { c.disabled = false; c.closest('label').style.opacity = '1'; });
    }
    // Tela trincada leve + grave = só grave
    const leve = document.querySelector('.tr-defeito[value="tela_trincada_leve"]');
    const grave = document.querySelector('.tr-defeito[value="tela_trincada_grave"]');
    if (leve && grave && leve.checked && grave.checked) { leve.checked = false; }
};

// Resolver bateria
UI._resolverBateria = function () {
    const tipo = document.getElementById('tr-bat-tipo').value;
    if (tipo === 'pct') return parseInt(document.getElementById('tr-bat-pct').value) || 75;
    if (tipo === 'boa') return 85;
    if (tipo === 'media') return 70;
    if (tipo === 'ruim') return 50;
    if (tipo === 'naosei') {
        const resp = document.getElementById('tr-bat-resp').value;
        return resp === 'sim' ? 50 : 70;
    }
    return 75;
};

// === PASSO 2: Produto novo ===
UI.trocaPasso2 = function () {
    const modelo = document.getElementById('tr-modelo').value.trim();
    const precoRef = parseFloat(document.getElementById('tr-preco-ref').value);
    if (!modelo) return UI.toast('Informe o modelo do aparelho', 'error');
    if (!precoRef || precoRef <= 0) return UI.toast('Informe o preço de referência', 'error');
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

    let desvHtml = analise.detalhes.filter(d => d.desc > 0).map(d =>
        `<div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0;color:var(--text-muted)">
            <span>• ${d.item}</span>
            <span style="color:var(--accent-red)">-${d.desc}% (-${UI.R(d.valor)})${d.reparo ? ` | reparo ${UI.R(d.reparo)}` : ''}${d.obs ? ` [${d.obs}]` : ''}</span>
        </div>`
    ).join('');

    const estoque = dataManager.getEstoqueCelulares();
    let opts = estoque.map(p => `<option value="${p.id}" data-custo="${p.custo}" data-preco="${p.precoVenda}">${p.nome} — ${UI.R(p.precoVenda)} (custo: ${UI.R(p.custo)})</option>`).join('');

    document.getElementById('troca-step-1').style.display = 'none';
    const s2 = document.getElementById('troca-step-2');
    s2.style.display = 'block';
    s2.innerHTML = `
        <div class="troca-step-header">
            <span class="troca-step-badge">PASSO 2 de 3</span>
            <h4>📊 Resumo + Produto Novo</h4>
        </div>
        <div class="troca-resumo-card">
            <h5 style="color:var(--accent-cyan)">📱 ${modelo}</h5>
            <div style="margin:8px 0">${desvHtml}</div>
            <hr style="border-color:var(--border-color);margin:8px 0">
            <div style="display:flex;justify-content:space-between;font-weight:600;font-size:14px">
                <span>Desvalorização:</span><span style="color:var(--accent-red)">-${analise.desvTotal}%</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-weight:800;font-size:16px;margin-top:4px">
                <span>💰 Valor justo:</span><span style="color:var(--accent-green)">${UI.R(analise.valorJusto)}</span>
            </div>
            ${analise.custoReparo > 0 ? `<div style="display:flex;justify-content:space-between;font-size:13px;margin-top:2px"><span>🔧 Custo reparo:</span><span>${UI.R(analise.custoReparo)}</span></div>` : ''}
        </div>
        <h4 style="margin:16px 0 8px;color:var(--accent-yellow);font-size:14px">🔄 Produto NOVO na troca:</h4>
        <div class="form-group">
            <label class="form-label">Produto do estoque</label>
            <select class="form-select" id="tr-produto-novo" onchange="UI._trocaFillProd()">${opts}</select>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Custo (R$)</label>
                <input class="form-input" id="tr-custo-novo" type="number" step="0.01" value="${estoque[0]?.custo || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Preço venda (R$)</label>
                <input class="form-input" id="tr-preco-novo" type="number" step="0.01" value="${estoque[0]?.precoVenda || ''}">
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">💸 Desconto (R$)</label>
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

// === PASSO 3: Resultado ===
UI.trocaResultado = function () {
    const custoNovo = parseFloat(document.getElementById('tr-custo-novo').value);
    const precoNovo = parseFloat(document.getElementById('tr-preco-novo').value);
    const desconto = parseFloat(document.getElementById('tr-desconto').value) || 0;
    if (!custoNovo || !precoNovo) return UI.toast('Preencha custo e preço', 'error');
    if (desconto >= precoNovo) return UI.toast('Desconto não pode ser >= preço!', 'error');
    UI._trocaDados.produtoNovoId = parseInt(document.getElementById('tr-produto-novo').value);
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

    const emojiRec = r.recomendacao === 'aceitar' ? '✅' : r.recomendacao === 'cautela' ? '⚠️' : '❌';
    const corRec = r.recomendacao === 'aceitar' ? 'var(--accent-green)' : r.recomendacao === 'cautela' ? 'var(--accent-yellow)' : 'var(--accent-red)';
    const textoRec = r.recomendacao === 'aceitar' ? 'ACEITAR A TROCA' : r.recomendacao === 'cautela' ? 'ACEITAR COM CAUTELA' : 'RECUSAR TROCA';

    const alertHtml = r.alertas.map(a =>
        `<div style="padding:8px 12px;font-size:13px;border-radius:var(--radius-sm);margin:4px 0;background:${a.tipo === 'vermelho' ? 'rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.3)'}">${a.msg}</div>`
    ).join('');

    const condHtml = analise.detalhes.filter(x => x.desc > 0).map(x =>
        `<p style="font-size:13px;color:var(--text-muted);margin:2px 0">• ${x.item} <span style="color:var(--accent-red)">(-${x.desc}%${x.reparo ? `, reparo ${UI.R(x.reparo)}` : ''}${x.obs ? ` [${x.obs}]` : ''})</span></p>`
    ).join('');

    document.getElementById('troca-step-2').style.display = 'none';
    const res = document.getElementById('troca-resultado');
    res.style.display = 'block';
    res.innerHTML = `
        <div class="troca-relatorio">
            <div class="troca-relatorio-header">
                <span class="troca-step-badge" style="background:var(--gradient-main);color:#fff">ANÁLISE COMPLETA</span>
                <h3>📱 ${analise.modelo}</h3>
            </div>
            ${alertHtml}

            <div class="troca-section"><h5 class="troca-section-title">📋 CONDIÇÃO DO APARELHO</h5>${condHtml}</div>

            <div class="troca-section">
                <h5 class="troca-section-title">💰 VALORES CALCULADOS</h5>
                <div class="troca-valores-grid">
                    <div class="troca-valor-item"><span>Preço mercado (perfeito)</span><strong>${UI.R(analise.precoRef)}</strong></div>
                    <div class="troca-valor-item"><span>Desvalorização</span><strong style="color:var(--accent-red)">-${analise.desvTotal}%</strong></div>
                    <div class="troca-valor-item"><span>Valor justo</span><strong style="color:var(--accent-green)">${UI.R(analise.valorJusto)}</strong></div>
                    ${analise.custoReparo > 0 ? `<div class="troca-valor-item"><span>Custo reparo</span><strong>${UI.R(analise.custoReparo)}</strong></div>` : ''}
                </div>
            </div>

            <div class="troca-section">
                <h5 class="troca-section-title">🔄 TROCA</h5>
                <div class="troca-valores-grid">
                    <div class="troca-valor-item"><span>Novo</span><strong>${prodNome}</strong></div>
                    <div class="troca-valor-item"><span>Preço normal</span><strong>${UI.R(d.precoNovo)}</strong></div>
                    <div class="troca-valor-item"><span>Desconto</span><strong>${UI.R(desconto)} (${(desconto / d.precoNovo * 100).toFixed(1)}%)</strong></div>
                    <div class="troca-valor-item"><span>Preço final</span><strong>${UI.R(r.precoFinal)}</strong></div>
                    <div class="troca-valor-item"><span>Margem no novo</span><strong style="color:${r.prejuizoNovo ? 'var(--accent-red)' : 'var(--accent-green)'}">${UI.R(r.margemNovo)} (${r.margemNovoPct.toFixed(1)}%)${r.prejuizoNovo ? ' ⚠️ PREJUÍZO' : ''}</strong></div>
                </div>
            </div>

            <div class="troca-cenarios">
                <div class="troca-cenario ${r.cenarioMelhor === 'A' ? 'melhor' : ''}">
                    <h5>📊 CENÁRIO A — Sem Reparar</h5>
                    <p>Revender: ${UI.R(r.cenarioA.revenda)}</p>
                    <p>Lucro usado: ${UI.R(r.cenarioA.lucroUsado)}</p>
                    <div class="troca-cenario-total">💰 ${UI.R(r.cenarioA.lucroTotal)}</div>
                    <p class="troca-cenario-pct">${r.cenarioA.pct.toFixed(1)}% do custo</p>
                    <p class="troca-cenario-tempo">⏱️ ~${r.cenarioA.tempo} dias</p>
                </div>
                <div class="troca-cenario ${r.cenarioMelhor === 'B' ? 'melhor' : ''}">
                    <h5>📊 CENÁRIO B — Com Reparo</h5>
                    <p>Custo reparo: ${UI.R(r.cenarioB.custoReparo)}</p>
                    <p>Revender: ${UI.R(r.cenarioB.revenda)}</p>
                    <div class="troca-cenario-total">💰 ${UI.R(r.cenarioB.lucroTotal)}</div>
                    <p class="troca-cenario-pct">${r.cenarioB.pct.toFixed(1)}% do custo</p>
                    <p class="troca-cenario-tempo">⏱️ ~${r.cenarioB.tempo} dias</p>
                </div>
            </div>

            <div class="troca-recomendacao" style="border-color:${corRec}">
                <div class="troca-rec-emoji">${emojiRec}</div>
                <div class="troca-rec-texto" style="color:${corRec}">${textoRec}</div>
                <p style="font-size:14px;margin:4px 0">Cenário ${r.cenarioMelhor} é mais vantajoso</p>
                <p style="font-size:13px;color:var(--text-muted)">${r.motivo}</p>
                <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border-color)">
                    <p style="font-size:13px">📌 Desconto máximo seguro: <strong style="color:var(--accent-yellow)">${UI.R(r.descontoMax)}</strong></p>
                    ${desconto > r.descontoMax ? `<p style="font-size:12px;color:var(--accent-red)">Está ${UI.R(desconto - r.descontoMax)} acima do seguro!</p>` : ''}
                </div>
            </div>

            <div class="troca-section">
                <h5 class="troca-section-title">🎯 VALORES SUGERIDOS</h5>
                <div class="troca-opcoes">
                    <div class="troca-opcao" onclick="UI.trocaRecalcular(${desconto})">
                        <span class="troca-opcao-label">Atual (${UI.R(desconto)})</span>
                        <span class="troca-opcao-preco">${UI.R(r.opcoes.atual.preco)}</span>
                        <span class="troca-opcao-lucro">Lucro: ${UI.R(r.opcoes.atual.lucro)}</span>
                    </div>
                    <div class="troca-opcao recomendada" onclick="UI.trocaRecalcular(${r.opcoes.seguro.desconto})">
                        <span class="troca-opcao-badge">✅ RECOMENDADO</span>
                        <span class="troca-opcao-label">Seguro (${UI.R(r.opcoes.seguro.desconto)})</span>
                        <span class="troca-opcao-preco">${UI.R(r.opcoes.seguro.preco)}</span>
                        <span class="troca-opcao-lucro" style="color:var(--accent-green)">Lucro: ${UI.R(r.opcoes.seguro.lucro)}</span>
                    </div>
                    <div class="troca-opcao" onclick="UI.trocaRecalcular(${r.opcoes.oferta.desconto})">
                        <span class="troca-opcao-label">Oferta (${UI.R(r.opcoes.oferta.desconto)})</span>
                        <span class="troca-opcao-preco">${UI.R(r.opcoes.oferta.preco)}</span>
                        <span class="troca-opcao-lucro" style="color:var(--accent-green)">Lucro: ${UI.R(r.opcoes.oferta.lucro)} 🎉</span>
                    </div>
                </div>
            </div>

            <div class="troca-section" style="margin-top:16px">
                <h5 class="troca-section-title">💸 Ajustar Desconto</h5>
                <div style="display:flex;gap:8px;align-items:center">
                    <input class="form-input" id="tr-ajuste-desc" type="number" step="10" value="${desconto}" style="max-width:150px;font-size:18px;font-weight:700">
                    <button class="btn btn-primary" onclick="UI.trocaRecalcular(parseFloat(document.getElementById('tr-ajuste-desc').value)||0)">Recalcular</button>
                </div>
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
    UI.toast(`Recalculado: ${UI.R(val)} de desconto`, 'info');
};

// === REGISTRAR TROCA ===
UI.registrarTroca = function () {
    const d = UI._trocaDados;
    const r = d.resultado;
    const analise = d.analise;
    const desconto = d.descontoAtual || 0;

    const precoFinalTroca = r.precoFinal || 0;
    const valorJustoTroca = analise.valorJusto || 0;
    const descTroca = `Troca: ${d.modelo} (usado) por ${UI.R(valorJustoTroca)} — cliente ${precoFinalTroca > valorJustoTroca ? 'pagou diferença ' + UI.R(precoFinalTroca - valorJustoTroca) : 'sem pagamento em dinheiro'}`;
    const venda = dataManager.registrarTrocaNoEstoque(d.produtoNovoId, precoFinalTroca, valorJustoTroca, descTroca);
    if (!venda.sucesso) return UI.toast(venda.erro || 'Erro ao registrar troca', 'error');

    const custoUsado = r.cenarioMelhor === 'B' ? analise.custoReparo : 0;
    const statusUsado = r.cenarioMelhor === 'B' && analise.custoReparo > 0 ? 'pendente_reparo' : 'disponivel';
    const precoRevenda = r.cenarioMelhor === 'B' ? analise.revendaReparado : analise.revendaSemReparo;
    const novoId = Math.max(0, ...dataManager.data.estoqueCelulares.map(p => p.id)) + 1;

    dataManager.data.estoqueCelulares.push({
        id: novoId, nome: `${d.modelo} (Usado)`, custo: custoUsado,
        precoVenda: Math.round(precoRevenda * 100) / 100,
        condicao: 'Usado (troca)', categoria: 'smartphone', meta: 'giro',
        dataCompra: new Date().toISOString().split('T')[0],
        status: statusUsado, giro: 'medio', popularidade: 'medio', idadeModelo: 'medio'
    });

    dataManager.saveData();

    UI.openModal('✅ Troca Registrada!', `
        <div style="text-align:center;padding:8px 0">
            <div style="font-size:48px">🎉</div>
            <h3 style="color:var(--accent-green)">Troca registrada com sucesso!</h3>
        </div>
        <div class="troca-section" style="margin-top:16px">
            <h5 style="color:var(--accent-red)">📱 SAIU:</h5>
            <p>${venda.produto} — Custo ${UI.R(r.custoNovo)}</p>
        </div>
        <div class="troca-section">
            <h5 style="color:var(--accent-green)">📱 ENTROU:</h5>
            <p>${d.modelo} — Custo ${UI.R(custoUsado)} | ${statusUsado === 'pendente_reparo' ? '🔧 Pendente reparo' : '✅ Disponível'}</p>
            <p>Preço sugerido: ${UI.R(precoRevenda)} | Meta: Giro Rápido</p>
        </div>
        <div class="troca-section">
            <h5 style="color:var(--accent-cyan)">💰 IMPACTO:</h5>
            <p style="font-size:18px;font-weight:800;color:var(--accent-green)">Lucro total estimado: ${UI.R(r.cenarioMelhor === 'A' ? r.cenarioA.lucroTotal : r.cenarioB.lucroTotal)}</p>
        </div>
        <div class="troca-section">
            <p style="color:var(--accent-yellow)">🔔 "${d.modelo} disponível — vender por ${UI.R(precoRevenda)}"</p>
        </div>
        <div class="modal-footer" style="display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn btn-ghost" onclick="UI.closeModal(); UI.render();">Voltar ao Dashboard</button>
            <button class="btn btn-primary btn-lg" onclick="UI._abrirModalAssinaturaTroca()">✍️ Termo & Assinatura Digital</button>
        </div>
    `);
};

UI._abrirModalAssinaturaTroca = function () {
    const d = UI._trocaDados || {};
    const aparelho = d.modelo || 'Aparelho Celular Usado';
    const clienteNome = d.cliente || 'Cliente';
    const html = `
        <div style="padding:10px;">
            <h3 style="color:#00FFA3;font-size:20px;margin:0 0 10px 0;">✍️ TERMO DE PROCEDÊNCIA & ASSINATURA DIGITAL</h3>
            <div style="background:rgba(255,255,255,0.03);border:1px dashed rgba(255,255,255,0.2);padding:12px;border-radius:10px;font-size:12px;color:var(--text-muted);margin-bottom:12px;max-height:100px;overflow-y:auto;">
                <strong>DECLARAÇÃO DE ORIGEM E LEGALIDADE:</strong><br>
                Eu, abaixo assinado(a), declaro sob as penas da lei que o aparelho <strong>${aparelho}</strong> entregue como parte de pagamento/compra à loja <strong>Cesinha Acessórios</strong> é de minha propriedade exclusiva, livre de qualquer impedimento legal, furto, roubo ou bloqueio de operadora/iCloud/Google, assumindo total responsabilidade civil e criminal sobre sua procedência.
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
                <div>
                    <label class="form-label" style="font-size:12px;">Nome do Cliente:</label>
                    <input class="form-input" id="term-nome" value="${clienteNome}" placeholder="Nome Completo">
                </div>
                <div>
                    <label class="form-label" style="font-size:12px;">CPF / RG:</label>
                    <input class="form-input" id="term-doc" placeholder="000.000.000-00">
                </div>
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
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
};

UI._salvarEImprimirTermoAssinado = function (aparelho) {
    const nome = document.getElementById('term-nome')?.value || 'Cliente';
    const doc = document.getElementById('term-doc')?.value || 'Não informado';
    const canvas = document.getElementById('canvas-assinatura');
    const signatureData = canvas ? canvas.toDataURL() : '';

    const win = window.open('', '_blank');
    win.document.write(`
        <html>
        <head><title>Recibo & Termo de Procedência — ${aparelho}</title></head>
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
        </body>
        </html>
    `);
    win.document.close();
    UI.closeModal();
    UI.toast('rx Recibo com assinatura enviado para impressão!', 'success');
};
