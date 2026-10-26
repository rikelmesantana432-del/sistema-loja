// StrategyOS 3.1 — ÁREA DA CRIS (Modo Vendedor — TELA CHEIA)
// REGRA: NUNCA mostrar custo, margem ou lucro nesta tela (cliente pode ver)
// CORREÇÃO 1: Tela cheia (sem sidebar) | CORREÇÃO 2: Fontes GRANDES

const VENDEDOR_CORES = {
    vender: { bg: 'rgba(16,185,129,0.08)', border: '#10b981', accent: '#10b981' },
    trocar: { bg: 'rgba(59,130,246,0.08)', border: '#3b82f6', accent: '#3b82f6' },
    conserto: { bg: 'rgba(139,92,246,0.08)', border: '#8b5cf6', accent: '#8b5cf6' },
    pelicula: { bg: 'rgba(249,115,22,0.08)', border: '#f97316', accent: '#f97316' },
    parcela: { bg: 'rgba(245,158,11,0.08)', border: '#f59e0b', accent: '#f59e0b' },
    estoque: { bg: 'rgba(107,114,128,0.08)', border: '#6b7280', accent: '#6b7280' }
};

// === TELA CHEIA: Esconder/Mostrar sidebar ===
UI._entrarTelaCheia = function () {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    if (sidebar) sidebar.style.display = 'none';
    if (mainContent) {
        mainContent.style.marginLeft = '0';
        mainContent.style.width = '100%';
    }
    document.body.classList.add('vendedor-fullscreen');
};

UI._sairTelaCheia = function () {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    if (sidebar) sidebar.style.display = '';
    if (mainContent) {
        mainContent.style.marginLeft = '';
        mainContent.style.width = '';
    }
    document.body.classList.remove('vendedor-fullscreen');
    UI.navigate('inicio');
};

function _vndWrap(fluxo, html) {
    const cor = VENDEDOR_CORES[fluxo] || VENDEDOR_CORES.vender;
    return `<div class="vendedor-container vnd-fontes-grandes" style="background:${cor.bg};border-radius:16px;padding:24px;min-height:80vh">${html}</div>`;
}

// === CORREÇÃO 2: IDENTIFICAÇÃO UNIVERSAL DO CLIENTE ===
UI._clienteAtual = null;

UI._buscarClientePorTelefone = function (telefone) {
    if (!telefone || telefone.length < 8) return null;
    const tel = telefone.replace(/\D/g, '');
    const clientes = dataManager.data.clientes || [];
    return clientes.find(c => (c.telefone || '').replace(/\D/g, '') === tel || (c.telefone || '').replace(/\D/g, '').includes(tel));
};

UI._identificarCliente = function (fluxo, callbackFn) {
    const cor = VENDEDOR_CORES[fluxo] || VENDEDOR_CORES.vender;
    UI._clienteCallback = callbackFn;
    UI._clienteFluxo = fluxo;
    document.getElementById('main-content').innerHTML = _vndWrap(fluxo, `
        <div class="vendedor-step-header">
            <span class="vendedor-step-badge" style="background:${cor.accent}">PASSO 1</span>
            <h2 style="font-size:28px">👤 IDENTIFICAR CLIENTE</h2>
            <p style="font-size:20px">Digite o nome ou telefone do cliente</p>
        </div>
        <div class="vendedor-section" style="max-width:600px;margin:0 auto">
            <div style="margin-bottom:16px;text-align:center;">
                <button class="btn btn-primary btn-lg" style="width:100%;font-size:20px;font-weight:900;padding:16px;background:linear-gradient(135deg, #10b981 0%, #059669 100%);border:2px solid #34d399;box-shadow:0 6px 20px rgba(16,185,129,0.3);cursor:pointer;" onclick="UI._vendedorClienteGeralRapido()">
                    ⚡ VENDA RÁPIDA — CLIENTE GERAL
                </button>
                <div style="font-size:13px;color:var(--text-muted);margin-top:6px;">Não precisa cadastrar nome/telefone — avança na hora!</div>
            </div>

            <div style="position:relative;text-align:center;margin:20px 0 16px;border-bottom:1px solid rgba(255,255,255,0.1);"><span style="position:relative;top:10px;background:#1a1f2e;padding:0 12px;font-size:13px;color:var(--text-muted);">OU BUSQUE / CADASTRE O CLIENTE:</span></div>

            <label class="form-label" style="font-size:18px;color:#FFD700">Nome do cliente:</label>
            <input class="form-input" id="cli-nome" placeholder="Digite o nome para buscar..." style="font-size:20px;padding:14px" oninput="UI._autoCompletarCliente()">
            
            <label class="form-label" style="font-size:18px;margin-top:12px;color:#FFD700">Telefone / WhatsApp:</label>
            <input class="form-input" id="cli-tel" placeholder="(75) 9XXXX-XXXX" type="tel" maxlength="16" style="font-size:20px;padding:14px" oninput="UI._mascaraTelefone(this);UI._autoCompletarCliente()">
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
                <div>
                    <label class="form-label" style="font-size:14px;color:var(--text-muted)">Aniversário (opcional):</label>
                    <input class="form-input" id="cli-nasc" placeholder="DD/MM" style="font-size:16px;padding:10px">
                </div>
                <div>
                    <label class="form-label" style="font-size:14px;color:var(--text-muted)">Bairro / Cidade:</label>
                    <input class="form-input" id="cli-bairro" placeholder="Amargosa" style="font-size:16px;padding:10px" value="Amargosa">
                </div>
            </div>

            <div id="cli-sugestoes" style="margin-top:10px"></div>
            <div id="cli-status" style="margin-top:10px;font-size:15px;color:var(--text-muted)">💡 Ao digitar o nome ou telefone, o sistema busca os clientes cadastrados</div>
        </div>
        <div class="vendedor-nav" style="max-width:600px;margin:20px auto 0">
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI.renderVendedor()">← Voltar</button>
            <button class="btn btn-lg" style="background:${cor.accent};color:#fff;font-size:20px;padding:14px 28px" onclick="UI._confirmarCliente()">Próximo →</button>
        </div>`);
    setTimeout(() => { const el = document.getElementById('cli-nome'); if (el) el.focus(); }, 150);
};

// Bug 9: Máscara de telefone
UI._mascaraTelefone = function (input) {
    let v = input.value.replace(/\D/g, '');
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length <= 10) {
        v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
        v = v.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }
    input.value = v;
};

UI._autoCompletarCliente = function () {
    const nomeInp = document.getElementById('cli-nome');
    const telInp = document.getElementById('cli-tel');
    const status = document.getElementById('cli-status');
    const sugestoesDiv = document.getElementById('cli-sugestoes');
    
    const termNome = (nomeInp?.value || '').toLowerCase().trim();
    const termTel = (telInp?.value || '').replace(/\D/g, '');

    if (termNome.length < 2 && termTel.length < 3) {
        if (sugestoesDiv) sugestoesDiv.innerHTML = '';
        if (status) status.innerHTML = '💡 Digite o nome ou telefone para buscar o cliente automaticamente';
        return;
    }

    const clientes = dataManager.data.clientes || [];
    const encontrados = clientes.filter(c => {
        const matchNome = termNome.length >= 2 && (c.nome || '').toLowerCase().includes(termNome);
        const matchTel = termTel.length >= 3 && (c.telefone || '').replace(/\D/g, '').includes(termTel);
        return matchNome || matchTel;
    });

    if (encontrados.length > 0) {
        if (status) status.innerHTML = `<span style="color:var(--accent-green);font-weight:bold;">✅ ${encontrados.length} cliente(s) encontrado(s). Clique para selecionar:</span>`;
        if (sugestoesDiv) {
            sugestoesDiv.innerHTML = encontrados.slice(0, 4).map(c => `
                <div onclick="UI._selecionarClienteSugestao('${c.nome.replace(/'/g, "\\'")}', '${c.telefone}')" 
                     style="padding:10px 14px;background:rgba(255,255,255,0.08);border:1px solid var(--accent-purple);border-radius:8px;margin-top:6px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <strong style="color:#FFF;font-size:16px">${c.nome}</strong>
                        <div style="font-size:13px;color:var(--text-muted)">📞 ${c.telefone || 'Sem tel'} | 📍 ${c.endereco?.bairro || 'Amargosa'}</div>
                    </div>
                    <span style="color:var(--accent-green);font-weight:bold;">SELECIONAR ✓</span>
                </div>
            `).join('');
        }
    } else {
        if (sugestoesDiv) sugestoesDiv.innerHTML = '';
        if (status) status.innerHTML = '🆕 Novo cliente — será cadastrado automaticamente com as informações digitadas';
        UI._clienteAtual = null;
    }
};

UI._selecionarClienteSugestao = function (nome, telefone) {
    const nomeInp = document.getElementById('cli-nome');
    const telInp = document.getElementById('cli-tel');
    const nascInp = document.getElementById('cli-nasc');
    const bairroInp = document.getElementById('cli-bairro');
    const sugestoesDiv = document.getElementById('cli-sugestoes');
    
    const cliente = dataManager.data.clientes.find(c => c.nome === nome || c.telefone === telefone);
    if (cliente) {
        if (nomeInp) nomeInp.value = cliente.nome;
        if (telInp) {
            telInp.value = cliente.telefone;
            UI._mascaraTelefone(telInp);
        }
        if (nascInp) nascInp.value = cliente.nascimento || '';
        if (bairroInp) bairroInp.value = cliente.endereco?.bairro || 'Amargosa';
        
        UI._clienteAtual = cliente;
        if (sugestoesDiv) sugestoesDiv.innerHTML = '';
        const status = document.getElementById('cli-status');
        if (status) status.innerHTML = `<span style="color:var(--accent-green);font-weight:bold;">✅ Cliente Selecionado: ${cliente.nome}</span>`;
    }
};

UI._confirmarCliente = function () {
    let nome = document.getElementById('cli-nome')?.value?.trim();
    const tel = document.getElementById('cli-tel')?.value?.trim();
    const nasc = document.getElementById('cli-nasc')?.value?.trim();
    const bairro = document.getElementById('cli-bairro')?.value?.trim();

    if (!nome || nome.length < 2) {
        nome = 'Consumidor Geral';
    }
    const telLimpo = tel ? tel.replace(/\D/g, '') : '';
    if (telLimpo.length > 0 && telLimpo.length !== 10 && telLimpo.length !== 11) return UI.toast('Digite um telefone válido (10 ou 11 dígitos) ou deixe em branco', 'error');

    // Busca ou cria cliente
    let cliente = UI._buscarClientePorTelefone(tel) || dataManager.data.clientes.find(c => c.nome.toLowerCase() === nome.toLowerCase());
    if (!cliente) {
        cliente = {
            nome: nome, telefone: tel, cpf: '', nascimento: nasc || '',
            endereco: { rua: '', numero: '', complemento: '', bairro: bairro || 'Amargosa', cidade: 'Amargosa', uf: 'BA', cep: '' },
            email: '', instagram: '', comoConheceu: '', observacoes: '',
            dataCadastro: new Date().toISOString().split('T')[0],
            score: 50, parcelasEmDia: 0, parcelasAtrasadas: 0, crediariosQuitados: 0, historico: []
        };
        if (!dataManager.isModoTreino()) {
            dataManager.data.clientes.push(cliente);
            dataManager.saveData();
        }
    } else {
        if (nasc) cliente.nascimento = nasc;
        if (bairro && cliente.endereco) cliente.endereco.bairro = bairro;
        if (!dataManager.isModoTreino()) dataManager.saveData();
    }
    UI._clienteAtual = cliente;
    if (UI._clienteCallback) UI._clienteCallback(cliente);
};

UI._vendedorClienteGeralRapido = function () {
    const cliente = {
        nome: 'Consumidor Geral',
        telefone: '',
        score: 50,
        historico: []
    };
    UI._clienteAtual = cliente;
    if (UI._clienteCallback) UI._clienteCallback(cliente);
};

// === TELA PRINCIPAL — ÁREA DA ILANNA ===
UI.renderVendedor = function () {
    UI.paginaAtual = 'vendedor';
    UI._entrarTelaCheia();
    const treino = dataManager.isModoTreino();
    document.getElementById('main-content').innerHTML = `
        <div class="vendedor-container vnd-fontes-grandes" style="background:rgba(244,114,182,0.06)">
            ${treino ? '<div class="vendedor-treino-badge" style="font-size:18px">🎓 MODO TREINO — Nada é salvo de verdade</div>' : ''}
            <div class="vendedor-header" style="text-align:center;padding:30px 0 20px">
                <div style="text-align:center;padding:16px">
                    <h1 style="font-size:42px;font-weight:bold;color:#FFD700;text-shadow:2px 2px 4px rgba(0,0,0,0.3);font-family:'Arial Black',sans-serif;margin:0">CESINHA ACESSÓRIOS</h1>
                    <p style="font-size:16px;color:var(--text-muted);margin-top:4px">🏪 Celulares | Acessórios | Assistência Técnica</p>
                </div>
                <h2 style="font-size:28px;font-weight:800;color:#ec4899;margin-top:8px">👋 BEM-VINDO(A)!</h2>
                <p style="font-size:20px;color:var(--text-secondary);margin-top:6px">O que você vai fazer agora?</p>
                ${UI._obterWidgetMetaIlanna()}
            </div>
            <div class="vendedor-grid" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;max-width:1100px;margin:0 auto 24px;align-items:stretch;">
                <button class="vendedor-btn reg-card" style="border-color:${VENDEDOR_CORES.vender.border};background:${VENDEDOR_CORES.vender.bg};padding:22px 16px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:16px;text-align:center;" onclick="UI._vendedorVender()">
                    <span class="vendedor-btn-icon reg-card-icon" style="font-size:42px;margin-bottom:8px">💰</span>
                    <span class="vendedor-btn-title reg-card-title" style="color:${VENDEDOR_CORES.vender.accent};font-size:22px;font-weight:900;display:block;">VENDER</span>
                    <span class="vendedor-btn-desc" style="font-size:14px;color:var(--text-muted);margin-top:4px;">Cliente quer comprar</span>
                </button>
                <button class="vendedor-btn reg-card" style="border-color:${VENDEDOR_CORES.trocar.border};background:${VENDEDOR_CORES.trocar.bg};padding:22px 16px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:16px;text-align:center;" onclick="UI._vendedorTroca()">
                    <span class="vendedor-btn-icon reg-card-icon" style="font-size:42px;margin-bottom:8px">🔄</span>
                    <span class="vendedor-btn-title reg-card-title" style="color:${VENDEDOR_CORES.trocar.accent};font-size:22px;font-weight:900;display:block;">TROCAR</span>
                    <span class="vendedor-btn-desc" style="font-size:14px;color:var(--text-muted);margin-top:4px;">Cliente quer trocar celular</span>
                </button>
                <button class="vendedor-btn reg-card" style="border-color:${VENDEDOR_CORES.conserto.border};background:${VENDEDOR_CORES.conserto.bg};padding:22px 16px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:16px;text-align:center;" onclick="UI._vendedorConserto()">
                    <span class="vendedor-btn-icon reg-card-icon" style="font-size:42px;margin-bottom:8px">🔧</span>
                    <span class="vendedor-btn-title reg-card-title" style="color:${VENDEDOR_CORES.conserto.accent};font-size:22px;font-weight:900;display:block;">CONSERTO</span>
                    <span class="vendedor-btn-desc" style="font-size:14px;color:var(--text-muted);margin-top:4px;">Cliente quer consertar</span>
                </button>
                <button class="vendedor-btn reg-card" style="border-color:${VENDEDOR_CORES.pelicula.border};background:${VENDEDOR_CORES.pelicula.bg};padding:22px 16px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:16px;text-align:center;" onclick="UI._vendedorPelicula()">
                    <span class="vendedor-btn-icon reg-card-icon" style="font-size:42px;margin-bottom:8px">📱</span>
                    <span class="vendedor-btn-title reg-card-title" style="color:${VENDEDOR_CORES.pelicula.accent};font-size:22px;font-weight:900;display:block;">PELÍCULA</span>
                    <span class="vendedor-btn-desc" style="font-size:14px;color:var(--text-muted);margin-top:4px;">Cliente quer película</span>
                </button>
                <button class="vendedor-btn reg-card" style="border-color:#a855f7;background:rgba(168,85,247,0.08);padding:22px 16px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:16px;text-align:center;" onclick="UI._vendedorEncomendas()">
                    <span class="vendedor-btn-icon reg-card-icon" style="font-size:42px;margin-bottom:8px">📦</span>
                    <span class="vendedor-btn-title reg-card-title" style="color:#a855f7;font-size:22px;font-weight:900;display:block;">ENCOMENDAS</span>
                    <span class="vendedor-btn-desc" style="font-size:14px;color:var(--text-muted);margin-top:4px;">Encomendar para cliente</span>
                </button>
                <button class="vendedor-btn reg-card" style="border-color:#f97316;background:rgba(249,115,22,0.08);padding:22px 16px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:16px;text-align:center;" onclick="UI._vendedorConsertosPendentes()">
                    <span class="vendedor-btn-icon reg-card-icon" style="font-size:42px;margin-bottom:8px">🔧</span>
                    <span class="vendedor-btn-title reg-card-title" style="color:#f97316;font-size:22px;font-weight:900;display:block;">CONSERTOS</span>
                    <span class="vendedor-btn-desc" style="font-size:14px;color:var(--text-muted);margin-top:4px;">${dataManager.getOrdensAtivas().length} pendentes</span>
                </button>

                <button class="vendedor-btn reg-card" style="border-color:#F59E0B;background:rgba(245,158,11,0.08);padding:22px 16px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:16px;text-align:center;" onclick="UI._vendedorSimulador()">
                    <span class="vendedor-btn-icon reg-card-icon" style="font-size:42px;margin-bottom:8px">💳</span>
                    <span class="vendedor-btn-title reg-card-title" style="color:#F59E0B;font-size:22px;font-weight:900;display:block;">SIMULADOR</span>
                    <span class="vendedor-btn-desc" style="font-size:14px;color:var(--text-muted);margin-top:4px;">Ver quanto fica parcelado</span>
                </button>
                <button class="vendedor-btn reg-card" style="border-color:#3b82f6;background:rgba(59,130,246,0.08);padding:22px 16px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:16px;text-align:center;" onclick="UI.renderClientes()">
                    <span class="vendedor-btn-icon reg-card-icon" style="font-size:42px;margin-bottom:8px">👥</span>
                    <span class="vendedor-btn-title reg-card-title" style="color:#3b82f6;font-size:22px;font-weight:900;display:block;">CLIENTES</span>
                    <span class="vendedor-btn-desc" style="font-size:14px;color:var(--text-muted);margin-top:4px;">Cadastrados & Histórico</span>
                </button>
                <button class="vendedor-btn reg-card" style="border-color:#ef4444;background:rgba(239,68,68,0.08);padding:22px 16px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:16px;text-align:center;" onclick="UI._vendedorRegistrarGastoLoja()">
                    <span class="vendedor-btn-icon reg-card-icon" style="font-size:42px;margin-bottom:8px">💸</span>
                    <span class="vendedor-btn-title reg-card-title" style="color:#ef4444;font-size:22px;font-weight:900;display:block;">GASTO DA LOJA</span>
                    <span class="vendedor-btn-desc" style="font-size:14px;color:var(--text-muted);margin-top:4px;">Tirou dinheiro p/ comprar algo</span>
                </button>
                <button class="vendedor-btn reg-card" style="border-color:#f87171;background:rgba(239,68,68,0.12);padding:22px 16px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:16px;text-align:center;" onclick="UI._vendedorRegistrarFalta()">
                    <span class="vendedor-btn-icon reg-card-icon" style="font-size:42px;margin-bottom:8px">⚠️</span>
                    <span class="vendedor-btn-title reg-card-title" style="color:#f87171;font-size:22px;font-weight:900;display:block;">FALTOU PRODUTO</span>
                    <span class="vendedor-btn-desc" style="font-size:14px;color:var(--text-muted);margin-top:4px;">Cliente procurou e não tinha</span>
                </button>
            </div>
            
            ${UI._obterWidgetProdutosProcurados()}
            ${UI._obterWidgetChecklistDiario()}
            ${UI._obterWidgetBlocoNotas()}

            <div class="vendedor-footer" style="text-align:center;margin-top:20px">
                <button class="btn btn-ghost btn-lg" onclick="UI._vendedorAjuda()" style="font-size:18px">❓ Preciso de ajuda</button>
                <button class="btn btn-ghost" onclick="UI._sairTelaCheia()" style="font-size:15px;margin-top:8px;padding:10px 20px">← Voltar ao Sistema</button>
            </div>
        </div>`;
};

