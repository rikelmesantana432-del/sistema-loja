// StrategyOS 3.1 — Fluxos Vendedor: Conserto, Película, Troca, Parcela, Estoque, Ajuda
// REGRA: NUNCA mostrar custo, margem ou lucro (cliente pode ver a tela)
// CORREÇÃO 2: Fontes GRANDES | CORREÇÃO 5: Troca completa | CORREÇÃO 8: Ajuda completa

// === FLUXO CONSERTO (5 passos) — SEM CUSTOS VISÍVEIS ===
UI._vendedorConserto = function () {
    console.log('=== CONSERTO INICIADO ===');
    UI._consertoData = {};
    UI._consertoClienteRef = null;
    window._osFotosTemp = []; // Limpar cache de fotos ao iniciar novo fluxo
    document.getElementById('main-content').innerHTML = _vndWrap('conserto', `
        <div class="vendedor-step-header"><span class="vendedor-step-badge" style="background:${VENDEDOR_CORES.conserto.accent}">PASSO 1 DE 5</span><h2 style="font-size:28px">🔧 CADASTRO DE CONSERTO — CLIENTE</h2><p style="font-size:20px">Digite o nome ou telefone para buscar o cliente</p></div>
        <div class="vendedor-section" style="max-width:600px;margin:0 auto">
            
            <div style="margin-bottom:16px;text-align:center;">
                <button class="btn btn-primary btn-lg" style="width:100%;font-size:20px;font-weight:900;padding:16px;background:linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);border:2px solid #a78bfa;box-shadow:0 6px 20px rgba(139,92,246,0.35);cursor:pointer;" onclick="UI._consertoClienteGeralRapido()">
                    ⚡ CONSERTO RÁPIDO — CLIENTE GERAL
                </button>
                <div style="font-size:13px;color:var(--text-muted);margin-top:6px;">Avança direto sem precisar cadastrar nome e telefone!</div>
            </div>

            <div style="position:relative;text-align:center;margin:20px 0 16px;border-bottom:1px solid rgba(255,255,255,0.1);"><span style="position:relative;top:10px;background:#1a1f2e;padding:0 12px;font-size:13px;color:#FFD700;font-weight:bold;">OU BUSQUE / CADASTRE O CLIENTE:</span></div>

            <label class="form-label" style="font-size:18px;color:#FFD700">Nome do cliente:</label>
            <input class="form-input" id="cons-nome" placeholder="Digite o nome para buscar..." style="font-size:20px;padding:14px" oninput="UI._consertoBuscarCliente()">
            
            <label class="form-label" style="font-size:18px;margin-top:14px;color:#FFD700">Telefone / WhatsApp:</label>
            <input class="form-input" id="cons-tel" placeholder="(75) 9XXXX-XXXX" maxlength="16" style="font-size:20px;padding:14px" oninput="UI._mascaraTelefone(this);UI._consertoBuscarCliente()">
            
            <div id="cons-sugestoes" style="margin-top:12px"></div>
            <div id="cons-cliente-found" style="margin-top:10px;font-size:15px;color:var(--text-muted)">💡 Ao digitar o nome ou telefone, o sistema busca automaticamente os clientes da loja</div>
        </div>
        <div class="vendedor-nav" style="max-width:600px;margin:20px auto 0">
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI.renderVendedor()">Cancelar</button>
            <button class="btn btn-lg" style="background:${VENDEDOR_CORES.conserto.accent};color:#fff;font-size:20px;padding:14px 28px" onclick="UI._consertoPasso2()">Próximo →</button>
        </div>`);
    setTimeout(() => { const el = document.getElementById('cons-nome'); if (el) el.focus(); }, 150);
};

UI._consertoClienteGeralRapido = function () {
    UI._consertoData.cliente = 'Consumidor Geral';
    UI._consertoData.telefone = '';
    UI._consertoClienteRef = null;
    UI._consertoPasso2();
};

UI._consertoBuscarCliente = function () {
    const nomeInp = document.getElementById('cons-nome');
    const telInp = document.getElementById('cons-tel');
    const statusDiv = document.getElementById('cons-cliente-found');
    const sugestoesDiv = document.getElementById('cons-sugestoes');

    const termNome = (nomeInp?.value || '').toLowerCase().trim();
    const termTel = (telInp?.value || '').replace(/\D/g, '');

    if (termNome.length < 2 && termTel.length < 3) {
        if (sugestoesDiv) sugestoesDiv.innerHTML = '';
        if (statusDiv) statusDiv.innerHTML = '💡 Digite o nome ou telefone para buscar automaticamente';
        UI._consertoClienteRef = null;
        return;
    }

    const clientes = dataManager.getClientes() || [];
    const encontrados = clientes.filter(c => {
        const matchNome = termNome.length >= 2 && (c.nome || '').toLowerCase().includes(termNome);
        const matchTel = termTel.length >= 3 && (c.telefone || '').replace(/\D/g, '').includes(termTel);
        return matchNome || matchTel;
    });

    if (encontrados.length > 0) {
        if (statusDiv) statusDiv.innerHTML = `<span style="color:var(--accent-green);font-weight:bold;">✅ ${encontrados.length} cliente(s) encontrado(s). Clique abaixo para selecionar:</span>`;
        if (sugestoesDiv) {
            sugestoesDiv.innerHTML = encontrados.slice(0, 4).map(c => `
                <div onclick="UI._selecionarClienteConserto('${c.nome.replace(/'/g, "\\'")}', '${c.telefone || ''}')" 
                     style="padding:12px 14px;background:rgba(139,92,246,0.12);border:1px solid #8b5cf6;border-radius:10px;margin-top:8px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:all 0.2s;">
                    <div>
                        <strong style="color:#FFF;font-size:17px">${c.nome}</strong>
                        <div style="font-size:13px;color:var(--text-muted);margin-top:2px;">📞 ${c.telefone || 'Sem telefone'} | 🏆 Score: ${c.score || 50} pts</div>
                    </div>
                    <span style="color:#a78bfa;font-weight:bold;font-size:14px;background:rgba(139,92,246,0.2);padding:6px 12px;border-radius:6px;">SELECIONAR ✓</span>
                </div>
            `).join('');
        }
    } else {
        if (sugestoesDiv) sugestoesDiv.innerHTML = '';
        if (statusDiv) statusDiv.innerHTML = '🆕 Novo cliente — será cadastrado automaticamente com as informações digitadas';
        UI._consertoClienteRef = null;
    }
};

UI._selecionarClienteConserto = function (nome, telefone) {
    const nomeInp = document.getElementById('cons-nome');
    const telInp = document.getElementById('cons-tel');
    const sugestoesDiv = document.getElementById('cons-sugestoes');
    const statusDiv = document.getElementById('cons-cliente-found');

    const clientes = dataManager.getClientes() || [];
    const cliente = clientes.find(c => c.nome === nome || (telefone && c.telefone === telefone));

    if (cliente) {
        if (nomeInp) nomeInp.value = cliente.nome;
        if (telInp) {
            telInp.value = cliente.telefone || '';
            if (UI._mascaraTelefone) UI._mascaraTelefone(telInp);
        }
        UI._consertoClienteRef = cliente;
        if (sugestoesDiv) sugestoesDiv.innerHTML = '';
        if (statusDiv) statusDiv.innerHTML = `<span style="color:var(--accent-green);font-weight:bold;font-size:16px;">✅ Cliente Selecionado: ${cliente.nome}</span>`;
    }
};

UI._consertoPasso2 = function () {
    const nome = document.getElementById('cons-nome')?.value?.trim();
    const tel = document.getElementById('cons-tel')?.value;
    UI._consertoData.cliente = nome || UI._consertoData.cliente || 'Consumidor Geral';
    UI._consertoData.telefone = tel || '';
    document.getElementById('main-content').innerHTML = _vndWrap('conserto', `
        <div class="vendedor-step-header"><span class="vendedor-step-badge" style="background:${VENDEDOR_CORES.conserto.accent}">PASSO 2 DE 5</span><h2 style="font-size:28px">🔧 QUAL O APARELHO?</h2></div>
        <div class="vendedor-section">
            <label class="form-label" style="font-size:18px">Modelo do celular:</label>
            <input class="form-input" id="cons-modelo" placeholder="Ex: Moto G10, iPhone 11, Samsung A54" style="font-size:20px;padding:14px">
        </div>
        <div class="vendedor-nav">
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI._vendedorConserto()">← Voltar</button>
            <button class="btn btn-lg" style="background:${VENDEDOR_CORES.conserto.accent};color:#fff;font-size:20px" onclick="UI._consertoPasso3()">Próximo →</button>
        </div>`);
};

UI._consertoPasso3 = function () {
    const modelo = document.getElementById('cons-modelo')?.value;
    if (!modelo) return UI.toast('Digite o modelo do aparelho', 'error');
    UI._consertoData.modelo = modelo;
    const key = modelo.toLowerCase().trim();
    const keyNorm = key.replace(/[\s-]+/g, '');
    let servicos = dataManager.data.tabelaServicosModelo[key];
    if (!servicos) {
        for (const [k, v] of Object.entries(dataManager.data.tabelaServicosModelo)) {
            const kNorm = k.toLowerCase().replace(/[\s-]+/g, '');
            if (keyNorm === kNorm || keyNorm.includes(kNorm) || kNorm.includes(keyNorm)) { servicos = v; break; }
        }
    }
    if (!servicos) {
        const marca = key.includes('iphone') ? 'iphone' : key.includes('samsung') ? 'samsung' : key.includes('moto') ? 'motorola' : key.includes('redmi') || key.includes('poco') || key.includes('xiaomi') ? 'xiaomi' : key.includes('lg') ? 'lg' : 'generico';
        servicos = dataManager.data.tabelaServicosMarca[marca];
    }
    UI._consertoServicosAtuais = servicos;

    const telaPeca = (servicos.tela || servicos.telaOriginal || { p: 110, m: 50, d: 3 });
    const cTela = telaPeca.p || 110;
    const faixasTela = Calculators._calcularPrecoConsertoEscalonado(cTela, telaPeca.m || 50);
    const sugTela = faixasTela.maximo;

    let html = `<div class="vendedor-step-header"><span class="vendedor-step-badge" style="background:${VENDEDOR_CORES.conserto.accent}">PASSO 3 DE 5</span><h2 style="font-size:28px">🔧 QUAL O SERVIÇO?</h2><p style="font-size:20px">Aparelho: ${modelo}</p></div>`;
    
    // ATALHOS RÁPIDOS DE SERVIÇOS MAIS REQUISITADOS
    html += `
    <div class="vendedor-section" style="margin-bottom:16px;">
        <h3 style="font-size:20px;color:#FFD700;margin-bottom:10px;">⚡ ATALHOS DE SERVIÇOS RÁPIDOS:</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:10px;">
            <div class="vendedor-produto-item" style="padding:12px;border:1px solid #FFD700;background:rgba(255,215,0,0.08);" onclick="UI._consertoPasso4('diagnostico', 0, 1, '🔬 Diagnóstico / Avaliação Técnica', 20)">
                <div><strong style="font-size:16px;color:#FFD700;">🔬 Diagnóstico Técnico</strong><div style="font-size:14px;color:var(--text-muted);">Avaliação | Valor: R$ 20,00</div></div>
            </div>
            <div class="vendedor-produto-item" style="padding:12px;border:1px solid #3b82f6;background:rgba(59,130,246,0.08);" onclick="UI._consertoPasso4('colar_tela', 5, 1, '📲 Colar Tela / Recolagem', 30)">
                <div><strong style="font-size:16px;color:#60a5fa;">📲 Colar Tela / Recolagem</strong><div style="font-size:14px;color:var(--text-muted);">Colagem | Valor: R$ 30,00</div></div>
            </div>
            <div class="vendedor-produto-item" style="padding:12px;border:1px solid #a855f7;background:rgba(168,85,247,0.08);" onclick="UI._consertoPasso4('botao', 10, 1, '🔘 Botões (Power / Volume)', 50)">
                <div><strong style="font-size:16px;color:#c084fc;">🔘 Botões (Power / Volume)</strong><div style="font-size:14px;color:var(--text-muted);">Reparo botões | Valor: R$ 50,00</div></div>
            </div>
            <div class="vendedor-produto-item" style="padding:12px;border:1px solid #10b981;background:rgba(16,185,129,0.08);" onclick="UI._consertoPasso4('conector', 15, 1, '🔌 Conector de Carga', 60)">
                <div><strong style="font-size:16px;color:#34d399;">🔌 Conector de Carga</strong><div style="font-size:14px;color:var(--text-muted);">Troca de conector | Valor: R$ 60,00</div></div>
            </div>
            <div class="vendedor-produto-item" style="padding:12px;border:1px solid #f97316;background:rgba(249,115,22,0.08);" onclick="UI._consertoPasso4('limpeza', 10, 2, '🧹 Limpeza e Desoxidação', 70)">
                <div><strong style="font-size:16px;color:#fb923c;">🧹 Limpeza & Desoxidação</strong><div style="font-size:14px;color:var(--text-muted);">Banho químico | Valor: R$ 70,00</div></div>
            </div>
            <div class="vendedor-produto-item" style="padding:12px;border:1px solid #ec4899;background:rgba(236,72,153,0.08);" onclick="UI._consertoPasso4('software', 0, 1, '💻 Software / Formatação', 60)">
                <div><strong style="font-size:16px;color:#f472b6;">💻 Software / Formatação</strong><div style="font-size:14px;color:var(--text-muted);">Formatação | Valor: R$ 60,00</div></div>
            </div>
        </div>
    </div>`;

    html += `
    <div class="vendedor-section">
        <h3 style="font-size:22px;margin-bottom:10px;">SELECIONE O TIPO DE MANUTENÇÃO:</h3>
        
        <!-- BOTAO PRINCIPAL DE TROCA DE TELA -->
        <div class="vendedor-produto-item" style="padding:16px;border:2px solid #00FFA3;background:rgba(0,255,163,0.06);margin-bottom:12px;cursor:pointer;" onclick="UI._consertoPasso4('tela', ${telaPeca.p || 110}, ${telaPeca.d || 3}, '📱 Troca de Tela')">
            <div class="vendedor-produto-info">
                <div class="vendedor-produto-nome" style="font-size:20px;font-weight:800;color:#00FFA3;">📱 Troca de Tela / Manutenção de Tela</div>
                <div style="font-size:14px;color:var(--text-muted);margin-top:2px;">Prazo: <strong>${telaPeca.d || 3} dias</strong> | Preço Sugerido: <strong style="color:#00FFA3;font-size:18px;">${UI.R(sugTela)}</strong></div>
            </div>
            <div class="vendedor-produto-acoes"><span class="vendedor-produto-btn" style="color:#00FFA3;font-size:16px;font-weight:bold;">ESCOLHER →</span></div>
        </div>
    `;

    const servicoNomesGerais = {
        tela: '📱 Troca de Tela',
        bateria: '🔋 Troca de Bateria',
        conector: '🔌 Conector de Carga',
        camera: '📷 Câmera',
        camera_traseira: '📷 Câmera Traseira',
        botao_home: '🔘 Botão Home / Biometria',
        software: '💻 Software / Formatação',
        limpeza: '🧹 Limpeza & Desoxidação'
    };

    for (const [tipo, dados] of Object.entries(servicos)) {
        if (tipo === 'telaOriginal' || tipo === 'tela2aLinha') continue; // Ignorar duplicatas de qualidade
        if (tipo === 'tela') continue; // Já renderizada no botão principal acima
        const nomeFinal = servicoNomesGerais[tipo] || tipo.replace('_', ' ').toUpperCase();
        const custoPeca = dados.p;
        const custoTotal = dados.p + dados.m;
        const faixasSrv = Calculators._calcularPrecoConsertoEscalonado(custoPeca, dados.m || 40);
        const precoSugerido = faixasSrv.maximo;

        html += `<div class="vendedor-produto-item" style="padding:14px;margin-bottom:8px;" onclick="UI._consertoPasso4('${tipo}',${custoPeca},${dados.d},'${nomeFinal}')">
            <div class="vendedor-produto-info">
                <div class="vendedor-produto-nome" style="font-size:18px;font-weight:700;">${nomeFinal}</div>
                <div class="vendedor-produto-detalhe" style="font-size:15px;margin-top:4px;">Prazo: <strong>${dados.d} dias</strong> | Preço Sugerido: <strong style="color:#00FFA3;font-size:17px;">${UI.R(precoSugerido)}</strong></div>
            </div>
            <div class="vendedor-produto-acoes"><span class="vendedor-produto-btn" style="color:${VENDEDOR_CORES.conserto.accent};font-size:16px;font-weight:bold;">ESCOLHER →</span></div>
        </div>`;
    }
    html += `<div class="vendedor-produto-item" style="padding:14px" onclick="UI._consertoOutro()"><div class="vendedor-produto-info"><div class="vendedor-produto-nome" style="font-size:18px">🔧 Outro serviço personalizado</div></div><div class="vendedor-produto-acoes"><span class="vendedor-produto-btn">→</span></div></div></div>`;
    html += `<div class="vendedor-nav"><button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI._consertoPasso2()">← Voltar</button></div>`;
    document.getElementById('main-content').innerHTML = _vndWrap('conserto', html);
};

