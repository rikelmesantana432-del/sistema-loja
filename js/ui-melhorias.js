// ====================================
// STRATEGYOS 3.0 — MELHORIAS (Fase 2+3)
// Skeleton, WhatsApp, Command Palette,
// Gráfico Vendas, ISF Pill, Countdown, Troco
// ====================================

// === 1.4 — SKELETON LOADING ===
UI._skeleton = function (linhas = 5) {
    return `<div class="skeleton-wrap">
        ${Array(linhas).fill(0).map((_, i) => `
            <div class="skeleton-card">
                <div class="skeleton-line" style="width:${40 + Math.random() * 40}%;height:20px"></div>
                <div class="skeleton-line" style="width:${60 + Math.random() * 30}%;height:14px;margin-top:8px"></div>
            </div>
        `).join('')}
    </div>`;
};

// === 2.4 — WHATSAPP ===
UI._abrirWhatsApp = function (telefone, mensagem) {
    const tel = (telefone || '').replace(/\D/g, '');
    if (!tel) { UI.toast('⚠️ Telefone não cadastrado!', 'error'); return; }
    const url = `https://wa.me/55${tel}?text=${encodeURIComponent(mensagem || '')}`;
    window.open(url, '_blank');
};

UI._whatsAppCobranca = function (nome, valor, data) {
    const msg = `Olá ${nome}! Sua parcela de ${UI.R(valor)} venceu em ${data}. Pode confirmar o pagamento? Cesinha Acessórios 📱`;
    return msg;
};

UI._whatsAppOSPronta = function (nome, modelo) {
    return `Olá ${nome}! Seu ${modelo} está pronto para retirada na Cesinha Acessórios! Venha quando quiser 😊`;
};

UI._whatsAppFiado = function (nome, valor) {
    return `Olá ${nome}! Lembrando que você tem ${UI.R(valor)} para pagar aqui na Cesinha Acessórios 🙏`;
};

UI._whatsAppAniversario = function (nome) {
    return `Feliz aniversário ${nome}! 🎂 A Cesinha Acessórios deseja um ótimo dia! Temos um mimo especial esperando por você 🎁`;
};