UI._obterWidgetMetaIlanna = function () {
    const totalVendasMes = (dataManager && typeof dataManager.calcularComissaoIlannaReal === 'function')
        ? dataManager.calcularComissaoIlannaReal()
        : (dataManager.data.comissaoIlannaMensal || 0);
    const meta = 2400;
    const percentual = Math.min(100, (totalVendasMes / meta) * 100);
    const excedente = Math.max(0, totalVendasMes - meta);
    const comissao = excedente * 0.1;
    
    let badge = '🌱 Bronze';
    let fraseMotivacional = '';
    
    if (totalVendasMes >= meta) {
        badge = '👑 Diamante';
        fraseMotivacional = `🏆 Meta Batida! <strong>Bônus de 10% ativo: <span style="color:#00d97e;font-weight:900;">${UI.R(comissao)}</span></strong> no bolso! 💎`;
    } else {
        const falta = meta - totalVendasMes;
        if (percentual >= 80) {
            badge = '🔥 Ouro';
            fraseMotivacional = `🎯 <strong>Nível Ouro!</strong> Só falta <strong style="color:#ffd700;">${UI.R(falta)}</strong> para liberar seus 10% extras!`;
        } else if (percentual >= 50) {
            badge = '⚔️ Prata';
            fraseMotivacional = `🚀 <strong>Nível Prata!</strong> Mais da metade batida. Falta <strong style="color:#39afd1;">${UI.R(falta)}</strong>!`;
        } else {
            badge = '🌱 Bronze';
            fraseMotivacional = `🌱 <strong>Nível Bronze.</strong> Falta <strong>${UI.R(falta)}</strong> para liberar comissão!`;
        }
    }
    
    return `
    <div style="margin: 15px auto 20px; padding: 16px; background: linear-gradient(135deg, rgba(20, 24, 38, 0.95) 0%, rgba(10, 14, 22, 0.95) 100%); border: 1px solid rgba(168,85,247,0.25); border-radius: 18px; box-shadow: 0 8px 30px rgba(0,0,0,0.6); max-width: 480px; text-align: left;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span style="font-family:'Space Grotesk',sans-serif;font-size:12px;color:var(--text-muted);font-weight:700;letter-spacing:1px;text-transform:uppercase;">🏆 Meta de Vendas</span>
            <span style="background:rgba(168,85,247,0.15);color:var(--accent-purple);font-size:11px;padding:3px 9px;border-radius:20px;font-weight:800;letter-spacing:0.5px;">${badge}</span>
        </div>
        
        <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:8px;">
            <span style="font-size:24px; font-weight:850; color:#FFFFFF; font-family:'Space Grotesk',sans-serif;">${UI.R(totalVendasMes)} <span style="font-size:12px;color:var(--text-muted);font-weight:400;font-family:inherit;">acumulado</span></span>
            <div style="text-align:right;">
                <div style="font-size:12px; color:var(--text-muted);">Alvo: <strong>${UI.R(meta)}</strong></div>
                <div style="font-size:10px; color:#00c8ff; font-weight:600; margin-top:3px; background:rgba(0,200,255,0.08); padding:2px 8px; border-radius:6px; display:inline-block;">📱 Cel: 3% | 🔧 Consertos & 🛒 Acessórios: lucro total</div>
            </div>
        </div>
        
        <div style="width:100%; height:12px; background:rgba(255,255,255,0.04); border-radius:6px; overflow:hidden; margin-bottom:10px; border:1px solid rgba(255,255,255,0.02);">
            <div class="barra-meta-ilanna" style="width:${percentual}%; height:100%; border-radius:6px; transition: width 0.5s ease;"></div>
        </div>
        
        <div style="font-size:12px; color:#FFFFFF; font-weight:600; line-height:1.4; margin-bottom:12px;">
            ${fraseMotivacional}
        </div>

        <button onclick="UI._verDashboardDesempenhoVendedor()" style="width:100%;background:linear-gradient(135deg, rgba(168,85,247,0.2), rgba(124,58,237,0.3));border:1px solid rgba(168,85,247,0.4);color:#c084fc;font-size:13px;font-weight:700;padding:10px 14px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.2s ease;">
            📊 Ver Gráfico Diário de Desempenho
        </button>
    </div>
    `;
};

// === 📊 DASHBOARD VISUAL DE DESEMPENHO MENSAL DA VENDEDORA (SUGESTÃO 3) ===
UI._verDashboardDesempenhoVendedor = function () {
    const totalVendasMes = (dataManager && typeof dataManager.calcularComissaoIlannaReal === 'function')
        ? dataManager.calcularComissaoIlannaReal()
        : (dataManager.data.comissaoIlannaMensal || 0);
    const meta = 2400;
    const percentual = Math.min(100, (totalVendasMes / meta) * 100);
    const excedente = Math.max(0, totalVendasMes - meta);
    const comissao = excedente * 0.1;


    const agora = new Date();
    const nomeMes = agora.toLocaleString('pt-BR', { month: 'long' }).toUpperCase();
    const ano = agora.getFullYear();
    const diaAtual = agora.getDate();
    const diasNoMes = new Date(ano, agora.getMonth() + 1, 0).getDate();

    const metaDiariaIdeal = meta / diasNoMes;
    const mediaVendaDiaria = totalVendasMes / Math.max(1, diaAtual);
    const projecaoFimMes = mediaVendaDiaria * diasNoMes;

    const htmlContent = `
    <div style="max-width:900px;margin:0 auto;padding:20px 10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
            <div>
                <span class="vendedor-step-badge" style="background:#a855f7">DASHBOARD</span>
                <h2 style="font-size:28px;color:#FFD700;margin-top:4px;">📊 DESEMPENHO DE VENDAS — ${nomeMes} / ${ano}</h2>
                <p style="font-size:16px;color:var(--text-muted);">Acompanhamento diário do Caixa Secundário e atingimento de Meta</p>
            </div>
            <button onclick="UI.renderVendedor()" class="btn btn-ghost" style="font-size:16px;">← Voltar ao Menu</button>
        </div>

        <!-- CARDS DE METRICAS CHAVE -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:14px;margin-bottom:24px;">
            <div style="background:rgba(20,24,38,0.9);border:1px solid rgba(168,85,247,0.3);border-radius:14px;padding:16px;text-align:center;">
                <div style="font-size:13px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">Caixa Secundário</div>
                <div style="font-size:28px;font-weight:900;color:#00d97e;margin:6px 0;">${UI.R(totalVendasMes)}</div>
                <div style="font-size:12px;color:var(--text-secondary);">${percentual.toFixed(1)}% da Meta (${UI.R(meta)})</div>
            </div>

            <div style="background:rgba(20,24,38,0.9);border:1px solid rgba(255,215,0,0.3);border-radius:14px;padding:16px;text-align:center;">
                <div style="font-size:13px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">Média Diária</div>
                <div style="font-size:28px;font-weight:900;color:#ffd700;margin:6px 0;">${UI.R(mediaVendaDiaria)}</div>
                <div style="font-size:12px;color:var(--text-secondary);">Meta ideal: ${UI.R(metaDiariaIdeal)}/dia</div>
            </div>

            <div style="background:rgba(20,24,38,0.9);border:1px solid rgba(59,130,246,0.3);border-radius:14px;padding:16px;text-align:center;">
                <div style="font-size:13px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">Projeção no Mês</div>
                <div style="font-size:28px;font-weight:900;color:#60a5fa;margin:6px 0;">${UI.R(projecaoFimMes)}</div>
                <div style="font-size:12px;color:${projecaoFimMes >= meta ? '#00d97e' : '#f59e0b'};">${projecaoFimMes >= meta ? '🚀 Projeção acerta meta!' : '⚠️ Precisa acelerar ritmo'}</div>
            </div>

            <div style="background:rgba(20,24,38,0.9);border:1px solid rgba(236,72,153,0.3);border-radius:14px;padding:16px;text-align:center;">
                <div style="font-size:13px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">Comissão Acumulada</div>
                <div style="font-size:28px;font-weight:900;color:${comissao > 0 ? '#00d97e' : '#ec4899'};margin:6px 0;">${UI.R(comissao)}</div>
                <div style="font-size:12px;color:var(--text-secondary);">${totalVendasMes >= meta ? '🎉 10% de bônus liberado!' : 'Liberada ao atingir R$ 2.400'}</div>
            </div>
        </div>

        <!-- CONTAINER DO GRAFICO DE BARRAS DIARIO -->
        <div style="background:rgba(15, 20, 32, 0.95);border:1px solid rgba(168,85,247,0.3);border-radius:18px;padding:20px;margin-bottom:24px;box-shadow:0 10px 30px rgba(0,0,0,0.5);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
                <h3 style="font-size:18px;color:#FFD700;margin:0;font-weight:800;">📈 VENDAS POR DIA DO MÊS (${nomeMes})</h3>
                <div style="font-size:12px;color:var(--text-muted);display:flex;gap:12px;align-items:center;">
                    <span>🟢 ≥ Meta Diária (${UI.R(metaDiariaIdeal)})</span>
                    <span>🟡 Em Progresso</span>
                </div>
            </div>
            
            <div id="container-grafico-vendedor" style="width:100%;height:260px;"></div>
            <div id="tooltip-grafico-vendedor" style="text-align:center;font-size:14px;color:#FFD700;margin-top:10px;min-height:22px;font-weight:bold;">Passe o mouse ou toque numa barra para ver os detalhes do dia</div>
        </div>

        <!-- ACOES DE RELATORIO -->
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
            <button onclick="UI._enviarRelatorioVendedorWhatsApp()" class="btn btn-primary btn-lg" style="background:#25D366;color:#000;font-weight:800;font-size:16px;">
                📱 Enviar Relatório no WhatsApp
            </button>
            <button onclick="UI.renderVendedor()" class="btn btn-ghost btn-lg" style="font-size:16px;">
                ← Voltar ao Menu
            </button>
        </div>
    </div>
    `;

    document.getElementById('main-content').innerHTML = _vndWrap('vender', htmlContent);

    setTimeout(() => {
        const container = document.getElementById('container-grafico-vendedor');
        if (container) UI._renderGraficoVendedorDiario(container, diasNoMes, diaAtual, totalVendasMes, metaDiariaIdeal);
    }, 100);
};

UI._renderGraficoVendedorDiario = function (container, diasNoMes, diaAtual, totalVendasMes, metaDiariaIdeal) {
    if (!container) return;

    const movs = dataManager.data.movimentacoesCaixa || [];
    const vendasHist = (dataManager.data.historico && dataManager.data.historico.vendas) || [];
    const vendasPorDia = {};
    for (let d = 1; d <= diasNoMes; d++) vendasPorDia[d] = 0;

    const ano = new Date().getFullYear();
    const mes = String(new Date().getMonth() + 1).padStart(2, '0');
    const prefixoMes = `${ano}-${mes}`;

    let encontrouMovs = false;
    movs.forEach(m => {
        if (m.data && m.data.startsWith(prefixoMes) && (m.caixa === 'caixaSecundario' || m.caixaDestino === 'caixaSecundario' || !m.caixaDestino) && m.tipo !== 'saida' && m.tipo !== 'zerado') {
            const diaStr = m.data.split('T')[0].split('-')[2];
            const diaNum = parseInt(diaStr, 10);
            if (diaNum >= 1 && diaNum <= diasNoMes) {
                vendasPorDia[diaNum] += (m.valor || m.valorVenda || 0);
                encontrouMovs = true;
            }
        }
    });

    vendasHist.forEach(v => {
        if (v.data && v.data.startsWith(prefixoMes) && (v.caixaDestino === 'caixaSecundario' || !v.caixaDestino)) {
            const diaStr = v.data.split('T')[0].split('-')[2];
            const diaNum = parseInt(diaStr, 10);
            if (diaNum >= 1 && diaNum <= diasNoMes) {
                const val = (v.valorVenda || v.valorBruto || v.liquido || 0);
                if (val > 0) {
                    vendasPorDia[diaNum] = Math.max(vendasPorDia[diaNum], val);
                    encontrouMovs = true;
                }
            }
        }
    });

    if (!encontrouMovs && totalVendasMes > 0) {
        const acumuladoPorDia = totalVendasMes / Math.max(1, diaAtual);
        for (let d = 1; d <= diaAtual; d++) {
            vendasPorDia[d] = Math.round(acumuladoPorDia * (0.8 + (d % 3) * 0.2) * 100) / 100;
        }
    }

    const valores = Object.values(vendasPorDia);
    const maxVal = Math.max(...valores, metaDiariaIdeal * 1.5, 100);

    let htmlBarras = `<div style="display:flex;align-items:flex-end;justify-content:space-between;height:200px;padding:10px 0;border-bottom:2px solid rgba(255,255,255,0.1);position:relative;">`;
    
    const pctMetaDiaria = Math.min(100, (metaDiariaIdeal / maxVal) * 100);
    htmlBarras += `<div style="position:absolute;bottom:${pctMetaDiaria}%;left:0;right:0;border-top:2px dashed #00d97e;opacity:0.6;z-index:2;pointer-events:none;"><span style="position:absolute;right:0;top:-18px;font-size:10px;color:#00d97e;font-weight:bold;background:rgba(0,0,0,0.7);padding:1px 4px;border-radius:4px;">Meta Diária: ${UI.R(metaDiariaIdeal)}</span></div>`;

    for (let d = 1; d <= diasNoMes; d++) {
        const val = vendasPorDia[d] || 0;
        const pctAltura = Math.min(100, Math.max(4, (val / maxVal) * 100));
        const ehHoje = d === diaAtual;
        const bateuMeta = val >= metaDiariaIdeal;
        
        let corBarra = 'rgba(255,255,255,0.1)';
        if (val > 0) {
            corBarra = bateuMeta ? 'linear-gradient(to top, #10b981, #00d97e)' : 'linear-gradient(to top, #f59e0b, #ffd700)';
        }

        htmlBarras += `
            <div style="flex:1;margin:0 1px;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end;cursor:pointer;"
                 onmouseover="document.getElementById('tooltip-grafico-vendedor').innerHTML='📅 Dia ${d}: <strong>${UI.R(val)}</strong> ${bateuMeta ? '✅ Meta Batida!' : ''}'"
                 onclick="document.getElementById('tooltip-grafico-vendedor').innerHTML='📅 Dia ${d}: <strong>${UI.R(val)}</strong> ${bateuMeta ? '✅ Meta Batida!' : ''}'">
                <div style="width:80%;max-width:16px;height:${pctAltura}%;background:${corBarra};border-radius:4px 4px 0 0;box-shadow:${ehHoje ? '0 0 10px #a855f7' : 'none'};border:${ehHoje ? '1px solid #fff' : 'none'};transition:all 0.3s ease;"></div>
                <span style="font-size:9px;color:${ehHoje ? '#FFD700' : 'var(--text-muted)'};margin-top:4px;font-weight:${ehHoje ? 'bold' : 'normal'}">${d}</span>
            </div>
        `;
    }

    htmlBarras += `</div>`;
    container.innerHTML = htmlBarras;
};

UI._enviarRelatorioVendedorWhatsApp = function () {
    const totalVendasMes = dataManager.data.comissaoIlannaMensal || 0;
    const meta = 2400;
    const percentual = Math.min(100, (totalVendasMes / meta) * 100);
    const excedente = Math.max(0, totalVendasMes - meta);
    const comissao = excedente * 0.1;

    const texto = `📊 *RELATÓRIO DE DESEMPENHO — METAS DE VENDAS*\n` +
        `🏪 Store: Cesinha Acessórios (Amargosa - BA)\n` +
        `----------------------------------------\n` +
        `💰 *Vendido no Mês (Caixa Secundário):* ${UI.R(totalVendasMes)}\n` +
        `🎯 *Meta Mensal:* ${UI.R(meta)}\n` +
        `📈 *Atingimento:* ${percentual.toFixed(1)}%\n` +
        `💵 *Comissão Acumulada:* ${UI.R(comissao)}\n` +
        `----------------------------------------\n` +
        `${totalVendasMes >= meta ? '🏆 META BATIDA COM SUCESSO! 🎉' : '🔥 Foco no objetivo para bater a meta!'}`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
};

// === DISPARO DE NOTA DE GARANTIA E COMPROVANTE DE OS VIA WHATSAPP (MODO VENDEDOR) ===
UI._gerarTextoGarantiaVenda = function (dados) {
    const agora = new Date();
    const dataHoraStr = agora.toLocaleDateString('pt-BR') + ' às ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const clienteNome = dados.cliente || (UI._clienteAtual ? UI._clienteAtual.nome : 'Cliente');
    const itensStr = dados.itens || dados.produto || 'Produtos Diversos';
    const valorStr = typeof dados.valor === 'number' ? UI.R(dados.valor) : dados.valor;
    const formaPagto = (dados.forma || 'À Vista / Cartão').toUpperCase().replace('CREDITO_', 'CRÉDITO ').replace('_', ' ');

    return `🧾 *COMPROVANTE DE COMPRA & NOTA DE GARANTIA*\n` +
        `🏪 *CESINHA ACESSÓRIOS — AMARGOSA-BA*\n` +
        `----------------------------------------\n` +
        `👤 *Cliente:* ${clienteNome}\n` +
        `📅 *Data da Compra:* ${dataHoraStr}\n` +
        `📦 *Item(ns):* ${itensStr}\n` +
        `💳 *Forma de Pagamento:* ${formaPagto}\n` +
        `💰 *Valor Total:* ${valorStr}\n` +
        `----------------------------------------\n` +
        `🛡️ *TERMO DE GARANTIA LEGAL:*\n` +
        `• Películas e Acessórios possuem garantia contra defeitos de fabricação.\n` +
        `• Aparelhos celulares contam com garantia legal de 90 dias conforme política da loja (não cobre danos por quedas, trincados ou umidade).\n` +
        `• Guarde este comprovante digital no seu WhatsApp para suporte e atendimento.\n` +
        `----------------------------------------\n` +
        `✨ *Agradecemos a sua preferência! Conte sempre com a Cesinha Acessórios!* 🚀📱`;
};