// REDIRECIONAMENTO DIRETO (SEM SUB-MENU DE QUALIDADES)
UI._consertoEscolherTela = function () {
    const servicos = UI._consertoServicosAtuais || {};
    const telaInfo = servicos.tela || servicos.telaOriginal || { p: 110, m: 50, d: 3 };
    UI._consertoPasso4('tela', telaInfo.p, telaInfo.d, '📱 Troca de Tela');
};

UI._consertoOutro = function () {
    document.getElementById('main-content').innerHTML = _vndWrap('conserto', `
        <div class="vendedor-step-header"><span class="vendedor-step-badge" style="background:${VENDEDOR_CORES.conserto.accent}">PASSO 3 DE 5</span><h2 style="font-size:28px">🔧 SERVIÇO PERSONALIZADO</h2></div>
        <div class="vendedor-section">
            <label class="form-label" style="font-size:18px">Descrição do serviço:</label><input class="form-input" id="cons-desc" placeholder="Ex: Trocar alto falante" style="font-size:20px;padding:14px">
            <label class="form-label" style="font-size:18px;margin-top:12px">Prazo (dias):</label><input class="form-input" id="cons-prazo" type="number" value="3" style="font-size:20px;padding:14px">
        </div>
        <div class="vendedor-nav">
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI._consertoPasso3()">← Voltar</button>
            <button class="btn btn-lg" style="background:${VENDEDOR_CORES.conserto.accent};color:#fff;font-size:20px" onclick="UI._consertoPasso4(document.getElementById('cons-desc').value, 0, parseInt(document.getElementById('cons-prazo').value)||3, document.getElementById('cons-desc').value)">Próximo →</button>
        </div>`);
};

UI._consertoPasso4 = function (tipo, custoInterno, prazo, nomeServico, valorFixoPredefinido) {
    UI._consertoData.servico = nomeServico || tipo;
    UI._consertoData._custoInterno = custoInterno;
    UI._consertoData.prazo = prazo;
    let precos = [];
    let valorPadraoInput = valorFixoPredefinido || '';
    if (valorFixoPredefinido) {
        precos = [{ label: '⚡ VALOR PADRÃO DO SERVIÇO', valor: valorFixoPredefinido, cor: '#00d97e', destaque: true }];
    } else if (custoInterno > 0) {
        const faixas = Calculators._calcularPrecoConsertoEscalonado(custoInterno, 50);
        valorPadraoInput = faixas.maximo;
        precos = [
            { label: '💎 PREÇO TABELA CHEIA (Teto Máximo — Cobrar Este!)', valor: faixas.maximo, cor: '#00FFA3', destaque: true },
            { label: '🟡 COM DESCONTO À VISTA / PIX (Negociação)', valor: faixas.medio, cor: '#FFD700', destaque: false },
            { label: '🔒 LIMITE MÍNIMO (Apenas com Autorização)', valor: faixas.minimo, cor: '#f87171', destaque: false }
        ];
    }
    document.getElementById('main-content').innerHTML = _vndWrap('conserto', `
        <div class="vendedor-step-header"><span class="vendedor-step-badge" style="background:${VENDEDOR_CORES.conserto.accent}">PASSO 4 DE 5</span><h2 style="font-size:28px">🔧 QUANTO COBRAR DO CLIENTE?</h2></div>
        <div class="vendedor-card-destaque" style="text-align:center;padding:16px">
            <p style="font-size:18px">Cliente: <strong>${UI._consertoData.cliente}</strong></p>
            <p style="font-size:18px">Aparelho: <strong>${UI._consertoData.modelo}</strong></p>
            <p style="font-size:18px">Serviço: <strong>${nomeServico || tipo}</strong></p>
        </div>
        ${precos.length ? '<div class="vendedor-section"><h3 style="font-size:22px">💰 ESCOLHA O VALOR (SEMPRE PRIORIZE A TABELA CHEIA):</h3>' +
            precos.map(pr => `<div class="vendedor-produto-item" style="padding:${pr.destaque ? '18px' : '14px'};border:2px solid ${pr.cor};background:${pr.destaque ? 'rgba(0,255,163,0.14)' : 'rgba(255,255,255,0.04)'};margin-bottom:10px;" onclick="UI._consertoSetPreco(${pr.valor})"><div class="vendedor-produto-info"><div class="vendedor-produto-nome" style="font-size:${pr.destaque ? '20px' : '17px'};font-weight:800;color:${pr.cor};">${pr.label}</div><div class="vendedor-produto-detalhe" style="font-size:${pr.destaque ? '24px' : '19px'};font-weight:900;color:#fff;margin-top:4px;">Cobrar do cliente: <span style="color:${pr.cor}">${UI.R(pr.valor)}</span></div></div><div class="vendedor-produto-acoes"><span class="vendedor-produto-btn" style="color:${pr.cor};font-size:18px;font-weight:900;">ESCOLHER →</span></div></div>`).join('') +
            '</div>' : ''}
        <div style="margin-top:12px"><label class="form-label" style="font-size:18px">Valor a cobrar (R$):</label><input class="form-input" id="cons-preco-custom" type="number" style="font-size:24px;text-align:center;font-weight:800;padding:14px;color:#00FFA3;" placeholder="R$" value="${valorPadraoInput}"></div>
        <div class="vendedor-nav">
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI._consertoPasso3()">← Voltar</button>
            <button class="btn btn-lg" style="background:${VENDEDOR_CORES.conserto.accent};color:#fff;font-size:20px" onclick="UI._consertoSetPreco(parseFloat(document.getElementById('cons-preco-custom').value))">Próximo →</button>
        </div>`);
};

UI._consertoSetPreco = function (preco) {
    if (!preco || preco <= 0) return UI.toast('Digite um valor', 'error');
    UI._consertoData.preco = preco;
    UI._consertoPasso5();
};

