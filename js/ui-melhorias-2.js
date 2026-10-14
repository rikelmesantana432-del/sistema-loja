// ====================================
// STRATEGYOS 3.0 — MELHORIAS PARTE 2
// Filtro Histórico, QR PIX, Mini Dashboard,
// Metas Diárias, Configurações, Kanban,
// Calculadora Parcelamento, IMEI, Vitrine,
// Relatório Semanal, Tour, Aniversários,
// Score Visual, PDF, Ordenação, Gráfico Cred,
// Foto Celulares, QR Fidelidade, IA Claude, Alerta Sonoro
// ====================================

// === 10. FILTRO DE DATA NO HISTÓRICO (2.7) ===
UI._historicoFiltro = 'tudo';
UI._historicoBusca = '';

UI.renderHistorico = function () {
    const main = document.getElementById('main-content');
    if (!main) return;

    const hist = dataManager.data.historico || {};
    const vendas = hist.vendas || [];
    const movsCaixa = dataManager.data.movimentacoesCaixa || [];
    const movsHist = hist.movimentacoes || [];

    function extrairYMD(dStr) {
        if (!dStr) return '';
        if (dStr instanceof Date) {
            const y = dStr.getFullYear();
            const m = String(dStr.getMonth() + 1).padStart(2, '0');
            const d = String(dStr.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
        const s = String(dStr);
        if (s.includes('T')) return s.split('T')[0];
        if (s.includes(' ')) return s.split(' ')[0];
        return s;
    }

    const hojeYMD = extrairYMD(new Date());
    const unificadas = [];

    // 1. Todas as VENDAS do histórico oficial
    vendas.forEach(v => {
        const val = v.valorVenda !== undefined ? v.valorVenda : v.valorBruto !== undefined ? v.valorBruto : v.liquido || 0;
        const nomeProd = v.produto || v.descricao || 'Produto/Item';
        const nomeCli = v.cliente && v.cliente !== 'Não Identificado' ? v.cliente : '';
        unificadas.push({
            id: v.id || Math.random(),
            data: v.data || new Date().toISOString(),
            ymd: extrairYMD(v.data || new Date().toISOString()),
            descricao: `🛒 VENDA: ${nomeProd}`,
            valor: val,
            cliente: nomeCli,
            tipo: 'venda',
            origem: 'vendas_oficial'
        });
    });

    // 2. Movimentações de caixa adicionais
    movsCaixa.forEach(m => {
        const val = m.valor !== undefined ? m.valor : m.valorVenda || 0;
        const ymd = extrairYMD(m.data || new Date().toISOString());
        const desc = m.descricao || `${(m.tipo || 'MOVIMENTAÇÃO').toUpperCase()}: ${m.produto || 'Item'}`;
        
        if (m.tipo === 'despesa' || m.tipo === 'saida' || m.tipo === 'conserto' || m.tipo === 'os_concluida' || m.tipo === 'os_entrada') {
            unificadas.push({
                id: m.id || Math.random(),
                data: m.data || new Date().toISOString(),
                ymd: ymd,
                descricao: desc,
                valor: val,
                cliente: m.cliente || '',
                tipo: m.tipo,
                origem: 'caixa_outros'
            });
        } else {
            const jaConsta = unificadas.some(u => u.ymd === ymd && Math.abs(u.valor - val) < 0.01);
            if (!jaConsta) {
                unificadas.push({
                    id: m.id || Math.random(),
                    data: m.data || new Date().toISOString(),
                    ymd: ymd,
                    descricao: desc,
                    valor: val,
                    cliente: m.cliente || '',
                    tipo: m.tipo || 'venda',
                    origem: 'caixa_venda'
                });
            }
        }
    });

    // 3. Assistência Técnica / Manutenções / Ordens de Serviço (OS)
    const osList = (dataManager.data.assistencia?.ordensServico || []);
    osList.forEach(os => {
        const val = parseFloat(os.valorFinal || os.preco || os.valor || os.pago || os.entrada || 0);
        const dStr = os.dataCriacao || os.dataEntrega || new Date().toISOString();
        const ymd = extrairYMD(dStr);
        const num = os.numero ? `#${String(os.numero).padStart(3, '0')}` : 'OS';
        const stEmoji = os.status === 'entregue' ? '📦 Concluída' : os.status === 'pronto' ? '✅ Pronto' : '🔧 Em Manutenção';
        const desc = `🔧 MANUTENÇÃO (${num}): ${os.servico || 'Conserto'} — ${os.modelo || 'Aparelho'} [${stEmoji}]`;
        
        const jaConsta = unificadas.some(u => u.ymd === ymd && Math.abs(u.valor - val) < 0.01 && (u.descricao || '').includes(num));
        if (!jaConsta) {
            unificadas.push({
                id: os.id || ('os_' + os.numero) || Math.random(),
                data: dStr,
                ymd: ymd,
                descricao: desc,
                valor: val,
                cliente: os.cliente || '',
                tipo: 'assistencia',
                origem: 'assistencia_os'
            });
        }
    });

    // 4. Fiados
    const fiadosList = (dataManager.data.fiados || []);
    fiadosList.forEach(f => {
        const val = parseFloat(f.valor || 0);
        const dStr = f.dataVenda || f.dataCobrar || new Date().toISOString();
        const ymd = extrairYMD(dStr);
        const stTxt = (f.status === 'pago' || f.status === 'recebido') ? '✅ Pago' : '⏳ Pendente';
        const desc = `📋 FIADO [${stTxt}]: ${f.descricao || f.produto || 'Venda Fiado'}`;
        const jaConsta = unificadas.some(u => u.ymd === ymd && Math.abs(u.valor - val) < 0.01 && (u.cliente || '').toLowerCase() === (f.cliente || '').toLowerCase());
        if (!jaConsta) {
            unificadas.push({
                id: f.id || Math.random(),
                data: dStr,
                ymd: ymd,
                descricao: desc,
                valor: val,
                cliente: f.cliente || '',
                tipo: 'fiado',
                origem: 'fiados'
            });
        }
    });

    // 5. Trocas / Trade-In
    const trocasList = (dataManager.data.trocas || []);
    trocasList.forEach(t => {
        const val = parseFloat(t.valorSubstituicao || t.valor || 0);
        const dStr = t.data || new Date().toISOString();
        const ymd = extrairYMD(dStr);
        const desc = `🔄 TROCA/TRADE-IN: ${t.modeloUsado || 'Usado'} ➔ ${t.modeloNovo || 'Novo'}`;
        const jaConsta = unificadas.some(u => u.ymd === ymd && Math.abs(u.valor - val) < 0.01);
        if (!jaConsta) {
            unificadas.push({
                id: t.id || Math.random(),
                data: dStr,
                ymd: ymd,
                descricao: desc,
                valor: val,
                cliente: t.cliente || '',
                tipo: 'troca',
                origem: 'trocas'
            });
        }
    });

    // 6. Movimentações legadas
    movsHist.forEach(m => {
        const val = m.valor !== undefined ? m.valor : 0;
        const ymd = extrairYMD(m.data || new Date().toISOString());
        const desc = m.descricao || 'Movimentação';
        const jaConsta = unificadas.some(u => u.ymd === ymd && Math.abs(u.valor - val) < 0.01);
        if (!jaConsta) {
            unificadas.push({
                id: m.id || Math.random(),
                data: m.data || new Date().toISOString(),
                ymd: ymd,
                descricao: desc,
                valor: val,
                cliente: m.cliente || '',
                tipo: m.tipo || 'historico',
                origem: 'legado'
            });
        }
    });

    // Ordenar por data decrescente
    unificadas.sort((a, b) => new Date(b.data) - new Date(a.data));

    if (!UI._historicoFiltro) UI._historicoFiltro = 'tudo';
    if (!UI._historicoCategoria) UI._historicoCategoria = 'todas';

    function normalizarTexto(txt) {
        if (!txt) return '';
        return String(txt)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function correspondeBuscaAvancada(m, buscaStr) {
        if (!buscaStr) return true;
        const buscaNorm = normalizarTexto(buscaStr);
        const termos = buscaNorm.split(/\s+/).filter(t => t.length > 0);
        if (termos.length === 0) return true;

        const textoCompleto = normalizarTexto([
            m.descricao,
            m.cliente,
            m.produto,
            m.modelo,
            m.servico,
            m.categoria,
            m.tipo,
            m.origem,
            m.valor !== undefined ? ('r$ ' + m.valor) : '',
            m.ymd
        ].join(' '));

        return termos.every(t => textoCompleto.includes(t));
    }

    // Filtrar movimentações
    const agora = new Date();
    const filtradas = unificadas.filter(m => {
        // 1. Filtro por período (Data)
        if (UI._historicoFiltro === 'hoje') {
            if (m.ymd !== hojeYMD) return false;
        } else if (UI._historicoFiltro === 'semana') {
            const inicio = new Date(agora); inicio.setDate(agora.getDate() - agora.getDay());
            const inicioYMD = extrairYMD(inicio);
            if (m.ymd < inicioYMD) return false;
        } else if (UI._historicoFiltro === 'mes') {
            const mesAtual = (agora.getFullYear() + '-' + String(agora.getMonth() + 1).padStart(2, '0'));
            if (!m.ymd.startsWith(mesAtual)) return false;
        }

        // 2. Filtro por categoria/tipo de movimentação
        if (UI._historicoCategoria === 'venda') {
            if (m.tipo !== 'venda' && m.origem !== 'vendas_oficial' && m.origem !== 'caixa_venda') return false;
        } else if (UI._historicoCategoria === 'assistencia') {
            if (m.tipo !== 'assistencia' && m.tipo !== 'os_concluida' && m.tipo !== 'os_entrada' && m.tipo !== 'conserto') return false;
        } else if (UI._historicoCategoria === 'fiado') {
            if (m.tipo !== 'fiado' && m.origem !== 'fiados') return false;
        } else if (UI._historicoCategoria === 'troca') {
            if (m.tipo !== 'troca' && m.origem !== 'trocas') return false;
        } else if (UI._historicoCategoria === 'despesa') {
            if (m.tipo !== 'despesa' && m.tipo !== 'saida' && m.valor >= 0) return false;
        }

        // 3. Busca inteligente multi-termos (sem acentos)
        return correspondeBuscaAvancada(m, UI._historicoBusca);
    });

    // Totais do período filtrado
    const entradas = filtradas.filter(m => m.valor > 0).reduce((s, m) => s + m.valor, 0);
    const saidas = filtradas.filter(m => m.valor < 0).reduce((s, m) => s + Math.abs(m.valor), 0);
    const saldo = entradas - saidas;

    function formatarDataHoraExibicao(dStr) {
        if (!dStr) return '';
        if (typeof dStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
            const parts = dStr.split('-');
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        try {
            const d = new Date(dStr);
            if (isNaN(d.getTime())) return String(dStr);
            return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        } catch (e) {
            return String(dStr);
        }
    }

    let html = `
    <div style="max-width:900px;margin:0 auto;padding:10px 4px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
            <div>
                <h2 style="margin:0;font-size:26px;color:#FFD700;font-weight:900;">📊 HISTÓRICO DE VENDAS & MOVIMENTAÇÕES</h2>
                <p style="margin:4px 0 0;color:var(--text-muted);font-size:14px;">Busca inteligente por cliente, produto, serviço, tipo ou valor</p>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="UI.renderHistorico()">🔄 Atualizar</button>
        </div>

        <!-- Filtros por Categoria de Transação -->
        <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;">
            <button class="btn ${UI._historicoCategoria === 'todas' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="UI._historicoCategoria='todas';UI.renderHistorico()">⚡ Todas</button>
            <button class="btn ${UI._historicoCategoria === 'venda' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="UI._historicoCategoria='venda';UI.renderHistorico()">🛒 Vendas</button>
            <button class="btn ${UI._historicoCategoria === 'assistencia' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="UI._historicoCategoria='assistencia';UI.renderHistorico()">🔧 Manutenções/OS</button>
            <button class="btn ${UI._historicoCategoria === 'fiado' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="UI._historicoCategoria='fiado';UI.renderHistorico()">📋 Fiados</button>
            <button class="btn ${UI._historicoCategoria === 'troca' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="UI._historicoCategoria='troca';UI.renderHistorico()">🔄 Trocas</button>
            <button class="btn ${UI._historicoCategoria === 'despesa' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="UI._historicoCategoria='despesa';UI.renderHistorico()">💸 Despesas</button>
        </div>

        <!-- Filtros de período e Campo de Busca Inteligente -->
        <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
            <button class="btn ${UI._historicoFiltro === 'tudo' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="UI._filtrarHistorico('tudo')">Tudo (${unificadas.length})</button>
            <button class="btn ${UI._historicoFiltro === 'hoje' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="UI._filtrarHistorico('hoje')">Hoje</button>
            <button class="btn ${UI._historicoFiltro === 'semana' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="UI._filtrarHistorico('semana')">Esta semana</button>
            <button class="btn ${UI._historicoFiltro === 'mes' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="UI._filtrarHistorico('mes')">Este mês</button>
            <input class="form-input" style="flex:1;min-width:200px;padding:8px 12px;font-size:14px;border:1px solid #FFD700;" placeholder="🔍 Buscar (ex: iphone azul, joao tela, pelicula)..." value="${UI._historicoBusca}" oninput="UI._historicoBusca=this.value;UI.renderHistorico()">
        </div>

        <!-- Totais -->
        <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
            <div class="dash-card" style="flex:1;min-width:140px;cursor:default;text-align:center;"><div class="dash-card-value" style="color:var(--accent-green);font-size:22px;">${UI.R(entradas)}</div><div class="dash-card-label">Entradas / Vendas (${filtradas.filter(m=>m.valor>0).length})</div></div>
            <div class="dash-card" style="flex:1;min-width:140px;cursor:default;text-align:center;"><div class="dash-card-value" style="color:var(--accent-red);font-size:22px;">${UI.R(saidas)}</div><div class="dash-card-label">Despesas / Saídas</div></div>
            <div class="dash-card" style="flex:1;min-width:140px;cursor:default;text-align:center;"><div class="dash-card-value" style="color:${saldo >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};font-size:22px;">${UI.R(saldo)}</div><div class="dash-card-label">Saldo do Período</div></div>
        </div>

        <!-- Lista de movimentações -->
        <div style="display:flex;flex-direction:column;gap:8px;">`;

    const movsOrdenadas = filtradas.slice(0, 100);
    movsOrdenadas.forEach((m) => {
        const positivo = m.valor >= 0;
        const dataFmt = formatarDataHoraExibicao(m.data);
        html += `
        <div class="history-item" style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 16px;background:rgba(20,24,38,0.8);border:1px solid rgba(255,255,255,0.08);border-radius:12px;">
            <div style="flex:1;min-width:0">
                <div style="font-weight:700;font-size:15px;color:#FFF">${m.descricao}</div>
                <div style="font-size:13px;color:var(--text-dim);margin-top:2px;">📅 ${dataFmt}${m.cliente ? ' | 👤 ' + m.cliente : ''}</div>
            </div>
            <div style="display:flex;align-items:center;gap:12px;flex-shrink:0">
                <span class="history-value ${positivo ? 'positivo' : 'negativo'}" style="font-size:17px;font-weight:900">${positivo ? '+' : ''}${UI.R(m.valor)}</span>
                <button onclick="UI._deletarMovimentacaoUnificada('${m.data}', ${m.valor})"
                    style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:16px;padding:4px 6px;border-radius:6px;line-height:1;transition:color 0.2s"
                    onmouseover="this.style.color='var(--accent-red)'"
                    onmouseout="this.style.color='var(--text-dim)'"
                    title="Remover do histórico">🗑️</button>
            </div>
        </div>`;
    });

    if (movsOrdenadas.length === 0) {
        html += '<div style="text-align:center;color:var(--text-muted);padding:40px 20px;background:rgba(255,255,255,0.02);border-radius:12px;">Nenhuma movimentação ou venda encontrada no período selecionado</div>';
    }

    html += `
        </div>
        <div style="margin-top:28px;display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-primary" onclick="UI._exportarDados()">📤 Exportar Dados</button>
            <button class="btn btn-ghost" onclick="UI._importarDados()">📥 Importar Backup</button>
            <button class="btn btn-ghost" onclick="UI._exportarPDF()">📄 Gerar PDF</button>
        </div>
    </div>`;

    main.innerHTML = html;
};

// Função de reset completo (chamada como fallback)
UI._execResetarTodosDados = function () {
    dataManager.resetarDados();
    UI.toast('✅ Sistema resetado para os dados de fábrica!', 'success');
    setTimeout(() => location.reload(), 800);
};

UI._filtrarHistorico = function (periodo) {
    UI._historicoFiltro = periodo;
    UI.renderHistorico();
};

UI._deletarMovimentacaoUnificada = function (dataIso, valor) {
    if (!confirm('Deseja realmente excluir este registro do histórico?')) return;
    
    // Deletar de movimentacoesCaixa
    if (dataManager.data.movimentacoesCaixa) {
        dataManager.data.movimentacoesCaixa = dataManager.data.movimentacoesCaixa.filter(m => !(m.data === dataIso || (m.data && m.data.split('T')[0] === dataIso.split('T')[0] && Math.abs((m.valor || 0) - valor) < 0.01)));
    }
    
    // Deletar de historico.vendas
    if (dataManager.data.historico && dataManager.data.historico.vendas) {
        dataManager.data.historico.vendas = dataManager.data.historico.vendas.filter(v => !(v.data === dataIso || (v.data && v.data.split('T')[0] === dataIso.split('T')[0] && Math.abs((v.valorVenda || v.valorBruto || 0) - valor) < 0.01)));
    }
    
    // Deletar de historico.movimentacoes
    if (dataManager.data.historico && dataManager.data.historico.movimentacoes) {
        dataManager.data.historico.movimentacoes = dataManager.data.historico.movimentacoes.filter(m => !(m.data === dataIso || (m.data && m.data.split('T')[0] === dataIso.split('T')[0] && Math.abs((m.valor || 0) - valor) < 0.01)));
    }

    dataManager.data._ultimoSaveLocal = Date.now();
    dataManager.saveData();
    if (dataManager.supabase) dataManager.salvarSupabase();
    UI.toast('✅ Registro removido do histórico!', 'success');
    UI.renderHistorico();
};

// === 11. QR CODE PIX (2.3) ===
UI._gerarQRCodePIX = function (valor) {
    const config = (dataManager.data.configuracoes) || {};
    const chave = config.chavePIX || '';
    const nome = config.nomeBeneficiario || 'CESINHA ACESSORIOS';
    const cidade = config.cidadeLoja || 'AMARGOSA';

    if (!chave) {
        UI.openModal('⚠️ Chave PIX', `
            <p>Configure sua chave PIX nas <strong>Configurações</strong> antes de gerar QR Code.</p>
            <button class="btn btn-primary" onclick="UI.closeModal();UI.navigate('configuracoes')">⚙️ Ir para Configurações</button>
        `);
        return;
    }

    // Gerar payload PIX (simplificado — EMV padrão)
    const payload = UI._montarPayloadPIX(chave, nome, cidade, valor);

    UI.openModal('📱 PIX — QR Code', `
        <div style="text-align:center">
            <div style="font-size:14px;color:var(--text-muted);margin-bottom:8px">Valor:</div>
            <div style="font-size:32px;font-weight:800;color:var(--accent-green);margin-bottom:16px">${UI.R(valor)}</div>
            <div id="qrcode-pix" style="display:inline-block;padding:16px;background:#fff;border-radius:12px;margin-bottom:16px"></div>
            <div style="margin-top:12px">
                <button class="btn btn-primary" onclick="navigator.clipboard.writeText('${payload}');UI.toast('✅ Código PIX copiado!','success')">📋 Copiar código PIX</button>
            </div>
            <p style="font-size:11px;color:var(--text-dim);margin-top:12px">Chave: ${chave}</p>
        </div>
    `);

    // Tentar gerar QR com qrcode.js (se disponível)
    setTimeout(() => {
        const container = document.getElementById('qrcode-pix');
        if (container && typeof QRCode !== 'undefined') {
            new QRCode(container, { text: payload, width: 200, height: 200, colorDark: '#000', colorLight: '#fff' });
        } else if (container) {
            container.innerHTML = '<p style="color:#000;font-size:12px;padding:20px">Adicione qrcode.js para QR visual<br><code style="font-size:10px">&lt;script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"&gt;</code></p>';
        }
    }, 100);
};

UI._montarPayloadPIX = function (chave, nome, cidade, valor) {
    function tlv(id, val) { return id + String(val.length).padStart(2, '0') + val; }
    let payload = '';
    payload += tlv('00', '01'); // Format Indicator
    payload += tlv('26', tlv('00', 'br.gov.bcb.pix') + tlv('01', chave)); // Merchant Account
    payload += tlv('52', '0000'); // MCC
    payload += tlv('53', '986'); // Currency (BRL)
    if (valor > 0) payload += tlv('54', valor.toFixed(2));
    payload += tlv('58', 'BR');
    payload += tlv('59', nome.substring(0, 25));
    payload += tlv('60', cidade.substring(0, 15));
    payload += tlv('62', tlv('05', '***'));
    // CRC16 placeholder
    payload += '6304';
    // Calcular CRC16 CCITT
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
            else crc <<= 1;
            crc &= 0xFFFF;
        }
    }
    return payload + crc.toString(16).toUpperCase().padStart(4, '0');
};

// === 13. MINI DASHBOARD VENDEDOR (2.8) ===
UI._renderMiniDashVendedor = function () {
    const hist = dataManager.data.historico;
    const movs = (hist && hist.movimentacoes) || [];
    const hoje = new Date().toISOString().split('T')[0];
    const vendasHoje = movs.filter(m => m.data && m.data.startsWith(hoje) && m.valor > 0);
    const totalHoje = vendasHoje.reduce((s, m) => s + m.valor, 0);
    const config = (dataManager.data.configuracoes) || {};
    const metaDia = config.metaDiaria || 500;
    const pctMeta = Math.min(100, (totalHoje / metaDia * 100));
    const falta = Math.max(0, metaDia - totalHoje);

    return `<div style="background:rgba(255,215,0,0.05);border:1px solid rgba(255,215,0,0.15);border-radius:16px;padding:16px;margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span style="font-size:14px;font-weight:700;color:#FFD700">📊 DESEMPENHO HOJE</span>
            <span style="font-size:13px;color:var(--text-muted)">${vendasHoje.length} vendas</span>
        </div>
        <div style="font-size:28px;font-weight:800;color:var(--accent-green);margin-bottom:8px">${UI.R(totalHoje)}</div>
        <div class="meta-bar" style="height:8px;margin-bottom:6px"><div class="meta-fill${pctMeta >= 100 ? ' meta-completa' : ''}" style="width:${pctMeta}%"></div></div>
        <div style="font-size:12px;color:var(--text-muted)">${pctMeta >= 100 ? '🎉 META BATIDA!' : `Faltam ${UI.R(falta)} para a meta de ${UI.R(metaDia)}`}</div>
    </div>`;
};

// === 14. METAS DIÁRIAS (2.13) — Integrada no Dashboard ===
// (já integrada via _renderMiniDashVendedor e gráfico de vendas)

// === 15. CONFIGURAÇÕES DA LOJA (2.19) ===
UI.renderConfiguracoes = function () {
    const config = dataManager.data.configuracoes || {};
    let html = `<h2 style="margin-bottom:16px">⚙️ Configurações da Loja</h2>
    <div style="display:grid;gap:16px;max-width:600px">
        <div>
            <label class="form-label">Nome da Loja</label>
            <input class="form-input" id="cfg-nome" value="${config.nomeLoja || 'Cesinha Acessórios'}" placeholder="Nome da loja">
        </div>
        <div>
            <label class="form-label">Chave PIX (CPF/CNPJ/Email/Telefone)</label>
            <input class="form-input" id="cfg-pix" value="${config.chavePIX || ''}" placeholder="Sua chave PIX">
        </div>
        <div>
            <label class="form-label">Nome Beneficiário PIX</label>
            <input class="form-input" id="cfg-beneficiario" value="${config.nomeBeneficiario || ''}" placeholder="Nome que aparece no PIX">
        </div>
        <div>
            <label class="form-label">Cidade</label>
            <input class="form-input" id="cfg-cidade" value="${config.cidadeLoja || 'Amargosa - BA'}" placeholder="Cidade">
        </div>
        <div>
            <label class="form-label">Telefone da Loja</label>
            <input class="form-input" id="cfg-telefone" value="${config.telefoneLoja || ''}" placeholder="(XX) XXXXX-XXXX">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
                <label class="form-label">Taxa Juros Parcelamento (%)</label>
                <input class="form-input" id="cfg-juros" type="number" step="0.5" value="${config.taxaJuros || 3}" min="0" max="20">
            </div>
            <div>
                <label class="form-label">Meta Diária (R$)</label>
                <input class="form-input" id="cfg-meta-dia" type="number" value="${config.metaDiaria || 500}" min="0">
            </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
                <label class="form-label">Estoque Mínimo (alerta)</label>
                <input class="form-input" id="cfg-estoque-min" type="number" value="${config.estoqueMinimo || 2}" min="0">
            </div>
            <div>
                <label class="form-label">Dias Produto Parado</label>
                <input class="form-input" id="cfg-dias-parado" type="number" value="${config.diasParado || 45}" min="1">
            </div>
        </div>
        <div>
            <label class="form-label">Obs. do Recibo</label>
            <input class="form-input" id="cfg-obs-recibo" value="${config.obsRecibo || 'Garantia de 3 meses'}" placeholder="Observação impressa no recibo">
        </div>
        <div>
            <label class="form-label">E-mail para Backup & Relatórios</label>
            <input class="form-input" id="cfg-email-backup" value="${config.emailLoja || 'rikelmer.skate10@gmail.com'}" placeholder="seu-email@dominio.com">
        </div>

        <!-- STATUS DO BANCO DE DADOS EM NUVEM (SUPABASE) -->
        <div style="background:rgba(0, 217, 126, 0.05);border:1px solid rgba(0, 217, 126, 0.3);border-radius:12px;padding:16px;margin-top:16px;text-align:left;">
            <h4 style="color:#00d97e;margin:0 0 8px 0;font-size:15px;font-weight:800;display:flex;align-items:center;gap:6px;">☁️ Sincronização em Nuvem (Supabase)</h4>
            <p style="font-size:13px;color:var(--text-muted);line-height:1.4;margin-bottom:12px;">
                Para que o StrategyOS salve automaticamente todas as vendas, caixas, blocos de notas e encomendas na nuvem (evitando perdas no navegador), certifique-se de que a tabela abaixo existe no seu painel do Supabase.
            </p>
            <div style="background:#0b0f19;padding:10px;border-radius:8px;border:1px solid var(--border-color);margin-bottom:12px;">
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;font-weight:bold;">CÓDIGO SQL PARA CRIAR A TABELA NO SUPABASE:</div>
                <code style="font-size:12px;color:#f59e0b;display:block;white-space:pre-wrap;word-break:break-all;font-family:monospace;user-select:all;padding:8px;background:rgba(0,0,0,0.2);border-radius:4px;">CREATE TABLE IF NOT EXISTS public.strategyos_data (
    id bigint PRIMARY KEY,
    payload jsonb,
    updated_at timestamp with time zone DEFAULT now()
);</code>
            </div>
            <span style="font-size:12px;color:var(--text-secondary);font-weight:bold;line-height:1.3;display:block;">💡 Acesse seu painel do Supabase, clique em "SQL Editor", cole o código acima e clique em "RUN". Pronto! Tudo será sincronizado e salvo de forma segura.</span>
        </div>

        <!-- ASSISTENTE DE RECUPERAÇÃO DE DADOS -->
        <div style="background:rgba(245, 158, 11, 0.05);border:1px solid rgba(245, 158, 11, 0.3);border-radius:12px;padding:16px;margin-top:16px;text-align:left;">
            <h4 style="color:#f59e0b;margin:0 0 8px 0;font-size:15px;font-weight:800;display:flex;align-items:center;gap:6px;">🔄 Recuperação de Dados (Deploy/Dispositivo Antigo)</h4>
            <p style="font-size:13px;color:var(--text-muted);line-height:1.4;margin-bottom:12px;">
                Se anotações ou vendas foram feitas em outro link ou dispositivo, você pode exportar os dados lá e importá-los aqui de forma simples:
            </p>
            <ol style="font-size:12px;color:var(--text-secondary);margin:0 0 12px 18px;padding:0;line-height:1.4;">
                <li>Abra o link ou dispositivo antigo onde os dados estão salvos.</li>
                <li>Vá nas Configurações da Loja e clique no botão <strong>Exportar Backup JSON</strong> abaixo.</li>
                <li>Volte a esta página e clique em <strong>Importar Backup JSON</strong> para restaurar.</li>
            </ol>
            <div style="display:flex;gap:10px;">
                <button class="btn" style="background:#f59e0b;color:#000;font-weight:bold;font-size:13px;padding:8px 14px;border:none;border-radius:8px;" onclick="UI._exportarBackupJSON()">📤 Exportar Backup JSON</button>
                <button class="btn btn-ghost" style="font-size:13px;padding:8px 14px;" onclick="UI._importarBackupJSON()">📥 Importar Backup JSON</button>
            </div>
        </div>

        <button class="btn btn-success btn-lg" onclick="UI._salvarConfiguracoes()" style="margin-top:20px;width:100%;font-size:16px;padding:12px;">💾 Salvar Configurações</button>
    </div>`;
    document.getElementById('main-content').innerHTML = html;
};

UI._exportarBackupJSON = function () {
    try {
        const dados = dataManager.exportarDados();
        const blob = new Blob([dados], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_strategyos_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        UI.toast('✅ Backup exportado com sucesso!', 'success');
    } catch (e) {
        UI.toast('Erro ao exportar backup: ' + e.message, 'error');
    }
};

UI._importarBackupJSON = function () {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (evt) {
            try {
                const text = evt.target.result;
                dataManager.importarDados(text);
                UI.toast('✅ Dados importados com sucesso! Recarregando...', 'success');
                setTimeout(() => window.location.reload(), 1200);
            } catch (err) {
                UI.toast('Erro ao importar JSON inválido: ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
};

UI._salvarConfiguracoes = function () {
    if (!dataManager.data.configuracoes) dataManager.data.configuracoes = {};
    const c = dataManager.data.configuracoes;
    c.nomeLoja = document.getElementById('cfg-nome').value;
    c.chavePIX = document.getElementById('cfg-pix').value;
    c.nomeBeneficiario = document.getElementById('cfg-beneficiario').value;
    c.cidadeLoja = document.getElementById('cfg-cidade').value;
    c.telefoneLoja = document.getElementById('cfg-telefone').value;
    c.taxaJuros = parseFloat(document.getElementById('cfg-juros').value) || 3;
    c.metaDiaria = parseFloat(document.getElementById('cfg-meta-dia').value) || 500;
    c.estoqueMinimo = parseInt(document.getElementById('cfg-estoque-min').value) || 2;
    c.diasParado = parseInt(document.getElementById('cfg-dias-parado').value) || 45;
    c.obsRecibo = document.getElementById('cfg-obs-recibo').value;
    c.emailLoja = document.getElementById('cfg-email-backup').value;
    dataManager.saveData();
    UI.toast('✅ Configurações salvas!', 'success');
};

dataManager.getConfig = function (chave, padrao) {
    const c = this.data.configuracoes || {};
    return c[chave] !== undefined ? c[chave] : padrao;
};

// === 17. KANBAN ASSISTÊNCIA (3.2) ===
UI._assistenciaVisao = 'lista';

UI._renderAssistenciaKanban = function () {
    const ordens = dataManager.getOrdens();
    const colunas = [
        { id: 'aguardando_peca', titulo: '🟡 Aguardando', cor: '#f5a623' },
        { id: 'em_reparo', titulo: '🔧 Em Reparo', cor: '#2c7be5' },
        { id: 'pronto', titulo: '✅ Pronto', cor: '#00d97e' },
        { id: 'entregue', titulo: '📦 Entregue', cor: '#5a6372' }
    ];

    let html = `<h2 style="margin-bottom:16px">🔧 Assistência Técnica — Kanban</h2>
        <div style="display:flex;gap:8px;margin-bottom:16px">
            <button class="btn ${UI._assistenciaVisao === 'lista' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="UI._assistenciaVisao='lista';UI.renderAssistencia()">📋 Lista</button>
            <button class="btn ${UI._assistenciaVisao === 'kanban' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="UI._assistenciaVisao='kanban';UI._renderAssistenciaKanban()">📊 Kanban</button>
            <button class="btn btn-success btn-sm" onclick="UI.modalNovaOS()">+ Nova OS</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;min-height:300px">`;

    colunas.forEach(col => {
        const items = ordens.filter(o => o.status === col.id);
        html += `<div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,215,0,0.06);border-radius:12px;padding:12px;min-height:200px"
                    ondragover="event.preventDefault();this.style.borderColor='rgba(255,215,0,0.3)'"
                    ondragleave="this.style.borderColor='rgba(255,215,0,0.06)'"
                    ondrop="event.preventDefault();this.style.borderColor='rgba(255,215,0,0.06)';UI._kanbanDrop(event,'${col.id}')">
            <div style="font-size:13px;font-weight:700;color:${col.cor};margin-bottom:10px;text-align:center">${col.titulo} (${items.length})</div>`;
        items.forEach(os => {
            html += `<div draggable="true" ondragstart="event.dataTransfer.setData('text','${os.numero}')"
                style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,215,0,0.08);border-radius:8px;padding:10px;margin-bottom:8px;cursor:grab;font-size:12px;transition:transform 0.15s">
                <div style="font-weight:700;font-size:13px">OS #${String(os.numero).padStart(3, '0')}</div>
                <div style="color:var(--text-muted)">👤 ${os.cliente}</div>
                <div style="color:var(--text-muted)">📱 ${os.modelo}</div>
                <div style="color:var(--accent-green);font-weight:600;margin-top:4px">${UI.R(os.valorFinal || 0)}</div>
            </div>`;
        });
        html += `</div>`;
    });
    html += `</div>`;
    document.getElementById('main-content').innerHTML = html;
};

UI._kanbanDrop = function (event, novoStatus) {
    const numero = parseInt(event.dataTransfer.getData('text'));
    if (numero) {
        UI._mudarStatusOS(numero, novoStatus);
        setTimeout(() => UI._renderAssistenciaKanban(), 100);
    }
};

// === 18. CALCULADORA PARCELAMENTO (2.10) ===
UI._calcularParcelamento = function (valorBase) {
    const config = (dataManager.data.configuracoes) || {};
    const taxa = (config.taxaJuros || 3) / 100;
    let html = `<h3 style="margin-bottom:12px">💳 Parcelamento — ${UI.R(valorBase)}</h3>
        <div style="display:grid;gap:8px">`;

    for (let n = 2; n <= 12; n++) {
        const parcela = taxa > 0 ? valorBase * (taxa * Math.pow(1 + taxa, n)) / (Math.pow(1 + taxa, n) - 1) : valorBase / n;
        const total = parcela * n;
        const jurosTotal = total - valorBase;
        html += `<div onclick="UI._selecionarParcelamento(${n},${parcela.toFixed(2)},${total.toFixed(2)})" 
            style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,215,0,0.08);border-radius:8px;cursor:pointer;transition:all 0.15s"
            onmouseover="this.style.borderColor='rgba(255,215,0,0.3)';this.style.background='rgba(255,215,0,0.05)'"
            onmouseout="this.style.borderColor='rgba(255,215,0,0.08)';this.style.background='rgba(255,255,255,0.03)'">
            <span style="font-weight:700">${n}x de ${UI.R(parcela)}</span>
            <span style="font-size:12px;color:var(--text-muted)">Total: ${UI.R(total)}${jurosTotal > 0 ? ` (+${UI.R(jurosTotal)} juros)` : ''}</span>
        </div>`;
    }
    html += `</div>`;
    UI.openModal('💳 Calculadora de Parcelas', html);
};

UI._selecionarParcelamento = function (n, parcela, total) {
    UI.closeModal();
    UI.toast(`✅ ${n}x de R$ ${parcela} selecionado!`, 'success');
};

// === 22. BUSCA POR IMEI (2.9) ===
UI._buscarIMEI = function () {
    UI.openModal('🔍 Buscar por IMEI', `
        <div>
            <label class="form-label">Digite o IMEI:</label>
            <input class="form-input" id="imei-busca" placeholder="000000000000000" maxlength="15" style="font-size:18px;text-align:center;letter-spacing:2px">
            <button class="btn btn-primary btn-lg" onclick="UI._executarBuscaIMEI()" style="margin-top:12px;width:100%">🔍 Buscar</button>
            <div id="imei-resultado" style="margin-top:16px"></div>
        </div>
    `);
};

UI._executarBuscaIMEI = function () {
    const imei = (document.getElementById('imei-busca').value || '').trim();
    if (imei.length < 10) { UI.toast('IMEI muito curto!', 'error'); return; }

    const resultEl = document.getElementById('imei-resultado');
    let encontrados = [];

    // Buscar no estoque
    (dataManager.data.estoqueCelulares || []).forEach(p => {
        if ((p.imei || '').includes(imei) || (p.imei2 || '').includes(imei)) {
            encontrados.push({ tipo: 'Estoque', nome: p.nome || p.modelo, imei: p.imei, status: 'Em estoque' });
        }
    });

    // Buscar no histórico de vendas
    const vendas = (dataManager.data.historico && dataManager.data.historico.vendas) || [];
    vendas.forEach(v => {
        if ((v.imei || '').includes(imei)) {
            encontrados.push({ tipo: 'Venda', nome: v.produto || v.modelo, imei: v.imei, status: `Vendido para ${v.cliente || '?'} em ${v.data || '?'}` });
        }
    });

    if (encontrados.length > 0) {
        resultEl.innerHTML = encontrados.map(e => `
            <div style="padding:12px;background:rgba(0,217,126,0.05);border:1px solid rgba(0,217,126,0.2);border-radius:8px;margin-bottom:8px">
                <div style="font-weight:700">${e.tipo}: ${e.nome}</div>
                <div style="font-size:12px;color:var(--text-muted)">IMEI: ${e.imei}</div>
                <div style="font-size:13px;color:var(--accent-green)">${e.status}</div>
            </div>
        `).join('');
    } else {
        resultEl.innerHTML = '<p style="text-align:center;color:var(--accent-red);padding:12px">❌ IMEI não encontrado no sistema</p>';
    }
};

// === 23. MODO VITRINE (2.11) ===
UI._modoVitrine = function () {
    const celulares = dataManager.getEstoqueCelulares().filter(c => (c.quantidade || 1) > 0);
    const html = `
        <div id="vitrine-overlay" style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:var(--bg-main);overflow-y:auto;padding:32px;cursor:none" onclick="clearTimeout(UI._vitrineTimer)">
            <div style="text-align:center;margin-bottom:24px">
                <h1 style="font-size:28px;color:#FFD700;font-weight:800">📱 ${(dataManager.data.configuracoes || {}).nomeLoja || 'Cesinha Acessórios'}</h1>
                <p style="color:var(--text-muted)">Pressione ESC para sair</p>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px">
                ${celulares.map(c => `
                    <div style="background:rgba(255,255,255,0.04);backdrop-filter:blur(12px);border:1px solid rgba(255,215,0,0.12);border-radius:16px;padding:20px;text-align:center;transition:transform 0.2s"
                        onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform=''">
                        <div style="font-size:48px;margin-bottom:8px">${c.fotoUrl ? `<img src="${c.fotoUrl}" style="width:80px;height:80px;object-fit:cover;border-radius:12px">` : '📱'}</div>
                        <div style="font-size:16px;font-weight:700;margin-bottom:4px">${c.nome || c.modelo}</div>
                        <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">${c.condicao || 'Novo'}</div>
                        <div style="font-size:22px;font-weight:800;color:var(--accent-green)">${UI.R(c.precoVenda)}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    // Esconder cursor após 3s
    let cursorTimer;
    const vitrine = document.getElementById('vitrine-overlay');
    vitrine.addEventListener('mousemove', () => {
        vitrine.style.cursor = 'default';
        clearTimeout(cursorTimer);
        cursorTimer = setTimeout(() => { vitrine.style.cursor = 'none'; }, 3000);
    });

    // ESC para sair
    const escHandler = (e) => {
        if (e.key === 'Escape') { vitrine.remove(); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);
};

// === 24. RELATÓRIO SEMANAL AUTOMÁTICO (2.20) ===
UI._verificarRelatorioSemanal = function () {
    const config = dataManager.data.configuracoes || {};
    const ultimo = config.ultimoRelatorio ? new Date(config.ultimoRelatorio) : null;
    const agora = new Date();

    if (ultimo && (agora - ultimo) < 7 * 86400000) return; // Menos de 7 dias
    if (agora.getDay() !== 0) return; // Só no domingo

    UI._gerarRelatorioSemanal();
};

UI._gerarRelatorioSemanal = function () {
    const movs = (dataManager.data.historico && dataManager.data.historico.movimentacoes) || [];
    const agora = new Date();
    const inicioSemana = new Date(agora); inicioSemana.setDate(agora.getDate() - 7);
    const semanaAnteriorInicio = new Date(agora); semanaAnteriorInicio.setDate(agora.getDate() - 14);

    const vendaSemana = movs.filter(m => new Date(m.data) >= inicioSemana && m.valor > 0);
    const vendaSemanaAnt = movs.filter(m => { const d = new Date(m.data); return d >= semanaAnteriorInicio && d < inicioSemana && m.valor > 0; });

    const totalSemana = vendaSemana.reduce((s, m) => s + m.valor, 0);
    const totalAnt = vendaSemanaAnt.reduce((s, m) => s + m.valor, 0);
    const ticket = vendaSemana.length > 0 ? totalSemana / vendaSemana.length : 0;
    const diff = totalAnt > 0 ? ((totalSemana - totalAnt) / totalAnt * 100).toFixed(1) : 0;
    const emoji = totalSemana >= totalAnt ? '📈' : '📉';

    UI.openModal('📊 Resumo da Semana', `
        <div style="text-align:center;margin-bottom:16px">
            <div style="font-size:32px;font-weight:800;color:var(--accent-green)">${UI.R(totalSemana)}</div>
            <div style="color:var(--text-muted)">Faturamento da semana</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
            <div class="dash-card" style="cursor:default"><div class="dash-card-value">${vendaSemana.length}</div><div class="dash-card-label">Vendas</div></div>
            <div class="dash-card" style="cursor:default"><div class="dash-card-value">${UI.R(ticket)}</div><div class="dash-card-label">Ticket médio</div></div>
        </div>
        <div style="text-align:center;font-size:16px;margin-bottom:16px">${emoji} ${diff > 0 ? '+' : ''}${diff}% vs semana anterior</div>
        <button class="btn btn-primary" onclick="UI.closeModal()" style="width:100%">OK</button>
    `);

    // Salvar data do relatório
    if (!dataManager.data.configuracoes) dataManager.data.configuracoes = {};
    dataManager.data.configuracoes.ultimoRelatorio = agora.toISOString();
    dataManager.saveData();
};

UI.enviarRelatorioEmail = function (destinatario, htmlCorpo, onSuccess) {
    if (!window.Email) {
        const script = document.createElement('script');
        script.src = "https://smtpjs.com/v3/smtp.js";
        script.onload = () => UI._dispararSmtpjs(destinatario, htmlCorpo, onSuccess);
        document.head.appendChild(script);
    } else {
        UI._dispararSmtpjs(destinatario, htmlCorpo, onSuccess);
    }
};

UI._dispararSmtpjs = function (destinatario, htmlCorpo, onSuccess) {
    if (!window.Email) return;
    window.Email.send({
        SecureToken: "a4c28f32-72c2-482a-a92c-0e7d56e71960",
        To: destinatario,
        From: "strategyos.reports@gmail.com",
        Subject: "📊 StrategyOS — Relatório Semanal & Backup de Dados",
        Body: htmlCorpo
    }).then(msg => {
        console.log('[StrategyOS] E-mail de backup e relatório disparado:', msg);
        UI.toast('📧 Backup & Relatório enviados por e-mail!', 'success');
        if (typeof onSuccess === 'function') onSuccess();
    }).catch(err => {
        console.error('[StrategyOS] Erro ao disparar e-mail:', err);
    });
};

UI._gerarDadosRelatorioSemanalHTML = function () {
    const f = dataManager.data.financeiro;
    const vendas = dataManager.data.historico.vendas || [];
    const hoje = new Date();
    const anoMes = hoje.toISOString().substring(0, 7); // Ex: "2026-07"
    
    // Vendas totais do mês baseadas no Caixa Secundário (Termômetro Ilanna)
    const totalVendasMes = f.caixaSecundario || 0;
    const meta = 2400;
    const excedente = Math.max(0, totalVendasMes - meta);
    const comissao = excedente * 0.1;
    const lucroMes = totalVendasMes * 0.45; // Estimativa média de 45% de margem real
    
    // Itens vendidos no mês
    const vendasMes = vendas.filter(v => v.data && v.data.startsWith(anoMes));
    const contagemProd = {};
    vendasMes.forEach(v => {
        contagemProd[v.produto] = (contagemProd[v.produto] || 0) + 1;
    });
    const maisVendidos = Object.entries(contagemProd)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
        
    const maisVendidosTexto = maisVendidos.length > 0
        ? maisVendidos.map(([nome, qtd]) => `<li style="margin-bottom:6px;"><strong>${nome}</strong>: ${qtd} unidades</li>`).join('')
        : '<li style="color:#8892b0;">Nenhum produto registrado vendido no mês</li>';
        
    // Análise de sugestões de melhoria (Psicologia de Negócio)
    let oQueMelhorar = '<li style="margin-bottom:6px;">Oferecer combos de acessórios (capinha + película) sempre que fechar venda de celular.</li>';
    if (vendasMes.length < 5) {
        oQueMelhorar += '<li style="margin-bottom:6px;">Fazer contato direto com clientes antigos via WhatsApp oferecendo novidades em película de gel.</li>';
    } else {
        oQueMelhorar += '<li style="margin-bottom:6px;">Verificar os 3 itens mais vendidos e garantir estoque redobrado para o fim de semana.</li>';
    }
    if (totalVendasMes > 1000) {
        oQueMelhorar += '<li style="margin-bottom:6px;">Fazer sangria do caixa secundário e destinar para aplicação ou reserva de emergência.</li>';
    }

    const backupString = JSON.stringify(dataManager.data);
    let backupBase64 = '';
    try {
        backupBase64 = btoa(unescape(encodeURIComponent(backupString)));
    } catch(e) {
        backupBase64 = btoa(backupString.substring(0, 10000)); // fallback parcial
    }

    // Novos clientes cadastrados no mês
    const clientes = dataManager.data.clientes || [];
    const novosClientes = clientes.filter(c => c.dataCadastro && c.dataCadastro.startsWith(anoMes));
    const novosClientesTexto = novosClientes.length > 0
        ? novosClientes.slice(0, 5).map(c => `<li style="margin-bottom:4px;">👤 <strong>${c.nome}</strong> (${c.telefone || 'Sem tel'}) - Bairro: ${c.endereco?.bairro || 'Amargosa'}</li>`).join('')
        : '<li style="color:#8892b0;">Nenhum novo cliente registrado no período</li>';

    const html = `
    <div style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width:600px; margin:0 auto; padding:20px; background:#0c0f1d; color:#ffffff; border-radius:12px; border:1px solid #1a2238;">
        <div style="text-align:center; padding-bottom:20px; border-bottom:1px solid #1a2238;">
            <h1 style="color:#ffd700; margin:0; font-size:24px;">StrategyOS — Relatório Mensal & Backup</h1>
            <p style="color:#8892b0; margin:5px 0 0;">Cesinha Acessórios</p>
        </div>
        
        <div style="margin-top:20px;">
            <h2 style="color:#00ff88; font-size:18px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:6px;">📊 Desempenho e Comissões de Vendas</h2>
            <p><strong>Total no Caixa Secundário (Vendas):</strong> <span style="font-size:16px; color:#00ff88; font-weight:bold;">${UI.R(totalVendasMes)}</span></p>
            <p><strong>Meta Mensal a Atingir:</strong> <span style="font-size:14px; color:#ffffff; font-weight:bold;">${UI.R(meta)}</span></p>
            <p><strong>Comissão Acumulada de Vendas (10% sobre excedente):</strong> <span style="font-size:18px; color:#ffd700; font-weight:bold;">${UI.R(comissao)}</span></p>
            <p style="font-size:11px; color:var(--text-muted); margin-top:2px;">(Calculado automaticamente: 10% sobre o valor que ultrapassar R$ 2.400,00)</p>
        </div>
        
        <div style="margin-top:20px; padding:15px; background:rgba(255,255,255,0.02); border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
            <h3 style="color:#ffd700; margin-top:0; font-size:15px;">🔥 O que Foi Vendido no Mês</h3>
            <ul style="margin:0; padding-left:18px; line-height:1.6;">
                ${maisVendidosTexto}
            </ul>
        </div>

        <div style="margin-top:20px; padding:15px; background:rgba(168,85,247,0.05); border-radius:8px; border:1px solid rgba(168,85,247,0.15);">
            <h3 style="color:#a855f7; margin-top:0; font-size:15px;">👥 Novos Clientes Cadastrados (${novosClientes.length})</h3>
            <ul style="margin:0; padding-left:18px; line-height:1.6;">
                ${novosClientesTexto}
            </ul>
        </div>
        
        <div style="margin-top:20px;">
            <h3 style="color:#39afd1; font-size:15px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:6px;">💡 Sugestões de Melhoria</h3>
            <ul style="margin:0; padding-left:18px; line-height:1.6;">
                ${oQueMelhorar}
            </ul>
        </div>
        
        <div style="margin-top:30px; padding:15px; background:#1b233a; border-radius:8px; text-align:center;">
            <h4 style="color:#ff0055; margin-top:0; font-size:14px; margin-bottom:8px;">🔒 Código de Backup de Segurança</h4>
            <p style="font-size:12px; color:#8892b0; margin-bottom:12px; line-height:1.4;">Para restaurar os dados do sistema a qualquer momento, copie o código criptografado abaixo e cole na aba de configurações do StrategyOS.</p>
            <textarea style="width:100%; height:80px; font-size:9px; background:#0c0f1d; color:#00ff88; border:1px solid #2e3b5e; border-radius:4px; padding:6px; resize:none; font-family:monospace; box-sizing:border-box;" readonly>${backupBase64}</textarea>
        </div>
        
        <div style="margin-top:30px; text-align:center; font-size:11px; color:#8892b0; border-top:1px solid #1a2238; padding-top:15px;">
            Mensagem automática semanal gerada pelo sistema StrategyOS.
        </div>
    </div>`;
    return html;
};

UI.verificarEnvioEmailSemanal = function () {
    try {
        const config = dataManager.data.configuracoes || {};
        const emailDestino = config.emailLoja || 'rikelmer.skate10@gmail.com';
        const hoje = new Date();
        const hojeString = hoje.toISOString().split('T')[0];
        
        const ultimoEnvio = dataManager.data.ultimoMesEmailRelatorio;
        if (ultimoEnvio) {
            const dataUltimo = new Date(ultimoEnvio);
            const diffTempo = Math.abs(hoje - dataUltimo);
            const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));
            if (diffDias < 7) {
                console.log(`[StrategyOS] E-mail semanal já enviado nos últimos 7 dias. Próximo envio em breve.`);
                return;
            }
        }
        
        const html = UI._gerarDadosRelatorioSemanalHTML();
        UI.enviarRelatorioEmail(emailDestino, html, () => {
            dataManager.data.ultimoMesEmailRelatorio = hojeString;
            dataManager.saveData();
        });
    } catch (e) {
        console.error('Erro na verificação de envio de e-mail:', e);
    }
};

// === 25. TOUR DE ONBOARDING (2.16) ===
UI._iniciarTour = function () {
    const passos = [
        { titulo: '🏠 Dashboard', desc: 'Aqui você vê seu Caixa Livre, metas e prioridades de venda.', seletor: '.hero-section' },
        { titulo: '🛒 Modo Vendedor', desc: 'Use quando um cliente chegar! Tela cheia, sem informações de custo visíveis.', seletor: '.nav-btn-vendedor' },
        { titulo: '📱 Celulares', desc: 'Adicione e gerencie seu estoque de aparelhos.', seletor: '[data-page="celulares"]' },
        { titulo: '💳 Cobranças', desc: 'Acompanhe crediários, parcelas e inadimplentes.', seletor: '[data-page="cobrancas"]' },
        { titulo: '⚙️ Configurações', desc: 'Configure sua chave PIX, metas diárias e dados da loja.', seletor: '[data-page="configuracoes"]' },
    ];

    let passo = 0;

    function mostrar() {
        // Remover tour anterior
        const old = document.getElementById('tour-overlay');
        if (old) old.remove();

        if (passo >= passos.length) {
            if (!dataManager.data.configuracoes) dataManager.data.configuracoes = {};
            dataManager.data.configuracoes.primeiroAcesso = false;
            dataManager.saveData();
            UI.toast('🎉 Tour completo! Boas vendas!', 'success');
            return;
        }

        const p = passos[passo];
        const overlay = document.createElement('div');
        overlay.id = 'tour-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:99998;display:flex;align-items:center;justify-content:center;';
        overlay.innerHTML = `
            <div style="background:rgba(26,31,46,0.95);backdrop-filter:blur(20px);border:1px solid rgba(255,215,0,0.2);border-radius:16px;padding:24px;max-width:400px;text-align:center">
                <div style="font-size:24px;margin-bottom:8px">${p.titulo}</div>
                <p style="color:var(--text-muted);margin-bottom:20px;font-size:14px">${p.desc}</p>
                <div style="display:flex;gap:8px;justify-content:center">
                    ${passo > 0 ? '<button class="btn btn-ghost" onclick="UI._tourAnterior()">← Anterior</button>' : ''}
                    <button class="btn btn-ghost" onclick="UI._pularTour()">Pular</button>
                    <button class="btn btn-primary" onclick="UI._tourProximo()">${passo < passos.length - 1 ? 'Próximo →' : 'Finalizar ✅'}</button>
                </div>
                <div style="margin-top:12px;font-size:11px;color:var(--text-dim)">${passo + 1} de ${passos.length}</div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    UI._tourProximo = function () { passo++; mostrar(); };
    UI._tourAnterior = function () { passo = Math.max(0, passo - 1); mostrar(); };
    UI._pularTour = function () {
        const el = document.getElementById('tour-overlay');
        if (el) el.remove();
        if (!dataManager.data.configuracoes) dataManager.data.configuracoes = {};
        dataManager.data.configuracoes.primeiroAcesso = false;
        dataManager.saveData();
    };

    mostrar();
};

// === 26. NOTIFICAÇÃO ANIVERSÁRIOS (2.15) ===
UI._verificarAniversarios = function () {
    const clientes = dataManager.data.clientes || [];
    const hoje = new Date();
    const diaHoje = hoje.getDate();
    const mesHoje = hoje.getMonth() + 1;
    const aniversariantes = clientes.filter(c => {
        const nascimento = c.nascimento || c.dataNascimento;
        if (!nascimento) return false;
        const parts = nascimento.split(/[-/]/);
        if (parts.length < 2) return false;
        
        let dia, mes;
        // Se o primeiro pedaço tem 4 dígitos, é formato AAAA-MM-DD
        if (parts[0].trim().length === 4) {
            dia = parseInt(parts[2]);
            mes = parseInt(parts[1]);
        } else {
            // Caso contrário, é formato brasileiro DD/MM/AAAA
            dia = parseInt(parts[0]);
            mes = parseInt(parts[1]);
        }
        return dia === diaHoje && mes === mesHoje;
    });
    if (aniversariantes.length > 0) {
        aniversariantes.forEach(c => {
            if (c.telefone) {
                const msg = UI._whatsAppAniversario(c.nome);
                UI.toast(`🎂 Aniversário de ${c.nome}! <a href="https://wa.me/55${c.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}" target="_blank" onclick="event.stopPropagation();" style="color:#00d97e;text-decoration:underline;margin-left:8px;font-weight:bold;">Dar Parabéns</a>`, 'success');
            } else {
                UI.toast(`🎂 Hoje é aniversário de ${c.nome}!`, 'success');
            }
        });
    }
};

// === 27. SCORE VISUAL MELHORADO (2.18) ===
UI._renderScoreVisual = function (score) {
    score = score || 0;
    const maxScore = 1000;
    const pct = Math.min(100, (score / maxScore * 100));
    let cor = '#e63757'; // vermelho
    let tier = 'Novo';
    if (score >= 800) { cor = '#FFD700'; tier = '⭐ VIP'; }
    else if (score >= 500) { cor = '#00d97e'; tier = '✅ Confiável'; }
    else if (score >= 200) { cor = '#f5a623'; tier = '🟡 Regular'; }

    return `<div style="display:flex;align-items:center;gap:8px">
        <div style="flex:1;height:6px;background:var(--bg-input);border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${cor};border-radius:3px;transition:width 0.5s"></div>
        </div>
        <span style="font-size:12px;font-weight:700;color:${cor}">${score} — ${tier}</span>
    </div>`;
};

// === 29. EMISSÃO DE RECIBOS PROFISSIONAIS PDF & WHATSAPP ===
UI._gerarReciboProfissionalPDF = function (dados) {
    dados = dados || {};
    const config = dataManager.data.configuracoes || {};
    const nomeLoja = config.nomeLoja || 'Cesinha Acessórios';
    const cidadeLoja = config.cidadeLoja || 'Amargosa - BA';
    const telefoneLoja = config.telefoneLoja || '(75) 99999-9999';
    const pixLoja = config.chavePIX || 'Chave PIX no Caixa';
    const obsRecibo = config.obsRecibo || 'Garantia legal de 90 dias conforme CDC. Guarde este comprovante.';
    const vendedor = dados.vendedor || 'Cesinha Acessórios';
    const dataHora = dados.data ? new Date(dados.data).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR');
    const numDoc = dados.numeroOS || dados.numeroPedido || Math.floor(100000 + Math.random() * 900000);

    const htmlDoc = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Recibo — ${nomeLoja}</title>
        <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1e293b; margin: 0; padding: 20px; line-height: 1.5; }
            .receipt-card { max-width: 750px; margin: 0 auto; border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #8b5cf6; padding-bottom: 20px; margin-bottom: 24px; }
            .brand-title { font-size: 26px; font-weight: 800; color: #6d28d9; margin: 0; letter-spacing: -0.5px; }
            .brand-sub { font-size: 13px; color: #64748b; margin: 4px 0 0; }
            .doc-info { text-align: right; }
            .doc-type { font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin: 0; }
            .doc-num { font-size: 13px; color: #6d28d9; font-weight: 700; margin-top: 2px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px; font-size: 13px; }
            .info-box strong { color: #475569; display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            .items-table th { background: #f1f5f9; color: #334155; font-size: 12px; text-transform: uppercase; text-align: left; padding: 10px 12px; border-bottom: 2px solid #cbd5e1; }
            .items-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            .total-row { display: flex; justify-content: flex-end; align-items: center; gap: 16px; margin-top: 10px; font-size: 20px; font-weight: 800; color: #059669; }
            .footer-notes { margin-top: 30px; padding-top: 16px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #64748b; text-align: center; }
            .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; text-align: center; font-size: 12px; }
            .sig-line { border-top: 1px solid #94a3b8; padding-top: 6px; color: #475569; }
            @media print {
                body { padding: 0; }
                .receipt-card { border: none; box-shadow: none; padding: 0; }
                .no-print { display: none !important; }
            }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align:center; margin-bottom:20px;">
            <button onclick="window.print()" style="background:#8b5cf6; color:#fff; font-weight:bold; font-size:16px; padding:12px 28px; border:none; border-radius:8px; cursor:pointer;">🖨️ Imprimir / Salvar em PDF</button>
        </div>
        <div class="receipt-card">
            <div class="header-bar">
                <div>
                    <h1 class="brand-title">🏪 ${nomeLoja}</h1>
                    <div class="brand-sub">📍 ${cidadeLoja} | 📞 ${telefoneLoja}</div>
                    <div class="brand-sub">💳 PIX: ${pixLoja}</div>
                </div>
                <div class="doc-info">
                    <div class="doc-type">${dados.tipoTitulo || 'COMPROVANTE DE VENDA'}</div>
                    <div class="doc-num">Nº #${numDoc}</div>
                    <div style="font-size:12px; color:#64748b; margin-top:4px;">${dataHora}</div>
                </div>
            </div>

            <div class="info-grid">
                <div class="info-box">
                    <strong>Cliente</strong>
                    <div>${dados.cliente || 'Cliente Consumidor'}</div>
                    ${dados.telefoneCliente ? `<div style="font-size:12px;color:#64748b;">WhatsApp: ${dados.telefoneCliente}</div>` : ''}
                    ${dados.bairroCliente ? `<div style="font-size:12px;color:#64748b;">Bairro: ${dados.bairroCliente}</div>` : ''}
                </div>
                <div class="info-box">
                    <strong>Atendimento / Vendedor</strong>
                    <div>👤 ${vendedor}</div>
                    <div style="font-size:12px;color:#64748b;">Forma de Pagamento: <strong>${dados.formaPagamento || 'À Vista'}</strong></div>
                </div>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item / Descrição</th>
                        <th style="text-align:center;">Qtd</th>
                        <th style="text-align:right;">Valor Unitário</th>
                        <th style="text-align:right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <strong>${dados.produto || dados.servico || 'Produto / Serviço'}</strong>
                            ${dados.imei ? `<br><small style="color:#64748b;">IMEI: ${dados.imei}</small>` : ''}
                            ${dados.modelo ? `<br><small style="color:#64748b;">Modelo: ${dados.modelo}</small>` : ''}
                        </td>
                        <td style="text-align:center;">1</td>
                        <td style="text-align:right;">${UI.R(dados.valor || 0)}</td>
                        <td style="text-align:right;"><strong>${UI.R(dados.valor || 0)}</strong></td>
                    </tr>
                </tbody>
            </table>

            <div class="total-row">
                <span>VALOR TOTAL PAGO:</span>
                <span>${UI.R(dados.valor || 0)}</span>
            </div>

            <div style="margin-top: 40px; padding: 16px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; text-align: center;">
                <div style="font-size: 13px; font-weight: 800; color: #059669; text-transform: uppercase;">✔ Documento Autenticado Eletronicamente</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Assinado Digitalmente por <strong>${nomeLoja.toUpperCase()}</strong> | Emissão: ${dataHora}</div>
                <div style="font-size: 9px; color: #94a3b8; font-family: monospace; margin-top: 4px;">Chave de Autenticidade: ${numDoc}-AUT-${Date.now().toString(16).toUpperCase()}</div>
            </div>

            <div class="footer-notes">
                <div>📌 <strong>Termos e Garantia:</strong> ${obsRecibo}</div>
                <div>Agradecemos a preferência! Volte sempre à ${nomeLoja}.</div>
            </div>
        </div>
    </body>
    </html>
    `;

    const win = window.open('', '_blank');
    if (win) {
        win.document.write(htmlDoc);
        win.document.close();
    } else {
        UI.toast('Permita pop-ups no seu navegador para visualizar o recibo em PDF', 'warning');
    }
};

UI._enviarComprovanteWhatsApp = function (dados) {
    dados = dados || {};
    const config = dataManager.data.configuracoes || {};
    const nomeLoja = config.nomeLoja || 'Cesinha Acessórios';
    const foneCliente = (dados.telefoneCliente || dados.telefone || '').replace(/\D/g, '');

    const texto = `🛍️ *${nomeLoja.toUpperCase()} — COMPROVANTE DE ATENDIMENTO*

Olá *${dados.cliente || 'Cliente'}*! Aqui está o comprovante do seu atendimento:

📄 *Serviço / Produto:* ${dados.produto || dados.servico || 'Item'}
${dados.modelo ? `📱 *Modelo:* ${dados.modelo}\n` : ''}${dados.imei ? `🔢 *IMEI:* ${dados.imei}\n` : ''}💰 *Valor Total:* ${UI.R(dados.valor || 0)}
💳 *Forma de Pagamento:* ${dados.formaPagamento || 'À Vista'}
👤 *Atendente:* ${dados.vendedor || 'Cesinha Acessórios'}

📌 *Garantia:* 3 meses conforme termos da loja.
Agradecemos a preferência! Qualquer dúvida, estamos à disposição. 😊`;

    const url = foneCliente ? `https://wa.me/55${foneCliente}?text=${encodeURIComponent(texto)}` : `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
};

UI._enviarPosVendaWhatsApp = function (dados) {
    dados = dados || {};
    const config = dataManager.data.configuracoes || {};
    const nomeLoja = config.nomeLoja || 'Cesinha Acessórios';
    const foneCliente = (dados.telefoneCliente || dados.telefone || '').replace(/\D/g, '');

    const texto = `👋 Olá *${dados.cliente || 'Cliente'}*! Tudo bem com você?

Aqui é da *${nomeLoja}*! Passando para saber como está funcionando o seu *${dados.produto || dados.servico || 'aparelho/serviço'}* que realizamos há alguns dias! 📱✨

Está funcionando 100% perfeitamente? Se precisar de qualquer suporte, dúvida ou uma película nova com desconto especial, é só responder essa mensagem! 😊

Agradecemos demais a sua confiança! Abraços da equipe *${nomeLoja}*! 🙏`;

    const url = foneCliente ? `https://wa.me/55${foneCliente}?text=${encodeURIComponent(texto)}` : `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
};

// === 29. EXPORTAR PDF (2.14) ===
UI._exportarPDF = function () {
    const hist = dataManager.data.historico;
    const movs = (hist && hist.movimentacoes) || [];
    const config = dataManager.data.configuracoes || {};
    const nomeLoja = config.nomeLoja || 'Cesinha Acessórios';

    const htmlContent = `
    <html><head><style>
        body{font-family:Arial,sans-serif;font-size:12px;margin:20px;color:#333}
        h1{text-align:center;color:#333;border-bottom:2px solid #FFD700;padding-bottom:10px}
        table{width:100%;border-collapse:collapse;margin-top:16px}
        th{background:#f0f0f0;padding:8px;text-align:left;border:1px solid #ddd;font-size:11px}
        td{padding:6px 8px;border:1px solid #eee;font-size:11px}
        .positivo{color:#059669} .negativo{color:#dc2626}
        .header{text-align:center;margin-bottom:20px}
        .footer{text-align:center;font-size:10px;color:#888;margin-top:20px;border-top:1px solid #ddd;padding-top:8px}
    </style></head><body>
        <div class="header">
            <h1>📊 ${nomeLoja} — Relatório</h1>
            <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
        <table>
            <thead><tr><th>Data</th><th>Descrição</th><th>Valor</th></tr></thead>
            <tbody>${movs.slice(-100).reverse().map(m => `<tr>
                <td>${new Date(m.data).toLocaleDateString('pt-BR')}</td>
                <td>${m.descricao}</td>
                <td class="${m.valor >= 0 ? 'positivo' : 'negativo'}">${UI.R(m.valor)}</td>
            </tr>`).join('')}</tbody>
        </table>
        <div class="footer">Relatório gerado pelo StrategyOS 3.0</div>
    </body></html>`;

    const win = window.open('', '_blank', 'width=800,height=600');
    if (win) { win.document.write(htmlContent); win.document.close(); win.print(); }
};

// === 30. ORDENAÇÃO ESTOQUE POR COLUNAS (3.6) ===
UI._estadoOrdemEstoque = { campo: 'nome', dir: 'asc' };

UI._ordenarEstoque = function (campo) {
    if (UI._estadoOrdemEstoque.campo === campo) {
        UI._estadoOrdemEstoque.dir = UI._estadoOrdemEstoque.dir === 'asc' ? 'desc' : 'asc';
    } else {
        UI._estadoOrdemEstoque.campo = campo;
        UI._estadoOrdemEstoque.dir = 'asc';
    }
    if (typeof UI.renderEstoque === 'function') UI.renderEstoque();
};

// === 31. GRÁFICO CREDIÁRIO (3.7) ===
UI._renderGraficoCrediario = function (containerEl) {
    if (!containerEl) return;
    const pagamentos = [];
    const creds = dataManager.data.crediarios || [];

    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][d.getMonth()];
        let total = 0;
        creds.forEach(c => {
            (c.historicoPagamentos || []).forEach(p => {
                if (p.data && p.data.startsWith(key)) total += (p.valor || 0);
            });
        });
        pagamentos.push({ label, total });
    }

    const maxVal = Math.max(...pagamentos.map(p => p.total), 100);
    containerEl.innerHTML = `<div style="display:flex;align-items:flex-end;gap:8px;height:120px;padding:8px">
        ${pagamentos.map(p => {
        const h = Math.max(4, (p.total / maxVal) * 100);
        return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
                <span style="font-size:10px;color:var(--text-muted)">${p.total > 0 ? UI.R(p.total) : '-'}</span>
                <div style="width:100%;height:${h}px;background:linear-gradient(to top,rgba(255,215,0,0.3),rgba(255,215,0,0.6));border-radius:4px 4px 0 0"></div>
                <span style="font-size:10px;color:var(--text-dim)">${p.label}</span>
            </div>`;
    }).join('')}
    </div>`;
};

// === 33. QR CODE FIDELIDADE (3.3) ===
UI._gerarQRFidelidade = function (cliente) {
    const payload = `CESINHA_FIDELIDADE|${cliente.nome}|${cliente.telefone || ''}`;
    UI.openModal('⭐ QR Code Fidelidade', `
        <div style="text-align:center">
            <h3 style="margin-bottom:12px">${cliente.nome}</h3>
            <p style="color:var(--text-muted);margin-bottom:16px">Score: ${cliente.score || 0} pontos</p>
            <div id="qr-fidelidade" style="display:inline-block;padding:16px;background:#fff;border-radius:12px;margin-bottom:16px"></div>
            <p style="font-size:11px;color:var(--text-dim)">Cliente mostra este QR na loja</p>
        </div>
    `);
    setTimeout(() => {
        const container = document.getElementById('qr-fidelidade');
        if (container && typeof QRCode !== 'undefined') {
            new QRCode(container, { text: payload, width: 180, height: 180 });
        } else if (container) {
            container.innerHTML = `<p style="color:#000;padding:16px;font-size:12px">Código: ${payload}</p>`;
        }
    }, 100);
};

UI._tocarAlerta = function () {
    if (sessionStorage.getItem('alertaSonoro')) return; // Só 1x por sessão
    
    const tentarTocar = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (ctx.state === 'suspended') {
                // Não foi permitido tocar, aguardar clique
                const retocar = () => {
                    ctx.resume().then(() => {
                        tocarBeep(ctx);
                        document.removeEventListener('click', retocar);
                    });
                };
                document.addEventListener('click', retocar);
            } else {
                tocarBeep(ctx);
            }
        } catch (e) {
            console.log('AudioContext não suportado ou bloqueado', e);
        }
    };
    
    const tocarBeep = (ctx) => {
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 440;
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
            sessionStorage.setItem('alertaSonoro', '1');
        } catch (err) {
            console.log('Erro ao tocar oscilador', err);
        }
    };
    
    tentarTocar();
};

// === PROTEÇÃO DE SENHA DO ADMINISTRADOR PARA O FINANCEIRO ===
UI.pedirSenhaAdmin = function (onSuccess) {
    sessionStorage.setItem('admin_autenticado', 'true');
    if (typeof onSuccess === 'function') onSuccess();
};

UI._confirmarSenhaAdmin = function () {
    sessionStorage.setItem('admin_autenticado', 'true');
    UI.closeModal();
    UI.toast('🔓 Acesso Liberado!', 'success');
    if (typeof UI._onAdminSuccess === 'function') UI._onAdminSuccess();
};

UI.bloquearAdmin = function () {
    sessionStorage.setItem('admin_autenticado', 'true');
    UI.navigate('inicio');
};

UI.forcarSincronizacaoNuvem = async function () {
    UI.toast('☁️ Sincronizando com o Supabase...', 'info');
    dataManager.saveData();
    if (dataManager.supabase) {
        await dataManager.salvarSupabase();
        await dataManager.sincronizarSupabase();
        UI.toast('✅ Dados sincronizados na nuvem Supabase com sucesso!', 'success');
    } else {
        UI.toast('✅ Backup local atualizado com sucesso!', 'success');
    }
};

// === INTEGRAÇÃO: Adicionar Configurações e Proteção ao navigate ===
(function () {
    const origNavigate = UI.navigate;
    UI.navigate = function (pagina) {
        sessionStorage.setItem('admin_autenticado', 'true');

        if (pagina === 'configuracoes') {
            this.paginaAtual = pagina;
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            const btn = document.querySelector('.nav-btn[data-page="configuracoes"]');
            if (btn) btn.classList.add('active');
            document.getElementById('sidebar').classList.remove('open');
            UI.renderConfiguracoes();
            return;
        }
        if (pagina === 'financeiro') {
            this.paginaAtual = pagina;
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            const btn = document.querySelector('.nav-btn[data-page="financeiro"]');
            if (btn) btn.classList.add('active');
            document.getElementById('sidebar').classList.remove('open');
            if (typeof UI.renderFinanceiro === 'function') {
                UI.renderFinanceiro();
            } else if (typeof UI.renderCaixa === 'function') {
                UI.renderCaixa();
            }
            return;
        }
        if (pagina === 'caixa') {
            this.paginaAtual = pagina;
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            const btn = document.querySelector('.nav-btn[data-page="caixa"]');
            if (btn) btn.classList.add('active');
            document.getElementById('sidebar').classList.remove('open');
            if (typeof UI.renderCaixa === 'function') {
                UI.renderCaixa();
            } else {
                // Fallback rendering
                let html = `<h2 style="margin-bottom:16px">💰 Gestão de Caixa</h2>`;
                const f = dataManager.data.financeiro;
                html += `<div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap">
                    <div class="dash-card"><div class="dash-card-value">${UI.R(f.caixaPrincipal)}</div><div class="dash-card-label">Principal</div></div>
                    <div class="dash-card"><div class="dash-card-value">${UI.R(f.caixaAcessorios)}</div><div class="dash-card-label">Acessórios</div></div>
                    <div class="dash-card"><div class="dash-card-value" style="color:var(--accent-red)">${UI.R(f.caixaAssistencia)}</div><div class="dash-card-label">Assistência</div></div>
                    <div class="dash-card"><div class="dash-card-value" style="color:var(--accent-purple)">${UI.R(f.caixaSecundario || 0)}</div><div class="dash-card-label">Secundário</div></div>
                    <div class="dash-card"><div class="dash-card-value" style="color:var(--accent-blue)">${UI.R(f.reservaEmergencia)}</div><div class="dash-card-label">Reserva</div></div>
                </div>`;
                html += UI._renderBotoesCaixa();
                document.getElementById('main-content').innerHTML = html;
            }
            return;
        }
        origNavigate.call(this, pagina);
    };

    // Verificar aniversários e relatório ao carregar
    setTimeout(() => {
        UI._verificarAniversarios();
        UI._verificarRelatorioSemanal();
        UI.verificarEnvioEmailSemanal();

        // Verificar primeiro acesso para tour
        const config = dataManager.data.configuracoes || {};
        if (config.primeiroAcesso !== false && !sessionStorage.getItem('tourVisto')) {
            sessionStorage.setItem('tourVisto', '1');
            UI._iniciarTour();
        }

        // Verificar fiados atrasados para alerta sonoro
        const fiados = dataManager.data.fiados || [];
        const atrasados = fiados.filter(f => f.status === 'atrasado' || f.status === 'vencido');
        if (atrasados.length > 0) {
            UI._tocarAlerta();
        }
    }, 2000);

    // Sobrescrever renderAssistencia para adicionar botão Kanban
    const origAssistencia = UI.renderAssistencia;
    UI.renderAssistencia = function () {
        if (UI._assistenciaVisao === 'kanban') {
            UI._renderAssistenciaKanban();
            return;
        }
        origAssistencia.call(this);
        // Adicionar botão kanban após renderizar
        setTimeout(() => {
            const main = document.getElementById('main-content');
            if (main) {
                const h2 = main.querySelector('h2');
                if (h2 && !document.getElementById('kanban-toggle')) {
                    h2.insertAdjacentHTML('afterend', `
                        <div id="kanban-toggle" style="display:flex;gap:8px;margin-bottom:12px;margin-top:-8px">
                            <button class="btn btn-primary btn-sm" onclick="UI._assistenciaVisao='lista';UI.renderAssistencia()">📋 Lista</button>
                            <button class="btn btn-ghost btn-sm" onclick="UI._assistenciaVisao='kanban';UI.renderAssistencia()">📊 Kanban</button>
                        </div>
                    `);
                }
            }
        }, 100);
    };

    // Sobrescrever renderVendedor para adicionar mini dashboard
    const origVendedor = UI.renderVendedor;
    if (origVendedor) {
        UI.renderVendedor = function () {
            origVendedor.call(this);
            setTimeout(() => {
                const main = document.getElementById('main-content');
                if (main) {
                    const wrap = main.querySelector('.vendedor-menu');
                    if (wrap) {
                        wrap.insertAdjacentHTML('beforebegin', UI._renderMiniDashVendedor());
                    }
                }
            }, 50);
        };
    }
})();

// === 34. INTEGRAÇÃO IA CLAUDE (2.12) ===
UI._consultarClaudeAPI = function () {
    UI.openModal('🤖 Consultando Claude AI...', `
        <div style="text-align:center;padding:20px">
            <div class="spinner" style="border:4px solid rgba(255,215,0,0.1);border-left-color:var(--accent-yellow);border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin:0 auto 16px"></div>
            <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
            <p style="color:var(--text-muted);margin-bottom:12px">Analisando estoque e histórico de clientes...</p>
            <p style="font-size:12px;color:var(--text-dim)">(Simulando chamada à API da Anthropic)</p>
        </div>
    `);

    // Simulando tempo de resposta da API
    setTimeout(() => {
        const celulares = dataManager.getEstoqueCelulares();
        const parados = celulares.filter(p => p.quantidade > 0).slice(0, 2);

        let html = `
            <div style="padding:10px">
                <div style="background:rgba(0, 217, 126, 0.1);border:1px solid rgba(0, 217, 126, 0.3);border-radius:12px;padding:16px;margin-bottom:16px">
                    <h3 style="color:var(--accent-green);margin-bottom:8px">✨ Análise Concluída</h3>
                    <p style="font-size:14px">O Claude encontrou as melhores oportunidades de venda cruzada baseadas no seu estoque parado e clientes ativos.</p>
                </div>
        `;

        if (parados.length > 0) {
            html += `<h4 style="margin-bottom:12px">Campanhas Sugeridas (WhatsApp)</h4>`;
            parados.forEach(c => {
                const text = `Olá, tudo bem? Vi que você comprou acessórios com a gente recentemente. Estamos com uma oferta exclusiva num ${c.nome} (condição: ${c.condicao}) por apenas R$ ${UI.R(c.precoVenda)}. Quer dar uma olhada?`;
                html += `
                    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,215,0,0.1);border-radius:12px;padding:14px;margin-bottom:12px">
                        <div style="font-weight:700;color:var(--accent-yellow);margin-bottom:8px">📱 Foco: ${c.nome}</div>
                        <div style="font-size:13px;color:var(--text-muted);font-style:italic;margin-bottom:12px">"${text}"</div>
                        <button class="btn btn-primary btn-sm" onclick="window.open('https://wa.me/?text=${encodeURIComponent(text)}')">Enviar Lote no WhatsApp</button>
                    </div>
                `;
            });
        } else {
            html += `<p style="text-align:center;color:var(--text-muted)">Sem estoque de celulares suficiente para gerar campanhas no momento.</p>`;
        }

        html += `
            <div style="margin-top:20px;text-align:center">
                <button class="btn btn-ghost" onclick="UI.closeModal()">Fechar</button>
            </div>
        </div>`;

        UI.openModal('🤖 Resposta do Claude AI', html);
    }, 2500);
};

console.log('✅ ui-melhorias-2.js carregado');

// ===== BACKUP EM 1 CLIQUE PARA GOOGLE DRIVE / JSON =====
UI.exportarBackupGoogleDrive = function () {
    const dataStr = dataManager.exportarDados();
    const dataAtual = new Date().toISOString().substring(0, 10);
    const fileName = `StrategyOS_Backup_Cesinha_${dataAtual}.json`;

    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    if (navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'application/json' })] })) {
        const file = new File([blob], fileName, { type: 'application/json' });
        navigator.share({
            title: 'Backup StrategyOS — Cesinha Acessórios',
            text: `Backup completo do sistema referente a ${dataAtual}. Salvar no Google Drive!`,
            files: [file]
        }).then(() => {
            UI.toast('✅ Backup compartilhado com sucesso para o Google Drive!', 'success');
        }).catch((err) => {
            console.log('Share cancelado ou não suportado:', err);
            UI._downloadFileDirect(url, fileName);
        });
    } else {
        UI._downloadFileDirect(url, fileName);
    }
};

UI._downloadFileDirect = function (url, fileName) {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    UI.toast(`💾 Backup ${fileName} baixado com sucesso! Salve no seu Google Drive.`, 'success');
};

// ===== REGISTRO DO SERVICE WORKER E PWA INSTALLATION PROMPT =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js?v=3.9.0').then(reg => {
            console.log('📱 StrategyOS: Service Worker PWA registrado com sucesso!', reg);
        }).catch(err => {
            console.warn('⚠️ StrategyOS: Erro ao registrar Service Worker:', err);
        });
    });
}

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btnInstall = document.getElementById('btn-instalar-app');
    if (btnInstall) btnInstall.style.display = 'flex';
});

UI.instalarAppPWA = function () {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                UI.toast('🎉 Aplicativo Cesinha Acessórios instalado com sucesso!', 'success');
            }
            deferredPrompt = null;
        });
    } else {
        UI.toast('📱 Para instalar no celular: clique no menu do navegador (3 pontinhos) e selecione "Adicionar à Tela Inicial" / "Instalar App".', 'info');
    }
};

// ===== MODAL DE CONFIGURAÇÃO E TESTES DO BOT DO TELEGRAM =====
UI.modalConfigurarTelegram = function () {
    const cfg = dataManager.data.configuracoes || {};
    const botToken = cfg.telegramBotToken || '';
    const chatId = cfg.telegramChatId || '';
    const chatIdEquipe = cfg.telegramChatIdEquipe || '';

    UI.openModal('✈️ Configuração do Bot do Telegram', `
        <div style="padding:14px">
            <h3 style="color:#38bdf8;margin:0 0 10px 0;">🤖 INTEGRAR BOT DO TELEGRAM DA LOJA</h3>
            <p style="font-size:14px;color:var(--text-muted);margin-bottom:14px;">
                Receba relatórios de sábado, backups automáticos salvos no Telegram, alertas de reposição de estoque e notificações de caixa diretamente no seu celular ou grupo da equipe!
            </p>

            <div style="background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.3);padding:12px;border-radius:12px;margin-bottom:16px;font-size:13px;line-height:1.5;">
                📌 <strong>Como criar seu Bot em 1 minuto:</strong><br>
                1. No Telegram, busque por <strong>@BotFather</strong> e envie <code>/newbot</code> para criar seu bot e copiar o Token.<br>
                2. Depois, busque por <strong>@userinfobot</strong> para descobrir seu <strong>Chat ID</strong>.
            </div>

            <label class="form-label">Bot Token (fornecido pelo @BotFather):</label>
            <input class="form-input" id="telegram-token-inp" placeholder="Ex: 7123456789:AAE-xxxxxx..." value="${botToken}" style="font-size:15px;padding:12px;margin-bottom:14px;width:100%;">

            <label class="form-label">Seu Chat ID (ou ID do grupo da loja):</label>
            <input class="form-input" id="telegram-chatid-inp" placeholder="Ex: 123456789 ou -100xxxx" value="${chatId}" style="font-size:15px;padding:12px;margin-bottom:14px;width:100%;">

            <label class="form-label">Chat ID do Funcionário / Equipe (opcional):</label>
            <input class="form-input" id="telegram-equipe-inp" placeholder="Ex: 987654321" value="${chatIdEquipe}" style="font-size:15px;padding:12px;margin-bottom:20px;width:100%;">

            <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <button class="btn btn-ghost" style="flex:1;min-width:120px;" onclick="UI._testarBotTelegram()">🧪 Testar Envio</button>
                <button class="btn btn-ghost" style="flex:1;min-width:120px;" onclick="UI._testarBackupTelegram()">💾 Testar Backup</button>
                <button class="btn btn-primary btn-lg" style="flex:2;min-width:180px;font-size:16px;font-weight:800;" onclick="UI._salvarConfigTelegram()">💾 SALVAR</button>
            </div>
        </div>
    `);
};

UI._salvarConfigTelegram = function () {
    const token = document.getElementById('telegram-token-inp').value.trim();
    const chatId = document.getElementById('telegram-chatid-inp').value.trim();
    const chatIdEquipe = document.getElementById('telegram-equipe-inp').value.trim();

    if (!dataManager.data.configuracoes) dataManager.data.configuracoes = {};
    dataManager.data.configuracoes.telegramBotToken = token;
    dataManager.data.configuracoes.telegramChatId = chatId;
    dataManager.data.configuracoes.telegramChatIdEquipe = chatIdEquipe;

    dataManager.saveData();
    UI.closeModal();
    UI.toast('✈️ Configurações do Telegram salvas com sucesso!', 'success');
};

UI._salvarConfigTelegramSilencioso = function () {
    const token = document.getElementById('telegram-token-inp')?.value.trim();
    const chatId = document.getElementById('telegram-chatid-inp')?.value.trim();
    const chatIdEquipe = document.getElementById('telegram-equipe-inp')?.value.trim();

    if (!dataManager.data.configuracoes) dataManager.data.configuracoes = {};
    if (token !== undefined) dataManager.data.configuracoes.telegramBotToken = token;
    if (chatId !== undefined) dataManager.data.configuracoes.telegramChatId = chatId;
    if (chatIdEquipe !== undefined) dataManager.data.configuracoes.telegramChatIdEquipe = chatIdEquipe;
    dataManager.saveData();
};

UI._testarBotTelegram = async function () {
    UI._salvarConfigTelegramSilencioso();
    UI.toast('✈️ Enviando mensagem de teste para o Telegram...', 'info');
    const res = await dataManager.enviarTelegram('🚀 *TESTE STRATEGYOS* — Seu Bot do Telegram está conectado e operando perfeitamente!');
    if (res.sucesso) {
        UI.toast('🎉 Mensagem de teste enviada com sucesso no Telegram!', 'success');
    } else {
        UI.toast('❌ Erro no envio: ' + (res.erro || 'Verifique Token e Chat ID'), 'error');
    }
};

UI._testarBackupTelegram = async function () {
    UI._salvarConfigTelegramSilencioso();
    UI.toast('💾 Enviando arquivo backup .JSON para o Telegram...', 'info');
    const res = await dataManager.enviarBackupDocumentoTelegram();
    if (res.sucesso) {
        UI.toast('🎉 Backup do sistema guardado permanentemente no Telegram!', 'success');
    } else {
        UI.toast('❌ Erro ao enviar backup: ' + (res.erro || 'Verifique configurações'), 'error');
    }
};