UI._enviarGarantiaVendaWhatsApp = function (dados) {
    dados = dados || {};
    const texto = UI._gerarTextoGarantiaVenda(dados);
    let tel = (dados.telefone || '').replace(/\D/g, '');
    if (!tel && UI._clienteAtual && UI._clienteAtual.telefone) {
        tel = UI._clienteAtual.telefone.replace(/\D/g, '');
    }
    
    if (!tel || tel.length < 8) {
        const telInput = prompt('Digite o WhatsApp do cliente para enviar a garantia (com DDD):', '');
        if (!telInput) {
            if (navigator.clipboard) navigator.clipboard.writeText(texto);
            return UI.toast('📋 Comprovante copiado para a área de transferência!', 'info');
        }
        tel = telInput.replace(/\D/g, '');
    }

    const telCompleto = tel.length <= 11 ? `55${tel}` : tel;
    const url = `https://api.whatsapp.com/send?phone=${telCompleto}&text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
};

UI._copiarGarantiaVenda = function (dados) {
    dados = dados || {};
    const texto = UI._gerarTextoGarantiaVenda(dados);
    if (navigator.clipboard) {
        navigator.clipboard.writeText(texto);
        UI.toast('📋 Nota de garantia copiada para a área de transferência!', 'success');
    }
};

UI._gerarTextoGarantiaOS = function (dados) {
    const agora = new Date();
    const dataHoraStr = agora.toLocaleDateString('pt-BR') + ' às ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const clienteNome = dados.cliente || 'Cliente';
    const osNum = String(dados.os || '001').padStart(3, '0');
    const modelo = dados.modelo || 'Smartphone';
    const servico = dados.servico || 'Manutenção Técnica';
    const valorTotal = typeof dados.preco === 'number' ? UI.R(dados.preco) : (typeof dados.valor === 'number' ? UI.R(dados.valor) : dados.valor);
    const entrada = dados.entrada ? (typeof dados.entrada === 'number' ? UI.R(dados.entrada) : dados.entrada) : 'R$ 0,00';
    const restante = dados.restante ? (typeof dados.restante === 'number' ? UI.R(dados.restante) : dados.restante) : valorTotal;
    const prazo = dados.prazo ? `${dados.prazo} dias` : 'A combinar';

    return `🔧 *COMPROVANTE DE ORDEM DE SERVIÇO (OS #${osNum})*\n` +
        `🏪 *CESINHA ACESSÓRIOS & ASSISTÊNCIA TÉCNICA*\n` +
        `----------------------------------------\n` +
        `👤 *Cliente:* ${clienteNome}\n` +
        `📅 *Data de Entrada:* ${dataHoraStr}\n` +
        `📱 *Aparelho:* ${modelo}\n` +
        `🛠️ *Serviço:* ${servico}\n` +
        `💰 *Valor Total do Serviço:* ${valorTotal}\n` +
        `💵 *Entrada Paga:* ${entrada}\n` +
        `⏳ *Restante na Retirada:* ${restante}\n` +
        `📅 *Previsão de Entrega:* ${prazo}\n` +
        `----------------------------------------\n` +
        `🛡️ *TERMO DE GARANTIA DA ASSISTÊNCIA:*\n` +
        `• Garantia de 90 dias sobre as peças trocadas e o serviço executado.\n` +
        `• A garantia não cobre danos decorrentes de quedas, trincados, pressão excessiva ou contato com líquidos.\n` +
        `• O aparelho é testado no ato da entrega juntamente com o cliente.\n` +
        `----------------------------------------\n` +
        `Dúvidas ou acompanhamento? Fale conosco diretamente por este WhatsApp! 🚀📱`;
};

UI._enviarGarantiaOSWhatsApp = function (dados) {
    dados = dados || {};
    const texto = UI._gerarTextoGarantiaOS(dados);
    let tel = (dados.telefone || '').replace(/\D/g, '');
    if (!tel && UI._consertoData && UI._consertoData.telefone) {
        tel = UI._consertoData.telefone.replace(/\D/g, '');
    }

    if (!tel || tel.length < 8) {
        const telInput = prompt('Digite o WhatsApp do cliente para enviar a OS (com DDD):', '');
        if (!telInput) {
            if (navigator.clipboard) navigator.clipboard.writeText(texto);
            return UI.toast('📋 Comprovante de OS copiado para a área de transferência!', 'info');
        }
        tel = telInput.replace(/\D/g, '');
    }

    const telCompleto = tel.length <= 11 ? `55${tel}` : tel;
    const url = `https://api.whatsapp.com/send?phone=${telCompleto}&text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
};

UI._copiarGarantiaOS = function (dados) {
    dados = dados || {};
    const texto = UI._gerarTextoGarantiaOS(dados);
    if (navigator.clipboard) {
        navigator.clipboard.writeText(texto);
        UI.toast('📋 Comprovante de OS copiado para a área de transferência!', 'success');
    }
};

// === FLUXO VENDER — AGORA COM IDENTIFICAÇÃO DO CLIENTE (Correções 2+3) ===
UI._vendedorVender = function () {
    UI._vendedorCarrinho = [];
    UI._identificarCliente('vender', function (cliente) { UI._vendedorVenderProdutos(cliente); });
};

UI._vendedorVenderProdutos = function (cliente) {
    const celulares = dataManager.getEstoqueCelulares();
    const acessorios = dataManager.getEstoqueAcessorios();

    // Carrinho de múltiplos produtos
    if (!UI._vendedorCarrinho) UI._vendedorCarrinho = [];

    const renderResultadosBusca = (filtro) => {
        if (!filtro || filtro.length < 1) return '<p style="text-align:center;color:var(--text-muted);padding:20px;font-size:18px">🔍 Digite o nome do produto para buscar no estoque...</p>';

        const f = filtro.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const termos = f.split(/\s+/).filter(t => t.length > 0);

        const matchProd = (p) => {
            const txt = `${p.nome} ${p.condicao || ''} ${p.tipo || ''} ${p.capacidade || ''} ${p.cor || ''}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            return termos.every(t => txt.includes(t));
        };

        const isDisponivel = p => (p.status === undefined || p.status === 'disponivel') && (p.quantidade === undefined || p.quantidade > 0);
        const celEncontrados = celulares.filter(isDisponivel).filter(matchProd);
        const aceEncontrados = acessorios.filter(isDisponivel).filter(p => p.tipo !== 'equipamento_loja').filter(matchProd);
        const todos = [...celEncontrados.map(p => ({...p, _tipo: 'cel'})), ...aceEncontrados.map(p => ({...p, _tipo: 'acess'}))];

        if (todos.length === 0) return '<p style="text-align:center;color:var(--accent-red);padding:20px;font-size:18px">❌ Nenhum produto encontrado com esse nome</p>';

        let html = `<div style="font-size:14px;color:var(--text-muted);margin-bottom:8px">${todos.length} produto(s) encontrado(s)</div>`;
        todos.forEach(p => {
            const jaNoCarrinho = UI._vendedorCarrinho.some(c => String(c.id) === String(p.id));
            const qtd = p.quantidade || 1;
            const dias = dataManager.diasNoEstoque ? dataManager.diasNoEstoque(p) : 0;
            html += `<div style="padding:14px 16px;background:${jaNoCarrinho ? 'rgba(16,185,129,0.15)' : 'var(--card-bg)'};border:1px solid ${jaNoCarrinho ? '#10b981' : 'var(--border-color)'};border-radius:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;transition:all 0.15s" onclick="UI._adicionarAoCarrinho('${p.id}','${p._tipo}')">
                <div>
                    <div style="font-size:18px;font-weight:700">${p._tipo === 'cel' ? '📱' : '🎧'} ${p.nome}</div>
                    <div style="font-size:14px;color:var(--text-muted)">${p.condicao || p.tipo || ''} | Qtd: ${qtd}${dias > 0 ? ' | ' + dias + ' dias' : ''}</div>
                </div>
                <div style="text-align:right">
                    <div style="font-size:20px;font-weight:800;color:var(--accent-green)">${UI.R(p.precoVenda)}</div>
                    <span style="font-size:14px;font-weight:700;color:${jaNoCarrinho ? '#10b981' : 'var(--accent-cyan)'}">${jaNoCarrinho ? '✅ NO CARRINHO' : '+ ADICIONAR'}</span>
                </div>
            </div>`;
        });
        return html;
    };

    const renderCarrinho = () => {
        if (UI._vendedorCarrinho.length === 0) return '';
        const totalCarrinho = UI._vendedorCarrinho.reduce((s, c) => s + (c.precoVenda || 0), 0);
        let html = `<div style="background:rgba(16,185,129,0.08);border:2px solid #10b981;border-radius:14px;padding:16px;margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <h3 style="font-size:20px;color:#10b981;margin:0">🛒 CARRINHO (${UI._vendedorCarrinho.length} ${UI._vendedorCarrinho.length === 1 ? 'item' : 'itens'})</h3>
                <div style="font-size:22px;font-weight:900;color:var(--accent-green)">${UI.R(totalCarrinho)}</div>
            </div>`;
        UI._vendedorCarrinho.forEach((item, idx) => {
            html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
                <div style="font-size:16px">${item._tipo === 'cel' ? '📱' : '🎧'} ${item.nome}</div>
                <div style="display:flex;align-items:center;gap:10px">
                    <span style="font-size:16px;font-weight:700;color:var(--accent-green)">${UI.R(item.precoVenda)}</span>
                    <button class="btn btn-sm" style="background:rgba(239,68,68,0.15);color:#ef4444;font-size:14px;padding:4px 8px" onclick="UI._removerDoCarrinho(${idx})">✕</button>
                </div>
            </div>`;
        });
        html += `<div style="margin-top:12px;text-align:center">
            <button class="btn btn-primary btn-lg" style="font-size:20px;padding:14px 32px;width:100%;background:linear-gradient(135deg, #10b981, #059669)" onclick="UI._venderCarrinhoCompleto()">✅ VENDER TUDO — ${UI.R(totalCarrinho)}</button>
        </div></div>`;
        return html;
    };

    document.getElementById('main-content').innerHTML = _vndWrap('vender', `
        <div class="vendedor-step-header"><span class="vendedor-step-badge">PASSO 2 DE 5</span><h2 style="font-size:28px">💰 FAZER UMA VENDA</h2><p style="font-size:20px">Cliente: <strong>${cliente.nome}</strong> — Digite o produto para buscar</p></div>
        
        <div id="vnd-carrinho-area">${renderCarrinho()}</div>
        
        <div class="vendedor-busca"><input class="form-input vendedor-input-busca" id="vnd-busca" placeholder="🔍 Digite o nome do produto (ex: iPhone, fone, capinha...)" style="font-size:20px;padding:16px" oninput="UI._vendedorFiltrarMulti()" autofocus></div>
        <div id="vnd-lista">${renderResultadosBusca('')}</div>
        
        <div style="margin-top: 24px; text-align: center; border-top: 1px solid var(--border-color); padding-top: 24px;">
             <button class="vendedor-btn" style="border-color:#14b8a6;background:rgba(20, 184, 166, 0.08);padding:20px; width:100%; max-width:600px; display:inline-flex; align-items:center; gap:16px; justify-content:center" onclick="UI._vendedorAvulso()">
                 <span style="font-size:36px">📦</span>
                 <div style="text-align:left">
                     <div style="color:#14b8a6;font-size:22px;font-weight:800">PRODUTO NÃO ESTÁ NO ESTOQUE?</div>
                     <div style="font-size:16px;color:var(--text-main)">Vender capinha, película ou outro item que não foi cadastrado</div>
                 </div>
             </button>
        </div>
        
        <div class="vendedor-footer"><button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI._vendedorCarrinho=[];UI.renderVendedor()">← Voltar ao Menu</button></div>`);

    UI._vendedorFiltrarMulti = () => {
        document.getElementById('vnd-lista').innerHTML = renderResultadosBusca(document.getElementById('vnd-busca')?.value || '');
    };

    UI._adicionarAoCarrinho = (id, tipo) => {
        const lista = tipo === 'acess' ? dataManager.data.estoqueAcessorios : dataManager.data.estoqueCelulares;
        const prod = lista.find(p => String(p.id) === String(id));
        if (!prod) return UI.toast('Produto não encontrado', 'error');

        const jaNo = UI._vendedorCarrinho.findIndex(c => String(c.id) === String(id));
        if (jaNo >= 0) {
            UI._vendedorCarrinho.splice(jaNo, 1);
            UI.toast(`➖ ${prod.nome} removido do carrinho`, 'info');
        } else {
            UI._vendedorCarrinho.push({...prod, _tipo: tipo});
            UI.toast(`✅ ${prod.nome} adicionado ao carrinho!`, 'success');
        }

        document.getElementById('vnd-carrinho-area').innerHTML = renderCarrinho();
        UI._vendedorFiltrarMulti();
    };

    UI._removerDoCarrinho = (idx) => {
        const item = UI._vendedorCarrinho[idx];
        UI._vendedorCarrinho.splice(idx, 1);
        UI.toast(`➖ ${item?.nome || 'Item'} removido do carrinho`, 'info');
        document.getElementById('vnd-carrinho-area').innerHTML = renderCarrinho();
        UI._vendedorFiltrarMulti();
    };

    UI._venderCarrinhoCompleto = () => {
        if (UI._vendedorCarrinho.length === 0) return UI.toast('Carrinho vazio!', 'error');
        if (UI._vendedorCarrinho.length === 1 && UI._vendedorCarrinho[0]._tipo !== 'avulso') {
            // Venda de produto único - fluxo original com tela de desconto
            const item = UI._vendedorCarrinho[0];
            UI._vendedorCarrinho = [];
            UI._vendedorPasso2(item.id, item._tipo);
        } else {
            // Venda múltipla ou avulso único - vai direto pro pagamento
            const totalCarrinho = UI._vendedorCarrinho.reduce((s, c) => s + (c.precoVenda || 0), 0);
            const nomesItens = UI._vendedorCarrinho.map(c => c.nome).join(' + ');
            UI._vendedorDados = {
                prodId: null,
                prod: { nome: nomesItens, precoVenda: totalCarrinho, custo: UI._vendedorCarrinho.reduce((s, c) => s + (c.custo || 0), 0), condicao: `${UI._vendedorCarrinho.length} itens`, tipo: 'multi' },
                desconto: 0,
                precoFinal: totalCarrinho,
                tipo: 'multi',
                _itensCarrinho: [...UI._vendedorCarrinho]
            };
            UI._vendedorCarrinho = [];
            UI._vendedorPasso3Multi();
        }
    };

    setTimeout(() => { const el = document.getElementById('vnd-busca'); if (el) el.focus(); }, 150);
};

// Passo 3 para venda multi-produto (pagamento direto)
UI._vendedorPasso3Multi = function () {
    const d = UI._vendedorDados; if (!d) return;
    const precoFinal = d.precoFinal;

    document.getElementById('main-content').innerHTML = _vndWrap('vender', `
        <div class="vendedor-step-header"><span class="vendedor-step-badge">PAGAMENTO</span><h2 style="font-size:28px">💰 COMO O CLIENTE VAI PAGAR?</h2>
            <p style="font-size:18px">${d._itensCarrinho.length} itens — Total: <strong style="color:var(--accent-green);font-size:24px">${UI.R(precoFinal)}</strong></p>
            <div style="margin-top:8px;font-size:14px;color:var(--text-muted)">${d._itensCarrinho.map(i => i.nome).join(' • ')}</div>
        </div>
        <div class="vendedor-grid-pag">
            <button class="vendedor-btn-pag" style="padding:20px" onclick="UI._vndConfirmarMulti('dinheiro',${precoFinal})">
                <span class="vendedor-btn-icon" style="font-size:36px">💵</span><span class="vendedor-btn-title" style="font-size:22px;font-weight:800">DINHEIRO</span>
                <span class="vendedor-btn-valor" style="font-size:20px">${UI.R(precoFinal)}</span>
            </button>
            <button class="vendedor-btn-pag" style="padding:20px" onclick="UI._vndConfirmarMulti('pix',${precoFinal})">
                <span class="vendedor-btn-icon" style="font-size:36px">💠</span><span class="vendedor-btn-title" style="font-size:22px;font-weight:800">PIX</span>
                <span class="vendedor-btn-valor" style="font-size:20px">${UI.R(precoFinal)}</span>
            </button>
            <button class="vendedor-btn-pag" style="padding:20px" onclick="UI._vndConfirmarMulti('debito',${precoFinal})">
                <span class="vendedor-btn-icon" style="font-size:36px">💳</span><span class="vendedor-btn-title" style="font-size:22px;font-weight:800">DÉBITO</span>
                <span class="vendedor-btn-valor" style="font-size:20px">${UI.R(precoFinal)}</span>
            </button>
            <button class="vendedor-btn-pag" style="padding:20px" onclick="UI._vndCartaoMulti(${precoFinal})">
                <span class="vendedor-btn-icon" style="font-size:36px">💳</span><span class="vendedor-btn-title" style="font-size:22px;font-weight:800">CRÉDITO</span>
                <span class="vendedor-btn-desc" style="font-size:16px">À vista ou até 18x</span>
            </button>
            <button class="vendedor-btn-pag vendedor-btn-pag-wide" style="padding:20px;background:rgba(255,215,0,0.1);border-color:rgba(255,215,0,0.3)" onclick="UI._vndDividirPagamento(true, ${precoFinal})">
                <span class="vendedor-btn-icon" style="font-size:36px">🔀</span><span class="vendedor-btn-title" style="font-size:22px;font-weight:800;color:#FFD700">DIVIDIR PAGAMENTO</span>
                <span class="vendedor-btn-valor" style="font-size:16px;color:#FFD700">Pagar com duas formas</span>
            </button>
        </div>
        <div class="vendedor-nav"><button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI._vendedorVenderProdutos(UI._clienteAtual || {nome:'Consumidor Geral'})">← Voltar</button></div>`);
};

UI._vndCartaoMulti = function (p) {
    const d = UI._vendedorDados; if (!d) return;
    const juros_mensal = 0.0199;
    let html = `<div class="vendedor-step-header"><span class="vendedor-step-badge">PAGAMENTO</span><h2 style="font-size:28px">💳 CARTÃO CRÉDITO</h2><p style="font-size:20px">Total da Compra: ${UI.R(p)}</p></div>`;
    html += '<div class="vendedor-parcelas-lista">';
    html += `<label class="vendedor-radio-parcela" style="font-size:18px;padding:14px" onclick="UI._vndConfirmarMulti('credito_1x',${p})"><input type="radio" name="vnd-parc-multi"><span class="vendedor-parcela-label" style="font-size:18px;font-weight:700">Crédito 1x (À vista)</span><span style="font-size:18px">Cliente paga: ${UI.R(p)}</span></label>`;
    for (let i = 2; i <= 18; i++) {
        const clientePaga = p * Math.pow(1 + juros_mensal, i);
        const jurosValor = clientePaga - p;
        const parcVal = clientePaga / i;
        html += `<label class="vendedor-radio-parcela" style="font-size:16px;padding:12px" onclick="UI._vndConfirmarMulti('credito_${i}x',${clientePaga.toFixed(2)})"><input type="radio" name="vnd-parc-multi"><span class="vendedor-parcela-label" style="font-size:18px;font-weight:700">${i}x de ${UI.R(parcVal)}</span><span style="font-size:16px">Total: ${UI.R(clientePaga)} — Juros: ${UI.R(jurosValor)}</span></label>`;
    }
    html += '</div>';
    html += `<div class="vendedor-nav"><button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI._vendedorPasso3Multi()">← Voltar</button></div>`;
    document.getElementById('main-content').innerHTML = _vndWrap('vender', html);
};

UI._vndConfirmarMulti = function (forma, valorCliente) {
    const d = UI._vendedorDados; if (!d || !d._itensCarrinho) return;
    const taxas = dataManager.data.taxasCartao;

    if (!dataManager.isModoTreino()) {
        let valorLiq = valorCliente;
        let cDest = 'caixaPrincipal';

        if (forma === 'pix') valorLiq = valorCliente * (1 - taxas.pix / 100);
        else if (forma === 'debito') valorLiq = valorCliente * (1 - taxas.debito / 100);
        else if (forma.startsWith('credito')) {
            const tax = taxas[forma.replace('credito_', '')] || taxas.credito || 2.91;
            valorLiq = valorCliente * (1 - tax / 100);
        }
        else if (forma === 'dinheiro') {
            cDest = 'caixaSecundario'; // Multi-pagamento normalmente vai pro caixa principal do dia
        }

        const arrayPags = [{ forma: forma, valor: valorLiq, caixa: cDest }];
        dataManager.venderCarrinho(d._itensCarrinho, arrayPags, UI._clienteAtual ? UI._clienteAtual.nome : '');
    }

    UI._tocarSomCaixa();
    const nomeCliente = UI._clienteAtual ? UI._clienteAtual.nome : 'Cliente';
    const pontosGanhos = Math.floor(valorCliente / 10);

    // Fidelidade e notificação já estão dentro de venderCarrinho?
    const itensNomes = (d._itensCarrinho || []).map(i => i.nome).join(', ');
    const telCliente = UI._clienteAtual ? (UI._clienteAtual.telefone || '') : '';

    document.getElementById('main-content').innerHTML = _vndWrap('vender', `
        <div style="text-align:center;padding:40px 0">
            <div style="font-size:72px;margin-bottom:16px">🎉</div>
            <h2 style="font-size:28px;font-weight:800;color:var(--accent-green)">VENDA REALIZADA!</h2>
            <p style="font-size:18px;margin:10px 0;color:var(--text-muted)">${d._itensCarrinho.length} produtos vendidos</p>
            <div style="margin:12px 0;font-size:14px;color:var(--text-muted)">${d._itensCarrinho.map(i => i.nome).join(' • ')}</div>
            <p style="font-size:36px;font-weight:900;color:var(--accent-green)">${UI.R(valorCliente)}</p>
            <p style="color:var(--text-muted);font-size:18px">${forma.toUpperCase()}</p>
            <div style="margin-top:16px;padding:12px 20px;background:rgba(245,158,11,0.1);border-radius:12px;display:inline-block">
                <p style="font-size:18px;color:var(--accent-yellow)">🎁 <strong>${nomeCliente}</strong> ganhou: <strong>${pontosGanhos} pontos</strong> de fidelidade!</p>
            </div>
            
            <div style="margin-top:24px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
                <button class="btn btn-lg" style="background:#25D366;color:#FFF;font-weight:800;font-size:16px;padding:14px 22px;border-radius:12px;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 15px rgba(37,211,102,0.3);" onclick="UI._enviarGarantiaVendaWhatsApp({cliente:'${nomeCliente.replace(/'/g, "\\'")}', telefone:'${telCliente}', itens:'${itensNomes.replace(/'/g, "\\'")}', valor:${valorCliente}, forma:'${forma}'})">
                    📲 Enviar Nota de Garantia no WhatsApp
                </button>
                <button class="btn btn-lg btn-ghost" style="font-size:15px;padding:14px 18px;border-radius:12px;" onclick="UI._copiarGarantiaVenda({cliente:'${nomeCliente.replace(/'/g, "\\'")}', telefone:'${telCliente}', itens:'${itensNomes.replace(/'/g, "\\'")}', valor:${valorCliente}, forma:'${forma}'})">
                    📋 Copiar Nota
                </button>
            </div>

            ${dataManager.isModoTreino() ? '<div class="vendedor-treino-badge" style="margin-top:16px;font-size:16px">🎓 MODO TREINO — Nada foi salvo</div>' : ''}
        </div>
        <div class="vendedor-nav">
            <button class="btn btn-primary btn-lg" style="font-size:20px" onclick="UI._vendedorVender()">Nova Venda</button>
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI.renderVendedor()">Voltar ao Menu</button>
        </div>`);
};

UI._vendedorPasso2 = function (prodId, tipo) {
    tipo = tipo || 'cel';
    const lista = tipo === 'acess' ? dataManager.data.estoqueAcessorios : dataManager.data.estoqueCelulares;
    const prod = lista.find(p => String(p.id) === String(prodId));
    if (!prod) return UI.toast('Produto não encontrado', 'error');
    const dias = dataManager.diasNoEstoque ? dataManager.diasNoEstoque(prod) : 0;
    const descontoSug = dias > 60 ? prod.precoVenda * 0.08 : dias > 30 ? prod.precoVenda * 0.05 : 0;
    UI._vendedorDados = { prodId, prod, desconto: 0, tipo };
    document.getElementById('main-content').innerHTML = _vndWrap('vender', `
        <div class="vendedor-step-header"><span class="vendedor-step-badge">PASSO 2 DE 4</span><h2 style="font-size:28px">💰 DESCONTO</h2></div>
        <div class="vendedor-card-destaque" style="text-align:center;padding:20px">
            <h3 style="font-size:22px">${prod.nome}</h3>
            <div style="font-size:32px;font-weight:900;color:var(--accent-green);margin:8px 0">${UI.R(prod.precoVenda)}</div>
            <div style="color:var(--text-muted);font-size:16px">${prod.condicao || prod.tipo || ''}${dias > 0 ? ' | ' + dias + ' dias na loja' : ''}</div>
        </div>
        <div class="vendedor-section"><h3 style="font-size:22px">VAI DAR DESCONTO?</h3>
            <div class="vendedor-opcoes-desc">
                <label class="vendedor-radio-card" style="font-size:18px;padding:14px" onclick="document.getElementById('vnd-desc-area').style.display='none';UI._vendedorDados.desconto=0;UI._vndPreco()"><input type="radio" name="vnd-desc" checked> Não — vender por ${UI.R(prod.precoVenda)}</label>
                <label class="vendedor-radio-card" style="font-size:18px;padding:14px" onclick="document.getElementById('vnd-desc-area').style.display='block'"><input type="radio" name="vnd-desc"> Sim — vou dar desconto</label>
            </div>
            <div id="vnd-desc-area" style="display:none;margin-top:12px">
                <input class="form-input" id="vnd-desconto" type="number" step="10" value="0" style="font-size:24px;font-weight:700;text-align:center;padding:14px" oninput="UI._vendedorDados.desconto=parseFloat(this.value)||0;UI._vndPreco()">
                <div id="vnd-preco-final" style="margin-top:8px;font-size:22px;font-weight:700;text-align:center"></div>
                ${descontoSug > 0 ? `<div class="vendedor-dica" style="font-size:16px">💡 Sugestão: até R$ ${descontoSug.toFixed(0)} de desconto (${dias} dias parado)</div>` : ''}
            </div>
        </div>
        <div class="vendedor-nav">
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI._vendedorVenderProdutos(UI._clienteAtual || {nome:'Consumidor Geral'})">← Voltar</button>
            <button class="btn btn-primary btn-lg" style="font-size:20px;padding:14px 28px" onclick="UI._vendedorPasso3()">Próximo →</button>
        </div>`);
    UI._vndPreco = () => { const el = document.getElementById('vnd-preco-final'); if (el) el.textContent = 'Preço final: ' + UI.R(prod.precoVenda - UI._vendedorDados.desconto); };
};

UI._vendedorPasso3 = function () {
    const d = UI._vendedorDados; if (!d) return;
    const precoFinal = d.prod.precoVenda - d.desconto;
    d.precoFinal = precoFinal;
    const dias = dataManager.diasNoEstoque ? dataManager.diasNoEstoque(d.prod) : 0;
    const margem = d.prod.custo > 0 ? ((precoFinal - d.prod.custo) / precoFinal * 100) : 100;
    // Bug 6: Desconto AVISA mas não bloqueia — vendedor decide
    if (d.desconto > 0 && d.prod.custo > 0 && margem < 15) {
        const precoMinimo = d.prod.custo / (1 - 15 / 100);
        const descontoMax = d.prod.precoVenda - precoMinimo;
        const continuar = confirm(`⚠️ ATENÇÃO!\n\nDesconto muito alto!\n\nPreço: ${UI.R(d.prod.precoVenda)}\nDesconto: ${UI.R(d.desconto)}\nMargem: ${margem.toFixed(1)}%\n\nMargem recomendada: Mínimo 15%\nDesconto máximo sugerido: ${UI.R(descontoMax)}\n\nDeseja continuar mesmo assim?`);
        if (!continuar) return;
    }
    d._absorver = dias > 60 && margem > 35;

    document.getElementById('main-content').innerHTML = _vndWrap('vender', `
        <div class="vendedor-step-header"><span class="vendedor-step-badge">PASSO 3 DE 4</span><h2 style="font-size:28px">💰 COMO O CLIENTE VAI PAGAR?</h2><p style="font-size:20px">${d.prod.nome} — ${UI.R(precoFinal)}</p></div>
        <div class="vendedor-grid-pag">
            <button class="vendedor-btn-pag" style="padding:20px" onclick="UI._vndConfirmar('dinheiro',${precoFinal})">
                <span class="vendedor-btn-icon" style="font-size:36px">💵</span><span class="vendedor-btn-title" style="font-size:22px;font-weight:800">DINHEIRO</span>
                <span class="vendedor-btn-valor" style="font-size:20px">${UI.R(precoFinal)}</span>
            </button>
            <button class="vendedor-btn-pag" style="padding:20px" onclick="UI._vndConfirmar('pix',${precoFinal})">
                <span class="vendedor-btn-icon" style="font-size:36px">📱</span><span class="vendedor-btn-title" style="font-size:22px;font-weight:800">PIX</span>
                <span class="vendedor-btn-valor" style="font-size:20px">${UI.R(precoFinal)}</span>
            </button>
            <button class="vendedor-btn-pag" style="padding:20px" onclick="UI._vndConfirmar('debito',${precoFinal})">
                <span class="vendedor-btn-icon" style="font-size:36px">💳</span><span class="vendedor-btn-title" style="font-size:22px;font-weight:800">DÉBITO</span>
                <span class="vendedor-btn-valor" style="font-size:20px">${UI.R(precoFinal)}</span>
            </button>
            <button class="vendedor-btn-pag" style="padding:20px" onclick="UI._vndCartao()">
                <span class="vendedor-btn-icon" style="font-size:36px">💳</span><span class="vendedor-btn-title" style="font-size:22px;font-weight:800">CRÉDITO</span>
                <span class="vendedor-btn-desc" style="font-size:16px">À vista ou até 18x</span>
            </button>
            <button class="vendedor-btn-pag vendedor-btn-pag-wide" style="padding:20px;background:rgba(255,215,0,0.1);border-color:rgba(255,215,0,0.3)" onclick="UI._vndDividirPagamento(false, ${precoFinal})">
                <span class="vendedor-btn-icon" style="font-size:36px">🔀</span><span class="vendedor-btn-title" style="font-size:22px;font-weight:800;color:#FFD700">DIVIDIR PAGAMENTO</span>
                <span class="vendedor-btn-valor" style="font-size:16px;color:#FFD700">Pagar com duas formas</span>
            </button>
        </div>
        <div class="vendedor-nav"><button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI._vendedorPasso2('${d.prodId}','${d.tipo}')">← Voltar</button></div>`);
};

// Cartão até 18x — mostra só o que o CLIENTE paga
UI._vndCartao = function () {
    const d = UI._vendedorDados; if (!d) return;
    const p = d.precoFinal, taxas = dataManager.data.taxasCartao;
    const juros_mensal = 0.0199;
    let html = `<div class="vendedor-step-header"><span class="vendedor-step-badge">PASSO 3 DE 4</span><h2 style="font-size:28px">💳 CARTÃO — ${d.prod.nome}</h2><p style="font-size:20px">Valor: ${UI.R(p)}</p></div>`;
    html += '<div class="vendedor-parcelas-lista">';
    html += `<label class="vendedor-radio-parcela" style="font-size:18px;padding:14px" onclick="UI._vndConfirmar('debito',${p})"><input type="radio" name="vnd-parc"><span class="vendedor-parcela-label" style="font-size:18px;font-weight:700">Débito</span><span style="font-size:18px">Cliente paga: ${UI.R(p)}</span></label>`;
    html += `<label class="vendedor-radio-parcela" style="font-size:18px;padding:14px" onclick="UI._vndConfirmar('credito_1x',${p})"><input type="radio" name="vnd-parc"><span class="vendedor-parcela-label" style="font-size:18px;font-weight:700">Crédito 1x</span><span style="font-size:18px">Cliente paga: ${UI.R(p)}</span></label>`;
    for (let i = 2; i <= 18; i++) {
        let clientePaga, jurosLabel;
        if (d._absorver && i <= 3) {
            clientePaga = p;
            jurosLabel = '✅ SEM JUROS';
        } else {
            clientePaga = p * Math.pow(1 + juros_mensal, i);
            const jurosValor = clientePaga - p;
            jurosLabel = `Juros: ${UI.R(jurosValor)}`;
        }
        const parcVal = clientePaga / i;
        html += `<label class="vendedor-radio-parcela" style="font-size:16px;padding:12px" onclick="UI._vndConfirmar('credito_${i}x',${clientePaga.toFixed(2)})"><input type="radio" name="vnd-parc"><span class="vendedor-parcela-label" style="font-size:18px;font-weight:700">${i}x de ${UI.R(parcVal)}</span><span style="font-size:16px">Total: ${UI.R(clientePaga)} — ${jurosLabel}</span></label>`;
    }
    html += '</div>';
    if (d._absorver) html += '<div class="vendedor-dica" style="font-size:18px">💡 Este produto pode ser vendido em até 3x sem juros!</div>';
    html += `<div class="vendedor-nav"><button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI._vendedorPasso3()">← Voltar</button></div>`;
    document.getElementById('main-content').innerHTML = _vndWrap('vender', html);
};

// Confirmar — SEM mostrar custo/lucro/margem
UI._vndConfirmar = function (forma, valorCliente) {
    const d = UI._vendedorDados; if (!d) return;
    document.getElementById('main-content').innerHTML = _vndWrap('vender', `
        <div class="vendedor-step-header"><span class="vendedor-step-badge">PASSO 4 DE 4</span><h2 style="font-size:28px">✅ CONFIRMAR VENDA</h2></div>
        <div class="vendedor-card-destaque" style="padding:20px">
            <div class="vendedor-confirma-row" style="font-size:20px"><span>Produto:</span><strong>${d.prod.nome}</strong></div>
            <div class="vendedor-confirma-row" style="font-size:20px"><span>Condição:</span><span>${d.prod.condicao || d.prod.tipo || ''}</span></div>
            <div class="vendedor-confirma-row" style="font-size:20px"><span>Pagamento:</span><span>${forma.replace('credito_', '').replace('_', ' ').toUpperCase()}</span></div>
            ${d.desconto > 0 ? `<div class="vendedor-confirma-row" style="font-size:20px"><span>Desconto:</span><span style="color:var(--accent-red)">-${UI.R(d.desconto)}</span></div>` : ''}
            
            <div style="margin-top:16px;background:rgba(0,0,0,0.25);padding:16px;border-radius:12px;border:1px solid rgba(255,255,255,0.1)">
                <div style="font-weight:800;font-size:16px;color:#FFD700;margin-bottom:12px;text-align:center;">📦 SELECIONE O CAIXA DE DESTINO DA VENDA:</div>
                
                <input type="hidden" id="vnd-caixa-destino" value="caixaPrincipal">

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <button type="button" id="btn-caixa-principal" class="btn" onclick="UI._selecionarCaixaDestinoVenda('caixaPrincipal')" style="padding:16px 10px;font-size:16px;font-weight:900;background:linear-gradient(135deg, #10b981 0%, #059669 100%);color:#FFF;border:2px solid #34d399;box-shadow:0 0 15px rgba(16,185,129,0.4);border-radius:12px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;">
                        <span style="font-size:24px;">🏪</span>
                        <span>CAIXA PRINCIPAL</span>
                        <span style="font-size:11px;opacity:0.9;font-weight:bold;">(Loja / Balcão)</span>
                    </button>
                    
                    <button type="button" id="btn-caixa-fogos" class="btn" onclick="UI._selecionarCaixaDestinoVenda('caixaFogos')" style="padding:16px 10px;font-size:16px;font-weight:800;background:rgba(255,182,92,0.1);color:#FFB65C;border:2px solid rgba(255,182,92,0.3);border-radius:12px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;opacity:0.7;">
                        <span style="font-size:24px;">🎇</span>
                        <span>CAIXA DE FOGOS</span>
                        <span style="font-size:11px;opacity:0.9;font-weight:bold;">(Venda de Fogos)</span>
                    </button>
                </div>
            </div>

            <hr style="border-color:var(--border-color);margin:14px 0">
            <div style="text-align:center;font-size:32px;font-weight:900;color:var(--accent-green);margin:12px 0">
                CLIENTE PAGA: ${UI.R(valorCliente)}
            </div>
        </div>
        <div class="vendedor-nav">
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI._vendedorPasso3()">← Voltar</button>
            <button class="btn btn-primary btn-xl" style="font-size:22px;padding:16px 32px" onclick="UI._vndFinalizar('${forma}',${valorCliente})">✅ CONFIRMAR VENDA</button>
        </div>`);
};

UI._selecionarCaixaDestinoVenda = function (caixa) {
    const inp = document.getElementById('vnd-caixa-destino');
    const btnPrincipal = document.getElementById('btn-caixa-principal');
    const btnFogos = document.getElementById('btn-caixa-fogos');
    if (inp) inp.value = caixa;

    if (caixa === 'caixaPrincipal') {
        if (btnPrincipal) {
            btnPrincipal.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            btnPrincipal.style.color = '#FFF';
            btnPrincipal.style.border = '2px solid #34d399';
            btnPrincipal.style.boxShadow = '0 0 15px rgba(16,185,129,0.4)';
            btnPrincipal.style.opacity = '1';
        }
        if (btnFogos) {
            btnFogos.style.background = 'rgba(255,182,92,0.1)';
            btnFogos.style.color = '#FFB65C';
            btnFogos.style.border = '2px solid rgba(255,182,92,0.3)';
            btnFogos.style.boxShadow = 'none';
            btnFogos.style.opacity = '0.5';
        }
    } else {
        if (btnFogos) {
            btnFogos.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            btnFogos.style.color = '#FFF';
            btnFogos.style.border = '2px solid #fbbf24';
            btnFogos.style.boxShadow = '0 0 15px rgba(245,158,11,0.4)';
            btnFogos.style.opacity = '1';
        }
        if (btnPrincipal) {
            btnPrincipal.style.background = 'rgba(16,185,129,0.1)';
            btnPrincipal.style.color = '#34d399';
            btnPrincipal.style.border = '2px solid rgba(16,185,129,0.3)';
            btnPrincipal.style.boxShadow = 'none';
            btnPrincipal.style.opacity = '0.5';
        }
    }
};

UI._vndDividirPagamento = function (isMulti, precoFinal) {
    const d = UI._vendedorDados; if (!d) return;

    window._updateSplitCalc = function() {
        const v1 = parseFloat(document.getElementById('split-val1').value) || 0;
        const v2 = parseFloat(document.getElementById('split-val2').value) || 0;
        const sum = v1 + v2;
        const elTotal = document.getElementById('split-total-sum');
        const elBtn = document.getElementById('btn-confirmar-split');
        elTotal.textContent = UI.R(sum);
        if (Math.abs(sum - precoFinal) < 0.01) {
            elTotal.style.color = 'var(--accent-green)';
            elBtn.disabled = false;
        } else {
            elTotal.style.color = 'var(--accent-red)';
            elBtn.disabled = true;
        }
    };
    
    document.getElementById('main-content').innerHTML = _vndWrap('vender', `
        <div class="vendedor-step-header"><span class="vendedor-step-badge">DIVISÃO DE PAGAMENTO</span><h2 style="font-size:28px">🔀 PAGAR EM DUAS FORMAS</h2>
            <p style="font-size:18px">Total da Venda: <strong style="color:var(--accent-green);font-size:24px">${UI.R(precoFinal)}</strong></p>
        </div>
        <div style="background:rgba(255,255,255,0.05);padding:24px;border-radius:12px;margin:20px 0;display:grid;gap:20px">
            
            <div style="display:flex;gap:16px;align-items:flex-end">
                <div style="flex:1">
                    <label style="display:block;margin-bottom:8px;font-size:16px">Forma 1:</label>
                    <select id="split-forma1" class="form-input" style="font-size:18px;padding:12px;background:#2a2a35">
                        <option value="dinheiro">💵 Dinheiro</option>
                        <option value="pix">💠 PIX</option>
                        <option value="debito">💳 Débito</option>
                        <option value="credito_1x">💳 Crédito 1x</option>
                    </select>
                </div>
                <div style="flex:1">
                    <label style="display:block;margin-bottom:8px;font-size:16px">Valor (R$):</label>
                    <input type="number" id="split-val1" class="form-input" style="font-size:18px;padding:12px" step="0.01" value="${(precoFinal/2).toFixed(2)}" oninput="_updateSplitCalc()">
                </div>
            </div>

            <div style="display:flex;gap:16px;align-items:flex-end">
                <div style="flex:1">
                    <label style="display:block;margin-bottom:8px;font-size:16px">Forma 2:</label>
                    <select id="split-forma2" class="form-input" style="font-size:18px;padding:12px;background:#2a2a35">
                        <option value="pix" selected>💠 PIX</option>
                        <option value="dinheiro">💵 Dinheiro</option>
                        <option value="debito">💳 Débito</option>
                        <option value="credito_1x">💳 Crédito 1x</option>
                    </select>
                </div>
                <div style="flex:1">
                    <label style="display:block;margin-bottom:8px;font-size:16px">Valor (R$):</label>
                    <input type="number" id="split-val2" class="form-input" style="font-size:18px;padding:12px" step="0.01" value="${(precoFinal/2).toFixed(2)}" oninput="_updateSplitCalc()">
                </div>
            </div>

            <div style="text-align:right;font-size:20px;margin-top:10px">
                Soma: <strong id="split-total-sum" style="color:var(--accent-green)">${UI.R(precoFinal)}</strong>
            </div>
        </div>

        <div style="text-align:center;margin-top:20px">
            <button id="btn-confirmar-split" class="btn btn-primary btn-xl" style="padding:16px 32px;font-size:20px;width:100%" onclick="UI._vndConfirmarDivisao(${isMulti}, ${precoFinal})">✅ REGISTRAR PAGAMENTO DIVIDIDO</button>
        </div>
        <div class="vendedor-nav"><button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="${isMulti ? 'UI._vendedorPasso3Multi()' : 'UI._vendedorPasso3()'}">← Voltar</button></div>
    `);
    window._updateSplitCalc();
};

UI._vndConfirmarDivisao = function (isMulti, precoFinal) {
    const d = UI._vendedorDados; if (!d) return;
    const f1 = document.getElementById('split-forma1').value;
    const v1 = parseFloat(document.getElementById('split-val1').value) || 0;
    const f2 = document.getElementById('split-forma2').value;
    const v2 = parseFloat(document.getElementById('split-val2').value) || 0;

    if (Math.abs(v1 + v2 - precoFinal) > 0.01) {
        return UI.toast('A soma dos valores deve ser igual ao total da venda!', 'error');
    }

    const pagamentos = [
        { forma: f1, valorBruto: v1 },
        { forma: f2, valorBruto: v2 }
    ];

    // Calcula taxas e define caixa destino (Dinheiro = caixaSecundario/caixaFogos, outros = caixaPrincipal)
    const taxas = dataManager.data.taxasCartao;
    const arrayPags = pagamentos.map(p => {
        let valorLiq = p.valorBruto;
        let cDest = 'caixaPrincipal';
        
        if (p.forma === 'pix') valorLiq = p.valorBruto * (1 - taxas.pix / 100);
        else if (p.forma === 'debito') valorLiq = p.valorBruto * (1 - taxas.debito / 100);
        else if (p.forma.startsWith('credito')) {
            const tax = taxas[p.forma.replace('credito_', '')] || taxas.credito || 2.91;
            valorLiq = p.valorBruto * (1 - tax / 100);
        }
        else if (p.forma === 'dinheiro') {
            cDest = d.tipo === 'fogos' ? 'caixaFogos' : 'caixaSecundario';
        }

        return { forma: p.forma, valor: valorLiq, caixa: cDest };
    });

    if (!dataManager.isModoTreino()) {
        if (isMulti) {
            dataManager.venderCarrinho(d._itensCarrinho, arrayPags, UI._clienteAtual ? UI._clienteAtual.nome : '');
        } else {
            // Se for single, a gente empacota num array e chama venderCarrinho tbm
            const itemUnico = { id: d.prodId, nome: d.prod.nome, _tipo: d.tipo, precoVenda: d.prod.precoVenda, precoFinal: d.precoFinal };
            dataManager.venderCarrinho([itemUnico], arrayPags, UI._clienteAtual ? UI._clienteAtual.nome : '');
        }
    }

    const nomeCliente = UI._clienteAtual ? (UI._clienteAtual.nome || 'Cliente') : 'Cliente';
    const telCliente = UI._clienteAtual ? (UI._clienteAtual.telefone || '') : '';
    const itensVendidos = isMulti ? ((d._itensCarrinho || []).map(i => i.nome).join(', ')) : (d.prod?.nome || 'Produto');

    UI._clienteAtual = null;
    UI._vendedorCarrinho = [];
    document.getElementById('main-content').innerHTML = _vndWrap('vender', `
        <div style="text-align:center;padding:40px 20px">
            <div style="font-size:72px;margin-bottom:16px">✅</div>
            <h2 style="font-size:28px;font-weight:800;color:var(--accent-green)">VENDA REALIZADA (PAGAMENTO DIVIDIDO)!</h2>
            <p style="font-size:20px;margin:8px 0;color:var(--text-muted)">${itensVendidos}</p>
            <p style="font-size:32px;font-weight:900;color:var(--accent-green)">${UI.R(precoFinal)}</p>

            <div style="margin-top:24px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
                <button class="btn btn-lg" style="background:#25D366;color:#FFF;font-weight:800;font-size:16px;padding:14px 22px;border-radius:12px;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 15px rgba(37,211,102,0.3);" onclick="UI._enviarGarantiaVendaWhatsApp({cliente:'${nomeCliente.replace(/'/g, "\\'")}', telefone:'${telCliente}', itens:'${itensVendidos.replace(/'/g, "\\'")}', valor:${precoFinal}, forma:'Pagamento Dividido'})">
                    📲 Enviar Nota de Garantia no WhatsApp
                </button>
                <button class="btn btn-lg btn-ghost" style="font-size:15px;padding:14px 18px;border-radius:12px;" onclick="UI._copiarGarantiaVenda({cliente:'${nomeCliente.replace(/'/g, "\\'")}', telefone:'${telCliente}', itens:'${itensVendidos.replace(/'/g, "\\'")}', valor:${precoFinal}, forma:'Pagamento Dividido'})">
                    📋 Copiar Nota
                </button>
            </div>

            <div class="vendedor-nav" style="margin-top:30px;">
                <button class="btn btn-primary btn-lg" style="font-size:20px" onclick="UI._vendedorVender()">Nova Venda</button>
                <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI.renderVendedor()">Voltar ao Menu</button>
            </div>
        </div>`);
};

UI._vndFinalizar = function (forma, valorCliente) {
    const d = UI._vendedorDados; if (!d) return;
    const caixaSelecionado = document.getElementById('vnd-caixa-destino')?.value || 'caixaPrincipal';
    const caixaEfetivo = caixaSelecionado === 'caixaFogos' ? 'caixaFogos' : (forma === 'dinheiro' ? 'caixaSecundario' : 'caixaPrincipal');
    const taxas = dataManager.data.taxasCartao;
    let valorRecebido = valorCliente;
    if (forma === 'pix') valorRecebido = d.precoFinal;
    else if (forma === 'debito') valorRecebido = d.precoFinal;
    else if (forma.startsWith('credito')) {
        const parcelas = forma === 'credito_1x' ? 'credito' : forma.replace('credito_', '');
        const taxa = taxas[parcelas] || taxas.credito || 2.91;
        valorRecebido = d.precoFinal;
    }
    if (!dataManager.isModoTreino()) {
        const nomeCli = UI._clienteAtual ? UI._clienteAtual.nome : '';
        // Verificar se é acessório ou celular
        if (d.tipo === 'acess') {
            if (typeof dataManager.venderAcessorio === 'function') {
                dataManager.venderAcessorio(d.prodId, valorRecebido, nomeCli, caixaEfetivo);
            }
        } else {
            if (caixaSelecionado === 'caixaFogos' || forma === 'dinheiro') {
                if (typeof dataManager.venderAVista === 'function') {
                    dataManager.venderAVista(d.prodId, valorRecebido, nomeCli, caixaEfetivo);
                }
            } else if (forma === 'pix') {
                if (typeof dataManager.venderParcelado === 'function') {
                    dataManager.venderParcelado(d.prodId, valorRecebido, 1, 'pix', nomeCli);
                }
            } else if (forma === 'debito') {
                if (typeof dataManager.venderParcelado === 'function') {
                    dataManager.venderParcelado(d.prodId, valorRecebido, 0, 'normal', nomeCli);
                }
            } else if (forma.startsWith('credito')) {
                const numParc = parseInt(forma.replace('credito_', '').replace('x', '')) || 1;
                if (typeof dataManager.venderParcelado === 'function') {
                    dataManager.venderParcelado(d.prodId, valorCliente, numParc, 'normal', nomeCli);
                }
            }
        }
        // Fidelidade: Adicionar pontos
        if (typeof UI._adicionarPontosFidelidade === 'function') {
            UI._adicionarPontosFidelidade(valorCliente);
        }
    }
    UI._tocarSomCaixa();
    // Calcular pontos de fidelidade
    const pontosGanhos = Math.floor(valorCliente / 10);
    const nomeCliente = UI._clienteAtual ? UI._clienteAtual.nome : 'Cliente';
    // Adicionar pontos ao cliente
    if (UI._clienteAtual && !dataManager.isModoTreino()) {
        UI._clienteAtual.score = (UI._clienteAtual.score || 0) + pontosGanhos;
        if (!UI._clienteAtual.historico) UI._clienteAtual.historico = [];
        UI._clienteAtual.historico.push({ tipo: 'compra', data: new Date().toISOString().split('T')[0], produto: d.prod.nome, valor: valorCliente, pontos: pontosGanhos });
        dataManager.saveData();
    }

    // --- LOGICA DE COMBO / UP-SELL (MELHORIA 4) ---
    let comboHtml = '';
    if (d.tipo !== 'acess' && d.prod && d.prod.nome) {
        const nomeCelular = d.prod.nome.toLowerCase();
        const todosAcessorios = dataManager.getEstoqueAcessorios();
        
        // Filtra acessórios específicos baseados nos termos do celular
        const termos = nomeCelular.split(/\s+/).filter(t => t.length > 2 && t !== 'azul' && t !== 'preto' && t !== 'vitrine' && t !== 'novo' && t !== 'cinza');
        let especificos = todosAcessorios.filter(ac => {
            const nomeAc = ac.nome.toLowerCase();
            return termos.some(termo => nomeAc.includes(termo));
        }).slice(0, 3);

        // Se tiver poucos específicos, puxa genéricos (fone, cabo, etc.)
        if (especificos.length < 3) {
            const genericos = todosAcessorios.filter(ac => {
                const nomeAc = ac.nome.toLowerCase();
                const ehGenerico = nomeAc.includes('fone') || nomeAc.includes('cabo') || nomeAc.includes('carregador') || nomeAc.includes('película') || nomeAc.includes('capinha');
                const jaAdicionado = especificos.some(e => e.id === ac.id);
                return ehGenerico && !jaAdicionado;
            }).slice(0, 3 - especificos.length);
            especificos = especificos.concat(genericos);
        }

        if (especificos.length > 0) {
            comboHtml = `
            <div style="margin-top:25px;padding:16px;background:rgba(255,215,0,0.05);border:1px dashed rgba(255,215,0,0.25);border-radius:16px;text-align:left;max-width:480px;margin-left:auto;margin-right:auto;">
                <h4 style="font-family:'Space Grotesk',sans-serif;color:var(--accent-yellow);margin-bottom:10px;font-size:14px;font-weight:700;">💡 OFERECER COMBO (Estoque Disponível):</h4>
                <div style="display:grid;gap:8px;">
                    ${especificos.map(ac => `
                        <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.02);padding:8px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.04)">
                            <div style="flex:1;padding-right:8px;">
                                <span style="font-weight:600;font-size:13px;color:#FFFFFF;display:block;line-height:1.2;">${ac.nome}</span>
                                <span style="font-size:11px;color:var(--text-muted)">Preço: ${UI.R(ac.precoVenda)}</span>
                            </div>
                            <button class="btn btn-success btn-xs" onclick="UI._vendedorAdicionarAcessorioAoCombo('${ac.id}')" style="padding:4px 8px;font-size:11px;font-weight:bold;height:28px;">+ Oferecer</button>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }
    }

    const telCliente = UI._clienteAtual ? (UI._clienteAtual.telefone || '') : '';
    const nomeProd = d.prod?.nome || 'Produto';

    document.getElementById('main-content').innerHTML = _vndWrap('vender', `
        <div style="text-align:center;padding:40px 0">
            <div style="font-size:72px;margin-bottom:16px">🎉</div>
            <h2 style="font-size:28px;font-weight:800;color:var(--accent-green)">VENDA REALIZADA!</h2>
            <p style="font-size:22px;margin:10px 0">${nomeProd}</p>
            <p style="font-size:36px;font-weight:900;color:var(--accent-green)">${UI.R(valorCliente)}</p>
            <p style="color:var(--text-muted);font-size:18px">${forma.replace('credito_', '').replace('_', ' ').toUpperCase()}</p>
            <div style="margin-top:16px;padding:12px 20px;background:rgba(245,158,11,0.1);border-radius:12px;display:inline-block">
                <p style="font-size:18px;color:var(--accent-yellow)">🎁 <strong>${nomeCliente}</strong> ganhou: <strong>${pontosGanhos} pontos</strong> de fidelidade!</p>
            </div>

            <div style="margin-top:24px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
                <button class="btn btn-lg" style="background:#25D366;color:#FFF;font-weight:800;font-size:16px;padding:14px 22px;border-radius:12px;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 15px rgba(37,211,102,0.3);" onclick="UI._enviarGarantiaVendaWhatsApp({cliente:'${nomeCliente.replace(/'/g, "\\'")}', telefone:'${telCliente}', produto:'${nomeProd.replace(/'/g, "\\'")}', valor:${valorCliente}, forma:'${forma}'})">
                    📲 Enviar Nota de Garantia no WhatsApp
                </button>
                <button class="btn btn-lg btn-ghost" style="font-size:15px;padding:14px 18px;border-radius:12px;" onclick="UI._copiarGarantiaVenda({cliente:'${nomeCliente.replace(/'/g, "\\'")}', telefone:'${telCliente}', produto:'${nomeProd.replace(/'/g, "\\'")}', valor:${valorCliente}, forma:'${forma}'})">
                    📋 Copiar Nota
                </button>
            </div>

            ${dataManager.isModoTreino() ? '<div class="vendedor-treino-badge" style="margin-top:16px;font-size:16px">🎓 MODO TREINO — Nada foi salvo</div>' : ''}
            ${comboHtml}
        </div>
        <div class="vendedor-nav">
            <button class="btn btn-primary btn-lg" style="font-size:20px" onclick="UI._vendedorVender()">Nova Venda</button>
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI.renderVendedor()">Voltar ao Menu</button>
        </div>`);
};