UI._consertoPasso5 = function () {
    const d = UI._consertoData;
    const prazoData = new Date(Date.now() + d.prazo * 86400000);
    const e50 = Math.round(d.preco * 0.5), e30 = Math.round(d.preco * 0.3);
    
    // Iniciar array de fotos vazio ao abrir a tela
    window._osFotosTemp = window._osFotosTemp || [];

    document.getElementById('main-content').innerHTML = _vndWrap('conserto', `
        <div class="vendedor-step-header"><span class="vendedor-step-badge" style="background:${VENDEDOR_CORES.conserto.accent}">PASSO 5 DE 5</span><h2 style="font-size:28px">🔧 QUANTO DE ENTRADA? E FOTOS</h2><p style="font-size:20px">Total: ${UI.R(d.preco)} | Pronto em: ${d.prazo} dias (${prazoData.toLocaleDateString('pt-BR')})</p></div>
        <div class="vendedor-section">
            
            <div style="margin-bottom:24px;padding:16px;background:rgba(0,200,255,0.06);border-radius:12px;border:2px solid rgba(0,200,255,0.3);">
                <div style="font-weight:900;font-size:18px;color:#00c8ff;margin-bottom:8px;">📸 TIRAR FOTOS DO APARELHO</div>
                <div style="font-size:14px;color:var(--text-secondary);margin-bottom:14px;">Tire fotos de todos os ângulos do celular para segurança (máx. 5 fotos)</div>
                <input type="file" id="os-foto-input" accept="image/*" capture="environment" multiple style="display:none">
                <div style="display:flex;gap:12px;flex-wrap:wrap;">
                    <button type="button" onclick="UI.abrirWebcamDireto()" style="flex:1;min-width:140px;padding:14px;background:linear-gradient(135deg,#00c8ff,#0060ff);color:#fff;border:none;border-radius:10px;font-weight:900;font-size:16px;cursor:pointer;box-shadow:0 4px 10px rgba(0,200,255,0.3);">📷 Ligar Câmera do Notebook</button>
                    <button type="button" onclick="UI._vincularCelularOS()" style="flex:1;min-width:140px;padding:14px;background:linear-gradient(135deg,#00d97e,#00a86b);color:#fff;border:none;border-radius:10px;font-weight:900;font-size:16px;cursor:pointer;box-shadow:0 4px 10px rgba(0,217,126,0.3);">📱 Via Celular (QR Code)</button>
                </div>
                <div id="os-qrcode-area" style="display:none;margin-top:16px;text-align:center;padding:16px;background:rgba(0,0,0,0.4);border-radius:12px;border:2px dashed rgba(0,200,255,0.5);"></div>
                <div id="os-fotos-preview" style="display:flex;gap:12px;flex-wrap:wrap;margin-top:16px;"></div>
            </div>

            <div style="margin-bottom:24px;padding:16px;background:rgba(255,255,255,0.05);border-radius:12px;border:1px solid rgba(255,255,255,0.1);">
                <div style="font-weight:900;font-size:18px;color:#a855f7;margin-bottom:10px;">✅ TESTE RÁPIDO DE ENTRADA</div>
                <div style="font-size:14px;color:var(--text-muted);margin-bottom:12px;">Desmarque o que estiver com defeito para registrar no laudo:</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:16px;color:#FFF;font-weight:700;">
                    <label style="cursor:pointer;display:flex;align-items:center;gap:8px;"><input type="checkbox" id="chk-tela" checked style="width:20px;height:20px;"> 📱 Tela/Touch</label>
                    <label style="cursor:pointer;display:flex;align-items:center;gap:8px;"><input type="checkbox" id="chk-wifi" checked style="width:20px;height:20px;"> 📶 Wi-Fi</label>
                    <label style="cursor:pointer;display:flex;align-items:center;gap:8px;"><input type="checkbox" id="chk-cam" checked style="width:20px;height:20px;"> 📸 Câmeras</label>
                    <label style="cursor:pointer;display:flex;align-items:center;gap:8px;"><input type="checkbox" id="chk-audio" checked style="width:20px;height:20px;"> 🔊 Áudio/Mic</label>
                    <label style="cursor:pointer;display:flex;align-items:center;gap:8px;"><input type="checkbox" id="chk-chip" checked style="width:20px;height:20px;"> 📡 Sinal/Chip</label>
                    <label style="cursor:pointer;display:flex;align-items:center;gap:8px;"><input type="checkbox" id="chk-carga" checked style="width:20px;height:20px;"> ⚡ Carga</label>
                </div>
            </div>

            <h3 style="font-size:22px;margin-bottom:12px;color:#FFD700;">💳 OPÇÕES DE ENTRADA:</h3>
            <div class="vendedor-produto-item" style="padding:14px" onclick="UI._consertoFinalizarPasso5(${e50})"><div class="vendedor-produto-info"><div class="vendedor-produto-nome" style="font-size:18px">✅ RECOMENDADO: 50%</div><div class="vendedor-produto-detalhe" style="font-size:16px">Paga AGORA: ${UI.R(e50)} | Na RETIRADA: ${UI.R(d.preco - e50)}</div></div><div class="vendedor-produto-acoes"><span class="vendedor-produto-btn" style="color:${VENDEDOR_CORES.conserto.accent}">ESCOLHER</span></div></div>
            <div class="vendedor-produto-item" style="padding:14px" onclick="UI._consertoFinalizarPasso5(${e30})"><div class="vendedor-produto-info"><div class="vendedor-produto-nome" style="font-size:18px">⚠️ MÍNIMA: 30%</div><div class="vendedor-produto-detalhe" style="font-size:16px">Paga AGORA: ${UI.R(e30)} | Na RETIRADA: ${UI.R(d.preco - e30)}</div></div><div class="vendedor-produto-acoes"><span class="vendedor-produto-btn" style="color:${VENDEDOR_CORES.conserto.accent}">ESCOLHER</span></div></div>
            <div class="vendedor-produto-item" style="padding:14px" onclick="UI._consertoFinalizarPasso5(0)"><div class="vendedor-produto-info"><div class="vendedor-produto-nome" style="font-size:18px">❌ SEM ENTRADA</div><div class="vendedor-produto-detalhe" style="font-size:16px">Paga TUDO na retirada: ${UI.R(d.preco)}</div></div><div class="vendedor-produto-acoes"><span class="vendedor-produto-btn">ESCOLHER</span></div></div>
            <div style="margin-top:12px"><label class="form-label" style="font-size:18px">Valor personalizado:</label><input class="form-input" id="cons-entrada-custom" type="number" placeholder="R$" style="font-size:20px;padding:14px"></div>
        </div>
        <div class="vendedor-nav">
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI._consertoPasso4(UI._consertoData.servico, UI._consertoData._custoInterno, UI._consertoData.prazo, UI._consertoData.servico)">← Voltar</button>
            <button class="btn btn-lg" style="background:rgba(100,100,100,0.3);color:#FFD700;font-size:18px;padding:14px 24px;border:2px solid rgba(255,215,0,0.3)" onclick="UI._consertoSalvarOrcamento()">📋 SÓ ORÇAMENTO</button>
            <button class="btn btn-lg" style="background:${VENDEDOR_CORES.conserto.accent};color:#fff;font-size:20px" onclick="UI._consertoFinalizarPasso5(parseFloat(document.getElementById('cons-entrada-custom').value)||0)">✅ CONFIRMAR</button>
        </div>`);

    // Redirecionar render preview caso haja fotos no cache
    UI._renderPreviewFotosOS();

    // Event listener do input de fotos
    setTimeout(function() {
        var input = document.getElementById('os-foto-input');
        if (input) {
            input.addEventListener('change', async function(e) {
                var files = Array.from(e.target.files);
                for (var i = 0; i < files.length; i++) {
                    if (window._osFotosTemp.length >= 5) {
                        UI.toast('⚠️ Máximo de 5 fotos por OS!', 'warning');
                        break;
                    }
                    try {
                        var compressed = await UI._comprimirImagem(files[i], 800, 600, 0.6);
                        window._osFotosTemp.push({ id: Date.now() + i, base64: compressed, descricao: 'Foto ' + (window._osFotosTemp.length + 1) + ' - Entrada' });
                    } catch (err) {
                        console.error('Erro ao comprimir foto:', err);
                    }
                }
                UI._renderPreviewFotosOS();
                e.target.value = '';
            });
        }
    }, 100);
};

UI._consertoFinalizarPasso5 = function (entrada) {
    console.log('=== CONSERTO PASSO 5 FINALIZAR ===', entrada);
    if (entrada > 0) {
        UI._consertoEntrada = entrada;
        UI._consertoEscolherFormaPagamento();
    } else {
        UI._consertoFinalizar(0, 'sem_entrada');
    }
};

UI._consertoEscolherFormaPagamento = function () {
    const preco = UI._consertoEntrada;
    document.getElementById('main-content').innerHTML = _vndWrap('conserto', `
        <div class="vendedor-step-header"><span class="vendedor-step-badge" style="background:${VENDEDOR_CORES.conserto.accent}">PAGAMENTO</span><h2 style="font-size:28px">🔧 PAGAR ENTRADA</h2><p style="font-size:20px">Valor da entrada: ${UI.R(preco)}</p></div>
        <div class="vendedor-grid-pag">
            <button class="vendedor-btn-pag" style="padding:20px" onclick="UI._consertoFinalizarPag('dinheiro')"><span class="vendedor-btn-icon" style="font-size:36px">💵</span><span class="vendedor-btn-title" style="font-size:22px">DINHEIRO</span><span class="vendedor-btn-valor" style="font-size:20px">${UI.R(preco)}</span></button>
            <button class="vendedor-btn-pag" style="padding:20px" onclick="UI._consertoFinalizarPag('pix')"><span class="vendedor-btn-icon" style="font-size:36px">📱</span><span class="vendedor-btn-title" style="font-size:22px">PIX</span><span class="vendedor-btn-valor" style="font-size:20px">${UI.R(preco)}</span></button>
            <button class="vendedor-btn-pag" style="padding:20px" onclick="UI._consertoFinalizarPag('debito')"><span class="vendedor-btn-icon" style="font-size:36px">💳</span><span class="vendedor-btn-title" style="font-size:22px">DÉBITO</span><span class="vendedor-btn-valor" style="font-size:20px">${UI.R(preco)}</span></button>
            <button class="vendedor-btn-pag" style="padding:20px" onclick="UI._consertoFinalizarPag('credito')"><span class="vendedor-btn-icon" style="font-size:36px">💳</span><span class="vendedor-btn-title" style="font-size:22px">CRÉDITO</span><span class="vendedor-btn-valor" style="font-size:20px">${UI.R(preco)}</span></button>
        </div>
        <div class="vendedor-nav"><button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI._consertoPasso5()">← Voltar</button></div>`);
};

UI._consertoFinalizarPag = function (forma) {
    console.log('=== CONSERTO FINALIZAR PAG ===', forma);
    UI._consertoFinalizar(UI._consertoEntrada, forma);
};

UI._consertoFinalizar = function (entrada, forma = 'dinheiro') {
    console.log('=== CONSERTO FINALIZAR ===', { entrada, forma, dados: UI._consertoData });
    const d = UI._consertoData;
    const prazoData = new Date(Date.now() + d.prazo * 86400000);
    const custoPeca = d._custoInterno || 0;
    
    // Parar polling do QR code se estiver ativo
    if (UI._pararPollingFotos) UI._pararPollingFotos();

    // Tratar array de fotos do novo checklist
    const fotosFinais = window._osFotosTempObj ? Object.values(window._osFotosTempObj) : [];

    // Processar checklist de testes básicos
    const chks = [
        {id: 'chk-tela', label: 'Tela/Touch'}, {id: 'chk-wifi', label: 'Wi-Fi'},
        {id: 'chk-cam', label: 'Câmeras'}, {id: 'chk-audio', label: 'Áudio/Mic'},
        {id: 'chk-chip', label: 'Sinal/Chip'}, {id: 'chk-carga', label: 'Carregamento'}
    ];
    let falhas = [];
    chks.forEach(c => {
        const el = document.getElementById(c.id);
        if (el && !el.checked) falhas.push(c.label);
    });
    
    let servicoFinal = d.servico;
    if (falhas.length > 0) {
        servicoFinal += `\n\n[⚠️ TESTES COM FALHA: ${falhas.join(', ')}]`;
    } else {
        servicoFinal += `\n\n[✅ TESTES OK]`;
    }

    let numOS = 1;
    if (!dataManager.isModoTreino()) {
        const resOS = dataManager.criarOrdemServico({
            cliente: d.cliente || 'Consumidor Geral',
            telefone: d.telefone || '',
            modelo: d.modelo,
            servico: servicoFinal,
            custoPeca: custoPeca,
            custoTotal: custoPeca,
            valorFinal: d.preco,
            preco: d.preco,
            entrada: entrada,
            prazoEntrega: prazoData.toISOString().split('T')[0],
            formaPagamentoEntrada: forma,
            fotos: fotosFinais
        });
        numOS = resOS.numero || (dataManager.data.assistencia.proximoNumero - 1);
        
        // Salvar no historico do cliente
        const clienteRef = UI._consertoClienteRef || dataManager.buscarCliente(d.cliente);
        if (clienteRef) {
            if (!clienteRef.historico) clienteRef.historico = [];
            const pontos = Math.floor(d.preco / 20);
            clienteRef.score = (clienteRef.score || 0) + pontos;
            clienteRef.historico.push({
                tipo: 'conserto', data: new Date().toISOString().split('T')[0],
                servico: d.servico, modelo: d.modelo, valor: d.preco,
                custoPeca: custoPeca, entrada: entrada, restante: d.preco - entrada,
                os: numOS, status: 'em_andamento', pontos: pontos,
                formaPagamentoEntrada: forma
            });
        }
        dataManager.saveData();
    }
    UI._tocarSomCaixa();
    const telCliente = d.telefone || (UI._consertoData?.telefone || '');
    const numOSFormatado = String(numOS).padStart(3, '0');

    document.getElementById('main-content').innerHTML = _vndWrap('conserto', `
        <div style="text-align:center;padding:30px 0">
            <div style="font-size:56px">✅</div>
            <h2 style="color:${VENDEDOR_CORES.conserto.accent};font-size:28px">CONSERTO REGISTRADO!</h2>
            <div class="vendedor-card-destaque" style="text-align:left;margin-top:16px;padding:16px">
                <p style="font-size:18px"><strong>OS #${numOSFormatado}</strong></p>
                <p style="font-size:18px">Cliente: ${d.cliente} — ${telCliente || 'sem tel'}</p>
                <p style="font-size:18px">Aparelho: ${d.modelo}</p>
                <p style="font-size:18px">Serviço: ${d.servico}</p>
                <p style="font-size:18px">Valor total: ${UI.R(d.preco)}</p>
                ${entrada > 0 ? `<p style="font-size:18px">Entrada paga: ${UI.R(entrada)} (${forma.toUpperCase()})</p><p style="font-size:18px">Falta: ${UI.R(d.preco - entrada)} (pagar na retirada)</p>` : `<p style="font-size:18px">Pagar tudo na retirada: ${UI.R(d.preco)}</p>`}
                <p style="font-size:18px">Prazo: ${d.prazo} dias (${prazoData.toLocaleDateString('pt-BR')})</p>
                <p style="font-size:16px;color:var(--accent-yellow);margin-top:8px">🎁 +${Math.floor(d.preco / 20)} pontos de fidelidade</p>
            </div>

            <div style="margin-top:24px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
                <button class="btn btn-lg" style="background:#25D366;color:#FFF;font-weight:800;font-size:16px;padding:14px 22px;border-radius:12px;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 15px rgba(37,211,102,0.3);" onclick="UI._enviarGarantiaOSWhatsApp({os:'${numOSFormatado}', cliente:'${(d.cliente || 'Cliente').replace(/'/g, "\\'")}', telefone:'${telCliente}', modelo:'${(d.modelo || '').replace(/'/g, "\\'")}', servico:'${(d.servico || '').replace(/'/g, "\\'")}', preco:${d.preco}, entrada:${entrada}, restante:${d.preco - entrada}, prazo:${d.prazo}})">
                    📲 Enviar Comprovante de OS no WhatsApp
                </button>
                <button class="btn btn-lg btn-ghost" style="font-size:15px;padding:14px 18px;border-radius:12px;" onclick="UI._copiarGarantiaOS({os:'${numOSFormatado}', cliente:'${(d.cliente || 'Cliente').replace(/'/g, "\\'")}', telefone:'${telCliente}', modelo:'${(d.modelo || '').replace(/'/g, "\\'")}', servico:'${(d.servico || '').replace(/'/g, "\\'")}', preco:${d.preco}, entrada:${entrada}, restante:${d.preco - entrada}, prazo:${d.prazo}})">
                    📋 Copiar OS
                </button>
            </div>
        </div>
        <div class="vendedor-nav">
            <button class="btn btn-lg" style="background:${VENDEDOR_CORES.conserto.accent};color:#fff;font-size:20px" onclick="UI._vendedorConserto()">Novo Conserto</button>
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI.renderVendedor()">Voltar ao Menu</button>
        </div>`);
};

