// StrategyOS 3.1 — Sistema de Fidelidade (Correção 10)
// R$10 gastos = 1 ponto | Resgate com bônus | Ranking

UI.renderFidelidade = function () {
    if (!dataManager.data.fidelidade) dataManager.data.fidelidade = { clientes: [] };
    // Bug 15: Mesclar clientes da fidelidade com clientes do sistema que têm score > 0
    const fidClientes = dataManager.data.fidelidade.clientes || [];
    const sysClientes = (dataManager.data.clientes || []).filter(c => (c.score || 0) > 0);
    // Criar lista unificada sem duplicar (por nome)
    const nomesJaIncluidos = new Set(fidClientes.map(c => c.nome.toLowerCase()));
    const clientesUnificados = [...fidClientes];
    sysClientes.forEach(c => {
        if (!nomesJaIncluidos.has(c.nome.toLowerCase())) {
            clientesUnificados.push({ nome: c.nome, telefone: c.telefone || '', pontos: c.score || 0, historico: c.historico || [] });
        } else {
            // Atualizar pontos se o cliente do sistema tem mais
            const existente = clientesUnificados.find(f => f.nome.toLowerCase() === c.nome.toLowerCase());
            if (existente && (c.score || 0) > existente.pontos) existente.pontos = c.score;
        }
    });
    const ranking = [...clientesUnificados].sort((a, b) => (b.pontos || 0) - (a.pontos || 0));

    const tiers = [
        { nome: '🥉 Bronze', min: 100, desconto: 10 },
        { nome: '🥈 Prata', min: 300, desconto: 35 },
        { nome: '🥇 Ouro', min: 500, desconto: 60 },
        { nome: '💎 Diamante', min: 1000, desconto: 130 }
    ];

    let html = `<div class="dashboard-section">
        <h2 style="font-size:24px;margin-bottom:16px">🎁 Sistema de Fidelidade</h2>
        <p style="color:var(--text-muted);margin-bottom:16px">A cada R$ 10 em compras, o cliente ganha 1 ponto!</p>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">`;
    tiers.forEach(t => {
        html += `<div style="text-align:center;background:var(--card-bg);border:1px solid var(--border-color);border-radius:12px;padding:14px"><div style="font-size:28px">${t.nome}</div><div style="font-size:14px;color:var(--text-muted)">${t.min}+ pontos</div><div style="font-size:18px;font-weight:700;color:var(--accent-green)">R$ ${t.desconto} off</div></div>`;
    });
    html += `</div><div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;"><button class="btn btn-primary" onclick="UI._addClienteFidelidade()">➕ Novo Cliente</button><button class="btn btn-ghost" onclick="UI._resgatarPontos()">🎁 Resgatar Pontos</button><button class="btn btn-ghost" style="color:#f59e0b;border-color:rgba(245,158,11,0.4);" onclick="UI.renderClientes();setTimeout(()=>UI._setFiltroDataCliente('inativos'),100);">⏰ Clientes Inativos (+30d)</button></div>`;

    // Ranking
    html += '<h3 style="font-size:20px;margin-bottom:12px">🏆 Ranking de Clientes</h3>';
    if (ranking.length === 0) {
        html += '<p style="text-align:center;color:var(--text-muted);padding:20px">Nenhum cliente no programa ainda</p>';
    } else {
        html += '<div style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:12px;overflow:hidden">';
        ranking.forEach((c, i) => {
            const tier = tiers.filter(t => c.pontos >= t.min).pop();
            const tierNome = tier ? tier.nome : '⭐ Iniciante';
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`;
            html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border-color)">
                <div><span style="font-size:18px;font-weight:700;margin-right:8px">${medal}</span><span style="font-size:16px">${c.nome}</span><span style="color:var(--text-muted);font-size:13px;margin-left:8px">${c.telefone || ''}</span></div>
                <div style="text-align:right"><span style="font-size:18px;font-weight:800;color:var(--accent-yellow)">${c.pontos} pts</span><span style="font-size:13px;color:var(--text-muted);margin-left:8px">${tierNome}</span></div>
            </div>`;
        });
        html += '</div>';
    }
    html += '</div>';
    document.getElementById('main-content').innerHTML = html;
};

UI._addClienteFidelidade = function () {
    UI.openModal('➕ Novo Cliente Fidelidade', `
        <div style="padding:12px">
            <label class="form-label">Nome:</label><input class="form-input" id="fid-nome" style="font-size:16px;padding:10px" placeholder="Nome do cliente">
            <label class="form-label" style="margin-top:10px">Telefone:</label><input class="form-input" id="fid-tel" style="font-size:16px;padding:10px" placeholder="(XX) XXXXX-XXXX">
            <button class="btn btn-primary" style="width:100%;margin-top:16px;font-size:16px" onclick="UI._salvarClienteFidelidade()">✅ Cadastrar</button>
        </div>`);
};