UI._vendedorAdicionarAcessorioAoCombo = function (acessorioId) {
    const ac = dataManager.data.estoqueAcessorios.find(item => String(item.id) === String(acessorioId));
    if (!ac) return;
    UI._vendedorDados = {
        tipo: 'acess',
        prodId: ac.id,
        prod: ac,
        precoOriginal: ac.precoVenda,
        desconto: 0,
        precoFinal: ac.precoVenda
    };
    UI._vendedorPasso3();
};

UI._tocarSomCaixa = function () {
    try { const ctx = new AudioContext(), o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.setValueAtTime(800, ctx.currentTime); o.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1); g.gain.setValueAtTime(0.3, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3); o.start(); o.stop(ctx.currentTime + 0.3); } catch (e) { }
};

// ==========================================
// FLUXO DE CONSERTO - MODO VENDEDOR (SIMPLIFICADO)
// ==========================================
UI._vendedorConserto = function () {
    document.getElementById('main-content').innerHTML = _vndWrap('conserto', `
        <div class="vendedor-step-header">
            <span class="vendedor-step-badge">ORÇAMENTO RÁPIDO</span>
            <h2 style="font-size:28px">🔧 QUAL O MODELO DO CELULAR?</h2>
        </div>
        <div class="vendedor-busca" style="margin-bottom: 24px;">
            <input class="form-input vendedor-input-busca" id="vnd-busca-conserto" placeholder="Ex: iPhone 11, A54..." style="font-size:24px;padding:20px" oninput="UI._filtrarModelosConserto()">
        </div>
        <div id="vnd-lista-modelos" class="vendedor-grid-wrap" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
        </div>
        
        <div class="vendedor-nav" style="margin-top: 40px;">
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI.renderVendedor()">← Voltar ao Menu</button>
        </div>
    `);

    // Focar no campo de busca assim que a tela abrir
    setTimeout(() => {
        const input = document.getElementById('vnd-busca-conserto');
        if (input) input.focus();
    }, 100);

    UI._filtrarModelosConserto('');
};