// Bug 4: Só Orçamento para conserto
UI._consertoSalvarOrcamento = function () {
    console.log('=== CONSERTO ORÇAMENTO ===', UI._consertoData);
    const d = UI._consertoData;
    const nomeCliente = d.cliente || 'Cliente';
    if (!dataManager.isModoTreino()) {
        const clienteRef = UI._consertoClienteRef || dataManager.buscarCliente(d.cliente);
        if (clienteRef) {
            if (!clienteRef.historico) clienteRef.historico = [];
            clienteRef.score = (clienteRef.score || 0) + 10;
            clienteRef.historico.push({
                tipo: 'orcamento_conserto', data: new Date().toISOString().split('T')[0],
                servico: d.servico, modelo: d.modelo, valor: d.preco,
                prazo: d.prazo, status: 'nao_finalizado'
            });
        } else {
            // Cliente novo — cadastrar
            dataManager.cadastrarCliente({
                nome: d.cliente, telefone: d.telefone || '',
                observacoes: 'Veio fazer orçamento de conserto - não finalizou',
                score: 10,
                historico: [{
                    tipo: 'orcamento_conserto', data: new Date().toISOString().split('T')[0],
                    servico: d.servico, modelo: d.modelo, valor: d.preco,
                    prazo: d.prazo, status: 'nao_finalizado'
                }]
            });
        }
        dataManager.saveData();
    }
    document.getElementById('main-content').innerHTML = _vndWrap('conserto', `
        <div style="text-align:center;padding:40px 0">
            <div style="font-size:56px">📋</div>
            <h2 style="color:${VENDEDOR_CORES.conserto.accent};font-size:28px">ORÇAMENTO SALVO!</h2>
            <p style="font-size:20px;margin:8px 0">Cliente: <strong>${nomeCliente}</strong></p>
            <p style="font-size:18px">${d.modelo} — ${d.servico}</p>
            <p style="font-size:28px;font-weight:900;color:var(--accent-green);margin:12px 0">${UI.R(d.preco)}</p>
            <div style="margin-top:16px;padding:12px 20px;background:rgba(245,158,11,0.1);border-radius:12px;display:inline-block">
                <p style="font-size:16px;color:var(--accent-yellow)">🎁 <strong>${nomeCliente}</strong> ganhou 10 pontos por interesse!</p>
            </div>
        </div>
        <div class="vendedor-nav">
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI.renderVendedor()">Voltar ao Menu</button>
        </div>`);
};



// === FLUXO PELÍCULA (4 passos) — COM IDENTIFICAÇÃO DE CLIENTE ===
UI._vendedorPelicula = function () {
    UI._identificarCliente('pelicula', function (cliente) { UI._peliculaEscolherModelo(cliente); });
};

UI._peliculaEscolherModelo = function (cliente) {
    document.getElementById('main-content').innerHTML = _vndWrap('pelicula', `
        <div class="vendedor-step-header"><span class="vendedor-step-badge" style="background:${VENDEDOR_CORES.pelicula.accent}">PASSO 2 DE 4</span><h2 style="font-size:28px">📱 COLOCAR PELÍCULA</h2><p style="font-size:20px">Cliente: <strong>${cliente.nome}</strong> — Qual o aparelho?</p></div>
        <div class="vendedor-section">
            <label class="form-label" style="font-size:18px">Modelo do celular:</label>
            <input class="form-input" id="pel-modelo" placeholder="Ex: iPhone 12, Samsung A54" style="font-size:20px;padding:14px">
        </div>
        <div class="vendedor-nav">
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI.renderVendedor()">Cancelar</button>
            <button class="btn btn-lg" style="background:${VENDEDOR_CORES.pelicula.accent};color:#fff;font-size:20px" onclick="UI._peliculaPasso2()">Próximo →</button>
        </div>`);
};

UI._peliculaPasso2 = function () {
    const modelo = document.getElementById('pel-modelo')?.value;
    if (!modelo) return UI.toast('Digite o modelo', 'error');
    const cat = dataManager.buscarCategoriaPelicula(modelo);
    const precos = dataManager.data.precoPelicula[cat];
    const custo = dataManager.data.precoPelicula.custosReais;
    UI._peliculaData = { modelo, cat, custos: custo };
    const tipos = [
        { key: 'frontalHD', nome: '📱 FRONTAL HD (brilho)', custoInt: custo.hd_hidrogel, preco: precos.frontalHD },
        { key: 'frontalFosca', nome: '📱 FRONTAL FOSCA (anti-reflexo)', custoInt: custo.fosca, preco: precos.frontalFosca },
        { key: 'traseira', nome: '📱 TRASEIRA', custoInt: custo.hd_hidrogel, preco: precos.traseira },
        { key: 'completa', nome: '📱 COMPLETA (frente + verso)', custoInt: custo.hd_hidrogel * 2, preco: precos.completa }
    ];
    UI._peliculaTipos = tipos;
    
    let html = `<div class="vendedor-step-header"><span class="vendedor-step-badge" style="background:${VENDEDOR_CORES.pelicula.accent}">PASSO 2 DE 3</span><h2 style="font-size:28px">📱 QUAL PELÍCULA?</h2><p style="font-size:20px">${modelo}</p></div><div class="vendedor-section"><h3 style="font-size:22px">ESCOLHA O TIPO:</h3>`;
    tipos.forEach(t => {
        html += `<div class="vendedor-produto-item" style="padding:14px" onclick="UI._peliculaPasso3('${t.key}')">
            <div class="vendedor-produto-info"><div class="vendedor-produto-nome" style="font-size:18px">${t.nome}</div></div>
            <div class="vendedor-produto-acoes"><span class="vendedor-produto-preco" style="font-size:20px;font-weight:800">${UI.R(t.preco)}</span><span class="vendedor-produto-btn" style="color:${VENDEDOR_CORES.pelicula.accent};font-size:16px">ESCOLHER</span></div></div>`;
    });
    html += `</div><div class="vendedor-nav"><button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI._vendedorPelicula()">← Voltar</button></div>`;
    document.getElementById('main-content').innerHTML = _vndWrap('pelicula', html);
};

UI._peliculaPasso3 = function (key) {
    const t = UI._peliculaTipos.find(item => item.key === key);
    if (!t) {
        console.error('Tipo de película não encontrado:', key);
        return;
    }
    const { nome, custoInt, preco } = t;
    UI._peliculaPagData = { key, nome, custoInt, preco };
    console.log('=== PELÍCULA PASSO 3 ===', { key, nome, custoInt, preco });
    document.getElementById('main-content').innerHTML = _vndWrap('pelicula', `
        <div class="vendedor-step-header"><span class="vendedor-step-badge" style="background:${VENDEDOR_CORES.pelicula.accent}">PASSO 3 DE 3</span><h2 style="font-size:28px">📱 COMO VAI PAGAR?</h2><p style="font-size:20px">${UI._peliculaData.modelo} — ${nome} — ${UI.R(preco)}</p></div>
        <div class="vendedor-grid-pag">
            <button class="vendedor-btn-pag" style="padding:20px" onclick="UI._peliculaFinalizarPag('dinheiro')"><span class="vendedor-btn-icon" style="font-size:36px">💵</span><span class="vendedor-btn-title" style="font-size:22px">DINHEIRO</span><span class="vendedor-btn-valor" style="font-size:20px">${UI.R(preco)}</span></button>
            <button class="vendedor-btn-pag" style="padding:20px" onclick="UI._peliculaFinalizarPag('pix')"><span class="vendedor-btn-icon" style="font-size:36px">📱</span><span class="vendedor-btn-title" style="font-size:22px">PIX</span><span class="vendedor-btn-valor" style="font-size:20px">${UI.R(preco)}</span></button>
            <button class="vendedor-btn-pag" style="padding:20px" onclick="UI._peliculaFinalizarPag('debito')"><span class="vendedor-btn-icon" style="font-size:36px">💳</span><span class="vendedor-btn-title" style="font-size:22px">DÉBITO</span><span class="vendedor-btn-valor" style="font-size:20px">${UI.R(preco)}</span></button>
            <button class="vendedor-btn-pag" style="padding:20px" onclick="UI._peliculaFinalizarPag('credito')"><span class="vendedor-btn-icon" style="font-size:36px">💳</span><span class="vendedor-btn-title" style="font-size:22px">CRÉDITO</span><span class="vendedor-btn-valor" style="font-size:20px">${UI.R(preco)}</span></button>
        </div>
        <div style="text-align:center;margin-top:16px;border-top:1px solid var(--border-color);padding-top:16px">
            <button class="btn btn-lg" style="background:rgba(100,100,100,0.3);color:#FFD700;font-size:18px;padding:14px 28px;border:2px solid rgba(255,215,0,0.3)" onclick="UI._peliculaFinalizarPag('orcamento')">📋 SÓ ORÇAMENTO — Cliente quer pensar</button>
        </div>
        <div class="vendedor-nav"><button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI._peliculaPasso2()">← Voltar</button></div>`);
};

// Bug 1: Wrapper que pega dados salvos e encaminha
UI._peliculaFinalizarPag = function (forma) {
    console.log('=== PELÍCULA PAGAMENTO ===', forma);
    const d = UI._peliculaPagData;
    if (!d) { console.error('Dados da película perdidos!'); UI.toast('Erro: dados perdidos', 'error'); return; }
    if (forma === 'orcamento') {
        UI._salvarOrcamentoPelicula(d.nome, d.preco);
    } else {
        UI._peliculaFinalizar(forma, d.nome, d.custoInt, d.preco);
    }
};

UI._peliculaFinalizar = function (forma, nome, custoInt, preco) {
    console.log('=== PELÍCULA FINALIZAR ===', { forma, nome, custoInt, preco });
    const caixaDest = forma === 'dinheiro' ? 'caixaSecundario' : 'caixaPrincipal';
    if (!dataManager.isModoTreino()) { dataManager.venderPelicula(UI._peliculaData.modelo, nome, preco, 'hd_hidrogel', UI._clienteAtual ? UI._clienteAtual.nome : '', caixaDest); }
    UI._tocarSomCaixa();
    const nomeCliente = UI._clienteAtual ? UI._clienteAtual.nome : 'Cliente';
    if (UI._clienteAtual && !dataManager.isModoTreino()) {
        const pts = Math.floor(preco / 10);
        UI._clienteAtual.score = (UI._clienteAtual.score || 0) + pts;
        if (!UI._clienteAtual.historico) UI._clienteAtual.historico = [];
        UI._clienteAtual.historico.push({ tipo: 'pelicula', data: new Date().toISOString().split('T')[0], servico: nome, modelo: UI._peliculaData.modelo, valor: preco, pontos: pts });
        dataManager.saveData();
    }
    const telCliente = UI._clienteAtual ? (UI._clienteAtual.telefone || '') : '';
    const descPelicula = `Película ${nome} (${UI._peliculaData.modelo})`;

    document.getElementById('main-content').innerHTML = _vndWrap('pelicula', `
        <div style="text-align:center;padding:40px 0">
            <div style="font-size:56px">✅</div>
            <h2 style="color:${VENDEDOR_CORES.pelicula.accent};font-size:28px">PELÍCULA APLICADA!</h2>
            <p style="font-size:22px;margin:8px 0">${UI._peliculaData.modelo} — ${nome}</p>
            <p style="font-size:32px;font-weight:900;color:var(--accent-green)">${UI.R(preco)}</p>
            <p style="color:var(--text-muted);font-size:18px">${forma.toUpperCase()}</p>
            <div style="margin-top:16px;padding:12px 20px;background:rgba(245,158,11,0.1);border-radius:12px;display:inline-block">
                <p style="font-size:18px;color:var(--accent-yellow)">🎁 <strong>${nomeCliente}</strong> ganhou pontos de fidelidade!</p>
            </div>

            <div style="margin-top:24px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
                <button class="btn btn-lg" style="background:#25D366;color:#FFF;font-weight:800;font-size:16px;padding:14px 22px;border-radius:12px;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 15px rgba(37,211,102,0.3);" onclick="UI._enviarGarantiaVendaWhatsApp({cliente:'${nomeCliente.replace(/'/g, "\\'")}', telefone:'${telCliente}', produto:'${descPelicula.replace(/'/g, "\\'")}', valor:${preco}, forma:'${forma}'})">
                    📲 Enviar Nota de Garantia no WhatsApp
                </button>
                <button class="btn btn-lg btn-ghost" style="font-size:15px;padding:14px 18px;border-radius:12px;" onclick="UI._copiarGarantiaVenda({cliente:'${nomeCliente.replace(/'/g, "\\'")}', telefone:'${telCliente}', produto:'${descPelicula.replace(/'/g, "\\'")}', valor:${preco}, forma:'${forma}'})">
                    📋 Copiar Nota
                </button>
            </div>
        </div>
        <div class="vendedor-nav">
            <button class="btn btn-lg" style="background:${VENDEDOR_CORES.pelicula.accent};color:#fff;font-size:20px" onclick="UI._vendedorPelicula()">Nova Película</button>
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI.renderVendedor()">Voltar ao Menu</button>
        </div>`);
};

// === FLUXO TROCA COMPLETA — COM IDENTIFICAÇÃO DE CLIENTE (Correções 2,7) ===
UI._vendedorTroca = function () {
    UI._identificarCliente('trocar', function (cliente) { UI._trocaEscolherProduto(cliente); });
};