UI._salvarClienteFidelidade = function () {
    const nome = document.getElementById('fid-nome')?.value;
    if (!nome) return UI.toast('Digite o nome', 'error');
    if (!dataManager.data.fidelidade) dataManager.data.fidelidade = { clientes: [] };
    dataManager.data.fidelidade.clientes.push({ nome, telefone: document.getElementById('fid-tel')?.value || '', pontos: 0, historico: [] });
    dataManager.saveData();
    UI.closeModal();
    UI.toast('✅ Cliente cadastrado!', 'success');
    UI.renderFidelidade();
};

UI._adicionarPontosFidelidade = function (valorVenda) {
    const pontos = Math.floor(valorVenda / 10);
    if (pontos <= 0) return;
    if (!dataManager.data.fidelidade) dataManager.data.fidelidade = { clientes: [] };
    // Adicionar pontos ao último cliente ou criar genérico
    const clientes = dataManager.data.fidelidade.clientes;
    if (clientes.length > 0) {
        clientes[clientes.length - 1].pontos += pontos;
        clientes[clientes.length - 1].historico.push({ tipo: 'ganho', pontos, data: new Date().toISOString(), valor: valorVenda });
    }
    dataManager.saveData();
};

UI._resgatarPontos = function () {
    if (!dataManager.data.fidelidade) dataManager.data.fidelidade = { clientes: [] };

    // Mesma lógica de unificação do renderFidelidade
    const fidClientes = dataManager.data.fidelidade.clientes || [];
    const sysClientes = (dataManager.data.clientes || []).filter(c => (c.score || 0) > 0);
    const nomesJaIncluidos = new Set(fidClientes.map(c => c.nome.toLowerCase()));
    const clientesUnificados = [...fidClientes];
    sysClientes.forEach(c => {
        if (!nomesJaIncluidos.has(c.nome.toLowerCase())) {
            clientesUnificados.push({ nome: c.nome, telefone: c.telefone || '', pontos: c.score || 0, historico: [] });
        } else {
            const existente = clientesUnificados.find(f => f.nome.toLowerCase() === c.nome.toLowerCase());
            if (existente && (c.score || 0) > existente.pontos) existente.pontos = c.score;
        }
    });

    const elegiveis = clientesUnificados.filter(c => (c.pontos || 0) >= 100);
    if (elegiveis.length === 0) return UI.toast('Nenhum cliente com pontos suficientes (mín 100)', 'info');

    let html = '<div style="display:flex;flex-direction:column;gap:10px;padding:4px">';
    elegiveis.forEach(c => {
        let desconto = 0, tier = '';
        if (c.pontos >= 1000) { desconto = 130; tier = '💎 Diamante'; }
        else if (c.pontos >= 500) { desconto = 60; tier = '🥇 Ouro'; }
        else if (c.pontos >= 300) { desconto = 35; tier = '🥈 Prata'; }
        else { desconto = 10; tier = '🥉 Bronze'; }

        html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:14px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px">
            <div>
                <div style="font-weight:700;font-size:15px">${c.nome}</div>
                <div style="font-size:12px;color:var(--accent-yellow)">${c.pontos} pontos &nbsp;·&nbsp; ${tier}</div>
            </div>
            <button class="btn btn-sm btn-primary" onclick="UI._confirmarResgate('${c.nome}',${desconto},${c.pontos})">🎁 R$ ${desconto} off</button>
        </div>`;
    });
    html += '</div>';
    UI.openModal('🎁 Resgatar Pontos', html);
};

UI._confirmarResgate = function (nome, desconto, pontosAtuais) {
    let pontosUsados = desconto >= 130 ? 1000 : desconto >= 60 ? 500 : desconto >= 35 ? 300 : 100;
    if ((pontosAtuais || 0) < pontosUsados) return UI.toast('Pontos insuficientes', 'error');

    // Tentar atualizar em data.fidelidade.clientes
    if (!dataManager.data.fidelidade) dataManager.data.fidelidade = { clientes: [] };
    let cliente = dataManager.data.fidelidade.clientes.find(c => c.nome.toLowerCase() === nome.toLowerCase());

    // Se não existir lá, criar a partir do cliente do sistema
    if (!cliente) {
        const sysCliente = dataManager.data.clientes.find(c => c.nome.toLowerCase() === nome.toLowerCase());
        if (sysCliente) {
            cliente = { nome: sysCliente.nome, telefone: sysCliente.telefone || '', pontos: sysCliente.score || 0, historico: [] };
            dataManager.data.fidelidade.clientes.push(cliente);
        }
    }

    if (cliente) {
        cliente.pontos = Math.max(0, (cliente.pontos || 0) - pontosUsados);
        if (!cliente.historico) cliente.historico = [];
        cliente.historico.push({ tipo: 'resgate', pontos: pontosUsados, desconto, data: new Date().toISOString() });
    }

    // Atualizar score no cliente do sistema também
    const sysCliente = dataManager.data.clientes.find(c => c.nome.toLowerCase() === nome.toLowerCase());
    if (sysCliente) sysCliente.score = Math.max(0, (sysCliente.score || 0) - pontosUsados);

    dataManager.saveData();
    UI.toast(`🎁 ${nome} resgatou R$ ${desconto} de desconto! (-${pontosUsados} pontos)`, 'success');
    UI.closeModal();
    setTimeout(() => UI.navigate('fidelidade'), 150);
};