UI._filtrarModelosConserto = function (filtroForcado) {
    const inputStr = filtroForcado !== undefined ? filtroForcado : (document.getElementById('vnd-busca-conserto')?.value || '').toLowerCase();
    const tabela = dataManager.data.tabelaServicosModelo;
    const chaves = Object.keys(tabela);

    let html = '';

    // Sempre reordena para manter coerência visual (ou poderia só filtrar)
    chaves.sort();

    let encontrou = 0;
    for (const modelo of chaves) {
        if (inputStr && !modelo.includes(inputStr)) continue;

        encontrou++;

        // Determina ícone baseado na marca (simplificado)
        let icone = '📱';
        if (modelo.includes('iphone')) icone = '🍎';
        else if (modelo.includes('samsung')) icone = '🌌';
        else if (modelo.includes('moto')) icone = 'Ⓜ️';
        else if (modelo.includes('xiaomi') || modelo.includes('redmi') || modelo.includes('poco')) icone = '🟠';

        // Pega o menor preço pra botar de isca ("A partir de X")
        const servicos = tabela[modelo];
        let menorPreco = 9999;
        for (let s in servicos) {
            if (servicos[s].p < menorPreco) menorPreco = servicos[s].p;
        }

        const precoStr = menorPreco !== 9999 ? `A partir de ${UI.R(menorPreco)}` : 'Consultar';

        html += `
        <div class="vendedor-radio-card" style="padding: 20px; text-align: left; display: flex; align-items: center; justify-content: space-between;" onclick="UI._vendedorServicos('${modelo}')">
            <div>
                <div style="font-size: 22px; font-weight: bold; text-transform: capitalize;">${icone} ${modelo}</div>
                <div style="font-size: 16px; color: var(--text-muted); margin-top: 4px;">${precoStr}</div>
            </div>
            <div style="font-size: 24px; color: var(--accent-blue);">→</div>
        </div>`;

        if (encontrou > 30 && !inputStr) {
            // Se não tem filtro, limitar pra não travar a tela
            break;
        }
    }

    if (inputStr) {
        html = `
        <div class="vendedor-radio-card" style="padding: 20px; text-align: left; display: flex; align-items: center; justify-content: space-between; border: 2px solid var(--accent-blue);" onclick="UI._vendedorServicos('${inputStr.replace(/'/g, "\\'")}')">
            <div>
                <div style="font-size: 22px; font-weight: bold; color: var(--accent-blue); text-transform: capitalize;">➕ Orçamento para: ${inputStr}</div>
                <div style="font-size: 16px; color: var(--text-muted); margin-top: 4px;">Clique para prosseguir com este modelo</div>
            </div>
            <div style="font-size: 24px; color: var(--accent-blue);">→</div>
        </div>` + html;
    } else if (encontrou === 0) {
        html = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted); font-size: 18px;">Digite o nome do modelo acima para criar um orçamento direto.</div>';
    }

    const div = document.getElementById('vnd-lista-modelos');
    if (div) div.innerHTML = html;
};

UI._vendedorServicos = function (modeloStr) {
    let servicosObj = dataManager.data.tabelaServicosModelo[modeloStr];
    if (!servicosObj) {
        // Fallback dinâmico para modelos novos ou customizados
        servicosObj = {
            'tela': { p: 180, d: 1 },
            'bateria': { p: 120, d: 1 },
            'conector': { p: 90, d: 1 },
            'software': { p: 70, d: 1 }
        };
    }

    // Dicionário de nomes amigáveis para serviços (sem ramificação de qualidades)
    const nomesAmigaveis = {
        'tela': '📱 Troca de Tela',
        'bateria': '🔋 Troca de Bateria',
        'conector': '🔌 Conector de Carga',
        'camera': '📸 Câmera',
        'camera_traseira': '📸 Câmera Traseira',
        'botao_home': '🔘 Botão Home / Biometria',
        'software': '💻 Software / Formatação'
    };

    let htmlServicos = '';

    for (const key of Object.keys(servicosObj)) {
        if (key === 'telaOriginal' || key === 'tela2aLinha') continue; // Omitir duplicatas de qualidade
        const dados = servicosObj[key];
        const nomeLabel = nomesAmigaveis[key] || key.replace('_', ' ').toUpperCase();

        htmlServicos += `
        <div class="vendedor-produto-item" style="padding:20px; flex-direction: column; align-items: stretch; gap: 16px;" onclick="UI._vendedorConfirmarConserto('${modeloStr}', '${key}', ${dados.p}, ${dados.d})">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div class="vendedor-produto-nome" style="font-size:22px">${nomeLabel}</div>
                <div class="vendedor-produto-preco" style="font-size:24px; font-weight:900">${UI.R(dados.p)}</div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 16px; color: var(--text-muted);">
                <span>Aproximadamente ${dados.d} dias úteis</span>
                <span class="vendedor-produto-btn" style="font-size:16px;font-weight:700; background: var(--accent-blue);">CRIAR OS →</span>
            </div>
        </div>`;
    }

    document.getElementById('main-content').innerHTML = _vndWrap('conserto', `
        <div class="vendedor-step-header">
            <span class="vendedor-step-badge" style="background: var(--accent-blue)">ORÇAMENTO</span>
            <h2 style="font-size:28px; text-transform: capitalize;">${modeloStr}</h2>
            <p style="font-size:20px">Selecione o serviço para este aparelho</p>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 16px; max-width: 800px; margin: 0 auto;">
            ${htmlServicos}
        </div>
        
        <div class="vendedor-nav" style="margin-top: 40px;">
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI._vendedorConserto()">← Outro Modelo</button>
        </div>
    `);
};

UI._vendedorConfirmarConserto = function (modelo, servicoCodi, valorBruto, diasPrevisao) {
    // Injetar os dados na variável global do vendedor pra reutilizar o fluxo de pagamento
    const nomesAmigaveis = {
        'tela': 'Troca de Tela',
        'bateria': 'Troca de Bateria', 'conector': 'Conector de Carga',
        'camera': 'Câmera', 'camera_traseira': 'Câmera Traseira', 'botao_home': 'Botão', 'software': 'Software'
    };
    const desc = `Conserto ${nomesAmigaveis[servicoCodi] || servicoCodi} - ${modelo}`;

    UI._vendedorDados = {
        prodId: 'OS_' + Date.now(),
        tipo: 'conserto',
        prod: { nome: desc, precoVenda: valorBruto, tipo: 'servico', dias: diasPrevisao },
        desconto: 0,
        precoFinal: valorBruto
    };

    document.getElementById('main-content').innerHTML = _vndWrap('conserto', `
        <div class="vendedor-step-header">
            <span class="vendedor-step-badge" style="background: var(--accent-blue)">NOVA OS</span>
            <h2 style="font-size:28px">📝 INFORMAR CLIENTE</h2>
        </div>
        
        <div class="vendedor-card-destaque" style="max-width: 600px; margin: 0 auto; padding: 30px; border-color: var(--accent-blue);">
            <div style="font-size: 20px; color: var(--text-muted); margin-bottom: 8px;">Serviço:</div>
            <div style="font-size: 28px; font-weight: bold; margin-bottom: 20px; text-transform: capitalize;">${desc}</div>
            
            <div style="font-size: 20px; color: var(--text-muted); margin-bottom: 8px;">Valor do Orçamento:</div>
            <div id="valorOrcamentoDisplay" style="font-size: 40px; font-weight: 900; color: var(--accent-green); margin-bottom: 16px;">${UI.R(valorBruto)}</div>
            
            <!-- CORREÇÃO 6: Campo manual de preço -->
            <div style="margin-top: 10px; padding: 16px; background: rgba(255, 165, 0, 0.1); border: 1px solid rgba(255, 165, 0, 0.3); border-radius: 12px;">
                <p style="color: #FFD700; font-size: 14px; margin-bottom: 10px;">⚠️ Preço automático incorreto?</p>
                <label style="color: #FFD700; font-size: 12px; text-transform: uppercase;">Digite o preço correto:</label>
                <input type="text" id="precoManualConserto" placeholder="R$ 0,00" oninput="UI._atualizarPrecoManualConserto(${valorBruto})" style="width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 215, 0, 0.3); border-radius: 8px; color: #FFF; margin-top: 5px; font-size: 18px;">
                <p style="color: rgba(255, 255, 255, 0.5); font-size: 11px; margin-top: 5px;">Deixe vazio para usar o preço automático</p>
            </div>
            
            <div style="background: rgba(59, 130, 246, 0.1); padding: 16px; border-radius: 8px; border-left: 4px solid var(--accent-blue); text-align: left; margin-top: 16px;">
                <div style="font-size: 18px; font-weight: bold; color: var(--accent-blue); margin-bottom: 4px;">⏱️ Prazo Estimado</div>
                <div style="font-size: 16px; color: var(--text-main);">${diasPrevisao} dias úteis (depende do técnico)</div>
            </div>
        </div>
        
        <!-- CORREÇÃO 8: Botões de ação -->
        <div style="max-width: 600px; margin: 30px auto 0; display: flex; gap: 15px;">
            <button onclick="UI.navigate('assistencia'); setTimeout(() => UI.novaOS(), 100);" style="flex: 1; padding: 20px; background: linear-gradient(135deg, #50C878, #3CB371); color: #FFF; font-size: 18px; font-weight: 700; border: none; border-radius: 16px; cursor: pointer;">
                ✅ CLIENTE ACEITOU
            </button>
            <button onclick="UI._salvarOrcamento('${modelo}', '${servicoCodi}', ${valorBruto})" style="flex: 1; padding: 20px; background: rgba(255, 165, 0, 0.2); border: 2px solid #FFA500; color: #FFA500; font-size: 18px; font-weight: 700; border-radius: 16px; cursor: pointer;">
                📋 SÓ ORÇAMENTO
            </button>
        </div>
        
        <div class="vendedor-nav" style="margin-top: 40px;">
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI._vendedorServicos('${modelo}')">← Voltar</button>
        </div>
    `);
};

// CORREÇÃO 6: Atualizar preço manual do conserto
UI._atualizarPrecoManualConserto = function (precoAuto) {
    const manualInput = document.getElementById('precoManualConserto');
    const display = document.getElementById('valorOrcamentoDisplay');
    if (!manualInput || !display) return;
    const val = parseFloat(manualInput.value.replace(/[^\d,]/g, '').replace(',', '.'));
    if (val && val > 0) {
        display.textContent = UI.R(val);
        if (UI._vendedorDados) {
            UI._vendedorDados.precoFinal = val;
            UI._vendedorDados.prod.precoVenda = val;
        }
    } else {
        display.textContent = UI.R(precoAuto);
        if (UI._vendedorDados) {
            UI._vendedorDados.precoFinal = precoAuto;
            UI._vendedorDados.prod.precoVenda = precoAuto;
        }
    }
};

// CORREÇÃO 8+3: Salvar orçamento usando dados do cliente já identificado
UI._salvarOrcamento = function (modelo, servico, valor) {
    const precoManual = document.getElementById('precoManualConserto')?.value;
    const valorFinal = (precoManual && parseFloat(precoManual.replace(/[^\d,]/g, '').replace(',', '.')) > 0)
        ? parseFloat(precoManual.replace(/[^\d,]/g, '').replace(',', '.'))
        : valor;

    // Usa dados do cliente atual (já identificado no passo anterior) ou padroniza Consumidor Geral
    let nomeCliente = UI._clienteAtual ? UI._clienteAtual.nome : 'Consumidor Geral';
    let telefoneCliente = UI._clienteAtual ? UI._clienteAtual.telefone : '';

    if (!dataManager.isModoTreino()) {
        // Se já tem cliente, adiciona ao histórico
        if (UI._clienteAtual) {
            UI._clienteAtual.score = (UI._clienteAtual.score || 0) + 10;
            if (!UI._clienteAtual.historico) UI._clienteAtual.historico = [];
            UI._clienteAtual.historico.push({
                tipo: 'orcamento_conserto',
                data: new Date().toISOString().split('T')[0],
                aparelho: modelo, servico: servico,
                valor: valorFinal, status: 'nao_finalizou'
            });
        } else {
            dataManager.data.clientes.push({
                nome: nomeCliente, telefone: telefoneCliente,
                cpf: '', nascimento: '',
                endereco: { rua: '', numero: '', complemento: '', bairro: '', cidade: 'Amargosa', uf: 'BA', cep: '' },
                email: '', instagram: '', comoConheceu: '', observacoes: '',
                dataCadastro: new Date().toISOString().split('T')[0],
                motivo_visita: 'Orçamento de conserto',
                status: 'orcamento_nao_finalizado',
                score: 10, parcelasEmDia: 0, parcelasAtrasadas: 0, crediariosQuitados: 0,
                historico: [{
                    tipo: 'orcamento_conserto', data: new Date().toISOString().split('T')[0],
                    aparelho: modelo, servico: servico, valor: valorFinal, status: 'nao_finalizou'
                }]
            });
        }
        dataManager.saveData();
    }

    // Tela de confirmação bonita (sem alert)
    document.getElementById('main-content').innerHTML = _vndWrap('conserto', `
        <div style="text-align:center;padding:40px 0">
            <div style="font-size:56px">✅</div>
            <h2 style="color:var(--accent-yellow);font-size:28px">ORÇAMENTO SALVO!</h2>
            <div class="vendedor-card-destaque" style="text-align:left;margin-top:16px;padding:20px;max-width:500px;margin-left:auto;margin-right:auto">
                <p style="font-size:18px">Cliente: <strong>${nomeCliente}</strong></p>
                <p style="font-size:18px">Telefone: ${telefoneCliente || 'não informado'}</p>
                <p style="font-size:18px">Serviço: <strong>${servico}</strong> — ${modelo}</p>
                <p style="font-size:24px;font-weight:900;color:var(--accent-green);margin-top:10px">Valor: ${UI.R(valorFinal)}</p>
            </div>
            <p style="font-size:16px;color:var(--text-muted);margin-top:16px">Dados salvos. Você pode ver na aba "Clientes" quando precisar.</p>
            <div style="margin-top:10px;padding:8px 16px;background:rgba(245,158,11,0.1);border-radius:12px;display:inline-block">
                <p style="font-size:16px;color:var(--accent-yellow)">🎁 <strong>${nomeCliente}</strong> ganhou +10 pontos por interesse</p>
            </div>
        </div>
        <div class="vendedor-nav">
            <button class="btn btn-lg" style="background:${VENDEDOR_CORES.conserto.accent};color:#fff;font-size:20px" onclick="UI._vendedorConserto()">Novo Conserto</button>
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI.renderVendedor()">Voltar ao Menu</button>
        </div>`);
};