UI._trocaEscolherProduto = function (cliente) {
    const estoque = dataManager.getEstoqueCelulares();
    const renderLista = (f) => {
        const lista = f ? estoque.filter(p => p.nome.toLowerCase().includes(f.toLowerCase())) : estoque;
        return lista.map(p => `<div class="vendedor-produto-item" style="padding:16px" onclick="UI._trocaPasso2('${p.id}')"><div class="vendedor-produto-info"><div class="vendedor-produto-nome" style="font-size:20px">📱 ${p.nome}</div><div class="vendedor-produto-detalhe" style="font-size:16px">${p.condicao} | ${UI.R(p.precoVenda)}</div></div><div class="vendedor-produto-acoes"><span class="vendedor-produto-btn" style="color:${VENDEDOR_CORES.trocar.accent};font-size:18px;font-weight:700">ESCOLHER →</span></div></div>`).join('') || '<p style="text-align:center;padding:20px;color:var(--text-muted);font-size:18px">Nenhum produto</p>';
    };
    document.getElementById('main-content').innerHTML = _vndWrap('trocar', `
        <div class="vendedor-step-header"><span class="vendedor-step-badge" style="background:${VENDEDOR_CORES.trocar.accent}">PASSO 2 DE 4</span><h2 style="font-size:28px">🔄 TROCA DE CELULAR</h2><p style="font-size:22px">Cliente: <strong>${cliente.nome}</strong> — Qual celular QUER comprar?</p></div>
        <div class="vendedor-busca"><input class="form-input vendedor-input-busca" id="troca-busca" placeholder="🔍 Buscar..." style="font-size:18px;padding:14px" oninput="UI._trocaFiltrar()"></div>
        <div id="troca-lista">${renderLista('')}</div>
        <div class="vendedor-footer"><button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI.renderVendedor()">← Voltar</button></div>`);
    UI._trocaFiltrar = () => { document.getElementById('troca-lista').innerHTML = renderLista(document.getElementById('troca-busca')?.value || ''); };
};

// Buscar preço de referência com fuzzy matching
UI._buscarPrecoReferencia = function (modelo) {
    const tabela = dataManager.data.precosReferenciaUsados;
    if (!tabela) return null;
    const key = modelo.toLowerCase().trim();
    // Match exato
    if (tabela[key]) return { key, valor: tabela[key] };
    // Match parcial
    for (const [k, v] of Object.entries(tabela)) {
        if (key.includes(k) || k.includes(key)) return { key: k, valor: v };
    }
    // Match sem espaço (ex: "iphone11" -> "iphone 11")
    const keyNoSpace = key.replace(/\s+/g, '');
    for (const [k, v] of Object.entries(tabela)) {
        if (keyNoSpace.includes(k.replace(/\s+/g, '')) || k.replace(/\s+/g, '').includes(keyNoSpace)) return { key: k, valor: v };
    }
    return null;
};

UI._trocaPasso2 = function (prodId) {
    const prod = dataManager.data.estoqueCelulares.find(p => String(p.id) === String(prodId));
    if (!prod) return;
    UI._trocaDados = { prod };

    document.getElementById('main-content').innerHTML = _vndWrap('trocar', `
        <div class="vendedor-step-header"><span class="vendedor-step-badge" style="background:${VENDEDOR_CORES.trocar.accent}">PASSO 2 DE 3</span><h2 style="font-size:28px">🔄 CELULAR DO CLIENTE</h2><p style="font-size:20px">Quer comprar: <strong>${prod.nome}</strong> (${UI.R(prod.precoVenda)})</p></div>
        <div class="vendedor-section">
            <label class="form-label" style="font-size:20px">📱 Qual celular o cliente tem?</label>
            <input class="form-input" id="troca-modelo" style="font-size:20px;padding:14px" placeholder="Ex: iPhone 11, Moto G22, Samsung A54" oninput="UI._trocaCheckModelo()">
            <div id="troca-ref-status" style="margin-top:8px;font-size:16px;color:var(--text-muted)">Digite o modelo acima...</div>

            <div style="margin-top:20px;border:2px solid var(--border-color);border-radius:16px;padding:20px">
                <h3 style="font-size:22px;margin-bottom:14px;color:${VENDEDOR_CORES.trocar.accent}">1️⃣ BATERIA ESTÁ BOA?</h3>
                <label style="display:block;font-size:18px;padding:10px 0;cursor:pointer"><input type="radio" name="troca-bat" value="100" checked> ✅ Sim, boa (dura o dia todo)</label>
                <label style="display:block;font-size:18px;padding:10px 0;cursor:pointer"><input type="radio" name="troca-bat" value="90"> ⚠️ Mais ou menos (dura meio dia)</label>
                <label style="display:block;font-size:18px;padding:10px 0;cursor:pointer"><input type="radio" name="troca-bat" value="80"> ❌ Ruim (desliga rápido)</label>
            </div>

            <div style="margin-top:14px;border:2px solid var(--border-color);border-radius:16px;padding:20px">
                <h3 style="font-size:22px;margin-bottom:14px;color:${VENDEDOR_CORES.trocar.accent}">2️⃣ TEM ARRANHÃO?</h3>
                <label style="display:block;font-size:18px;padding:10px 0;cursor:pointer"><input type="radio" name="troca-arr" value="100" checked> ✅ Não, está perfeito</label>
                <label style="display:block;font-size:18px;padding:10px 0;cursor:pointer"><input type="radio" name="troca-arr" value="95"> ⚠️ Poucos arranhões</label>
                <label style="display:block;font-size:18px;padding:10px 0;cursor:pointer"><input type="radio" name="troca-arr" value="85"> ❌ Muito arranhado</label>
            </div>

            <div style="margin-top:14px;border:2px solid var(--border-color);border-radius:16px;padding:20px">
                <h3 style="font-size:22px;margin-bottom:14px;color:${VENDEDOR_CORES.trocar.accent}">3️⃣ TEM ALGUM DEFEITO? (pode marcar vários)</h3>
                <label style="display:block;font-size:18px;padding:8px 0;cursor:pointer;color:var(--accent-green)"><input type="checkbox" id="troca-def-nenhum" checked onchange="UI._trocaToggleNenhum()"> ✅ Não tem defeito</label>
                <div id="troca-defeitos-lista">
                    <p style="font-size:16px;font-weight:700;color:var(--text-muted);margin:12px 0 6px">📱 TELA:</p>
                    <label style="display:block;font-size:17px;padding:6px 0 6px 20px;cursor:pointer"><input type="checkbox" class="troca-def" data-pct="15" disabled> Tela trincada leve (-15%)</label>
                    <label style="display:block;font-size:17px;padding:6px 0 6px 20px;cursor:pointer"><input type="checkbox" class="troca-def" data-pct="25" disabled> Tela trincada grave (-25%)</label>
                    <label style="display:block;font-size:17px;padding:6px 0 6px 20px;cursor:pointer"><input type="checkbox" class="troca-def" data-pct="30" disabled> Tela queimada (-30%)</label>
                    <label style="display:block;font-size:17px;padding:6px 0 6px 20px;cursor:pointer"><input type="checkbox" class="troca-def" data-pct="20" disabled> Touch não funciona direito (-20%)</label>

                    <p style="font-size:16px;font-weight:700;color:var(--text-muted);margin:12px 0 6px">📷 CÂMERAS:</p>
                    <label style="display:block;font-size:17px;padding:6px 0 6px 20px;cursor:pointer"><input type="checkbox" class="troca-def" data-pct="10" disabled> Câmera embaçada (-10%)</label>
                    <label style="display:block;font-size:17px;padding:6px 0 6px 20px;cursor:pointer"><input type="checkbox" class="troca-def" data-pct="20" disabled> Câmera quebrada (-20%)</label>
                    <label style="display:block;font-size:17px;padding:6px 0 6px 20px;cursor:pointer"><input type="checkbox" class="troca-def" data-pct="5" disabled> Flash não funciona (-5%)</label>

                    <p style="font-size:16px;font-weight:700;color:var(--text-muted);margin:12px 0 6px">🔊 SOM:</p>
                    <label style="display:block;font-size:17px;padding:6px 0 6px 20px;cursor:pointer"><input type="checkbox" class="troca-def" data-pct="8" disabled> Alto-falante ruim (-8%)</label>
                    <label style="display:block;font-size:17px;padding:6px 0 6px 20px;cursor:pointer"><input type="checkbox" class="troca-def" data-pct="8" disabled> Microfone ruim (-8%)</label>
                    <label style="display:block;font-size:17px;padding:6px 0 6px 20px;cursor:pointer"><input type="checkbox" class="troca-def" data-pct="5" disabled> Entrada de fone com defeito (-5%)</label>

                    <p style="font-size:16px;font-weight:700;color:var(--text-muted);margin:12px 0 6px">🔌 CONECTIVIDADE:</p>
                    <label style="display:block;font-size:17px;padding:6px 0 6px 20px;cursor:pointer"><input type="checkbox" class="troca-def" data-pct="8" disabled> Conector de carga ruim (-8%)</label>
                    <label style="display:block;font-size:17px;padding:6px 0 6px 20px;cursor:pointer"><input type="checkbox" class="troca-def" data-pct="15" disabled> Conector de carga quebrado (-15%)</label>
                    <label style="display:block;font-size:17px;padding:6px 0 6px 20px;cursor:pointer"><input type="checkbox" class="troca-def" data-pct="15" disabled> Wi-Fi não pega (-15%)</label>
                    <label style="display:block;font-size:17px;padding:6px 0 6px 20px;cursor:pointer"><input type="checkbox" class="troca-def" data-pct="8" disabled> Bluetooth não funciona (-8%)</label>
                    <label style="display:block;font-size:17px;padding:6px 0 6px 20px;cursor:pointer"><input type="checkbox" class="troca-def" data-pct="30" disabled> Não pega sinal/operadora (-30%)</label>

                    <p style="font-size:16px;font-weight:700;color:var(--text-muted);margin:12px 0 6px">🔘 BOTÕES:</p>
                    <label style="display:block;font-size:17px;padding:6px 0 6px 20px;cursor:pointer"><input type="checkbox" class="troca-def" data-pct="5" disabled> Botão de volume travado (-5%)</label>
                    <label style="display:block;font-size:17px;padding:6px 0 6px 20px;cursor:pointer"><input type="checkbox" class="troca-def" data-pct="8" disabled> Botão liga/desliga ruim (-8%)</label>
                    <label style="display:block;font-size:17px;padding:6px 0 6px 20px;cursor:pointer"><input type="checkbox" class="troca-def" data-pct="10" disabled> Botão home não funciona (-10%)</label>

                    <p style="font-size:16px;font-weight:700;color:var(--text-muted);margin:12px 0 6px">🔐 BIOMETRIA:</p>
                    <label style="display:block;font-size:17px;padding:6px 0 6px 20px;cursor:pointer"><input type="checkbox" class="troca-def" data-pct="15" disabled> Face ID não funciona (-15%)</label>
                    <label style="display:block;font-size:17px;padding:6px 0 6px 20px;cursor:pointer"><input type="checkbox" class="troca-def" data-pct="10" disabled> Touch ID não funciona (-10%)</label>

                    <p style="font-size:16px;font-weight:700;color:var(--text-muted);margin:12px 0 6px">🔋 BATERIA:</p>
                    <label style="display:block;font-size:17px;padding:6px 0 6px 20px;cursor:pointer"><input type="checkbox" class="troca-def" data-pct="15" disabled> Bateria vicia (desliga rápido) (-15%)</label>
                    <label style="display:block;font-size:17px;padding:6px 0 6px 20px;cursor:pointer"><input type="checkbox" class="troca-def" data-pct="25" disabled> Não carrega (-25%)</label>

                    <p style="font-size:16px;font-weight:700;color:var(--accent-red);margin:12px 0 6px">🚨 CRÍTICO:</p>
                    <label style="display:block;font-size:17px;padding:6px 0 6px 20px;cursor:pointer;color:var(--accent-red)"><input type="checkbox" class="troca-def" data-pct="40" disabled> ❌ Não liga (-40%)</label>
                    <label style="display:block;font-size:17px;padding:6px 0 6px 20px;cursor:pointer;color:var(--accent-red)"><input type="checkbox" class="troca-def" data-pct="20" disabled> ❌ Travando muito (-20%)</label>
                    <label style="display:block;font-size:17px;padding:6px 0 6px 20px;cursor:pointer;color:var(--accent-red)"><input type="checkbox" class="troca-def" data-pct="35" disabled> ❌ Molhou / oxidado (-35%)</label>
                </div>
            </div>

            <div style="margin-top:14px;border:2px solid var(--border-color);border-radius:16px;padding:20px">
                <h3 style="font-size:22px;margin-bottom:14px;color:${VENDEDOR_CORES.trocar.accent}">4️⃣ TEM CAIXA E CARREGADOR?</h3>
                <label style="display:block;font-size:18px;padding:10px 0;cursor:pointer"><input type="radio" name="troca-cx" value="100" checked> ✅ Sim, tem tudo (caixa + carregador)</label>
                <label style="display:block;font-size:18px;padding:10px 0;cursor:pointer"><input type="radio" name="troca-cx" value="97"> 🔌 Só o carregador</label>
                <label style="display:block;font-size:18px;padding:10px 0;cursor:pointer"><input type="radio" name="troca-cx" value="96"> 📦 Só a caixa</label>
                <label style="display:block;font-size:18px;padding:10px 0;cursor:pointer"><input type="radio" name="troca-cx" value="92"> ❌ Não tem nada</label>
            </div>

            <div style="margin-top:14px;border:1px dashed var(--border-color);border-radius:12px;padding:16px;opacity:0.7">
                <label style="font-size:16px;cursor:pointer;color:var(--text-muted)"><input type="checkbox" id="troca-modo-manual" onchange="document.getElementById('troca-manual-area').style.display=this.checked?'block':'none'"> ✏️ Quero definir o valor manualmente (avançado)</label>
                <div id="troca-manual-area" style="display:none;margin-top:10px">
                    <input class="form-input" id="troca-valor-manual" type="number" style="font-size:20px;text-align:center;font-weight:700;padding:12px" placeholder="R$ valor do usado">
                    <p style="font-size:13px;color:var(--text-muted);margin-top:4px">Se você souber exatamente quanto vale, digite aqui.</p>
                </div>
            </div>
        </div>
        <div class="vendedor-nav">
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI._vendedorTroca()">← Voltar</button>
            <button class="btn btn-lg" style="background:${VENDEDOR_CORES.trocar.accent};color:#fff;font-size:22px;padding:14px 28px" onclick="UI._trocaCalcular()">🔄 CALCULAR VALOR →</button>
        </div>`);
};