// === 2.1 — COMMAND PALETTE (Ctrl+K) ===
UI.abrirCommandPalette = function () {
    const paginas = [
        { icon: '🏠', nome: 'Dashboard', acao: "UI.navigate('inicio')" },
        { icon: '📱', nome: 'Celulares', acao: "UI.navigate('celulares')" },
        { icon: '🎧', nome: 'Acessórios', acao: "UI.navigate('acessorios')" },
        { icon: '💰', nome: 'Cobranças', acao: "UI.navigate('cobrancas')" },
        { icon: '🔧', nome: 'Assistência Técnica', acao: "UI.navigate('assistencia')" },
        { icon: '👥', nome: 'Clientes', acao: "UI.navigate('clientes')" },
        { icon: '📝', nome: 'Fiado', acao: "UI.navigate('fiado')" },
        { icon: '⭐', nome: 'Fidelidade', acao: "UI.navigate('fidelidade')" },
        { icon: '📊', nome: 'Histórico', acao: "UI.navigate('historico')" },
        { icon: '🧮', nome: 'Simulador', acao: "UI.navigate('simulador')" },
        { icon: '🤖', nome: 'IA Sugestões', acao: "UI.navigate('ia')" },
        { icon: '📦', nome: 'Estoque', acao: "UI.navigate('estoque')" },
        { icon: '🔄', nome: 'Trocas', acao: "UI.navigate('trocas')" },
        { icon: '🛒', nome: 'Modo Vendedor', acao: "UI.navigate('vendedor')" },
    ];

    const overlay = document.createElement('div');
    overlay.id = 'cmd-palette-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding-top:15vh;';

    const box = document.createElement('div');
    box.style.cssText = 'background:rgba(26,31,46,0.95);backdrop-filter:blur(24px);border:1px solid rgba(255,215,0,0.15);border-radius:16px;width:520px;max-height:60vh;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.6);';

    box.innerHTML = `
        <div style="padding:16px;border-bottom:1px solid rgba(255,215,0,0.1)">
            <input id="cmd-search" type="text" placeholder="🔍 Digite para buscar páginas, clientes, produtos..." 
                style="width:100%;background:transparent;border:none;color:#e8edf5;font-size:16px;outline:none;padding:4px" autocomplete="off">
        </div>
        <div id="cmd-results" style="max-height:45vh;overflow-y:auto;padding:8px"></div>
        <div style="padding:8px 16px;border-top:1px solid rgba(255,215,0,0.05);font-size:11px;color:#5a6372;display:flex;gap:16px">
            <span>↑↓ Navegar</span><span>Enter Selecionar</span><span>Esc Fechar</span>
        </div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const input = document.getElementById('cmd-search');
    const results = document.getElementById('cmd-results');
    let selectedIdx = 0;

    function renderResults(filtro) {
        const f = (filtro || '').toLowerCase();
        let items = paginas.filter(p => p.nome.toLowerCase().includes(f));

        // Buscar clientes
        if (f.length >= 2) {
            const clientes = (dataManager.data.clientes || []).filter(c =>
                (c.nome || '').toLowerCase().includes(f) || (c.telefone || '').includes(f)
            ).slice(0, 5);
            clientes.forEach(c => {
                items.push({ icon: '👤', nome: `${c.nome} ${c.telefone ? '— ' + c.telefone : ''}`, acao: `UI.navigate('clientes')`, tipo: 'Cliente' });
            });

            // Buscar celulares
            const cels = (dataManager.data.estoqueCelulares || []).filter(c =>
                (c.nome || c.modelo || '').toLowerCase().includes(f)
            ).slice(0, 5);
            cels.forEach(c => {
                items.push({ icon: '📱', nome: `${c.nome || c.modelo} — ${UI.R(c.precoVenda)}`, acao: `UI.navigate('celulares')`, tipo: 'Produto' });
            });
        }

        selectedIdx = 0;
        results.innerHTML = items.length ? items.map((item, i) => `
            <div class="cmd-item${i === selectedIdx ? ' cmd-active' : ''}" data-idx="${i}" onclick="${item.acao};UI._fecharCommandPalette()" 
                style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-radius:8px;cursor:pointer;font-size:14px;color:#e8edf5;transition:background 0.15s;${i === selectedIdx ? 'background:rgba(255,215,0,0.1);' : ''}">
                <span style="font-size:18px;width:24px;text-align:center">${item.icon}</span>
                <span style="flex:1">${item.nome}</span>
                ${item.tipo ? `<span style="font-size:11px;color:#5a6372;background:rgba(255,255,255,0.05);padding:2px 8px;border-radius:4px">${item.tipo}</span>` : ''}
            </div>
        `).join('') : '<div style="padding:20px;text-align:center;color:#5a6372">Nenhum resultado</div>';

        // Hover
        results.querySelectorAll('.cmd-item').forEach(el => {
            el.addEventListener('mouseenter', () => {
                results.querySelectorAll('.cmd-item').forEach(e => e.style.background = '');
                el.style.background = 'rgba(255,215,0,0.1)';
                selectedIdx = parseInt(el.dataset.idx);
            });
            el.addEventListener('mouseleave', () => { el.style.background = ''; });
        });
    }

    renderResults('');
    input.focus();

    let debounceTimer;
    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => renderResults(input.value), 150);
    });

    function handleKeys(e) {
        const items = results.querySelectorAll('.cmd-item');
        if (e.key === 'Escape') { UI._fecharCommandPalette(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); selectedIdx = Math.min(selectedIdx + 1, items.length - 1); updateSelection(items); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIdx = Math.max(selectedIdx - 1, 0); updateSelection(items); }
        else if (e.key === 'Enter' && items[selectedIdx]) { items[selectedIdx].click(); }
    }

    function updateSelection(items) {
        items.forEach((el, i) => { el.style.background = i === selectedIdx ? 'rgba(255,215,0,0.1)' : ''; });
        if (items[selectedIdx]) items[selectedIdx].scrollIntoView({ block: 'nearest' });
    }

    document.addEventListener('keydown', handleKeys);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) UI._fecharCommandPalette(); });

    UI._cmdPaletteCleanup = () => { document.removeEventListener('keydown', handleKeys); };
};

UI._fecharCommandPalette = function () {
    const overlay = document.getElementById('cmd-palette-overlay');
    if (overlay) { overlay.remove(); }
    if (UI._cmdPaletteCleanup) { UI._cmdPaletteCleanup(); UI._cmdPaletteCleanup = null; }
};

// === 2.2 — GRÁFICO DE VENDAS NO DASHBOARD ===
UI._renderGraficoVendas = function (containerEl, dias = 7) {
    if (!containerEl) return;
    const vendas = (dataManager.data.historico && dataManager.data.historico.vendas) || [];
    const movs = (dataManager.data.movimentacoesCaixa || []).concat((dataManager.data.historico && dataManager.data.historico.movimentacoes) || []);
    const hoje = new Date();
    const diasData = [];

    for (let i = dias - 1; i >= 0; i--) {
        const d = new Date(hoje);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const label = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()];
        
        let total = vendas.filter(v => v.data && v.data.startsWith(key))
                          .reduce((s, v) => {
                              const val = parseFloat(v.valorVenda) || parseFloat(v.valorBruto) || parseFloat(v.liquido) || 0;
                              return s + (val < 50000 ? val : 0);
                          }, 0);
        
        const totalMovs = movs.filter(m => {
            if (!m.data || !m.data.startsWith(key)) return false;
            const tp = String(m.tipo || '');
            if (tp.includes('fechamento') || tp === 'saida' || tp === 'despesa' || tp === 'zerado') return false;
            const val = parseFloat(m.valor || 0);
            return val > 0 && val < 50000;
        }).reduce((s, m) => s + (parseFloat(m.valor) || 0), 0);

        total = Math.min(total + totalMovs, 50000);
        diasData.push({ key, label, total });
    }

    const maxVal = Math.max(...diasData.map(d => d.total), 100);
    const canvas = document.createElement('canvas');
    canvas.width = containerEl.clientWidth || 500;
    canvas.height = 200;
    canvas.style.cssText = 'width:100%;height:200px;border-radius:12px;';
    containerEl.innerHTML = '';
    containerEl.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const padL = 60, padR = 20, padT = 20, padB = 40;
    const chartW = W - padL - padR, chartH = H - padT - padB;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 12);
    ctx.fill();

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padT + (chartH / 4) * i;
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
        const val = maxVal - (maxVal / 4) * i;
        ctx.fillStyle = '#5a6372';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val.toFixed(0), padL - 8, y + 4);
    }

    // Points & line
    const points = diasData.map((d, i) => ({
        x: padL + (chartW / (dias - 1)) * i,
        y: padT + chartH - (d.total / maxVal) * chartH,
        val: d.total,
        label: d.label
    }));

    // Area gradient
    const grad = ctx.createLinearGradient(0, padT, 0, H - padB);
    grad.addColorStop(0, 'rgba(255, 215, 0, 0.15)');
    grad.addColorStop(1, 'rgba(255, 215, 0, 0)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, H - padB);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, H - padB);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Points & labels
    points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.strokeStyle = 'rgba(26,31,46,0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Value above point
        if (p.val > 0) {
            ctx.fillStyle = '#e8edf5';
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(p.val >= 1000 ? (p.val / 1000).toFixed(1) + 'k' : p.val.toFixed(0), p.x, p.y - 10);
        }

        // Day label
        ctx.fillStyle = '#5a6372';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.label, p.x, H - padB + 18);
    });
};

// === 2.6 — CONFIRMAÇÃO COM COUNTDOWN ===
UI._confirmarComContagem = function (titulo, mensagem, callback, segundos) {
    segundos = segundos || 3;
    UI.openModal(titulo, `
        <p style="font-size:15px;margin-bottom:16px">${mensagem}</p>
        <div id="countdown-bar" style="height:4px;background:var(--accent-red);width:100%;border-radius:2px;transition:width ${segundos}s linear;margin:12px 0"></div>
        <div style="text-align:center;color:var(--text-muted);margin-bottom:12px;font-size:14px">Aguarde <span id="countdown-num">${segundos}</span>s...</div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
            <button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
            <button class="btn btn-danger" id="btn-confirmar-perigo" disabled style="opacity:0.5">Confirmar</button>
        </div>
    `);

    let restante = segundos;
    setTimeout(() => { const bar = document.getElementById('countdown-bar'); if (bar) bar.style.width = '0%'; }, 50);

    const interval = setInterval(() => {
        restante--;
        const el = document.getElementById('countdown-num');
        if (el) el.textContent = restante;
        if (restante <= 0) {
            clearInterval(interval);
            const btn = document.getElementById('btn-confirmar-perigo');
            if (btn) {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.textContent = '⚠️ Confirmar';
                btn.onclick = function () { UI.closeModal(); if (typeof callback === 'function') callback(); };
            }
        }
    }, 1000);
};

// === 3.1 — CALCULADORA DE TROCO ===
UI._calcularTroco = function (valorTotal) {
    UI.openModal('💵 Calculadora de Troco', `
        <div style="text-align:center;margin-bottom:16px">
            <div style="font-size:14px;color:var(--text-muted)">Valor da venda:</div>
            <div style="font-size:28px;font-weight:800;color:var(--accent-green)">${UI.R(valorTotal)}</div>
        </div>
        <div style="margin-bottom:16px">
            <label class="form-label" style="font-size:14px">💵 Valor entregue pelo cliente:</label>
            <input class="form-input" id="troco-entregue" type="number" step="0.01" min="${valorTotal}" style="font-size:20px;padding:12px;text-align:center" 
                oninput="UI._atualizarTroco(${valorTotal})" autofocus placeholder="0,00">
        </div>
        <div id="troco-resultado" style="text-align:center;padding:20px;background:rgba(0,217,126,0.1);border-radius:12px;border:1px solid rgba(0,217,126,0.2);display:none">
            <div style="font-size:14px;color:var(--text-muted)">TROCO:</div>
            <div id="troco-valor" style="font-size:36px;font-weight:800;color:var(--accent-green)">R$ 0,00</div>
        </div>
        <div style="text-align:center;margin-top:16px">
            <button class="btn btn-success btn-lg" onclick="UI.closeModal()">✅ OK</button>
        </div>
    `);
    setTimeout(() => { const el = document.getElementById('troco-entregue'); if (el) el.focus(); }, 100);
};

UI._atualizarTroco = function (valorTotal) {
    const entregue = parseFloat(document.getElementById('troco-entregue').value) || 0;
    const troco = entregue - valorTotal;
    const resultEl = document.getElementById('troco-resultado');
    const valorEl = document.getElementById('troco-valor');
    if (entregue > 0 && resultEl) {
        resultEl.style.display = 'block';
        if (troco >= 0) {
            valorEl.textContent = UI.R(troco);
            valorEl.style.color = 'var(--accent-green)';
        } else {
            valorEl.textContent = `Faltam ${UI.R(Math.abs(troco))}`;
            valorEl.style.color = 'var(--accent-red)';
        }
    }
};

// === 1.8 — ISF PILL NO HEADER ===
UI._renderISFPill = function () {
    const headerRight = document.querySelector('.header-right');
    if (!headerRight) return;

    // Remover pill anterior se existir
    const oldPill = document.getElementById('isf-pill');
    if (oldPill) oldPill.remove();

    try {
        const isf = Calculators.calcularISF();
        let classe = 'isf-verde';
        if (isf < 40) classe = 'isf-vermelho';
        else if (isf < 70) classe = 'isf-amarelo';

        const pill = document.createElement('span');
        pill.id = 'isf-pill';
        pill.className = `isf-pill ${classe}`;
        pill.innerHTML = `🛡️ ISF: ${isf}`;
        pill.title = 'Índice de Saúde Financeira';
        pill.onclick = () => UI.abrirAlertas();

        headerRight.insertBefore(pill, headerRight.firstChild);
    } catch (e) {
        console.log('ISF pill: calculadora não disponível', e);
    }
};

// === 3.8 — EXPORTAR CLIENTES CSV ===
UI._exportarClientesCSV = function () {
    const clientes = dataManager.data.clientes || [];
    if (clientes.length === 0) { UI.toast('Nenhum cliente cadastrado!', 'error'); return; }
    const cabecalho = 'Nome,Telefone,CPF,Cidade,Score,Cadastro\n';
    const linhas = clientes.map(c => `"${c.nome || ''}","${c.telefone || ''}","${c.cpf || ''}","${c.cidade || ''}",${c.score || 0},"${c.dataCadastro || ''}"`).join('\n');
    const blob = new Blob([cabecalho + linhas], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    UI.toast('✅ Clientes exportados!', 'success');
};

// === 2.5 — IMPRESSÃO DE RECIBO ===
UI._imprimirRecibo = function (dados) {
    const html = `
        <html><head><style>
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 58mm; margin: 0; padding: 8px; color: #000; }
            .centro { text-align: center; }
            .linha { border-bottom: 1px dashed #000; margin: 4px 0; }
            .negrito { font-weight: bold; font-size: 14px; }
        </style></head>
        <body>
            <div class="centro negrito">CESINHA ACESSÓRIOS</div>
            <div class="centro">Amargosa - BA</div>
            <div class="linha"></div>
            <div>Data: ${dados.data || new Date().toLocaleDateString('pt-BR')}</div>
            <div>Cliente: ${dados.cliente || 'Consumidor'}</div>
            <div class="linha"></div>
            <div>${dados.produto || 'Produto'}</div>
            <div class="negrito">Total: ${dados.valor || 'R$ 0,00'}</div>
            <div>Pagamento: ${dados.formaPagamento || '-'}</div>
            ${dados.imei ? `<div>IMEI: ${dados.imei}</div>` : ''}
            <div class="linha"></div>
            <div class="centro">Garantia: ${dados.garantia || '3 meses'}</div>
            <div class="centro">Obrigado pela preferência!</div>
        </body></html>
    `;
    const win = window.open('', '_blank', 'width=400,height=600');
    if (win) {
        win.document.write(html);
        win.document.close();
        win.print();
    }
};

// === INIT MELHORIAS ===
// Expandir atalhos ao carregar
(function () {
    const originalInit = UI._initAtalhos;
    UI._initAtalhos = function () {
        document.addEventListener('keydown', function (e) {
            if (!e.ctrlKey || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
            switch (e.key.toLowerCase()) {
                case 'k': e.preventDefault(); UI.abrirCommandPalette(); break;
                case 'v': e.preventDefault(); UI.navigate('vendedor'); break;
                case 'e': e.preventDefault(); UI.navigate('celulares'); break;
                case 't': e.preventDefault(); UI.navigate('trocas'); break;
                case 'p': e.preventDefault(); UI.navigate('cobrancas'); break;
                case 'd': e.preventDefault(); UI.navigate('inicio'); break;
                case 'n': e.preventDefault(); UI.navigate('vendedor'); break;
                case 'o': e.preventDefault(); UI.navigate('assistencia'); break;
                case '?': e.preventDefault(); UI._mostrarAtalhos(); break;
            }
        });
    };

    // Mostrar atalhos (Ctrl+?)
    UI._mostrarAtalhos = function () {
        UI.openModal('⌨️ Atalhos de Teclado', `
            <div style="display:grid;gap:8px">
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)"><span>Dashboard</span><kbd style="background:var(--bg-input);padding:2px 8px;border-radius:4px;font-size:12px">Ctrl+D</kbd></div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)"><span>Modo Vendedor</span><kbd style="background:var(--bg-input);padding:2px 8px;border-radius:4px;font-size:12px">Ctrl+V</kbd></div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)"><span>Celulares/Estoque</span><kbd style="background:var(--bg-input);padding:2px 8px;border-radius:4px;font-size:12px">Ctrl+E</kbd></div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)"><span>Trocas</span><kbd style="background:var(--bg-input);padding:2px 8px;border-radius:4px;font-size:12px">Ctrl+T</kbd></div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)"><span>Cobranças</span><kbd style="background:var(--bg-input);padding:2px 8px;border-radius:4px;font-size:12px">Ctrl+P</kbd></div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)"><span>Assistência Técnica</span><kbd style="background:var(--bg-input);padding:2px 8px;border-radius:4px;font-size:12px">Ctrl+O</kbd></div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)"><span>Busca Global</span><kbd style="background:var(--bg-input);padding:2px 8px;border-radius:4px;font-size:12px">Ctrl+K</kbd></div>
                <div style="display:flex;justify-content:space-between;padding:8px 0"><span>Mostrar Atalhos</span><kbd style="background:var(--bg-input);padding:2px 8px;border-radius:4px;font-size:12px">Ctrl+?</kbd></div>
            </div>
        `);
    };

    // Atualizar ISF pill após cada renderização do dashboard
    const originalRender = UI.renderDashboard;
    if (originalRender) {
        UI.renderDashboard = function () {
            originalRender.call(this);
            setTimeout(() => UI._renderISFPill(), 100);

            // Adicionar gráfico de vendas se container existir
            setTimeout(() => {
                const graficoContainer = document.getElementById('grafico-vendas');
                if (graficoContainer) UI._renderGraficoVendas(graficoContainer, 7);
            }, 200);
        };
    }
    // === 2.15 — COBRANÇA DE WHATSAPP (MELHORIA 7) ===
    UI._vendedorDispararLembreteWhatsApp = function (crediarioId) {
        const cred = dataManager.data.crediarios.find(c => c.id === crediarioId);
        if (!cred) return;
        const cl = dataManager.data.clientes.find(c => c.nome.toLowerCase() === cred.cliente.toLowerCase());
        const tel = cl ? cl.telefone : '';
        const msg = UI._obterMensagemLembrete(cred);
        UI._abrirWhatsApp(tel, msg);
    };

    UI._obterMensagemLembrete = function (cred) {
        const restante = cred.valorTotal - (cred.parcelasPagas * cred.valorParcela);
        if (cred.status === 'em_dia') {
            return `Olá ${cred.cliente}! Lembrando que sua parcela de ${UI.R(cred.valorParcela)} vence em ${cred.proximaParcela}. Pode confirmar se está tudo certo? Cesinha Acessórios 📱`;
        } else {
            return `Olá ${cred.cliente}! Lembrando que você tem uma parcela pendente de ${UI.R(cred.valorParcela)} que venceu em ${cred.proximaParcela}. Conseguimos acertar via PIX? Cesinha Acessórios 🙏`;
        }
    };

    UI.modalLembretesCobrancaHoje = function () {
        const creds = dataManager.getCrediariosAtivos();
        const hoje = new Date();
        const limiteProximo = new Date();
        limiteProximo.setDate(hoje.getDate() + 3);

        const lembretes = creds.filter(c => {
            const dataVenc = new Date(c.proximaParcela);
            // Vence nos próximos 3 dias ou já está atrasado/inadimplente
            return c.status !== 'em_dia' || dataVenc <= limiteProximo;
        });

        let listHtml = '';
        if (lembretes.length > 0) {
            listHtml = lembretes.map(c => {
                const cl = dataManager.data.clientes.find(cli => cli.nome.toLowerCase() === c.cliente.toLowerCase());
                const tel = cl ? cl.telefone : '';
                const msg = UI._obterMensagemLembrete(c);
                const statusTexto = c.status === 'em_dia' ? 'Vence em breve' : c.status === 'atrasado' ? `${c.diasAtraso}d de atraso` : 'Inadimplente';
                const statusCor = c.status === 'em_dia' ? 'var(--accent-cyan)' : 'var(--accent-red)';
                
                return `
                <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.02);padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,0.05);margin-bottom:8px;">
                    <div style="flex:1;padding-right:12px;">
                        <strong style="color:#FFF;font-size:14px;">${c.cliente}</strong>
                        <span style="font-size:11px;color:${statusCor};margin-left:8px;font-weight:600;">(${statusTexto})</span>
                        <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
                            Parcela: ${c.parcelasPagas}/${c.parcelasTotal} × ${UI.R(c.valorParcela)} | Vencimento: ${c.proximaParcela}
                        </div>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); UI._vendedorDispararLembreteWhatsApp(${c.id}); this.style.background='#5a6372'; this.innerText='Cobrado';" style="background:#075e54;border:none;font-weight:bold;height:32px;padding:6px 12px;border-radius:8px;">💬 Cobrar</button>
                </div>`;
            }).join('');
        } else {
            listHtml = '<div style="text-align:center;padding:30px;color:var(--text-dim)">Nenhum lembrete de cobrança pendente para hoje! 🎉</div>';
        }

        UI.modal(`
            <h3>🚀 Cobrança Rápida via WhatsApp</h3>
            <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px;">Clientes com parcelas em atraso ou vencendo nos próximos 3 dias.</p>
            <div style="max-height:50vh;overflow-y:auto;padding-right:4px;">
                ${listHtml}
            </div>
            <div style="text-align:right;margin-top:20px;">
                <button class="btn btn-ghost" onclick="UI.closeModal()">Fechar</button>
            </div>
        `);
    };
})();

console.log('✅ ui-melhorias.js carregado');