// CORREÇÃO 2: Simulador abre direto do modo vendedor
UI._vendedorSimulador = function () {
    const taxas = {
        'debito': 1.39, 1: 2.91, 2: 4.68, 3: 5.45, 4: 6.21, 5: 6.95,
        6: 7.69, 7: 8.47, 8: 9.19, 9: 9.91, 10: 10.61, 11: 11.32,
        12: 12.01, 13: 12.70, 14: 13.38, 15: 14.05, 16: 14.72, 17: 15.38, 18: 16.03
    };

    let botoesHtml = `<button onclick="UI._simular('debito')" style="padding: 15px; background: rgba(255, 215, 0, 0.1); border: 1px solid rgba(255, 215, 0, 0.3); border-radius: 12px; color: #FFD700; cursor: pointer; font-size: 16px; font-weight: 700;">Déb</button>`;
    for (let i = 1; i <= 18; i++) {
        botoesHtml += `<button onclick="UI._simular(${i})" style="padding: 15px; background: rgba(255, 215, 0, 0.1); border: 1px solid rgba(255, 215, 0, 0.3); border-radius: 12px; color: #FFD700; cursor: pointer; font-size: 16px; font-weight: 700;">${i}x</button>`;
    }

    document.getElementById('main-content').innerHTML = _vndWrap('parcela', `
        <div style="max-width: 800px; margin: 0 auto;">
            <h1 style="text-align: center; color: #FFD700; font-size: 32px; margin-bottom: 30px;">💳 SIMULADOR DE PARCELAMENTO</h1>
            
            <label style="color: #FFD700; font-size: 16px; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 10px;">VALOR DA VENDA:</label>
            <input type="text" id="simuladorValor" placeholder="R$ 0,00" style="width: 100%; font-size: 32px; text-align: center; padding: 20px; background: rgba(255, 255, 255, 0.05); border: 2px solid rgba(255, 215, 0, 0.3); border-radius: 16px; color: #FFD700; margin-bottom: 30px;">
            
            <p style="color: #FFD700; font-size: 16px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px;">EM QUANTAS VEZES?</p>
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 30px;">
                ${botoesHtml}
            </div>
            
            <div id="simuladorResultado" style="margin-bottom: 30px;"></div>
            
            <button onclick="UI.renderVendedor()" style="width: 100%; padding: 20px; background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; font-size: 18px; font-weight: 700; border: none; border-radius: 16px; cursor: pointer;">← VOLTAR</button>
        </div>
    `);
};

// Função de simulação
UI._simular = function (parcelas) {
    const valorInput = document.getElementById('simuladorValor')?.value;
    const valor = parseFloat((valorInput || '').replace(/[^\d,]/g, '').replace(',', '.'));

    if (!valor || valor <= 0) {
        alert('Digite um valor válido!');
        return;
    }

    const taxas = {
        'debito': 1.39, 1: 2.91, 2: 4.68, 3: 5.45, 4: 6.21, 5: 6.95,
        6: 7.69, 7: 8.47, 8: 9.19, 9: 9.91, 10: 10.61, 11: 11.32,
        12: 12.01, 13: 12.70, 14: 13.38, 15: 14.05, 16: 14.72, 17: 15.38, 18: 16.03
    };

    const taxa = taxas[parcelas];
    const voceRecebe = valor * (1 - taxa / 100);
    const valorComJuros = valor * (1 + taxa / 100);
    const valorParcela = parcelas === 'debito' ? valor : valorComJuros / parcelas;
    const juros = valorComJuros - valor;

    // CORREÇÃO 4: parcela GRANDE primeiro, detalhes pequenos depois
    const resultado = `
        <div style="background: rgba(255, 215, 0, 0.1); border: 2px solid rgba(255, 215, 0, 0.3); border-radius: 20px; padding: 30px;">
            <p style="text-align: center; color: #FFD700; font-size: 20px; margin-bottom: 8px;">
                SIMULAÇÃO ${parcelas === 'debito' ? 'DÉBITO' : parcelas + 'x'}
            </p>
            <p style="text-align: center; color: #FFD700; font-size: 18px; margin-bottom: 4px;">COBRAR DO CLIENTE:</p>
            <p style="text-align: center; color: #FFF; font-size: 64px; font-weight: 900; margin: 10px 0; line-height: 1.1;">
                ${parcelas === 'debito' ? 'R$ ' + valor.toFixed(2) : parcelas + 'x de R$ ' + valorParcela.toFixed(2)}
            </p>
            <div style="border-top: 1px solid rgba(255, 215, 0, 0.2); padding-top: 16px; margin-top: 16px;">
                <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin-bottom: 8px;">Detalhes:</p>
                <p style="color: rgba(255, 255, 255, 0.6); font-size: 14px; margin: 6px 0;">Valor original: R$ ${valor.toFixed(2)}</p>
                ${parcelas !== 'debito' ? `
                <p style="color: rgba(255, 255, 255, 0.6); font-size: 14px; margin: 6px 0;">Juros (${taxa}%): R$ ${juros.toFixed(2)}</p>
                <p style="color: rgba(255, 255, 255, 0.6); font-size: 14px; margin: 6px 0;">Total que cliente paga: R$ ${valorComJuros.toFixed(2)}</p>
                ` : ''}
                <p style="color: #50C878; font-size: 16px; font-weight: 700; margin: 10px 0;">Você recebe: R$ ${voceRecebe.toFixed(2)} (após taxa da máquina)</p>
            </div>
            <p style="text-align: center; color: #FFD700; font-size: 12px; margin-top: 14px;">💡 Cliente paga os juros, não sai do seu bolso</p>
        </div>
    `;

    document.getElementById('simuladorResultado').innerHTML = resultado;
};

// CORREÇÃO 5: Detecção automática de fogos
UI._detectarFogo = function (nome) {
    if (!nome) return null;
    const n = nome.toLowerCase();
    if (n.includes('0.4') || n.includes(':4') || n.includes('12 por 1') || n.includes('12x1')) {
        return { tipo: 'fogo', produto: 'Caixa 12 por 1', preco: 45.00 };
    }
    if (n.includes('1.9') || n.includes(':9') || n.includes('19 por 4') || n.includes('19x4')) {
        return { tipo: 'fogo', produto: 'Caixa 19 por 4', preco: 60.00 };
    }
    if (n.includes('468') || n.includes('giranda')) {
        return { tipo: 'fogo', produto: 'Giranda 468', preco: 200.00 };
    }
    return null;
};

// Bug 16+17: Consertos Pendentes no Modo Vendedor
UI._vendedorConsertosPendentes = function () {
    const ordens = dataManager.getOrdensAtivas();
    let html = `<div class="vendedor-step-header"><span class="vendedor-step-badge" style="background:#f97316">CONSERTOS</span><h2 style="font-size:28px">🔧 CONSERTOS PENDENTES</h2><p style="font-size:20px">${ordens.length} conserto(s) em andamento</p></div>`;

    if (ordens.length === 0) {
        html += '<div style="text-align:center;padding:40px"><div style="font-size:56px">✅</div><p style="font-size:22px;color:var(--text-muted);margin-top:12px">Nenhum conserto pendente!</p></div>';
    } else {
        ordens.forEach(os => {
            const prazo = os.prazo ? os.prazo + ' dias' : 'Sem prazo';
            const statusLabel = { 'aguardando_peca': '📦 Aguardando Peça', 'em_andamento': '🔧 Em Andamento', 'pronto': '✅ Pronto p/ Retirada' }[os.status] || os.status;
            const statusColor = { 'aguardando_peca': '#f59e0b', 'em_andamento': '#3b82f6', 'pronto': '#10b981' }[os.status] || '#888';
            const pago = os.pago || os.entrada || 0;
            const total = os.valorFinal || os.preco || 0;
            const restante = total - pago;
            const dataCriacao = os.dataCriacao ? new Date(os.dataCriacao).toLocaleDateString('pt-BR') : '';

            html += `<div style="background:var(--card-bg);border:2px solid ${statusColor};border-radius:16px;padding:20px;margin-bottom:14px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                    <span style="font-size:22px;font-weight:800;color:${statusColor}">OS #${os.numero} — ${statusLabel}</span>
                    <span style="font-size:14px;color:var(--text-muted)">${dataCriacao}</span>
                </div>
                <p style="font-size:18px;margin:4px 0">📱 <strong>${os.modelo || 'Não informado'}</strong></p>
                <p style="font-size:18px;margin:4px 0">🔧 ${os.servico || 'Serviço não especificado'}</p>
                <p style="font-size:16px;margin:4px 0">👤 ${os.cliente || 'Cliente não identificado'} ${os.telefone ? '| 📞 ' + os.telefone : ''}</p>
                <p style="font-size:16px;margin:4px 0">⏱ Prazo: ${prazo}</p>
                <div style="display:flex;gap:16px;margin-top:12px;padding:12px;background:rgba(16,185,129,0.08);border-radius:10px">
                    <div style="flex:1;text-align:center">
                        <div style="font-size:14px;color:var(--text-muted)">Total</div>
                        <div style="font-size:20px;font-weight:800">${UI.R(total)}</div>
                    </div>
                    <div style="flex:1;text-align:center">
                        <div style="font-size:14px;color:var(--accent-green)">Pago</div>
                        <div style="font-size:20px;font-weight:800;color:var(--accent-green)">${UI.R(pago)}</div>
                    </div>
                    <div style="flex:1;text-align:center">
                        <div style="font-size:14px;color:${restante > 0 ? 'var(--accent-red)' : 'var(--accent-green)'}">Falta</div>
                        <div style="font-size:20px;font-weight:800;color:${restante > 0 ? 'var(--accent-red)' : 'var(--accent-green)'}">${restante > 0 ? UI.R(restante) : 'QUIT!'}</div>
                    </div>
                </div>
                ${os.status !== 'pronto' ? `<div style="display:flex;gap:8px;margin-top:12px">
                    <button class="btn btn-sm" style="flex:1;background:#3b82f6;color:#fff;font-size:14px;padding:10px" onclick="UI._atualizarOSVendedor(${os.numero},'em_andamento')">🔧 Em Andamento</button>
                    <button class="btn btn-sm" style="flex:1;background:#10b981;color:#fff;font-size:14px;padding:10px" onclick="UI._atualizarOSVendedor(${os.numero},'pronto')">✅ Pronto</button>
                </div>` : `<div style="margin-top:12px"><button class="btn btn-sm" style="width:100%;background:#8b5cf6;color:#fff;font-size:16px;padding:12px" onclick="UI._atualizarOSVendedor(${os.numero},'entregue')">📦 MARCAR COMO ENTREGUE</button></div>`}
            </div>`;
        });
    }

    html += `<div class="vendedor-nav"><button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI.renderVendedor()">← Voltar ao Menu</button></div>`;
    document.getElementById('main-content').innerHTML = _vndWrap('conserto', html);
};

UI._atualizarOSVendedor = function (numero, novoStatus) {
    if (novoStatus === 'entregue') {
        // EXIGÊNCIA SOLICITADA: Perguntar o custo da peça/tela ao marcar como entregue
        UI.modalConfirmarCustoPecaOS(numero, function () {
            dataManager.atualizarStatusOS(numero, 'entregue');
            UI.toast(`✅ OS #${numero} entregue e custo registrado no banco!`, 'success');
            UI._vendedorConsertosPendentes();
        });
        return;
    }
    dataManager.atualizarStatusOS(numero, novoStatus);
    UI.toast(`✅ OS #${numero} atualizada para "${novoStatus}"!`, 'success');
    UI._vendedorConsertosPendentes();
};

// === 📦 ENCOMENDAS & PEDIDOS DOS CLIENTES — MODO VENDEDOR ===
UI._vendedorEncomendas = function () {
    const encomendas = dataManager.data.encomendas || [];
    document.getElementById('main-content').innerHTML = _vndWrap('vender', `
        <div class="vendedor-step-header">
            <span class="vendedor-step-badge" style="background:#a855f7">PEDIDOS DOS CLIENTES</span>
            <h2 style="font-size:28px">📦 ENCOMENDAS & PRODUTOS SOLICITADOS</h2>
            <p style="font-size:18px">Anote os produtos que os clientes pediram e que não tem na loja no momento</p>
        </div>
        
        <div class="vendedor-section" style="max-width:800px;margin:0 auto">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
                <button class="btn btn-lg" style="background:#a855f7;color:#fff;font-size:18px;font-weight:900;padding:14px 24px;border:none;box-shadow:0 4px 15px rgba(168,85,247,0.3)" onclick="UI._vendedorNovaEncomendaStart()">
                    ➕ Anotar Nova Encomenda de Cliente
                </button>
                <div style="font-size:14px;color:var(--text-muted);font-weight:700;">Total: ${encomendas.length} encomendados</div>
            </div>

            <div style="display:grid;gap:12px;">
                ${encomendas.length === 0 ? `
                    <div style="text-align:center;padding:30px;background:rgba(255,255,255,0.02);border:1px dashed rgba(255,255,255,0.1);border-radius:14px;color:var(--text-muted);font-size:16px;">
                        📦 Nenhuma encomenda registrada no momento.<br>Clique no botão acima para anotar quando um cliente pedir algo que não tem na loja!
                    </div>` : ''}

                ${encomendas.slice().reverse().map(e => {
                    let badgeBg = '#f59e0b';
                    let badgeTxt = '⏳ Pendente com Fornecedor';
                    if (e.status === 'chegou') { badgeBg = '#10b981'; badgeTxt = '🟢 Chegou na Loja!'; }
                    else if (e.status === 'entregue') { badgeBg = '#6b7280'; badgeTxt = '✅ Entregue ao Cliente'; }

                    return `
                        <div style="background:rgba(15, 20, 32, 0.95);border:1px solid rgba(168,85,247,0.3);border-radius:14px;padding:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                            <div>
                                <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
                                    <span style="font-size:18px;font-weight:900;color:#FFF;">📦 ${e.produto}</span>
                                    <span style="background:${badgeBg};color:#fff;font-size:11px;font-weight:800;padding:3px 8px;border-radius:12px;">${badgeTxt}</span>
                                </div>
                                <div style="font-size:14px;color:var(--text-secondary);">
                                    👤 <strong>${e.cliente}</strong> (${e.telefone}) ${e.entrada > 0 ? `• Entrada Paga: <strong style="color:#10b981">${UI.R(e.entrada)}</strong>` : ''}
                                </div>
                                ${e.obs ? `<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Obs: ${e.obs}</div>` : ''}
                            </div>

                            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                                <div style="text-align:right;margin-right:8px;">
                                    <div style="font-size:18px;font-weight:900;color:#a855f7;">${UI.R(e.valorTotal)}</div>
                                    <div style="font-size:11px;color:var(--text-muted);">${new Date(e.data).toLocaleDateString('pt-BR')}</div>
                                </div>
                                ${e.status !== 'entregue' ? `
                                    <button class="btn btn-sm" style="background:#10b981;color:#fff;font-weight:bold;" onclick="UI._marcarEncomendaChegou(${e.id})">🟢 Chegou</button>
                                    <button class="btn btn-sm" style="background:#3b82f6;color:#fff;font-weight:bold;" onclick="UI._marcarEncomendaEntregue(${e.id})">✅ Entregue</button>
                                ` : ''}
                                <button class="btn btn-sm btn-ghost" style="color:#ef4444" onclick="UI._excluirEncomenda(${e.id})">🗑️</button>
                            </div>
                        </div>`;
                }).join('')}
            </div>
        </div>

        <div class="vendedor-nav" style="max-width:800px;margin:20px auto 0">
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI.renderVendedor()">← Voltar ao Menu</button>
        </div>
    `);
};

UI._vendedorNovaEncomendaStart = function () {
    UI._identificarCliente('vender', function(cliente) {
        UI._vendedorFormNovaEncomenda(cliente);
    });
};

UI._marcarEncomendaChegou = function (id) {
    const enc = (dataManager.data.encomendas || []).find(e => e.id === id);
    if (enc) {
        enc.status = 'chegou';
        dataManager.saveData();
        UI.toast('🟢 Status atualizado: Produto chegou na loja!', 'success');
        UI._vendedorEncomendas();
    }
};

UI._marcarEncomendaEntregue = function (id) {
    const enc = (dataManager.data.encomendas || []).find(e => e.id === id);
    if (enc) {
        enc.status = 'entregue';
        dataManager.saveData();
        UI.toast('✅ Encomenda entregue ao cliente!', 'success');
        UI._vendedorEncomendas();
    }
};

UI._excluirEncomenda = function (id) {
    if (!confirm('Excluir esta encomenda?')) return;
    dataManager.data.encomendas = (dataManager.data.encomendas || []).filter(e => e.id !== id);
    dataManager.saveData();
    UI.toast('🗑️ Encomenda excluída!', 'success');
    UI._vendedorEncomendas();
};

UI._vendedorFormNovaEncomenda = function (cliente) {
    document.getElementById('main-content').innerHTML = _vndWrap('vender', `
        <div class="vendedor-step-header">
            <span class="vendedor-step-badge" style="background:#a855f7">ENCOMENDA</span>
            <h2 style="font-size:28px">📦 NOVA ENCOMENDA</h2>
            <p style="font-size:20px">Cliente: <strong>${cliente.nome}</strong> (${cliente.telefone})</p>
        </div>
        <div class="vendedor-section" style="max-width:600px;margin:0 auto">
            <label class="form-label" style="font-size:18px;color:#FFD700">Produto / Peça encomendada:</label>
            <input class="form-input" id="enc-prod" placeholder="Ex: Capa A54 Rosa ou Tela iPhone 11" style="font-size:18px;padding:12px">
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
                <div>
                    <label class="form-label" style="font-size:16px;color:#FFD700">Valor Estimado (R$):</label>
                    <input class="form-input" id="enc-valor" type="number" step="0.01" placeholder="0.00" style="font-size:18px;padding:10px">
                </div>
                <div>
                    <label class="form-label" style="font-size:16px;color:#FFD700">Sinal / Entrada Paga (R$):</label>
                    <input class="form-input" id="enc-entrada" type="number" step="0.01" placeholder="0.00" style="font-size:18px;padding:10px">
                </div>
            </div>
            
            <label class="form-label" style="font-size:16px;margin-top:12px;color:var(--text-muted)">Observação / Fornecedor (opcional):</label>
            <input class="form-input" id="enc-obs" placeholder="Ex: Pedido com fornecedor João" style="font-size:16px;padding:10px">
        </div>
        
        <div class="vendedor-nav" style="max-width:600px;margin:20px auto 0">
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI.renderVendedor()">← Voltar</button>
            <button class="btn btn-lg" style="background:#a855f7;color:#fff;font-size:18px;padding:14px 28px" onclick="UI._salvarEncomenda('${cliente.nome.replace(/'/g, "\\'")}', '${cliente.telefone}')">💾 SALVAR ENCOMENDA</button>
        </div>
    `);
};

UI._salvarEncomenda = function (nomeCliente, foneCliente) {
    const prod = document.getElementById('enc-prod')?.value?.trim();
    const valor = parseFloat(document.getElementById('enc-valor')?.value || 0);
    const entrada = parseFloat(document.getElementById('enc-entrada')?.value || 0);
    const obs = document.getElementById('enc-obs')?.value?.trim();

    if (!prod) return UI.toast('Digite o produto da encomenda', 'error');

    if (!dataManager.data.encomendas) dataManager.data.encomendas = [];
    const novaEnc = {
        id: Date.now(),
        cliente: nomeCliente,
        telefone: foneCliente,
        produto: prod,
        valorTotal: valor,
        entrada: entrada,
        obs: obs,
        status: 'pendente',
        data: new Date().toISOString()
    };

    if (!dataManager.isModoTreino()) {
        dataManager.data.encomendas.push(novaEnc);
        if (entrada > 0) {
            dataManager.data.financeiro.caixaPrincipal += entrada;
            dataManager.data.financeiro.caixaSecundario += entrada;
        }
        dataManager.saveData();
    }

    UI.toast('📦 Encomenda salva com sucesso!', 'success');

    const htmlModal = `
        <div style="text-align:center;padding:10px">
            <h3 style="font-size:22px;color:var(--accent-green)">✅ Encomenda Cadastrada!</h3>
            <p style="font-size:16px;color:var(--text-muted)">Deseja enviar o comprovante de encomenda ao cliente?</p>
            <div style="display:flex;gap:12px;justify-content:center;margin-top:20px;flex-wrap:wrap">
                <button class="btn btn-primary btn-lg" onclick="UI._enviarComprovanteWhatsApp({tipoTitulo:'COMPROVANTE DE ENCOMENDA',cliente:'${nomeCliente}',telefoneCliente:'${foneCliente}',produto:'${prod}',valor:${valor},formaPagamento:'Entrada ${UI.R(entrada)}',vendedor:'Atendente'});UI.closeModal();UI.renderVendedor();">📱 Enviar no WhatsApp</button>
                <button class="btn btn-ghost btn-lg" onclick="UI._gerarReciboProfissionalPDF({tipoTitulo:'COMPROVANTE DE ENCOMENDA',cliente:'${nomeCliente}',telefoneCliente:'${foneCliente}',produto:'${prod}',valor:${valor},formaPagamento:'Entrada ${UI.R(entrada)}',vendedor:'Atendente'});UI.closeModal();UI.renderVendedor();">📄 PDF / Imprimir Recibo</button>
            </div>
        </div>
    `;
    UI.openModal('📦 Comprovante de Encomenda', htmlModal);
};