// Toggle "Não tem defeito" — habilita/desabilita checkboxes
UI._trocaToggleNenhum = function () {
    const nenhum = document.getElementById('troca-def-nenhum');
    const checkboxes = document.querySelectorAll('.troca-def');
    checkboxes.forEach(cb => {
        cb.disabled = nenhum.checked;
        if (nenhum.checked) cb.checked = false;
    });
};

// Check modelo e mostrar status de referência
UI._trocaCheckModelo = function () {
    const modelo = document.getElementById('troca-modelo')?.value || '';
    const status = document.getElementById('troca-ref-status');
    if (!status) return;
    if (modelo.length < 3) { status.innerHTML = 'Digite o modelo acima...'; status.style.color = 'var(--text-muted)'; return; }
    const ref = UI._buscarPrecoReferencia(modelo);
    if (ref) {
        status.innerHTML = `✅ <strong>${ref.key.toUpperCase()}</strong> encontrado! Valor de referência (perfeito): <strong style="color:var(--accent-green)">${UI.R(ref.valor)}</strong>`;
        status.style.color = 'var(--accent-green)';
    } else {
        status.innerHTML = `💡 Modelo customizado <strong>${modelo.toUpperCase()}</strong> será avaliado com valor de mercado estimado (R$ 800). Você também pode informar o valor manual abaixo.`;
        status.style.color = 'var(--accent-cyan)';
    }
};

// Calcular valor automaticamente
UI._trocaCalcular = function () {
    const d = UI._trocaDados;
    const modeloUsado = document.getElementById('troca-modelo')?.value || '';
    if (!modeloUsado) return UI.toast('Digite o modelo do celular do cliente', 'error');

    // Checar se é manual
    const isManual = document.getElementById('troca-modo-manual')?.checked;
    const valorManual = parseFloat(document.getElementById('troca-valor-manual')?.value) || 0;

    let valorBase = 0;
    let modoCalculo = 'automatico';
    let refKey = '';

    if (isManual && valorManual > 0) {
        valorBase = valorManual;
        modoCalculo = 'manual';
    } else {
        let ref = UI._buscarPrecoReferencia(modeloUsado);
        if (!ref) {
            ref = { key: modeloUsado, valor: 800 };
        }
        valorBase = ref.valor;
        refKey = ref.key;
    }

    // Ler respostas das perguntas
    const batPct = parseInt(document.querySelector('input[name="troca-bat"]:checked')?.value) || 100;
    const arrPct = parseInt(document.querySelector('input[name="troca-arr"]:checked')?.value) || 100;
    const cxPct = parseInt(document.querySelector('input[name="troca-cx"]:checked')?.value) || 100;

    // Calcular defeitos
    let defeitoPct = 0;
    const defeitosDesc = [];
    const nenhum = document.getElementById('troca-def-nenhum')?.checked;
    if (!nenhum) {
        document.querySelectorAll('.troca-def:checked').forEach(cb => {
            const pct = parseInt(cb.dataset.pct) || 0;
            defeitoPct += pct;
            defeitosDesc.push({ desc: cb.parentElement.textContent.trim(), pct });
        });
    }

    // Calcular desconto total com margem segura de revenda para a loja
    const baseCalculo = modoCalculo === 'automatico' ? Math.round(valorBase * 0.55) : valorBase;
    const descBateria = Math.round(baseCalculo * (100 - batPct) / 100);
    const descArranho = Math.round(baseCalculo * (100 - arrPct) / 100);
    const descDefeitos = Math.round(baseCalculo * defeitoPct / 100);
    const descCaixa = Math.round(baseCalculo * (100 - cxPct) / 100);
    const totalDescontos = descBateria + descArranho + descDefeitos + descCaixa;
    let valorUsado = Math.max(0, baseCalculo - totalDescontos);
    if (modoCalculo === 'automatico') {
        const tetoSeguranca = Math.round(valorBase * 0.60);
        if (valorUsado > tetoSeguranca) valorUsado = tetoSeguranca;
    }
    const clientePaga = Math.max(0, d.prod.precoVenda - valorUsado);

    // Labels das perguntas
    const batLabel = batPct === 100 ? 'Boa' : batPct === 90 ? 'Mais ou menos' : 'Ruim';
    const arrLabel = arrPct === 100 ? 'Perfeito' : arrPct === 95 ? 'Poucos arranhões' : 'Muito arranhado';
    const cxLabel = cxPct === 100 ? 'Completo' : cxPct === 97 ? 'Só carregador' : cxPct === 96 ? 'Só caixa' : 'Nada';

    // Montar detalhe dos defeitos
    let defeitosHtml = '';
    if (defeitosDesc.length > 0) {
        defeitosHtml = defeitosDesc.map(df => `<div style="display:flex;justify-content:space-between;font-size:16px;color:var(--accent-red);padding:2px 0"><span>${df.desc.split('(')[0].trim()}</span><span>-${df.pct}%</span></div>`).join('');
    }

    // === RESULTADO COM SELO DE VIABILIDADE (SEM EXPOR CUSTO INTERNO AO CLIENTE) ===
    const custoNosso = d.prod.custo || 0;
    const precoNosso = d.prod.precoVenda || 0;

    let seloTroca = '🔥 EXCELENTE OPORTUNIDADE';
    let corSelo = '#10b981';
    if (clientePaga < custoNosso) {
        seloTroca = '⛔ RECUSAR TROCA (Risco de Prejuízo)';
        corSelo = '#ef4444';
    } else if (clientePaga < custoNosso + 150) {
        seloTroca = '🟡 MARGEM MODERADA (Negociar Menos Crédito)';
        corSelo = '#f59e0b';
    }

    document.getElementById('main-content').innerHTML = _vndWrap('trocar', `
        <div style="text-align:center;padding:20px 0">
            <span style="font-size:12px;font-weight:900;background:${corSelo}22;color:${corSelo};border:1px solid ${corSelo}66;padding:6px 14px;border-radius:20px;display:inline-block;margin-bottom:8px;">${seloTroca}</span>
            <h2 style="color:${VENDEDOR_CORES.trocar.accent};font-size:30px;margin:4px 0;">AVALIAÇÃO INTELIGENTE DE TROCA</h2>
        </div>

        <div class="vendedor-card-destaque" style="text-align:center;padding:24px;border:3px solid var(--accent-green);border-radius:20px;margin-bottom:16px;">
            <p style="font-size:20px;color:var(--text-secondary)">O <strong>${d.prod.nome}</strong> sai para o cliente por apenas:</p>
            <div style="font-size:46px;font-weight:900;color:var(--accent-green);margin:14px 0">
                💰 ${UI.R(clientePaga)}
            </div>
            <p style="font-size:16px;color:var(--text-muted)">(Entrada do ${modeloUsado.toUpperCase()} avaliado em ${UI.R(valorUsado)})</p>
        </div>

        <!-- RESUMO DA PROPOSTA PARA O CLIENTE -->
        <div style="background:rgba(15,20,32,0.95);border:1px solid rgba(255,215,0,0.3);border-radius:16px;padding:20px;margin-bottom:16px;">
            <h4 style="margin:0 0 12px;font-size:16px;color:#FFD700;font-weight:800;">📊 RESUMO DA PROPOSTA DE TROCA</h4>
            <div style="overflow-x:auto;">
                <table style="width:100%;font-size:15px;border-collapse:collapse;text-align:left;">
                    <thead>
                        <tr style="border-bottom:2px solid rgba(255,255,255,0.1);color:var(--text-muted);">
                            <th style="padding:8px;">Item</th>
                            <th style="padding:8px;">Aparelho</th>
                            <th style="padding:8px;text-align:right;">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                            <td style="padding:8px;font-weight:700;color:#00FFA3;">📱 Aparelho da Loja</td>
                            <td style="padding:8px;color:#FFF;font-weight:700;">${d.prod.nome}</td>
                            <td style="padding:8px;font-weight:800;color:#10b981;text-align:right;">${UI.R(precoNosso)}</td>
                        </tr>
                        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                            <td style="padding:8px;font-weight:700;color:#3b82f6;">📲 Entrada do Cliente</td>
                            <td style="padding:8px;color:#FFF;font-weight:700;">${modeloUsado.toUpperCase()}</td>
                            <td style="padding:8px;font-weight:800;color:#3b82f6;text-align:right;">- ${UI.R(valorUsado)}</td>
                        </tr>
                        <tr>
                            <td colspan="2" style="padding:10px 8px;font-weight:900;color:#FFD700;">💰 DIFERENÇA A PAGAR:</td>
                            <td style="padding:10px 8px;font-weight:900;color:#00FFA3;font-size:18px;text-align:right;">${UI.R(clientePaga)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="vendedor-card-destaque" style="padding:18px;border-radius:16px">
            <p style="font-size:18px;font-weight:700;margin-bottom:12px;color:${VENDEDOR_CORES.trocar.accent}">📋 RESUMO DOS DESCONTOS APLICADOS AO USADO:</p>
            ${descBateria > 0 ? `<div style="display:flex;justify-content:space-between;font-size:16px;padding:4px 0"><span>🔋 Bateria: ${batLabel}</span><strong style="color:var(--accent-red)">-${UI.R(descBateria)} (-${100 - batPct}%)</strong></div>` : ''}
            ${descArranho > 0 ? `<div style="display:flex;justify-content:space-between;font-size:16px;padding:4px 0"><span>✨ Aparência: ${arrLabel}</span><strong style="color:var(--accent-red)">-${UI.R(descArranho)} (-${100 - arrPct}%)</strong></div>` : ''}
            ${defeitosHtml ? `<div style="padding:4px 0">${defeitosHtml}</div>` : ''}
            ${descDefeitos > 0 ? `<div style="display:flex;justify-content:space-between;font-size:16px;padding:4px 0;font-weight:700"><span>🔧 Total defeitos</span><strong style="color:var(--accent-red)">-${UI.R(descDefeitos)} (-${defeitoPct}%)</strong></div>` : ''}
            ${descCaixa > 0 ? `<div style="display:flex;justify-content:space-between;font-size:16px;padding:4px 0"><span>📦 Acessórios: ${cxLabel}</span><strong style="color:var(--accent-red)">-${UI.R(descCaixa)} (-${100 - cxPct}%)</strong></div>` : ''}
            ${totalDescontos === 0 ? '<p style="font-size:16px;color:var(--accent-green);padding:4px 0">✅ Nenhum desconto adicional por defeito!</p>' : ''}
        </div>

        <div class="vendedor-nav" style="margin-top:20px">
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI._trocaPasso2('${d.prod.id}')">← Voltar e Ajustar</button>
            <button class="btn btn-lg" style="background:rgba(100,100,100,0.3);color:#FFD700;font-size:18px;padding:14px 28px;border:2px solid rgba(255,215,0,0.3)" onclick="UI._trocaFinalizarPag('orcamento')">📋 SÓ ORÇAMENTO</button>
            <button class="btn btn-lg" style="background:${VENDEDOR_CORES.trocar.accent};color:#fff;font-size:22px;padding:14px 28px" onclick="UI._trocaFinalizarPag('fazer')">✅ FAZER ESSA TROCA</button>
        </div>`);

    UI._trocaResultData = { modeloUsado, valorUsado, clientePaga, valorBase };
    console.log('=== TROCA RESULTADO ===', UI._trocaResultData);
};