// === 📝 BLOCO DE NOTAS / RECADOS ===
UI._obterWidgetBlocoNotas = function () {
    const notasObj = dataManager.data.blocoNotas || {};
    const notasList = Object.entries(notasObj).sort((a,b) => Number(b[0]) - Number(a[0]));

    let htmlNotas = notasList.length > 0
        ? notasList.slice(0, 10).map(([id, n]) => {
            const textoStr = typeof n === 'object' && n !== null ? (n.texto || '') : String(n || '');
            const dhStr = typeof n === 'object' && n !== null ? (n.dataHora || 'Recado') : 'Anotação';
            return `
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,215,0,0.15);border-radius:10px;padding:12px;margin-bottom:8px;position:relative;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                    <span style="font-size:12px;color:#FFD700;font-weight:bold;">📅 ${dhStr}</span>
                    <button onclick="UI._deletarNotaBloco('${id}')" style="background:none;border:none;color:var(--accent-red);cursor:pointer;font-size:14px;font-weight:bold;">❌ Excluir</button>
                </div>
                <div style="font-size:15px;color:#FFF;white-space:pre-wrap;text-align:left;">${textoStr}</div>
            </div>
            `;
        }).join('')
        : '<p style="font-size:13px;color:var(--text-muted);text-align:center;">Nenhuma anotação salva.</p>';

    return `
    <div id="widget-bloco-notas-container" style="margin: 20px auto; padding: 18px; background: rgba(15, 20, 32, 0.9); border: 1px solid rgba(255, 215, 0, 0.2); border-radius: 16px; max-width: 650px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:16px;color:#FFD700;margin:0;font-weight:800">📝 BLOCO DE NOTAS & RECADOS</h3>
            <span style="font-size:11px;color:var(--text-muted);">Salvo no sistema & nuvem</span>
        </div>
        
        <div style="display:flex;gap:8px;margin-bottom:14px;">
            <input class="form-input" id="input-nova-nota" placeholder="Digite um recado rápido (ex: Cliente busca aparelho às 15h)..." style="font-size:15px;padding:10px;flex:1" onkeypress="if(event.key==='Enter')UI._salvarNotaBloco()">
            <button class="btn" style="background:#FFD700;color:#000;font-weight:800;font-size:14px;padding:8px 16px;border:none;border-radius:8px;cursor:pointer;" onclick="UI._salvarNotaBloco()">+ NOTA</button>
        </div>
        
        <div style="max-height:260px;overflow-y:auto;">
            ${htmlNotas}
        </div>
    </div>
    `;
};

// === WIDGET: CHECKLIST DIÁRIO DE TAREFAS DA LOJA ===
UI._obterWidgetChecklistDiario = function () {
    const hojeYMD = dataManager.hojeLocal ? dataManager.hojeLocal() : new Date().toISOString().split('T')[0];
    if (!dataManager.data.checklistDiario) dataManager.data.checklistDiario = {};
    const ck = dataManager.data.checklistDiario;

    // Se mudou o dia, reiniciar marcadores do checklist mantendo a estrutura de tarefas
    if (ck.dataHoje !== hojeYMD) {
        ck.dataHoje = hojeYMD;
        if (!ck.tarefas || ck.tarefas.length === 0) {
            ck.tarefas = [
                { id: 1, texto: '🔑 Conferir troco inicial na gaveta do caixa', pronta: false },
                { id: 2, texto: '🧼 Limpar balcão, vitrine e telas de exposição', pronta: false },
                { id: 3, texto: '📱 Responder clientes no WhatsApp & conferir encomendas', pronta: false },
                { id: 4, texto: '📦 Conferir estoque de películas e capas populares', pronta: false },
                { id: 5, texto: '🔧 Verificar Ordens de Serviço prontas para entrega', pronta: false },
                { id: 6, texto: '🔒 Fechar turno e registrar sangria no final do dia', pronta: false }
            ];
        } else {
            // Desmarcar todas para o novo dia
            ck.tarefas.forEach(t => t.pronta = false);
        }
        if (!dataManager.isModoTreino()) dataManager.saveData();
    }

    const tarefas = ck.tarefas || [];
    const concluidas = tarefas.filter(t => t.pronta).length;
    const total = tarefas.length;
    const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0;

    let itemsHtml = '';
    tarefas.forEach(t => {
        itemsHtml += `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:rgba(255,255,255,0.03);border:1px solid ${t.pronta ? 'rgba(0,217,126,0.3)' : 'rgba(255,255,255,0.08)'};border-radius:10px;margin-bottom:6px;transition:all 0.2s;">
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;flex:1;min-width:0;user-select:none;">
                <input type="checkbox" ${t.pronta ? 'checked' : ''} onchange="UI._toggleChecklistDiario(${t.id})" style="width:20px;height:20px;accent-color:#00d97e;cursor:pointer;">
                <span style="font-size:15px;color:${t.pronta ? 'var(--text-muted)' : '#FFF'};text-decoration:${t.pronta ? 'line-through' : 'none'};font-weight:${t.pronta ? '400' : '600'};">${t.texto}</span>
            </label>
            <button onclick="UI._deletarTarefaChecklistDiario(${t.id})" style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:14px;padding:4px 8px;" title="Remover tarefa">🗑️</button>
        </div>`;
    });

    return `
    <div style="margin: 15px auto 20px; padding: 18px; background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 14, 24, 0.95) 100%); border: 1px solid rgba(0, 217, 126, 0.3); border-radius: 18px; max-width: 600px; box-shadow: 0 8px 30px rgba(0,0,0,0.5);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div>
                <span style="font-size:12px;color:#00d97e;font-weight:800;letter-spacing:1px;text-transform:uppercase;">📋 ORGANIZAÇÃO DIÁRIA DA LOJA</span>
                <h3 style="margin:2px 0 0;font-size:18px;color:#FFF;font-weight:800;">CHECKLIST DE TAREFAS DA FUNCIONÁRIA</h3>
            </div>
            <span style="background:${pct === 100 ? 'rgba(0,217,126,0.2)' : 'rgba(255,215,0,0.15)'};color:${pct === 100 ? '#00d97e' : '#FFD700'};font-size:13px;padding:4px 10px;border-radius:20px;font-weight:800;">
                ${concluidas}/${total} (${pct}%)
            </span>
        </div>

        <div style="width:100%;height:8px;background:rgba(255,255,255,0.06);border-radius:4px;overflow:hidden;margin-bottom:14px;">
            <div style="width:${pct}%;height:100%;background:${pct === 100 ? '#00d97e' : 'linear-gradient(90deg, #FFD700, #00d97e)'};transition:width 0.4s ease;"></div>
        </div>

        <div style="max-height:260px;overflow-y:auto;margin-bottom:12px;">
            ${itemsHtml || '<p style="text-align:center;color:var(--text-muted);padding:10px;">Nenhuma tarefa pendente para hoje</p>'}
        </div>

        <div style="display:flex;gap:8px;">
            <input class="form-input" id="input-nova-tarefa-ck" placeholder="+ Adicionar nova tarefa para hoje..." style="flex:1;font-size:14px;padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);" onkeypress="if(event.key==='Enter')UI._adicionarTarefaChecklistDiario()">
            <button class="btn btn-sm" style="background:#00d97e;color:#000;font-weight:800;font-size:14px;padding:8px 14px;border:none;border-radius:8px;cursor:pointer;" onclick="UI._adicionarTarefaChecklistDiario()">+ ADICIONAR</button>
        </div>
    </div>`;
};

UI._toggleChecklistDiario = function (id) {
    const tarefas = dataManager.data.checklistDiario?.tarefas || [];
    const t = tarefas.find(x => x.id === id);
    if (t) {
        t.pronta = !t.pronta;
        if (!dataManager.isModoTreino()) dataManager.saveData();
        if (UI.paginaAtual === 'vendedor') UI.renderVendedor(); else UI.render();
    }
};

UI._adicionarTarefaChecklistDiario = function () {
    const input = document.getElementById('input-nova-tarefa-ck');
    const texto = input?.value?.trim();
    if (!texto) return UI.toast('Digite a descrição da tarefa', 'error');

    if (!dataManager.data.checklistDiario) dataManager.data.checklistDiario = {};
    if (!dataManager.data.checklistDiario.tarefas) dataManager.data.checklistDiario.tarefas = [];
    
    dataManager.data.checklistDiario.tarefas.push({
        id: Date.now(),
        texto: texto,
        pronta: false
    });

    if (!dataManager.isModoTreino()) dataManager.saveData();
    UI.toast('✅ Nova tarefa adicionada ao checklist!', 'success');
    if (UI.paginaAtual === 'vendedor') UI.renderVendedor(); else UI.render();
};

UI._deletarTarefaChecklistDiario = function (id) {
    if (dataManager.data.checklistDiario?.tarefas) {
        dataManager.data.checklistDiario.tarefas = dataManager.data.checklistDiario.tarefas.filter(t => t.id !== id);
        if (!dataManager.isModoTreino()) dataManager.saveData();
        UI.toast('Tarefa removida', 'info');
        if (UI.paginaAtual === 'vendedor') UI.renderVendedor(); else UI.render();
    }
};

UI._salvarNotaBloco = function () {
    const input = document.getElementById('input-nova-nota');
    const texto = input?.value?.trim();
    if (!texto) return UI.toast('Digite a anotação', 'error');

    if (!dataManager.data.blocoNotas) dataManager.data.blocoNotas = {};
    const id = Date.now();
    const agora = new Date();
    const dataHoraStr = `${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR').substring(0,5)}`;

    dataManager.data.blocoNotas[id] = {
        texto: texto,
        dataHora: dataHoraStr
    };

    dataManager.data._ultimoSaveLocal = Date.now();
    if (!dataManager.isModoTreino()) {
        dataManager.saveData();
        if (dataManager.supabase) dataManager.salvarSupabase();
    }

    if (input) input.value = '';
    UI.toast('📝 Anotação salva com sucesso!', 'success');

    const container = document.getElementById('widget-bloco-notas-container');
    if (container) {
        container.outerHTML = UI._obterWidgetBlocoNotas();
        const newInput = document.getElementById('input-nova-nota');
        if (newInput) newInput.focus();
    } else if (UI.paginaAtual === 'vendedor') {
        UI.renderVendedor();
    } else if (typeof UI.render === 'function') {
        UI.render();
    }
};

UI._deletarNotaBloco = function (id) {
    if (dataManager.data.blocoNotas && dataManager.data.blocoNotas[id]) {
        delete dataManager.data.blocoNotas[id];
        dataManager.data._ultimoSaveLocal = Date.now();
        if (!dataManager.isModoTreino()) {
            dataManager.saveData();
            if (dataManager.supabase) dataManager.salvarSupabase();
        }
        UI.toast('🗑️ Anotação removida!', 'info');

        const container = document.getElementById('widget-bloco-notas-container');
        if (container) {
            container.outerHTML = UI._obterWidgetBlocoNotas();
        } else if (UI.paginaAtual === 'vendedor') {
            UI.renderVendedor();
        } else if (typeof UI.render === 'function') {
            UI.render();
        }
    }
};

// === REGISTRAR GASTO DA LOJA (MODO VENDEDOR) ===
UI._vendedorRegistrarGastoLoja = function () {
    document.getElementById('main-content').innerHTML = _vndWrap('vender', `
        <div class="vendedor-step-header">
            <span class="vendedor-step-badge" style="background:#ef4444">DESPESA / GASTO</span>
            <h2 style="font-size:28px;color:#ef4444">💸 REGISTRAR GASTO DA LOJA</h2>
            <p style="font-size:20px">Tirou dinheiro do caixa para comprar algo para a loja?</p>
        </div>

        <div style="max-width: 600px; margin: 0 auto; background: rgba(0,0,0,0.2); padding: 20px; border-radius: 16px; border: 1px solid rgba(239,68,68,0.3);">
            <label class="form-label" style="font-size:18px;color:#FFD700">O que foi comprado / Pago?</label>
            <input class="form-input" id="gasto-desc" placeholder="Ex: Almoço, Sacolas, Material de limpeza, Frete, Fita..." style="font-size:20px;padding:14px;margin-bottom:16px">

            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
                <span class="btn btn-sm btn-ghost" onclick="document.getElementById('gasto-desc').value='Almoço'" style="cursor:pointer;font-size:14px">🍱 Almoço</span>
                <span class="btn btn-sm btn-ghost" onclick="document.getElementById('gasto-desc').value='Material de Limpeza'" style="cursor:pointer;font-size:14px">🧹 Limpeza</span>
                <span class="btn btn-sm btn-ghost" onclick="document.getElementById('gasto-desc').value='Frete / Transporte'" style="cursor:pointer;font-size:14px">🚚 Frete</span>
                <span class="btn btn-sm btn-ghost" onclick="document.getElementById('gasto-desc').value='Sacolas / Embalagens'" style="cursor:pointer;font-size:14px">🛍️ Sacolas</span>
                <span class="btn btn-sm btn-ghost" onclick="document.getElementById('gasto-desc').value='Café / Água'" style="cursor:pointer;font-size:14px">☕ Café/Água</span>
            </div>

            <label class="form-label" style="font-size:18px;color:#FFD700">Valor gasto (R$):</label>
            <input class="form-input" id="gasto-valor" type="number" step="0.50" placeholder="0.00" style="font-size:28px;padding:14px;font-weight:900;color:#ef4444;margin-bottom:16px">

            <label class="form-label" style="font-size:18px;color:#FFD700">De qual caixa saiu o dinheiro?</label>
            <select id="gasto-caixa" class="form-input" style="font-size:18px;padding:12px;margin-bottom:16px;font-weight:bold;color:#10b981">
                <option value="caixaSecundario">🏪 Caixa Secundário (Gaveta Balcão)</option>
                <option value="caixaTerciario">👨‍🦳 Caixa Terciário (Pai)</option>
            </select>
        </div>

        <div class="vendedor-nav" style="max-width: 600px; margin: 24px auto 0;">
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI.renderVendedor()">← Voltar</button>
            <button class="btn btn-lg" style="background:#ef4444;color:#fff;font-size:20px;padding:14px 28px" onclick="UI._confirmarGastoLoja()">💸 CONCLUIR GASTO</button>
        </div>
    `);
    setTimeout(() => document.getElementById('gasto-desc')?.focus(), 150);
};

UI._confirmarGastoLoja = function () {
    const desc = document.getElementById('gasto-desc')?.value?.trim();
    const valor = parseFloat(document.getElementById('gasto-valor')?.value);
    const caixa = document.getElementById('gasto-caixa')?.value || 'caixaSecundario';

    if (!desc || desc.length < 2) return UI.toast('Digite a descrição do que foi comprado!', 'error');
    if (isNaN(valor) || valor <= 0) return UI.toast('Digite um valor gasto válido!', 'error');

    dataManager.registrarDespesa(valor, desc, caixa);
    UI.toast(`💸 Gasto de R$ ${valor.toFixed(2)} registrado com sucesso!`, 'success');
    
    document.getElementById('main-content').innerHTML = _vndWrap('vender', `
        <div style="text-align:center;padding:40px 0">
            <div style="font-size:64px">💸</div>
            <h2 style="color:#ef4444;font-size:28px">GASTO DA LOJA REGISTRADO!</h2>
            <p style="font-size:22px;margin:10px 0">${desc}</p>
            <p style="font-size:36px;font-weight:900;color:#ef4444">- ${UI.R(valor)}</p>
            <p style="color:var(--text-muted);font-size:18px">Debitados do ${caixa === 'caixaTerciario' ? 'Caixa Terciário (Pai)' : 'Caixa Secundário (Balcão / Gaveta)'}</p>
        </div>
        <div class="vendedor-nav" style="justify-content:center">
            <button class="btn btn-ghost btn-lg" style="font-size:18px" onclick="UI.renderVendedor()">Voltar ao Menu Vendedor</button>
        </div>
    `);
};

UI.biparComCamera = function (targetInpId) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return UI.toast('📷 Câmera não disponível no dispositivo!', 'error');
    }

    UI.openModal('📷 Leitor por Câmera — Bipar Código', `
        <div style="padding:14px;text-align:center;">
            <p style="font-size:14px;color:var(--text-muted);margin-bottom:12px;">
                Aponte a câmera do seu celular para o <strong>Código QR ou Código de Barras</strong> da etiqueta do produto:
            </p>
            <video id="camera-preview-stream" style="width:100%;max-width:360px;height:240px;background:#000;border-radius:12px;object-fit:cover;margin:0 auto;border:2px solid #00d97e;"></video>

            <div style="margin-top:12px;background:rgba(0,217,126,0.1);padding:10px;border-radius:8px;border:1px solid rgba(0,217,126,0.3);font-size:13px;color:#00d97e;">
                📲 Cada bip envia o produto direto para a tela do Notebook!
            </div>

            <div style="margin-top:14px;display:flex;gap:10px;">
                <button class="btn btn-primary" style="flex:1;font-size:15px;font-weight:700;" onclick="UI._simularBipCamera()">🎵 Simular Bip (Teste)</button>
                <button class="btn btn-ghost" style="flex:1;font-size:15px;" onclick="UI.pararCameraPreview();UI.closeModal();">❌ Sair</button>
            </div>
        </div>
    `);

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(stream => {
        UI._cameraStreamAtual = stream;
        const video = document.getElementById('camera-preview-stream');
        if (video) {
            video.srcObject = stream;
            video.play();
        }
    }).catch(e => {
        UI.toast('Erro ao abrir câmera: ' + e.message, 'error');
        UI.closeModal();
    });
};

UI._simularBipCamera = async function () {
    const ace = dataManager.getEstoqueAcessorios() || [];
    const item = ace[Math.floor(Math.random() * ace.length)] || { nome: 'Capa Magsafe', precoVenda: 29.90 };

    if (dataManager.enviarBipCelularParaNotebook) {
        await dataManager.enviarBipCelularParaNotebook('STO-TESTE', item);
    }
    UI.toast(`🎵 📱 Bipou: ${item.nome} — Enviado para o Notebook!`, 'success');
    UI.pararCameraPreview();
    UI.closeModal();
};

UI.modalConectarScannerCelular = function () {
    const urlApp = window.location.href;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(urlApp)}`;

    UI.openModal('📱 Conectar Câmera do Celular ao Notebook', `
        <div style="padding:16px;text-align:center;">
            <h3 style="color:#00d97e;margin:0 0 10px 0;">📲 TRANSFORME O CELULAR EM LEITOR SEM FIO</h3>
            <p style="font-size:14px;color:var(--text-muted);margin-bottom:14px;">
                Abra a câmera do celular da loja e escaneie o QR Code abaixo para abrir o scanner sem fio. Quando bipar um produto na prateleira, ele aparecerá <strong>na hora na tela deste Notebook!</strong>
            </p>
            <div style="background:#fff;padding:12px;display:inline-block;border-radius:16px;margin:10px 0;box-shadow:0 8px 24px rgba(0,0,0,0.5);">
                <img src="${qrUrl}" alt="QR Connect" style="width:180px;height:180px;display:block;">
            </div>
            <div style="font-size:13px;color:#00d97e;font-weight:700;margin-top:10px;">
                🟢 Notebook ouvindo bips do celular em tempo real...
            </div>
        </div>
    `);

    if (dataManager.iniciarEscutaScannerNotebook) {
        dataManager.iniciarEscutaScannerNotebook(bip => {
            UI.toast(`🎵 📲 Bip recebido do Celular: ${bip.produto || 'Item'} (R$ ${(bip.preco || 0).toFixed(2)})`, 'success');
        });
    }
};

UI.pararCameraPreview = function () {
    if (UI._cameraStreamAtual) {
        UI._cameraStreamAtual.getTracks().forEach(t => t.stop());
        UI._cameraStreamAtual = null;
    }
};

// === REGISTRAR PRODUTOS EM FALTA / PROCURADOS POR CLIENTES ===
UI._vendedorRegistrarFalta = function () {
    UI.openModal('⚠️ REGISTRAR PRODUTO EM FALTA', `
        <div style="padding:16px;">
            <div style="background:rgba(239,68,68,0.1);border:1px solid #ef4444;border-radius:12px;padding:12px;margin-bottom:16px;">
                <div style="font-size:14px;color:#ef4444;font-weight:bold;">📋 O que o cliente procurou na loja e NÃO tínhamos?</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">
                    Registrar produtos procurados ajuda a saber exatamente o que comprar para a reposição da loja!
                </div>
            </div>

            <label class="form-label" style="font-size:16px;font-weight:700;color:#FFD700;">Nome do produto procurado:</label>
            <input class="form-input" id="falta-nome" placeholder="Ex: Película 3D iPhone 15 Pro Max..." style="font-size:18px;padding:12px;margin-bottom:10px;width:100%;">

            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">
                <span class="btn btn-sm btn-ghost" onclick="document.getElementById('falta-nome').value='Película 3D iPhone 15 Pro Max'" style="cursor:pointer;font-size:12px;">📱 Película 3D IP 15 Pro Max</span>
                <span class="btn btn-sm btn-ghost" onclick="document.getElementById('falta-nome').value='Carregador 20W Anker / Tipo C'" style="cursor:pointer;font-size:12px;">🔌 Carregador 20W</span>
                <span class="btn btn-sm btn-ghost" onclick="document.getElementById('falta-nome').value='Fone Bluetooth Sem Fio'" style="cursor:pointer;font-size:12px;">🎧 Fone Bluetooth</span>
                <span class="btn btn-sm btn-ghost" onclick="document.getElementById('falta-nome').value='Cabo Tipo-C 2 Metros'" style="cursor:pointer;font-size:12px;">⚡ Cabo Tipo-C 2M</span>
                <span class="btn btn-sm btn-ghost" onclick="document.getElementById('falta-nome').value='Capa Silicone Veludo iPhone'" style="cursor:pointer;font-size:12px;">🛡️ Capa Silicone</span>
                <span class="btn btn-sm btn-ghost" onclick="document.getElementById('falta-nome').value='Relógio Smartwatch S9'" style="cursor:pointer;font-size:12px;">⌚ Smartwatch</span>
            </div>

            <label class="form-label" style="font-size:15px;font-weight:700;color:#FFD700;">Observação / Quem procurou (opcional):</label>
            <input class="form-input" id="falta-obs" placeholder="Ex: 2 clientes pediram hoje de manhã..." style="font-size:15px;padding:10px;margin-bottom:16px;width:100%;">

            <div class="modal-footer" style="display:flex;gap:8px;">
                <button class="btn btn-ghost" onclick="UI.closeModal();">Cancelar</button>
                <button class="btn btn-danger btn-lg" style="flex:1;font-weight:900;" onclick="UI._confirmarRegistroFalta()">⚠️ REGISTRAR DEMANDA EM FALTA</button>
            </div>
        </div>
    `);
    setTimeout(() => document.getElementById('falta-nome')?.focus(), 150);
};

UI._confirmarRegistroFalta = function () {
    const inputNome = document.getElementById('falta-nome');
    const inputObs = document.getElementById('falta-obs');
    const nome = inputNome ? inputNome.value.trim() : '';
    const obs = inputObs ? inputObs.value.trim() : '';
    if (!nome) return UI.toast('Digite o nome do produto procurado', 'error');

    const res = dataManager.adicionarProdutoProcurado(nome, obs, 'Atendente');
    if (res.sucesso) {
        UI.toast(`📋 Produto procurado "${nome}" registrado com sucesso!`, 'success');
        UI.closeModal();
        if (UI.paginaAtual === 'vendedor') UI.renderVendedor(); else UI.render();
    } else {
        UI.toast(res.erro || 'Erro ao registrar', 'error');
    }
};

UI._incrementarProcurado = function (id) {
    dataManager.incrementarProdutoProcurado(id);
    UI.toast('🔥 +1 solicitação registrada!', 'success');
    if (UI.paginaAtual === 'vendedor') UI.renderVendedor(); else UI.render();
};

UI._concluirProcurado = function (id) {
    dataManager.concluirProdutoProcurado(id);
    UI.toast('✅ Produto marcado como REPOSTO / COMPRADO!', 'success');
    if (UI.paginaAtual === 'vendedor') UI.renderVendedor(); else UI.render();
};

UI._deletarProcurado = function (id) {
    dataManager.deletarProdutoProcurado(id);
    UI.toast('🗑️ Removido da lista de procurados', 'info');
    if (UI.paginaAtual === 'vendedor') UI.renderVendedor(); else UI.render();
};

UI._obterWidgetProdutosProcurados = function () {
    const procurados = dataManager.getProdutosProcurados();
    
    let itemsHtml = '';
    procurados.forEach(p => {
        const dataStr = p.ultimaData ? new Date(p.ultimaData).toLocaleDateString('pt-BR') : 'Hoje';
        itemsHtml += `
            <div style="background:rgba(0,0,0,0.25);border:1px solid rgba(239,68,68,0.25);border-radius:12px;padding:12px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
                <div style="flex:1;min-width:200px;">
                    <div style="font-size:16px;font-weight:800;color:#FFF;">⚠️ ${p.nome}</div>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
                        🔥 <strong style="color:#ef4444">${p.solicitacoes || 1} cliente(s) procuraram</strong> | Último pedido: ${dataStr} ${p.vendedor ? `(${p.vendedor})` : ''}
                        ${p.observacao ? `<br>💬 <em>${p.observacao}</em>` : ''}
                    </div>
                </div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <button class="btn btn-xs btn-primary" style="background:#ef4444;border:none;font-weight:800;cursor:pointer;" onclick="UI._incrementarProcurado('${p.id}')">+1 Pediram</button>
                    <button class="btn btn-xs btn-success" style="font-weight:800;cursor:pointer;" onclick="UI._concluirProcurado('${p.id}')">✅ Reposto</button>
                    <button class="btn btn-xs btn-ghost" style="color:var(--text-muted);cursor:pointer;" onclick="UI._deletarProcurado('${p.id}')">🗑️</button>
                </div>
            </div>`;
    });

    return `
        <div id="widget-produtos-procurados-container" style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.3);border-radius:16px;padding:20px;margin-top:16px;max-width:1100px;margin-left:auto;margin-right:auto;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
                <div>
                    <h3 style="font-size:20px;color:#ef4444;margin:0;font-weight:800;">📋 PRODUTOS EM FALTA & PROCURADOS POR CLIENTES (${procurados.length})</h3>
                    <div style="font-size:13px;color:var(--text-muted);margin-top:2px;">Produtos que os clientes procuraram na loja e não tính tínhamos no estoque</div>
                </div>
                <button class="btn btn-sm" style="background:#ef4444;color:#fff;font-weight:900;border:none;border-radius:8px;padding:8px 14px;cursor:pointer;" onclick="UI._vendedorRegistrarFalta()">
                    ⚠️ + REGISTRAR PRODUTO EM FALTA
                </button>
            </div>

            <div style="max-height:300px;overflow-y:auto;">
                ${itemsHtml || '<p style="text-align:center;color:var(--text-muted);padding:14px;">🎉 Nenhum produto em falta registrado! Todos os itens procurados estão no estoque.</p>'}
            </div>
        </div>`;
};

// === FLUXO TROCA (VENDEDOR) ===
UI._vendedorTroca = function () {
    // Passo 1: Buscar venda original
    UI._identificarCliente('trocar', function(cliente) {
        UI._vendedorTrocaBuscarVenda(cliente);
    });
};

UI._vendedorTrocaBuscarVenda = function(cliente) {
    const vendasCliente = dataManager.data.historico.vendas.filter(v => v.cliente === cliente.nome || (v.telefone && v.telefone === cliente.telefone));
    
    // Mostra as vendas do cliente
    let htmlVendas = '';
    if (vendasCliente.length === 0) {
        htmlVendas = `<p style="text-align:center;color:var(--text-muted);padding:20px;font-size:18px">Nenhuma venda encontrada para este cliente.</p>`;
    } else {
        vendasCliente.reverse().forEach(v => {
            const dataStr = new Date(v.data).toLocaleDateString('pt-BR');
            const prodsStr = v.produtos ? v.produtos.map(p => p.nome).join(', ') : 'Produtos não encontrados';
            htmlVendas += `
            <div style="background:rgba(255,255,255,0.05);border:1px solid var(--border-color);border-radius:12px;padding:16px;margin-bottom:12px;cursor:pointer;" onclick="UI._vendedorTrocaSelecionarVenda('${v.id}')">
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                    <strong style="color:var(--accent-purple);font-size:18px;">📅 ${dataStr}</strong>
                    <strong style="color:#00d97e;font-size:20px;">${UI.R(v.valorTotal || v.valorVenda || 0)}</strong>
                </div>
                <div style="font-size:16px;color:#FFF;">📦 ${prodsStr}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">ID Venda: ${v.id}</div>
            </div>`;
        });
    }

    document.getElementById('main-content').innerHTML = _vndWrap('trocar', `
        <div class="vendedor-step-header">
            <span class="vendedor-step-badge" style="background:#3b82f6">PASSO 2 DE 5</span>
            <h2 style="font-size:28px">🔄 QUAL VENDA POSSUI O PRODUTO?</h2>
            <p style="font-size:20px">Selecione a venda original do cliente <strong>${cliente.nome}</strong></p>
        </div>
        <div style="max-width:700px;margin:20px auto;">
            ${htmlVendas}
        </div>
        <div class="vendedor-nav" style="max-width:700px;margin:20px auto 0;">
            <button class="btn btn-ghost btn-lg" onclick="UI.renderVendedor()">← Voltar</button>
        </div>
    `);
};

UI._vendedorTrocaSelecionarVenda = function(vendaId) {
    const vendaOriginal = dataManager.data.historico.vendas.find(v => String(v.id) === String(vendaId));
    if (!vendaOriginal) return UI.toast('Venda não encontrada', 'error');

    let htmlProds = '';
    if (vendaOriginal.produtos && vendaOriginal.produtos.length > 0) {
        vendaOriginal.produtos.forEach((p, idx) => {
            htmlProds += `
            <div style="background:rgba(255,255,255,0.05);border:1px solid #3b82f6;border-radius:12px;padding:16px;margin-bottom:12px;cursor:pointer;" onclick="UI._vendedorTrocaSelecionarNovoProduto('${vendaOriginal.id}', ${idx})">
                <div style="font-size:20px;font-weight:bold;color:#FFF;">${p.nome}</div>
                <div style="font-size:18px;color:#00d97e;margin-top:4px;">Valor pago: ${UI.R(p.precoVenda || 0)}</div>
                <button class="btn btn-primary btn-lg" style="margin-top:16px;width:100%;font-size:18px;">🔄 Selecionar para Trocar</button>
            </div>`;
        });
    } else {
        htmlProds = `<p style="text-align:center;color:var(--text-muted);font-size:18px;">Nenhum produto listado nesta venda.</p>`;
    }

    document.getElementById('main-content').innerHTML = _vndWrap('trocar', `
        <div class="vendedor-step-header">
            <span class="vendedor-step-badge" style="background:#3b82f6">PASSO 3 DE 5</span>
            <h2 style="font-size:28px">🔄 PRODUTO DEVOLVIDO</h2>
            <p style="font-size:20px">Qual produto o cliente está devolvendo?</p>
        </div>
        <div style="max-width:700px;margin:20px auto;">
            ${htmlProds}
        </div>
        <div class="vendedor-nav" style="max-width:700px;margin:20px auto 0;">
            <button class="btn btn-ghost btn-lg" onclick="UI._vendedorTrocaBuscarVenda(UI._clienteAtual)">← Voltar</button>
        </div>
    `);
};

UI._vendedorTrocaSelecionarNovoProduto = function(vendaId, produtoIdx) {
    UI._trocaContext = { vendaId, produtoIdx };
    document.getElementById('main-content').innerHTML = _vndWrap('trocar', `
        <div class="vendedor-step-header">
            <span class="vendedor-step-badge" style="background:#3b82f6">PASSO 4 DE 5</span>
            <h2 style="font-size:28px">🔄 NOVO PRODUTO</h2>
            <p style="font-size:20px">O que o cliente vai levar no lugar?</p>
        </div>
        <div style="max-width:700px;margin:20px auto;">
            <input class="form-input" id="troca-busca-novo" placeholder="🔍 Buscar novo produto no estoque..." style="font-size:20px;padding:16px;width:100%;margin-bottom:20px;" oninput="UI._vendedorTrocaBuscarEstoque()">
            <div id="troca-lista-estoque"></div>
        </div>
        <div class="vendedor-nav" style="max-width:700px;margin:20px auto 0;">
            <button class="btn btn-ghost btn-lg" onclick="UI._vendedorTrocaSelecionarVenda('${vendaId}')">← Voltar</button>
        </div>
    `);
    setTimeout(() => document.getElementById('troca-busca-novo')?.focus(), 150);
    UI._vendedorTrocaBuscarEstoque();
};

UI._vendedorTrocaBuscarEstoque = function() {
    const filtro = document.getElementById('troca-busca-novo')?.value?.toLowerCase() || '';
    const container = document.getElementById('troca-lista-estoque');
    if (!container) return;

    if (filtro.length < 2) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-muted);font-size:18px;">Digite pelo menos 2 letras para buscar...</p>';
        return;
    }

    const celulares = dataManager.getEstoqueCelulares().filter(p => (p.status === 'disponivel' || !p.status) && (p.nome.toLowerCase().includes(filtro)));
    const acessorios = dataManager.getEstoqueAcessorios().filter(p => (p.quantidade > 0) && (p.nome.toLowerCase().includes(filtro)));
    
    const todos = [...celulares.map(c => ({...c, _tipo:'cel'})), ...acessorios.map(a => ({...a, _tipo:'acess'}))];

    if (todos.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--accent-red);font-size:18px;">❌ Nenhum produto encontrado.</p>';
        return;
    }

    let html = '';
    todos.forEach(p => {
        html += `
        <div style="background:rgba(255,255,255,0.05);border:1px solid var(--border-color);border-radius:12px;padding:16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onclick="UI._vendedorTrocaConfirmar('${p.id}', '${p._tipo}')">
            <div>
                <div style="font-size:18px;font-weight:bold;color:#FFF;">${p._tipo==='cel'?'📱':'🎧'} ${p.nome}</div>
                <div style="font-size:14px;color:var(--text-muted);">Estoque: ${p.quantidade || 1}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:20px;font-weight:bold;color:#00d97e;">${UI.R(p.precoVenda)}</div>
                <span style="font-size:16px;color:#3b82f6;font-weight:bold;">Selecionar ➔</span>
            </div>
        </div>`;
    });
    container.innerHTML = html;
};

UI._vendedorTrocaConfirmar = function(novoProdutoId, tipo) {
    const ctx = UI._trocaContext;
    const vendaOriginal = dataManager.data.historico.vendas.find(v => String(v.id) === String(ctx.vendaId));
    const produtoDevolvido = vendaOriginal.produtos[ctx.produtoIdx];
    
    let produtoNovo;
    if (tipo === 'cel') produtoNovo = dataManager.getEstoqueCelulares().find(c => String(c.id) === String(novoProdutoId));
    else produtoNovo = dataManager.getEstoqueAcessorios().find(a => String(a.id) === String(novoProdutoId));

    if (!produtoNovo) return UI.toast('Produto não encontrado', 'error');

    ctx.produtoNovo = produtoNovo;
    ctx.tipoNovo = tipo;

    const valorDevolvido = parseFloat(produtoDevolvido.precoVenda || 0);
    const valorNovo = parseFloat(produtoNovo.precoVenda || 0);
    const diferenca = valorNovo - valorDevolvido;

    let txtDiferenca = '';
    let corDiferenca = '#FFF';
    if (diferenca > 0) {
        txtDiferenca = `O cliente precisa pagar: <strong>${UI.R(diferenca)}</strong>`;
        corDiferenca = '#ef4444';
    } else if (diferenca < 0) {
        txtDiferenca = `A loja precisa devolver: <strong>${UI.R(Math.abs(diferenca))}</strong>`;
        corDiferenca = '#f59e0b';
    } else {
        txtDiferenca = `Troca elas por elas (R$ 0,00)`;
        corDiferenca = '#00d97e';
    }

    document.getElementById('main-content').innerHTML = _vndWrap('trocar', `
        <div class="vendedor-step-header">
            <span class="vendedor-step-badge" style="background:#3b82f6">PASSO 5 DE 5</span>
            <h2 style="font-size:28px">🔄 CONFIRMAR TROCA</h2>
        </div>
        <div style="max-width:700px;margin:20px auto;background:rgba(0,0,0,0.2);padding:24px;border-radius:16px;border:1px solid #3b82f6;">
            <div style="display:flex;justify-content:space-between;margin-bottom:20px;align-items:center;">
                <div style="flex:1;text-align:center;">
                    <div style="color:var(--text-muted);font-size:14px;margin-bottom:8px;">PRODUTO DEVOLVIDO</div>
                    <div style="font-size:20px;color:#FFF;font-weight:bold;">${produtoDevolvido.nome}</div>
                    <div style="font-size:22px;color:#ef4444;margin-top:4px;">- ${UI.R(valorDevolvido)}</div>
                </div>
                <div style="font-size:32px;margin:0 20px;">➔</div>
                <div style="flex:1;text-align:center;">
                    <div style="color:var(--text-muted);font-size:14px;margin-bottom:8px;">PRODUTO NOVO</div>
                    <div style="font-size:20px;color:#FFF;font-weight:bold;">${produtoNovo.nome}</div>
                    <div style="font-size:22px;color:#00d97e;margin-top:4px;">+ ${UI.R(valorNovo)}</div>
                </div>
            </div>
            
            <div style="text-align:center;padding:16px;background:rgba(255,255,255,0.05);border-radius:12px;margin-top:20px;">
                <div style="font-size:26px;color:${corDiferenca};">${txtDiferenca}</div>
            </div>

            <div style="margin-top:24px;display:flex;gap:12px;">
                <button class="btn btn-ghost btn-lg" style="flex:1;font-size:18px;" onclick="UI._vendedorTrocaSelecionarNovoProduto('${ctx.vendaId}', ${ctx.produtoIdx})">Cancelar / Mudar</button>
                <button class="btn btn-primary btn-lg" style="flex:2;background:#3b82f6;border-color:#3b82f6;font-size:20px;font-weight:bold;" onclick="UI._vendedorTrocaFinalizar()">✅ CONFIRMAR TROCA</button>
            </div>
        </div>
    `);
};

UI._vendedorTrocaFinalizar = function() {
    const ctx = UI._trocaContext;
    const vendaOriginal = dataManager.data.historico.vendas.find(v => String(v.id) === String(ctx.vendaId));
    const produtoDevolvido = vendaOriginal.produtos[ctx.produtoIdx];
    const produtoNovo = ctx.produtoNovo;
    
    const valorDevolvido = parseFloat(produtoDevolvido.precoVenda || 0);
    const valorNovo = parseFloat(produtoNovo.precoVenda || 0);
    const diferenca = valorNovo - valorDevolvido;

    // 1. Marcar produto antigo como devolvido na venda original (ou add observação)
    vendaOriginal.obs = (vendaOriginal.obs ? vendaOriginal.obs + ' | ' : '') + `[TROCA] ${produtoDevolvido.nome} trocado por ${produtoNovo.nome}.`;
    
    // 2. Devolver item antigo ao estoque
    if (produtoDevolvido._tipo === 'cel' || (!produtoDevolvido._tipo && produtoDevolvido.imei)) {
        let estCell = dataManager.getEstoqueCelulares().find(c => String(c.id) === String(produtoDevolvido.id));
        if (estCell) {
            estCell.status = 'disponivel';
        } else {
            dataManager.getEstoqueCelulares().push({...produtoDevolvido, status: 'disponivel'});
        }
    } else {
        let estAcc = dataManager.getEstoqueAcessorios().find(a => String(a.id) === String(produtoDevolvido.id));
        if (estAcc) {
            estAcc.quantidade = (estAcc.quantidade || 0) + 1;
        } else {
            dataManager.getEstoqueAcessorios().push({...produtoDevolvido, quantidade: 1});
        }
    }

    // 3. Remover item novo do estoque
    if (ctx.tipoNovo === 'cel') {
        const c = dataManager.getEstoqueCelulares().find(x => String(x.id) === String(produtoNovo.id));
        if (c) c.status = 'vendido';
    } else {
        const a = dataManager.getEstoqueAcessorios().find(x => String(x.id) === String(produtoNovo.id));
        if (a) a.quantidade = Math.max(0, (a.quantidade || 1) - 1);
    }

    // 4. Registrar nova venda com a diferença se > 0 (ou só registro de troca)
    const novaVenda = {
        id: Date.now(),
        data: new Date().toISOString(),
        cliente: UI._clienteAtual?.nome || vendaOriginal.cliente,
        telefone: UI._clienteAtual?.telefone || vendaOriginal.telefone,
        produtos: [{...produtoNovo, precoVenda: valorNovo}],
        valorTotal: valorNovo,
        valorPago: valorNovo,
        desconto: 0,
        metodoPagamento: diferenca > 0 ? 'dinheiro' : 'troca',
        caixaDestino: 'caixaSecundario',
        vendedor: 'Atendente',
        obs: `[TROCA] Substituiu o item ${produtoDevolvido.nome} da venda ${vendaOriginal.id}. Diferença paga: R$ ${diferenca > 0 ? diferenca.toFixed(2) : '0.00'}`,
        lucro: (valorNovo - (produtoNovo.precoCusto || 0))
    };

    if (!dataManager.isModoTreino()) {
        dataManager.data.historico.vendas.push(novaVenda);
        
        // Registrar movimentação de caixa se houver diferença positiva
        if (diferenca > 0) {
            dataManager.data.financeiro.caixaSecundario += diferenca;
            dataManager.data.movimentacoesCaixa.push({
                id: Date.now(),
                data: new Date().toISOString(),
                tipo: 'entrada',
                valor: diferenca,
                descricao: `Diferença de Troca: ${produtoNovo.nome}`,
                caixaDestino: 'caixaSecundario',
                metodoPagamento: 'dinheiro',
                vendedor: 'Atendente'
            });
        }

        dataManager.saveData();
    }

    UI.toast('✅ Troca realizada com sucesso!', 'success');
    
    document.getElementById('main-content').innerHTML = _vndWrap('trocar', `
        <div style="text-align:center;padding:40px 0;">
            <div style="font-size:64px;margin-bottom:20px;">✅🔄</div>
            <h2 style="color:#00d97e;font-size:32px;font-weight:900;">TROCA FINALIZADA!</h2>
            <p style="font-size:20px;color:#FFF;margin-top:16px;">O estoque foi atualizado automaticamente.</p>
            ${diferenca > 0 ? `<div style="margin-top:20px;font-size:24px;color:#ef4444;font-weight:bold;">Receber do cliente: ${UI.R(diferenca)}</div>` : ''}
            ${diferenca < 0 ? `<div style="margin-top:20px;font-size:24px;color:#f59e0b;font-weight:bold;">Devolver ao cliente: ${UI.R(Math.abs(diferenca))}</div>` : ''}
            <div style="margin-top:40px;">
                <button class="btn btn-primary btn-lg" style="font-size:20px;padding:16px 32px;background:#3b82f6;border-color:#3b82f6;" onclick="UI.renderVendedor()">Voltar ao Início</button>
            </div>
        </div>
    `);
};