// Bug 2: Wrapper que pega dados salvos e pergunta forma de pagamento da diferença
UI._trocaFinalizarPag = function (acao) {
    console.log('=== TROCA AÇÃO ===', acao);
    const r = UI._trocaResultData;
    if (!r) { console.error('Dados da troca perdidos!'); UI.toast('Erro: dados perdidos', 'error'); return; }
    if (acao === 'orcamento') {
        UI._salvarOrcamentoTroca(r.modeloUsado, r.valorUsado, r.clientePaga);
    } else if (acao === 'fazer' && r.clientePaga > 0) {
        document.getElementById('main-content').innerHTML = _vndWrap('trocar', `
            <div class="vendedor-step-header">
                <span class="vendedor-step-badge" style="background:${VENDEDOR_CORES.trocar.accent}">PAGAMENTO DA DIFERENÇA</span>
                <h2 style="font-size:28px">💰 COMO O CLIENTE VAI PAGAR A DIFERENÇA?</h2>
                <p style="font-size:20px">Diferença a receber: <strong style="color:var(--accent-green);font-size:24px">${UI.R(r.clientePaga)}</strong></p>
            </div>
            <div class="vendedor-grid-pag">
                <button class="vendedor-btn-pag" style="padding:20px" onclick="UI._trocaFinalizar('${r.modeloUsado.replace(/'/g, "\\'")}', ${r.valorUsado}, ${r.clientePaga}, 'dinheiro')"><span class="vendedor-btn-icon" style="font-size:36px">💵</span><span class="vendedor-btn-title" style="font-size:22px">DINHEIRO</span><span class="vendedor-btn-valor" style="font-size:20px">${UI.R(r.clientePaga)}</span></button>
                <button class="vendedor-btn-pag" style="padding:20px" onclick="UI._trocaFinalizar('${r.modeloUsado.replace(/'/g, "\\'")}', ${r.valorUsado}, ${r.clientePaga}, 'pix')"><span class="vendedor-btn-icon" style="font-size:36px">📱</span><span class="vendedor-btn-title" style="font-size:22px">PIX</span><span class="vendedor-btn-valor" style="font-size:20px">${UI.R(r.clientePaga)}</span></button>
                <button class="vendedor-btn-pag" style="padding:20px" onclick="UI._trocaFinalizar('${r.modeloUsado.replace(/'/g, "\\'")}', ${r.valorUsado}, ${r.clientePaga}, 'debito')"><span class="vendedor-btn-icon" style="font-size:36px">💳</span><span class="vendedor-btn-title" style="font-size:22px">DÉBITO</span><span class="vendedor-btn-valor" style="font-size:20px">${UI.R(r.clientePaga)}</span></button>
                <button class="vendedor-btn-pag" style="padding:20px" onclick="UI._trocaFinalizar('${r.modeloUsado.replace(/'/g, "\\'")}', ${r.valorUsado}, ${r.clientePaga}, 'credito')"><span class="vendedor-btn-icon" style="font-size:36px">💳</span><span class="vendedor-btn-title" style="font-size:22px">CRÉDITO</span><span class="vendedor-btn-valor" style="font-size:20px">${UI.R(r.clientePaga)}</span></button>
            </div>
            <div class="vendedor-nav"><button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI._trocaCalcular()">← Voltar</button></div>`);
    } else {
        UI._trocaFinalizar(r.modeloUsado, r.valorUsado, r.clientePaga, acao === 'fazer' ? 'dinheiro' : acao);
    }
};

UI._trocaFinalizar = function (modeloUsado, valorUsado, clientePaga, forma = 'dinheiro') {
    console.log('=== TROCA FINALIZAR ===', { modeloUsado, valorUsado, clientePaga, forma });
    const d = UI._trocaDados;
    if (!dataManager.isModoTreino()) {
        const custoNosso = parseFloat(d.prod.custo || 0);
        const custoLiquidoOperacao = Math.max(0, custoNosso - valorUsado);
        const lucroOperacao = Math.max(0, clientePaga - custoLiquidoOperacao);
        const caixaDest = forma === 'dinheiro' ? 'caixaSecundario' : 'caixaPrincipal';
        const nomeCli = UI._clienteAtual ? UI._clienteAtual.nome : 'Cliente';

        if (!dataManager.data.historico.vendas) dataManager.data.historico.vendas = [];
        dataManager.data.historico.vendas.push({
            tipo: 'troca', data: new Date().toISOString(),
            produto: `Troca: ${d.prod.nome} (Entrada: ${modeloUsado.toUpperCase()})`,
            produtoNovo: d.prod.nome, precoNovo: d.prod.precoVenda,
            celularUsado: modeloUsado, valorUsado,
            valorVenda: clientePaga, clientePagou: clientePaga,
            custo: custoLiquidoOperacao, lucro: lucroOperacao,
            formaPagamento: forma, caixaDestino: caixaDest, cliente: nomeCli
        });
        // Marcar produto como vendido
        if (d.prod.quantidade && d.prod.quantidade > 1) {
            d.prod.quantidade -= 1;
        } else {
            d.prod.quantidade = 0;
            d.prod.status = 'vendido';
        }
        d.prod.dataVenda = new Date().toISOString().split('T')[0];

        // Dar entrada do aparelho usado do cliente no estoque de seminovos
        const revendaSugerida = Math.max(Math.round((UI._trocaResultData?.valorBase || valorUsado * 1.6) / 10) * 10, valorUsado + 250);
        dataManager.data.estoqueCelulares.push({
            id: Date.now(),
            nome: modeloUsado.toUpperCase(),
            custo: valorUsado,
            precoVenda: revendaSugerida,
            condicao: 'Seminovo (Troca)',
            status: 'disponivel',
            quantidade: 1,
            dataEntrada: dataManager.hojeLocal ? dataManager.hojeLocal() : new Date().toISOString().split('T')[0],
            origem: `Troca c/ ${nomeCli}`
        });

        // Registrar sincronização financeira da diferença paga
        if (clientePaga > 0) {
            dataManager._registrarSincronizacaoFinanceira({
                tipo: forma === 'dinheiro' ? 'troca_dinheiro' : `troca_${forma}`,
                produto: `Troca: ${d.prod.nome} (Entrada: ${modeloUsado.toUpperCase()})`,
                valorVenda: clientePaga,
                custo: custoLiquidoOperacao,
                caixaDestino: caixaDest,
                cliente: nomeCli
            });
        }

        // Salvar no histórico do cliente + pontos
        if (UI._clienteAtual) {
            const pontos = Math.floor(clientePaga / 10);
            UI._clienteAtual.score = (UI._clienteAtual.score || 0) + pontos;
            if (!UI._clienteAtual.historico) UI._clienteAtual.historico = [];
            UI._clienteAtual.historico.push({
                tipo: 'troca', data: new Date().toISOString().split('T')[0],
                produtoNovo: d.prod.nome, celularUsado: modeloUsado,
                valorUsado, clientePagou: clientePaga, formaPagamento: forma, pontos
            });
        }
        dataManager.saveData();
    }
    UI._tocarSomCaixa();
    const nomeCliente = UI._clienteAtual ? UI._clienteAtual.nome : 'Cliente';
    const pontos = Math.floor(clientePaga / 10);
    document.getElementById('main-content').innerHTML = _vndWrap('trocar', `
        <div style="text-align:center;padding:30px 0">
            <div style="font-size:56px">✅</div>
            <h2 style="color:${VENDEDOR_CORES.trocar.accent};font-size:28px">TROCA REALIZADA!</h2>
            <div class="vendedor-card-destaque" style="text-align:left;margin-top:16px;padding:16px">
                <p style="font-size:18px">Cliente: <strong>${nomeCliente}</strong></p>
                <p style="font-size:18px">Trocou: ${modeloUsado.toUpperCase()}</p>
                <p style="font-size:18px">Levou: ${d.prod.nome}</p>
                <p style="font-size:22px;font-weight:800;color:var(--accent-green);margin:8px 0">Cliente pagou: ${UI.R(clientePaga)}</p>
                <p style="font-size:16px;color:var(--accent-yellow)">🎁 +${pontos} pontos de fidelidade</p>
            </div>
        </div>
        <div class="vendedor-nav">
            <button class="btn btn-lg" style="background:${VENDEDOR_CORES.trocar.accent};color:#fff;font-size:20px" onclick="UI._vendedorTroca()">Nova Troca</button>
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI.renderVendedor()">Voltar ao Menu</button>
        </div>`);
};

// Bug 8: Só Orçamento — Troca
UI._salvarOrcamentoTroca = function (modeloUsado, valorUsado, clientePaga) {
    const d = UI._trocaDados;
    const nomeCliente = UI._clienteAtual ? UI._clienteAtual.nome : 'Cliente';
    if (UI._clienteAtual && !dataManager.isModoTreino()) {
        UI._clienteAtual.score = (UI._clienteAtual.score || 0) + 10;
        if (!UI._clienteAtual.historico) UI._clienteAtual.historico = [];
        UI._clienteAtual.historico.push({ tipo: 'orcamento_troca', data: new Date().toISOString().split('T')[0], produtoNovo: d.prod.nome, celularUsado: modeloUsado, valorUsado, clientePagaria: clientePaga, status: 'orcamento_nao_finalizado' });
        dataManager.saveData();
    }
    document.getElementById('main-content').innerHTML = _vndWrap('trocar', `
        <div style="text-align:center;padding:40px 0">
            <div style="font-size:56px">📋</div>
            <h2 style="color:${VENDEDOR_CORES.trocar.accent};font-size:28px">ORÇAMENTO SALVO!</h2>
            <p style="font-size:20px;margin:8px 0">Cliente: <strong>${nomeCliente}</strong></p>
            <p style="font-size:18px">${d.prod.nome} com troca de ${modeloUsado}</p>
            <p style="font-size:28px;font-weight:900;color:var(--accent-green);margin:12px 0">Cliente pagaria: ${UI.R(clientePaga)}</p>
            <div style="margin-top:16px;padding:12px 20px;background:rgba(245,158,11,0.1);border-radius:12px;display:inline-block">
                <p style="font-size:16px;color:var(--accent-yellow)">🎁 <strong>${nomeCliente}</strong> ganhou 10 pontos por interesse!</p>
            </div>
        </div>
        <div class="vendedor-nav">
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI.renderVendedor()">Voltar ao Menu</button>
        </div>`);
};

// Bug 8: Só Orçamento — Película
UI._salvarOrcamentoPelicula = function (nome, preco) {
    const nomeCliente = UI._clienteAtual ? UI._clienteAtual.nome : 'Cliente';
    if (UI._clienteAtual && !dataManager.isModoTreino()) {
        UI._clienteAtual.score = (UI._clienteAtual.score || 0) + 10;
        if (!UI._clienteAtual.historico) UI._clienteAtual.historico = [];
        UI._clienteAtual.historico.push({ tipo: 'orcamento_pelicula', data: new Date().toISOString().split('T')[0], servico: nome, modelo: UI._peliculaData?.modelo || '', valor: preco, status: 'orcamento_nao_finalizado' });
        dataManager.saveData();
    }
    document.getElementById('main-content').innerHTML = _vndWrap('pelicula', `
        <div style="text-align:center;padding:40px 0">
            <div style="font-size:56px">📋</div>
            <h2 style="color:${VENDEDOR_CORES.pelicula.accent};font-size:28px">ORÇAMENTO SALVO!</h2>
            <p style="font-size:20px;margin:8px 0">Cliente: <strong>${nomeCliente}</strong></p>
            <p style="font-size:18px">${UI._peliculaData?.modelo || ''} — ${nome}</p>
            <p style="font-size:28px;font-weight:900;color:var(--accent-green);margin:12px 0">${UI.R(preco)}</p>
            <div style="margin-top:16px;padding:12px 20px;background:rgba(245,158,11,0.1);border-radius:12px;display:inline-block">
                <p style="font-size:16px;color:var(--accent-yellow)">🎁 <strong>${nomeCliente}</strong> ganhou 10 pontos por interesse!</p>
            </div>
        </div>
        <div class="vendedor-nav">
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI.renderVendedor()">Voltar ao Menu</button>
        </div>`);
};

// === PARCELA ===
UI._vendedorParcela = function () {
    const creds = dataManager.data.crediarios.filter(c => c.status !== 'quitado');
    creds.sort((a, b) => (a.status === 'inadimplente' ? -1 : 1));
    let html = `<div class="vendedor-step-header"><span class="vendedor-step-badge" style="background:${VENDEDOR_CORES.parcela.accent}">💳</span><h2 style="font-size:28px">RECEBER PARCELA</h2><p style="font-size:20px">${creds.length} crediários ativos</p></div>`;
    if (creds.length === 0) html += '<p style="text-align:center;padding:30px;color:var(--text-muted);font-size:22px">Nenhum crediário ativo 🎉</p>';
    creds.forEach(c => {
        html += `<div class="vendedor-produto-item" style="padding:14px"><div class="vendedor-produto-info"><div class="vendedor-produto-nome" style="font-size:20px">${c.cliente}</div><div class="vendedor-produto-detalhe" style="font-size:16px">${c.parcelasPagas}/${c.parcelasTotal} pagas | ${c.status}</div></div><div class="vendedor-produto-acoes"><div class="vendedor-produto-preco" style="font-size:20px;font-weight:800">${UI.R(c.valorParcela)}</div><button class="btn btn-sm btn-primary" style="font-size:16px" onclick="if(!dataManager.isModoTreino()){dataManager.receberParcela('${c.id}',${c.valorParcela});}UI.toast('✅ Parcela recebida!','success');UI._vendedorParcela()">RECEBER</button></div></div>`;
    });
    html += `<div class="vendedor-footer"><button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI.renderVendedor()">← Voltar</button></div>`;
    document.getElementById('main-content').innerHTML = _vndWrap('parcela', html);
};

// === ESTOQUE — SEM CUSTOS/MARGENS ===
UI._vendedorEstoque = function () {
    const celulares = dataManager.getEstoqueCelulares();
    const acessorios = dataManager.getEstoqueAcessorios();
    const renderLista = (f) => {
        let html = '';
        const filtrar = (lista) => f ? lista.filter(p => p.nome.toLowerCase().includes(f.toLowerCase())) : lista;
        const celFiltrados = filtrar(celulares);
        if (celFiltrados.length) {
            html += '<h3 style="font-size:20px;margin:12px 0 6px">📱 CELULARES</h3>';
            celFiltrados.forEach(p => {
                const dias = dataManager.diasNoEstoque(p);
                html += `<div class="vendedor-produto-item" style="padding:12px"><div class="vendedor-produto-info"><div class="vendedor-produto-nome" style="font-size:18px">📱 ${p.nome}</div><div class="vendedor-produto-detalhe" style="font-size:15px">${p.condicao}${dias > 0 ? ' | ' + dias + ' dias' : ''}</div></div><div class="vendedor-produto-acoes"><div class="vendedor-produto-preco" style="font-size:20px">${UI.R(p.precoVenda)}</div></div></div>`;
            });
        }
        const aceFiltrados = filtrar(acessorios);
        if (aceFiltrados.length) {
            html += '<h3 style="font-size:20px;margin:12px 0 6px">🎧 ACESSÓRIOS</h3>';
            aceFiltrados.forEach(p => {
                const qtd = p.quantidade ? ` | QTD: ${p.quantidade}` : '';
                html += `<div class="vendedor-produto-item" style="padding:12px"><div class="vendedor-produto-info"><div class="vendedor-produto-nome" style="font-size:18px">${p.nome}</div><div class="vendedor-produto-detalhe" style="font-size:15px">${p.tipo || ''}${qtd}</div></div><div class="vendedor-produto-acoes"><div class="vendedor-produto-preco" style="font-size:20px">${UI.R(p.precoVenda)}</div></div></div>`;
            });
        }
        return html || '<p style="text-align:center;padding:20px;color:var(--text-muted);font-size:18px">Nenhum produto</p>';
    };
    document.getElementById('main-content').innerHTML = _vndWrap('estoque', `
        <div class="vendedor-step-header"><span class="vendedor-step-badge" style="background:${VENDEDOR_CORES.estoque.accent}">📦</span><h2 style="font-size:28px">ESTOQUE DA LOJA</h2><p style="font-size:20px">${celulares.length + acessorios.length} produtos disponíveis</p></div>
        <div class="vendedor-busca"><input class="form-input vendedor-input-busca" id="est-busca" placeholder="🔍 Buscar..." style="font-size:18px;padding:14px" oninput="UI._estFiltrar()"></div>
        <div id="est-lista">${renderLista('')}</div>
        <div class="vendedor-footer"><button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI.renderVendedor()">← Voltar</button></div>`);
    UI._estFiltrar = () => { document.getElementById('est-lista').innerHTML = renderLista(document.getElementById('est-busca')?.value || ''); };
};

// === AJUDA COMPLETA (Correção 8) ===
UI._vendedorAjuda = function () {
    document.getElementById('main-content').innerHTML = _vndWrap('estoque', `
        <div class="vendedor-step-header" style="text-align:center"><h2 style="font-size:28px">❓ CENTRAL DE AJUDA</h2><p style="font-size:20px">Em que você quer ajuda?</p></div>
        <div class="vendedor-section" style="max-width:600px;margin:0 auto">
            <h3 style="font-size:20px;color:var(--accent-cyan);margin-bottom:10px">🎯 TUTORIAIS MODO VENDEDOR (para Cris)</h3>
            <div class="vendedor-produto-item" style="padding:16px" onclick="UI._ajudaDetalhe('venda')"><div class="vendedor-produto-info"><div class="vendedor-produto-nome" style="font-size:20px">💰 Como fazer uma VENDA</div></div></div>
            <div class="vendedor-produto-item" style="padding:16px" onclick="UI._ajudaDetalhe('troca')"><div class="vendedor-produto-info"><div class="vendedor-produto-nome" style="font-size:20px">🔄 Como avaliar uma TROCA</div></div></div>
            <div class="vendedor-produto-item" style="padding:16px" onclick="UI._ajudaDetalhe('conserto')"><div class="vendedor-produto-info"><div class="vendedor-produto-nome" style="font-size:20px">🔧 Como fazer um CONSERTO</div></div></div>
            <div class="vendedor-produto-item" style="padding:16px" onclick="UI._ajudaDetalhe('pelicula')"><div class="vendedor-produto-info"><div class="vendedor-produto-nome" style="font-size:20px">📱 Como colocar PELÍCULA</div></div></div>
            <div class="vendedor-produto-item" style="padding:16px" onclick="UI._ajudaDetalhe('parcela')"><div class="vendedor-produto-info"><div class="vendedor-produto-nome" style="font-size:20px">💳 Como receber PARCELA</div></div></div>
            <div class="vendedor-produto-item" style="padding:16px" onclick="UI._ajudaDetalhe('estoque')"><div class="vendedor-produto-info"><div class="vendedor-produto-nome" style="font-size:20px">📦 Como ver o ESTOQUE</div></div></div>
            <div class="vendedor-produto-item" style="padding:16px" onclick="UI._ajudaDetalhe('erro')"><div class="vendedor-produto-info"><div class="vendedor-produto-nome" style="font-size:20px">🚨 O que fazer quando der ERRO</div></div></div>
            <h3 style="font-size:20px;color:var(--accent-cyan);margin:16px 0 10px">📊 TUTORIAIS MODO GESTOR</h3>
            <div class="vendedor-produto-item" style="padding:16px" onclick="UI._ajudaDetalhe('addprod')"><div class="vendedor-produto-info"><div class="vendedor-produto-nome" style="font-size:20px">📦 Como ADICIONAR produtos</div></div></div>
            <div class="vendedor-produto-item" style="padding:16px" onclick="UI._ajudaDetalhe('caixa')"><div class="vendedor-produto-info"><div class="vendedor-produto-nome" style="font-size:20px">💰 Como gerenciar CAIXAS</div></div></div>
            <div class="vendedor-produto-item" style="padding:16px" onclick="UI._ajudaDetalhe('relatorio')"><div class="vendedor-produto-info"><div class="vendedor-produto-nome" style="font-size:20px">📊 Como ver RELATÓRIOS</div></div></div>
            <h3 style="font-size:20px;color:var(--accent-yellow);margin:16px 0 10px">⌨️ ATALHOS DO TECLADO</h3>
            <div style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:12px;padding:16px;font-size:18px;line-height:2">
                <p><strong>Ctrl+V</strong> = Abrir Modo Vendedor</p>
                <p><strong>Ctrl+E</strong> = Ver Estoque</p>
                <p><strong>Ctrl+T</strong> = Avaliar Troca</p>
                <p><strong>Ctrl+H</strong> = Abrir Ajuda</p>
                <p><strong>Ctrl+S</strong> = Salvar/Backup</p>
            </div>
        </div>
        <div class="vendedor-footer" style="text-align:center;margin-top:16px"><button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI.renderVendedor()">← Voltar ao Menu</button></div>`);
};

UI._ajudaDetalhe = function (tipo) {
    const tutoriais = {
        venda: {
            titulo: '💰 COMO FAZER UMA VENDA', passos: [
                { t: 'PASSO 1 — CLIQUE EM VENDER', d: 'Na tela principal, clique no botão VERDE escrito "VENDER".\nÉ o primeiro botão em cima à esquerda.' },
                { t: 'PASSO 2 — ESCOLHA O PRODUTO', d: 'Vai aparecer uma lista com TODOS os produtos da loja.\n📱 Celulares, 🎧 Acessórios e 📦 Equipamentos.\nProcure o produto e clique "VENDER".\n\n💡 DICA: Use a barra de busca para encontrar mais rápido.' },
                { t: 'PASSO 3 — DESCONTO', d: 'O sistema mostra o preço.\n\n• Se NÃO vai dar desconto: Clique "Não"\n• Se VAI dar desconto: Clique "Sim", digite quanto\n\nDepois clique "PRÓXIMO"' },
                { t: 'PASSO 4 — COMO VAI PAGAR', d: '💵 DINHEIRO — Se pagar em dinheiro\n📱 PIX — Se pagar por PIX\n💳 CARTÃO — Se pagar no cartão\n\nClique na opção que o cliente escolher.' },
                { t: 'PASSO 5 — CONFIRME', d: 'Confira se está tudo certo.\n\nSe OK: Clique "✅ CONFIRMAR VENDA"\nSe errado: Clique "Voltar" e corrija.' },
                { t: 'PRONTO! 🎉', d: 'Vai aparecer "✅ VENDA REALIZADA!"\n\nA venda foi registrada e o produto saiu do estoque.\nO cliente ganhou pontos de fidelidade!' }
            ]
        },
        troca: {
            titulo: '🔄 COMO AVALIAR UMA TROCA', passos: [
                { t: 'PASSO 1 — CLIQUE EM TROCAR', d: 'Clique no botão AZUL escrito "TROCAR".' },
                { t: 'PASSO 2 — ESCOLHA O CELULAR NOVO', d: 'Escolha qual celular da loja o cliente quer COMPRAR.' },
                { t: 'PASSO 3 — RESPONDA AS PERGUNTAS', d: 'O sistema pergunta sobre o celular do cliente:\n\n1️⃣ Bateria está boa?\n2️⃣ Tem arranhão?\n3️⃣ Tem algum defeito?\n4️⃣ Tem caixa e carregador?\n\nDigite o modelo e quanto vale.' },
                { t: 'RESULTADO', d: 'O sistema calcula TUDO automaticamente.\nMostra o preço FINAL que o cliente paga.\n\n💡 O preço aparece BEM GRANDE na tela!' }
            ]
        },
        conserto: {
            titulo: '🔧 COMO FAZER UM CONSERTO', passos: [
                { t: 'PASSO 1', d: 'Clique em "CONSERTO". Digite nome e telefone do cliente.' },
                { t: 'PASSO 2', d: 'Digite o modelo do celular (Ex: "Moto G10").' },
                { t: 'PASSO 3', d: 'Escolha o serviço na lista (Tela, Bateria, etc.).' },
                { t: 'PASSO 4', d: 'O sistema sugere 3 preços. Escolha um ou digite outro.' },
                { t: 'PASSO 5', d: 'Escolha quanto de entrada (50%, 30% ou sem). Confirme!' }
            ]
        },
        pelicula: {
            titulo: '📱 COMO COLOCAR PELÍCULA', passos: [
                { t: 'PASSO 1', d: 'Clique em "PELÍCULA". Digite o modelo do celular.' },
                { t: 'PASSO 2', d: 'Escolha o tipo: HD, Fosca, Traseira ou Completa.' },
                { t: 'PASSO 3', d: 'Escolha como vai pagar: Dinheiro, PIX, Débito ou Crédito. Pronto!' }
            ]
        },
        parcela: {
            titulo: '💳 COMO RECEBER PARCELA', passos: [
                { t: 'PASSO 1', d: 'Clique em "RECEBER PARCELA".' },
                { t: 'PASSO 2', d: 'Procure o nome do cliente na lista.' },
                { t: 'PASSO 3', d: 'Clique "RECEBER" ao lado do nome. Pronto!' }
            ]
        },
        estoque: {
            titulo: '📦 COMO VER O ESTOQUE', passos: [
                { t: 'PASSO 1', d: 'Clique em "VER ESTOQUE".' },
                { t: 'PASSO 2', d: 'Veja todos os produtos separados por categoria.\nUse a busca para encontrar rápido.' }
            ]
        },
        erro: {
            titulo: '🚨 O QUE FAZER QUANDO DER ERRO', passos: [
                { t: 'PASSO 1 — CALMA!', d: 'Não se preocupe, nenhum dado é perdido.' },
                { t: 'PASSO 2 — TENTE DE NOVO', d: 'Clique "← Voltar" e tente novamente.' },
                { t: 'PASSO 3 — ATUALIZE', d: 'Se não resolver, aperte F5 para atualizar a página.' },
                { t: 'PASSO 4 — AVISE', d: 'Se continuar com erro, tire um print e avise o gestor.' }
            ]
        },
        addprod: {
            titulo: '📦 COMO ADICIONAR PRODUTOS', passos: [
                { t: 'PASSO 1', d: 'No menu lateral, clique em "📱 Celulares" ou "📦 Acessórios".' },
                { t: 'PASSO 2', d: 'Clique no botão "+ Comprar Celular" ou "+ Adicionar".' },
                { t: 'PASSO 3', d: 'Preencha: Nome, Custo, Preço de Venda, Condição.\nClique "Salvar".' }
            ]
        },
        caixa: {
            titulo: '💰 COMO GERENCIAR CAIXAS', passos: [
                { t: 'PAINEL', d: 'No Dashboard, veja os 3 caixas: Principal, Assistência, Acessórios.' },
                { t: 'RETIRAR', d: 'Clique "💸 Retirar Dinheiro". Escolha o caixa, valor e motivo.' },
                { t: 'ADICIONAR', d: 'Clique "💰 Adicionar Dinheiro". Escolha destino e motivo.' },
                { t: 'TRANSFERIR', d: 'Clique "🔄 Transferir". Escolha origem, destino e valor.' }
            ]
        },
        relatorio: {
            titulo: '📊 COMO VER RELATÓRIOS', passos: [
                { t: 'PASSO 1', d: 'No menu lateral, clique em "📊 Histórico".' },
                { t: 'PASSO 2', d: 'Veja todas as vendas, consertos e movimentações.' },
                { t: 'IA', d: 'Clique em "🤖 IA Sugestões" para ver análises inteligentes.' }
            ]
        }
    };
    const t = tutoriais[tipo]; if (!t) return;
    let html = `<div class="vendedor-step-header" style="text-align:center"><h2 style="font-size:26px">${t.titulo}</h2></div><div class="vendedor-section" style="max-width:600px;margin:0 auto">`;
    t.passos.forEach(p => {
        html += `<div style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:12px;padding:18px 22px;margin-bottom:14px">
            <h3 style="font-size:20px;color:var(--accent-cyan);margin-bottom:10px">${p.t}</h3>
            <p style="font-size:18px;line-height:1.7;white-space:pre-line;color:var(--text-primary)">${p.d}</p>
        </div>`;
    });
    html += `</div><div class="vendedor-nav" style="text-align:center;margin-top:16px">
        <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI._vendedorAjuda()">← Ver Outra Ajuda</button>
        <button class="btn btn-primary btn-lg" style="font-size:18px" onclick="UI.renderVendedor()">Voltar ao Menu</button>
    </div>`;
    document.getElementById('main-content').innerHTML = _vndWrap('estoque', html);
};
